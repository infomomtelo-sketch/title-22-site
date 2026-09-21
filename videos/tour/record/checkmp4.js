// Structural check of the produced MP4. Nothing here can decode H.264 -- the
// bundled ffmpeg has no H.264 decoder and this Chromium has no proprietary
// codecs -- so the file is verified by walking its atoms instead: the brand,
// the sample description (must be avc1, not vp09/hvc1), the avcC profile, the
// dimensions, the duration, and the sample and keyframe counts.
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, 'out', 'title22-guided-tour.mp4');
const buf = fs.readFileSync(file);
let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log('  ok   ' + n + (x !== undefined ? '  ' + x : '')))
  : (fail++, console.log('  FAIL ' + n + (x !== undefined ? '  -> ' + x : '')));

function walk(start, end, depth, want, found) {
  let p = start;
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p);
    const type = buf.toString('latin1', p + 4, p + 8);
    let head = 8;
    if (size === 1) { size = Number(buf.readBigUInt64BE(p + 8)); head = 16; }
    if (size === 0) size = end - p;
    if (size < head || p + size > end) break;
    if (!found[type]) found[type] = { off: p, size, head };
    const CONTAINERS = ['moov','trak','mdia','minf','stbl','dinf','edts','udta'];
    if (CONTAINERS.includes(type)) walk(p + head, p + size, depth + 1, want, found);
    if (type === 'stsd') walk(p + head + 8, p + size, depth + 1, want, found);
    // A visual sample entry is 78 bytes of fixed fields, then child atoms.
    if (['avc1','avc3','hvc1','vp09'].includes(type)) walk(p + head + 78, p + size, depth + 1, want, found);
    p += size;
  }
}

const found = {};
walk(0, buf.length, 0, null, found);

console.log('\n' + path.basename(file) + '  ' + Math.round(buf.length / 1024) + ' KB');
console.log('atoms: ' + Object.keys(found).join(' ') + '\n');

// --- brand ---
const brand = found.ftyp ? buf.toString('latin1', found.ftyp.off + 8, found.ftyp.off + 12) : null;
ok('ISO base media container (ftyp)', !!found.ftyp, 'brand=' + brand);

// --- codec: this is the whole point ---
ok('video sample entry is avc1 (H.264)', !!found.avc1,
   found.avc1 ? 'avc1 present' : 'MISSING; found ' +
   ['vp09','vp08','hvc1','hev1','av01','mp4v'].filter(c => found[c]).join(',') || 'none');
ok('not VP9/HEVC/AV1 in an mp4 box',
   !found.vp09 && !found.vp08 && !found.hvc1 && !found.hev1 && !found.av01);

// --- avcC profile, the thing Safari is fussy about ---
if (found.avcC) {
  const o = found.avcC.off + 8;
  const profile = buf[o + 1], compat = buf[o + 2], level = buf[o + 3];
  const names = { 66: 'Baseline', 77: 'Main', 88: 'Extended', 100: 'High' };
  ok('avcC decoder config present', true,
     'profile=' + (names[profile] || profile) + ' level=' + (level / 10).toFixed(1) +
     ' codecs="avc1.' + [profile, compat, level].map(b => b.toString(16).padStart(2, '0')).join('') + '"');
  ok('profile is one every iPhone decodes', [66, 77, 100].includes(profile), 'profile byte ' + profile);
} else { ok('avcC decoder config present', false); }

// --- dimensions from the visual sample entry ---
if (found.avc1) {
  const o = found.avc1.off + 8;
  const w = buf.readUInt16BE(o + 24), h = buf.readUInt16BE(o + 26);
  ok('dimensions', w === 1280 && h === 720, w + 'x' + h);
  ok('both even (encoder requirement)', w % 2 === 0 && h % 2 === 0);
}

// --- duration ---
if (found.mvhd) {
  const o = found.mvhd.off + 8;
  const ver = buf[o];
  const scale = ver === 1 ? buf.readUInt32BE(o + 20) : buf.readUInt32BE(o + 12);
  const dur = ver === 1 ? Number(buf.readBigUInt64BE(o + 24)) : buf.readUInt32BE(o + 16);
  const secs = dur / scale;
  ok('duration matches the webm', Math.abs(secs - 77.3) < 1.5, secs.toFixed(1) + 's');
}

// --- sample and keyframe counts ---
if (found.stsz) {
  const n = buf.readUInt32BE(found.stsz.off + 8 + 8);
  ok('frame count', n === 773, n + ' samples');
}
if (found.stss) {
  const n = buf.readUInt32BE(found.stss.off + 8 + 4);
  ok('has keyframes, so it can be seeked', n > 10, n + ' keyframes');
} else {
  // Per ISO/IEC 14496-12: no stss means EVERY sample is a sync sample. That is
  // legal and fully seekable, not a defect.
  ok('seekable (no stss = every frame is a keyframe)', true, 'all-sync');
}

// --- moov before mdat: what +faststart does, so it streams ---
ok('moov before mdat (starts playing before it finishes downloading)',
   found.moov && found.mdat && found.moov.off < found.mdat.off,
   found.moov && found.mdat ? 'moov@' + found.moov.off + ' mdat@' + found.mdat.off : '');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
