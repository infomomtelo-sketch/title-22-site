// What the documents clip says, one entry per step. The recorder holds each
// step at least as long as its narration, and the same text is burned in as
// the caption and written to the .vtt.
//
// Rules for these lines (CLAUDE.md, both repos): say what the app does, never
// what DSS requires, how long anything lasts, or what an inspector accepts.
module.exports = [
  { id: 'intro',   say: "Here's how to put a staff member's documents and certificates into Title22." },
  { id: 'menu',    say: 'Open the menu, and tap Staff.' },
  { id: 'add',     say: 'Tap Add staff.' },
  { id: 'details', say: 'Type their name, and add the hire date.' },
  { id: 'scan',    say: 'For a CPR card, tap Scan, and take a photo of the card.' },
  { id: 'review',  say: 'Title22 reads only the two CPR dates, and checks the name on the card. Look them over, then tap Fill form.' },
  { id: 'filled',  say: 'The dates are in, and the photo is kept with her record.' },
  { id: 'tb',      say: 'TB results are never scanned. Type the test date and the next due date yourself.' },
  { id: 'tbfile',  say: 'Then tap Upload, to keep the signed paper on file.' },
  { id: 'more',    say: 'Add the rest the same way, like her Live Scan clearance.' },
  { id: 'save',    say: 'Tap Save.' },
  { id: 'card',    say: 'Her dates are on her card. Anything still missing is marked, and Title22 warns you before a date runs out.' },
  { id: 'outro',   say: 'Try it free for thirty days. No card needed.' },
];
