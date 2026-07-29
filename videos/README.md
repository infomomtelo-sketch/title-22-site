# Video assets

This directory serves at `https://title-22.com/videos/`. Referenced by `/demo/`.

## Already here

- `title22-demo-voiceover.m4a` — generated 2:00 voiceover narration
  (segments timed at 0:00 intro · 0:14 checklist · 0:36 readiness score ·
  0:58 AI assistant · 1:20 MAR · 1:40 audit log · 1:52 outro)
- `title22-demo-2min.vtt` — captions, cue timings match the voiceover exactly.
  Loaded by the demo page's `<track>` element (toggleable in the player).

## Still to drop in

- `title22-demo-2min.mp4` — 9:16 vertical, ~2 min, 1080×1920, h264.
  **Mux the voiceover in first** so the published file has sound:

  ```
  ffmpeg -i title22-demo-2min-silent.mp4 -i title22-demo-voiceover.m4a \
    -map 0:v -map 1:a -c:v copy -c:a copy -shortest title22-demo-2min.mp4
  ```

  (Or drop the silent file here and ask Claude to mux it.)

- `title22-demo-poster.jpg` — poster frame (~2s into the video), used as the
  video poster and the Open Graph / Twitter share image.

If the video's scene changes don't land near the narration times above, ask
Claude to re-time the segments — the generator script places each segment at a
configurable start time.
