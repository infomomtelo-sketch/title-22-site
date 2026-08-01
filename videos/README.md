# Video assets

This directory serves at `https://title-22.com/videos/`. There are two
different videos here, used by two different pages.

## `/demo/` — the shareable 2-minute demo

- `title22-demo-2min.mp4` — the demo video (888×1920 vertical, 1:57, 30fps,
  h264 High / yuv420p, faststart).
- `title22-demo-poster.jpg` — poster frame (3s, "Every panic." hook), used as
  the video poster and the Open Graph / Twitter share image.
- `title22-demo-2min.es.vtt` — Spanish subtitles.
- `title22-demo-2min.tl.vtt` — Tagalog subtitles.
- `title22-demo-voiceover.m4a` — **retired.** The synthesized narration from
  the previous cut, which is no longer the published video. Kept only as a
  source asset; nothing references it.

**This cut has no spoken narration** — a music bed, with the English captions
burned into the picture. That is why there is no English `.vtt`: a text track
would double up on the burned-in text. The `.es`/`.tl` files translate those
same on-screen captions.

Scene boundaries, measured by OCR of the burned-in captions — the two VTTs are
keyed to these, so re-cutting the footage means re-deriving them:

| Scene | Caption appears |
|-------|-----------------|
| pop quiz | 0:00.75 |
| built by a licensed RCFE administrator | 0:15.375 |
| every Title 22 requirement, tied to CCR code | 0:26.875 |
| see your readiness score | 0:44.25 |
| ask the AI: "Am I ready?" | 1:00.875 |
| digital MAR | 1:14.25 |
| immutable audit log | 1:29.375 |
| start free | 1:43.875 |

The previous cut ran 2:00 with eight evenly spaced 15-second scenes and a
synthesized voiceover. This one is 1:57 with uneven scenes, so none of the old
cue timings carry over.

## `/walkthrough/` — the ten-step instructional tour

- `title22-walkthrough-10step.mp4` — the guided tour (1936×1114 landscape,
  2:20, 30fps, h264 High / yuv420p, faststart).
- `title22-walkthrough-10step-poster.jpg` — poster frame (5s, the
  "The complete walkthrough" title card).
- `title22-walkthrough-10step.es.vtt` — Spanish step labels.
- `title22-walkthrough-10step.tl.vtt` — Tagalog step labels.

**This video has no spoken narration** — a music bed plus step labels burned
into the picture in English. The `.es`/`.tl` VTTs therefore translate the
on-screen step labels rather than any dialogue, which is why the player
defaults to labels off: English is already in the picture.

Source was a 1126×2436 HEVC (Main 10) QuickTime screen recording with a -90°
rotation flag, 251px of black pillarbox on each side, and an iOS
screen-recording indicator sitting in the right bar. The published file is
rotation-baked, cropped to the content (`crop=1936:1114:250:0`, which also
removes the indicator), converted to 8-bit H.264 for browser support, and
dropped from 60fps to 30.

Step boundaries, measured by OCR of the burned-in labels — the chapter list
and both VTTs are keyed to these, so re-cutting the footage means re-deriving
them:

| Step | Label appears |
|------|---------------|
| intro — a guided tour | 0:01.25 |
| 1 — create your account | 0:11.375 |
| 2 — add your facility details | 0:22.125 |
| 3 — your menu | 0:35.000 |
| 4 — compliance checklist | 0:43.125 |
| 5 — staff & training records | 0:58.375 |
| 6 — residents & ISP files | 1:10.000 |
| 7 — digital MAR | 1:21.875 |
| 8 — your readiness score | 1:32.375 |
| 9 — ask the AI anything | 1:42.125 |
| 10 — audit log & DSS export | 1:53.500 |
| outro — start free | 2:05.500 |

The chapter buttons target a few tenths *before* each of these, so a click
lands on the transition into the step rather than after it.
