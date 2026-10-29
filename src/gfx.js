'use strict';
// ===== ドット絵はすべてコードで描く（画像ファイルなし＝とても軽い） =====
const TS = 16;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function P(x, px, py, w, h, col) { x.fillStyle = col; x.fillRect(px | 0, py | 0, w | 0, h | 0); }
function rnd(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function disc(x, cx, cy, r, col) { x.fillStyle = col; for (let y = -r; y <= r; y++) for (let i = -r; i <= r; i++) if (i * i + y * y <= r * r + r * 0.8) x.fillRect(cx + i, cy + y, 1, 1); }
function hex(n) { return [n >> 16, (n >> 8) & 255, n & 255]; }
function toHex(r, g, b) { return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1); }
function shade(h, k) { const [r, g, b] = hex(parseInt(h.slice(1), 16)); const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return toHex(f(r), f(g), f(b)); }
function mix(a, b, t) { const A = hex(parseInt(a.slice(1), 16)), B = hex(parseInt(b.slice(1), 16)); return toHex(...A.map((v, i) => Math.round(v + (B[i] - v) * t))); }
function noise(x, r, base, cols, n) { P(x, 0, 0, 16, 16, base); for (let i = 0; i < n; i++) P(x, r() * 16, r() * 16, 1, 1, cols[(r() * cols.length) | 0]); }

// ---------- マップタイル ----------
const TP = {
  '.': (x, r) => noise(x, r, '#4f8a3a', ['#5e9c46', '#3f7530', '#6aab4e'], 26),
  ',': (x, r) => noise(x, r, '#b9995f', ['#a88a52', '#c9ab72', '#9c7e48'], 22),
  'W': (x, r) => noise(x, r, '#a98e66', ['#9c8058', '#b89d74'], 10),
  's': (x, r) => noise(x, r, '#e2d29c', ['#d4c28a', '#efe2b4', '#c8b47a'], 20),
  '~': (x, r, f) => { P(x, 0, 0, 16, 16, '#2c5f9e'); for (let i = 0; i < 3; i++) { const y = 2 + i * 5, o = (f * 3 + i * 6) % 16; P(x, o, y, 4, 1, '#5b93cf'); P(x, (o + 9) % 16, y + 2, 3, 1, '#3f75b6'); } },
  'T': (x, r) => { TP['.'](x, r); P(x, 7, 11, 2, 4, '#5a3a1e'); disc(x, 8, 7, 6, '#2b5f28'); disc(x, 7, 6, 4, '#3a7a33'); P(x, 5, 4, 2, 1, '#58a04a'); P(x, 9, 7, 1, 1, '#58a04a'); },
  'P': (x, r) => { TP.s(x, r); P(x, 7, 9, 2, 6, '#6b4426'); P(x, 2, 8, 12, 3, '#24502a'); P(x, 4, 5, 8, 3, '#2d6233'); P(x, 6, 2, 4, 3, '#356f3a'); P(x, 4, 8, 3, 1, '#3f7f44'); P(x, 6, 5, 2, 1, '#4a8a4c'); },
  '#': (x) => { P(x, 0, 0, 16, 16, '#7d7a70'); for (let y = 0; y < 16; y += 4) { P(x, 0, y, 16, 1, '#5c5a52'); const o = (y / 4) % 2 ? 4 : 0; for (let i = o; i < 16; i += 8) P(x, i, y, 1, 4, '#5c5a52'); P(x, 1, y + 1, 2, 1, '#99968a'); } },
  'H': (x) => { P(x, 0, 0, 16, 16, '#454a58'); for (let y = 0; y < 16; y += 4) { P(x, 0, y, 16, 1, '#5d6375'); P(x, 0, y + 3, 16, 1, '#2e323d'); } for (let i = 2; i < 16; i += 4) P(x, i, 0, 1, 16, '#3a3e4a'); },
  'h': (x) => { P(x, 0, 0, 16, 16, '#e9e2cf'); P(x, 0, 8, 16, 8, '#6b4a2e'); for (let i = 1; i < 16; i += 3) P(x, i, 8, 1, 8, '#553a22'); P(x, 0, 0, 16, 1, '#c9c1ab'); P(x, 0, 7, 16, 1, '#4a3220'); },
  'D': (x, r) => { TP.h(x, r); P(x, 3, 2, 10, 14, '#3a2412'); P(x, 4, 3, 8, 13, '#7a5a3a'); for (let y = 4; y < 16; y += 3) P(x, 4, y, 8, 1, '#5a3f26'); P(x, 8, 3, 1, 13, '#5a3f26'); },
  'g': (x, r) => { P(x, 0, 0, 16, 16, '#2a5e2e'); for (let i = 0; i < 20; i++) P(x, r() * 15, r() * 12, 2, 2, '#3a7a3c'); P(x, 0, 13, 16, 3, '#1f4622'); },
  'K': (x, r) => { TP.W(x, r); P(x, 6, 2, 4, 12, '#8a6a40'); P(x, 6, 2, 4, 2, '#c8a46e'); P(x, 9, 3, 1, 11, '#5e4628'); P(x, 6, 6, 4, 1, '#6e5232'); P(x, 6, 9, 4, 1, '#6e5232'); P(x, 5, 14, 6, 1, '#4a3820'); },
  'F': (x) => { P(x, 0, 0, 16, 16, '#7a5634'); for (let y = 1; y < 16; y += 4) { P(x, 0, y + 2, 16, 1, '#5e4026'); for (let i = 1; i < 16; i += 4) { P(x, i, y, 3, 2, '#4f8a3a'); P(x, i + 1, y, 1, 1, '#6aab4e'); } } },
  'M': (x, r) => noise(x, r, '#6c5c50', ['#5a4a40', '#7e6c5e', '#4a3c34'], 30),
  'm': (x, r) => { TP.M(x, r); disc(x, 8, 7, 4, '#d8d8d0'); disc(x, 10, 4, 3, '#eeeeea'); },
  'C': (x, r) => { TP.s(x, r); P(x, 3, 2, 10, 7, '#6b4426'); P(x, 2, 3, 2, 5, '#3a2414'); P(x, 12, 3, 2, 5, '#3a2414'); P(x, 6, 4, 4, 11, '#222'); P(x, 6, 14, 4, 2, '#111'); P(x, 7, 4, 1, 10, '#555'); },
  'S': (x, r, f) => { TP['~'](x, r, f); P(x, 1, 10, 14, 4, '#1b1b1b'); P(x, 1, 11, 14, 1, '#ddd'); P(x, 3, 14, 10, 1, '#141414'); P(x, 4, 1, 1, 9, '#3a2a1a'); P(x, 11, 1, 1, 9, '#3a2a1a'); P(x, 2, 3, 5, 1, '#d8d0b8'); P(x, 9, 3, 5, 1, '#d8d0b8'); P(x, 7, 5, 2, 5, '#222'); P(x, 6 + f, 2, 3, 2, '#9a9a9a'); P(x, 14, 7, 2, 2, '#c8202a'); },
  '=': (x) => { P(x, 0, 0, 16, 16, '#9b968a'); P(x, 0, 0, 16, 2, '#6e6a60'); P(x, 0, 14, 16, 2, '#6e6a60'); for (let i = 0; i < 16; i += 4) P(x, i, 2, 1, 12, '#868276'); },
  'p': (x) => { P(x, 0, 0, 16, 16, '#2c5f9e'); P(x, 2, 0, 12, 16, '#8a6a42'); for (let y = 0; y < 16; y += 3) P(x, 2, y, 12, 1, '#6b4f2e'); P(x, 2, 0, 1, 16, '#5a4026'); P(x, 13, 0, 1, 16, '#5a4026'); },
  'f': (x, r, f) => { TP[','](x, r); const o = f ? 1 : 0; P(x, 3, 8 - o, 3, 7 + o, '#e04a1a'); P(x, 7, 5 + o, 3, 10 - o, '#e86a1a'); P(x, 11, 7 - o, 3, 8 + o, '#e04a1a'); P(x, 4, 11, 2, 4, '#ffd040'); P(x, 8, 9 + o, 2, 6 - o, '#ffd040'); P(x, 12, 11, 1, 4, '#ffd040'); },
  'r': (x, r) => noise(x, r, '#2e2824', ['#1e1a18', '#4a403a', '#4a403a', '#a8401a'], 40),
  'R': (x, r) => { TP.s(x, r); disc(x, 8, 9, 5, '#6a645c'); disc(x, 7, 8, 3, '#8a847a'); },
  'x': (x) => P(x, 0, 0, 16, 16, '#000'),
};
const SOLID = new Set('T#HhD~gKFMmCSPxRrf'.split(''));
const ANIM = new Set(['~', 'S', 'f']);
const TILE_CACHE = {};
function tileImg(ch, f, v) {
  const key = ch + f + v;
  if (!TILE_CACHE[key]) { const c = mk(16, 16); (TP[ch] || TP.x)(c.getContext('2d'), rnd(ch.charCodeAt(0) * 31 + v * 7 + 1), f); TILE_CACHE[key] = c; }
  return TILE_CACHE[key];
}

// ---------- マップ上のキャラ（16x16） ----------
function paintChar(x, p, d, f) {
  const sk = p.skin || '#f0c39a', hr = p.hair || '#1b1b1b', bd = p.body || '#3a4a6a', lg = p.legs || '#2e2e3a';
  if (p.kind === 'pot') { P(x, 3, 14, 10, 2, 'rgba(0,0,0,.25)'); disc(x, 8, 9, 5, '#1c1a1e'); P(x, 5, 2, 6, 4, '#1c1a1e'); P(x, 6, 2, 4, 1, '#3a3640'); P(x, 5, 7, 1, 3, '#4a4650'); return; }
  if (p.kind === 'boat') { P(x, 1, 10, 14, 3, '#5a3a20'); P(x, 3, 13, 10, 1, '#3a2410'); P(x, 4, 5, 3, 5, '#333'); P(x, 4, 3, 3, 2, '#e0b890'); P(x, 4, 2, 3, 1, '#111'); P(x, 9, 5, 3, 5, '#6a6a70'); P(x, 9, 3, 3, 2, '#e0b890'); return; }
  P(x, 4, 14, 8, 2, 'rgba(0,0,0,.25)');
  if (f === 0) { P(x, 5, 12, 2, 3, lg); P(x, 9, 12, 2, 3, lg); } else { P(x, 5, 12, 2, 2, lg); P(x, 9, 12, 2, 3, lg); P(x, 5, 14, 2, 1, shade(lg, -.4)); }
  P(x, 4, 7, 8, 6, bd);
  if (d === 1) P(x, 6, 8, 2, 4, shade(bd, -.25));
  else { P(x, 3, 8, 1, 4, bd); P(x, 12, 8, 1, 4, bd); P(x, 3, 11, 1, 1, sk); P(x, 12, 11, 1, 1, sk); }
  if (p.belt) P(x, 4, 10, 8, 1, p.belt);
  if (d === 0) { if (p.west) P(x, 7, 7, 2, 2, '#eee'); else { P(x, 7, 7, 2, 1, '#e8e0d0'); P(x, 7, 8, 1, 1, '#e8e0d0'); } }
  P(x, 5, 2, 6, 6, sk);
  const st = p.style || 'mage';
  if (st === 'bald') { if (d === 0) P(x, 6, 2, 2, 1, '#fff5e6'); }
  else if (d === 3) { P(x, 4, 1, 8, 6, hr); if (st === 'mage') P(x, 7, 0, 2, 2, hr); if (st === 'woman') P(x, 5, 0, 6, 2, hr); }
  else if (d === 0) {
    if (st === 'woman') { P(x, 4, 0, 8, 3, hr); P(x, 4, 3, 1, 4, hr); P(x, 11, 3, 1, 4, hr); P(x, 10, 1, 2, 1, '#d8b040'); }
    else { P(x, 5, 1, 6, 2, hr); P(x, 4, 2, 1, st === 'mage' ? 4 : 2, hr); P(x, 11, 2, 1, st === 'mage' ? 4 : 2, hr); if (st === 'mage') P(x, 7, 0, 2, 1, hr); }
  } else {
    P(x, 5, 1, 6, 2, hr); P(x, 8, 2, 4, 4, hr);
    if (st === 'mage') P(x, 8, 0, 2, 1, hr);
    if (st === 'woman') P(x, 7, 0, 5, 2, hr);
  }
  if (d === 0) { P(x, 6, 5, 1, 1, '#111'); P(x, 9, 5, 1, 1, '#111'); }
  if (d === 1) P(x, 6, 5, 1, 1, '#111');
  if (p.hat === 'jingasa') { P(x, 3, 1, 10, 2, '#2a2420'); P(x, 5, 0, 6, 1, '#2a2420'); P(x, 7, 1, 2, 1, '#c8a040'); }
  if (p.hat === 'cap') { P(x, 5, 0, 6, 2, '#f4f4f4'); P(x, 5, 2, 6, 1, '#1a2440'); }
}
const CH_CACHE = {};
function charImg(key, d, f) {
  if (!CH_CACHE[key]) {
    const p = (PEOPLE[key] && PEOPLE[key].spr) || { body: '#555' }, out = {};
    for (const dd of [0, 1, 3]) for (const ff of [0, 1]) { const c = mk(16, 16); paintChar(c.getContext('2d'), p, dd, ff); out[dd + '_' + ff] = c; }
    for (const ff of [0, 1]) { const c = mk(16, 16), x = c.getContext('2d'); x.translate(16, 0); x.scale(-1, 1); x.drawImage(out['1_' + ff], 0, 0); out['2_' + ff] = c; }
    CH_CACHE[key] = out;
  }
  return CH_CACHE[key][d + '_' + f];
}

// ---------- 会話用の顔グラフィック（32x32） ----------
function paintPortrait(p) {
  const c = mk(32, 32), x = c.getContext('2d');
  const sk = p.skin || '#efc39b', hr = p.hair || '#1b1b1b', skD = shade(sk, -.16), bg = p.bg || '#26305a';
  P(x, 0, 0, 32, 32, bg); P(x, 0, 26, 32, 6, shade(bg, -.25));
  const cx = 16, fw = p.fw || 7, cy = 13, fh = 8.5;
  if (p.style === 'woman') { P(x, cx - fw - 2, 5, fw * 2 + 4, 15, hr); }
  const cl = p.cloth || '#3a4a6a';
  for (let y = 22; y < 32; y++) { const w = Math.min(16, 8 + (y - 22) * 1.6); P(x, Math.round(cx - w), y, Math.round(w * 2), 1, cl); }
  P(x, cx - 3, 18, 6, 6, skD);
  if (p.collar === 'west') {
    for (let y = 23; y < 32; y++) { const w = Math.max(1, 5 - (y - 23) * 0.5); P(x, cx - w, y, w * 2, 1, '#f0f0f0'); }
    P(x, cx - 1, 24, 2, 7, p.tie || '#222');
  } else if (p.collar === 'robe') {
    for (let i = 0; i < 9; i++) { P(x, cx - 5 + Math.floor(i * .55), 23 + i, 2, 1, '#ece5d3'); P(x, cx + 3 - Math.floor(i * .55), 23 + i, 2, 1, '#ece5d3'); }
    for (let i = 0; i < 10; i++) P(x, cx + 2 + i, 22 + i, 3, 1, '#4a2e22');
  } else {
    for (let i = 0; i < 9; i++) { P(x, cx - 5 + Math.floor(i * .55), 23 + i, 2, 1, '#ece5d3'); P(x, cx + 3 - Math.floor(i * .55), 23 + i, 2, 1, '#ece5d3'); }
  }
  if (p.mon) { disc(x, cx - 9, 27, 2, '#f0f0f0'); P(x, cx - 10, 27, 3, 1, cl); P(x, cx - 9, 26, 1, 3, cl); }
  P(x, cx - fw - 1, 12, 2, 4, sk); P(x, cx + fw - 1, 12, 2, 4, sk);
  const inFace = (i, y) => { const dx = (i + .5 - cx) / fw, dy = (y + .5 - cy) / fh; return dx * dx + dy * dy <= 1; };
  for (let y = 4; y < 23; y++) for (let i = cx - fw - 1; i <= cx + fw + 1; i++) if (inFace(i, y)) P(x, i, y, 1, 1, i > cx + fw * .5 ? shade(sk, -.07) : sk);
  const cap = (yy) => { for (let y = 3; y < yy; y++) for (let i = cx - fw - 1; i <= cx + fw + 1; i++) { const dx = (i + .5 - cx) / (fw + 1), dy = (y + .5 - cy) / (fh + 1); if (dx * dx + dy * dy <= 1) P(x, i, y, 1, 1, hr); } };
  const st = p.style || 'mage';
  if (st === 'mage' || st === 'boy') {
    for (let y = 4; y < 8; y++) for (let i = cx - fw; i <= cx + fw; i++) if (inFace(i, y)) P(x, i, y, 1, 1, p.pate || mix(sk, '#9fb0c8', .25));
    for (let y = 6; y < 14; y++) { P(x, cx - fw - 1, y, 2, 1, hr); P(x, cx + fw - 1, y, 2, 1, hr); }
    P(x, cx - 1, 1, 3, 6, hr); P(x, cx - 2, 6, 5, 2, hr); P(x, cx, 1, 1, 4, shade(hr, .25));
    if (st === 'boy') { P(x, cx - 4, 6, 8, 2, hr); P(x, cx - 3, 8, 2, 1, hr); P(x, cx + 1, 8, 2, 1, hr); }
  } else if (st === 'short' || st === 'west') {
    cap(9); for (let y = 8; y < 13; y++) { P(x, cx - fw - 1, y, 2, 1, hr); P(x, cx + fw - 1, y, 2, 1, hr); }
    if (st === 'west') P(x, cx - 3, 4, 1, 4, shade(hr, .3));
  } else if (st === 'woman') {
    cap(9); disc(x, cx, 2, 4, hr); P(x, cx - 6, 3, 12, 1, '#c8a040');
  } else if (st === 'bald') { P(x, cx - 3, 5, 3, 1, '#fff6e8'); }
  const bw = p.brow || 1, bc = p.browc || hr, wide = bw > 2 ? 1 : 0;
  P(x, cx - 6 - wide, 10, 4 + wide, bw >= 2 ? 2 : 1, bc); P(x, cx + 2, 10, 4 + wide, bw >= 2 ? 2 : 1, bc);
  const ey = 13;
  for (const ex of [cx - 6, cx + 2]) {
    if (p.eye === 'big') { P(x, ex, ey - 1, 4, 3, '#fff'); P(x, ex + 1, ey - 1, 2, 3, '#1a1414'); P(x, ex + 1, ey - 1, 1, 1, '#fff'); }
    else if (p.eye === 'sharp') { P(x, ex, ey - 1, 4, 1, '#1a1414'); P(x, ex + 1, ey, 2, 1, '#1a1414'); }
    else if (p.eye === 'gentle') { P(x, ex, ey, 1, 1, '#1a1414'); P(x, ex + 1, ey - 1, 2, 1, '#1a1414'); P(x, ex + 3, ey, 1, 1, '#1a1414'); }
    else { P(x, ex, ey, 4, 1, '#1a1414'); P(x, ex + 1, ey - 1, 2, 2, '#1a1414'); }
  }
  P(x, cx, 15, 1, 2, skD); P(x, cx - 1, 17, 3, 1, skD);
  if (p.mouth === 'smile') { P(x, cx - 2, 19, 5, 1, '#9a4a3a'); P(x, cx - 3, 18, 1, 1, '#9a4a3a'); P(x, cx + 3, 18, 1, 1, '#9a4a3a'); }
  else P(x, cx - 2, 19, 5, 1, p.mouth === 'firm' ? '#6a3226' : '#8a4232');
  if (p.beard === 'whiskers' || p.beard === 'full') for (let y = 14; y < 23; y++) for (let i = cx - fw - 1; i <= cx + fw + 1; i++) if (inFace(i, y) && (Math.abs(i - cx) >= fw - 3 || y >= 21) && !(Math.abs(i - cx) <= 3 && y >= 18 && y <= 20)) P(x, i, y, 1, 1, hr);
  if (p.beard === 'mustache' || p.beard === 'full') P(x, cx - 3, 18, 7, 1, hr);
  if (p.beard === 'stubble') { const r = rnd(7); for (let i = 0; i < 18; i++) { const px = cx - fw + 2 + r() * (fw * 2 - 4), py = 17 + r() * 4; if (inFace(px | 0, py | 0)) P(x, px, py, 1, 1, shade(sk, -.35)); } }
  if (p.blush) { P(x, cx - 6, 16, 2, 1, '#e89a8a'); P(x, cx + 4, 16, 2, 1, '#e89a8a'); }
  if (p.hat === 'jingasa') { for (let y = 0; y < 5; y++) { const w = 4 + y * 3; P(x, cx - w, y + 1, w * 2, 1, '#2a2420'); } P(x, cx - 1, 2, 2, 2, '#c8a040'); }
  if (p.hat === 'cap') { P(x, cx - fw, 3, fw * 2, 4, '#f4f4f4'); P(x, cx - fw, 6, fw * 2, 1, '#1a2440'); }
  return c;
}
const POR_CACHE = {};
function portraitImg(p) { const k = JSON.stringify(p); return POR_CACHE[k] || (POR_CACHE[k] = paintPortrait(p)); }

// ---------- 戦闘の敵グラフィック ----------
function paintPerson(x, s) {
  const sk = s.skin || '#e9b98e', hr = s.hair || '#1a1a1a', bd = s.body || '#444', lo = s.lower || '#3a3a3a';
  P(x, 6, 41, 20, 3, 'rgba(0,0,0,.3)');
  if (s.hakama) { P(x, 8, 26, 16, 14, lo); P(x, 15, 30, 2, 10, shade(lo, -.3)); }
  else { P(x, 10, 26, 5, 14, lo); P(x, 17, 26, 5, 14, lo); }
  P(x, 9, 39, 6, 2, '#1a1a1a'); P(x, 17, 39, 6, 2, '#1a1a1a');
  P(x, 9, 14, 14, 13, bd); P(x, 9, 25, 14, 2, s.belt || shade(bd, -.35));
  if (s.kind === 'samurai') { P(x, 14, 14, 4, 1, '#eee'); P(x, 15, 15, 2, 2, '#eee'); }
  if (s.kind === 'sailor') { P(x, 9, 14, 14, 3, '#dfe4ee'); P(x, 14, 17, 4, 2, '#dfe4ee'); P(x, 15, 18, 2, 2, '#c02020'); }
  if (s.kind === 'marine') for (let i = 0; i < 12; i++) { P(x, 10 + i, 14 + i, 1, 1, '#f0f0f0'); P(x, 21 - i, 14 + i, 1, 1, '#f0f0f0'); }
  if (s.kind === 'officer') { P(x, 6, 14, 5, 2, '#e0c040'); P(x, 21, 14, 5, 2, '#e0c040'); for (let y = 16; y < 25; y += 3) P(x, 16, y, 1, 1, '#e0c040'); }
  if (s.mon) { disc(x, 12, 18, 2, '#f0f0f0'); P(x, 11, 18, 3, 1, bd); P(x, 12, 17, 1, 3, bd); }
  if (s.w === 'bokuto' || s.w === 'katana') {
    P(x, 6, 15, 3, 10, bd); P(x, 6, 24, 3, 2, sk);
    P(x, 22, 11, 4, 7, bd); P(x, 22, 9, 5, 3, sk);
    P(x, 24, 0, 2, 10, s.w === 'katana' ? '#d8dce4' : '#a07a48'); if (s.w === 'katana') { P(x, 22, 9, 6, 1, '#333'); P(x, 24, 0, 1, 9, '#ffffff'); }
  } else {
    P(x, 6, 15, 3, 10, bd); P(x, 23, 15, 3, 10, bd); P(x, 6, 24, 3, 2, sk); P(x, 23, 24, 3, 2, sk);
    if (s.w === 'rifle') for (let i = 0; i < 22; i++) P(x, 2 + i, 32 - i, 2, 2, i < 15 ? '#5a3a1e' : '#9aa0a8');
    if (s.w === 'cutlass') { P(x, 25, 15, 1, 10, '#cfd4dc'); P(x, 23, 24, 4, 1, '#c8a040'); }
    if (s.w === 'club') P(x, 25, 12, 2, 13, '#7a5a34');
  }
  P(x, 11, 3, 10, 11, sk);
  if (s.hairStyle === 'mage') { P(x, 10, 3, 2, 8, hr); P(x, 20, 3, 2, 8, hr); P(x, 12, 3, 8, 2, mix(sk, '#9fb0c8', .25)); P(x, 14, 0, 4, 4, hr); }
  else if (s.hairStyle === 'west') { P(x, 11, 2, 10, 3, hr); P(x, 10, 4, 1, 5, hr); P(x, 21, 4, 1, 5, hr); }
  P(x, 13, 8, 2, 1, '#111'); P(x, 17, 8, 2, 1, '#111'); P(x, 13, 6, 2, 1, hr); P(x, 17, 6, 2, 1, hr); P(x, 15, 11, 2, 1, '#7a3a2a');
  if (s.beard) { P(x, 11, 10, 10, 4, s.beard); P(x, 14, 11, 4, 1, '#7a3a2a'); }
  if (s.hat === 'cap') { P(x, 10, 1, 12, 3, '#f4f4f4'); P(x, 10, 4, 12, 1, '#1a2440'); }
  if (s.hat === 'shako') { P(x, 11, 0, 10, 5, '#1a1a1a'); P(x, 11, 4, 10, 1, '#c8a040'); }
  if (s.hat === 'bicorne') { P(x, 8, 1, 16, 3, '#1a1a2a'); P(x, 15, 0, 2, 2, '#c8a040'); }
  if (s.hat === 'hachimaki') { P(x, 11, 4, 10, 1, '#f0f0f0'); P(x, 21, 4, 3, 2, '#f0f0f0'); }
}
function paintShip(x) {
  for (let y = 34; y < 48; y++) { const k = (y - 34) * .6; P(x, 6 + k, y, 88 - k * 2, 1, '#1b1b1b'); }
  P(x, 7, 37, 86, 3, '#e8e8e8'); for (let i = 0; i < 9; i++) P(x, 12 + i * 9, 37, 4, 3, '#222');
  P(x, 22, 4, 2, 30, '#4a3220'); P(x, 48, 0, 2, 34, '#4a3220'); P(x, 72, 6, 2, 28, '#4a3220');
  P(x, 13, 9, 20, 3, '#d8d0b8'); P(x, 38, 6, 22, 3, '#d8d0b8'); P(x, 63, 11, 20, 3, '#d8d0b8');
  P(x, 15, 18, 16, 2, '#d8d0b8'); P(x, 40, 16, 18, 2, '#d8d0b8'); P(x, 65, 20, 16, 2, '#d8d0b8');
  P(x, 33, 20, 7, 14, '#2a2a2a'); P(x, 33, 22, 7, 2, '#c8a040');
  disc(x, 36, 15, 4, '#7a7a7a'); disc(x, 31, 8, 5, '#8a8a8a'); disc(x, 26, 2, 3, '#9a9a9a');
  P(x, 90, 20, 1, 14, '#333'); P(x, 91, 20, 8, 6, '#c8202a'); P(x, 91, 20, 4, 3, '#1a3a8a');
  P(x, 0, 47, 100, 9, '#2c5f9e'); for (let i = 0; i < 100; i += 9) P(x, i, 49, 5, 1, '#5b93cf');
}
function paintBoat(x) {
  for (let y = 22; y < 32; y++) { const k = (y - 22) * .7; P(x, 2 + k, y, 52 - k * 2, 1, '#6b4426'); }
  P(x, 3, 23, 50, 1, '#8a6038');
  for (const bx of [10, 22, 34, 44]) { P(x, bx, 14, 6, 8, '#1a2a5a'); P(x, bx + 1, 8, 4, 6, '#e9b98e'); P(x, bx, 6, 6, 3, '#f4f4f4'); P(x, bx + 2, 10, 1, 1, '#111'); }
  for (let i = 0; i < 10; i++) { P(x, 6 - i * .3 + 2, 26 + i, 1, 1, '#8a6038'); P(x, 48 + i * .3, 26 + i, 1, 1, '#8a6038'); }
  P(x, 0, 32, 56, 4, '#2c5f9e');
}
function paintShell(x) {
  disc(x, 8, 20, 6, '#ffd040'); disc(x, 12, 17, 6, '#ff8a20'); disc(x, 17, 13, 6, '#e04a1a');
  disc(x, 20, 9, 6, '#1a1a1a'); P(x, 18, 6, 2, 2, '#666');
}
const EN_CACHE = {};
function enemyImg(id) {
  if (EN_CACHE[id]) return EN_CACHE[id];
  const s = ENEMIES[id].spr; let c;
  if (s.t === 'ship') { c = mk(100, 56); paintShip(c.getContext('2d')); }
  else if (s.t === 'boat') { c = mk(56, 36); paintBoat(c.getContext('2d')); }
  else if (s.t === 'shell') { c = mk(28, 28); paintShell(c.getContext('2d')); }
  else { c = mk(32, 44); paintPerson(c.getContext('2d'), s); }
  return (EN_CACHE[id] = c);
}

// ---------- 背景 ----------
function volcano(x, cx, base, w, h, col, smoke) {
  for (let i = 0; i < h; i++) { const ww = w * (0.16 + 0.84 * i / h); P(x, cx - ww / 2, base - h + i, ww, 1, col); }
  if (smoke) { disc(x, cx - 4, base - h - 8, 7, smoke); disc(x, cx + 8, base - h - 18, 9, smoke); disc(x, cx + 22, base - h - 30, 8, smoke); }
}
function band(x, top, bot, y0, y1) { const n = 10; for (let i = 0; i < n; i++) P(x, 0, y0 + (y1 - y0) * i / n, 384, Math.ceil((y1 - y0) / n) + 1, mix(top, bot, i / (n - 1))); }
const BG_CACHE = {};
function bgImg(type) {
  if (BG_CACHE[type]) return BG_CACHE[type];
  const c = mk(384, 288), x = c.getContext('2d'), r = rnd(type.length * 17);
  if (type === 'field') {
    band(x, '#7fb6ea', '#cfe6f5', 0, 120); for (let i = 0; i < 384; i += 2) P(x, i, 100 - Math.sin(i / 30) * 10 - Math.sin(i / 11) * 3, 2, 30, '#6f9a6a');
    P(x, 0, 120, 384, 168, '#4f8a3a'); for (let i = 0; i < 400; i++) P(x, r() * 384, 120 + r() * 168, 2, 1, r() < .5 ? '#5e9c46' : '#3f7530');
  } else if (type === 'dojo') {
    P(x, 0, 0, 384, 140, '#6e4f33'); for (let i = 0; i < 384; i += 24) P(x, i, 0, 2, 140, '#5a3f26'); P(x, 0, 20, 384, 6, '#4a3220');
    P(x, 0, 140, 384, 148, '#a98e66'); for (let i = 0; i < 300; i++) P(x, r() * 384, 140 + r() * 148, 2, 1, '#9c8058');
  } else if (type === 'beach' || type === 'storm' || type === 'night' || type === 'title') {
    const pal = {
      beach: ['#7fb6ea', '#d8ecf6', '#2c5f9e', '#5d5468', '#d8d8d0', '#e2d29c'],
      storm: ['#1e2230', '#3a4256', '#1d3550', '#2a2a36', '#555a66', '#8a7c5c'],
      night: ['#0a1030', '#1c2a58', '#13244a', '#151a30', '#3a4060', '#4a4636'],
      title: ['#141a3a', '#d0683a', '#1a2a4a', '#2a1e2e', '#6a5a6a', '#0a0a12'],
    }[type];
    const hz = type === 'title' ? 170 : 110;
    band(x, pal[0], pal[1], 0, hz);
    if (type === 'night' || type === 'title') for (let i = 0; i < 60; i++) P(x, r() * 384, r() * hz * .6, 1, 1, '#e8e8ff');
    if (type === 'night') disc(x, 320, 34, 12, '#f4ecc8');
    if (type === 'title') volcano(x, 192, hz, 360, 105, pal[3], pal[4]);
    else volcano(x, 280, hz, 230, 62, pal[3], pal[4]);
    P(x, 0, hz, 384, 50, pal[2]); for (let i = 0; i < 70; i++) P(x, r() * 384, hz + r() * 50, 6, 1, type === 'title' ? '#c8603a' : shade(pal[2], .2));
    if (type === 'title') {
      P(x, 0, hz + 50, 384, 288, '#06060c');
      for (const [bx, s] of [[24, 1], [360, -1]]) {
        for (let y = 110; y < 288; y++) P(x, bx + s * Math.round((288 - y) * .12), y, 6, 1, pal[5]);
        for (const [dx, dy, w] of [[18, 104, 46], [-6, 132, 40], [30, 150, 34], [4, 176, 30]]) {
          const cx = bx + s * dx;
          for (let k = 0; k < 9; k++) disc(x, Math.round(cx - w / 2 + k * w / 8), dy + ((k * 5) % 3), 6 + (k % 3), pal[5]);
        }
      }
    } else {
      P(x, 0, hz + 50, 384, 288, pal[5]); for (let i = 0; i < 300; i++) P(x, r() * 384, hz + 50 + r() * 130, 2, 1, shade(pal[5], -.12));
    }
    if (type === 'storm') { x.globalAlpha = .45; for (let i = 0; i < 140; i++) { const sx = r() * 384, sy = r() * 288; for (let k = 0; k < 8; k++) P(x, sx - k, sy + k * 2, 1, 2, '#a0b0c8'); } x.globalAlpha = 1; }
  } else { P(x, 0, 0, 384, 288, '#111'); }
  return (BG_CACHE[type] = c);
}
