// What the Classroom guide says, one entry per step. `say` is what the voice
// reads; `cap` (when present) is the same line as it should be written, for
// the caption and the .vtt. The recorder holds each step at least as long as
// its narration.
//
// Rules for these lines (CLAUDE.md, both repos): say what the app does, never
// what DSS requires, how long anything lasts, or what an inspector accepts.
// Nothing here mentions money: the partner program has its own clip.
module.exports = [
  { id: 'intro',    say: "Here's how to set up your Title22 Classroom account, and use it with your students." },
  { id: 'signup',   say: 'First, create your account at Title22 dot app, with the email you teach from.',
                    cap: 'First, create your account at title22.app, with the email you teach from.' },
  { id: 'grant',    say: "Then tell the Title22 team which email you used. They turn on your Classroom account. It's free, and it does not expire." },
  { id: 'around',   say: 'Sign in again, and tap Show me around.' },
  { id: 'ready',    say: 'This is your practice home. Everyone in it is invented.' },
  { id: 'lessons',  say: 'Open the menu, and tap Lessons.' },
  { id: 'starters', say: 'Tap Load starter lessons. You get ready-made lessons, each with its own questions.' },
  { id: 'edit',     say: 'Every lesson is yours to change. Tap Edit to rewrite the reading. Untick Show this lesson to students, and it stays a draft.' },
  { id: 'questions',say: 'Tap Questions to change what your students are asked.' },
  { id: 'team',     say: 'Now bring your class in. Open the menu, and tap Team access.' },
  { id: 'invite',   say: "Tap Invite Member. Type your student's email, and choose Supervisor, so they can follow the practice steps and submit answers." },
  { id: 'link',     say: 'Tap Generate Invite Link. Copy the link, and send it to your student.' },
  { id: 'join',     say: 'Your student creates an account with that same email, then opens your link.' },
  { id: 'student',  say: "This is your student's screen. They open a lesson, and read it." },
  { id: 'answer',   say: 'Then they answer the questions, and tap Submit answers. They see which ones they got right.' },
  { id: 'results',  say: 'Back on your screen, tap Results on any lesson. You see every submission, with the score.' },
  { id: 'note',     say: 'These are practice answers. They are not a training record.' },
  { id: 'outro',    say: 'Questions? Write to hello, at title dash twenty-two dot com.',
                    cap: 'Questions? Write to hello@title-22.com.' },
];
