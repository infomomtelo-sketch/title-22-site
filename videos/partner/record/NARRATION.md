# Narration for the partner explainer

The video has **no audio track**. This is the script for adding one, cut to the
card timings already in the edit, so a recording drops onto the existing
picture without re-timing anything.

**Record this in your own voice.** The whole pitch is that Title22 was built by
a certified RCFE administrator; a trainer deciding whether to partner wants to
hear that person, not a synthetic voice. It is about 200 words over 88 seconds —
a comfortable pace with pauses, not a rush.

## The script

Each line has a hard in-point, taken from `slides.js`. Say the line inside its
window and leave silence between — the gaps are where the card changes and the
viewer is reading. Nothing needs to fill them.

| In | Out | Card | Line |
|---|---|---|---|
| 0:00.0 | 0:04.5 | title | If you teach RCFE administrators, or you just know them, this is what partnering with Title22 actually pays — and what it does for the people you send. |
| 0:04.5 | 0:13.5 | routes | Three ways in. You teach the courses. Or you work around care homes but don't teach. Or you took the course yourself and now you run a home — being a customer doesn't stop you being a partner. |
| 0:13.5 | 0:22.5 | trial | Here is the part worth knowing. A code isn't just a tag. Someone who signs up through your link gets ninety days free instead of fourteen. Three months to get their records straight, not two weeks. |
| 0:22.5 | 0:31.5 | row | And you get a row you can read. Your link, how many people came through it, how many of those are paying, and your rate. Attribution happens when the account is created — you don't have to claim anything. |
| 0:31.5 | 0:42.5 | earn | You earn on a paid subscription, not on a signup, and every month they stay — not once. Twenty per cent is the default in the system; your own rate is agreed with me directly. And I pay you myself. There's no platform in the middle taking a cut. |
| 0:42.5 | 0:53.5 | traps | Two things will cost you, so I'd rather say them out loud. Only signups are tracked, never clicks. And a code cannot attach to an account that already exists — so send your link *before* they sign up. Afterwards there's no way to link it. |
| 0:53.5 | 1:04.5 | leads | Where do the referrals actually come from? Your own graduates, in the week they get licensed, when the paperwork stops being theoretical. Homes fresh out of an inspection. And anyone hiring, or opening a second home. |
| 1:04.5 | 1:12.5 | line | The line that works is the simple one. "Use my link and you get ninety days free instead of fourteen." It's specific, it's true, and it costs them nothing to check. Lead with that, not with the software. |
| 1:12.5 | 1:22.5 | start | To start: email me, say which route fits, and confirm your rate in the same message. You'll get a link you can reuse forever. And if you teach with it, ask for a classroom account too — that's a separate request, and people miss it. |
| 1:22.5 | 1:27.5 | end | Everything here is at title-22.com/partners. Email me and I'll set you up. |

## Two things not to say

Do not improvise either of these back in — both were deliberately taken off the
site because the software does not do them:

- **Do not say clicks are tracked.** Only signups are.
- **Do not say commission is paid automatically.** It is paid by a person. There
  is no payout mechanism inside the product.

And do not quote anyone a rate. Twenty per cent is the field's default; the real
rate is agreed per partner.

## Muxing it in

Record as WAV or m4a — a phone voice memo in a quiet room is fine. Then:

```sh
ffmpeg -i title22-partner-explainer.mp4 -i narration.wav \
       -c:v copy -c:a aac -b:a 96k -shortest \
       title22-partner-explainer-narrated.mp4
```

`-c:v copy` leaves the picture untouched, so **the captions stay in sync and
nothing needs regenerating.** Then on `/videos/partner/`:

1. Point the `<source>` at the narrated file.
2. Delete the "This video has no sound" notice and the `.silent-notice` styles.
3. Keep the captions. They are still needed for anyone deaf, anyone watching
   with the sound off, and the Spanish and Filipino audiences.

## If the cards are ever changed

Re-render first, then re-record — `slides.js` drives the timings, so a wording
change moves the marks. Rebuild this table from the new durations rather than
editing it by hand.
