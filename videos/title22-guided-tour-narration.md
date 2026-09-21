# Narration script for the guided tour

The tour video has **no audio track at all**. This is the script for adding
one, cut to the timecodes already in the video so a recording drops straight
onto the existing edit without re-timing anything.

## Why there is no voiceover yet

The video is produced by a script (`videos/tour/record/record.js`), which drives
a headless browser and records what it does. A headless browser has no voice.
There is no text-to-speech in that environment and no audio encoder in its
`ffmpeg`, so the recording cannot be given a voice where it is made — the
narration has to be recorded by a person and muxed in somewhere with a full
`ffmpeg`.

Until that happens the captions carry it, the English track is `default` so they
come on by themselves, and cue 0 says so on screen in the first four seconds.

**A real voice is worth recording.** Title22's whole pitch is that it was built
by a certified RCFE administrator; hearing that person say these six sentences
is more convincing than reading them. Record it in your own voice rather than
buying a synthetic one.

## The script

Each line has a hard in-point. Say the line inside its window and leave silence
between — the pauses are where the tour switches tabs and the viewer is reading
the screen. Nothing needs to fill the gaps.

Total runtime 1:17. Roughly 130 words. Comfortable pace, no rush.

| In | Out | Line |
|---|---|---|
| 0:04.4 | 0:15.4 | **This is the number that matters.** Requirements that are current, out of requirements that exist. Not a grade for effort — an inspector could ask about any of them today. |
| 0:17.0 | 0:25.6 | **And it tells you whose.** An expired TB test is not a red number on a chart. It is a named person, and tapping it opens their record. |
| 0:27.2 | 0:37.6 | **One button for inspection day.** Every filed document in one place, and a ninety-day DSS packet you can print from the dashboard while the analyst is sitting there. |
| 0:39.2 | 0:49.6 | **The checklist an analyst works from.** Title 22 requirements with dates against them. Overdue rises to the top, because that is the order the questions come in. |
| 0:51.2 | 1:02.2 | **Five roles, and you choose them.** A caregiver logs incidents and files documents. An in-house caregiver also works the checklist; a supervisor sees staff files too. Read-only is what you hand an inspector. Nobody picks their own — the administrator sets it when the invitation goes out. |
| 1:03.8 | 1:12.7 | **Now ask me something.** Try "am I ready for DSS?" or "who has expired certs?". I read this facility's actual records and answer from them. |

The bold openers are the on-screen headings. Say them as part of the sentence —
do not read them as titles.

The video holds for about four more seconds after the last line. Leave it silent.

## Two things not to say

The same two claims that had to be cut from the narrated overview video are
**not** in this script, and must not be improvised back in:

- **Do not say the checklist comes with regulation citations.** It does not.
  Citations are deliberately null in the app.
- **Do not say alerts fire at ninety, thirty and seven days.** The banner uses
  thirty and seven. The ninety-day figure in the product is the lookback window
  on the DSS export, which is a different thing entirely.

The line above about a "ninety-day DSS packet" is correct — that is the export's
lookback, and it is what the screen is showing at that moment.

## Muxing it in

Record as WAV, 48 kHz, mono is fine. Then, on a machine with a full `ffmpeg`
(the one in this project's recording environment has no audio encoder):

```sh
ffmpeg -i title22-guided-tour.webm -i narration.wav \
       -c:v copy -c:a libopus -b:a 96k -shortest \
       title22-guided-tour-narrated.webm
```

`-c:v copy` leaves the picture untouched, so the captions stay in sync and the
file stays small. Check the result is still under a couple of megabytes and
under Cloudflare Pages' 25 MiB cap.

Then, on `/videos/tour/`:

1. Point the `<source>` at the narrated file.
2. Delete the "This video has no sound" notice and the `.silent-notice` styles.
3. Remove **cue 0** from all three `.vtt` files — it says there is no voiceover,
   and there would be one. Leave every other cue exactly as it is; they are
   timed to this edit and the picture has not changed.
4. Keep the captions. They are still needed for anyone deaf, anyone on a phone
   with the sound off, and the Spanish and Filipino audiences.

## If the tour is ever re-recorded

Re-record first, then re-record the voice — `record.js` derives the timings from
the text, so a wording change moves the marks. The new timings are written into
`title22-guided-tour.en.vtt` in the same pass, and this table should be rebuilt
from that file rather than edited by hand.
