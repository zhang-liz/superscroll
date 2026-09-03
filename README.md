# superscroll

One sentence in. An Apple-style scroll-scrubbed site out.

## Install
git clone <this repo> ~/.claude/skills/superscroll
Restart Claude Code. Needs ffmpeg and Node 20+:
brew install ffmpeg webp
cwebp is required because ffmpeg on macOS often lacks a WebP encoder; `scripts/frames.sh` uses cwebp.

Then install the Node dependencies and the Playwright browser used by `scripts/shoot.mjs`:
cd ~/.claude/skills/superscroll && npm i && npx playwright install chromium
(`shoot.mjs` can also install Playwright on demand, but running this once up front is faster.)

## Use
use superscroll for my sneaker brand Volt
use superscroll for the listing at 12 Oak St ~/Photos/oak/*.jpg
use superscroll for me, Liz, product designer ~/Desktop/me.mp4

Optional: a video, photos, a URL, a GitHub handle, a resume, `--free` (no AI calls), `--custom` (8 questions).

## Video source
Any connected video MCP. Cheapest first: fal, Replicate, Runway, Higgsfield, Blender. Setup for fal:
claude mcp add --transport http fal-ai https://mcp.fal.ai/mcp --header "Authorization: Bearer $FAL_KEY"

## Test
npm test

MIT.
