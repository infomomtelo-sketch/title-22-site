# Video assets

This directory serves at `https://title-22.com/videos/`. Referenced by `/demo/`.

- `title22-demo-2min.mp4` — the real demo video (1080×1920, 2:00, h264) you
  provided, with narration + a generated background soundtrack muxed in as
  a single AAC track.
- `title22-demo-poster.jpg` — poster frame at 2s, used as the video poster and
  the Open Graph / Twitter share image.
- `title22-demo-voiceover.m4a` — the standalone narration track (no music),
  kept so audio can be rebuilt if the footage is re-exported.
- `title22-demo-mix.m4a` — narration + soundtrack, already mixed (this is
  what's muxed into the MP4). The soundtrack is a simple generated pad chord
  progression (C–Am–F–G), sidechain-ducked under the voice so it drops out
  automatically whenever the narrator is speaking and swells slightly in the
  gaps. Mixed at roughly -19dB average, limited to avoid clipping.
- `captions/en.vtt`, `captions/es.vtt`, `captions/tl.vtt` — caption tracks,
  cue timings matched to the voiceover. The demo page has an
  English / Español / Tagalog / Off toggle (English shown by default).
  **The Spanish and Tagalog captions are machine-translated — have a native
  speaker review them before this page goes live**, especially since this is
  a regulatory compliance product.

Narration timing (eight 15-second scenes): 0:00 panic intro · 0:15 meet
Title22 · 0:30 checklist · 0:45 readiness score · 1:00 AI assistant ·
1:15 digital MAR · 1:30 audit log · 1:45 outro.

## Still pending

- `title22-trainer-pitch.mp4` — a ~30s trainer-focused pitch for the
  "For CE & ICTP trainers" section on `/demo/`. The section is built and
  styled, but it no longer references this file: rather than 404 on every
  page load, the frame shows `title22-demo-poster.jpg` behind a "Trainer
  pitch coming soon" label. When the real video lands, drop it here and swap
  that block back to a `<video src="/videos/title22-trainer-pitch.mp4">` — an
  HTML comment right above it in `demo/index.html` marks the spot. Add a
  dedicated poster frame at the same time if one is wanted.

To change the narration (wording, voice, or timing) or the translations, ask
Claude — the generator script synthesizes each segment and rebuilds all three
VTT files to match.
