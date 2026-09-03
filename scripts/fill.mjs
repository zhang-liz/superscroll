#!/usr/bin/env node
// Build a site folder from a brief.json and a look. Usage: node scripts/fill.mjs brief.json sitedir
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = dirname(dirname(fileURLToPath(import.meta.url)));
const [briefPath, site] = process.argv.slice(2);
if (!briefPath || !site) { console.error('usage: fill.mjs brief.json sitedir'); process.exit(1); }
const brief = JSON.parse(readFileSync(briefPath, 'utf8'));

export function loadLooks(md) {
  const looks = {};
  for (const m of md.matchAll(/```json\s*([\s\S]*?)```/g)) { const j = JSON.parse(m[1]); looks[j.id] = j; }
  return looks;
}
const looks = loadLooks(readFileSync(join(skill, 'references', 'looks.md'), 'utf8'));
const look = looks[brief.look];
if (!look) { console.error(`unknown look ${brief.look}. known: ${Object.keys(looks).join(', ')}`); process.exit(1); }

const todos = [];
const need = (key, val) => { if (val === undefined || val === null || val === '') { todos.push(key); return `{{TODO ${key}}}`; } return String(val); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Only these schemes may reach an href. Anything else becomes '#' and a todo.
const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
export function safeHref(h, report) {
  const v = String(h == null ? '' : h).trim();
  if (v === '') return '#';
  if (v.startsWith('#')) return v;
  const m = v.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!m) return v; // relative path, no scheme
  if (SAFE_SCHEMES.has(m[1].toLowerCase() + ':')) return v;
  if (report) report(v);
  return '#';
}
const href = v => safeHref(v, bad => todos.push('href:' + bad));

const items = (brief.items || []).map((it, i) =>
  `<li class="item ss-reveal"><span class="num">${String(i + 1).padStart(2, '0')}</span><a href="${esc(href(it.href))}"><h3>${esc(need(`items[${i}].title`, it.title))}</h3><p>${esc(need(`items[${i}].text`, it.text))}</p></a></li>`
).join('\n      ');
if (!brief.items || !brief.items.length) todos.push('items');

const manifest = existsSync(join(site, 'manifest.json')) ? JSON.parse(readFileSync(join(site, 'manifest.json'), 'utf8')) : null;
const defaultsByType = {
  person: { NAV_1: 'Work', NAV_2: 'About', NAV_3: 'Contact', WORK_TITLE: 'Selected work', PEAK_TITLE: 'About', CLOSE_TITLE: 'Say hello' },
  product: { NAV_1: 'Features', NAV_2: 'Details', NAV_3: 'Buy', WORK_TITLE: 'Features', PEAK_TITLE: 'The details', CLOSE_TITLE: 'Get one' },
  company: { NAV_1: 'What', NAV_2: 'Proof', NAV_3: 'Contact', WORK_TITLE: 'What we do', PEAK_TITLE: 'Proof', CLOSE_TITLE: 'Talk to us' },
  place: { NAV_1: 'Rooms', NAV_2: 'Details', NAV_3: 'Book', WORK_TITLE: 'The rooms', PEAK_TITLE: 'The details', CLOSE_TITLE: 'Book a visit' },
};
const d = defaultsByType[brief.type] || defaultsByType.person;

const vars = {
  NAME: need('name', brief.name), TAGLINE: need('tagline', brief.tagline), LOOK: look.id, MODE: look.mode,
  FONT_LINK: look.fonts.link, FRAMES: need('frames', brief.frames || (manifest && manifest.count)), PIN: brief.pin || '400vh',
  POSTER_W: manifest ? manifest.lg.w : 1600, POSTER_H: manifest ? manifest.lg.h : 900,
  LG_W: manifest ? manifest.lg.w : 1600, SM_W: manifest ? manifest.sm.w : 850,
  POSTER_ALT: brief.posterAlt || `${brief.name || 'The subject'}, mid-motion`,
  CUE_HOOK: look.hero.cueHook, CUE_SUB: look.hero.cueSub, HOOK: need('hook', brief.hook), CONTEXT: need('context', brief.context),
  ITEMS: items, PEAK_TEXT: need('peakText', brief.peakText), CTA_HREF: href((brief.cta && brief.cta.href) || '#contact'), CTA_LABEL: need('cta.label', brief.cta && brief.cta.label),
  CONTACT: need('contact', brief.contact), YEAR: String(new Date().getFullYear()),
  ...d, ...(brief.labels || {}),
  BG: look.tokens.bg, FG: look.tokens.fg, MUTED: look.tokens.muted, ACCENT: brief.accent || look.tokens.accent, RULE: look.tokens.rule,
  FONT_DISPLAY: look.fonts.display, FONT_BODY: look.fonts.body, DISPLAY_WEIGHT: String(look.fonts.displayWeight),
};
const htmlVars = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, k === 'ITEMS' ? v : esc(v)]));
const render = (tpl, v) => tpl.replace(/\{\{([A-Z_0-9]+)\}\}/g, (m, k) => (k in v ? v[k] : m));

mkdirSync(site, { recursive: true });
writeFileSync(join(site, 'index.html'), render(readFileSync(join(skill, 'templates', 'index.html'), 'utf8'), htmlVars));
writeFileSync(join(site, 'styles.css'), render(readFileSync(join(skill, 'templates', 'styles.css'), 'utf8'), vars));
for (const f of ['scrub.js', 'scrub-core.js', 'scrub.css']) copyFileSync(join(skill, 'engine', f), join(site, f));
writeFileSync(join(site, 'BRIEF.json'), JSON.stringify({ ...brief, look: look.id, signature: brief.signature || look.signature }, null, 2));
for (const t of todos) console.log('todo: ' + t);
console.log(`built ${site} with look ${look.id}`);
