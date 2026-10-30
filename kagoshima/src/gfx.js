'use strict';
// ===== ドット絵はすべてコードで描く（画像ファイルなし＝とても軽い） =====
// マップのタイルは32x32、キャラは32x48、顔は64x64、戦闘の人物は64x96。
const TS = 32;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function P(x, px, py, w, h, col) { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), Math.round(w), Math.round(h)); }
function rnd(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function disc(x, cx, cy, r, col) { x.fillStyle = col; for (let y = -r; y <= r; y++) for (let i = -r; i <= r; i++) if (i * i + y * y <= r * r + r * .8) x.fillRect(cx + i, cy + y, 1, 1); }
function ell(x, cx, cy, rx, ry, col) { x.fillStyle = col; for (let y = Math.floor(-ry); y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); x.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); } }
function hex(n) { return [n >> 16, (n >> 8) & 255, n & 255]; }
function toHex(r, g, b) { return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1); }
function shade(h, k) { const [r, g, b] = hex(parseInt(h.slice(1, 7), 16)); const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return toHex(f(r), f(g), f(b)); }
function mix(a, b, t) { const A = hex(parseInt(a.slice(1, 7), 16)), B = hex(parseInt(b.slice(1, 7), 16)); return toHex(...A.map((v, i) => Math.round(v + (B[i] - v) * t))); }
// 輪郭線：透明なピクセルのうち、色のあるピクセルに接するものを暗い色で塗る（SFC風の見た目になる）
function outline(c, col = '#1c1219') {
  const x = c.getContext('2d'), w = c.width, h = c.height, d = x.getImageData(0, 0, w, h), a = d.data, o = new Uint8ClampedArray(a);
  const [R, G, B] = hex(parseInt(col.slice(1), 16));
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const k = (y * w + i) * 4; if (a[k + 3] > 0) continue;
    const on = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && a[(yy * w + xx) * 4 + 3] > 200;
    if (on(i - 1, y) || on(i + 1, y) || on(i, y - 1) || on(i, y + 1)) { o[k] = R; o[k + 1] = G; o[k + 2] = B; o[k + 3] = 255; }
  }
  d.data.set(o); x.putImageData(d, 0, 0); return c;
}
function speck(x, r, n, cols, w = 32, h = 32, sz = 1) { for (let i = 0; i < n; i++) P(x, r() * w, r() * h, sz, sz, cols[(r() * cols.length) | 0]); }

// ---------- マップタイル（32x32） ----------
const GR = ['#5b9a40', '#4c8836', '#6dae4c', '#3f7a2e'];
const TP = {
  '.': (x, r, f, v) => { P(x, 0, 0, 32, 32, GR[0]); for (let i = 0; i < 26; i++) { const px = r() * 31, py = r() * 30; P(x, px, py, 1, 2, r() < .5 ? GR[1] : GR[2]); } speck(x, r, 18, [GR[3]]); if (v === 1) { P(x, 8, 10, 2, 2, '#f4f0d0'); P(x, 22, 20, 2, 2, '#f8c0d0'); P(x, 9, 11, 1, 1, '#e8c040'); } if (v === 2) for (let i = 0; i < 5; i++) P(x, 4 + r() * 22, 6 + r() * 20, 3, 1, '#7dbc58'); },
  'u': (x, r) => { P(x, 0, 0, 32, 32, '#8a8a52'); for (let i = 0; i < 30; i++) P(x, r() * 31, r() * 30, 1, 2, r() < .5 ? '#a09a5e' : '#6e6e40'); speck(x, r, 10, ['#5a5030']); },
  ',': (x, r) => { P(x, 0, 0, 32, 32, '#c4a66e'); speck(x, r, 50, ['#b3955f', '#d3b67e', '#a8895a']); for (let i = 0; i < 4; i++) { const px = r() * 28, py = r() * 28; P(x, px, py, 3, 2, '#9c8052'); P(x, px, py, 2, 1, '#dcc290'); } },
  ';': (x, r) => { P(x, 0, 0, 32, 32, '#8e8a80'); for (let y = 0; y < 32; y += 8) { const o = (y / 8) % 2 ? 6 : 0; for (let i = -o; i < 32; i += 12) { P(x, i + 1, y + 1, 10, 6, '#a7a397'); P(x, i + 1, y + 1, 10, 1, '#bdb9ad'); } } speck(x, r, 14, ['#7a766c']); },
  's': (x, r) => { P(x, 0, 0, 32, 32, '#e6d6a0'); speck(x, r, 40, ['#d8c68c', '#f2e6bc', '#cdb980']); for (let i = 0; i < 3; i++) P(x, r() * 20, 4 + i * 10 + r() * 3, 10, 1, '#d4c286'); },
  '~': (x, r, f) => { P(x, 0, 0, 32, 32, '#2f66a8'); P(x, 0, 0, 32, 4, '#3772b4'); for (let i = 0; i < 5; i++) { const y = 3 + i * 6, o = (f * 4 + i * 9) % 32; P(x, o, y, 7, 1, '#6aa2dc'); P(x, (o + 18) % 32, y + 3, 5, 1, '#4686c6'); } if (f % 2) P(x, (f * 7) % 28, 10, 2, 1, '#e6f2ff'); },
  'o': (x, r, f) => { P(x, 0, 0, 32, 32, '#21508c'); for (let i = 0; i < 4; i++) { const y = 4 + i * 8, o = (f * 3 + i * 11) % 32; P(x, o, y, 6, 1, '#3c72b0'); } },
  'T': (x, r, f, v) => { TP['.'](x, r, 0, 0); ell(x, 16, 29, 11, 3, 'rgba(0,0,0,.25)'); P(x, 14, 20, 5, 10, '#6a4424'); P(x, 14, 20, 2, 10, '#83582e'); disc(x, 16, 12, 11, '#2b5f28'); disc(x, 10, 15, 6, '#2b5f28'); disc(x, 22, 15, 6, '#2b5f28'); disc(x, 14, 9, 7, '#3a7a33'); disc(x, 21, 11, 5, '#3a7a33'); disc(x, 12, 7, 3, '#4f9440'); P(x, 10, 5, 3, 2, '#6ab052'); P(x, 20, 9, 2, 2, '#6ab052'); outline(x.canvas, '#173a16'); },
  'P': (x, r) => { TP.s(x, r); ell(x, 16, 29, 9, 3, 'rgba(0,0,0,.25)'); P(x, 14, 16, 4, 14, '#6b4426'); P(x, 15, 16, 1, 14, '#8a5a30'); ell(x, 16, 16, 14, 4, '#24502a'); ell(x, 15, 11, 11, 3, '#2d6233'); ell(x, 17, 6, 7, 3, '#356f3a'); P(x, 6, 15, 6, 1, '#4a8a4c'); P(x, 10, 10, 5, 1, '#4a8a4c'); P(x, 14, 5, 4, 1, '#5a9a5a'); outline(x.canvas, '#122a14'); },
  'b': (x, r) => { TP['.'](x, r, 0, 0); for (const bx of [4, 13, 22, 28]) { P(x, bx, 0, 3, 32, '#5f9a3a'); P(x, bx, 0, 1, 32, '#8ac25a'); for (let y = 4; y < 32; y += 9) P(x, bx - 1, y, 5, 1, '#3e6e26'); } for (let i = 0; i < 8; i++) { const px = r() * 28, py = r() * 28; P(x, px, py, 5, 2, '#4f8a30'); } },
  '#': (x, r) => { P(x, 0, 0, 32, 32, '#6e6b62'); const rows = [[0, 9], [9, 8], [17, 8], [25, 7]]; rows.forEach(([y, h], k) => { let i = -(k % 2) * 6; while (i < 32) { const w = 9 + ((r() * 6) | 0); P(x, i + 1, y + 1, w - 1, h - 1, mix('#8f8b80', '#a09b8e', r())); P(x, i + 1, y + 1, w - 1, 1, '#b8b3a5'); P(x, i + 1, y + h - 1, w - 1, 1, '#5e5b53'); i += w; } }); },
  'H': (x, r) => { P(x, 0, 0, 32, 32, '#3f4556'); for (let y = 0; y < 32; y += 6) { for (let i = (y / 6) % 2 ? -4 : 0; i < 32; i += 8) { P(x, i, y, 8, 5, '#4d5468'); P(x, i, y, 8, 1, '#69718a'); P(x, i + 7, y, 1, 5, '#2c303c'); } P(x, 0, y + 5, 32, 1, '#262a34'); } },
  'Q': (x, r) => { P(x, 0, 0, 32, 32, '#2a2e3a'); for (let y = 0; y < 32; y += 6) { for (let i = (y / 6) % 2 ? -4 : 0; i < 32; i += 8) { P(x, i, y, 8, 5, '#3c4252'); P(x, i, y, 8, 1, '#5a6278'); } } P(x, 0, 28, 32, 4, '#f0ece0'); },
  'h': (x, r) => { P(x, 0, 0, 32, 32, '#ece6d4'); P(x, 0, 0, 32, 2, '#c9c1ab'); P(x, 0, 15, 32, 17, '#6b4a2e'); for (let y = 16; y < 32; y += 4) { P(x, 0, y, 32, 1, '#7d5a38'); P(x, 0, y + 3, 32, 1, '#4e341f'); } P(x, 0, 0, 3, 32, '#4e341f'); P(x, 29, 0, 3, 32, '#4e341f'); P(x, 10, 4, 12, 8, '#3a2a1a'); for (let i = 11; i < 22; i += 3) P(x, i, 4, 1, 8, '#a8885a'); P(x, 10, 7, 12, 1, '#a8885a'); },
  'D': (x, r) => { TP.h(x, r); P(x, 5, 3, 22, 29, '#2e1d10'); P(x, 6, 4, 20, 28, '#8a6640'); for (let y = 6; y < 32; y += 5) P(x, 6, y, 20, 1, '#6a4a2c'); P(x, 15, 4, 2, 28, '#5a3e24'); P(x, 4, 3, 24, 11, '#28407a'); P(x, 4, 3, 24, 2, '#3a58a0'); P(x, 15, 3, 2, 11, '#1a2a50'); disc(x, 10, 9, 2, '#e8e4d8'); disc(x, 22, 9, 2, '#e8e4d8'); },
  'L': (x, r) => { P(x, 0, 0, 32, 32, '#f0ece0'); P(x, 0, 22, 32, 10, '#2a2a2a'); for (let i = 0; i < 32; i += 8) { P(x, i, 22, 8, 10, (i / 8) % 2 ? '#3a3a3a' : '#2a2a2a'); P(x, i + 3, 25, 2, 2, '#efe6cc'); } P(x, 6, 2, 20, 20, '#1e1e1e'); P(x, 7, 3, 18, 18, '#3a3634'); P(x, 15, 3, 2, 18, '#1e1e1e'); P(x, 13, 10, 6, 6, '#c8a040'); P(x, 15, 12, 2, 3, '#1e1e1e'); },
  'g': (x, r) => { P(x, 0, 0, 32, 32, '#2a5e2e'); for (let i = 0; i < 26; i++) disc(x, (r() * 30) | 0, (r() * 22) | 0, 2 + ((r() * 2) | 0), r() < .5 ? '#3a7a3c' : '#2f6a33'); for (let i = 0; i < 10; i++) P(x, r() * 30, r() * 20, 2, 1, '#5a9a56'); P(x, 0, 26, 32, 6, '#1f4622'); P(x, 0, 25, 32, 1, '#163a1a'); },
  'K': (x, r) => { TP.W(x, r); ell(x, 16, 28, 7, 2, 'rgba(0,0,0,.3)'); P(x, 12, 2, 8, 26, '#8a6a40'); P(x, 12, 2, 3, 26, '#a8865a'); P(x, 18, 2, 2, 26, '#5e4628'); P(x, 12, 2, 8, 3, '#d8b47e'); for (let y = 8; y < 26; y += 5) P(x, 12, y, 8, 1, '#6a4e2c'); P(x, 10, 27, 12, 2, '#4a3820'); },
  'W': (x, r) => { P(x, 0, 0, 32, 32, '#ad9268'); speck(x, r, 26, ['#a08560', '#bba078', '#9a7e58']); },
  'F': (x, r) => { P(x, 0, 0, 32, 32, '#7a5634'); for (let y = 0; y < 32; y += 8) { P(x, 0, y + 6, 32, 2, '#5e4026'); for (let i = 2; i < 32; i += 8) { P(x, i, y + 1, 5, 4, '#4f8a3a'); P(x, i + 1, y, 3, 2, '#6aab4e'); P(x, i + 2, y + 4, 1, 2, '#7a3a5a'); } } },
  'n': (x, r, f) => { P(x, 0, 0, 32, 32, '#5a7a8a'); for (let i = 0; i < 3; i++) P(x, (f * 3 + i * 11) % 32, 6 + i * 9, 5, 1, '#8ab0c0'); for (let y = 2; y < 32; y += 6) for (let i = 2; i < 32; i += 6) { P(x, i, y, 1, 4, '#6aab4e'); P(x, i + 1, y + 1, 1, 3, '#8ac860'); } },
  'M': (x, r) => { P(x, 0, 0, 32, 32, '#6c5c50'); for (let i = 0; i < 14; i++) { const px = r() * 26, py = r() * 26, w = 4 + r() * 6; P(x, px, py, w, w * .7, '#7e6c5e'); P(x, px, py + w * .7, w, 1, '#4a3c34'); } speck(x, r, 30, ['#5a4a40', '#8a786a']); },
  'm': (x, r, f) => { TP.M(x, r); disc(x, 16, 20, 7, '#3a2a24'); disc(x, 16, 20, 4, '#c84a1a'); disc(x, 12 + f, 10, 6, '#d8d8d0'); disc(x, 20 - f, 5, 5, '#eeeeea'); },
  'C': (x, r) => { TP.s(x, r); ell(x, 16, 26, 12, 3, 'rgba(0,0,0,.3)'); P(x, 6, 6, 20, 14, '#6b4426'); P(x, 6, 6, 20, 2, '#8a5a30'); disc(x, 7, 18, 4, '#3a2414'); disc(x, 25, 18, 4, '#3a2414'); disc(x, 7, 18, 1, '#8a6a40'); disc(x, 25, 18, 1, '#8a6a40'); P(x, 12, 8, 8, 22, '#26262a'); P(x, 13, 8, 2, 22, '#5a5a62'); P(x, 11, 28, 10, 3, '#141416'); outline(x.canvas); },
  'S': (x, r, f) => { TP['~'](x, r, f); P(x, 2, 20, 28, 7, '#1b1b1b'); P(x, 2, 22, 28, 2, '#e0e0e0'); for (let i = 5; i < 28; i += 5) P(x, i, 22, 2, 2, '#222'); P(x, 5, 27, 22, 2, '#141414'); P(x, 8, 2, 2, 18, '#4a3220'); P(x, 22, 3, 2, 17, '#4a3220'); P(x, 3, 6, 12, 2, '#d8d0b8'); P(x, 17, 7, 12, 2, '#d8d0b8'); P(x, 4, 12, 10, 2, '#d8d0b8'); P(x, 14, 10, 4, 10, '#262626'); disc(x, 15 + f, 6, 3, '#8a8a8a'); P(x, 28, 12, 4, 4, '#c8202a'); P(x, 28, 12, 2, 2, '#1a3a8a'); },
  '=': (x) => { P(x, 0, 0, 32, 32, '#9b968a'); P(x, 0, 0, 32, 4, '#6e6a60'); P(x, 0, 2, 32, 1, '#b8b3a5'); P(x, 0, 28, 32, 4, '#6e6a60'); for (let i = 0; i < 32; i += 8) { P(x, i, 4, 1, 24, '#868276'); P(x, i + 1, 4, 1, 24, '#aaa598'); } },
  'p': (x) => { P(x, 0, 0, 32, 32, '#2f66a8'); P(x, 4, 0, 24, 32, '#8a6a42'); for (let y = 0; y < 32; y += 5) { P(x, 4, y, 24, 1, '#6b4f2e'); P(x, 4, y + 1, 24, 1, '#a08050'); } P(x, 3, 0, 2, 32, '#4a3420'); P(x, 27, 0, 2, 32, '#4a3420'); },
  'f': (x, r, f) => { P(x, 0, 0, 32, 32, '#3a2a22'); speck(x, r, 40, ['#2a1e18', '#5a3a2a', '#d0501a', '#ff8a30']); P(x, 2, 22, 28, 6, '#4a3020'); for (let i = 0; i < 5; i++) P(x, 3 + i * 6, 20 - ((i + f) % 2) * 2, 4, 3, '#2a1a10'); },
  'r': (x, r) => { P(x, 0, 0, 32, 32, '#3a3430'); for (let i = 0; i < 12; i++) { const px = r() * 26, py = r() * 26; P(x, px, py, 6, 2, '#1e1a18'); P(x, px, py, 6, 1, '#5a504a'); } speck(x, r, 20, ['#4a403a', '#6a5a50', '#a8401a']); },
  'R': (x, r) => { TP.s(x, r); ell(x, 16, 24, 11, 4, 'rgba(0,0,0,.25)'); disc(x, 16, 17, 9, '#6a645c'); disc(x, 13, 14, 5, '#8a847a'); P(x, 10, 11, 3, 2, '#a8a296'); outline(x.canvas, '#2a2622'); },
  'x': (x) => P(x, 0, 0, 32, 32, '#000'),
  'w': (x, r) => { P(x, 0, 0, 32, 32, '#a8784a'); for (let y = 0; y < 32; y += 8) { P(x, 0, y, 32, 1, '#7a5230'); P(x, 0, y + 1, 32, 1, '#c09060'); P(x, ((y * 7) % 24) + 4, y, 1, 8, '#7a5230'); } },
  't': (x, r) => { P(x, 0, 0, 32, 32, '#c8c088'); for (let y = 1; y < 32; y += 2) P(x, 1, y, 30, 1, '#b8b078'); P(x, 0, 0, 32, 2, '#2a4a3a'); P(x, 0, 30, 32, 2, '#2a4a3a'); P(x, 0, 0, 1, 32, '#9a9260'); },
  'V': (x) => { P(x, 0, 0, 32, 32, '#3a2a1e'); P(x, 0, 26, 32, 6, '#5a4030'); P(x, 0, 26, 32, 1, '#7a5a40'); },
  'v': (x) => { P(x, 0, 0, 32, 32, '#ece4cc'); P(x, 0, 0, 32, 3, '#5a4030'); P(x, 0, 26, 32, 6, '#6a4a30'); P(x, 0, 0, 3, 32, '#5a4030'); P(x, 29, 0, 3, 32, '#5a4030'); P(x, 3, 3, 26, 1, '#cfc6aa'); },
  'I': (x, r, f) => { TP.t(x, r); P(x, 4, 4, 24, 24, '#5a4030'); P(x, 6, 6, 20, 20, '#2a2a2a'); P(x, 8, 8, 16, 16, '#8a7a6a'); disc(x, 16, 17, 4, '#d04a18'); disc(x, 16, 16 - f, 2, '#ffd040'); P(x, 15, 2, 2, 12, '#2a1a10'); P(x, 12, 12, 8, 4, '#2a2a2a'); },
  'k': (x) => { P(x, 0, 0, 32, 32, '#ece4cc'); P(x, 3, 2, 26, 28, '#7a4a26'); P(x, 3, 2, 26, 2, '#9a6a3a'); for (let y = 6; y < 30; y += 8) { P(x, 4, y, 24, 7, '#8a5a30'); P(x, 14, y + 2, 4, 2, '#d8b040'); } outline(x.canvas); },
  'z': (x) => { P(x, 0, 0, 32, 32, '#d8cfb0'); P(x, 0, 26, 32, 6, '#6a4a30'); P(x, 9, 2, 14, 24, '#f4eedc'); P(x, 9, 2, 14, 2, '#4a3a2a'); P(x, 9, 24, 14, 2, '#4a3a2a'); P(x, 13, 5, 6, 2, '#222'); P(x, 14, 9, 4, 6, '#222'); P(x, 13, 17, 6, 2, '#222'); P(x, 15, 20, 2, 3, '#c82020'); },
  'e': (x, r) => { TP.w(x, r); P(x, 6, 6, 20, 20, '#7a3a2a'); P(x, 8, 8, 16, 16, '#9a4a32'); P(x, 14, 10, 4, 10, '#f0d8a0'); P(x, 10, 16, 12, 2, '#f0d8a0'); },
  'A': (x, r) => { P(x, 0, 0, 32, 32, '#7a766c'); for (let y = 0; y < 32; y += 7) { const o = (y / 7) % 2 ? 5 : 0; for (let i = -o; i < 32; i += 10) { P(x, i + 1, y + 1, 9, 6, mix('#9a958a', '#a8a396', r())); P(x, i + 1, y + 1, 9, 1, '#c0bbae'); } } P(x, 0, 0, 32, 1, '#5a564e'); },
  'U': (x) => { P(x, 0, 0, 32, 32, '#f0ece0'); P(x, 0, 0, 32, 5, '#2a2e3a'); P(x, 0, 5, 32, 1, '#1a1c24'); P(x, 0, 22, 32, 10, '#1e1e22'); for (let i = 3; i < 32; i += 10) { P(x, i, 9, 5, 7, '#2a2a2a'); P(x, i + 1, 10, 3, 5, '#5a5040'); } for (let i = 0; i < 32; i += 4) P(x, i, 22, 1, 10, '#3a3a40'); },
  'G': (x) => { P(x, 0, 0, 32, 32, '#3a2a1a'); P(x, 0, 0, 32, 6, '#2a2e3a'); P(x, 2, 6, 28, 26, '#5a3a20'); P(x, 4, 8, 11, 24, '#7a5230'); P(x, 17, 8, 11, 24, '#7a5230'); for (let y = 12; y < 32; y += 6) { P(x, 6, y, 2, 2, '#c8a040'); P(x, 24, y, 2, 2, '#c8a040'); } },
  'J': (x, r) => { TP[','](x, r); P(x, 2, 4, 28, 3, '#c83020'); P(x, 0, 3, 32, 2, '#2a1a1a'); P(x, 4, 10, 24, 2, '#c83020'); P(x, 7, 4, 4, 28, '#c83020'); P(x, 21, 4, 4, 28, '#c83020'); P(x, 7, 4, 1, 28, '#e85a40'); P(x, 21, 4, 1, 28, '#e85a40'); P(x, 14, 7, 4, 4, '#2a1a1a'); },
  'l': (x, r) => { TP[','](x, r); ell(x, 16, 28, 8, 2, 'rgba(0,0,0,.3)'); P(x, 13, 18, 6, 10, '#8a8678'); P(x, 9, 15, 14, 3, '#9a968a'); P(x, 11, 8, 10, 7, '#a8a498'); P(x, 13, 10, 6, 3, '#f0d070'); P(x, 8, 5, 16, 3, '#8a8678'); P(x, 14, 2, 4, 3, '#8a8678'); outline(x.canvas, '#2a2824'); },
  'O': (x, r, f) => { P(x, 0, 0, 32, 32, '#8a8678'); P(x, 3, 3, 26, 26, '#6ab8c8'); P(x, 3, 3, 26, 3, '#9ad8e0'); for (let i = 0; i < 3; i++) disc(x, 8 + i * 8 + f, 10 + ((i + f) % 2) * 6, 3, 'rgba(255,255,255,.55)'); },
  'c': (x, r) => { P(x, 0, 0, 32, 32, '#5a4a3a'); speck(x, r, 30, ['#4a3a2e', '#6a5a48']); ell(x, 16, 20, 12, 12, '#120c0a'); ell(x, 16, 22, 9, 10, '#000'); },
  'X': (x, r) => { TP.u(x, r); for (let i = 0; i < 4; i++) { P(x, 1 + i * 8, 10, 7, 18, '#8a7a50'); P(x, 1 + i * 8, 10, 7, 2, '#b8a870'); for (let y = 13; y < 28; y += 4) P(x, 1 + i * 8, y, 7, 1, '#6a5a38'); } },
  'Y': (x, r, f) => { TP['.'](x, r, 0, 0); P(x, 6, 2, 2, 28, '#4a3220'); P(x, 8, 3 + f, 18, 20, '#f0ece0'); P(x, 8, 3 + f, 18, 2, '#c8c0a8'); disc(x, 17, 13 + f, 6, '#1a1a1a'); disc(x, 17, 13 + f, 4, '#f0ece0'); P(x, 16, 8 + f, 2, 11, '#1a1a1a'); P(x, 12, 12 + f, 11, 2, '#1a1a1a'); },
};
// 'D'（戸）は通れる（engine の passable で家のある戸だけ通す）。'~'（海・川）は通れない
const SOLID = new Set('T#HQhLgKFMmCSPxRrfbVvIkzAUGJlOcXYo~'.split(''));
const ANIM = new Set(['~', 'S', 'f', 'n', 'm', 'I', 'O', 'Y', 'o']);
const TILE_CACHE = {};
// v の下位4ビット＝模様の違い、上位＝隣のタイルによる縁（段差・水際・影）
function tileImg(ch, f, v) {
  const key = ch + '|' + f + '|' + v;
  if (!TILE_CACHE[key]) {
    const c = mk(32, 32), x = c.getContext('2d'), base = v & 15, bits = v >> 4;
    (TP[ch] || TP.x)(x, rnd(ch.charCodeAt(0) * 31 + base * 7 + 1), f, base);
    if (bits) paintEdge(x, ch, bits, f);
    TILE_CACHE[key] = c;
  }
  return TILE_CACHE[key];
}
// 立体感：水面は岸より一段低く、岩山・石垣は手前に壁面を見せ、高いものの右下に影を落とす
const WATER = new Set(['~', 'o', 'S', 'p']);
const TALL = new Set(['#', 'g', 'A', 'U', 'M', 'm', 'X', 'K']);
function edgeBits(m, x, y, ch) {
  const at = (i, j) => (i < 0 || j < 0 || i >= m.w || j >= m.h) ? ch : ((m.bmask && m.bmask[j * m.w + i]) || m.g[j][i]);
  const n = at(x, y - 1), s = at(x, y + 1), w = at(x - 1, y), e = at(x + 1, y);
  if (ch === '~' || ch === 'o') { const L = c => !WATER.has(c); return (L(n) ? 1 : 0) | (L(s) ? 2 : 0) | (L(w) ? 4 : 0) | (L(e) ? 8 : 0); }
  if (ch === 'M' || ch === '#' || ch === 'A') { const O = c => c !== ch && !(ch === 'M' && (c === 'm' || c === 'c')); return (O(n) ? 1 : 0) | (O(s) ? 2 : 0) | (O(w) ? 4 : 0) | (O(e) ? 8 : 0); }
  if ('.,;su'.includes(ch)) return (TALL.has(n) ? 1 : 0) | (TALL.has(w) ? 2 : 0);
  return 0;
}
function paintEdge(x, ch, b, f) {
  if (ch === '~' || ch === 'o') {
    const foam = '#e2f0fa', wet = ch === 'o' ? '#163a66' : '#1e4a80', lip = '#8ab8e0';
    if (b & 1) { P(x, 0, 0, 32, 5, wet); P(x, 0, 0, 32, 1, '#10284a'); P(x, 0, 5, 32, 1, lip); for (let i = (f * 3) % 7; i < 32; i += 7) P(x, i, 6, 3, 1, foam); }
    if (b & 2) { P(x, 0, 29, 32, 3, lip); for (let i = (f * 2) % 6; i < 32; i += 6) P(x, i, 28, 3, 1, foam); }
    if (b & 4) { P(x, 0, 0, 3, 32, wet); P(x, 3, 0, 1, 32, lip); for (let j = (f * 3) % 7; j < 32; j += 7) P(x, 4, j, 1, 3, foam); }
    if (b & 8) { P(x, 29, 0, 3, 32, wet); P(x, 28, 0, 1, 32, lip); }
  } else if (ch === 'M' || ch === '#' || ch === 'A') {
    const M = ch === 'M', face = M ? ['#4e4038', '#3a2e28', '#6a5a4e'] : ['#5e5b53', '#46443e', '#8a867c'];
    if (b & 2) { const h = M ? 13 : 9; P(x, 0, 32 - h, 32, h, face[0]); for (let i = 1; i < 32; i += M ? 5 : 8) { P(x, i, 32 - h + 1, 1, h - 1, face[1]); if (M) P(x, i + 1, 32 - h + 1, 1, h - 4, face[2]); } P(x, 0, 32 - h, 32, 1, M ? '#9a8a7a' : '#c8c3b5'); P(x, 0, 31, 32, 1, '#221a16'); }
    if (b & 1) P(x, 0, 0, 32, 2, M ? '#9a8a7a' : '#c8c3b5');
    if (b & 4) P(x, 0, 0, 2, 32, 'rgba(255,255,255,.18)');
    if (b & 8) P(x, 29, 0, 3, 32, 'rgba(0,0,0,.22)');
  } else {
    x.fillStyle = 'rgba(20,30,10,.24)';
    if (b & 1) { x.fillRect(0, 0, 32, 6); x.fillRect(0, 6, 32, 2); }
    if (b & 2) x.fillRect(0, (b & 1) ? 8 : 0, 5, 32 - ((b & 1) ? 8 : 0));
  }
}
// ミニマップ用の代表色
const TILE_COLOR = { '.': '#5b9a40', 'u': '#8a8a52', ',': '#c4a66e', ';': '#9a968a', 's': '#e6d6a0', '~': '#2f66a8', 'o': '#21508c', 'T': '#2b5f28', 'P': '#2d6233', 'b': '#5f9a3a', '#': '#8a867c', 'H': '#4d5468', 'Q': '#3c4252', 'h': '#ece6d4', 'D': '#28407a', 'L': '#c8a040', 'g': '#2a5e2e', 'K': '#8a6a40', 'W': '#ad9268', 'F': '#7a5634', 'n': '#5a7a8a', 'M': '#6c5c50', 'm': '#c84a1a', 'C': '#26262a', 'S': '#1b1b1b', '=': '#9b968a', 'p': '#8a6a42', 'f': '#e05a1a', 'r': '#3a3430', 'R': '#6a645c', 'w': '#a8784a', 't': '#c8c088', 'V': '#3a2a1e', 'v': '#ece4cc', 'e': '#9a4a32', 'A': '#9a958a', 'U': '#f0ece0', 'G': '#5a3a20', 'J': '#c83020', 'O': '#6ab8c8', 'c': '#120c0a', 'X': '#8a7a50' };

// ---------- 建物（家ごとに形を変えて、一枚絵で描く。足元のタイルは当たり判定とミニマップ用） ----------
// b: { x, y, w, h, door, style(buke/machiya/kaya/kura/tera/yoko/jin), roof(hip/gable/irimoya), wing(L/R), sign, noren, locked }
const BLD_UP = { buke: 12, machiya: 16, kaya: 22, kura: 18, tera: 30, yoko: 18, jin: 4 };
const BLD_CACHE = {};
function lerp(a, b, t) { return a + (b - a) * t; }
// 屋根：上辺 top〜軒先 bot。inset は棟の縮み（寄棟）
function paintRoof(x, L, R, top, bot, o) {
  const h = bot - top, mat = o.mat || 'kawara', inset = o.inset || 0, mid = o.mid != null ? o.mid : null;
  const base = o.col || (mat === 'kaya' ? '#a8834a' : mat === 'slate' ? '#4a5262' : '#4d5468');
  const lite = shade(base, mat === 'kaya' ? .22 : .28), dark = shade(base, -.35);
  for (let i = 0; i < h; i++) {
    const t = i / Math.max(1, h - 1), y = top + i;
    let ins = inset * (1 - t); if (mid != null) ins = i < mid ? inset * .55 : inset * .55 * (1 - (i - mid) / Math.max(1, h - mid));
    const l = Math.round(L + ins - t * 3), r = Math.round(R - ins + t * 3);
    P(x, l, y, r - l, 1, mix(lite, dark, Math.pow(t, 1.3)));
    if (mat === 'kawara') { if (i % 5 === 4) P(x, l, y, r - l, 1, shade(mix(lite, dark, t), -.35)); else if (i % 5 === 0) P(x, l, y, r - l, 1, shade(mix(lite, dark, t), .12)); for (let k = l + 2 + (i / 5 | 0) % 2 * 2; k < r - 1; k += 4) P(x, k, y, 1, 1, shade(mix(lite, dark, t), -.2)); }
    if (mat === 'slate') { for (let k = l + ((i >> 2) % 2) * 3; k < r; k += 6) P(x, k, y, 1, 1, shade(base, -.3)); if (i % 4 === 3) P(x, l, y, r - l, 1, shade(base, -.25)); }
    // 端（隅棟・破風）
    if (ins > 1 || mid != null && i >= mid) { P(x, l, y, 2, 1, shade(lite, .15)); P(x, r - 2, y, 2, 1, dark); }
    else { P(x, l, y, 2, 1, o.barge || '#3a2618'); P(x, r - 2, y, 2, 1, o.barge || '#3a2618'); }
  }
  if (mat === 'kaya') {
    const r = rnd(L * 7 + top * 3 + 11);
    for (let k = 0; k < (R - L) * h / 7; k++) { const t = r(), yy = top + 3 + t * (h - 8), ins = inset * (1 - t), l = L + ins, w = (R - ins) - l; P(x, l + r() * w, yy, 1, 3 + r() * 3, r() < .5 ? shade(base, .32) : shade(base, -.22)); }
    // 軒先の厚み（刈り込み）
    P(x, L - 3, bot - 5, R - L + 6, 5, '#6a4a26'); for (let k = L - 3; k < R + 3; k += 2) P(x, k, bot - 5 + (k % 3), 1, 3, '#8a6a3a'); P(x, L - 3, bot - 1, R - L + 6, 1, '#3a2614');
  } else {
    // 軒先の瓦（丸い先端）
    P(x, L - 3, bot - 2, R - L + 6, 2, shade(base, -.45)); for (let k = L - 2; k < R + 2; k += 4) P(x, k, bot - 3, 2, 2, shade(base, .35));
  }
  // 棟
  const rl = L + (mid != null ? inset * .55 : inset), rr = R - (mid != null ? inset * .55 : inset);
  if (mat === 'kaya') { P(x, rl - 2, top - 3, rr - rl + 4, 6, '#3a2a1a'); P(x, rl - 2, top - 3, rr - rl + 4, 1, '#6a5a3a'); for (let k = rl + 2; k < rr - 2; k += 7) P(x, k, top - 6, 2, 9, '#2a1e12'); }
  else { P(x, rl - 1, top - 3, rr - rl + 2, 5, shade(base, -.5)); P(x, rl - 1, top - 3, rr - rl + 2, 1, shade(base, .45)); P(x, rl - 3, top - 6, 5, 7, shade(base, -.55)); P(x, rr - 2, top - 6, 5, 7, shade(base, -.55)); P(x, rl - 3, top - 6, 5, 1, shade(base, .3)); P(x, rr - 2, top - 6, 5, 1, shade(base, .3)); }
}
function kanji(x, t, cx, cy, size, col) { x.save(); x.fillStyle = col; x.font = `bold ${size}px "DotGothic16", serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, cx, cy); x.restore(); }
function bldImg(b) {
  const key = JSON.stringify(b); if (BLD_CACHE[key]) return BLD_CACHE[key];
  const W = b.w * 32, H = (b.h || 3) * 32, st = b.style || 'buke', up = BLD_UP[st] || 12, M = 6;
  const c = mk(W + M * 2 + 8, H + up + 6), x = c.getContext('2d'), r = rnd(b.x * 31 + b.y * 17 + 5);
  x.translate(M, up);
  const dc = (b.door - b.x) * 32;   // 戸のある列の左端
  // 右側の影
  x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(W + 2, H - 40, 7, 40); x.fillRect(4, H, W + 4, 3);
  const posts = (y0, y1, col) => { for (let i = 0; i <= W; i += 32) P(x, Math.min(W - 3, i), y0, 3, y1 - y0, col); };
  const door = (y0, kind) => {
    const dx = dc + 4, dw = 24;
    if (kind === 'kura') { P(x, dx - 1, y0, dw + 2, H - y0, '#1e1a18'); P(x, dx + 1, y0 + 2, dw - 2, H - y0 - 2, b.locked ? '#3a3634' : '#120c0a'); if (b.locked) { P(x, dx + 11, y0 + 6, 2, H - y0 - 6, '#1e1a18'); P(x, dx + 9, y0 + 12, 6, 6, '#c8a040'); P(x, dx + 11, y0 + 14, 2, 3, '#1e1a18'); } return; }
    P(x, dx - 1, y0, dw + 2, H - y0, '#2e1d10'); P(x, dx, y0 + 1, dw, H - y0 - 1, '#8a6640'); for (let yy = y0 + 4; yy < H; yy += 4) P(x, dx, yy, dw, 1, '#6a4a2c'); P(x, dx + 11, y0 + 1, 2, H - y0 - 1, '#4a3420');
    if (b.noren) { const nc = b.noren; P(x, dx - 2, y0, dw + 4, 2, '#2a1a10'); for (let k = 0; k < 3; k++) { P(x, dx - 1 + k * 9, y0 + 2, 8, 11, nc); P(x, dx - 1 + k * 9, y0 + 2, 8, 1, shade(nc, .3)); P(x, dx - 1 + k * 9 + 7, y0 + 3, 1, 10, shade(nc, -.3)); } if (b.mark) kanji(x, b.mark, dx + 12, y0 + 8, 8, '#f4f0e6'); }
    else { P(x, dx, y0 + 2, dw, 5, '#f0e8d4'); for (let k = dx + 2; k < dx + dw; k += 4) P(x, k, y0 + 2, 1, 5, '#6a4a2c'); }
    P(x, dx - 2, H, dw + 4, 3, '#8a867c'); P(x, dx - 2, H, dw + 4, 1, '#b8b3a5');
  };
  const sign = (cy) => { if (!b.sign) return; const w = Math.max(22, b.sign.length * 10 + 6); const sx = dc + 16 - w / 2; P(x, sx - 1, cy - 7, w + 2, 15, '#2a1a10'); P(x, sx, cy - 6, w, 13, '#d8b878'); P(x, sx, cy - 6, w, 1, '#f0d8a0'); kanji(x, b.sign, sx + w / 2, cy + 1, 10, '#1a1210'); };
  const lattice = (wx, wy, ww, wh) => { P(x, wx - 1, wy - 1, ww + 2, wh + 2, '#3a2a1a'); P(x, wx, wy, ww, wh, '#2a2420'); for (let k = wx + 1; k < wx + ww; k += 3) P(x, k, wy, 1, wh, '#b89868'); P(x, wx, wy + (wh >> 1), ww, 1, '#b89868'); };
  if (st === 'buke' || st === 'jin') {
    const wh = 34, wt = H - wh, wl = b.wing ? (b.wing === 'L' ? 0 : W - 56) : -1, ml = b.wing === 'L' ? 50 : 0, mr = b.wing === 'R' ? W - 50 : W;
    // 壁
    P(x, 0, wt, W, wh, b.wall || '#efe8d6'); P(x, 0, wt + 15, W, wh - 15, '#5a3e26'); for (let yy = wt + 18; yy < H; yy += 4) P(x, 0, yy, W, 1, '#4a321e');
    P(x, 0, H - 3, W, 3, '#8a867c'); posts(wt, H, '#4a3220');
    for (let i = 0; i < W; i += 32) if (i !== dc) { if (r() < .7) lattice(i + 8, wt + 5, 16, 8); }
    door(wt + 4);
    // 屋根
    if (wl >= 0) paintRoof(x, wl, wl + 56, 22, wt + 4, { inset: 10, col: b.rc });
    paintRoof(x, ml, mr, -up + 8, wt + 4, { inset: b.roof === 'gable' ? 0 : (mr - ml) * .22, mid: b.roof === 'irimoya' ? Math.round((wt + 4 + up - 8) * .4) : null, col: b.rc });
    x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, wt + 4, W, 3);
    if (st === 'jin') { for (const px of [-4, W + 1]) { P(x, px, wt - 30, 2, 30 + wh, '#3a2a1a'); P(x, px + (px < 0 ? -6 : 2), wt - 28, 7, 22, '#f0ece0'); disc(x, px + (px < 0 ? -3 : 5), wt - 18, 2, '#1a1a1a'); } P(x, 0, wt + 6, W, 10, '#f0ece0'); for (let i = 16; i < W; i += 48) { disc(x, i, wt + 11, 4, '#1a1a1a'); disc(x, i, wt + 11, 3, '#f0ece0'); P(x, i - 3, wt + 11, 7, 1, '#1a1a1a'); P(x, i, wt + 8, 1, 7, '#1a1a1a'); } }
    sign(wt + 2);
  } else if (st === 'kaya') {
    const wh = 30, wt = H - wh;
    P(x, 0, wt, W, wh, '#c8a878'); speck(x, r, W, ['#b8986a', '#d8b888'], W, wh); x.translate(0, 0);
    for (let yy = wt; yy < H; yy++) if (r() < .02) P(x, 0, yy, W, 1, '#b08a5a');
    P(x, 0, wt + 16, W, wh - 16, '#6a4a2c'); for (let yy = wt + 19; yy < H; yy += 4) P(x, 0, yy, W, 1, '#5a3c22'); posts(wt, H, '#4a3220');
    for (let i = 0; i < W; i += 32) if (i !== dc && r() < .6) lattice(i + 9, wt + 4, 14, 8);
    door(wt + 4);
    paintRoof(x, 0, W, -up + 10, wt + 6, { mat: 'kaya', inset: W * .26 });
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, wt + 6, W, 3);
    sign(wt + 3);
  } else if (st === 'machiya') {
    const w1 = 30, t1 = H - w1, t2 = t1 - 26;
    P(x, 0, t1, W, w1, '#4a2e1a'); for (let i = 1; i < W; i += 3) P(x, i, t1 + 2, 1, w1 - 4, '#8a6038'); P(x, 0, H - 3, W, 3, '#8a867c'); posts(t1, H, '#2a1a10');
    door(t1 + 2);
    P(x, 0, t2, W, 26, '#e8dcc0'); posts(t2, t1, '#4a3220'); for (let i = 0; i < W; i += 32) { P(x, i + 7, t2 + 8, 18, 9, '#3a2a1a'); for (let k = i + 8; k < i + 25; k += 3) P(x, k, t2 + 8, 1.5, 9, '#d8ccb0'); }
    paintRoof(x, -2, W + 2, t1 - 9, t1 + 3, { col: b.rc });
    x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, t1 + 3, W, 3);
    paintRoof(x, 0, W, -up + 8, t2 + 3, { inset: 0, col: b.rc });
    x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, t2 + 3, W, 3);
    sign(t1 - 4);
  } else if (st === 'kura') {
    const wt = H - 64;
    P(x, 0, wt, W, 64, '#f4f0e4'); P(x, 0, wt, 3, 64, '#fffaf0'); P(x, W - 6, wt, 6, 64, '#d8d0c0');
    const nz = H - 20; P(x, 0, nz, W, 20, '#3a3c42'); for (let i = -20; i < W + 20; i += 7) for (let k = 0; k < 20; k++) { P(x, i + k * .5, nz + k, 1, 1, '#e8e4dc'); P(x, i + 10 - k * .5, nz + k, 1, 1, '#e8e4dc'); }
    P(x, W / 2 - 7, wt + 8, 14, 11, '#1e1a18'); P(x, W / 2 - 5, wt + 10, 10, 7, '#3a3634');
    door(H - 30, 'kura');
    paintRoof(x, -2, W + 2, -up + 8, wt + 4, { inset: 0, col: '#2e3038' });
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, wt + 4, W, 3);
  } else if (st === 'tera') {
    const wh = 36, wt = H - wh;
    P(x, -2, H - 4, W + 4, 4, '#9a968a'); P(x, -2, H - 4, W + 4, 1, '#c0bbae');
    P(x, 0, wt, W, wh - 4, '#e8dcc0'); posts(wt, H - 4, '#8a3a22'); P(x, 0, wt + 2, W, 3, '#8a3a22');
    for (let i = 0; i < W; i += 32) if (i !== dc) lattice(i + 6, wt + 9, 20, 16);
    door(wt + 6);
    paintRoof(x, -4, W + 4, -up + 8, wt + 6, { inset: W * .3, mid: Math.round((wt + up) * .38), col: '#3e4452' });
    for (const ex of [-7, W + 2]) P(x, ex, wt + 1, 5, 3, '#3e4452');
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, wt + 6, W, 4);
  } else if (st === 'yoko') {
    const wt = H - 62;
    P(x, 0, wt, W, 62, '#a8503a'); for (let yy = wt; yy < H; yy += 4) { P(x, 0, yy, W, 1, '#8a3a2a'); for (let k = (yy / 4 % 2) * 5; k < W; k += 10) P(x, k, yy, 1, 4, '#8a3a2a'); }
    P(x, 0, wt + 28, W, 3, '#e8e0d0'); P(x, 0, H - 4, W, 4, '#8a867c');
    for (let i = 0; i < W; i += 32) { for (const wy of [wt + 6, wt + 36]) { if (i === dc && wy > wt + 30) continue; P(x, i + 9, wy, 14, 18, '#f0ece0'); P(x, i + 11, wy + 2, 10, 14, '#2a3a5a'); P(x, i + 15, wy + 2, 2, 14, '#f0ece0'); P(x, i + 11, wy + 8, 10, 1, '#f0ece0'); P(x, i + 8, wy + 18, 16, 2, '#d8d0c0'); } }
    const dx = dc + 6; P(x, dx - 2, H - 30, 24, 30, '#e8e0d0'); P(x, dx, H - 28, 20, 28, '#3a2418'); P(x, dx + 9, H - 28, 2, 28, '#2a1a10'); disc(x, dx + 6, H - 14, 1, '#e0c040'); disc(x, dx + 14, H - 14, 1, '#e0c040');
    paintRoof(x, -2, W + 2, -up + 6, wt + 3, { mat: 'slate', inset: W * .18 });
    x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, wt + 3, W, 3);
    sign(H - 34);
  }
  return (BLD_CACHE[key] = { c, ox: -M, oy: -up });
}

// ---------- 人物（マップ 32x48 ／ 戦闘 64x96） ----------
// p: { skin, hair, hs(髪型), hat, body, body2, cloth, belt, sword, big, crest, beard, pose, kind }
// 頭身は約3。光は左上から当たる（右と下が暗い）。
function paintFig(x, p, d, f, s = 1) {
  const R = (a, b, w, h, c) => P(x, a * s, b * s, w * s, h * s, c);
  const E = (cx, cy, rx, ry, c) => ell(x, cx * s, cy * s, rx * s, ry * s, c);
  const sk = p.skin || '#f2c49c', skD = shade(sk, -.16), skL = shade(sk, .18), hr = p.hair || '#1c1a22', hrL = shade(hr, .32), hrD = shade(hr, -.4);
  const bd = p.body || '#3a4a6a', bdD = shade(bd, -.3), bdL = shade(bd, .2), b2 = p.body2 || shade(bd, -.35), b2D = shade(b2, -.3), b2L = shade(b2, .18);
  const cl = p.cloth || 'kimono', big = p.big ? 2 : 0, jap = cl !== 'west' && cl !== 'uniform';
  const walk = f === 1 ? 1 : f === 2 ? -1 : 0, bob = walk ? -1 : 0;
  const ink = '#1a1214', iris = p.eyec || '#3a2418', white = '#fbf6ee';
  E(16, 45.5, 9 + big, 2.4, 'rgba(0,0,0,.3)');
  // ---- 下半身 ----
  if (d === 1) {
    if (jap) {
      const col = cl === 'hakama' ? b2 : bd, cD = cl === 'hakama' ? b2D : bdD;
      for (let y = 31; y < 44; y++) { const k = (y - 31) / 13; R(11 - k * (cl === 'dress' ? 0 : 2) + (walk > 0 ? k * 2 : 0), y, 10 + k * (cl === 'dress' ? 1 : 4), 1, col); }
      R(11, 31, 2, 13, cD); if (cl === 'hakama') { R(15, 33, 1, 11, cD); R(19, 34, 1, 10, cD); }
      R(10 + walk * 2, 43, 6, 3, '#2a1e18'); R(16 - walk * 2, 43, 6, 3, '#3a2a20'); R(10 + walk * 2, 45, 6, 1, '#c8b890');
    } else {
      const lg = b2; R(12 + walk * 2, 32, 5, 12, lg); R(15 - walk * 2, 32, 5, 12, shade(lg, -.2)); R(11 + walk * 2, 43, 8, 3, '#141414'); R(14 - walk * 2, 43, 8, 3, '#1e1e1e'); R(11 + walk * 2, 43, 8, 1, '#4a4a4a');
    }
  } else if (jap) {
    const col = cl === 'hakama' ? b2 : bd, cD = cl === 'hakama' ? b2D : bdD, cL = cl === 'hakama' ? b2L : bdL, nar = cl === 'dress' ? 3 : 0;
    for (let y = 31; y < 44; y++) { const k = (y - 31) / 13, w = 14 + big * 2 + k * (6 - nar * 2); R(16 - w / 2, y, w, 1, col); R(16 + w / 2 - 3, y, 3, 1, cD); R(16 - w / 2, y, 1, 1, cL); }
    if (cl === 'hakama') { for (const px of [12, 15, 18]) R(px + (px - 15) * .3, 33, 1, 11, cD); R(16 - (11 + big), 43, 22 + big * 2, 1, cD); }
    else if (cl === 'dress') { R(16, 33, 1, 11, cD); R(16 - (6 + big), 42, 12 + big * 2, 2, cD); }
    else { R(17, 33, 1, 11, cD); R(13, 34, 1, 9, bdL); }
    const fy = 43; R(10 + walk, fy + (walk > 0 ? -1 : 0), 5, 3, '#2a1e18'); R(17 - walk, fy + (walk < 0 ? -1 : 0), 5, 3, '#2a1e18');
    R(10 + walk, fy + 2 + (walk > 0 ? -1 : 0), 5, 1, '#e8e0cc'); R(17 - walk, fy + 2 + (walk < 0 ? -1 : 0), 5, 1, '#e8e0cc');
  } else {
    const lg = b2;
    R(10 - big, 32 + (walk > 0 ? -1 : 0), 6, 12, lg); R(16 + big, 32 + (walk < 0 ? -1 : 0), 6, 12, shade(lg, -.12)); R(15.5, 33, 1, 10, shade(lg, -.35)); R(10 - big, 32, 1, 11, shade(lg, .15));
    if (cl === 'uniform') { R(11 - big, 33, 1, 10, '#c02020'); R(20 + big, 33, 1, 10, '#c02020'); }
    R(9 - big, 43, 7, 3, '#141414'); R(16 + big, 43, 7, 3, '#141414'); R(9 - big, 43, 7, 1, '#4a4a4a'); R(16 + big, 43, 7, 1, '#4a4a4a');
  }
  // ---- 胴 ----
  const tw = d === 1 ? 12 : 16 + big * 2, tx = 16 - tw / 2, ty = 19 + bob;
  R(tx, ty, tw, 14, bd); R(tx, ty, tw, 1, bdL); R(tx, ty + 1, 2, 12, bdL); R(tx + tw - 4, ty + 1, 4, 13, bdD);
  if (d === 0) {
    if (cl === 'west') { R(14, ty, 4, 7, '#f2f2f2'); R(15, ty + 1, 2, 6, p.tie || '#7a1a1a'); for (let i = 0; i < 6; i++) { R(12 + i * .4, ty + i, 2, 1, bdD); R(18.5 - i * .4, ty + i, 2, 1, bdD); } R(15.5, ty + 8, 1, 1, '#c8c0a0'); R(15.5, ty + 11, 1, 1, '#c8c0a0'); }
    else if (cl === 'uniform') { R(tx, ty, tw, 3, shade(bd, -.45)); R(13, ty, 6, 2, '#c02020'); for (let y = ty + 4; y < ty + 13; y += 3) R(15.5, y, 1.2, 1.2, '#f0d040'); R(tx - 1, ty, 4, 2, '#e0c040'); R(tx + tw - 3, ty, 4, 2, '#e0c040'); R(tx + 2, ty + 9, 3, 1, bdD); R(tx + tw - 5, ty + 9, 3, 1, bdD); }
    else {
      for (let i = 0; i < 8; i++) { R(12 + i * .55, ty + i, 2, 1, '#f4eee0'); R(18.2 - i * .55, ty + i, 2, 1, '#f4eee0'); R(13.6 + i * .55, ty + i, .8, 1, shade(bd, -.45)); }
      R(14.5, ty, 3, 2, skD);
      if (cl === 'robe') for (let i = 0; i < 13; i++) { R(10 + i, ty + 1 + i, 2, 1, p.kesa || '#8a3a22'); R(10 + i, ty + 2 + i, 1, 1, shade(p.kesa || '#8a3a22', -.3)); }
    }
    if (p.crest) { E(12, ty + 6, 2, 2, '#f4f0e6'); R(11, ty + 6, 2, .6, bd); R(12, ty + 4.5, .6, 3, bd); }
  }
  if (jap) { const bc = p.belt || shade(bd, -.5); R(tx, 30 + bob, tw, 3, bc); R(tx, 30 + bob, tw, 1, shade(bc, .25)); if (d === 3 && cl === 'dress') { R(11, 28, 10, 6, p.belt || '#c8a040'); R(13, 29, 6, 4, shade(p.belt || '#c8a040', -.2)); } }
  else { R(tx, 31, tw, 2, '#1a1a1a'); if (d === 0) R(15, 31, 2, 2, '#c8b060'); }
  // ---- 刀 ----
  if (p.sword && d !== 3) {
    if (d === 0) { for (let i = 0; i < 10; i++) R(21 + big + i * .6, 27 + bob + i * .95, 1.6, 1.4, i < 3 ? '#2a1a1a' : '#3a2e30'); R(20 + big, 26 + bob, 3, 2, '#c8a040'); R(20 + big, 26 + bob, 1, 1, '#f0d070'); }
    else { for (let i = 0; i < 14; i++) R(16 + i * .6, 29 + bob + i * .3, 1.6, 1.6, i < 4 ? '#2a1a1a' : '#3a2e30'); R(15, 29 + bob, 2, 2, '#c8a040'); }
  }
  // ---- 腕（和服は袂が垂れる） ----
  const sl = jap ? 2 : 0;
  if (d === 1) { const a = walk * 2; R(13 + a, ty + 3, 5, 9, bdD); if (sl) R(12 + a, ty + 9, 7, 4, bdD); R(13 + a, ty + 12, 4, 3, sk); }
  else {
    const la = walk, ra = -walk;
    R(tx - 3, ty + 2 + Math.max(0, la), 4, 9, bd); R(tx - 3, ty + 2, 1, 9, bdL);
    R(tx + tw - 1, ty + 2 + Math.max(0, ra), 4, 9, bdD);
    if (sl) { R(tx - 4, ty + 8 + la, 5, 5, bd); R(tx - 4, ty + 12 + la, 5, 1, bdD); R(tx + tw - 1, ty + 8 + ra, 5, 5, bdD); R(tx + tw - 1, ty + 12 + ra, 5, 1, shade(bd, -.5)); }
    R(tx - 3, ty + 11 + la + sl, 4, 3, sk); R(tx + tw - 1, ty + 11 + ra + sl, 4, 3, skD);
  }
  // ---- 頭 ----
  const hx = (d === 1 ? 15 : 16), hy = 12 + bob, hs = p.hs || 'mage';
  R(hx - 2, hy + 6, 4, 3, skD);
  if (d === 1) { E(hx, hy, 7 + big * .5, 7.2, sk); E(hx - 4, hy + 4, 3, 3, sk); R(hx - 8, hy + 1, 2, 2, sk); E(hx + 3, hy + 2, 3, 4, skD); }
  else { E(hx, hy, 7.2 + big * .5, 7, sk); E(hx, hy + 3, 6 + big * .5, 5, sk); E(hx + 3.5, hy + 2, 3, 4.5, skD); E(hx - 3, hy - 1, 2.5, 2.5, skL); }
  const pate = p.pate || mix(sk, '#a8b8d0', .35);
  if (d === 3) {
    if (hs !== 'bald') { E(hx, hy - 1, 7.6 + big * .5, 7.4, hr); R(hx - 5, hy - 6, 3, 2, hrL); R(hx + 3, hy + 1, 4, 5, hrD); }
    if (hs === 'mage' || hs === 'boy') { E(hx, hy - 4, 5, 3, pate); R(hx - 1, hy - 10, 3, 7, hr); R(hx - 1, hy - 10, 1, 6, hrL); R(hx - 1, hy - 4, 3, 1, '#e8e0d0'); }
    if (hs === 'woman') { E(hx, hy - 8, 6.5, 4, hr); E(hx, hy + 5, 6, 3, hr); R(hx - 7, hy - 9, 14, 1.5, '#d8b040'); E(hx - 2, hy - 10, 2, 1, hrL); }
    if (hs === 'west' || hs === 'short' || hs === 'kid') for (let i = -6; i < 7; i += 3) R(hx + i, hy + 5, 2, 2, hr);
  } else if (d === 0) {
    if (hs === 'mage' || hs === 'boy') {
      E(hx, hy - 4, 6, 3.5, pate); R(hx - 3, hy - 6, 2, 1, shade(pate, .3));
      R(hx - 8, hy - 4, 3, 9, hr); R(hx + 5, hy - 4, 3, 9, hrD); R(hx - 8, hy - 4, 1, 7, hrL); R(hx - 7, hy - 6, 2, 3, hr); R(hx + 5, hy - 6, 2, 3, hr);
      R(hx - 1, hy - 12, 3, 8, hr); R(hx - 1, hy - 12, 1, 7, hrL); R(hx - 2, hy - 13, 5, 2, hr); R(hx - 1, hy - 7, 3, 1, '#ece4d4');
      if (hs === 'boy') { E(hx, hy - 4, 5.5, 2.5, hr); for (const i of [-5, -2, 1, 4]) R(hx + i, hy - 3, 2, 2 + (i & 1), hr); R(hx - 3, hy - 6, 4, 1, hrL); }
    } else if (hs === 'short' || hs === 'west' || hs === 'kid') {
      E(hx, hy - 4, 8 + big * .5, 5, hr); R(hx - 8, hy - 4, 2, hs === 'west' ? 9 : 7, hr); R(hx + 6, hy - 4, 2, hs === 'west' ? 9 : 7, hrD);
      // 前髪の房（ぎざぎざ）
      const tufts = hs === 'west' ? [[-6, 2], [-3, 3], [2, 2], [5, 2]] : hs === 'kid' ? [[-7, 3], [-4, 4], [-1, 3], [2, 4], [5, 3]] : [[-6, 3], [-3, 2], [0, 3], [3, 2], [5, 3]];
      for (const [i, h] of tufts) R(hx + i, hy - 1, 2, h, hr);
      if (hs === 'west') { R(hx - 2, hy - 8, 1, 7, hrD); E(hx + 3, hy - 6, 4, 2, hrL); }
      else { R(hx - 5, hy - 7, 4, 1, hrL); R(hx - 3, hy - 8, 3, 1, hrL); for (const i of [-6, -1, 4]) R(hx + i, hy - 10, 2, 2, hr); }
    } else if (hs === 'woman') {
      E(hx, hy - 4, 8.5, 5, hr); E(hx, hy - 10, 6.5, 4, hr); E(hx - 8, hy - 2, 2.5, 4, hr); E(hx + 8, hy - 2, 2.5, 4, hrD);
      R(hx - 7, hy - 9, 14, 1.5, '#d8b040'); R(hx + 5, hy - 13, 1, 5, '#d8b040'); E(hx + 5.5, hy - 13.5, 1.4, 1.4, '#e85a7a'); E(hx - 3, hy - 12, 2.5, 1, hrL); R(hx - 1, hy - 2, 1, 1, hrD);
    } else if (hs === 'bald') { E(hx - 3, hy - 4, 2, 1, '#fff6e6'); }
    // 顔
    const ey = hy + 1, sx = big ? 1 : 0;
    if (p.eyes === 'narrow') { R(hx - 5 - sx, ey + 1, 3, 1, ink); R(hx + 2 + sx, ey + 1, 3, 1, ink); }
    else if (p.eyes === 'closed') { R(hx - 5 - sx, ey + 1, 3, 1, ink); R(hx - 5 - sx, ey, 1, 1, ink); R(hx + 2 + sx, ey + 1, 3, 1, ink); R(hx + 4 + sx, ey, 1, 1, ink); }
    else {
      const bg = p.eyes === 'big' ? 1 : 0;
      R(hx - 5 - sx, ey - bg, 3, 1, ink); R(hx + 2 + sx, ey - bg, 3, 1, ink);
      R(hx - 5 - sx, ey + 1 - bg, 1, 2 + bg, white); R(hx - 4 - sx, ey + 1 - bg, 2, 2 + bg, iris); R(hx - 4 - sx, ey + 1 - bg, 1, 1, '#ffffff');
      R(hx + 4 + sx, ey + 1 - bg, 1, 2 + bg, white); R(hx + 2 + sx, ey + 1 - bg, 2, 2 + bg, iris); R(hx + 2 + sx, ey + 1 - bg, 1, 1, '#ffffff');
    }
    if (p.brow) { R(hx - 6 - sx, ey - 2 - (p.brow > 1 ? 1 : 0), 4, p.brow, hr); R(hx + 2 + sx, ey - 2 - (p.brow > 1 ? 1 : 0), 4, p.brow, hr); }
    R(hx, ey + 3, 1, 1, skD); R(hx - 1, ey + 5, 3, 1, '#a04a42');
    if (p.blush) { R(hx - 7, ey + 3, 2, 1, '#f09a90'); R(hx + 5, ey + 3, 2, 1, '#f09a90'); }
    if (p.beard) { R(hx - 7, ey + 2, 2, 5, p.beard); R(hx + 5, ey + 2, 2, 5, p.beard); R(hx - 5, ey + 6, 10, 2, p.beard); R(hx - 3, ey + 4, 2, 1, p.beard); R(hx + 1, ey + 4, 2, 1, p.beard); }
  } else {
    // 横向き
    if (hs !== 'bald') { E(hx + 2, hy - 2, 7, 6, hr); R(hx + 2, hy - 2, 6, 9, hr); R(hx + 5, hy + 1, 3, 6, hrD); R(hx - 2, hy - 7, 5, 1, hrL); }
    if (hs === 'mage' || hs === 'boy') { E(hx - 1, hy - 4, 4.5, 3, pate); R(hx - 1, hy - 10, 7, 3, hr); R(hx - 1, hy - 10, 6, 1, hrL); R(hx + 4, hy - 9, 3, 4, hr); R(hx + 3, hy - 8, 1, 3, '#ece4d4'); if (hs === 'boy') R(hx - 7, hy - 5, 5, 3, hr); }
    if (hs === 'short' || hs === 'kid' || hs === 'west') { R(hx - 6, hy - 5, 5, 3, hr); R(hx - 6, hy - 2, 2, 2, hr); R(hx - 3, hy - 9, 6, 2, hr); }
    if (hs === 'woman') { E(hx + 2, hy - 9, 6, 4, hr); E(hx + 7, hy + 3, 3, 3, hr); R(hx - 3, hy - 8, 12, 1.5, '#d8b040'); }
    if (p.eyes === 'narrow' || p.eyes === 'closed') R(hx - 5, hy + 2, 3, 1, ink);
    else { R(hx - 5, hy + 1, 3, 1, ink); R(hx - 5, hy + 2, 2, 2, iris); R(hx - 3, hy + 2, 1, 2, white); R(hx - 5, hy + 2, 1, 1, '#fff'); }
    if (p.brow) R(hx - 6, hy - 1, 4, p.brow, hr);
    if (p.beard) { R(hx - 7, hy + 6, 9, 3, p.beard); R(hx, hy + 2, 3, 6, p.beard); }
    R(hx - 7, hy + 6, 2, 1, '#a04a42');
    E(hx + 1, hy + 2, 1.5, 2, skD);
  }
  // ---- 帽子 ----
  const H = p.hat;
  if (H === 'jingasa') { E(hx, hy - 6, 12, 2.5, '#2a2420'); E(hx, hy - 7, 12, 1, '#4a4038'); E(hx, hy - 8, 7, 3, '#3a322c'); E(hx - 2, hy - 9, 3, 1, '#5a5048'); R(hx - 1, hy - 10, 2, 2, '#c8a040'); }
  if (H === 'kasa') { for (let y = 0; y < 8; y++) R(hx - 3 - y * 1.6, hy - 13 + y, 6 + y * 3.2, 1, y % 2 ? '#c8a86a' : '#b8985a'); R(hx - 15, hy - 5, 30, 1, '#8a6a3a'); }
  if (H === 'cap') { E(hx, hy - 7, 8, 3, '#f4f4f4'); R(hx - 8, hy - 6, 16, 2, '#1a2440'); }
  if (H === 'shako') { R(hx - 6, hy - 15, 12, 10, '#1a1a1a'); R(hx - 6, hy - 15, 2, 10, '#3a3a3a'); R(hx - 6, hy - 7, 12, 2, '#c8a040'); R(hx - 1, hy - 14, 2, 3, '#e0e0e0'); }
  if (H === 'bicorne') { E(hx, hy - 8, 12, 3.5, '#1a1a2a'); E(hx - 3, hy - 10, 5, 1, '#3a3a4a'); R(hx - 1, hy - 11, 2, 2, '#c8a040'); }
  if (H === 'kepi') { const hc = p.hatc || '#1a2244'; R(hx - 7, hy - 12, 14, 7, hc); R(hx - 7, hy - 12, 3, 7, shade(hc, .25)); R(hx - 7, hy - 7, 14, 2, '#c02020'); if (d !== 3) R(hx - 8 + (d === 1 ? -2 : 0), hy - 5, d === 1 ? 7 : 16, 2, '#111'); if (d === 0) R(hx - 1, hy - 11, 2, 2, '#e0c040'); }
  if (H === 'hachimaki') { R(hx - 8, hy - 3, 16, 2, '#f4f4f4'); R(hx - 8, hy - 2, 16, 1, '#d0d0d0'); if (d === 1) { R(hx + 7, hy - 3, 3, 2, '#f4f4f4'); R(hx + 9, hy - 2, 3, 4, '#f4f4f4'); } if (d === 3) { R(hx - 2, hy - 3, 4, 3, '#f4f4f4'); R(hx - 3, hy, 2, 4, '#f4f4f4'); R(hx + 1, hy, 2, 4, '#e0e0e0'); } }
  if (H === 'eboshi') { R(hx - 4, hy - 17, 8, 11, '#1a1a1a'); R(hx - 3, hy - 17, 3, 11, '#2e2e2e'); }
  if (H === 'zukin') { E(hx, hy - 2, 8.5, 8.5, p.hatc || '#3a3a5a'); E(hx - 3, hy - 5, 3, 2, shade(p.hatc || '#3a3a5a', .2)); if (d === 0) { E(hx, hy + 2, 5.5, 3.5, sk); R(hx - 4, hy + 1, 2, 2, ink); R(hx + 2, hy + 1, 2, 2, ink); } }
}
// 戦闘用の構え（武器を持つ）
function paintPose(x, p, s) {
  const R = (a, b, w, h, c) => P(x, a * s, b * s, w * s, h * s, c);
  const sk = p.skin || '#f2c49c', bd = p.body || '#3a4a6a';
  switch (p.pose) {
    case 'tonbo': R(24, 13, 5, 11, bd); R(24, 11, 6, 4, sk); R(26, -2, 2, 14, p.blade || '#dfe4ec'); R(26, -2, 1, 13, '#ffffff'); R(24, 11, 6, 1, '#2a2a2a'); break;
    case 'bokuto': R(24, 13, 5, 11, bd); R(24, 11, 6, 4, sk); R(26, -2, 2.5, 14, '#a07a48'); break;
    case 'rifle': for (let i = 0; i < 26; i++) R(2 + i, 38 - i * 1.1, 2.2, 2.2, i < 17 ? '#5a3a1e' : '#9aa0a8'); R(4, 33, 5, 3, sk); break;
    case 'cutlass': R(26, 18, 1.5, 14, '#cfd4dc'); R(24, 31, 5, 1.5, '#c8a040'); break;
    case 'spear': R(27, -6, 1.5, 48, '#7a5a34'); R(26.5, -8, 2.5, 5, '#dfe4ec'); break;
    case 'fan': R(24, 16, 6, 6, '#1a1a1a'); disc(x, 30 * s, 14 * s, 4 * s, '#c8a040'); disc(x, 30 * s, 14 * s, 2 * s, '#c02020'); break;
    case 'club': R(26, 10, 3, 18, '#7a5a34'); break;
    case 'pistol': R(25, 22, 6, 2.5, '#3a3a3a'); R(25, 22, 2, 4, '#5a3a1e'); break;
  }
}
function paintDog(x, p, d, f) {
  const c = p.body || '#3a2a22', cD = shade(c, -.3), cL = shade(c, .25);
  ell(x, 16, 45.5, 8, 2, 'rgba(0,0,0,.28)');
  if (d === 1) {
    P(x, 9, 32, 16, 8, c); P(x, 9, 32, 16, 2, cL); P(x, 10 + f, 39, 3, 6, cD); P(x, 21 - f, 39, 3, 6, cD); P(x, 13 - f, 39, 3, 6, c); P(x, 18 + f, 39, 3, 6, c);
    P(x, 24, 26, 3, 7, c); P(x, 25, 24, 4, 3, c); P(x, 3, 26, 9, 8, c); P(x, 1, 30, 4, 4, cL); P(x, 0, 31, 2, 2, '#111'); P(x, 5, 28, 2, 2, '#111'); P(x, 6, 22, 3, 5, c); P(x, 9, 23, 2, 4, cD);
  } else {
    P(x, 10, 30, 12, 11, c); P(x, 10, 30, 12, 2, cL); P(x, 11, 40, 3, 5, cD); P(x, 18, 40, 3, 5, cD);
    ell(x, 16, 26, 7, 6, c); P(x, 9, 18, 4, 7, c); P(x, 19, 18, 4, 7, c);
    if (d === 0) { P(x, 12, 25, 2, 2, '#111'); P(x, 18, 25, 2, 2, '#111'); P(x, 13, 28, 6, 4, cL); P(x, 15, 28, 2, 2, '#111'); if (f) P(x, 15, 31, 2, 2, '#e05a6a'); P(x, 10, 33, 12, 2, '#c02020'); }
    else P(x, 15, 34 - f, 2, 6, c);
  }
}
function paintHorse(x, d, f) {
  const c = '#7a4a26', cD = '#5a341a', m = '#2a1a10';
  ell(x, 24, 61, 16, 3, 'rgba(0,0,0,.3)');
  if (d === 1) {
    P(x, 10, 36, 30, 13, c); P(x, 10, 36, 30, 3, shade(c, .2)); P(x, 12 + f * 2, 48, 4, 13, cD); P(x, 35 - f * 2, 48, 4, 13, cD); P(x, 17 - f * 2, 48, 4, 13, c); P(x, 30 + f * 2, 48, 4, 13, c);
    P(x, 2, 24, 10, 16, c); P(x, 0, 22, 8, 8, c); P(x, 0, 27, 3, 2, '#111'); P(x, 3, 24, 2, 2, '#111'); P(x, 8, 22, 5, 14, m); P(x, 39, 38, 5, 14, m); P(x, 14, 34, 16, 4, '#8a2a1a');
  } else {
    P(x, 14, 34, 20, 16, c); P(x, 15, 49, 5, 12, cD); P(x, 28, 49, 5, 12, cD);
    if (d === 0) { P(x, 18, 28, 12, 20, c); P(x, 19, 44, 10, 6, shade(c, .15)); P(x, 19, 33, 2, 2, '#111'); P(x, 27, 33, 2, 2, '#111'); P(x, 22, 28, 4, 20, '#e8e0d0'); }
    else { P(x, 21, 24, 6, 12, m); P(x, 22, 48, 4, 10, m); }
    P(x, 12, 36, 24, 4, '#8a2a1a');
  }
}
const CH_CACHE = {};
function sprParams(key) { const p = PEOPLE[key]; return (p && (typeof p.spr === 'function' ? p.spr() : p.spr)) || { body: '#555' }; }
function charImg(key, d, f) {
  const p = sprParams(key), ck = key + JSON.stringify(p);
  if (!CH_CACHE[ck]) {
    const out = {};
    for (const dd of [0, 1, 3]) for (const ff of [0, 1, 2]) {
      const c = mk(32, 48), x = c.getContext('2d');
      if (p.kind === 'dog') paintDog(x, p, dd, ff === 1 ? 1 : 0);
      else if (p.kind === 'pot') { ell(x, 16, 45, 10, 2.5, 'rgba(0,0,0,.3)'); ell(x, 16, 36, 10, 9, '#1c1a1e'); P(x, 10, 24, 12, 6, '#1c1a1e'); ell(x, 16, 24, 6, 2, '#3a3640'); P(x, 9, 32, 2, 6, '#4a4650'); P(x, 12, 30, 1, 2, '#6a6670'); }
      else if (p.kind === 'chest') { ell(x, 16, 45, 12, 2.5, 'rgba(0,0,0,.3)'); P(x, 4, 30, 24, 15, p.open ? '#6a4a2a' : '#9a7a4a'); for (let i = 5; i < 28; i += 3) P(x, i, 30, 1, 15, '#7a5a32'); P(x, 3, 27, 26, 5, p.open ? '#4a3420' : '#b89a5a'); P(x, 3, 27, 26, 1, '#d8ba7a'); P(x, 14, 32, 4, 4, '#c8a040'); }
      else if (p.kind === 'boat') { P(x, 2, 36, 28, 6, '#5a3a20'); P(x, 4, 42, 24, 2, '#3a2410'); P(x, 8, 26, 5, 10, '#333'); disc(x, 10, 23, 3, '#e0b890'); P(x, 7, 20, 6, 2, '#111'); P(x, 18, 26, 5, 10, '#6a6a70'); disc(x, 20, 23, 3, '#e0b890'); }
      else if (p.kind === 'horse') { const h = mk(48, 64); paintHorse(h.getContext('2d'), dd, ff === 1 ? 1 : 0); x.drawImage(h, -8, -16); }
      else if (p.kind === 'sign') { P(x, 14, 26, 4, 20, '#6a4a2a'); P(x, 4, 18, 24, 12, '#c8a46a'); P(x, 4, 18, 24, 2, '#e0c08a'); for (let i = 7; i < 26; i += 4) P(x, i, 22, 2, 5, '#3a2a1a'); }
      else paintFig(x, p, dd, ff);
      if (!['boat', 'sign'].includes(p.kind)) outline(c);
      out[dd + '_' + ff] = c;
    }
    for (const ff of [0, 1, 2]) { const c = mk(32, 48), x = c.getContext('2d'); x.translate(32, 0); x.scale(-1, 1); x.drawImage(out['1_' + ff], 0, 0); out['2_' + ff] = c; }
    CH_CACHE[ck] = out;
  }
  return CH_CACHE[ck][d + '_' + f];
}
const HORSE_CACHE = {};
function horseImg(d, f) {
  const k = d + '_' + f;
  if (!HORSE_CACHE[k]) {
    let c = mk(48, 64); paintHorse(c.getContext('2d'), d === 2 ? 1 : d, f); outline(c);
    if (d === 2) { const m = mk(48, 64), x = m.getContext('2d'); x.translate(48, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); c = m; }
    HORSE_CACHE[k] = c;
  }
  return HORSE_CACHE[k];
}

// ---------- 会話の顔（64x64） ----------
function paintPortrait(p) {
  const c = mk(64, 64), x = c.getContext('2d');
  const sk = p.skin || '#efc39b', hr = p.hair || '#1b1b1b', skD = shade(sk, -.14), skDD = shade(sk, -.28), bg = p.bg || '#26305a', hrL = shade(hr, .3);
  for (let y = 0; y < 64; y++) P(x, 0, y, 64, 1, mix(shade(bg, .12), shade(bg, -.3), y / 64));
  const cx = 32, cy = 27, fw = (p.fw || 7) * 2, fh = 17;
  const inF = (i, y, k = 1) => { const dx = (i + .5 - cx) / (fw * k), dy = (y + .5 - cy) / (fh * k); return dx * dx + dy * dy <= 1; };
  if (p.style === 'woman') ell(x, cx, 30, fw + 5, 20, hr);
  // 体
  const cl = p.cloth || '#3a4a6a';
  for (let y = 44; y < 64; y++) { const w = Math.min(31, 15 + (y - 44) * 1.6); P(x, cx - w, y, w * 2, 1, cl); P(x, cx + w - 8, y, 8, 1, shade(cl, -.25)); P(x, cx - w, y, 3, 1, shade(cl, .15)); }
  P(x, cx - 6, 37, 12, 11, skD);
  if (p.collar === 'west' || p.collar === 'uniform') {
    if (p.collar === 'west') { for (let y = 46; y < 64; y++) { const w = Math.max(2, 11 - (y - 46) * .6); P(x, cx - w, y, w * 2, 1, '#f2f2f2'); } P(x, cx - 2, 48, 4, 14, p.tie || '#222'); }
    else { P(x, cx - 14, 44, 28, 5, shade(cl, -.4)); for (let y = 52; y < 64; y += 5) P(x, cx - 1, y, 2, 2, '#e0c040'); P(x, cx - 30, 46, 8, 3, '#e0c040'); P(x, cx + 22, 46, 8, 3, '#e0c040'); }
  } else {
    for (let i = 0; i < 18; i++) { P(x, cx - 11 + i * .6, 46 + i, 4, 1, '#ede6d4'); P(x, cx + 7 - i * .6, 46 + i, 4, 1, '#ede6d4'); }
    if (p.collar === 'robe') for (let i = 0; i < 20; i++) P(x, cx + 4 + i, 45 + i, 6, 1, '#6a3422');
  }
  if (p.mon) { disc(x, cx - 18, 54, 4, '#f0f0f0'); P(x, cx - 21, 54, 7, 1, cl); P(x, cx - 18, 51, 1, 7, cl); }
  // 耳と顔
  ell(x, cx - fw, 28, 3, 4, skD); ell(x, cx + fw, 28, 3, 4, skD);
  for (let y = 8; y < 46; y++) for (let i = cx - fw - 1; i <= cx + fw + 1; i++) if (inF(i, y)) P(x, i, y, 1, 1, i > cx + fw * .45 ? skD : sk);
  for (let y = 36; y < 46; y++) for (let i = cx - fw; i <= cx + fw; i++) if (inF(i, y) && !inF(i, y, .93)) P(x, i, y, 1, 1, skDD);
  const st = p.style || 'mage';
  const cap = (yy, k = 1.06) => { for (let y = 4; y < yy; y++) for (let i = cx - fw - 3; i <= cx + fw + 3; i++) if (inF(i, y, k)) P(x, i, y, 1, 1, ((i + y) % 7 === 0) ? hrL : hr); };
  if (st === 'mage' || st === 'boy') {
    for (let y = 8; y < 17; y++) for (let i = cx - fw; i <= cx + fw; i++) if (inF(i, y)) P(x, i, y, 1, 1, p.pate || mix(sk, '#9fb0c8', .28));
    for (let y = 12; y < 30; y++) { P(x, cx - fw - 2, y, 4, 1, hr); P(x, cx + fw - 2, y, 4, 1, hr); }
    P(x, cx - 2, 0, 6, 14, hr); P(x, cx - 1, 1, 2, 11, hrL); P(x, cx - 4, 12, 10, 4, hr);
    if (st === 'boy') { ell(x, cx, 15, 10, 4, hr); for (let i = -8; i < 9; i += 4) P(x, cx + i, 17, 3, 3, hr); P(x, cx - 6, 12, 6, 1, hrL); }
  } else if (st === 'short' || st === 'west') {
    cap(17); for (let y = 16; y < 27; y++) { P(x, cx - fw - 2, y, 4, 1, hr); P(x, cx + fw - 2, y, 4, 1, hr); }
    for (let i = -fw + 2; i < fw - 2; i += 4) P(x, cx + i, 17, 3, 2, hr);
    if (st === 'west') { P(x, cx - 6, 7, 2, 10, shade(hr, -.3)); P(x, cx - 12, 9, 6, 1, hrL); }
  } else if (st === 'woman') { cap(19); ell(x, cx, 5, 10, 6, hr); P(x, cx - 13, 7, 26, 2, '#d8b040'); P(x, cx + 9, 1, 2, 8, '#d8b040'); disc(x, cx + 10, 1, 2, '#e85a7a'); }
  else if (st === 'bald') { P(x, cx - 8, 11, 6, 2, '#fff6e8'); }
  // 眉・目
  const bw = p.brow || 1, by = 21;
  for (const s of [-1, 1]) {
    const bx = s < 0 ? cx - 13 : cx + 4;
    P(x, bx, by - (bw > 2 ? 1 : 0), 9, bw >= 2 ? (bw > 2 ? 4 : 3) : 2, p.browc || hr);
    if (bw > 2) P(x, s < 0 ? bx : bx + 7, by - 2, 2, 2, p.browc || hr);
  }
  const ey = 26;
  for (const ex of [cx - 12, cx + 5]) {
    if (p.eye === 'big') { P(x, ex, ey - 2, 8, 6, '#fff'); P(x, ex + 2, ey - 2, 5, 6, p.iris || '#3a2418'); P(x, ex + 3, ey - 1, 3, 4, '#100808'); P(x, ex + 3, ey - 1, 1, 1, '#fff'); P(x, ex, ey - 3, 8, 1, '#1a1214'); }
    else if (p.eye === 'sharp') { P(x, ex, ey - 1, 8, 2, '#1a1214'); P(x, ex + 2, ey + 1, 4, 2, '#1a1214'); P(x, ex + 3, ey + 1, 1, 1, '#ffffff'); }
    else if (p.eye === 'gentle') { P(x, ex, ey + 1, 2, 1, '#1a1214'); P(x, ex + 1, ey, 6, 1, '#1a1214'); P(x, ex + 6, ey + 1, 2, 1, '#1a1214'); }
    else { P(x, ex + 1, ey - 1, 6, 1, '#1a1214'); P(x, ex + 2, ey, 4, 3, p.iris || '#2a1a14'); P(x, ex + 3, ey, 1, 1, '#fff'); }
  }
  // 鼻・口
  P(x, cx, 30, 2, 4, skD); P(x, cx - 2, 34, 5, 1, skDD);
  if (p.mouth === 'smile') { P(x, cx - 4, 38, 9, 1, '#8a3a2e'); P(x, cx - 5, 37, 1, 1, '#8a3a2e'); P(x, cx + 5, 37, 1, 1, '#8a3a2e'); }
  else if (p.mouth === 'open') { P(x, cx - 3, 37, 7, 3, '#6a2420'); P(x, cx - 2, 39, 5, 1, '#c05a50'); }
  else P(x, cx - 4, 38, 9, p.mouth === 'firm' ? 2 : 1, p.mouth === 'firm' ? '#6a3226' : '#8a4232');
  if (p.beard === 'whiskers' || p.beard === 'full') for (let y = 28; y < 46; y++) for (let i = cx - fw - 2; i <= cx + fw + 2; i++) if (inF(i, y, 1.05) && (Math.abs(i - cx) >= fw - 6 || y >= 41) && !(Math.abs(i - cx) <= 6 && y >= 36 && y <= 40)) P(x, i, y, 1, 1, ((i * 3 + y) % 5 === 0) ? hrL : hr);
  if (p.beard === 'mustache' || p.beard === 'full') { P(x, cx - 7, 35, 15, 2, hr); P(x, cx - 8, 36, 3, 1, hr); P(x, cx + 6, 36, 3, 1, hr); }
  if (p.beard === 'stubble') { const r = rnd(7); for (let i = 0; i < 60; i++) { const px = cx - fw + 4 + r() * (fw * 2 - 8), py = 35 + r() * 9; if (inF(px | 0, py | 0)) P(x, px, py, 1, 1, shade(sk, -.38)); } }
  if (p.blush) { P(x, cx - 13, 32, 4, 2, '#f09a8a'); P(x, cx + 9, 32, 4, 2, '#f09a8a'); }
  if (p.scar) { for (let i = 0; i < 8; i++) P(x, cx + 7 + i, 18 + i, 1, 1, skDD); }
  if (p.glasses) { x.strokeStyle = '#c8a040'; x.lineWidth = 1; x.strokeRect(cx - 13.5, ey - 3.5, 10, 8); x.strokeRect(cx + 3.5, ey - 3.5, 10, 8); P(x, cx - 3, ey - 1, 6, 1, '#c8a040'); }
  if (p.hat === 'jingasa') { for (let y = 0; y < 9; y++) { const w = 8 + y * 3.2; P(x, cx - w, y + 1, w * 2, 1, y % 3 ? '#2a2420' : '#3a322c'); } P(x, cx - 2, 3, 4, 3, '#c8a040'); }
  if (p.hat === 'kepi') { P(x, cx - fw - 1, 2, fw * 2 + 2, 12, p.hatc || '#1a2244'); P(x, cx - fw - 1, 11, fw * 2 + 2, 3, '#c02020'); P(x, cx - fw - 3, 14, fw * 2 + 6, 3, '#111'); P(x, cx - 2, 4, 4, 4, '#e0c040'); }
  if (p.hat === 'cap') { P(x, cx - fw, 5, fw * 2, 8, '#f4f4f4'); P(x, cx - fw, 12, fw * 2, 2, '#1a2440'); }
  if (p.hat === 'eboshi') { P(x, cx - 9, 0, 18, 12, '#1a1a1a'); P(x, cx - 7, 0, 5, 12, '#2e2e2e'); }
  if (p.hat === 'zukin') { for (let y = 0; y < 50; y++) for (let i = 0; i < 64; i++) if (inF(i, y, 1.22) && !inF(i, y, 1.0)) P(x, i, y, 1, 1, p.hatc || '#3a3a5a'); for (let y = 4; y < 22; y++) for (let i = 0; i < 64; i++) if (inF(i, y, 1.0)) P(x, i, y, 1, 1, p.hatc || '#3a3a5a'); }
  return c;
}
const POR_CACHE = {};
function portraitImg(p) { const k = JSON.stringify(p); return POR_CACHE[k] || (POR_CACHE[k] = paintPortrait(p)); }

// ---------- 戦闘の敵グラフィック ----------
function paintShip(x, big) {
  for (let y = 66; y < 96; y++) { const k = (y - 66) * .9; P(x, 10 + k, y, 180 - k * 2, 1, y < 70 ? '#2a2a2a' : '#1b1b1b'); }
  P(x, 12, 72, 176, 6, '#e8e8e8'); for (let i = 0; i < 14; i++) { P(x, 20 + i * 12, 72, 6, 6, '#1e1e1e'); P(x, 21 + i * 12, 73, 4, 1, '#3a3a3a'); }
  P(x, 6, 60, 190, 6, '#3a2a1a'); P(x, 6, 60, 190, 1, '#5a4228');
  for (const [mx, top] of [[44, 6], [96, 0], [146, 12]]) { P(x, mx, top, 4, 62 - top, '#4a3220'); P(x, mx + 1, top, 1, 62 - top, '#6a4a30'); P(x, mx - 18, top + 10, 40, 5, '#d8d0b8'); P(x, mx - 14, top + 26, 32, 4, '#d8d0b8'); P(x, mx - 18, top + 10, 40, 1, '#f0e8d0'); P(x, mx - 20, top + 10, 44, 1, '#3a2a1a'); }
  P(x, 66, 36, 14, 26, '#2a2a2a'); P(x, 66, 40, 14, 3, '#c8a040'); P(x, 68, 36, 3, 26, '#3e3e3e');
  disc(x, 72, 28, 7, '#7a7a7a'); disc(x, 64, 16, 9, '#8a8a8a'); disc(x, 52, 5, 7, '#9a9a9a');
  P(x, 182, 30, 2, 30, '#333'); P(x, 184, 30, 16, 11, '#c8202a'); P(x, 184, 30, 8, 6, '#1a3a8a'); P(x, 187, 30, 2, 6, '#f0f0f0'); P(x, 184, 32, 8, 2, '#f0f0f0');
  P(x, 0, 94, 200, 18, '#2c5f9e'); for (let i = 0; i < 200; i += 14) { P(x, i, 97, 8, 1, '#6aa2dc'); P(x, i + 7, 103, 6, 1, '#4686c6'); }
}
function paintCastle(x, w, h, p) {
  const wall = p.wall || '#1e1e22', roof = p.roof || '#2a2e3a', stone = '#8a867a';
  for (let y = h - 40; y < h; y++) { const k = (h - y) / 40; P(x, 20 - k * 14, y, w - 40 + k * 28, 1, mix(stone, '#6a665c', (y % 7) / 7)); }
  for (let y = h - 40; y < h; y += 6) for (let i = 8; i < w - 8; i += 12) P(x, i + (y % 12 ? 6 : 0), y, 10, 1, '#5a564e');
  const tiers = [[24, h - 40, w - 48, 30], [40, h - 76, w - 80, 26], [56, h - 106, w - 112, 22]];
  for (const [tx, ty, tw, th] of tiers) {
    P(x, tx, ty, tw, th, wall); P(x, tx, ty, tw, 3, shade(wall, .2));
    for (let i = tx + 6; i < tx + tw - 8; i += 14) { P(x, i, ty + 8, 6, 8, '#3a3020'); P(x, i + 1, ty + 9, 4, 6, '#e0c070'); }
    for (let k = 0; k < 8; k++) P(x, tx - 8 + k, ty - 8 + k, tw + 16 - k * 2, 1, roof);
    P(x, tx - 10, ty - 1, 6, 3, roof); P(x, tx + tw + 4, ty - 1, 6, 3, roof); P(x, tx - 8, ty - 8, tw + 16, 1, shade(roof, .3));
  }
  P(x, w / 2 - 14, h - 132, 28, 12, roof); P(x, w / 2 - 18, h - 122, 36, 3, roof);
  P(x, w / 2 - 18, h - 136, 4, 6, '#d8b040'); P(x, w / 2 + 14, h - 136, 4, 6, '#d8b040');
}
function paintBoat(x) {
  for (let y = 44; y < 64; y++) { const k = (y - 44) * .7; P(x, 4 + k, y, 104 - k * 2, 1, y < 47 ? '#8a6038' : '#6b4426'); }
  for (const bx of [18, 40, 62, 84]) { P(x, bx, 28, 12, 16, '#1a2a5a'); P(x, bx, 28, 12, 4, '#dfe4ee'); ell(x, bx + 6, 22, 5, 5, '#f2c8a8'); P(x, bx, 14, 12, 5, '#f4f4f4'); P(x, bx, 18, 12, 1, '#1a2440'); P(x, bx + 3, 22, 2, 2, '#111'); P(x, bx + 7, 22, 2, 2, '#111'); }
  for (let i = 0; i < 20; i++) { P(x, 12 - i * .6, 50 + i, 2, 2, '#8a6038'); P(x, 98 + i * .6, 50 + i, 2, 2, '#8a6038'); }
  P(x, 0, 64, 112, 8, '#2c5f9e'); for (let i = 0; i < 112; i += 12) P(x, i, 66, 6, 1, '#6aa2dc');
}
function paintShell(x) { for (let i = 0; i < 8; i++) disc(x, 8 + i * 3, 46 - i * 3, 8 - i * .5, ['#ffe080', '#ffc040', '#ff8a20', '#e04a1a'][Math.min(3, i >> 1)]); disc(x, 40, 16, 11, '#1a1a1a'); disc(x, 36, 12, 4, '#4a4a4a'); P(x, 34, 10, 2, 2, '#9a9a9a'); }
function paintArmy(x, w, h, p) {
  const r = rnd(p.seed || 5);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) {
    const sx = 6 + i * (w - 12) / 9 + (row % 2) * 6, sy = 24 + row * 18 + r() * 2;
    P(x, sx + 2, sy, 6, 6, p.skin || '#e0b088'); P(x, sx + 1, sy - 2, 8, 3, p.hat || '#1a1a2a'); P(x, sx, sy + 6, 10, 9, p.body || '#2a2a44'); P(x, sx + 1, sy + 15, 3, 4, '#1a1a1a'); P(x, sx + 6, sy + 15, 3, 4, '#1a1a1a');
    if (p.gun !== false) P(x, sx + 9, sy - 6, 1.5, 20, '#7a7a80');
  }
  if (p.flag) { P(x, w - 18, 2, 2, 50, '#4a3220'); P(x, w - 16, 2, 16, 22, p.flag); if (p.flagMark) { disc(x, w - 8, 13, 5, p.flagMark); } }
}
function paintScroll(x, p) {
  P(x, 10, 8, 76, 92, '#f2ead6'); for (let y = 10; y < 98; y += 3) P(x, 12, y, 72, 1, '#e8dcc0'); P(x, 4, 4, 88, 8, '#7a4a26'); P(x, 4, 96, 88, 8, '#7a4a26');
  const t = p.text || '廃刀令', long = t.length > 4; x.fillStyle = '#1a1a1a'; x.font = `bold ${long ? 10 : 18}px serif`; x.textAlign = 'center';
  [...t].forEach((ch, i) => x.fillText(ch, 48, (long ? 24 : 34) + i * (long ? 10 : 22))); disc(x, 72, 84, 7, '#c02020'); P(x, 69, 82, 6, 4, '#f0d0d0');
}
function paintCloud(x) { for (let i = 0; i < 9; i++) disc(x, 14 + i * 10, 22 + Math.sin(i) * 6, 14, i % 2 ? '#3a4050' : '#4a5060'); for (let i = 0; i < 26; i++) P(x, 8 + i * 4, 38 + (i * 7) % 20, 1, 14, '#8a9ab8'); disc(x, 40, 20, 4, '#e8e8a0'); P(x, 38, 24, 3, 14, '#e8e8a0'); P(x, 34, 36, 3, 8, '#e8e8a0'); }
const EN_CACHE = {};
function enemyImg(id) {
  if (EN_CACHE[id]) return EN_CACHE[id];
  const s = ENEMIES[id].spr; let c;
  if (s.t === 'ship') { c = mk(200, 112); paintShip(c.getContext('2d')); }
  else if (s.t === 'boat') { c = mk(112, 72); paintBoat(c.getContext('2d')); outline(c); }
  else if (s.t === 'shell') { c = mk(56, 56); paintShell(c.getContext('2d')); outline(c); }
  else if (s.t === 'castle') { c = mk(200, 150); paintCastle(c.getContext('2d'), 200, 150, s); outline(c); }
  else if (s.t === 'army') { c = mk(140, 100); paintArmy(c.getContext('2d'), 140, 100, s); outline(c); }
  else if (s.t === 'scroll') { c = mk(96, 108); paintScroll(c.getContext('2d'), s); outline(c); }
  else if (s.t === 'cloud') { c = mk(112, 72); paintCloud(c.getContext('2d')); }
  else if (s.t === 'dog') { c = mk(64, 96); const t = mk(32, 48); paintDog(t.getContext('2d'), s, 0, 0); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(t, 0, 0, 64, 96); outline(c); }
  else { c = mk(64, 96); const x = c.getContext('2d'); paintFig(x, s, 0, 0, 2); paintPose(x, s, 2); outline(c); }
  return (EN_CACHE[id] = c);
}

// ---------- 背景（512x384） ----------
// 桜島の形：北岳（高い）と南岳（低く、噴煙）の二つの峰。左から光が当たる
function volcano(x, cx, base, w, h, col, smoke) {
  const r = rnd(cx + h), A = cx - w * .06, B = cx + w * .1, hB = h * .82, lit = shade(col, .3), dk = shade(col, -.4);
  for (let i = 0; i < h; i++) {
    const y = base - h + i, ta = i / h, tb = Math.max(0, (i - (h - hB)) / hB);
    const wa = w * (0.05 + 0.95 * Math.pow(ta, .85)) / 2, wb = tb > 0 ? w * (0.06 + 0.9 * Math.pow(tb, .85)) / 2 : -1;
    const l = Math.round(Math.min(A - wa, wb > 0 ? B - wb : 1e9)), rr = Math.round(Math.max(A + wa, wb > 0 ? B + wb : -1e9));
    for (let px = l; px < rr; px += 2) {
      const u = (px - l) / Math.max(1, rr - l);
      let c = mix(lit, dk, Math.min(1, u * 1.1 + (r() - .5) * .12));
      if (i > h * .72) c = mix(c, shade(col, -.1), (i - h * .72) / (h * .28) * .5);
      P(x, px, y, 2, 1, c);
    }
  }
  // 谷筋（雨で削られた筋）
  for (let k = -5; k <= 5; k++) { if (!k) continue; for (let i = Math.round(h * .12); i < h * .95; i += 1) { const t = i / h, gx = A + k * (w * .085) * Math.pow(t, .9) + Math.sin(i * .3 + k) * .6; if (r() < .85) { P(x, gx, base - h + i, 1, 1, shade(col, -.25)); P(x, gx - 1, base - h + i, 1, 1, shade(col, .18)); } } }
  P(x, A - 3, base - h, 6, 2, shade(col, -.35));
  disc(x, B, base - hB + 1, 3, shade(col, -.5));
  if (smoke) for (let i = 0; i < 7; i++) { const sx = B + i * 8 + Math.sin(i) * 3, sy = base - hB - 8 - i * 11; disc(x, sx, sy, 6 + i * 2, mix(smoke, '#ffffff', i * .05)); disc(x, sx - 2, sy - 2, 3 + i, mix(smoke, '#ffffff', .4)); }
}
// 木は一段高い一枚絵にして、人物が木の陰に回り込めるようにする（40x60、根元がタイルの下端）
const TREE_CACHE = {};
function treeImg(ch, v) {
  const k = ch + v; if (TREE_CACHE[k]) return TREE_CACHE[k];
  const c = mk(40, 60), x = c.getContext('2d'), r = rnd(v * 13 + ch.charCodeAt(0));
  ell(x, 22, 55, 14, 4, 'rgba(0,0,0,.3)');
  if (ch === 'T') {
    const g = [['#2b5f28', '#3a7a33', '#4f9440', '#6ab052'], ['#2f5a2a', '#3e7236', '#56904a', '#78b060'], ['#24502a', '#336c38', '#4a8a46', '#64a858']][v % 3], s = v % 3 === 1 ? 1 : 0;
    P(x, 17, 34, 6, 22, '#5a3a20'); P(x, 17, 34, 2, 22, '#7a5230'); P(x, 21, 34, 2, 22, '#432a16'); P(x, 14, 53, 12, 3, '#5a3a20');
    disc(x, 20, 24 - s, 15, g[0]); disc(x, 11, 30, 8, g[0]); disc(x, 29, 30, 8, g[0]);
    disc(x, 18, 20 - s, 11, g[1]); disc(x, 26, 24, 7, g[1]); disc(x, 11, 27, 6, g[1]);
    disc(x, 15, 15 - s, 6, g[2]); disc(x, 24, 18, 4, g[2]); P(x, 12, 11 - s, 4, 2, g[3]); P(x, 22, 15, 3, 2, g[3]); P(x, 9, 24, 3, 2, g[2]);
    for (let i = 0; i < 14; i++) P(x, 8 + r() * 24, 14 + r() * 22, 2, 1, r() < .5 ? g[0] : g[2]);
    outline(c, '#173a16');
  } else {
    P(x, 18, 30, 4, 26, '#6b4426'); P(x, 18, 30, 1, 26, '#8a5a30');
    const tiers = [[42, 17, '#24502a'], [33, 14, '#2d6233'], [24, 11, '#356f3a'], [16, 7, '#3e7a42']];
    for (const [y, w, col] of tiers) { ell(x, 20 + (v % 2 ? 1 : -1), y, w, 4, col); P(x, 20 - w + 4, y - 2, w, 1, shade(col, .35)); }
    outline(c, '#122a14');
  }
  return (TREE_CACHE[k] = c);
}
// マップ用の桜島（224x176）。海の上に、裾野の緑と波打ち際まで描いて「浮いて見えない」ようにする
let SAKURA_IMG = null;
function sakurajimaImg() {
  if (SAKURA_IMG) return SAKURA_IMG;
  const W = 224, H = 176, c = mk(W, H), x = c.getContext('2d'), r = rnd(1914), cx = 116, base = 148;
  ell(x, cx + 6, base + 8, 112, 22, 'rgba(8,24,52,.45)');
  ell(x, cx, base + 2, 108, 22, '#e2f0fa'); ell(x, cx, base + 1, 106, 21, '#d8c48c'); ell(x, cx, base - 1, 104, 20, '#3e6e34');
  for (let i = 0; i < 120; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); const px = cx + Math.cos(a) * 98 * d, py = base - 1 + Math.sin(a) * 18 * d; disc(x, px, py, 2 + (r() * 3 | 0), r() < .5 ? '#2e5a2a' : '#4a8a3c'); }
  // 大正の溶岩原
  for (let i = 0; i < 26; i++) disc(x, cx + 30 + r() * 60, base - 6 + r() * 14, 2 + (r() * 3 | 0), r() < .5 ? '#3a3430' : '#4e4640');
  volcano(x, cx, base - 6, 196, 120, '#7a6658', null);
  // 中腹から下の森
  for (let i = 0; i < 90; i++) { const t = r(), y = base - 34 + t * 26, half = 60 + t * 34, px = cx - half + r() * half * 2; disc(x, px, y, 2 + (r() * 2 | 0), px < cx ? '#4f8a40' : '#2f5a2c'); }
  // 南岳の火口の赤み
  disc(x, cx + 19, base - 6 - 98 + 2, 2, '#c84a1a');
  outline(c, '#1a1410');
  return (SAKURA_IMG = c);
}
function band(x, top, bot, y0, y1, w = 512) { const n = 24; for (let i = 0; i < n; i++) P(x, 0, y0 + (y1 - y0) * i / n, w, Math.ceil((y1 - y0) / n) + 1, mix(top, bot, i / (n - 1))); }
function hills(x, y, amp, col, seed, w = 512) { for (let i = 0; i < w; i += 2) P(x, i, y - Math.sin(i / 40 + seed) * amp - Math.sin(i / 13 + seed * 2) * amp * .3, 2, 300, col); }
function treeline(x, y, col, r, w = 512) { for (let i = 0; i < w; i += 6) { const h = 10 + r() * 16; disc(x, i, y - h / 2, (h / 2) | 0, col); } P(x, 0, y, w, 300, col); }
const BG_CACHE = {};
function bgImg(type) {
  if (BG_CACHE[type]) return BG_CACHE[type];
  const c = mk(512, 384), x = c.getContext('2d'), r = rnd(type.length * 17 + 3);
  const ground = (col, y0, cols) => { P(x, 0, y0, 512, 384 - y0, col); for (let i = 0; i < 700; i++) { const yy = y0 + r() * (384 - y0); P(x, r() * 512, yy, 2 + (yy - y0) / 40, 1, cols[(r() * cols.length) | 0]); } };
  switch (type) {
    case 'field': band(x, '#6ea8e6', '#d2eaf6', 0, 170); for (let i = 0; i < 5; i++) ell(x, 60 + i * 100, 40 + r() * 30, 30, 8, '#f4f8fc'); volcano(x, 400, 150, 220, 60, '#7a8aa0', '#e8ecf0'); hills(x, 150, 10, '#6f9a6a', 1); treeline(x, 168, '#3e7a36', r); ground('#5b9a40', 170, ['#6dae4c', '#4c8836', '#3f7a2e']); break;
    case 'dojo': P(x, 0, 0, 512, 190, '#6e4f33'); for (let i = 0; i < 512; i += 32) { P(x, i, 0, 3, 190, '#5a3f26'); P(x, i + 3, 0, 1, 190, '#86623e'); } P(x, 0, 24, 512, 10, '#4a3220'); P(x, 180, 50, 150, 90, '#f2ead6'); x.fillStyle = '#1a1a1a'; x.font = 'bold 40px serif'; x.textAlign = 'center'; x.fillText('示現流', 255, 112); ground('#ad9268', 190, ['#a08560', '#bba078']); break;
    case 'beach': case 'storm': case 'night': case 'title': case 'fire': {
      const pal = { beach: ['#6ea8e6', '#dceef8', '#2f66a8', '#5d5468', '#d8d8d0', '#e6d6a0'], storm: ['#1a1e2a', '#3a4256', '#1d3550', '#2a2a36', '#555a66', '#8a7c5c'], night: ['#060a24', '#1c2a58', '#13244a', '#141a30', '#3a4060', '#4a4636'], title: ['#0e1434', '#d86a3a', '#1a2a4a', '#2a1e2e', '#6a5a6a', '#0a0a12'], fire: ['#2a0a0a', '#c8401a', '#3a1a1a', '#2a1010', '#6a3a2a', '#3a2418'] }[type];
      const hz = type === 'title' ? 228 : 150;
      band(x, pal[0], pal[1], 0, hz);
      if (type === 'night' || type === 'title') for (let i = 0; i < 90; i++) P(x, r() * 512, r() * hz * .6, 1, 1, r() < .2 ? '#ffffff' : '#a8b0e0');
      if (type === 'night') { disc(x, 420, 48, 18, '#f4ecc8'); disc(x, 414, 44, 4, '#e0d8b0'); }
      volcano(x, type === 'title' ? 256 : 370, hz, type === 'title' ? 480 : 300, type === 'title' ? 140 : 84, pal[3], pal[4]);
      P(x, 0, hz, 512, 66, pal[2]); for (let i = 0; i < 110; i++) P(x, r() * 512, hz + r() * 66, 4 + r() * 8, 1, type === 'title' ? '#e0703a' : type === 'fire' ? '#e05a1a' : shade(pal[2], .25));
      if (type === 'title') { P(x, 0, hz + 66, 512, 384, '#06060c'); for (const [bx, s] of [[30, 1], [482, -1]]) { for (let y = 140; y < 384; y++) P(x, bx + s * Math.round((384 - y) * .12), y, 8, 1, pal[5]); for (const [dx, dy, w] of [[24, 136, 62], [-8, 176, 54], [40, 200, 46], [6, 234, 40]]) { const cx = bx + s * dx; for (let k = 0; k < 9; k++) disc(x, Math.round(cx - w / 2 + k * w / 8), dy + ((k * 5) % 3), 8 + (k % 3), pal[5]); } } }
      else { ground(pal[5], hz + 66, [shade(pal[5], -.12), shade(pal[5], .1)]); }
      if (type === 'storm') { x.globalAlpha = .45; for (let i = 0; i < 200; i++) { const sx = r() * 512, sy = r() * 384; for (let k = 0; k < 10; k++) P(x, sx - k, sy + k * 2, 1, 2, '#a0b0c8'); } x.globalAlpha = 1; }
      if (type === 'fire') { for (let i = 0; i < 9; i++) { const bx = i * 60 + r() * 20; P(x, bx, 120 - r() * 40, 34, 120, '#140808'); P(x, bx - 4, 116 - r() * 40, 42, 6, '#140808'); } for (let i = 0; i < 60; i++) disc(x, r() * 512, 60 + r() * 80, 3 + r() * 8, r() < .5 ? '#e05a1a' : '#ffa040'); }
      break;
    }
    case 'kyoto': band(x, '#8ab8e0', '#e8eef0', 0, 160); hills(x, 140, 14, '#7a9a8a', 2); P(x, 0, 150, 512, 60, '#d8d0b8'); for (let i = 0; i < 512; i += 40) { P(x, i, 150, 2, 60, '#a8a088'); } for (let y = 158; y < 205; y += 12) P(x, 0, y, 512, 2, '#e8e0c8'); P(x, 0, 140, 512, 12, '#3a3e4a'); for (let i = 0; i < 512; i += 10) P(x, i, 140, 8, 3, '#4a5060'); ground('#cfc4a4', 210, ['#bfb494', '#ddd2b2']); break;
    case 'town': band(x, '#80b0e0', '#e0ecf2', 0, 150); for (let i = 0; i < 512; i += 70) { P(x, i, 90 + (i % 3) * 8, 64, 100, '#efe8d6'); for (let k = 0; k < 6; k++) P(x, i - 6 + k, 84 + (i % 3) * 8 + k, 76 - k * 2, 1, '#3f4556'); P(x, i + 10, 140, 18, 50, '#5a3a20'); P(x, i + 36, 120, 20, 14, '#3a2a1a'); } ground('#c4a66e', 190, ['#b3955f', '#d3b67e']); break;
    case 'castle': band(x, '#7aa8d8', '#dce8f0', 0, 180); hills(x, 170, 8, '#6a8a6a', 4); P(x, 0, 180, 512, 30, '#8a867a'); for (let i = 0; i < 512; i += 16) P(x, i, 180, 1, 30, '#6a665c'); ground('#5b9a40', 210, ['#4c8836', '#6dae4c']); break;
    case 'aizu': band(x, '#9ab0c8', '#e8d8c0', 0, 170); hills(x, 150, 20, '#8a5a3a', 3); for (let i = 0; i < 60; i++) disc(x, r() * 512, 150 + r() * 30, 6 + r() * 6, r() < .5 ? '#c84a2a' : '#d8a030'); ground('#7a8a4a', 180, ['#8a5a2a', '#6a7a3a', '#c84a2a']); break;
    case 'mountain': band(x, '#a8c0d0', '#e0e8e8', 0, 160); hills(x, 120, 30, '#5a7a6a', 5); hills(x, 160, 18, '#3e6a46', 7); treeline(x, 190, '#2e5a32', r); ground('#4c7a36', 200, ['#3e6a2e', '#5a8a42']); break;
    case 'rain': band(x, '#2a2e36', '#5a606a', 0, 170); hills(x, 150, 24, '#3a4a3a', 6); ground('#4a5a36', 170, ['#3a4a2a', '#5a5a3a', '#2a3a2a']); for (let i = 0; i < 8; i++) { P(x, i * 70, 230, 50, 12, '#6a5a38'); P(x, i * 70, 230, 50, 2, '#8a7a50'); } x.globalAlpha = .5; for (let i = 0; i < 260; i++) { const sx = r() * 512, sy = r() * 384; for (let k = 0; k < 8; k++) P(x, sx - k * .5, sy + k * 2, 1, 2, '#c0c8d8'); } x.globalAlpha = 1; break;
    case 'shiroyama': band(x, '#04061a', '#2a1a3a', 0, 170); for (let i = 0; i < 70; i++) P(x, r() * 512, r() * 120, 1, 1, '#c0c0e0'); disc(x, 90, 60, 14, '#e8e0c0'); hills(x, 160, 30, '#141420', 8); for (let i = 0; i < 40; i++) disc(x, r() * 512, 150 + r() * 40, 2, r() < .5 ? '#e05a1a' : '#ffb040'); ground('#1e2018', 190, ['#2a2c20', '#14160e']); break;
    case 'tokyo': band(x, '#9ab8d8', '#e8ecf0', 0, 160); for (let i = 0; i < 512; i += 90) { P(x, i, 70, 80, 120, '#a8503a'); for (let y = 80; y < 180; y += 20) for (let k = 8; k < 76; k += 18) { P(x, i + k, y, 10, 12, '#e8e0c0'); P(x, i + k, y, 10, 2, '#5a2a1a'); } } for (let i = 30; i < 512; i += 100) { P(x, i, 120, 3, 80, '#2a2a2a'); P(x, i - 4, 114, 11, 8, '#f0e0a0'); } ground('#9a968a', 200, ['#8a867a', '#aaa69a']); break;
    case 'interior': P(x, 0, 0, 512, 200, '#e8dfc4'); for (let i = 0; i < 512; i += 64) { P(x, i, 0, 6, 200, '#5a4030'); } P(x, 0, 0, 512, 20, '#5a4030'); P(x, 0, 180, 512, 20, '#5a4030'); ground('#c8c088', 200, ['#b8b078', '#d8d098']); for (let i = 0; i < 512; i += 96) P(x, i, 200, 3, 184, '#2a4a3a'); break;
    case 'snowfield': band(x, '#a0a8b8', '#e8ecf0', 0, 170); hills(x, 150, 16, '#c8d0d8', 3); ground('#e8ecf0', 180, ['#d0d8e0', '#ffffff']); break;
    default: P(x, 0, 0, 512, 384, '#111');
  }
  return (BG_CACHE[type] = c);
}
