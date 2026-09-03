#!/usr/bin/env bash
# MP4 -> WebP frame sets + poster + manifest.json
# usage: frames.sh clip.mp4 sitedir   (env SS_FRAMES=140 target count)
set -euo pipefail
in="${1:?usage: frames.sh clip.mp4 sitedir}"
out="${2:?usage: frames.sh clip.mp4 sitedir}"
target="${SS_FRAMES:-140}"
command -v ffmpeg >/dev/null || { echo "hint: install ffmpeg (brew install ffmpeg)" >&2; exit 4; }
command -v cwebp >/dev/null || { echo "hint: brew install webp" >&2; exit 4; }
command -v python3 >/dev/null || { echo "hint: install python3" >&2; exit 4; }

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
fps=$(python3 -c 'import sys;d=float(sys.argv[1]);t=float(sys.argv[2]);print(round(max(1.0,min(30.0,t/d)),3))' "$dur" "$target")

rm -rf "$out/frames"
mkdir -p "$out/frames/lg" "$out/frames/sm" "$out/.tmp"
ffmpeg -v error -y -i "$in" -vf "fps=$fps,scale=1600:-2" -c:v png "$out/.tmp/lg-%04d.png"
ffmpeg -v error -y -i "$in" -vf "fps=$fps,scale=850:-2"  -c:v png "$out/.tmp/sm-%04d.png"

for png in "$out/.tmp"/lg-*.png; do
  num=$(basename "$png" .png | sed 's/lg-//')
  cwebp -q 80 "$png" -o "$out/frames/lg/frame-$num.webp" >/dev/null
done
for png in "$out/.tmp"/sm-*.png; do
  num=$(basename "$png" .png | sed 's/sm-//')
  cwebp -q 80 "$png" -o "$out/frames/sm/frame-$num.webp" >/dev/null
done
rm -rf "$out/.tmp"

count=$(find "$out/frames/lg" -name 'frame-*.webp' | wc -l | tr -d ' ')
if [ "$count" -lt 100 ] || [ "$count" -gt 160 ]; then
  echo "hint: got $count frames from ${dur}s at fps=$fps. Set SS_FRAMES between 100 and 160, or trim the clip to 4-8 s." >&2
  exit 3
fi
mid=$(printf '%04d' $(( (count + 1) / 2 )))
cp "$out/frames/lg/frame-$mid.webp" "$out/frames/poster.webp"

python3 - "$out" "$count" "$fps" <<'PY'
import json, os, subprocess, sys
out, count, fps = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
def dims(p):
    r = subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip().split(',')
    return int(r[0]), int(r[1])
def total(d):
    return sum(os.path.getsize(os.path.join(d,f)) for f in os.listdir(d) if f.endswith('.webp'))
lg, sm = os.path.join(out,'frames','lg'), os.path.join(out,'frames','sm')
lw, lh = dims(os.path.join(lg,'frame-0001.webp')); sw, sh = dims(os.path.join(sm,'frame-0001.webp'))
m = {"count": count, "fps": fps, "lg": {"w": lw, "h": lh, "bytes": total(lg)}, "sm": {"w": sw, "h": sh, "bytes": total(sm)}, "poster": "frames/poster.webp"}
json.dump(m, open(os.path.join(out,'manifest.json'),'w'), indent=2)
if m["lg"]["bytes"] > 6*1024*1024 or m["sm"]["bytes"] > 3*1024*1024:
    print(f"hint: frames too heavy (lg {m['lg']['bytes']//1024} KB, sm {m['sm']['bytes']//1024} KB). Lower SS_FRAMES to 110 or shorten the clip.", file=sys.stderr)
    sys.exit(2)
print(json.dumps(m))
PY
