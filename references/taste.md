# Taste

Read before writing HTML or CSS. These are checkable. `scripts/audit.mjs` enforces the ones marked (audit).

## Bans
- Inter as any font. (audit) Serif as a reflex default for "premium". A look decides the font, not the brief.
- System display faces in headings: Impact, Arial Black, Arial, Helvetica Neue. (audit)
- AI purple: hues 255 to 300 with saturation over 40 percent in tokens. (audit) Purple only if the brief names it; then run audit with `--allow-purple`.
- Cream plus brass plus espresso. (audit) It makes every brand look the same.
- Pure black `#000`. (audit) Use the look's near-black.
- Three equal feature cards, nested cards, a card grid as the page structure. (audit for three identical `.card`)
- Kicker or eyebrow text above a heading. (audit)
- Gradient text. Colored `border-left` thicker than 1px. Hard offset shadows unless the look is brutal-mono.
- Emoji as icons. Typewriter text. Dark-mode toggle. Unskippable intro. Percentage skill bars.
- Invented numbers: no "4.1x", "92 percent", "48k users" unless the user gave them.
- Banned words in copy: delve, leverage, utilize, robust, cutting-edge, seamless, elevate, empower, streamline, game changer, transformative, unlock, harness, supercharge. (audit)
- Motion: `transition: all`, `ease-in`, `scale(0)`, animating anything but opacity and transform. (audit)
- Scroll hijack outside the pinned hero. Sections below scroll natively.

## Rules
- One orchestrated moment: the hero scrub. Sections below get one quiet reveal each, 400 ms, once.
- Spend boldness in one place: the signature move from the look. Then remove one accessory before shipping.
- Headline fits in 2 lines at 1440px. A 3-line hero headline is a font-size error.
- More space above a heading than below it.
- Body contrast 4.5:1 or better on the look's bg. Muted text also 4.5:1. (audit)
- Theme the browser surfaces: `::selection`, `caret-color`, `scrollbar-color`, `:focus-visible`. The template does this; keep it.
- Poster image has real `alt`, `width`, `height`, `fetchpriority="high"`. (audit)
- Reduced motion: poster and text, no pin, gentle 200 ms reveals. (audit)
- Transform and opacity only, 60 fps on a 2020 phone. No blur filters on moving elements.

## Dials
VARIANCE (how far from a safe layout), MOTION (how much moves), DENSITY (how tight). Defaults 8 / 6 / 4. Write them in `brief.json` under `dials`. VARIANCE under 5 means: no signature move beyond the scrub. MOTION over 7 means: also stagger headline words in the hero. DENSITY over 6 means: tighter band padding (12vh) and smaller lede.

## Accent sampling
Sample 5 pixels of `frames/poster.webp` (center and four thirds). Pick the most saturated. If its hue is in a banned range or its contrast with the look's bg is under 3:1, keep the look's own accent.
