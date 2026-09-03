#!/usr/bin/env bash
# Join clips into one 1920x1080 25 fps MP4.
# usage: concat.sh out.mp4 clip1 clip2 [...]
set -euo pipefail
out="${1:?usage: concat.sh out.mp4 clip...}"; shift
[ "$#" -ge 2 ] || { echo "hint: give at least two clips" >&2; exit 1; }
list=$(mktemp)
for c in "$@"; do printf "file '%s'\n" "$(cd "$(dirname "$c")" && pwd)/$(basename "$c")" >> "$list"; done
ffmpeg -v error -y -f concat -safe 0 -i "$list" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=25,format=yuv420p" \
  -c:v libx264 -preset veryfast -an "$out"
rm -f "$list"
