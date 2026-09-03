// Superscroll core helpers. Pure functions. No DOM. Loaded before scrub.js.
(function (root) {
  function coverRect(sw, sh, dw, dh) {
    const s = Math.max(dw / sw, dh / sh);
    const w = sw * s, h = sh * s;
    return { x: (dw - w) / 2, y: (dh - h) / 2, w, h };
  }
  function stagedOrder(count, step) {
    step = step || 8;
    const first = [], seen = new Set();
    for (let i = 0; i < count; i += step) { first.push(i); seen.add(i); }
    if (count > 0 && !seen.has(count - 1)) { first.push(count - 1); seen.add(count - 1); }
    const rest = [];
    for (let i = 0; i < count; i++) if (!seen.has(i)) rest.push(i);
    return { first, rest };
  }
  function frameForProgress(p, count) {
    p = Math.min(1, Math.max(0, p));
    return Math.round(p * (count - 1));
  }
  function lerpIndex(cur, target, k) {
    k = k == null ? 0.2 : k;
    const d = target - cur;
    if (Math.abs(d) <= 1) return target;
    return cur + d * k;
  }
  function pickSet(width, saveData) {
    return (saveData || width < 768) ? 'sm' : 'lg';
  }
  function padFrame(i, width) {
    return String(i + 1).padStart(width || 4, '0');
  }
  root.SuperscrollCore = { coverRect, stagedOrder, frameForProgress, lerpIndex, pickSet, padFrame };
})(typeof globalThis !== 'undefined' ? globalThis : this);
