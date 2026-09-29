// What the documents clip says, one entry per step. The recorder holds each
// step at least as long as its narration, and the same text is burned in as
// the caption and written to the .vtt.
//
// Rules for these lines (CLAUDE.md, both repos): say what the app does, never
// what DSS requires, how long anything lasts, or what an inspector accepts.
module.exports = [
  { id: 'intro',   say: "Here's how to add a staff member's documents to Title22, with Scan to fill." },
  { id: 'menu',    say: 'Open the menu, and tap Staff.' },
  { id: 'add',     say: 'Tap Add staff.' },
  { id: 'details', say: 'Type their name, and add the hire date.' },
  { id: 'stf',     say: 'Now, Scan to fill. Take a photo of a certificate, and Title22 fills in the dates for you.' },
  { id: 'scan',    say: 'On the CPR card, tap Scan, and take a photo.' },
  { id: 'review',  say: 'Title22 reads the two CPR dates from the photo, and checks the name on the card. Look them over, then tap Fill form.' },
  { id: 'filled',  say: 'Done. The dates are filled in for you, and the photo is kept with her record.' },
  { id: 'tb',      say: 'TB results are never scanned. Type the test date and the next due date yourself.' },
  { id: 'tbfile',  say: 'Then tap Upload, to keep the signed paper on file.' },
  { id: 'more',    say: 'Scan to fill also works on First Aid, Live Scan, Mandated Reporter and training certificates. Or tap Upload, like this Live Scan paper.' },
  { id: 'save',    say: 'Tap Save.' },
  { id: 'card',    say: 'Her dates are on her card. Anything still missing is marked, and Title22 warns you before a date runs out.' },
  { id: 'outro',   say: 'Try it free for thirty days. No card needed.' },
];
