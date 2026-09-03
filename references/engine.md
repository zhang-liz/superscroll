# Engine

`engine/scrub-core.js`, `engine/scrub.js`, `engine/scrub.css` are copied into the site by `scripts/fill.mjs`. Never edit them in the site. `audit.mjs` compares hashes.

## DOM contract
`<section class="ss-hero" data-frames="N" data-lg="frames/lg" data-sm="frames/sm" data-pin="400vh">` wraps `<div class="ss-stage">` with `img.ss-poster`, `canvas.ss-canvas`, and up to 3 `[data-cue]` elements. Anything with `.ss-reveal` fades in once when 10 percent into view.

## What it does
- Picks `sm` frames under 768px or when Save-Data is on.
- Loads every 8th frame plus first and last, then the rest in idle chunks of 6. Decodes with `createImageBitmap` at draw size.
- One rAF: Lenis `autoRaf:false` driven from `gsap.ticker`, `lagSmoothing(0)`.
- ScrollTrigger pins the stage across the hero height, `scrub: 0.4`, snaps to frames. Frame index lerps at 0.2 until within 1 frame.
- Draws only when the integer frame changes. DPR capped at 2. Cover-fit.
- Pauses when the hero is off screen or the tab is hidden.
- Reduced motion: no pin, no canvas, poster and text shown.
- Exposes `window.__ss = {ready, drawn, lenis, reduced}` for `shoot.mjs`.

## brief.json shape
```json
{
  "type": "product", "look": "studio-white", "name": "Volt", "tagline": "Sneakers for night runs",
  "hook": "Built for the dark.", "context": "Made in small runs in Porto.",
  "items": [{"title": "Volt One", "text": "Reflective knit upper.", "href": "#"}],
  "peakText": "Every pair is hand checked.", "cta": {"label": "Buy", "href": "https://..."}, "contact": "hello@volt.run",
  "posterAlt": "A Volt One sneaker mid-turn on white", "accent": "#1F5EFF", "pin": "400vh",
  "dials": {"variance": 8, "motion": 6, "density": 4},
  "story": {"read": "It's the site where the shoe turns while the specs pin to it.", "beats": [{"beat": "hook", "feeling": "curiosity"}, {"beat": "context", "feeling": "trust"}, {"beat": "journey", "feeling": "want"}, {"beat": "climax", "feeling": "pride"}, {"beat": "resolution", "feeling": "ease"}]},
  "signature": "spec labels with leader lines pin to the product as it turns",
  "source": {"mode": "generate", "provider": "fal", "models": ["fal-ai/flux-pro/v1.1", "fal-ai/kling-video/v3/pro/image-to-video"], "costUsd": 0.62},
  "labels": {"WORK_TITLE": "Features"}
}
```
`labels` overrides any template placeholder by name. `frames` is read from `manifest.json` when absent.

## Pin length
`400vh` default. Under 120 frames use `320vh`. Over 150 frames use `480vh`. Long pins feel slow on trackpads; do not exceed `520vh`.
