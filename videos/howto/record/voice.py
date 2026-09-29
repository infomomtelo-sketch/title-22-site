# Voices script.js with Kokoro af_heart, the voice of every other Title22
# video, run locally from the open model (kokoro-onnx). One WAV per step plus
# voice.json with each step's length, which record.js paces itself by.
#
#   python3 voice.py <dir with kokoro-v1.0.onnx and voices-v1.0.bin> <out dir>
import json, os, subprocess, sys
import soundfile as sf
from kokoro_onnx import Kokoro

model_dir, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
here = os.path.dirname(os.path.abspath(__file__))
lines = json.loads(subprocess.check_output(
    ['node', '-e', 'console.log(JSON.stringify(require(process.argv[1])))', os.path.join(here, 'script.js')]))
k = Kokoro(os.path.join(model_dir, 'kokoro-v1.0.onnx'), os.path.join(model_dir, 'voices-v1.0.bin'))
lengths = {}
for line in lines:
    samples, rate = k.create(line['say'], voice='af_heart', speed=1.0, lang='en-us')
    sf.write(os.path.join(out, line['id'] + '.wav'), samples, rate)
    lengths[line['id']] = round(len(samples) / rate, 3)
    print(line['id'], lengths[line['id']])
json.dump({'rate': rate, 'lengths': lengths}, open(os.path.join(out, 'voice.json'), 'w'), indent=1)
