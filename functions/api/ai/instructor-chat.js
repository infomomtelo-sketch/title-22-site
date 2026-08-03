/**
 * Cloudflare Pages Function — POST /api/ai/instructor-chat
 *
 * The live half of the AI instructor. Where generate-curriculum.js produces a
 * structured class in one shot, this holds an ongoing conversation: the learner
 * asks whatever they want and the instructor answers, staying grounded in the
 * source material the class was built from.
 *
 * The client holds the transcript and the source, and re-sends both each turn —
 * the Function keeps no state. That would be wasteful except the source and the
 * system prompt are marked with cache_control, so from the second turn onward
 * the shared prefix is served from Anthropic's prompt cache at a fraction of
 * the input price.
 *
 * Replies stream back as newline-delimited JSON so text appears as it is written.
 */

const MODEL = "claude-opus-5";
const ANTHROPIC_VERSION = "2023-06-01";

const MAX_GROUNDING_CHARS = 120_000;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_TURNS = 40;
const MAX_QUESTION_CHARS = 4_000;

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) {
    return errorResponse(
      500,
      "The instructor is not configured yet — ANTHROPIC_API_KEY is missing on this deployment.",
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Request body must be JSON.");
  }

  if (env.INSTRUCTOR_ACCESS_CODE && !codesMatch(body.accessCode, env.INSTRUCTOR_ACCESS_CODE)) {
    return errorResponse(
      401,
      "This tool needs the access link issued with your Title22 trainer account.",
    );
  }

  const turns = Array.isArray(body.messages) ? body.messages : [];
  if (!turns.length) return errorResponse(400, "No question was sent.");
  if (turns.length > MAX_TURNS) {
    return errorResponse(
      400,
      "This conversation has run long. Start a new one to keep the instructor sharp.",
    );
  }

  const messages = [];
  for (const turn of turns) {
    const role = turn && turn.role === "assistant" ? "assistant" : "user";
    const text = String((turn && turn.content) || "").slice(0, MAX_QUESTION_CHARS).trim();
    if (!text) continue;
    messages.push({ role, content: [{ type: "text", text }] });
  }
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return errorResponse(400, "The conversation must end with a question.");
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  converse({ body, messages, env, writer }).catch(async (err) => {
    await emit(writer, { type: "error", message: readableError(err) });
    await writer.close().catch(() => {});
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function converse({ body, messages, env, writer }) {
  /* The grounding block goes first and carries the cache breakpoint, so every
     turn after the first reuses it instead of re-paying for the whole source. */
  const grounding = [];

  const sourceText = String(body.sourceText || "").slice(0, MAX_GROUNDING_CHARS);
  if (body.pdfData) {
    if (approxBytes(body.pdfData) > MAX_UPLOAD_BYTES) {
      throw new HttpError(413, "That file is larger than the 12 MB limit.");
    }
    grounding.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: body.pdfData },
    });
  }
  if (sourceText) {
    grounding.push({
      type: "text",
      text: `--- BEGIN SOURCE MATERIAL (${body.sourceLabel || "supplied by the learner"}) ---\n${sourceText}\n--- END SOURCE MATERIAL ---`,
    });
  }
  if (grounding.length) {
    grounding[grounding.length - 1].cache_control = { type: "ephemeral" };
    messages[0] = {
      role: "user",
      content: [...grounding, ...messages[0].content],
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      stream: true,
      system: systemPrompt(body.subject),
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new HttpError(
      response.status === 401 ? 500 : 502,
      response.status === 401
        ? "The instructor's API key was rejected."
        : `The instructor could not respond (${response.status}). ${summarizeApiError(detail)}`,
    );
  }

  let stopReason = null;
  let wrote = false;

  for await (const event of readSse(response.body)) {
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
      wrote = true;
      await emit(writer, { type: "delta", text: event.delta.text });
    } else if (event.type === "message_delta" && event.delta?.stop_reason) {
      stopReason = event.delta.stop_reason;
    } else if (event.type === "error") {
      throw new HttpError(502, summarizeApiError(JSON.stringify(event.error || {})));
    }
  }

  if (stopReason === "refusal") {
    throw new HttpError(422, "The instructor declined to answer that one.");
  }
  if (!wrote) {
    throw new HttpError(502, "The instructor returned an empty answer. Try rephrasing.");
  }

  await emit(writer, { type: "done", truncated: stopReason === "max_tokens" });
  await writer.close();
}

function systemPrompt(subject) {
  return `You are a live subject-matter instructor holding a conversation with a learner. You can teach ANY professional subject — compliance, clinical practice, trades and safety, software, finance, operations, hospitality, whatever the material covers.${
    subject ? ` This session is about: ${subject}.` : ""
  }

You have been given the source material the learner is studying. Teach from it.

LENGTH. Two to four sentences of substance, then your closing line. You are talking in a chat panel, not writing a handout — a wall of text is the fastest way to lose the room. Go longer ONLY when the learner asks you to walk through, explain in depth, or teach a procedure step by step, and even then keep it tight.

CLOSE EVERY REPLY WITH ONE OPEN QUESTION. Not "let me know if you have questions" — a real one that moves the learning forward: what they are about to do with this, where their facility currently sits, which part is giving them trouble. Vary it every single time. The same closing twice in a conversation reads as a script.

Where it fits naturally, carry that closing question on a short piece of practical advice, or an honest word about the work itself. This matters more in caregiving than in most fields. The people you are teaching are often exhausted, under-recognised, and carrying responsibility for other people's lives on a thin staffing budget. One earned, specific sentence — that the instinct they just showed is the right one, that the thing they are worried about is genuinely hard, that getting this documented protects them and not just the facility — belongs in good instruction. Earn it or leave it out. Never manufacture encouragement, never use exclamation marks, never praise them for asking a question, and never say anything that would sound hollow to someone who just worked a double.

- Lead with the answer. Never open with a preamble about what you are, what you can do, or what you don't have. If something is missing, mention it in one short sentence AFTER answering, not before.
- Say each caveat ONCE PER CONVERSATION. If you have already told the learner you have no source material, or that you are an AI, or that they should verify something against the official text, do not say it again — they heard you. Repeating it every turn is the fastest way to become noise they scroll past.
- Ask once for the source material if it would help. Do not ask again — if they wanted to paste it, they would have. Your closing question should be about their work, not about your inputs.
- Answer the question in front of you. Do not list unrelated meanings a term might have in other industries when the learner's field is already obvious from the conversation.
- Do not steer back to an earlier topic unless asked. If they change subject, follow them.
- Formal and professional in register. You are an instructor addressing a practitioner, not a friend. No slang, no emoji, no "great question", no cheerleading. Formal does not mean cold — a measured, human remark about hard work is professional; gushing is not.
- Plain declarative sentences and concrete examples from the learner's actual work. Formal does not mean padded — it means precise.
- When the source covers the answer, teach it and say where in the material it comes from.
- When the source does NOT cover it, say so plainly, then answer from general professional knowledge and make clear you have stepped outside the material.
- NEVER invent a regulation number, section code, standard number, or quotation. If you don't have the exact citation from the source, say the source doesn't state one rather than producing a plausible-looking number. A learner may repeat what you say to an inspector or an auditor.
- If the learner is heading toward a mistake that would cost them, tell them directly.
- Questions the learner asks that the material contradicts: correct them, kindly and without hedging.

Never use markdown headers, bullet characters, or bold in your replies — this renders as plain text in a chat panel. Write in prose paragraphs.`;
}

/* ------------------------------------------------------------------ shared */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function* readSse(bodyStream) {
  const reader = bodyStream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          yield JSON.parse(payload);
        } catch {
          /* keep-alive or partial frame */
        }
      }
    }
  }
}

function approxBytes(base64) {
  return Math.floor((base64.length * 3) / 4);
}

function codesMatch(supplied, expected) {
  const a = String(supplied == null ? "" : supplied);
  const b = String(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < b.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function summarizeApiError(detail) {
  try {
    return JSON.parse(detail)?.error?.message || "";
  } catch {
    return "";
  }
}

function readableError(err) {
  if (err instanceof HttpError) return err.message;
  return "Something went wrong reaching the instructor. Please try again.";
}

async function emit(writer, payload) {
  await writer.write(new TextEncoder().encode(JSON.stringify(payload) + "\n"));
}

function errorResponse(status, message) {
  return new Response(JSON.stringify({ type: "error", message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
