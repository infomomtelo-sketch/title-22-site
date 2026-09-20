// Writes the ES and FIL caption tracks from the English one, reusing its cue
// numbers and timings verbatim so the three files cannot drift apart.
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const en = fs.readFileSync(path.join(OUT, 'title22-guided-tour.en.vtt'), 'utf8');

const timings = en.split(/\n{2,}/)
  .filter(b => b.includes('-->') && !/^NOTE\b/.test(b))
  .map(b => b.split('\n').find(l => l.includes('-->')));

const ES = [
  'Este es el número que importa — Requisitos vigentes, del total de requisitos que existen. No es una nota por el esfuerzo: un inspector podría preguntar hoy por cualquiera de ellos.',
  'Y le dice de quién — Una prueba de tuberculosis vencida no es un número rojo en un gráfico. Es una persona con nombre, y al tocarla se abre su expediente.',
  'Un botón para el día de la inspección — Todos los documentos archivados en un solo lugar, y un paquete de 90 días para el DSS que puede imprimir desde el panel mientras el analista está sentado ahí.',
  'La lista con la que trabaja un analista — Requisitos del Título 22 con sus fechas. Lo vencido sube al principio, porque ese es el orden en que llegan las preguntas.',
  'Cinco roles, y usted los elige — Un cuidador registra incidentes y archiva documentos. Un cuidador interno además trabaja la lista; un supervisor también ve los expedientes del personal. Solo lectura es lo que le entrega a un inspector. Nadie elige el suyo: el administrador lo asigna cuando envía la invitación.',
  'Ahora pregúnteme algo — Pruebe «¿estoy listo para el DSS?» o «¿a quién se le vencieron los certificados?». Leo los registros reales de este centro y respondo a partir de ellos.',
];

const FIL = [
  'Ito ang numerong mahalaga — Mga requirement na kasalukuyang updated, sa kabuuan ng mga requirement na umiiral. Hindi ito grado sa pagsisikap — puwedeng itanong ng inspector ang alinman sa mga ito ngayon.',
  'At sinasabi nito kung kanino — Ang expired na TB test ay hindi pulang numero sa tsart. Isa itong taong may pangalan, at kapag tinapik, bubukas ang record niya.',
  'Isang pindot para sa araw ng inspeksyon — Lahat ng naka-file na dokumento sa isang lugar, at isang 90-day DSS packet na puwedeng i-print mula sa dashboard habang nakaupo pa ang analyst.',
  'Ang checklist na ginagamit ng analyst — Mga requirement ng Title 22 na may petsa. Ang overdue ang nasa itaas, dahil iyon ang pagkakasunod-sunod ng pagdating ng mga tanong.',
  'Limang role, at kayo ang pumipili — Ang caregiver ay nagre-record ng insidente at nagfa-file ng dokumento. Ang in-house caregiver ay gumagawa rin sa checklist; nakikita rin ng supervisor ang mga staff file. Ang read-only ang iaabot ninyo sa inspector. Walang pumipili ng sarili niyang role — ang administrator ang nagtatakda nito kapag ipinadala ang imbitasyon.',
  'Ngayon, magtanong kayo — Subukan ang "ready na ba ako sa DSS?" o "sino ang may expired na certs?". Binabasa ko ang totoong records ng facility na ito, at doon ako sumasagot.',
];

function wrap(text, width) {
  const out = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if (!line) line = w;
    else if ((line + ' ' + w).length <= width) line += ' ' + w;
    else { out.push(line); line = w; }
  }
  if (line) out.push(line);
  return out;
}

const NOTES = {
  es: [
    'MACHINE TRANSLATION, NOT REVIEWED BY A NATIVE SPEAKER. Same standing as the',
    'Launch Hub translations in the app: usable, not verified. Have a Spanish',
    'speaker read it before it is used in marketing.',
  ],
  fil: [
    'MACHINE TRANSLATION, NOT REVIEWED BY A NATIVE SPEAKER. Same standing as the',
    'Launch Hub translations in the app: usable, not verified. Have a Filipino',
    'speaker read it before it is used in marketing.',
  ],
};

for (const [code, lines] of [['es', ES], ['fil', FIL]]) {
  if (lines.length !== timings.length) throw new Error(code + ': ' + lines.length + ' lines for ' + timings.length + ' cues');
  const head = [
    'WEBVTT', 'Kind: captions', 'Language: ' + code, '',
    'NOTE', ...NOTES[code], '',
    'NOTE',
    'Translated from title22-guided-tour.en.vtt, which is the source of record.',
    'Cue numbers and timings are copied from it verbatim by translate.js, so the',
    'three tracks cannot drift. Re-cut the video and all three are regenerated.',
    '',
    'NOTE',
    'The English is the app\'s own on-screen tour copy. Terms the app shows in',
    'English stay in English: DSS, Title 22, TB, read-only, checklist, dashboard.',
    '', '',
  ];
  const body = lines.map((text, i) =>
    [String(i + 1), timings[i], ...wrap(text, 46), ''].join('\n'));
  fs.writeFileSync(path.join(OUT, 'title22-guided-tour.' + code + '.vtt'), head.join('\n') + body.join('\n'));
  console.log(code + ': ' + lines.length + ' cues written');
}
console.log('timings taken from en: ' + timings.length);
