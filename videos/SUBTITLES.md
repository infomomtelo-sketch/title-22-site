# Subtitles for the overview video

Four new files, none of which changes anything that was already here:

- `title22-overview.en.vtt` — English, 20 cues, 0:02 to 2:47. **Source of record.**
- `title22-overview.es.vtt` — Spanish. Machine translation, unreviewed.
- `title22-overview.fil.vtt` — Filipino. Machine translation, unreviewed.
- `overview/index.html` — serves at `/videos/overview/`. Player with an
  EN / ES / FIL toggle, plus a clickable transcript.

Nothing links to `/videos/overview/` yet. It is reachable by URL only, on
purpose — add it to the nav after someone has read it end to end.

## The one rule these files live by

**Cue numbers and timings are identical in all three.** That is what lets the
page swap tracks mid-play without the viewer losing their place, and what lets
the transcript keep its highlight when the language changes. If you retime one
file, retime all three. `grep -- '-->' *.vtt` and diff the three lists; they
should come out byte-identical.

## Three cues you must not publish blind

The captions were transcribed from the published narration transcript, so they
match the audio. Two of them match audio that is wrong:

- **Cue 4 (0:31–0:38)** — "the compliance checklist comes preloaded with Title
  22 requirements and the related regulation references". The checklist ships
  without citations, deliberately: citations are null in the app for the same
  reason Tello may not state a requirement as settled fact.
- **Cue 7 (0:53–1:08)** — "alerts can surface 90, 30, and 7 days before". The
  expiry banner uses 30 and 7. The only 90-day number in the app is a
  subtraction — the lookback window on the DSS export — not an alert.

A caption has to match the audio, so neither is fixable here. **Those two lines
need re-recording in the video.** When they are, update all three VTT files and
the "A word about what the video says" section on `/videos/overview/`, which
exists only because those two lines are still in the audio.

- **Cue 17 (2:08–2:13)** is **reconstructed, not heard.** The supplied
  transcript has a gap between 2:05 and 2:13. The opening clause ("Privacy is a
  deliberate boundary", now cue 16 on its own) and the closing clause
  ("...medication administration records, or clinical decision-making") are
  verbatim; the words joining them were inferred from the grammar and from what
  the product actually claims. **Listen to 2:08–2:13 and correct it** before
  this goes anywhere a customer reads it.

## Publishing them

### On YouTube — works today, no re-encode

The video is at `https://youtu.be/7iGo9vMZ69E`. YouTube Studio → the video →
Subtitles → Add language → Upload file → **With timing**. It accepts `.vtt`
directly and ignores the `NOTE` blocks. Do the English first and set it as the
default track.

### Self-hosted on this site — needs a re-encode first

`/videos/overview/` expects `videos/title22-overview.mp4`. Two things stand in
the way:

1. **The master is HEVC/H.265 (`hvc1`).** Chrome and Firefox will not decode it;
   Safari will. A page that plays for the person who recorded it and nobody else
   is worse than no page. Re-encode to **H.264 (`avc1`) + AAC** before adding it.
   The clip that already ships here, `title22-trainer-pitch.mp4`, is `avc1` —
   match that.
2. **Cloudflare Pages caps a file at 25 MiB.** The 2:48 master needs to come in
   under that, or it stays on YouTube and this page keeps linking out.

Until the file is there the page **does not show a broken player.** It hides the
player, says the file is not on the site yet, links to YouTube, and leaves the
transcript fully usable. That path is tested; so is the one where the file
loads.

## The translations are not verified

Same standing as the Launch Hub's four languages in the app: produced by
machine, not read by a native speaker. The page says so, to the viewer, every
time a non-English track is selected — that notice is not decoration, do not
remove it until someone has actually done the review.

They are short declarative sentences, so the risk is low, but this is a
compliance product read by people who may not read English well. Get each
language checked by someone who speaks it before leaning on it in marketing.

Terms deliberately left in English, in both translations, because that is what
the card, the form and the app's own labels say: CPR, first aid, Live Scan, DSS,
RCFE, LIC numbers, PHI. The Filipino file also keeps `compliance checklist`,
`readiness score`, `audit log` and `training` in English, which is how the term
is actually used.

## Language tags

The Filipino file is tagged `fil`. Tagalog specifically is `tl`, which is what
the app's Launch Hub picker uses; the text is the same either way. The page
matches a browser set to either one to the same track.

## What the page remembers

One key, `title22_caption_lang`, in that browser's `localStorage` — the same
pattern as `title22_launch_lang` in the app. It holds `en`, `es` or `fil` and
nothing else. Every read and write is wrapped, so a browser with site data
blocked simply falls back to the browser's own language and the toggle keeps
working. Nothing is sent anywhere.
