# Video assets

This directory serves at `https://title-22.com/videos/`. There are two
different videos here, used by two different pages.

## `/demo/` — the shareable 2-minute demo

- `title22-demo-2min.mp4` — the demo video (1080×1920 vertical, 2:00, h264)
  with the generated voiceover muxed in as an AAC track.
- `title22-demo-poster.jpg` — poster frame (2s, "Every panic." hook), used as
  the video poster and the Open Graph / Twitter share image.
- `title22-demo-2min.vtt` — English captions; cue timings match the voiceover.
- `title22-demo-2min.es.vtt` — Spanish subtitles, same cue timings.
- `title22-demo-2min.tl.vtt` — Tagalog subtitles, same cue timings.
- `title22-demo-voiceover.m4a` — the standalone narration track, kept so the
  audio can be re-muxed if the footage is re-exported.

This one has spoken English narration. Spanish and Tagalog are subtitle
tracks, not dubs. All three VTTs share identical cue boundaries, so re-timing
the English file means re-timing the other two to match.

Narration timing (eight 15-second scenes): 0:00 panic intro · 0:15 meet
Title22 · 0:30 checklist · 0:45 readiness score · 1:00 AI assistant ·
1:15 digital MAR · 1:30 audit log · 1:45 outro.

To change the narration (wording, voice, or timing), ask Claude — the
generator script synthesizes each segment and rebuilds the VTT to match.

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
