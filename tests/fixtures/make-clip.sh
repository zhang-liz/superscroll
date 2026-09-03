#!/usr/bin/env bash
# Synthetic 1080p clip: test pattern slowly rotating, so every frame differs.
set -euo pipefail
out="${1:?usage: make-clip.sh out.mp4 [seconds]}"
sec="${2:-5}"
ffmpeg -v error -y -f lavfi -i "testsrc2=size=1920x1080:rate=25:duration=$sec" \
  -vf "rotate=0.3*t:c=black" \
  -c:v libx264 -pix_fmt yuv420p -preset veryfast "$out"
