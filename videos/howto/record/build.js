// Turns record.js's output into docs.mp4: the app frames on top (1080x1620),
// the caption band underneath (1080x300), and the narration placed at the
// moment each step began. H.264 High + AAC, moov first, like the other clips.
//
//   FFMPEG=<ffmpeg with libx264 and aac> node build.js <voice dir> <rec dir> <out.mp4>
// (pip install imageio-ffmpeg gives one; its path is
//  python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FF = process.env.FFMPEG || 'ffmpeg';
const [VOICE_DIR, REC, OUT_MP4] = process.argv.slice(2);
const tl = JSON.parse(fs.readFileSync(path.join(REC, 'timeline.json'), 'utf8'));
const steps = tl.steps;

const args = ['-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', path.join(REC, 'frames.txt')];
steps.forEach(s => args.push('-i', path.join(REC, 'band-' + s.id + '.png')));
steps.forEach(s => args.push('-i', path.join(VOICE_DIR, s.id + '.wav')));

const n = steps.length;
let f = `[0:v]fps=30,scale=1080:1620:flags=lanczos,pad=1080:1920:0:0:color=0x123a30,format=yuv420p[v0];`;
steps.forEach((s, i) => {
  const end = i + 1 < n ? steps[i + 1].t : tl.total;
  f += `[v${i}][${i + 1}:v]overlay=0:1620:enable='between(t,${s.t.toFixed(3)},${end.toFixed(3)})'[v${i + 1}];`;
});
steps.forEach((s, i) => {
  const ms = Math.round((s.t + 0.15) * 1000);
  f += `[${n + 1 + i}:a]adelay=${ms}|${ms},aresample=48000[a${i}];`;
});
f += steps.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${n}:normalize=0:duration=longest,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad[aout]`;

args.push('-filter_complex', f, '-map', `[v${n}]`, '-map', '[aout]',
  '-t', tl.total.toFixed(3),
  '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-g', '60',
  '-c:a', 'aac', '-b:a', '128k', '-ar', '48000',
  '-movflags', '+faststart', OUT_MP4);
execFileSync(FF, args, { stdio: 'inherit' });

// Poster: the review sheet, two and a half seconds into that step.
const rv = steps.find(s => s.id === 'review');
const poster = OUT_MP4.replace(/\.mp4$/, '-poster.jpg');
execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-ss', (rv.t + 2.5).toFixed(2), '-i', OUT_MP4,
  '-frames:v', '1', '-q:v', '3', poster], { stdio: 'inherit' });
console.log('wrote ' + OUT_MP4 + ' (' + Math.round(fs.statSync(OUT_MP4).size / 1024) + ' KB, ' + tl.total.toFixed(1) + 's) and ' + poster);
