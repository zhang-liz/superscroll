---
name: superscroll
description: Build an Apple-style scroll-scrubbed video website from one sentence. Use when the user says superscroll, scroll-scrubbed, scroll video hero, image sequence hero, Apple-style scroll site, or wants a portfolio, product, company, or real-estate page where a video plays as you scroll. Works with a user video, photos, or generates the clip with any connected video MCP.
---

# Superscroll

One sentence in. A verified, static, scroll-scrubbed site out. Default path asks the user one thing only: a look pick plus the clip cost, in one message. Everything else is inferred.

Read `references/taste.md` before writing any HTML or CSS. Read `references/adapters.md` before any provider call. Never edit `engine/` files or their copies in the site. Never deploy or push.

## Input

`use superscroll for <subject> [video.mp4 | photo.jpg ... | folder/ | URL | @github | resume.pdf] [--free] [--custom] [--out dir]`

Type from the subject: **person** (a name plus a role), **product** (a thing with a brand), **company** (a company or service), **place** (an address, listing, venue, hotel, room). Default output folder `site/`.

## The ten steps

1. **Doctor.** Run `node scripts/doctor.mjs`. Read the `json:` line. If ffmpeg is missing, stop and print the hint. If cwebp is missing, stop and print `brew install webp`. Note which providers are live.
2. **Brief.** Parse the subject into `type`, `name`, `tagline`. Enrich silently from what was given: fetch a URL, `gh api users/<handle>` plus `gh api users/<handle>/repos?sort=updated&per_page=6`, read a resume, read README or package.json in the folder. Write `site/brief.json` in the shape `references/engine.md` shows. Unknown facts stay empty so `fill.mjs` marks them `{{TODO}}`. With `--custom`, run `references/interview.md` instead; its answers land in `site/brief.json` too, with the raw text kept under `interview`. Then continue.
3. **Story and signature.** Follow `references/story.md`: write the Design Read line, five beats with one feeling each, and name the signature move from the look. Put them in `brief.json` under `story`.
4. **Look ranking.** Read `references/looks.md`. Take the top 3 for the type. Prepare the one message: three looks with their one-line description and ASCII sketch, recommended first, plus the clip line from step 6's cost estimate. Do not send yet.
5. **Fingerprint gate.** Read `FINGERPRINTS.md`. Axes: camera, look, type pairing, hero cue pattern, section rhythm, signature move. The new build must differ from every row on at least 4 of 6. If it does not, swap the recommended look for the second one and re-check. Record the axes for later.
6. **Clip plan and the one message.** Decide the source mode per `references/adapters.md`: file, one photo, two photos, many photos, generate, or `--free`. Compute the cost line (0 for file and free). Now send the single message: looks 1 to 3, then `Clip: <provider>, <models>, <duration>. About $<cost>. Ok?`. Wait. Enter or "yes" means look 1 and yes. Parse "2, yes" style answers. A "no" on cost switches to `--free` if photos exist, else stops.
7. **Get the clip.** Run the adapter sequence. Save `source/clip.mp4`. Then `scripts/frames.sh source/clip.mp4 site`. On exit 3 or 2 follow the `hint:` line once, then stop if it fails again.
8. **Build.** Set `frames` from `site/manifest.json`, `accent` sampled from `frames/poster.webp` (pick the most saturated of 5 sampled pixels, then check it against `references/taste.md` bans; if banned, keep the look's accent). Run `node scripts/fill.mjs site/brief.json site`. Then edit only `site/index.html` and `site/styles.css` to add the signature move from the look and any copy polish. Keep every ban in `references/taste.md`.
9. **Verify, two passes max.** Run `node scripts/shoot.mjs site` and `node scripts/audit.mjs site`. Look at `site/shots/*.png`. Fix what failed. Run both once more. Stop after the second pass even if something still fails, and say what.
10. **Pre-flight and hand-off.** Fill the checklist in `references/verify.md` into `site/VERIFY.md`. If any box is empty, say "not shipped" and why. Else append the fingerprint row to `FINGERPRINTS.md`, then print: `cd site && python3 -m http.server 8080`, the URL `http://localhost:8080`, and the `todo:` lines from fill.mjs so the user knows what to edit. Never deploy. Never push.

## Rules that override everything
- One message to the user on the default path. Money always gets a yes first.
- Engine files are copied, never edited. `audit.mjs` checks the hash.
- Two verify passes, then stop.
- Honest placeholders beat invented facts. No fake stats, no fake clients.
