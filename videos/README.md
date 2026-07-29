# Video assets

This directory serves at `https://title-22.com/videos/`. Referenced by `/demo/`.

- `title22-demo-2min.mp4` — the demo video (1080×1920, 2:00, h264) with the
  generated voiceover muxed in as an AAC track.
- `title22-demo-poster.jpg` — poster frame (2s, "Every panic." hook), used as
  the video poster and the Open Graph / Twitter share image.
- `title22-demo-2min.vtt` — captions; cue timings match the voiceover.
  Loaded by the demo page's `<track>` element (toggleable in the player).
- `title22-demo-voiceover.m4a` — the standalone narration track, kept so the
  audio can be re-muxed if the footage is re-exported.

Narration timing (eight 15-second scenes): 0:00 panic intro · 0:15 meet
Title22 · 0:30 checklist · 0:45 readiness score · 1:00 AI assistant ·
1:15 digital MAR · 1:30 audit log · 1:45 outro.

To change the narration (wording, voice, or timing), ask Claude — the
generator script synthesizes each segment and rebuilds the VTT to match.
