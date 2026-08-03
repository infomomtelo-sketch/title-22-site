/**
 * Cloudflare Pages Function — POST /api/ai/generate-curriculum
 *
 * Takes a source asset (a public URL, pasted text, or an uploaded PDF/TXT/MD)
 * and compiles it into a multi-level live-classroom curriculum matching the
 * 3-phase model: lecture -> situational drill -> regulatory enforcement.
 *
 * Requires the ANTHROPIC_API_KEY secret to be set on the Pages project
 * (Settings -> Environment variables -> Add secret, for both Production and Preview).
 *
 * The response is newline-delimited JSON so the connection produces bytes
 * throughout generation rather than sitting idle until the model finishes.
 */

const MODEL = "claude-opus-5";
const ANTHROPIC_VERSION = "2023-06-01";

const MAX_SOURCE_CHARS = 250_000;
const MAX_FETCH_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;

const MIN_LEVELS = 3;
const MAX_LEVELS = 8;

/* Routes the model is allowed to hand back. Constraining this to an enum is
   what stops it inventing plausible-looking paths that 404 in the app. */
const APP_ROUTES = [
  "/dashboard/staff-compliance",
  "/dashboard/mar-logs",
  "/dashboard/incident-generator",
  "/dashboard/residents",
  "/dashboard/medications",
  "/dashboard/training-records",
  "/dashboard/facility-documents",
  "/dashboard/inspection-prep",
];

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) {
    return errorResponse(
      500,
      "The curriculum engine is not configured yet — ANTHROPIC_API_KEY is missing on this deployment.",
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Request body must be JSON.");
  }

  const levelCount = clamp(parseInt(body.levels, 10) || 5, MIN_LEVELS, MAX_LEVELS);
  const sourceType = body.sourceType;

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Kick the work off without awaiting so headers flush immediately.
  handleGeneration({ body, sourceType, levelCount, env, writer }).catch(async (err) => {
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

async function handleGeneration({ body, sourceType, levelCount, env, writer }) {
  let userContent;
  let sourceLabel;

  if (sourceType === "url") {
    const url = normalizeUrl(body.url);
    sourceLabel = url;
    await emit(writer, { type: "status", message: `Retrieving ${url}` });
    const text = await fetchAsText(url);
    await emit(writer, {
      type: "status",
      message: `Read ${text.length.toLocaleString()} characters of source text.`,
    });
    userContent = [{ type: "text", text: sourcePrompt(sourceLabel, text, levelCount) }];
  } else if (sourceType === "text") {
    const text = String(body.text || "").trim();
    if (text.length < 200) {
      throw new HttpError(
        400,
        "Paste at least a couple of paragraphs — there isn't enough source text here to build a curriculum from.",
      );
    }
    sourceLabel = "Pasted source text";
    userContent = [
      { type: "text", text: sourcePrompt(sourceLabel, truncate(text), levelCount) },
    ];
  } else if (sourceType === "file") {
    const { fileName, mediaType, data } = body;
    if (!data) throw new HttpError(400, "No file contents were received.");
    if (approxBytes(data) > MAX_UPLOAD_BYTES) {
      throw new HttpError(413, "That file is larger than the 12 MB upload limit.");
    }
    sourceLabel = fileName || "Uploaded document";
    await emit(writer, { type: "status", message: `Parsing ${sourceLabel}` });

    if (mediaType === "application/pdf") {
      // PDFs go to the model as a document block so its own extraction runs.
      userContent = [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
        { type: "text", text: sourcePrompt(sourceLabel, null, levelCount) },
      ];
    } else {
      const text = truncate(decodeBase64Utf8(data));
      if (text.trim().length < 200) {
        throw new HttpError(400, "That file didn't contain enough readable text.");
      }
      userContent = [{ type: "text", text: sourcePrompt(sourceLabel, text, levelCount) }];
    }
  } else {
    throw new HttpError(400, "sourceType must be one of: url, text, file.");
  }

  await emit(writer, {
    type: "status",
    message: "Analyzing the material and structuring progressive tiers…",
  });

  const curriculum = await callAnthropic({ env, userContent, levelCount, writer });
  curriculum.sourceLabel = sourceLabel;

  await emit(writer, { type: "result", data: curriculum });
  await writer.close();
}

/* ---------------------------------------------------------------- prompting */

function systemPrompt(levelCount) {
  return `You are a universal AI compliance instructor. You build live-classroom training from raw source material for Title22, a compliance platform used by California RCFE (Residential Care Facility for the Elderly) administrators.

Analyze the source material you are given and compile a progressive, multi-level curriculum of exactly ${levelCount} levels. Level 1 covers the most foundational concept in the source; each subsequent level builds on the ones before it and increases in operational difficulty.

Each level has three phases:
- Phase 1 is a conversational lecture script — what an instructor would actually say out loud to teach this concept. Ground it in the real work of running a facility. 150-300 words.
- Phase 2 is one high-stakes situational multiple-choice question that applies the level's concept to a realistic administrative decision. Exactly four options, exactly one correct. Distractors must be genuinely plausible choices a real administrator might make, not obvious throwaways. Every option carries feedback explaining why it is right, or specifically what it costs the facility — regulatory exposure, liability, or citation risk.
- Phase 3 links the concept to the governing regulation.

CITATION ACCURACY IS NON-NEGOTIABLE. Never invent a regulation number, section code, or quoted legal text.
- Set citationFoundInSource to true ONLY when the citation code and the quoted lawSnippet both appear literally in the source material. In that case lawSnippet must be an exact quote from the source.
- If the source does not state a specific code, set citationFoundInSource to false, put your best-supported general reference in citationCode (or the string "Not stated in source"), and write lawSnippet as a plain-language summary of the standard the source describes rather than a fabricated quotation.
- Never present a summary as if it were quoted regulatory text.

appTargetRoute must be the single route inside Title22.app where an administrator would go to actually fix or document this issue. Choose only from the allowed values.

Write for practitioners: direct, concrete, no filler and no throat-clearing.`;
}

function sourcePrompt(label, text, levelCount) {
  const header = `Source asset: ${label}\nBuild a ${levelCount}-level curriculum from the material below.`;
  if (text === null) {
    return `${header}\n\nThe material is in the attached document.`;
  }
  return `${header}\n\n--- BEGIN SOURCE MATERIAL ---\n${text}\n--- END SOURCE MATERIAL ---`;
}

const CURRICULUM_SCHEMA = {
  type: "object",
  properties: {
    subject: {
      type: "string",
      description: "Short professional name for the subject this curriculum teaches.",
    },
    sourceSummary: {
      type: "string",
      description: "Two or three sentences describing what the source material covers.",
    },
    levels: {
      type: "array",
      description: "Progressive levels, ordered from most foundational to most advanced.",
      items: {
        type: "object",
        properties: {
          level: { type: "integer" },
          topicName: { type: "string" },
          phase1_lecture: { type: "string" },
          phase2_drill: {
            type: "object",
            properties: {
              questionText: { type: "string" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    isCorrect: { type: "boolean" },
                    feedback: { type: "string" },
                  },
                  required: ["text", "isCorrect", "feedback"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questionText", "options"],
            additionalProperties: false,
          },
          phase3_enforcement: {
            type: "object",
            properties: {
              regulatoryBody: { type: "string" },
              citationCode: { type: "string" },
              lawSnippet: { type: "string" },
              citationFoundInSource: {
                type: "boolean",
                description:
                  "True only if this code and snippet appear literally in the source material.",
              },
              appTargetRoute: { type: "string", enum: APP_ROUTES },
            },
            required: [
              "regulatoryBody",
              "citationCode",
              "lawSnippet",
              "citationFoundInSource",
              "appTargetRoute",
            ],
            additionalProperties: false,
          },
        },
        required: ["level", "topicName", "phase1_lecture", "phase2_drill", "phase3_enforcement"],
        additionalProperties: false,
      },
    },
  },
  required: ["subject", "sourceSummary", "levels"],
  additionalProperties: false,
};

/* ------------------------------------------------------------------- model */

async function callAnthropic({ env, userContent, levelCount, writer }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 32000,
      stream: true,
      system: systemPrompt(levelCount),
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: CURRICULUM_SCHEMA },
      },
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new HttpError(
      response.status === 401 ? 500 : 502,
      response.status === 401
        ? "The curriculum engine's API key was rejected."
        : `The model request failed (${response.status}). ${summarizeApiError(detail)}`,
    );
  }

  let json = "";
  let stopReason = null;
  let lastPing = 0;

  for await (const event of readSse(response.body)) {
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
      json += event.delta.text;
      if (json.length - lastPing > 1200) {
        lastPing = json.length;
        await emit(writer, { type: "progress", chars: json.length });
      }
    } else if (event.type === "message_delta" && event.delta?.stop_reason) {
      stopReason = event.delta.stop_reason;
    } else if (event.type === "error") {
      throw new HttpError(502, summarizeApiError(JSON.stringify(event.error || {})));
    }
  }

  if (stopReason === "refusal") {
    throw new HttpError(
      422,
      "The model declined to build a curriculum from this material. Try a different source document.",
    );
  }
  if (stopReason === "max_tokens") {
    throw new HttpError(
      502,
      "The curriculum ran past the output limit before finishing. Try fewer levels or a shorter source.",
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new HttpError(502, "The model returned output that could not be parsed as a curriculum.");
  }

  return validateCurriculum(parsed);
}

/* Structured outputs guarantee the schema, but the schema cannot express
   "exactly one correct option" — so that invariant is checked here. */
function validateCurriculum(data) {
  if (!Array.isArray(data.levels) || data.levels.length === 0) {
    throw new HttpError(502, "The model returned a curriculum with no levels.");
  }
  for (const level of data.levels) {
    const options = level.phase2_drill?.options;
    if (!Array.isArray(options) || options.length < 2) {
      throw new HttpError(502, `Level ${level.level} came back without a usable drill question.`);
    }
    if (options.filter((o) => o.isCorrect).length !== 1) {
      throw new HttpError(
        502,
        `Level ${level.level} came back without exactly one correct answer.`,
      );
    }
  }
  return data;
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
          /* keep-alive or partial frame — ignore */
        }
      }
    }
  }
}

/* ------------------------------------------------------------ source intake */

function normalizeUrl(raw) {
  let url;
  try {
    url = new URL(String(raw || "").trim());
  } catch {
    throw new HttpError(400, "That doesn't look like a valid URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new HttpError(400, "Only http and https URLs can be ingested.");
  }
  if (isPrivateHost(url.hostname)) {
    throw new HttpError(400, "That URL points at a private or internal address.");
  }
  return url.toString();
}

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd")) return true;
  if (host === "metadata.google.internal") return true;

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return false;
  const [a, b] = v4.slice(1).map(Number);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

async function fetchAsText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // Identify the crawler honestly so site operators can see who called.
        "user-agent": "Title22-CurriculumBot/1.0 (+https://title-22.com/ai-instructor/)",
        accept: "text/html,text/plain,application/xhtml+xml",
      },
    });
  } catch (err) {
    throw new HttpError(
      502,
      err.name === "AbortError"
        ? "That URL took too long to respond."
        : "That URL could not be reached.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new HttpError(502, `That URL returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (/pdf|octet-stream|zip|image\//i.test(contentType)) {
    throw new HttpError(
      415,
      "That URL serves a binary file. Download it and use the upload tab instead.",
    );
  }

  const buffer = await readCapped(response.body, MAX_FETCH_BYTES);
  const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const text = htmlToText(html);

  if (text.length < 200) {
    throw new HttpError(
      422,
      "That page didn't yield enough readable text — it may be script-rendered. Paste the text instead.",
    );
  }
  return truncate(text);
}

async function readCapped(bodyStream, maxBytes) {
  const reader = bodyStream.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(Math.min(total, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function htmlToText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t ]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/* ----------------------------------------------------------------- helpers */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function truncate(text) {
  return text.length > MAX_SOURCE_CHARS ? text.slice(0, MAX_SOURCE_CHARS) : text;
}

function approxBytes(base64) {
  return Math.floor((base64.length * 3) / 4);
}

function decodeBase64Utf8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function summarizeApiError(detail) {
  try {
    const parsed = JSON.parse(detail);
    return parsed?.error?.message || "";
  } catch {
    return "";
  }
}

function readableError(err) {
  if (err instanceof HttpError) return err.message;
  return "Something went wrong while building the curriculum. Please try again.";
}

async function emit(writer, payload) {
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(JSON.stringify(payload) + "\n"));
}

function errorResponse(status, message) {
  return new Response(JSON.stringify({ type: "error", message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
