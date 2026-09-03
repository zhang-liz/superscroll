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

  if (reduced) {
    hero.classList.add('ss-reduced');
    cues.forEach(c => { c.el.style.opacity = '1'; c.el.style.transform = 'none'; });
    window.__ss.reduced = true;
    window.__ss.ready = true;
    return;
  }

  hero.style.height = hero.dataset.pin || '400vh';
  const ctx = canvas.getContext('2d', { alpha: false });
  const frames = new Array(count).fill(null);
  let cur = 0, target = 0, drawn = -1, ticking = true, w = 0, h = 0;

  const src = i => `${dir}/frame-${core.padFrame(i)}.webp`;
  const blobToImage = b => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(b); });
  async function load(i) {
    if (frames[i]) return;
    try {
      const r = await fetch(src(i));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const b = await r.blob();
      const targetW = Math.round(w * Math.min(window.devicePixelRatio || 1, 2)) || undefined;
      frames[i] = ('createImageBitmap' in window)
        ? await createImageBitmap(b, targetW ? { resizeWidth: targetW, resizeQuality: 'high' } : {})
        : await blobToImage(b);
      if (drawn < 0 || i === Math.round(cur)) draw(true);
    } catch (e) { console.warn('superscroll: frame', i, e.message); }
  }
  function nearest(i) {
    for (let d = 0; d < count; d++) { if (frames[i - d]) return i - d; if (frames[i + d]) return i + d; }
    return -1;
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = stage.clientWidth; h = stage.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(true);
  }
  function draw(force) {
    const i = Math.round(cur);
    if (!force && i === drawn) return;
    const j = nearest(i);
    if (j < 0) return;
    const f = frames[j];
    const r = core.coverRect(f.width, f.height, w, h);
    ctx.drawImage(f, r.x, r.y, r.w, r.h);
    drawn = i; window.__ss.drawn = i;
    if (poster && poster.style.opacity !== '0') poster.style.opacity = '0';
  }
  function cue(p) {
    for (const c of cues) {
      let o;
      if (p < c.a) o = 0;
      else if (p < c.b) o = (p - c.a) / (c.b - c.a);
      else if (p < c.c) o = 1;
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
    snap: { snapTo: 1 / (count - 1), duration: 0.1, ease: 'none' },
    onUpdate: st => { target = core.frameForProgress(st.progress, count); cue(st.progress); },
    onRefresh: () => resize(),
  });

  // Pause when hero is out of view or tab hidden.
  new IntersectionObserver(es => { ticking = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', () => { ticking = !document.hidden; });
  window.addEventListener('resize', resize);

  // Staged preload: every 8th frame plus first and last, then the rest in idle chunks.
  resize();
  const { first, rest } = core.stagedOrder(count, 8);
  const idle = window.requestIdleCallback ? (fn => window.requestIdleCallback(fn, { timeout: 500 })) : (fn => setTimeout(fn, 40));
  Promise.all(first.map(load)).then(() => {
    window.__ss.ready = true;
    let k = 0;
    const chunk = () => {
      const slice = rest.slice(k, k + 6); k += 6;
      Promise.all(slice.map(load)).then(() => { if (k < rest.length) idle(chunk); });
    };
    idle(chunk);
  });
})();
