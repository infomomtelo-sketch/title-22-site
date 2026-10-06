# Video assets

This directory serves at `https://title-22.com/videos/`.

## What is here

- `title22-story-30s.mp4` (1920×1080) + `title22-story-30s-vertical.mp4` (1080×1920)
  + `-poster.jpg` + `.en.vtt` — "Title22 in 30 seconds", the homepage hero and the
  first card on `/videos/`; both files are offered on `/partner-kit/` with a ready
  caption. 30 s, H.264 High + AAC, **narrated (AI voice, Kokoro `af_heart`, run
  locally)**, captions burned into the picture (the .vtt is for platforms that ask
  for one, so it is not attached as a track — that would show them twice).
  - **What it shows:** an animated story, not app footage. Drawn people, a door,
    then three phone screens styled after the app: staff files with invented
    names, the DSS readiness checklist on sample dates, and Tello's briefing.
  - **No resident data, no medications.** The checklist's sixth item is the
    incident log (LIC 624), not resident records.
  - Built outside this repo (Playwright frames + ffmpeg + libass); the words are
    the captions in the .vtt.

- `howto/docs.mp4` + `docs-poster.jpg` + `docs.en.vtt`: "Scan to fill: a staff member's
  documents", on `/videos/#howto`. 73 s, 1080×1920, H.264 High + AAC,
  **narrated (AI voice, Kokoro `af_heart`, run locally)**, with captions in
  their own band under the app and in the .vtt.
  - **What it shows:** the real app, signed in to an invented home on an
    in-memory database, as someone adds Maria Lopez (invented). It walks
    through scanning a CPR card (the card is drawn by the recorder and
    stamped SAMPLE), typing the TB dates and uploading the paper, uploading
    Live Scan, then Save.
  - **No resident data.** TB is never scanned, in the clip or the app.
  - **The scan appears only once runp8-care #155 (scan on for staff
    certificates) is live.** Re-record if the staff modal changes.
  - Rebuild: `videos/howto/record/`, in three steps:
    1. `voice.py` (Kokoro model files from the kokoro-onnx GitHub release),
    2. `record.js` (Playwright),
    3. `build.js` (an ffmpeg with libx264 and aac, e.g. `pip install imageio-ffmpeg`).
    
    The words live in `record/script.js`, and nothing in them may state a
    requirement.

- `title22-trainer-pitch.mp4` + `.en.vtt` — the trainer-focused clip in the
  "For CE & ICTP trainers" section on `/demo/`. 34 s, 1080×1920, **narrated
  (AI voice)** with English captions. The first list card was changed from
  "Keeping resident records up to date" to "Keeping staff records up to date",
  because Title22 Lite holds no resident records. It is
  classroom footage with title cards; it shows no product screens, no
  resident names and no medication, which is why it survived the cull below.
- `title22-demo-poster.jpg` — a plain title card ("Title22 — guided by a
  certified RCFE administrator"). It began life as the poster for the demo
  video and is now the poster for the trainer clip. Nothing in it is a
  product screen, so it stays.

- `title22-30-day-proof.mp4` + `-poster.png` — the 30-Day Proof on
  `/pilot/`. 53 s, 1280×720, H.264 Baseline, **narrated (AI voice)**, captions
  burned into the picture plus `title22-30-day-proof.en.vtt` (the page carries
  the transcript). Voiced after recording: re-recording with record.js gives a
  silent file that needs voicing again. Recorded 2026-09-23 by
  `pilot/record/record.js` from the real app's sandbox on the tour's fixture
  set: invented staff, no resident data, the sandbox's own computed summary —
  no AI reply is invented. Re-record: `cd videos/pilot/record &&
  MODULES=<dir with h264-mp4-encoder, pngjs> node record.js video`, then
  `node ../../tour/record/faststart.js out/title22-30-day-proof.mp4`.

## What was removed, and why

Every narrated recording toured a product that no longer exists. Title22 Lite
holds no resident records, no medications and no MAR, so a video showing them
is not stale marketing — it is a claim we cannot make. All of these were
deleted rather than annotated:

- `title22-demo-2min.mp4` — narrated "Medications live in a digital MAR" at
  1:16.
- `title22-demo-voiceover.m4a`, `title22-demo-mix.m4a` — the narration and
  mixed audio for that video. Kept only to rebuild it; there is nothing left
  to rebuild.
- `title22-walkthrough.mp4` + poster (3:27) — a Residents tab, a Medication
  Administration Record, a "Log Medication" modal with named residents and a
  named drug and dose, and narration about doses being refused or held. A
  second copy sat at the repo root and went with it.
- `title22-classroom-setup.mp4` + poster (2:19) — the ten-step tour. Step 6
  was a Residents grid with six named residents, room numbers and 601/602/ISP
  badges; step 7 was a Digital MAR listing five residents by room with drug
  and dose; the audit log showed "Signed MAR · Room 7" and "Updated ISP ·
  Resident Ruth A.".

`/walkthrough/` and `/for-trainers/` now carry the same ground as scrollable,
animated blocks built from the `.show-card` / `.viz` vocabulary in
`assets/style.css` — no video file, nothing to re-record when the product
changes again.

## If a replacement is ever shot

Anything recorded from the live app is safe by construction now: `showMAR`
is false and the PHI tabs do not render. The line to hold is the one in
`CLAUDE.md` — no resident records, no medications, no MAR, and the product
never states a Title 22 requirement as settled fact.
