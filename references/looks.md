# Looks

Six tested looks. Each is a JSON block that `scripts/fill.mjs` reads. Claude ranks them per site type and shows the top 3. Never invent a seventh look during a build; change tokens only inside a look's `accent`, which is sampled from the poster frame.

Ranking by type: person -> noir-editorial, paper-poster, warm-gallery. product -> studio-white, neon-signal, noir-editorial. company -> brutal-mono, neon-signal, paper-poster. place -> warm-gallery, noir-editorial, studio-white.

## noir-editorial
Dark. High-contrast serif display. Hairline rules draw in with scroll. Film grain overlay.
```
+--------------------------+
| ▓▓▓ video ▓▓▓  Big Serif |
| ────────── thin rule ─── |
|  small caps  •  grain    |
+--------------------------+
```
```json
{"id":"noir-editorial","mode":"dark","fonts":{"display":"Cormorant Garamond","displayWeight":500,"body":"Geist","link":"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Geist:wght@400;500&display=swap"},
 "tokens":{"bg":"#0E0F12","fg":"#ECE9E3","muted":"#9A978F","accent":"#C8B8A0","rule":"#2A2C31"},
 "hero":{"cueHook":"0.04,0.30,0.55","cueSub":"0.12,0.38,0.60"},
 "signature":"hairline rules draw across the page as you scroll, film grain on the hero",
 "grain":true}
```

## studio-white
Light, near-white, tight grotesk. The product floats, spec labels pin to it.
```
+--------------------------+
|   [ product on white ]   |
|  weight 210g ──┐         |
|  drop 8mm  ────┘  Manrope|
+--------------------------+
```
```json
{"id":"studio-white","mode":"light","fonts":{"display":"Manrope","displayWeight":700,"body":"Manrope","link":"https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap"},
 "tokens":{"bg":"#F7F7F5","fg":"#111214","muted":"#6B6D71","accent":"#1F5EFF","rule":"#E3E3DF"},
 "hero":{"cueHook":"0.05,0.28,0.50","cueSub":"0.14,0.36,0.56"},
 "signature":"spec labels with leader lines pin to the product as it turns",
 "grain":false}
```

## brutal-mono
Mono headings, raw grid lines, high contrast. A marquee of tools or clients.
```
+--------------------------+
|| VOLT_  ||  mono  || 01 ||
||--------||--------||----||
|| ==== marquee ==== >>>  ||
+--------------------------+
```
```json
{"id":"brutal-mono","mode":"light","fonts":{"display":"JetBrains Mono","displayWeight":700,"body":"JetBrains Mono","link":"https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"},
 "tokens":{"bg":"#F2F2EE","fg":"#101010","muted":"#5C5C58","accent":"#FF3B1F","rule":"#101010"},
 "hero":{"cueHook":"0.03,0.25,0.50","cueSub":"0.10,0.32,0.55"},
 "signature":"visible 1px grid lines and a slow marquee of stack or clients",
 "grain":false}
```

## warm-gallery
Off-white, deep ink text, serif. Gallery captions with small numerals.
```
+--------------------------+
|  01  [ photo ]   Garamond|
|      caption, small      |
|  02  [ photo ]           |
+--------------------------+
```
```json
{"id":"warm-gallery","mode":"light","fonts":{"display":"EB Garamond","displayWeight":500,"body":"Source Sans 3","link":"https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=swap"},
 "tokens":{"bg":"#F5F2EC","fg":"#1C1B18","muted":"#6F6B62","accent":"#2F5D50","rule":"#DDD8CE"},
 "hero":{"cueHook":"0.05,0.30,0.55","cueSub":"0.14,0.38,0.60"},
 "signature":"numbered gallery captions that slide in from the margin",
 "grain":false}
```

## neon-signal
Dark. Wide grotesk, big numerals, one saturated accent, kinetic headline.
```
+--------------------------+
|  UNBOUNDED  ▌▌▌  0 1 0 2 |
|  ▓▓ video ▓▓   [accent]  |
|  headline words stagger  |
+--------------------------+
```
```json
{"id":"neon-signal","mode":"dark","fonts":{"display":"Unbounded","displayWeight":700,"body":"Geist","link":"https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700&family=Geist:wght@400;500&display=swap"},
 "tokens":{"bg":"#0B0B0D","fg":"#F4F4F2","muted":"#8C8C90","accent":"#C6FF3D","rule":"#26262A"},
 "hero":{"cueHook":"0.03,0.22,0.48","cueSub":"0.10,0.30,0.54"},
 "signature":"headline words stagger in per word, big section numerals count as you scroll",
 "grain":false}
```

## paper-poster
Light. Oversized display type is the hero. Video is masked inside the letters.
```
+--------------------------+
| ██  ██ ████ ██  (video   |
| ██  ██ ██   ██   inside) |
|  small line under        |
+--------------------------+
```
```json
{"id":"paper-poster","mode":"light","fonts":{"display":"Bricolage Grotesque","displayWeight":800,"body":"Geist","link":"https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;800&family=Geist:wght@400;500&display=swap"},
 "tokens":{"bg":"#F4F4F0","fg":"#141414","muted":"#66665F","accent":"#0044FF","rule":"#D9D9D3"},
 "hero":{"cueHook":"0.02,0.20,0.50","cueSub":"0.10,0.30,0.55"},
 "signature":"the name is set huge and the scrubbing video shows through the letters",
 "grain":false}
```
