// Superscroll engine. Copied into every site unchanged. Do not edit per site.
// Requires: gsap, ScrollTrigger, Lenis, SuperscrollCore loaded before this file.
(() => {
  const core = window.SuperscrollCore;
  const hero = document.querySelector('.ss-hero');
  window.__ss = { ready: false, drawn: -1, lenis: null, reduced: false };
  if (!hero || !core) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = parseInt(hero.dataset.frames, 10);
  const set = core.pickSet(window.innerWidth, navigator.connection && navigator.connection.saveData);
  const dir = hero.dataset[set] || hero.dataset.lg;
  const stage = hero.querySelector('.ss-stage');
  const canvas = hero.querySelector('canvas.ss-canvas');
  const poster = hero.querySelector('img.ss-poster');
  const cues = Array.from(hero.querySelectorAll('[data-cue]')).map(el => {
    const [a, b, c] = el.dataset.cue.split(',').map(Number);
    return { el, a, b, c };
  });

  // Section reveals, once, transform and opacity only.
  const revealIO = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.ss-reveal').forEach(el => revealIO.observe(el));

  function stillFrame() {
    hero.classList.add('ss-reduced');
    cues.forEach(c => { c.el.style.opacity = '1'; c.el.style.transform = 'none'; });
    window.__ss.reduced = true;
    window.__ss.ready = true;
  }

  if (reduced) { stillFrame(); return; }
  if (!Number.isInteger(count) || count < 2 || !stage || !canvas) {
    stillFrame();
    console.warn('superscroll: invalid data-frames or missing stage');
    return;
  }
  if (!window.gsap || !window.ScrollTrigger || !window.Lenis) {
    stillFrame();
    console.warn('superscroll: gsap, ScrollTrigger or Lenis did not load');
    return;
  }

  hero.style.height = hero.dataset.pin || '400vh';
  const ctx = canvas.getContext('2d', { alpha: false });

  // Two stores. blobs holds every fetched frame (small). bitmaps holds at most
  // WINDOW decoded frames around the current index, so memory stays bounded.
  const WINDOW = 48;
  const blobs = new Array(count).fill(null);
  const bitmaps = new Map();
  const pending = new Map();
  let sourceW = parseInt(hero.dataset[set + 'W'], 10);
  let cur = 0, target = 0, drawn = -1, ticking = true, w = 0, h = 0;

  const src = i => `${dir}/frame-${core.padFrame(i)}.webp`;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  // Never upscale: cap the decode width at the real source width.
  const decodeWidth = () => {
    const want = Math.ceil(w * dpr());
    if (!Number.isFinite(sourceW) || sourceW <= 0) return 0;
    return Math.max(1, Math.min(sourceW, want || sourceW));
  };
  const blobToImage = b => new Promise((res, rej) => {
    const im = new Image();
    const u = URL.createObjectURL(b);
    im.onload = () => { URL.revokeObjectURL(u); res(im); };
    im.onerror = e => { URL.revokeObjectURL(u); rej(e); };
    im.src = u;
  });

  async function fetchBlob(i) {
    if (blobs[i]) return blobs[i];
    const r = await fetch(src(i));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    blobs[i] = await r.blob();
    return blobs[i];
  }
  async function load(i) {
    try { await fetchBlob(i); } catch (e) { console.warn('superscroll: frame', i, e.message); }
  }
  function evict() {
    while (bitmaps.size > WINDOW) {
      const c = Math.round(cur);
      let worst = -1, dist = -1;
      for (const k of bitmaps.keys()) { const d = Math.abs(k - c); if (d > dist) { dist = d; worst = k; } }
      if (worst < 0) break;
      const f = bitmaps.get(worst);
      bitmaps.delete(worst);
      if (f && typeof f.close === 'function') f.close();
    }
  }
  function ensureDecoded(i) {
    if (i < 0 || i >= count) return null;
    if (bitmaps.has(i)) return null;
    if (pending.has(i)) return pending.get(i);
    const p = (async () => {
      try {
        const b = await fetchBlob(i);
        let f;
        if ('createImageBitmap' in window) {
          const dw = decodeWidth();
          f = dw ? await createImageBitmap(b, { resizeWidth: dw, resizeQuality: 'high' }) : await createImageBitmap(b);
          // First decode teaches us the real source width when the markup did not.
          if (!Number.isFinite(sourceW) || sourceW <= 0) sourceW = f.width;
        } else {
          f = await blobToImage(b);
          if (!Number.isFinite(sourceW) || sourceW <= 0) sourceW = f.naturalWidth || f.width;
        }
        bitmaps.set(i, f);
        evict();
        if (drawn < 0 || i === Math.round(cur)) draw(true);
      } catch (e) { console.warn('superscroll: frame', i, e.message); }
      finally { pending.delete(i); }
    })();
    pending.set(i, p);
    return p;
  }
  // Decode a window around the target, nearest first, never awaited in the ticker.
  function scheduleWindow(t) {
    const lo = Math.max(0, t - 8), hi = Math.min(count - 1, t + 16);
    const order = [];
    for (let i = lo; i <= hi; i++) order.push(i);
    order.sort((a, b) => Math.abs(a - t) - Math.abs(b - t));
    for (const i of order) ensureDecoded(i);
  }
  function windowReady(t) {
    const lo = Math.max(0, t - 8), hi = Math.min(count - 1, t + 16);
    for (let i = lo; i <= hi; i++) if (!bitmaps.has(i)) return false;
    return true;
  }
  function nearest(i) {
    for (let d = 0; d < count; d++) { if (bitmaps.has(i - d)) return i - d; if (bitmaps.has(i + d)) return i + d; }
    return -1;
  }
  function resize() {
    const s = dpr();
    w = stage.clientWidth; h = stage.clientHeight;
    canvas.width = Math.round(w * s); canvas.height = Math.round(h * s);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    // Decode width changed, so every cached bitmap is the wrong size now.
    for (const f of bitmaps.values()) if (f && typeof f.close === 'function') f.close();
    bitmaps.clear();
    drawn = -1;
    scheduleWindow(Math.round(cur));
    draw(true);
  }
  function draw(force) {
    const i = Math.round(cur);
    if (!force && i === drawn) return;
    const j = nearest(i);
    if (j < 0) return;
    const f = bitmaps.get(j);
    const fw = f.naturalWidth || f.width, fh = f.naturalHeight || f.height;
    const r = core.coverRect(fw, fh, w, h);
    ctx.drawImage(f, r.x, r.y, r.w, r.h);
    drawn = i; window.__ss.drawn = i;
    if (poster && poster.style.opacity !== '0') poster.style.opacity = '0';
  }
  function cue(p) {
    for (const c of cues) {
      let o;
      if (p < c.a) o = 0;
      else if (c.b <= c.a) o = 1;
      else if (p < c.b) o = (p - c.a) / (c.b - c.a);
      else if (c.c <= c.b || p < c.c) o = 1;
      else o = Math.max(0, 1 - (p - c.c) / 0.12);
      c.el.style.opacity = String(o);
      c.el.style.transform = `translateY(${((1 - o) * 24).toFixed(2)}px)`;
    }
  }

  // Scroll wiring: one rAF, Lenis driven by gsap.ticker.
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
  window.__ss.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => { lenis.raf(t * 1000); if (!ticking) return; cur = core.lerpIndex(cur, target, 0.2); draw(false); });
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom bottom',
    pin: stage, pinSpacing: false, scrub: 0.4,
    snap: { snapTo: count > 1 ? 1 / (count - 1) : 1, duration: 0.1, ease: 'none' },
    onUpdate: st => {
      const t = core.frameForProgress(st.progress, count);
      if (t !== target) { target = t; scheduleWindow(t); }
      cue(st.progress);
    },
    onRefresh: () => resize(),
  });

  // Pause when hero is out of view or tab hidden.
  new IntersectionObserver(es => { ticking = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', () => { ticking = !document.hidden; });
  window.addEventListener('resize', resize);

  // Staged preload of blobs: every 8th frame plus first and last, then the rest in idle chunks.
  resize();
  const { first, rest } = core.stagedOrder(count, 8);
  const idle = window.requestIdleCallback ? (fn => window.requestIdleCallback(fn, { timeout: 500 })) : (fn => setTimeout(fn, 40));
  Promise.all(first.map(load)).then(async () => {
    scheduleWindow(Math.round(cur));
    await Promise.all([...pending.values()]);
    if (!windowReady(Math.round(cur))) { scheduleWindow(Math.round(cur)); await Promise.all([...pending.values()]); }
    window.__ss.ready = true;
    let k = 0;
    const chunk = () => {
      const slice = rest.slice(k, k + 6); k += 6;
      Promise.all(slice.map(load)).then(() => { if (k < rest.length) idle(chunk); });
    };
    idle(chunk);
  });
})();
