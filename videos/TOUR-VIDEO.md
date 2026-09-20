# The guided tour video

`/videos/tour/` — 1 min 17 s, 3.9 MB, WebM (VP8), 1280×720, **silent**.

The marketing site had no working video at all: every narrated recording was
deleted in the PHI cull, and the one clip left, `title22-trainer-pitch.mp4`, is
classroom footage with no product in it. This is the replacement.

## What it is

A screen recording of the **real app**, driven through the app's **own** guided
tour — the `TOUR_STEPS` sequence built into `index.html`, the same one a
customer sees. Nothing is animated, mocked up or re-created.

- Facility: Marigold House, a six-bed RCFE. Invented.
- Staff: five invented people. One has a TB test eleven days expired and one a
  CPR card nineteen days from expiry, which is what gives the alerts panel and
  the checklist something real to point at.
- **No resident appears, and none could.** Lite holds no resident records, no
  medications and no MAR. The fixture database serves no such rows and the app
  never asks for any — `showMAR` is false, so those queries are not made.

That is the property the deleted videos did not have. Every one of them toured a
Residents tab or a medication administration record. This one cannot, by
construction, which is why it is safe to keep as the product changes.

## Captions instead of a voiceover

There is no audio track. The captions carry the whole thing, so the English
track is marked `default` and the page tells the viewer to leave them on.

Three tracks, cue numbers and timings identical in all of them:

- `title22-guided-tour.en.vtt` — **source of record.** The text is the app's own
  tour copy, verbatim, not paraphrased. So the video makes no claim the product
  does not already make about itself on screen.
- `title22-guided-tour.es.vtt` — Spanish. Machine translation, unreviewed.
- `title22-guided-tour.fil.vtt` — Filipino. Machine translation, unreviewed.

The timings are exact rather than estimated: the script that drove the tour also
wrote the caption file, so a cue cannot drift from the picture unless the video
is re-cut. `translate.js` copies the English timings into the other two, so they
cannot drift from each other either.

Both translations are unverified — the same standing the Launch Hub's languages
carry in the app — and the page says so to the viewer whenever a non-English
track is selected. Leave that notice up until a fluent speaker has actually read
them.

## One step is deliberately missing

The tour has seven steps. **This recording stops at six.**

Step 7 ends with *"You can replay it any time from Walkthrough in the menu."*
That is not true today. `openWalkthrough()` in `index.html` — the only function
that opens the modal containing the "Take the tour" button — **has no call
sites**, and both Walkthrough affordances (`nav-walkthrough`, `menu-walkthrough`)
open the written walkthrough page in a new tab instead. So a signed-in customer
cannot reach the guided tour at all, and a marketing video must not tell them
they can.

The recording dismisses the tour after step 6 and ends on the dashboard. Set
`LAST_STEP = 7` in `record/record.js` and re-record once the menu button actually
opens the tour.

## Re-recording it

The reason the old videos rotted is that re-shooting them was a person with a
screen recorder. This one is a script.

```
cd videos/tour/record
APP_REPO=/path/to/runp8-care node record.js video   # video + English captions
node translate.js                                    # ES and FIL from the English
```

It serves the app repo on localhost, answers every PostgREST call from
`fixtures.js` (egress to Supabase is not needed and not used), drives
`/?demo=1&tour=1`, holds each step for a reading-speed-derived interval, and
writes the video and the caption file together. Non-GET requests are refused, so
a recording can never write anything.

Run `node record.js` with no argument for screenshots only — useful for checking
what a step will look like before committing to a take.

## Before this becomes the main call to action

**WebM does not play on older Safari.** Chrome, Firefox and Edge play it
everywhere; iPhones on older iOS will not, and will get the transcript and a
note instead of a picture. Produce an H.264 MP4 alongside it before putting this
behind a front-page button. The `ffmpeg` available in the environment that
recorded this has only a VP8 encoder, so that conversion has to happen
elsewhere.

Nothing links to `/videos/tour/` yet — URL only, until someone has watched it
end to end.

## And the sandbox link is a separate, live problem

`/?demo=1&tour=1` works in a recording because the database is stubbed. **On the
real site it does not work**, and the "See it first — no signup" button on
title22.app's landing page is dead: `enterDemoMode()` finds no facility with
`is_demo = true`, alerts "The demo sandbox isn't available right now", and drops
the visitor on the landing page.

The policies from `migrations/2026-07-23_title22_demo_tenant.sql` were applied.
The manual step at the bottom of that file — create the sandbox content, then
flag the facility — never was.

**Do not follow that instruction as written.** It says to use the in-app "Load
demo data" action, which seeds eight residents and a practice MAR, and then to
expose that facility to the `anon` role. On a product whose entire claim is that
it holds no resident records, that would publish invented residents and a
medication administration record to anonymous visitors — precisely what every
deleted video was deleted for. If the sandbox is revived, it needs a Lite-shaped
facility: staff, checklist, documents, incidents, and nothing else. The fixture
set in `record/fixtures.js` is exactly that shape and is a reasonable starting
point for it.
