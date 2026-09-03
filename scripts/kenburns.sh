#!/usr/bin/env bash
# Photos -> one MP4 with slow zoom and 0.5 s crossfades. Zero AI cost.
# usage: kenburns.sh out.mp4 photo1 [photo2 ...]
set -euo pipefail
out="${1:?usage: kenburns.sh out.mp4 photo...}"; shift
[ "$#" -ge 1 ] || { echo "hint: give at least one photo" >&2; exit 1; }
SEG=5; XF=0.5; FPS=25
tmp=$(mktemp -d)
i=0
for p in "$@"; do
  # zoom 1.0 -> 1.15 over SEG seconds, centered
  ffmpeg -v error -y -loop 1 -i "$p" -t "$SEG" \
    -vf "scale=2400:-2,zoompan=z='min(zoom+0.0012,1.15)':d=$((SEG*FPS)):x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=$FPS,format=yuv420p" \
    -c:v libx264 -preset veryfast -r "$FPS" "$tmp/seg_$i.mp4"
  i=$((i+1))
done
n=$i
if [ "$n" -eq 1 ]; then cp "$tmp/seg_0.mp4" "$out"; rm -rf "$tmp"; exit 0; fi
# Build xfade chain: [0][1]xfade -> [v1]; [v1][2]xfade -> [v2] ...
inputs=(); for ((k=0;k<n;k++)); do inputs+=(-i "$tmp/seg_$k.mp4"); done
filter=""; prev="[0:v]"
for ((k=1;k<n;k++)); do
  off=$(python3 -c "print(round(($SEG-$XF)*$k,3))")
  label="[v$k]"; [ "$k" -eq $((n-1)) ] && label="[vout]"
  filter+="${prev}[$k:v]xfade=transition=fade:duration=$XF:offset=$off$label;"
  prev="$label"
done
filter="${filter%;}"
ffmpeg -v error -y "${inputs[@]}" -filter_complex "$filter" -map "[vout]" -c:v libx264 -pix_fmt yuv420p -preset veryfast -r "$FPS" "$out"
rm -rf "$tmp"
