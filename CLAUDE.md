# title-22-site — working rules

Static marketing site for title-22.com. Plain HTML per
directory (classroom/, for-trainers/, pricing/, blog/…),
one shared /assets/style.css. No build step, no framework.
The product itself is a separate repo (runp8-care), served
at title22.app. This repo describes that product; it does
not contain it.

## Verify every product claim against the app source
This site is marketing copy, and marketing copy drifts
ahead of what shipped. Ground truth for every product
capability is the app's source file — not this site, not
another page of this site, and not your memory of it.
Before writing or editing any capability claim, fetch it:

  curl -s https://raw.githubusercontent.com/infomomtelo-sketch/runp8-care/main/index.html

If a capability is not in that file, it does not exist and
it does not go on a page. Do not infer a feature from the
marketing copy you are editing — that is how the false
claims below got here in the first place.

## Verify before reporting
Re-read files from the committed branch state after
committing — re-fetch from raw.githubusercontent.com on
the pushed branch — before claiming an edit landed. Do not
report a file as written or a claim as removed based on
your own summary of what you did. Previous sessions in
this repo reported completions that did not exist in the
committed state.

## Classroom ground truth (verified Sep 3 2026)
There is no separate "classroom" product, no shared
classroom facility, and no student enrolment flow.

- Signup at title22.app starts a **14-day free trial**,
  no credit card. Default is 14 days (trialDays fallback
  in the app).
- Extended access is the **edu plan** ("Classroom"
  label): always entitled, never expires. It is granted
  by email, case by case, by the owner from the
  owner-only Partners tab. Not self-serve.
- A student's practice facility comes from the
  **Load sample facility** button, which runs
  seedDemoData() in their own account. It creates a
  separate facility, "Sunrise Demo Home (Sample)", that
  does not count against the tier cap. One per account.
- **The trainer cannot see a student's work.** The only
  real path is the student inviting the trainer to their
  own facility from **Team access** with the **Read Only**
  role. The readonly role's tabs are dashboard,
  checklist, residents, incidents, daily, mar, lessons,
  documents.
- **There is no student-to-trainer messaging.** Tello is
  the built-in AI assistant (nav "Tello", included on
  every plan). Describe it as a study aid — it can be
  wrong and it gives no medical advice about a resident.
- `title22_create_trainer` is behind an un-run migration
  (migrations/2026-08-03_title22_trainers.sql). Trainer
  codes, where they work at all, only tag a referral and
  set the trial length — they do **not** place a student
  in anyone's facility.

### The only seed numbers that are safe to state
From seedDemoData(), verified against the app source:
8 residents · 5 staff · 10 medications · 30 days of MAR
history · 2 open incidents · one CPR expiring in 20 days
(James Carter) · one TB test 10 days overdue (Daniel
Reyes). Nothing else is. In particular there is no
"dashboard opens amber" state in seedDemoData() — the
dashboard has no facility-level colour at all.

## Settled wording — do not re-derive
- Audit log is **"append-only"** — never "immutable",
  never "tamper-evident".
- **"guided by a certified California RCFE
  administrator"** — never "built by", never "licensed".
- **No inspection-outcome language anywhere on this
  site.** No "inspection-ready", "pass your inspection",
  "graduate inspection-ready". No absolute compliance
  claims; we do not guarantee compliance or inspection
  outcomes.
- No individual's name, certificate number or expiry in
  copy or in JSON-LD.
- classroom/index.html keeps
  `<meta name="robots" content="noindex">`.

## Tiers
Three purchasable: Starter $49 (1 facility), Pro $79 (up
to 5), Agency $249 (unlimited). Specialist/$149 is
archived — a legacy label for existing subscribers only.
Do not surface it as an offer. Marketing sells the $79
tier as "Pro"; the app's T22_LABEL renders it "Facility"
— these disagree and need one name.

## PHI line — do not cross
Resident documents (LIC 601, LIC 602A, ISP) are PHI and
are upload only. No photo-scan of resident or medication
documents to the Anthropic API — no HIPAA BAA is
confirmed. Staff records (TB, Live Scan, certs) are
employment records, not PHI, and may use scan. Do not
write copy that implies otherwise.

## Staff training tab — what it actually does
Verified Sep 5 2026. The Training tab **logs completed
training**; it does not assign anything. You pick a staff
member, a topic, hours, a date, and which annual minimum
it counts toward (dementia 8 / special care 4 / general 8
/ hands-on at the facility), and you may attach a
certificate. It then renders per-staff progress bars
against the 20-hour annual in-service and the 16-hour
initial hands-on. There is **no class creation, no
assignment by role, and no completion requirements** —
copy claiming any of those is false. Title22 supplies no
course content. The separate Lessons tab is
trainer-authored reading and knowledge checks, explicitly
not a training record (no pass mark, no hours, no
certificate, writes nothing to staff_trainings).

## Forms the app actually names
LIC 601, LIC 602A, LIC 603A, LIC 604, and LIC 622 (the
centrally stored medication record, §87465 — this is what
the MAR is). LIC 622 is real; do not "correct" it.

## Wording tension to resolve
The app's own dashboard element is literally titled
**"Inspection readiness score"**, while this site bans
inspection-outcome language. Describing that screen in
site copy currently uses "readiness score" without the
word "inspection". If the site ever needs to name the
element exactly, that is a decision for the owner, not a
thing to re-derive per page.

## Open items
- **Homepage `index.html` carries two of the claims just
  removed elsewhere.** Line ~154: "Train caregivers from
  CDSS-approved material, track completion" — the same
  false training-assignment claim fixed on for-trainers
  (the app logs training, it does not assign it); the same
  line and line ~416 use "inspection-ready". Not fixed.
- **`affiliates/index.html` uses "inspection-ready" three
  times** (~191 H1, ~373 inside a quoted testimonial, ~435
  footer). The testimonial at ~373 also asserts Title22
  "keeps your documentation inspection-ready". Not fixed —
  and a quoted testimonial needs the owner's sign-off
  before anyone rewrites words attributed to a customer.
- **The name "Eli" appears in for-trainers copy (~269) and
  in every pre-written mailto body on that page.** The
  settled rule says no individual's name in copy. That
  rule was written about credentials (name / cert number /
  expiry); a first name in a contact email may be
  deliberate. Left alone pending a decision — do not strip
  it unilaterally.
- `for-trainers-index.html` is a stray, unlinked duplicate
  of `for-trainers/index.html` in the repo root. As of
  Sep 5 2026 both files are byte-identical and both carry
  the corrected copy. Decide whether to delete the root
  one; until then, every edit must be applied to both.
- The classroom page's "Almost. You see all the same
  screens" FAQ is unverified against role tabs — a trial
  user is an administrator and does see all of them, but
  re-check if the copy ever gets more specific.
