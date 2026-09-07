# Video assets

This directory serves at `https://title-22.com/videos/`.

## What is here

- `title22-trainer-pitch.mp4` — the trainer-focused clip in the "For CE &
  ICTP trainers" section on `/demo/`. 23.6s, 1080×1920, **silent — no audio
  track**, so it needs no captions and makes no spoken claims. It is
  classroom footage with title cards; it shows no product screens, no
  resident names and no medication, which is why it survived the cull below.
- `title22-demo-poster.jpg` — a plain title card ("Title22 — guided by a
  certified RCFE administrator"). It began life as the poster for the demo
  video and is now the poster for the trainer clip. Nothing in it is a
  product screen, so it stays.

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
