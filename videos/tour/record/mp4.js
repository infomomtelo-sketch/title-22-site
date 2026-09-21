// Encodes the guided tour as a real H.264 MP4, here, with no system ffmpeg.
//
// The environment's ffmpeg can only encode PNG and VP8, and this Chromium has
// no WebCodecs and no H.264 in MediaRecorder (its "video/mp4" is VP9 in an mp4
// box, which Safari will not decode). h264-mp4-encoder is a WASM build of a
// real H.264 encoder, so the whole conversion runs in JS.
//
//   node mp4.js            from the six step frames (fast, tiny)
//   node mp4.js frames/    from a directory of extracted frames (full motion)
const fs = require('fs');
const path = require('path');
const { PNG } = require(path.join(__dirname, '..', 'node_modules', 'pngjs'));
const HME = require(path.join(__dirname, '..', 'node_modules', 'h264-mp4-encoder'));

const HERE = __dirname;
const SHOTS = path.join(HERE, 'out');
const VTT = '/home/user/title-22-site/videos/title22-guided-tour.en.vtt';
const FPS = 10;
const SRC_DIR = process.argv[2] ? path.resolve(process.argv[2]) : null;

const readRgba = file => {
  const png = PNG.sync.read(fs.readFileSync(file));
  return { w: png.width, h: png.height, data: png.data };  // pngjs gives RGBA
};

// Cue timings, so the MP4 runs at exactly the pace the webm does.
function cues() {
  return fs.readFileSync(VTT, 'utf8').replace(/\r\n/g, '\n').split(/\n{2,}/)
    .filter(b => b.includes('-->') && !/^NOTE\b/.test(b))
    .map(b => {
      const lines = b.split('\n');
      const ti = lines.findIndex(l => l.includes('-->'));
      const [a, z] = lines[ti].match(/(?:\d+:)?\d{1,2}:\d{2}\.\d{1,3}/g);
      const sec = t => { const p = t.split(':'); const s = parseFloat(p.pop());
        return parseInt(p.pop() || 0, 10) * 60 + parseInt(p.pop() || 0, 10) * 3600 + s; };
      return { id: lines[ti - 1], start: sec(a), end: sec(z) };
    })
    .filter(c => c.id !== '0');
}

(async () => {
  const enc = await HME.createH264MP4Encoder();

  // A plan of [rgba buffer, how many frames to hold it] pairs.
  let plan = [], W, H;

  if (SRC_DIR) {
    const files = fs.readdirSync(SRC_DIR).filter(f => /\.png$/i.test(f)).sort();
    if (!files.length) throw new Error('no PNGs in ' + SRC_DIR);
    const first = readRgba(path.join(SRC_DIR, files[0]));
    W = first.w; H = first.h;
    plan = files.map(f => ({ file: path.join(SRC_DIR, f), hold: 1 }));
    console.log(files.length + ' extracted frames, ' + W + 'x' + H);
  } else {
    const c = cues();
    if (c.length !== 6) throw new Error('expected 6 cues, got ' + c.length);
    const first = readRgba(path.join(SHOTS, 'step-01.png'));
    W = first.w; H = first.h;
    // Lead-in before the first caption, then each step for its own duration,
    // then the tail -- the same shape as the recording.
    plan.push({ file: path.join(SHOTS, 'step-01.png'), hold: Math.round(c[0].start * FPS) });
    c.forEach((cue, i) => {
      const next = c[i + 1] ? c[i + 1].start : cue.end + 4.6;
      plan.push({ file: path.join(SHOTS, 'step-0' + (i + 1) + '.png'),
                  hold: Math.round((next - cue.start) * FPS) });
    });
    console.log('6 step frames, ' + W + 'x' + H + ', ' +
      plan.reduce((n, p) => n + p.hold, 0) + ' frames at ' + FPS + 'fps');
  }

  if (W % 2 || H % 2) throw new Error('dimensions must be even: ' + W + 'x' + H);

  enc.width = W;
  enc.height = H;
  enc.frameRate = FPS;
  enc.quantizationParameter = 26;        // visually clean for flat UI
  enc.speed = 5;
  enc.groupOfPictures = FPS * 2;         // a keyframe every 2s, so seeking works
  enc.initialize();

  let n = 0;
  const cache = new Map();
  for (const step of plan) {
    if (!cache.has(step.file)) cache.set(step.file, readRgba(step.file).data);
    const rgba = cache.get(step.file);
    for (let k = 0; k < step.hold; k++) { enc.addFrameRgba(rgba); n++; }
    if (cache.size > 8) cache.clear();
    if (n % 200 === 0) process.stdout.write('  ' + n + ' frames\r');
  }
  enc.finalize();

  const out = path.join(HERE, 'out', 'title22-guided-tour.mp4');
  fs.writeFileSync(out, Buffer.from(enc.FS.readFile(enc.outputFilename)));
  enc.delete();

  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log('\nwrote ' + out + '  ' + kb + ' KB  ' + n + ' frames  ' +
    (n / FPS).toFixed(1) + 's');
})();
