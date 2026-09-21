# Partner / affiliate tour recording

A phone screen recording of the affiliate guided tour, made 2026-09-21, with
captions in English, Spanish and Filipino.

| file | what |
|---|---|
| `title22-partner-tour.mp4` | 1.4 MB, 540×1096, H.264 Constrained Baseline, 30 fps, faststart |
| `title22-partner-tour.en.vtt` | English captions, 14 cues |
| `title22-partner-tour.es.vtt` | Spanish, same timings |
| `title22-partner-tour.fil.vtt` | Filipino, same timings |

The original `.mov` is not in the repo — it is 27.6 MB of 10-bit HDR HEVC.

## It has no sound, and that is measured

The source carries an AAC track, but it is digital silence: mean and max volume
both **−91 dB** across all 5,746,560 samples. There is nothing to transcribe.
The captions carry the whole thing, and cue 0 says so on screen in the first
four seconds — the same pattern as the guided-tour video.

If narration is ever recorded for this, delete cue 0 from all three files and
leave the rest alone; they are timed to this edit.

## Where the wording comes from

The seven step titles and bodies are taken from `tourSteps()` in the app's
`index.html`, **not** transcribed from the screen, so they match the product
exactly. If the tour copy changes, re-derive this file from the source rather
than editing it by hand.

## Where the timings come from

Scene-cut detection on the recording. Every step boundary except one lands on a
measured cut, because each step switches tab:

| cut | boundary |
|---|---|
| 11.29s | step 1 appears |
| — | step 1 → 2 (see below) |
| 17.02s | step 2 → 3 |
| 20.15s | step 3 → 4 |
| 23.12s | step 4 → 5 |
| 26.65s | step 5 → 6 |
| 30.05s | step 6 → 7 |
| 35.05s | tour closes |

**The exception is step 1 → 2.** Both sit on the Partners tab and only the
dialog text changes, which is too small a change to register as a cut. That
boundary was pinned by reading the step counter at 0.8s intervals: "1 of 7" at
13.6s, "2 of 7" at 14.4s. The cue turns at 14.0s.

Tail timings after 35s are accurate to about a second where no cut exists.

## The HDR conversion

The source is `yuv420p10le` in bt2020nc / PQ — a 10-bit HDR capture. Converting
it with a plain `format=yuv420p` produces a washed-out, dark picture, because
that throws away the transfer curve instead of mapping it. The conversion
tonemaps properly:

```sh
ffmpeg -i <source>.mov \
  -vf "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,scale=540:-2,fps=30" \
  -c:v libx264 -profile:v baseline -level 3.1 -preset slow -crf 26 \
  -movflags +faststart -an title22-partner-tour.mp4
```

`-an` drops the silent audio track. Baseline profile is the one every iPhone
decodes, and `+faststart` puts `moov` ahead of `mdat` so playback starts before
the file has finished downloading (verified: `ftyp`, then `moov`, then `mdat`).

## No PHI

The recording is a Lite account with an empty facility. Checked across 26
sampled frames covering the whole 65 seconds: no resident names, no MAR, no
medication list, no daily log. The user menu appears three times and carries no
Residents, MAR, Medications or Daily-log entry, which is Lite mode visibly on;
the Documents tab reads "No documents yet".

The checklist rows that mention medication are checklist **titles** — "Medications
stored locked, and only where they should be" — not anybody's record.

## Not wired to a page yet

These are the assets only. Nothing on the site links to them. If they should go
on a page, `/videos/tour/` is the pattern to copy: `<source>` first, captions as
`<track>` with English `default`.

## The translations are machine-produced

Neither the Spanish nor the Filipino has been read by a native speaker. Same
caveat as every other translation in this repo — get each checked by someone who
speaks it before leaning on it in marketing.
