'use strict';
// ===== ゲームの仕組み（移動・会話・メニュー・戦闘・セーブ） =====
const SW = 384, SH = 288;
const $ = s => document.querySelector(s);
const cv = $('#cv'), ctx = cv.getContext('2d');
const uiRoot = $('#ui');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[(Math.random() * a.length) | 0];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GAMEOVER = { gameover: true };

const G = { scene: 'title', map: null, mapId: null, px: 0, py: 0, dir: 0, move: null, chain: [], party: [], mem: {}, inv: {}, money: 0, flags: {}, chapter: 0, busy: false, night: false, encSteps: 0, frame: 0, B: null };
const F = k => !!G.flags[k];
const flag = (k, v = true) => { G.flags[k] = v; };

// ---------- 効果音 ----------
const SFX = {
  ac: null,
  unlock() { try { if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)(); if (this.ac.state === 'suspended') this.ac.resume(); } catch (e) { } },
  tone(freq, dur, type = 'square', vol = .05, when = 0, slide = 0) {
    const c = this.ac; if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .02);
  },
  play(n) {
    try {
      if (!this.ac) return;
      const T = (...a) => this.tone(...a);
      ({
        cur: () => T(880, .04, 'square', .03), ok: () => T(660, .07, 'square', .04), cancel: () => T(330, .07, 'square', .04), ng: () => T(140, .12, 'square', .05),
        hit: () => T(220, .14, 'sawtooth', .09, 0, -160), hurt: () => T(110, .2, 'sawtooth', .1, 0, -60), kill: () => { T(300, .1, 'square', .06, 0, -200); T(150, .2, 'square', .05, .08, -100); },
        boom: () => T(90, .5, 'sawtooth', .14, 0, -60), splash: () => T(400, .4, 'triangle', .1, 0, -350),
        enc: () => [440, 554, 659, 880].forEach((f, i) => T(f, .08, 'square', .05, i * .05)),
        heal: () => [523, 659, 784].forEach((f, i) => T(f, .12, 'triangle', .08, i * .08)),
        lvup: () => [523, 659, 784, 1046].forEach((f, i) => T(f, .16, 'square', .05, i * .11)),
        join: () => [392, 523, 659, 784, 659, 784].forEach((f, i) => T(f, .14, 'square', .045, i * .1)),
        learn: () => [659, 784, 988].forEach((f, i) => T(f, .14, 'triangle', .08, i * .09)),
        step: () => T(180, .05, 'triangle', .04),
      }[n] || (() => { }))();
    } catch (e) { }
  },
};

// ---------- 入力 ----------
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', z: 'ok', Enter: 'ok', ' ': 'ok', x: 'cancel', Escape: 'cancel', Backspace: 'cancel', Shift: 'run' };
const DIRK = ['up', 'down', 'left', 'right'];
const Input = {
  q: [], held: {}, dirs: [],
  down(k) { if (DIRK.includes(k) && !this.dirs.includes(k)) this.dirs.push(k); this.held[k] = true; if (k !== 'run') this.q.push(k); },
  up(k) { this.held[k] = false; this.dirs = this.dirs.filter(d => d !== k); },
  dir() { const k = this.dirs[this.dirs.length - 1]; return k ? { down: 0, left: 1, right: 2, up: 3 }[k] : -1; },
};
const keyOf = e => KEYMAP[e.key] || KEYMAP[e.key.length === 1 ? e.key.toLowerCase() : ''];
addEventListener('keydown', e => { const k = keyOf(e); if (!k) return; e.preventDefault(); SFX.unlock(); if (e.repeat) { if (DIRK.includes(k)) Input.q.push(k); return; } Input.down(k); });
addEventListener('keyup', e => { const k = keyOf(e); if (k) Input.up(k); });
addEventListener('blur', () => { Input.held = {}; Input.dirs = []; });
document.querySelectorAll('#pad [data-k]').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); SFX.unlock(); Input.down(k); b.classList.add('on'); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { Input.up(k); b.classList.remove('on'); });
});

// ---------- UI部品 ----------
const UI = { stack: [], push(h) { this.stack.push(h); }, pop(h) { const i = this.stack.lastIndexOf(h); if (i >= 0) this.stack.splice(i, 1); }, top() { return this.stack[this.stack.length - 1]; } };
function el(tag, cls, parent = uiRoot) { const e = document.createElement(tag); if (cls) e.className = cls; parent.appendChild(e); return e; }
function place(e, x, y, w, h) { e.style.left = x + 'px'; e.style.top = y + 'px'; if (w) e.style.width = w + 'px'; if (h) e.style.height = h + 'px'; return e; }
function waitOk(ms) {
  return new Promise(res => {
    let done = false, t = null;
    const fin = () => { if (done) return; done = true; UI.pop(h); clearTimeout(t); res(); };
    const h = { onKey(k) { if (k === 'ok' || k === 'cancel') fin(); } };
    UI.push(h); if (ms) t = setTimeout(fin, ms);
  });
}

const DLG = { el: null, hideT: null };
function infoOf(who) {
  if (!who) return null;
  if (typeof who === 'object') return who;
  const p = PEOPLE[who]; if (!p) return { name: who };
  return { name: (G.mem[who] && G.mem[who].name) || p.name, por: typeof p.por === 'function' ? p.por() : p.por };
}
function say(who, text) {
  if (!DLG.el) {
    DLG.el = place(el('div', 'win dlg'), 8, 190, 368, 92);
    DLG.el.innerHTML = '<canvas class="por" width="32" height="32"></canvas><div class="nm"></div><div class="tx"></div><div class="arw">▼</div>';
  }
  clearTimeout(DLG.hideT);
  const d = DLG.el, info = infoOf(who), por = d.querySelector('.por'), nm = d.querySelector('.nm'), tx = d.querySelector('.tx'), arw = d.querySelector('.arw');
  d.style.display = 'block';
  d.classList.toggle('narr', !info);
  d.classList.toggle('hasp', !!(info && info.por));
  if (info && info.por) { const pc = por.getContext('2d'); pc.clearRect(0, 0, 32, 32); pc.drawImage(portraitImg(info.por), 0, 0); }
  nm.textContent = info ? info.name : '';
  return new Promise(res => {
    let i = 0, done = false;
    arw.style.visibility = 'hidden';
    const finish = () => { clearInterval(tm); tx.textContent = text; done = true; arw.style.visibility = 'visible'; };
    const tm = setInterval(() => { i += 1; tx.textContent = text.slice(0, i); if (i >= text.length) finish(); }, 26);
    const h = {
      onKey(k) {
        if (k !== 'ok' && k !== 'cancel') return;
        if (!done) { finish(); return; }
        UI.pop(h); SFX.play('cur');
        DLG.hideT = setTimeout(hideDlg, 60);
        res();
      }
    };
    UI.push(h);
  });
}
function hideDlg() { if (DLG.el) DLG.el.style.display = 'none'; }
function keepDlg() { clearTimeout(DLG.hideT); }
const N = t => say(null, t);
const S = (who, t) => say(who, t);

function choose(items, o = {}) {
  return new Promise(res => {
    const box = place(el('div', 'win menu'), o.x ?? 8, o.y ?? 8, o.w ?? 140);
    if (o.maxH) { box.style.maxHeight = o.maxH + 'px'; box.style.overflowY = 'auto'; }
    if (o.title) el('div', 'ttl', box).textContent = o.title;
    let idx = Math.max(0, Math.min(o.start || 0, items.length - 1));
    const rows = items.map((it, i) => {
      const r = el('div', 'it', box); const lab = typeof it === 'string' ? it : it.label;
      r.innerHTML = `<span>${esc(lab)}</span>` + (it.right != null ? `<span class="rt">${esc(it.right)}</span>` : '');
      if (it.disabled) r.classList.add('dis');
      r.addEventListener('click', () => { if (UI.top() !== h) return; idx = i; upd(); choosePick(); });
      return r;
    });
    const upd = () => { rows.forEach((r, i) => r.classList.toggle('sel', i === idx)); if (rows[idx]) rows[idx].scrollIntoView({ block: 'nearest' }); if (o.onMove) o.onMove(idx); };
    const close = v => { UI.pop(h); box.remove(); res(v); };
    const choosePick = () => { if (items[idx] && items[idx].disabled) { SFX.play('ng'); return; } SFX.play('ok'); close(idx); };
    const h = {
      onKey(k) {
        if (!items.length) { if (k === 'ok' || k === 'cancel') close(-1); return; }
        if (k === 'up') { idx = (idx - 1 + items.length) % items.length; SFX.play('cur'); upd(); }
        else if (k === 'down') { idx = (idx + 1) % items.length; SFX.play('cur'); upd(); }
        else if (k === 'ok') choosePick();
        else if (k === 'cancel' && o.cancel !== false) { SFX.play('cancel'); close(-1); }
      }
    };
    UI.push(h); upd();
  });
}
async function ask(who, text) {
  await say(who, text); keepDlg();
  const r = await choose(['はい', 'いいえ'], { x: 300, y: 128, w: 76 });
  hideDlg(); return r === 0;
}
function panel(html, x, y, w, h) { const e = place(el('div', 'win'), x, y, w, h); e.innerHTML = html; return e; }

const fadeEl = $('#fade'), tintEl = $('#tint'), screenEl = $('#screen');
async function fadeOut() { fadeEl.style.opacity = 1; await sleep(450); }
async function fadeIn() { fadeEl.style.opacity = 0; await sleep(450); }
function shake() { screenEl.classList.remove('shake'); void screenEl.offsetWidth; screenEl.classList.add('shake'); }
function flashScreen() { screenEl.classList.remove('flash'); void screenEl.offsetWidth; screenEl.classList.add('flash'); }
async function card(title, sub) {
  const c = el('div', 'card'); c.innerHTML = `<div class="ct">${esc(title)}</div><div class="cs">${esc(sub || '').replace(/\n/g, '<br>')}</div>`;
  await sleep(30); c.classList.add('on'); await sleep(700); await waitOk(4000); c.classList.remove('on'); await sleep(500); c.remove();
}
function banner(text) { const b = place(el('div', 'win banner'), 8, 8); b.textContent = text; setTimeout(() => b.classList.add('out'), 1800); setTimeout(() => b.remove(), 2600); }

// ---------- 仲間・能力値 ----------
function needExp(lv) { return 8 * lv + 5 * lv * lv; }
function expAt(lv) { let s = 0; for (let l = 1; l < lv; l++) s += needExp(l); return s; }
function stat(m, k) { const h = HEROES[m.id]; let v = h.base[k] + h.grow[k] * (m.lv - 1); for (const s in m.eq) { const it = ITEMS[m.eq[s]]; if (it && it[k]) v += it[k]; } return Math.floor(v); }
const mhp = m => stat(m, 'hp'), mki = m => stat(m, 'ki');
function skillsOf(m) { return HEROES[m.id].skills.filter(([, lv, f]) => m.lv >= lv && (!f || F(f))).map(s => s[0]); }
function mkMember(id, lv = 1) { const m = { id, name: PEOPLE[id].name, lv, exp: expAt(lv), eq: { ...HEROES[id].start }, hp: 0, ki: 0 }; m.hp = mhp(m); m.ki = mki(m); return m; }
function restAll() { for (const id of G.party) { const m = G.mem[id]; m.hp = mhp(m); m.ki = mki(m); } }
function rebuildChain() { G.chain = G.party.slice(1).map(() => ({ x: G.px, y: G.py, ox: G.px, oy: G.py, dir: G.dir })); }
async function join(id, lv) {
  if (!G.mem[id]) G.mem[id] = mkMember(id, lv || 1);
  else if (lv && G.mem[id].lv < lv) { const m = G.mem[id]; m.lv = lv; m.exp = expAt(lv); }
  const m = G.mem[id]; m.hp = mhp(m); m.ki = mki(m);
  if (!G.party.includes(id)) G.party.push(id);
  flag(id); rebuildChain(); SFX.play('join');
  await N(`${m.name}が 仲間に加わった！`);
}
async function leave(id) {
  const m = G.mem[id]; G.party = G.party.filter(p => p !== id);
  for (const s of ['a', 'h', 'x']) if (m.eq[s] && !HEROES[id].start[s]) { addItem(m.eq[s]); delete m.eq[s]; }
  rebuildChain();
  await N(`${m.name}が 一行を離れた。`);
}
function addItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) + n; if (G.inv[id] <= 0) delete G.inv[id]; }
async function give(id, n = 1) { addItem(id, n); SFX.play('learn'); await N(`${ITEMS[id].name}を 手に入れた！`); }
async function getMoney(n) { G.money += n; SFX.play('learn'); await N(`${n}文を 受け取った！`); }

// ---------- マップ ----------
const DIRS = [[0, 1], [-1, 0], [1, 0], [0, -1]];
function dirOf(dx, dy) { return dy > 0 ? 0 : dx < 0 ? 1 : dx > 0 ? 2 : 3; }
function tileAt(x, y) { const m = G.map; if (x < 0 || y < 0 || x >= m.w || y >= m.h) return 'x'; return m.g[y][x]; }
function npcs() { return G.map.npcs.filter(n => !n.cond || n.cond()); }
function npcAt(x, y) { return npcs().find(n => n.x === x && n.y === y); }
function passable(x, y) { return !SOLID.has(tileAt(x, y)) && !npcAt(x, y); }
function enterMap(id, x, y, dir = 0) {
  const m = MAPS[id].build(); m.h = m.g.length; m.w = m.g[0].length; m.id = id;
  m.npcs = m.npcs || []; m.warps = m.warps || []; m.triggers = m.triggers || [];
  G.map = m; G.mapId = id; G.px = x; G.py = y; G.dir = dir; G.move = null; G.encSteps = 0;
  G.night = !!(m.night && m.night()); G.scene = 'map';
  rebuildChain(); banner(m.name);
}
async function warp(w) {
  await fadeOut(); enterMap(w.to, w.x2, w.y2, w.dir ?? G.dir); await fadeIn();
  if (G.map.onEnter) await G.map.onEnter();
}
async function run(fn) {
  if (G.busy) return; G.busy = true;
  try { await fn(); }
  catch (e) { if (e === GAMEOVER) await gameOver(); else console.error(e); }
  hideDlg(); G.busy = false;
}
function onStep() {
  const m = G.map;
  const w = m.warps.find(w => w.x === G.px && w.y === G.py);
  if (w) { run(() => warp(w)); return; }
  const tr = m.triggers.find(t => G.px >= t.x && G.px < t.x + (t.w || 1) && G.py >= t.y && G.py < t.y + (t.h || 1) && (!t.cond || t.cond()));
  if (tr) { run(tr.run); return; }
  const tbl = m.enc && m.enc();
  if (tbl && (m.encTiles || ['.']).includes(tileAt(G.px, G.py))) {
    G.encSteps++;
    if (G.encSteps > 5 && Math.random() < 1 / 14) { G.encSteps = 0; run(() => battle(pick(tbl), { bg: m.bbg || 'field' })); }
  }
}
function mapUpdate() {
  if (G.move) {
    G.move.t += G.move.spd;
    if (G.move.t >= 1) { G.move = null; for (const f of G.chain) { f.ox = f.x; f.oy = f.y; } onStep(); }
    return;
  }
  if (G.busy || UI.top()) return;
  const d = Input.dir(); if (d < 0) return;
  G.dir = d; const nx = G.px + DIRS[d][0], ny = G.py + DIRS[d][1];
  if (!passable(nx, ny)) return;
  let prev = { x: G.px, y: G.py };
  for (const f of G.chain) { const old = { x: f.x, y: f.y }; f.ox = f.x; f.oy = f.y; if (prev.x !== f.x || prev.y !== f.y) f.dir = dirOf(prev.x - f.x, prev.y - f.y); f.x = prev.x; f.y = prev.y; prev = old; }
  G.move = { fx: G.px, fy: G.py, t: 0, spd: Input.held.run ? .25 : .125 };
  G.px = nx; G.py = ny;
}
function mapKey(k) {
  if (G.move) return;
  if (k === 'ok') {
    const fx = G.px + DIRS[G.dir][0], fy = G.py + DIRS[G.dir][1];
    const n = npcAt(fx, fy);
    if (n) { if (n.spr !== 'pot' && n.spr !== 'boat') n.dir = 3 - G.dir; run(n.pot ? () => openPot(n) : n.talk); return; }
    if (tileAt(fx, fy) === 'D') run(() => N('戸は閉まっている。'));
  } else if (k === 'cancel') run(openMenu);
}
async function openPot(n) {
  const k = 'pot_' + n.pot;
  if (F(k)) { await N('黒薩摩の甕は 空っぽだ。'); return; }
  flag(k); await N('黒薩摩の甕を のぞきこんだ……'); await give(n.item);
}

// ---------- 描画 ----------
function drawMap() {
  const m = G.map, t = G.move ? G.move.t : 1;
  const ppx = (G.move ? G.move.fx + (G.px - G.move.fx) * t : G.px) * TS, ppy = (G.move ? G.move.fy + (G.py - G.move.fy) * t : G.py) * TS;
  const mw = m.w * TS, mh = m.h * TS;
  const cx = Math.round(mw <= SW ? (mw - SW) / 2 : Math.max(0, Math.min(mw - SW, ppx - SW / 2 + 8)));
  const cy = Math.round(mh <= SH ? (mh - SH) / 2 : Math.max(0, Math.min(mh - SH, ppy - SH / 2 + 8)));
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH);
  const af = (G.frame >> 5) & 1;
  for (let y = Math.floor(cy / TS); y <= Math.floor((cy + SH) / TS); y++) for (let x = Math.floor(cx / TS); x <= Math.floor((cx + SW) / TS); x++) {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
    const ch = m.g[y][x];
    ctx.drawImage(tileImg(ch, ANIM.has(ch) ? af : 0, (x * 7 + y * 13) % 4), x * TS - cx, y * TS - cy);
  }
  const wf = (G.frame >> 4) & 1, list = [];
  for (const n of npcs()) list.push({ x: n.x * TS, y: n.y * TS, img: charImg(n.spr, n.dir || 0, n.spr === 'pot' ? 0 : wf) });
  G.chain.forEach((f, i) => list.push({ x: (f.ox + (f.x - f.ox) * t) * TS, y: (f.oy + (f.y - f.oy) * t) * TS - .1, img: charImg(G.party[i + 1], f.dir, wf) }));
  list.push({ x: ppx, y: ppy, img: charImg(G.party[0], G.dir, wf) });
  list.sort((a, b) => a.y - b.y);
  for (const s of list) ctx.drawImage(s.img, Math.round(s.x - cx), Math.round(s.y - cy - 2));
}
function draw() {
  ctx.imageSmoothingEnabled = false;
  if (G.scene === 'map' && G.map) drawMap();
  else if (G.scene === 'battle' && G.B) drawBattle();
  else if (G.scene === 'title') ctx.drawImage(bgImg('title'), 0, 0);
  tintEl.style.opacity = G.night && G.scene === 'map' ? 1 : 0;
}
function loop() {
  G.frame++;
  let k;
  while ((k = Input.q.shift()) !== undefined) { const h = UI.top(); if (h) h.onKey(k); else if (G.scene === 'map' && !G.busy) mapKey(k); }
  if (G.scene === 'map' && G.map) mapUpdate();
  draw();
  requestAnimationFrame(loop);
}

// ---------- メニュー ----------
function memberLine(m) { return `HP ${m.hp}/${mhp(m)}　気 ${m.ki}/${mki(m)}`; }
async function openMenu() {
  let last = 0;
  while (true) {
    const money = panel(`<div class="money">${G.money}<small>文</small></div>`, 8, 160, 96);
    const i = await choose(['つよさ', 'どうぐ', 'そうび', 'わざ', 'きろく'], { x: 8, y: 8, w: 96, start: last });
    money.remove(); if (i < 0) return; last = i;
    if (i === 0) await showStatus();
    if (i === 1) await itemMenu();
    if (i === 2) await equipMenu();
    if (i === 3) await skillMenu();
    if (i === 4) { await N(save() ? '冒険を 記録しました。' : '記録できませんでした（ブラウザの保存が無効です）。'); }
  }
}
async function showStatus() {
  const rows = G.party.map(id => {
    const m = G.mem[id], eq = ['w', 'a', 'h', 'x'].map(s => `${SLOT_NAMES[s]}：${m.eq[s] ? ITEMS[m.eq[s]].name : '―'}`).join('<br>');
    return `<div class="st"><canvas data-por="${id}" width="32" height="32"></canvas><div><b>${esc(m.name)}</b>　Lv ${m.lv}<br>${memberLine(m)}<br>攻 ${stat(m, 'atk')}　守 ${stat(m, 'def')}　速 ${stat(m, 'spd')}<br><small>次のLvまで ${expAt(m.lv + 1) - m.exp}</small></div><div class="eq">${eq}</div></div>`;
  }).join('');
  const p = panel(rows, 8, 8, 368, 272);
  p.querySelectorAll('canvas[data-por]').forEach(c => c.getContext('2d').drawImage(portraitImg(infoOf(c.dataset.por).por), 0, 0));
  await waitOk(); p.remove();
}
function invList(filter) { return Object.keys(G.inv).filter(id => G.inv[id] > 0 && filter(ITEMS[id])); }
function descBox() { const d = place(el('div', 'win desc'), 8, 236, 368, 44); return d; }
async function pickMember(o = {}) {
  const ids = o.ids || G.party;
  const i = await choose(ids.map(id => ({ label: G.mem[id].name, right: o.right ? o.right(G.mem[id]) : `HP ${G.mem[id].hp}/${mhp(G.mem[id])}` })), { x: o.x ?? 116, y: o.y ?? 8, w: o.w ?? 200 });
  return i < 0 ? null : ids[i];
}
async function itemMenu() {
  while (true) {
    const ids = invList(() => true);
    if (!ids.length) { await N('何も持っていない。'); return; }
    const d = descBox();
    const i = await choose(ids.map(id => ({ label: ITEMS[id].name, right: '×' + G.inv[id], disabled: ITEMS[id].type !== 'use' })), { x: 116, y: 8, w: 200, maxH: 220, onMove: k => d.textContent = ITEMS[ids[k]].desc || '' });
    d.remove(); if (i < 0) return;
    const id = ids[i], t = ITEMS[id].healAll ? G.party[0] : await pickMember({ x: 200, y: 40, w: 176 });
    if (t) await useItem(id, t, false);
  }
}
async function useItem(id, tid, inBattle) {
  const it = ITEMS[id], m = G.mem[tid], who = G.mem[G.party[0]].name;
  if (!G.inv[id]) { await msg(`しかし ${it.name}は もう なかった！`); return; }
  if (it.revive) {
    if (m.hp > 0) { await msg(`${m.name}は 倒れていない。`); return; }
    addItem(id, -1); m.hp = Math.max(1, Math.floor(mhp(m) * it.revive)); SFX.play('heal'); await msg(`${it.name}を飲ませた！ ${m.name}が 起き上がった！`); return;
  }
  if (it.healAll) { addItem(id, -1); for (const p of G.party) { const x = G.mem[p]; if (x.hp > 0) x.hp = Math.min(mhp(x), x.hp + it.healAll); } SFX.play('heal'); await msg(`${it.name}を みんなで食べた！ 全員のHPが回復した！`); return; }
  if (m.hp <= 0) { await msg(`${m.name}は 倒れている……。`); return; }
  addItem(id, -1);
  if (it.heal) { const v = Math.min(it.heal, mhp(m) - m.hp); m.hp += v; SFX.play('heal'); await msg(`${m.name}は ${it.name}を食べた！ HPが ${v} 回復した！`); }
  if (it.ki) { const v = Math.min(it.ki, mki(m) - m.ki); m.ki += v; SFX.play('heal'); await msg(`${m.name}は ${it.name}をなめた！ 気が ${v} 回復した！`); }
  if (inBattle) updateBStat();
}
async function msg(t) { if (G.B) await bmsg(t); else await N(t); }
function canEquip(m, it) { return it.type !== 'w' || HEROES[m.id].kinds.includes(it.kind); }
function equipDiff(m, it) { const k = it.type === 'w' ? 'atk' : 'def'; const cur = m.eq[it.type] ? (ITEMS[m.eq[it.type]][k] || 0) : 0; const d = (it[k] || 0) - cur; return `${k === 'atk' ? '攻' : '守'}${d >= 0 ? '+' : ''}${d}`; }
function doEquip(m, id) { const it = ITEMS[id]; if (m.eq[it.type]) addItem(m.eq[it.type]); m.eq[it.type] = id; addItem(id, -1); m.hp = Math.min(m.hp, mhp(m)); m.ki = Math.min(m.ki, mki(m)); }
async function equipMenu() {
  const tid = await pickMember({ right: m => `Lv ${m.lv}` }); if (!tid) return;
  const m = G.mem[tid];
  while (true) {
    const slots = ['w', 'a', 'h', 'x'];
    const s = await choose(slots.map(k => ({ label: SLOT_NAMES[k], right: m.eq[k] ? ITEMS[m.eq[k]].name : '―' })), { x: 116, y: 8, w: 240, title: m.name + 'の装備' });
    if (s < 0) return;
    const slot = slots[s], ids = invList(it => it.type === slot && canEquip(m, it));
    const opts = ids.map(id => ({ label: ITEMS[id].name, right: equipDiff(m, ITEMS[id]) }));
    if (m.eq[slot]) opts.push({ label: '外す' });
    if (!opts.length) { await N('装備できる物を 持っていない。'); continue; }
    const d = descBox();
    const i = await choose(opts, { x: 136, y: 40, w: 220, maxH: 190, onMove: k => d.textContent = ids[k] ? ITEMS[ids[k]].desc : '' });
    d.remove(); if (i < 0) continue;
    if (i >= ids.length) { addItem(m.eq[slot]); delete m.eq[slot]; m.hp = Math.min(m.hp, mhp(m)); }
    else doEquip(m, ids[i]);
    SFX.play('ok');
  }
}
async function skillMenu() {
  const tid = await pickMember({ right: m => `気 ${m.ki}/${mki(m)}` }); if (!tid) return;
  const m = G.mem[tid], sks = skillsOf(m);
  if (!sks.length) { await N(`${m.name}は まだ わざを覚えていない。`); return; }
  const d = descBox();
  const i = await choose(sks.map(k => ({ label: SKILLS[k].name, right: '気' + SKILLS[k].ki, disabled: SKILLS[k].type !== 'heal' || m.ki < SKILLS[k].ki })), { x: 116, y: 40, w: 220, onMove: k => d.textContent = SKILLS[sks[k]].desc });
  d.remove(); if (i < 0) return;
  const sk = SKILLS[sks[i]];
  const targets = sk.target === 'allies' ? G.party : [await pickMember({ x: 200, y: 72, w: 176 })];
  if (!targets[0]) return;
  m.ki -= sk.ki;
  for (const t of targets) { const x = G.mem[t]; if (x.hp <= 0) continue; const v = Math.min(mhp(x) - x.hp, Math.round(sk.pow + m.lv * 3)); x.hp += v; await N(`${x.name}の HPが ${v} 回復した！`); }
  SFX.play('heal');
}
async function shop(list) {
  while (true) {
    const money = panel(`<div class="money">${G.money}<small>文</small></div>`, 8, 160, 96);
    const c = await choose(['買う', '売る', 'やめる'], { x: 8, y: 8, w: 96 });
    money.remove();
    if (c < 0 || c === 2) { await N('またおじゃったもんせ。'); return; }
    if (c === 0) {
      while (true) {
        const ids = list, d = descBox(), mb = panel(`<div class="money">${G.money}<small>文</small></div>`, 8, 160, 96);
        const i = await choose(ids.map(id => ({ label: ITEMS[id].name, right: ITEMS[id].price + '文' })), {
          x: 112, y: 8, w: 264, maxH: 220, onMove: k => {
            const it = ITEMS[ids[k]]; let s = it.desc || '';
            if (it.type !== 'use') s += '　' + G.party.map(p => { const m = G.mem[p]; return canEquip(m, it) ? `${m.name}${equipDiff(m, it)}` : `${m.name}×`; }).join(' ');
            d.textContent = s;
          }
        });
        d.remove(); mb.remove(); if (i < 0) break;
        const it = ITEMS[ids[i]];
        if (G.money < it.price) { SFX.play('ng'); await N('お金が 足りもはん。'); continue; }
        G.money -= it.price; addItem(ids[i]); SFX.play('ok');
        if (it.type !== 'use') {
          const can = G.party.filter(p => canEquip(G.mem[p], it));
          if (can.length && await ask(null, `${it.name}を 今すぐ装備しますか？`)) {
            const t = await pickMember({ ids: can, right: m => equipDiff(m, it) });
            if (t) { doEquip(G.mem[t], ids[i]); await N(`${G.mem[t].name}は ${it.name}を 装備した！`); }
          } else await N('毎度おおきに！');
        } else await N('毎度おおきに！');
      }
    }
    if (c === 1) {
      while (true) {
        const ids = invList(it => it.price > 0);
        if (!ids.length) { await N('売れる物が ありもはん。'); break; }
        const i = await choose(ids.map(id => ({ label: ITEMS[id].name + ' ×' + G.inv[id], right: Math.floor(ITEMS[id].price / 2) + '文' })), { x: 112, y: 8, w: 264, maxH: 220 });
        if (i < 0) break;
        const id = ids[i]; G.money += Math.floor(ITEMS[id].price / 2); addItem(id, -1); SFX.play('ok');
      }
    }
  }
}
async function shopTalk(kind) {
  if (kind === 'dougu') await S('merchant', 'いらっしゃいもうせ！\n薩摩の味、そろえちょります。');
  else await S('smith', 'よか鋼が入っちょっど。\n見ていっきやんせ。');
  await shop(SHOPS[kind]());
}
async function rest() { await fadeOut(); restAll(); await sleep(300); await fadeIn(); SFX.play('heal'); await N('ぐっすり眠って、みんな元気になった！'); }

// ---------- 戦闘 ----------
function calcDmg(atk, def, pow) { const b = Math.max(1, atk * pow - def * .5); return Math.max(1, Math.round(b * (.85 + Math.random() * .3))); }
function layoutEnemies(B) {
  const imgs = B.es.map(e => e.img), sc = 2, gap = 10;
  const total = imgs.reduce((s, c) => s + c.width * sc, 0) + gap * (imgs.length - 1);
  let x = (SW - total) / 2;
  B.es.forEach(e => { e.w = e.img.width * sc; e.h = e.img.height * sc; e.x = Math.round(x); e.y = 184 - e.h; x += e.w + gap; });
}
function drawBattle() {
  const B = G.B;
  ctx.drawImage(bgImg(B.bg), 0, 0);
  for (const e of B.es) {
    if (e.dead) e.alpha = Math.max(0, e.alpha - .05);
    if (e.alpha <= 0) continue;
    if (e.flash > 0) { e.flash--; if ((e.flash >> 1) % 2) continue; }
    ctx.globalAlpha = e.alpha; ctx.drawImage(e.img, e.x, e.y, e.w, e.h); ctx.globalAlpha = 1;
  }
  if (B.sel != null && B.es[B.sel] && !B.es[B.sel].dead && (G.frame >> 3) % 2) {
    const e = B.es[B.sel]; ctx.fillStyle = '#ffe070'; const cx = e.x + e.w / 2;
    for (let i = 0; i < 6; i++) ctx.fillRect(cx - 6 + i, e.y - 14 + i, 12 - i * 2, 1);
  }
}
function updateBStat() {
  const B = G.B; if (!B) return;
  G.party.forEach((id, i) => {
    const m = G.mem[id], e = B.statEls[i];
    e.classList.toggle('dead', m.hp <= 0); e.classList.toggle('act', B.actIdx === i);
    e.innerHTML = `<div class="bn">${esc(m.name)}<span>Lv${m.lv}</span></div><div>HP <b>${m.hp}</b><small>/${mhp(m)}</small></div><div>気 <b>${m.ki}</b><small>/${mki(m)}</small></div>`;
  });
}
function hurtFlash(id) { const i = G.party.indexOf(id); const e = G.B && G.B.statEls[i]; if (e) { e.classList.remove('hurt'); void e.offsetWidth; e.classList.add('hurt'); } }
async function bmsg(t, ms = 750) { const B = G.B; B.msgEl.textContent = t; await waitOk(ms); }
function setMsgWide(wide) { const e = G.B.msgEl; if (wide) place(e, 8, 196, 368, 84); else place(e, 112, 196, 264, 84); }
async function battle(group, opt = {}) {
  hideDlg();
  const prevScene = G.scene;
  const counts = {}; group.forEach(id => counts[id] = (counts[id] || 0) + 1);
  const seen = {};
  const B = {
    es: group.map(id => {
      const d = ENEMIES[id]; let name = d.name;
      if (counts[id] > 1) { seen[id] = (seen[id] || 0) + 1; name += 'ABCD'[seen[id] - 1]; }
      return { id, d, name, hp: d.hp, atk: d.atk, def: d.def, spd: d.spd, img: enemyImg(id), flash: 0, alpha: 1, dead: false, buff: 0 };
    }), turn: 1, opt, bg: opt.bg || 'field', defend: {}, sel: null, actIdx: -1,
  };
  layoutEnemies(B);
  SFX.play('enc'); flashScreen(); await sleep(350);
  G.B = B; G.scene = 'battle';
  const n = G.party.length, w = Math.floor((368 - (n - 1) * 4) / n);
  B.statEls = G.party.map((id, i) => place(el('div', 'win bst'), 8 + i * (w + 4), 6, w));
  B.msgEl = el('div', 'win bmsg'); setMsgWide(true); updateBStat();
  const names = [...new Set(B.es.map(e => e.d.name))].join('と');
  await bmsg(opt.boss ? `${names}が 立ちはだかった！` : `${names}が あらわれた！`, 1100);
  let result = null;
  while (!result) {
    const acts = await inputCommands(B);
    setMsgWide(true); B.actIdx = -1; updateBStat();
    if (acts === 'run') {
      await bmsg(`${G.mem[G.party[0]].name}たちは 逃げ出した！`, 500);
      if (opt.noRun) { await bmsg('しかし 退くことは許されない！'); result = await execTurn(B, []); }
      else if (Math.random() < .65) { result = 'run'; }
      else { await bmsg('しかし 回り込まれてしまった！'); result = await execTurn(B, []); }
    } else result = await execTurn(B, acts);
  }
  if (result === 'win') await victory(B);
  if (result === 'lose') { await bmsg(`${G.mem[G.party[0]].name}たちは 力尽きた……`, 1600); }
  B.statEls.forEach(e => e.remove()); B.msgEl.remove();
  G.B = null; G.scene = prevScene === 'battle' ? 'map' : prevScene;
  if (result === 'lose') {
    if (opt.canLose) { for (const id of G.party) { const m = G.mem[id]; if (m.hp <= 0) m.hp = 1; } return 'lose'; }
    throw GAMEOVER;
  }
  for (const id of G.party) { const m = G.mem[id]; if (m.hp <= 0) m.hp = 1; }
  return result;
}
async function inputCommands(B) {
  const alive = G.party.filter(id => G.mem[id].hp > 0), acts = [];
  let i = 0;
  while (i < alive.length) {
    const id = alive[i], m = G.mem[id];
    B.actIdx = G.party.indexOf(id); updateBStat(); setMsgWide(false);
    B.msgEl.textContent = `${m.name}は どうする？`;
    const c = await choose(['たたかう', 'わざ', 'どうぐ', 'ぼうぎょ', 'にげる'], { x: 8, y: 172, w: 100, cancel: i > 0 });
    if (c < 0) { i--; acts.pop(); continue; }
    let act = null;
    if (c === 0) { const t = await pickEnemy(B); if (t < 0) continue; act = { type: 'atk', actor: id, t }; }
    if (c === 1) {
      const sks = skillsOf(m);
      if (!sks.length) { B.msgEl.textContent = 'まだ わざを覚えていない。'; await waitOk(900); continue; }
      const k = await choose(sks.map(s => ({ label: SKILLS[s].name, right: '気' + SKILLS[s].ki, disabled: m.ki < SKILLS[s].ki })), { x: 112, y: 160, w: 200, onMove: j => B.msgEl.textContent = SKILLS[sks[j]].desc });
      if (k < 0) continue;
      const sk = SKILLS[sks[k]]; let t = null;
      if (sk.target === 'enemy') { t = await pickEnemy(B); if (t < 0) continue; }
      if (sk.target === 'ally') { t = await pickMember({ x: 112, y: 100, w: 200 }); if (!t) continue; }
      act = { type: 'skill', sk: sks[k], actor: id, t };
    }
    if (c === 2) {
      const ids = invList(it => it.type === 'use');
      if (!ids.length) { B.msgEl.textContent = '使える道具を 持っていない。'; await waitOk(900); continue; }
      const k = await choose(ids.map(x => ({ label: ITEMS[x].name, right: '×' + G.inv[x] })), { x: 112, y: 60, w: 200, maxH: 130, onMove: j => B.msgEl.textContent = ITEMS[ids[j]].desc });
      if (k < 0) continue;
      const t = ITEMS[ids[k]].healAll ? id : await pickMember({ x: 112, y: 100, w: 200 }); if (!t) continue;
      act = { type: 'item', item: ids[k], actor: id, t };
    }
    if (c === 3) act = { type: 'def', actor: id };
    if (c === 4) { B.actIdx = -1; return 'run'; }
    acts.push(act); i++;
  }
  B.actIdx = -1;
  return acts;
}
async function pickEnemy(B) {
  const alive = B.es.map((e, i) => i).filter(i => !B.es[i].dead);
  if (alive.length === 1) return alive[0];
  const k = await choose(alive.map(i => B.es[i].name), { x: 112, y: 120, w: 200, onMove: j => B.sel = alive[j] });
  B.sel = null; return k < 0 ? -1 : alive[k];
}
const aliveMembers = () => G.party.map(id => G.mem[id]).filter(m => m.hp > 0);
async function execTurn(B, acts) {
  const all = acts.map(a => ({ ...a, side: 'p', r: stat(G.mem[a.actor], 'spd') * (.7 + Math.random() * .6) }));
  for (const e of B.es) if (!e.dead) all.push({ side: 'e', e, r: e.spd * (.7 + Math.random() * .6) });
  all.sort((a, b) => b.r - a.r);
  B.defend = {}; for (const a of acts) if (a.type === 'def') B.defend[a.actor] = true;
  for (const a of all) {
    if (a.side === 'p') { if (G.mem[a.actor].hp <= 0) continue; await pAct(B, a); }
    else { if (a.e.dead) continue; await eAct(B, a.e); }
    if (B.es.every(e => e.dead)) return 'win';
    if (!aliveMembers().length) return 'lose';
  }
  B.turn++;
  return null;
}
function retarget(B, t) { const e = B.es[t]; if (e && !e.dead) return e; return B.es.find(x => !x.dead); }
async function hitEnemy(B, e, atk, pow, sure) {
  if (!sure && Math.random() < .05) { SFX.play('cancel'); await bmsg('しかし 攻撃は外れた！'); return; }
  let dmg = calcDmg(atk, e.def, pow);
  if (Math.random() < 1 / 20) { dmg = Math.round(atk * pow * 1.5); await bmsg('見事な一撃！', 450); }
  e.hp -= dmg; e.flash = 14; SFX.play('hit');
  await bmsg(`${e.name}に ${dmg} の ダメージ！`);
  if (e.hp <= 0) { e.hp = 0; e.dead = true; SFX.play('kill'); await bmsg(e.d.defeat ? e.d.defeat.replace('{n}', e.name) : `${e.name}を 倒した！`); }
}
async function hitMember(B, m, atk, pow) {
  let dmg = calcDmg(atk, stat(m, 'def'), pow);
  if (B.defend[m.id]) dmg = Math.max(1, Math.round(dmg / 2));
  m.hp = Math.max(0, m.hp - dmg); SFX.play('hurt'); shake(); hurtFlash(m.id); updateBStat();
  await bmsg(`${m.name}は ${dmg} の ダメージを受けた！`);
  if (m.hp <= 0) await bmsg(`${m.name}は 倒れた……`);
}
async function pAct(B, a) {
  const m = G.mem[a.actor];
  if (a.type === 'def') { await bmsg(`${m.name}は 身を守っている。`, 500); return; }
  if (a.type === 'atk') { const e = retarget(B, a.t); if (!e) return; await bmsg(`${m.name}の 攻撃！`, 400); await hitEnemy(B, e, stat(m, 'atk'), 1); return; }
  if (a.type === 'item') { await useItem(a.item, a.t, true); updateBStat(); return; }
  if (a.type === 'skill') {
    const sk = SKILLS[a.sk];
    if (m.ki < sk.ki) { await bmsg(`${m.name}は ${sk.name}を使おうとした！ しかし 気が足りない！`); return; }
    m.ki -= sk.ki; updateBStat();
    await bmsg(`${m.name}の ${sk.name}！`, 450);
    if (sk.type === 'atk') {
      let pow = sk.pow;
      if (sk.first && B.turn === 1) { pow *= sk.first; await bmsg('初太刀！ チェストォォォッ！！', 600); }
      const ts = sk.target === 'enemies' ? B.es.filter(e => !e.dead) : [retarget(B, a.t)].filter(Boolean);
      for (const e of ts) await hitEnemy(B, e, stat(m, 'atk'), pow, sk.sure);
    } else if (sk.type === 'heal') {
      const ts = sk.target === 'allies' ? G.party.map(id => G.mem[id]) : [G.mem[a.t]];
      for (const t of ts) {
        if (t.hp <= 0) { await bmsg(`しかし ${t.name}は 倒れている……`); continue; }
        const v = Math.min(mhp(t) - t.hp, Math.round((sk.pow + m.lv * 3) * (.9 + Math.random() * .2)));
        t.hp += v; SFX.play('heal'); updateBStat(); await bmsg(`${t.name}の HPが ${v} 回復した！`);
      }
    }
  }
}
async function eAct(B, e) {
  let sk = null; for (const s of (e.d.skills || [])) if (Math.random() < s.p) { sk = s; break; }
  const atk = e.atk * (1 + .25 * e.buff);
  if (!sk) { const t = pick(aliveMembers()); await bmsg(`${e.name}の 攻撃！`, 400); await hitMember(B, t, atk, 1); return; }
  await bmsg(sk.msg.replace('{n}', e.name), 650);
  if (sk.type === 'one') await hitMember(B, pick(aliveMembers()), atk, sk.pow);
  else if (sk.type === 'all' || sk.type === 'explode') {
    if (sk.type === 'explode') { e.dead = true; e.hp = 0; SFX.play('boom'); }
    for (const m of aliveMembers()) await hitMember(B, m, atk, sk.pow);
  } else if (sk.type === 'buff') { if (e.buff < 2) { e.buff++; await bmsg(`${e.name}の 攻撃力が 上がった！`); } else await bmsg('しかし 何も起こらなかった。'); }
}
async function victory(B) {
  const exp = B.es.reduce((s, e) => s + e.d.exp, 0), gold = B.es.reduce((s, e) => s + e.d.gold, 0);
  await bmsg('戦いに 勝った！', 900);
  if (exp) await bmsg(`それぞれ ${exp} の 経験値を得た。`, 900);
  if (gold) { G.money += gold; await bmsg(`${gold}文を 手に入れた。`, 900); }
  for (const id of G.party) {
    const m = G.mem[id]; if (m.hp <= 0) continue;
    m.exp += exp;
    while (m.exp >= expAt(m.lv + 1) && m.lv < 99) {
      const oh = mhp(m), ok = mki(m), before = skillsOf(m);
      m.lv++; m.hp += mhp(m) - oh; m.ki += mki(m) - ok; updateBStat();
      SFX.play('lvup'); await bmsg(`${m.name}は レベル${m.lv}に 上がった！`, 1300);
      for (const s of skillsOf(m)) if (!before.includes(s)) { SFX.play('learn'); await bmsg(`${m.name}は「${SKILLS[s].name}」を 覚えた！`, 1300); }
    }
  }
}

// ---------- セーブ・タイトル ----------
const SAVE_KEY = 'satsuma-homura-v1';
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ party: G.party, mem: G.mem, inv: G.inv, money: G.money, flags: G.flags, chapter: G.chapter, mapId: G.mapId, px: G.px, py: G.py, dir: G.dir })); return true; } catch (e) { return false; } }
function loadData() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function applySave(d) { Object.assign(G, { party: d.party, mem: d.mem, inv: d.inv, money: d.money, flags: d.flags, chapter: d.chapter }); enterMap(d.mapId, d.px, d.py, d.dir); }
function newGame() { G.party = ['shinpachi']; G.mem = { shinpachi: mkMember('shinpachi', 1) }; G.inv = { karaimo: 3 }; G.money = 20; G.flags = {}; G.chapter = 0; enterMap('kajiya', 4, 11, 0); }
async function gameOver() {
  await fadeOut(); G.scene = 'title'; hideDlg();
  await card('力尽きた……', '最後に記録した場所から やり直します');
  const d = loadData();
  if (d) applySave(d); else newGame();
  restAll(); await fadeIn();
}
async function title() {
  G.scene = 'title'; G.map = null;
  const t = el('div', 'title'); t.innerHTML = '<div class="tt">薩摩の焔</div><div class="ts">〜西郷と大久保、二つの星を見た少年の記録〜</div><div class="tv">序章・第一章 体験版 v0.1</div>';
  const has = !!loadData();
  const i = await choose(['はじめから', { label: 'つづきから', disabled: !has }], { x: 142, y: 196, w: 100, cancel: false, start: has ? 1 : 0 });
  await fadeOut(); t.remove();
  if (i === 0) newGame(); else applySave(loadData());
  if (i === 0) run(STORY.opening); else await fadeIn();
}

function fit() {
  const pad = $('#pad'), padH = pad.offsetHeight || 0;
  const k = Math.max(1, Math.min(innerWidth / SW, (innerHeight - padH) / SH));
  screenEl.style.transform = `scale(${k})`;
  const h = $('#holder'); h.style.width = SW * k + 'px'; h.style.height = SH * k + 'px';
}
addEventListener('resize', fit);
addEventListener('load', () => { fit(); title(); loop(); });
