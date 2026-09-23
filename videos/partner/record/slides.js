// The partner explainer, as data. Each slide carries its own duration and the
// caption line that goes with it, so the MP4 and the .vtt are generated from
// one source and cannot drift apart.
//
// Every factual line here is checked against the app's code, not the pitch:
//   * trial length      p_trial_days, default 90, resolved by t22RefTrialDays
//   * commission        p_commission_rate, default 0.20, stored on the row
//   * the row's columns signup_count / paid_count / latest_signup
//   * signups not clicks   there is no click tracking anywhere in the app
//   * no retro-attach   ensureProfile upserts with ignoreDuplicates
//   * payout by hand    no ledger or payment record exists in the schema
//
// Do not add a claim here that is not one of those. If the product changes,
// change this file and re-run make.js — the captions regenerate with it.

module.exports = [
  {
    id: 'title', secs: 4.5, kind: 'title',
    kicker: 'Partner program',
    h: 'Become a Title22 partner',
    sub: 'What a referral code does, what it pays, and where the referrals come from.',
    cap: 'Become a Title22 partner — what a code does, what it pays, and where referrals come from.',
    capEs: 'Sea socio de Title22: qué hace un código, cuánto paga y de dónde vienen las referencias.',
    capFil: 'Maging Title22 partner — ano ang ginagawa ng code, magkano ang kita, at saan nanggagaling ang referral.',
  },
  {
    id: 'routes', secs: 9, kind: 'three',
    h: 'Three ways in',
    items: [
      ['Trainer', 'You teach DSS-approved RCFE courses. You get a code and a free classroom account that never expires.'],
      ['Affiliate', 'You work around care homes but do not teach. You get a code and a link.'],
      ['Graduate', 'You took the course and now run a home. Being a customer does not stop you being a partner.'],
    ],
    cap: 'Three ways in: as a trainer, as an affiliate, or as a graduate already running a home. Nothing stops you being two of them.',
    capEs: 'Tres caminos: como instructor, como afiliado o como graduado que ya dirige una casa. Nada impide ser dos de ellos.',
    capFil: 'Tatlong daan: bilang trainer, bilang affiliate, o bilang graduate na may sariling bahay. Puwedeng dalawa nang sabay.',
  },
  {
    id: 'trial', secs: 9, kind: 'shot',
    shot: 'trial.png',
    h: 'A code is a longer trial',
    body: 'Somebody arriving on your link gets the trial length set on your code instead of the default 30 days. It is normally <strong>90</strong>.',
    note: 'Three months to get their records straight, not one month.',
    cap: 'A code is a longer trial. Someone arriving on your link gets 90 days instead of the default 30.',
    capEs: 'Un código es una prueba más larga: quien llega por su enlace recibe 90 días en lugar de los 14 habituales.',
    capFil: 'Ang code ay mas mahabang trial. Ang dumaan sa link ninyo ay makakakuha ng 90 araw, hindi 14.',
  },
  {
    id: 'row', secs: 9, kind: 'shot',
    shot: 'codes.png',
    h: 'One row, and it is yours',
    body: 'Your link, how many people signed up through it, how many of those are paying, and the commission rate on record.',
    note: 'Attribution happens when the account is created. You do not have to claim it.',
    cap: 'One row per code: your link, how many signed up, how many are paying, and the rate on record.',
    capEs: 'Una fila por código: su enlace, cuántos se registraron, cuántos pagan y la comisión registrada.',
    capFil: 'Isang hilera bawat code: ang link, ilan ang nag-sign up, ilan ang nagbabayad, at ang nakatalang rate.',
  },
  {
    id: 'earn', secs: 11, kind: 'facts',
    h: 'What you earn',
    rows: [
      ['When', 'On a paid subscription — not on a signup.'],
      ['How long', 'Every month they stay subscribed, not once.'],
      ['How much', '20% is the default in the system. Rates are agreed per partner.'],
      ['Paid how', 'Directly by Eli. No automated payout, no platform in the middle.'],
    ],
    cap: 'You earn on a paid subscription, every month they stay. 20% is the default; rates are agreed per partner, and Eli pays directly.',
    capEs: 'Gana con una suscripción pagada, cada mes que siga activa. 20% es el valor por defecto; la tarifa se acuerda con cada socio y Eli paga directamente.',
    capFil: 'Kikita kayo kapag bayad na ang subscription, bawat buwan na nananatili. 20% ang default; napag-uusapan ang rate at si Eli mismo ang nagbabayad.',
  },
  {
    id: 'traps', secs: 11, kind: 'warn',
    h: 'Two things that will cost you',
    items: [
      ['Signups are tracked, not clicks', 'Nothing counts a visit. The link records when someone creates an account through it.'],
      ['A code cannot attach to an account that already exists', 'Send your link before they sign up. Afterwards there is no way to link it.'],
    ],
    cap: 'Two traps: only signups are tracked, not clicks — and a code cannot attach to an account that already exists. Send your link before they sign up.',
    capEs: 'Dos trampas: solo se registran los registros, no los clics, y un código no se puede vincular a una cuenta que ya existe. Envíe su enlace antes de que se registren.',
    capFil: 'Dalawang bitag: signup lang ang naitatala, hindi click — at hindi maikakabit ang code sa account na mayroon na. Ipadala ang link bago sila mag-sign up.',
  },
  {
    id: 'leads', secs: 11, kind: 'three',
    h: 'Where the referrals come from',
    items: [
      ['Your own graduates', 'In the week they get licensed, when the paperwork becomes real.'],
      ['Homes that just had an inspection', 'Passed narrowly or failed — either way they are listening now.'],
      ['Anyone hiring or opening a second home', 'New staff means new clearances, TB tests and training hours with dates on them.'],
    ],
    cap: 'The referrals that convert: your own graduates the week they are licensed, homes fresh from an inspection, and anyone hiring or opening a second home.',
    capEs: 'Las referencias que funcionan: sus graduados la semana en que reciben la licencia, casas recién inspeccionadas y quien contrata o abre una segunda casa.',
    capFil: 'Ang referral na umuubra: mga graduate sa linggong ma-lisensiyahan sila, bahay na katatapos lang ma-inspeksiyon, at sinumang kumukuha ng staff o nagbubukas ng pangalawang bahay.',
  },
  {
    id: 'line', secs: 8, kind: 'quote',
    h: 'The line that works',
    quote: '“Use my link and you get 90 days free instead of 14.”',
    note: 'Specific, true, and it costs them nothing to check. Lead with that, not with the software.',
    cap: 'The line that works: "use my link and you get 90 days free instead of 14." Specific, true, and free to check.',
    capEs: 'La frase que funciona: «use mi enlace y obtiene 90 días gratis en lugar de 14». Concreta, cierta y fácil de comprobar.',
    capFil: 'Ang linyang umuubra: "gamitin ang link ko at 90 araw kayong libre, hindi 14." Tiyak, totoo, at madaling patunayan.',
  },
  {
    id: 'start', secs: 10, kind: 'facts',
    h: 'Getting set up',
    rows: [
      ['1 · Email', 'hello@title-22.com — say which route fits, and confirm your rate.'],
      ['2 · Get your code', 'title22.app/?ref=yourcode — reusable, the same link forever.'],
      ['3 · Teaching too?', 'A classroom account is a separate request. Sign up for a free account first.'],
    ],
    cap: 'To start: email hello@title-22.com, confirm your rate, and get your code. If you teach, ask for a classroom account too — it is a separate request.',
    capEs: 'Para empezar: escriba a hello@title-22.com, confirme su tarifa y reciba su código. Si enseña, pida también una cuenta de aula: es una solicitud aparte.',
    capFil: 'Para magsimula: mag-email sa hello@title-22.com, kumpirmahin ang rate, at kunin ang code. Kung nagtuturo kayo, humiling din ng classroom account — hiwalay itong request.',
  },
  {
    id: 'end', secs: 5, kind: 'title',
    kicker: 'title-22.com/partners',
    h: 'Get your code',
    sub: 'hello@title-22.com',
    cap: 'Everything here is at title-22.com/partners. Email hello@title-22.com to get your code.',
    capEs: 'Todo esto está en title-22.com/partners. Escriba a hello@title-22.com para obtener su código.',
    capFil: 'Nasa title-22.com/partners ang lahat ng ito. Mag-email sa hello@title-22.com para sa inyong code.',
  },
];
