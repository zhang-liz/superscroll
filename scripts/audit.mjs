#!/usr/bin/env node
// Deterministic slop, budget, a11y and engine checks. Usage: node scripts/audit.mjs sitedir [--allow-purple]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const BANNED_WORDS = ['delve', 'leverage', 'utilize', 'robust', 'cutting-edge', 'seamless', 'elevate', 'empower', 'streamline', 'game changer', 'transformative', 'unlock', 'harness', 'supercharge'];

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
function scan(text, re, fn) { for (const m of text.matchAll(re)) fn(m, lineOf(text, m.index)); }
// split a CSS value list on top-level commas only, ignoring commas nested inside parens (e.g. cubic-bezier(...))
function splitTopLevel(str, sep) {
  const out = []; let depth = 0, cur = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
}

function hexToHsl(hex) {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2; let hue = 0, s = 0;
  if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hue = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? ((b - r) / d + 2) : ((r - g) / d + 4); hue *= 60; }
  return { h: hue, s, l };
}
function luminance(hex) {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(parseInt(h.slice(0, 2), 16)) + 0.7152 * f(parseInt(h.slice(2, 4), 16)) + 0.0722 * f(parseInt(h.slice(4, 6), 16));
}
export function contrast(a, b) { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

export function audit(site, opts = {}) {
  const skillDir = opts.skillDir || dirname(dirname(fileURLToPath(import.meta.url)));
  const F = [];
  const add = (file, line, rule, msg) => F.push({ file, line, rule, msg });
  const read = f => (existsSync(join(site, f)) ? readFileSync(join(site, f), 'utf8') : '');
  const html = read('index.html'), css = read('styles.css');

  // fonts
  scan(css, /font-family[^;]*\bInter\b/g, (m, l) => add('styles.css', l, 'font-inter', 'Inter is banned'));
  scan(css, /--ss-font-display:\s*"?Inter/g, (m, l) => add('styles.css', l, 'font-inter', 'Inter is banned'));
  scan(css, /font-family[^;]*\b(Impact|Arial Black|Helvetica Neue|Arial)\b/g, (m, l) => add('styles.css', l, 'font-system-display', `system display face ${m[1]}`));

  // colors
  scan(css, /#000\b(?!0)/g, (m, l) => add('styles.css', l, 'color-black', 'pure black, use a near-black with air'));
  scan(css, /#000000\b/g, (m, l) => add('styles.css', l, 'color-black', 'pure black'));
  const tokens = [...css.matchAll(/--ss-[a-z]+:\s*(#[0-9a-fA-F]{3,6})/g)].map(m => ({ hex: m[1], line: lineOf(css, m.index) }));
  if (!opts.allowPurple) for (const t of tokens) { const { h, s } = hexToHsl(t.hex); if (h >= 255 && h <= 300 && s > 0.4) add('styles.css', t.line, 'color-purple', `AI purple ${t.hex}`); }
  const cream = tokens.find(t => { const { h, s, l } = hexToHsl(t.hex); return l > 0.88 && h >= 25 && h <= 65 && s >= 0.15; });
  const brass = tokens.find(t => { const { h, s, l } = hexToHsl(t.hex); return l > 0.35 && l < 0.65 && h >= 25 && h <= 50 && s >= 0.3; });
  if (cream && brass) add('styles.css', brass.line, 'color-cream-brass', `cream ${cream.hex} plus brass ${brass.hex} is the premium-consumer trap`);

  // css motion
  scan(css, /transition:\s*all\b/g, (m, l) => add('styles.css', l, 'css-transition-all', 'list properties explicitly'));
  scan(css, /\bease-in\b(?!-out)/g, (m, l) => add('styles.css', l, 'css-ease-in', 'never ease-in on UI'));
  scan(css, /scale\(\s*0\s*\)/g, (m, l) => add('styles.css', l, 'css-scale-zero', 'nothing appears from nothing'));
  scan(css, /transition:\s*([^;]+);/g, (m, l) => {
    for (const part of splitTopLevel(m[1], ',')) { const prop = part.trim().split(/\s+/)[0]; if (!['opacity', 'transform', 'none', 'all'].includes(prop)) add('styles.css', l, 'css-transition-prop', `only opacity and transform, got ${prop}`); }
  });

  // html
  scan(html, /<img[^>]*class="[^"]*ss-poster[^"]*"[^>]*>/g, (m, l) => {
    for (const a of ['alt', 'width', 'height']) if (!new RegExp(`\\s${a}="[^"]+"`).test(m[0])) add('index.html', l, 'html-poster-attrs', `poster needs ${a}`);
  });
  scan(html, /<canvas[^>]*>/g, (m, l) => { if (!/aria-hidden="true"/.test(m[0])) add('index.html', l, 'html-canvas-hidden', 'canvas needs aria-hidden="true"'); });
  scan(html, /<button[^>]*>([\s\S]*?)<\/button>/g, (m, l) => { if (!/aria-label=/.test(m[0]) && m[1].replace(/<[^>]+>/g, '').trim() === '') add('index.html', l, 'html-icon-button', 'icon button needs aria-label'); });
  scan(html, /class="[^"]*\b(kicker|eyebrow)\b[^"]*"/g, (m, l) => add('index.html', l, 'html-kicker', 'no kicker above headings'));
  scan(html, /<(div|section)[^>]*>((?:\s*<div class="card">[\s\S]*?<\/div>\s*){3,})<\/\1>/g, (m, l) => add('index.html', l, 'html-three-cards', 'three identical cards is the AI page tell'));
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  for (const w of BANNED_WORDS) scan(html, new RegExp(`\\b${w}\\b`, 'gi'), (m, l) => { if (text.toLowerCase().includes(w)) add('index.html', l, 'copy-banned-word', `banned word "${w}"`); });
  scan(html, /\{\{TODO[^}]*\}\}/g, (m, l) => add('index.html', l, 'copy-todo', `placeholder ${m[0]}`));

  // budgets
  const size = d => (existsSync(d) ? readdirSync(d).filter(f => f.endsWith('.webp')).reduce((s, f) => s + statSync(join(d, f)).size, 0) : 0);
  const cnt = d => (existsSync(d) ? readdirSync(d).filter(f => f.endsWith('.webp')).length : 0);
  const lg = join(site, 'frames', 'lg'), sm = join(site, 'frames', 'sm');
  const n = cnt(lg);
  if (n < 100 || n > 160) add('frames/lg', 1, 'budget-count', `${n} frames, want 100 to 160`);
  if (size(lg) > 6 * 1024 * 1024) add('frames/lg', 1, 'budget-lg', `${Math.round(size(lg) / 1024)} KB over 6 MB`);
  if (size(sm) > 3 * 1024 * 1024) add('frames/sm', 1, 'budget-sm', `${Math.round(size(sm) / 1024)} KB over 3 MB`);
  const df = html.match(/data-frames="(\d+)"/); if (df && n && parseInt(df[1], 10) !== n) add('index.html', lineOf(html, df.index), 'budget-count', `data-frames ${df[1]} but ${n} files`);

  // a11y
  const tk = k => { const m = css.match(new RegExp(`--ss-${k}:\\s*(#[0-9a-fA-F]{3,6})`)); return m ? { hex: m[1], line: lineOf(css, m.index) } : null; };
  const bg = tk('bg'), fg = tk('fg'), muted = tk('muted'), accent = tk('accent');
  if (bg && fg && contrast(bg.hex, fg.hex) < 4.5) add('styles.css', fg.line, 'a11y-contrast', `fg on bg is ${contrast(bg.hex, fg.hex).toFixed(2)}:1, want 4.5`);
  if (bg && muted && contrast(bg.hex, muted.hex) < 4.5) add('styles.css', muted.line, 'a11y-contrast', `muted on bg is ${contrast(bg.hex, muted.hex).toFixed(2)}:1, want 4.5`);
  // accent drives selection and the focus ring, so it needs 3:1 against the page
  if (bg && accent && contrast(bg.hex, accent.hex) < 3) add('styles.css', accent.line, 'a11y-contrast', `accent on bg is ${contrast(bg.hex, accent.hex).toFixed(2)}:1, want 3`);
  if (!/prefers-reduced-motion/.test(css + read('scrub.css'))) add('styles.css', 1, 'a11y-reduced-motion', 'no reduced-motion rules');

  // engine hash
  for (const f of ['scrub.js', 'scrub-core.js', 'scrub.css']) {
    const a = join(site, f), b = join(skillDir, 'engine', f);
    if (!existsSync(a)) { add(f, 1, 'engine-hash', 'missing engine file'); continue; }
    const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
    if (existsSync(b) && sha(a) !== sha(b)) add(f, 1, 'engine-hash', 'engine file was edited, copy it back from the skill');
  }
  return { findings: F, ok: F.length === 0 };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const site = process.argv[2]; if (!site) { console.error('usage: audit.mjs sitedir [--allow-purple]'); process.exit(2); }
  const r = audit(site, { allowPurple: process.argv.includes('--allow-purple') });
  for (const f of r.findings) console.log(`${f.file}:${f.line}: ${f.rule}: ${f.msg}`);
  console.log(r.ok ? 'audit: ok' : `audit: ${r.findings.length} findings`);
  process.exit(r.ok ? 0 : 1);
}
