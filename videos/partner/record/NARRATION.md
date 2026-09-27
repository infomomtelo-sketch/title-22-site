# Narration for the partner explainer

The video is **voiced** (AI voice, Kokoro `af_heart`, the same voice as the
guided tour, partner tour and how-to clips). The script is the English `cap`
field of each slide in `slides.js`: what the voice says is exactly what the
English captions show.

Slide durations in `slides.js` were lengthened where the spoken line needed
more room, so the picture, the captions and the voice all share one timing.

## Rebuilding after a wording change

1. Edit the `cap` line (and `capEs` / `capFil`) in `slides.js`.
2. Synthesize each English `cap` with Kokoro, 0.35 s lead-in, and set that
   slide's `secs` to at least lead + voice + 0.8 s.
3. `node make.js` (renders the picture and all three .vtt files).
4. Mux the concatenated voice track without re-encoding the picture:

```sh
ffmpeg -i title22-partner-explainer.mp4 -i narration.wav -map 0:v -map 1:a \
       -c:v copy -af "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=7" \
       -c:a aac -b:a 128k -ar 48000 -shortest -movflags +faststart out.mp4
```

## Two things not to say

- Clicks are not tracked. Only signups are.
- Commission is not paid automatically. Eli pays it directly.

Do not quote anyone a rate. Twenty percent is the default; the real rate is
agreed per partner. The standard trial is 30 days; a partner code usually
gives 90.
