# Verify

Run `node scripts/shoot.mjs site` then `node scripts/audit.mjs site`. Fix, run both again, stop. Two passes.

Look at `site/shots/desktop-pre.png`, `site/shots/desktop-50.png` and `site/shots/mobile-50.png` with your own eyes. Ask: does the headline fit in 2 lines. Is the poster visible before frames. Does the peak feel like the peak.

## Pre-flight checklist (paste into site/VERIFY.md, tick each)
- [ ] Design Read written and describes an experience
- [ ] Five beats, no two adjacent feelings the same
- [ ] Fingerprint differs from every past row on 4 of 6 axes
- [ ] Cost shown and approved, or file or free used
- [ ] Poster visible before frames load (shots/desktop-pre.png, shoot: poster before frames pass)
- [ ] Hero scrubs both directions with no blank frame (shoot: canvas non-blank pass)
- [ ] Frame advances with scroll (shoot: frame advances pass)
- [ ] Mobile shot readable, headline not wrapping past 3 lines
- [ ] Reduced-motion shot shows poster and text (shoot: reduced motion pass)
- [ ] audit.mjs exit 0
- [ ] Selection, caret, scrollbar, focus ring themed
- [ ] One signature move exists and is named in `brief.json`
- [ ] No 404s
- [ ] FINGERPRINTS.md row appended
Any empty box: not shipped. Say which and why.
