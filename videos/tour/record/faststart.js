// Moves moov ahead of mdat and patches the chunk offset table -- what
// `ffmpeg -movflags +faststart` does. Without it a browser must download the
// whole file before it can start, because the index lives at the end.
//
// h264-mp4-encoder writes moov last, so every file it makes needs this.
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('usage: node faststart.js <file.mp4>'); process.exit(1); }
const buf = fs.readFileSync(file);

// --- top-level atoms, in order ---
const top = [];
for (let p = 0; p + 8 <= buf.length;) {
  let size = buf.readUInt32BE(p), head = 8;
  const type = buf.toString('latin1', p + 4, p + 8);
  if (size === 1) { size = Number(buf.readBigUInt64BE(p + 8)); head = 16; }
  if (size === 0) size = buf.length - p;
  if (size < head || p + size > buf.length) throw new Error('bad atom ' + type + ' at ' + p);
  top.push({ type, off: p, size });
  p += size;
}
const moov = top.find(a => a.type === 'moov');
const mdat = top.find(a => a.type === 'mdat');
if (!moov || !mdat) throw new Error('need both moov and mdat');
if (moov.off < mdat.off) { console.log('already faststart, nothing to do'); process.exit(0); }

// --- rebuild: ftyp, moov, then everything else in its original order ---
const ftyp = top.find(a => a.type === 'ftyp');
const order = [];
if (ftyp) order.push(ftyp);
order.push(moov);
for (const a of top) if (a !== moov && a !== ftyp) order.push(a);

const out = Buffer.concat(order.map(a => buf.subarray(a.off, a.off + a.size)));

// --- how far did the media data move? ---
let newMdatOff = 0;
for (const a of order) { if (a === mdat) break; newMdatOff += a.size; }
const delta = newMdatOff - mdat.off;

// --- patch every chunk offset inside the copied moov ---
let moovStart = 0;
for (const a of order) { if (a === moov) break; moovStart += a.size; }

let patched = 0;
(function walk(start, end) {
  for (let p = start; p + 8 <= end;) {
    let size = out.readUInt32BE(p), head = 8;
    const type = out.toString('latin1', p + 4, p + 8);
    if (size === 1) { size = Number(out.readBigUInt64BE(p + 8)); head = 16; }
    if (size === 0) size = end - p;
    if (size < head || p + size > end) return;
    if (['moov','trak','mdia','minf','stbl','edts','udta'].includes(type)) walk(p + head, p + size);
    if (type === 'stco') {
      const n = out.readUInt32BE(p + head + 4);
      for (let i = 0; i < n; i++) {
        const at = p + head + 8 + i * 4;
        out.writeUInt32BE(out.readUInt32BE(at) + delta, at);
        patched++;
      }
    }
    if (type === 'co64') {
      const n = out.readUInt32BE(p + head + 4);
      for (let i = 0; i < n; i++) {
        const at = p + head + 8 + i * 8;
        out.writeBigUInt64BE(out.readBigUInt64BE(at) + BigInt(delta), at);
        patched++;
      }
    }
    p += size;
  }
})(moovStart, moovStart + moov.size);

if (out.length !== buf.length) throw new Error('size changed: ' + buf.length + ' -> ' + out.length);
fs.writeFileSync(file, out);
console.log('faststart: moov moved ahead of mdat, ' + patched +
  ' chunk offsets shifted by ' + delta + ' bytes');
