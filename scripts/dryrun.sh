#!/usr/bin/env bash
# End-to-end with a synthetic clip. usage: dryrun.sh workdir
set -euo pipefail
work="${1:?usage: dryrun.sh workdir}"
skill="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$work/source" "$work/site"
"$skill/tests/fixtures/make-clip.sh" "$work/source/clip.mp4" 5
cat > "$work/site/brief.json" <<'JSON'
{"type":"product","look":"studio-white","name":"Volt","tagline":"Sneakers for night runs",
 "hook":"Built for the dark.","context":"Made in small runs in Porto. Reflective knit, no logos.",
 "items":[{"title":"Volt One","text":"Reflective knit upper, 210 g.","href":"#"},{"title":"Volt Trail","text":"Lugged sole for wet nights.","href":"#"},{"title":"Volt Sock","text":"The liner that started it.","href":"#"}],
 "peakText":"Every pair is checked by hand before it ships.","cta":{"label":"Get one","href":"#contact"},"contact":"hello@volt.run",
 "posterAlt":"A Volt One sneaker mid-turn on white","pin":"400vh",
 "dials":{"variance":8,"motion":6,"density":4},
 "story":{"read":"It's the site where the shoe turns while the specs pin to it.","beats":[{"beat":"hook","feeling":"curiosity"},{"beat":"context","feeling":"trust"},{"beat":"journey","feeling":"want"},{"beat":"climax","feeling":"pride"},{"beat":"resolution","feeling":"ease"}]},
 "signature":"spec labels with leader lines pin to the product as it turns",
 "source":{"mode":"file","provider":"none","models":[],"costUsd":0}}
JSON
"$skill/scripts/frames.sh" "$work/source/clip.mp4" "$work/site" >/dev/null
node "$skill/scripts/fill.mjs" "$work/site/brief.json" "$work/site"
ok=1
node "$skill/scripts/shoot.mjs" "$work/site" || ok=0
node "$skill/scripts/audit.mjs" "$work/site" || ok=0
if [ "$ok" -eq 1 ]; then echo "dryrun: PASS"; else echo "dryrun: FAIL"; exit 1; fi
