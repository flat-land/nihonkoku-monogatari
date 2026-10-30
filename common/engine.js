'use strict';
// ===== ゲームの仕組み（操作・会話・マップ・メニュー・戦闘・合戦・図鑑・セーブ） =====
const CW = 512, CH = 384;      // キャンバスの内部解像度
const SW = 384, SH = 288;      // UI（文字や窓）の座標系
const VW = CW / TS, VH = CH / TS;
const $ = s => document.querySelector(s);
const cv = $('#cv'), ctx = cv.getContext('2d');
const uiRoot = $('#ui');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[(Math.random() * a.length) | 0];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GAMEOVER = { gameover: true };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const G = { scene: 'title', map: null, mapId: null, px: 0, py: 0, dir: 0, move: null, chain: [], party: [], waiting: [], mem: {}, inv: {}, money: 0, flags: {}, chapter: 0, busy: false, night: false, encSteps: 0, frame: 0, B: null, K: null, ride: false, dex: { p: {}, e: {}, l: {}, end: {} }, log: [], parts: [], emotes: [], playTime: 0 };
const F = k => !!G.flags[k];
const flag = (k, v = true) => { G.flags[k] = v; };
const pts = k => G.flags[k] || 0;
function addPt(k, n = 1) { G.flags[k] = pts(k) + n; }

// ---------- 設定（この端末だけに保存） ----------
// 作品ごとの設定（各作品の data.js で GAME を定める）。言い回しは GW('キー') で引く
const GAME_W = { shopBye: ['またお越しください。'], noMoney: ['お金が 足りません。'], noSell: ['売れる物が ありません。'], jinRest: ['陣で 休んでいきますか？\n控えの人たちも ここにいますよ。', '陣で 休んでいきますか？\n控えの人たちも ここにいますよ。'], horse: ['馬に乗っていきませんか？\n{p}文で、野山ならどこへでも飛ばせますよ。', '馬に乗っていきませんか？\n{p}文で、野山ならどこへでも飛ばせますよ。'], horseNg: ['……お金が足りませんね。', '……お金が足りませんね。'] };
const GW = (k, i = 0) => { const w = (GAME.words && GAME.words[k]) || GAME_W[k]; return w[i] ?? w[0]; };
const OPT_KEY = 'nihonkoku-opt';
const OPT = Object.assign({ lang: 'kago', text: 2, speed: 1, auto: false, bgm: .5, sfx: .8, mini: true, padA: true }, (() => { try { return JSON.parse(localStorage.getItem(OPT_KEY)) || {}; } catch (e) { return {}; } })());
function saveOpt() { try { localStorage.setItem(OPT_KEY, JSON.stringify(OPT)); } catch (e) { } Audio8.vol.bgm = OPT.bgm; Audio8.vol.sfx = OPT.sfx; Audio8.setVol(); updateHud(); }
const T = ms => ms / OPT.speed;
const SFX = { play: n => Audio8.sfx(n) };
const bgm = n => Audio8.play(n);

// ---------- 入力（キーボード・仮想パッド・タップ） ----------
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', z: 'ok', Enter: 'ok', ' ': 'ok', x: 'cancel', Escape: 'cancel', Backspace: 'cancel', Shift: 'run', c: 'menu', m: 'map', l: 'log', p: 'set', f: 'speed', g: 'auto' };
const DIRK = ['up', 'down', 'left', 'right'];
const Input = {
  q: [], held: {}, dirs: [], rep: 0,
  down(k) { if (DIRK.includes(k) && !this.dirs.includes(k)) this.dirs.push(k); this.held[k] = true; if (k !== 'run') this.q.push(k); this.rep = G.frame + 18; },
  up(k) { this.held[k] = false; this.dirs = this.dirs.filter(d => d !== k); },
  setStick(k) { for (const d of DIRK) if (d !== k && this.dirs.includes(d)) this.up(d); if (k && !this.dirs.includes(k)) this.down(k); },
  dir() { const k = this.dirs[this.dirs.length - 1]; return k ? { down: 0, left: 1, right: 2, up: 3 }[k] : -1; },
};
const keyOf = e => KEYMAP[e.key] || KEYMAP[e.key.length === 1 ? e.key.toLowerCase() : ''];
addEventListener('keydown', e => { const k = keyOf(e); if (!k) return; e.preventDefault(); Audio8.unlock(); if (e.repeat) { if (DIRK.includes(k)) Input.q.push(k); return; } Input.down(k); });
addEventListener('keyup', e => { const k = keyOf(e); if (k) Input.up(k); });
addEventListener('blur', () => { Input.held = {}; Input.dirs = []; });
for (const ev of ['touchend', 'pointerdown', 'keydown', 'click']) addEventListener(ev, () => Audio8.unlock(), { passive: true });
document.querySelectorAll('[data-k]').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Audio8.unlock(); Input.down(k); b.classList.add('on'); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { Input.up(k); b.classList.remove('on'); });
});
// 円形パッド：真ん中のスティックを動かしても、まわりの矢印を押しても同じ方向が入る。
// 中心は固定なので、メニューの選択は矢印をトンと押すだけでよい。
(() => {
  const zone = $('#stick'), knob = $('#stickKnob'); if (!zone) return;
  const arw = { up: zone.querySelector('.u'), down: zone.querySelector('.d'), left: zone.querySelector('.l'), right: zone.querySelector('.r') };
  let id = null, tapA = false, t0 = 0;   // 真ん中をトンと押して離す＝A（ドラッグしたら移動だけ）
  const at = e => {
    const r = zone.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (document.body.classList.contains('rot')) [dx, dy] = [dy, -dx];   // 横向き表示中は画面ごと90度回っている
    const R = zone.offsetWidth / 2, dist = Math.hypot(dx, dy), m = Math.min(dist, R * .42);
    knob.style.transform = `translate(calc(-50% + ${dist ? dx / dist * m : 0}px), calc(-50% + ${dist ? dy / dist * m : 0}px))`;
    const k = dist < 12 ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (k) tapA = false;
    for (const d in arw) arw[d].classList.toggle('on', d === k);
    Input.setStick(k);
  };
  zone.addEventListener('pointerdown', e => { e.preventDefault(); Audio8.unlock(); id = e.pointerId; zone.setPointerCapture(id); tapA = true; t0 = Date.now(); at(e); if (tapA) knob.classList.add('on'); });
  zone.addEventListener('pointermove', e => { if (e.pointerId === id) at(e); });
  const end = e => {
    if (e.pointerId !== id) return; id = null; knob.classList.remove('on');
    if (tapA && OPT.padA !== false && e.type === 'pointerup' && Date.now() - t0 < 600) { Input.down('ok'); Input.up('ok'); }
    knob.style.transform = 'translate(-50%,-50%)'; for (const d in arw) arw[d].classList.remove('on'); Input.setStick(null); };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
})();
$('#screen').addEventListener('pointerdown', e => { Audio8.unlock(); const h = UI.top(); if (h && h.tap) { e.preventDefault(); Input.q.push('ok'); } });

// ---------- UI部品 ----------
const UI = { stack: [], push(h) { this.stack.push(h); }, pop(h) { const i = this.stack.lastIndexOf(h); if (i >= 0) this.stack.splice(i, 1); }, top() { return this.stack[this.stack.length - 1]; } };
function el(tag, cls, parent = uiRoot) { const e = document.createElement(tag); if (cls) e.className = cls; parent.appendChild(e); return e; }
function place(e, x, y, w, h) { e.style.left = x + 'px'; e.style.top = y + 'px'; if (w) e.style.width = w + 'px'; if (h) e.style.height = h + 'px'; return e; }
function waitOk(ms, tap = true) {
  return new Promise(res => {
    let done = false, t = null;
    const fin = () => { if (done) return; done = true; UI.pop(h); clearTimeout(t); res(); };
    const h = { tap, onKey(k) { if (k === 'ok' || k === 'cancel') fin(); } };
    UI.push(h); if (ms) t = setTimeout(fin, ms);
  });
}
// 図鑑・年表の知らせ：同時に出ても重ならないよう、空いている段に順に並べる
const TOAST_ROWS = [];
function toast(text) {
  let row = 0; while (TOAST_ROWS[row]) row++;
  const t = el('div', 'toast'); t.textContent = text; t.style.top = (30 + row * 18) + 'px'; TOAST_ROWS[row] = t;
  setTimeout(() => t.classList.add('out'), 1800 + row * 300); setTimeout(() => { t.remove(); if (TOAST_ROWS[row] === t) TOAST_ROWS[row] = null; }, 2500 + row * 300);
}

// 会話。who=人物ID, text=鹿児島弁などの元のセリフ, std=標準語訳
const DLG = { el: null, sub: null, hideT: null };
function infoOf(who) {
  if (!who) return null;
  if (typeof who === 'object') return who;
  const p = PEOPLE[who]; if (!p) return { name: who };
  return { name: (G.mem[who] && G.mem[who].name) || (typeof p.name === 'function' ? p.name() : p.name), por: typeof p.por === 'function' ? p.por() : p.por };
}
function say(who, text, std) {
  if (!DLG.el) {
    DLG.el = place(el('div', 'win dlg'), 6, 192, 372, 90);
    DLG.el.innerHTML = '<canvas class="por" width="64" height="64"></canvas><div class="nm"></div><div class="tx"></div><div class="arw">▼</div>';
    DLG.sub = place(el('div', 'win sub'), 6, 150, 372); DLG.sub.style.display = 'none';
    DLG.bust = place(el('canvas', 'bust'), 252, 62, 128, 154); DLG.bust.width = 300; DLG.bust.height = 360; DLG.bust.style.display = 'none';
  }
  clearTimeout(DLG.hideT);
  if (who && typeof who === 'string') meet(who);
  const d = DLG.el, info = infoOf(who), por = d.querySelector('.por'), nm = d.querySelector('.nm'), tx = d.querySelector('.tx'), arw = d.querySelector('.arw');
  let shown = text, sub = null;
  if (std && OPT.lang === 'std') shown = std;
  if (std && OPT.lang === 'both') sub = std;
  // 顔絵は主要人物だけ（高画質のイラストを右上に重ねる）。モブは名前だけ
  const main = isMain(who);
  d.style.display = 'block'; d.classList.toggle('narr', !info); d.classList.remove('hasp'); d.classList.toggle('hasbust', main);
  DLG.bust.style.display = main ? 'block' : 'none';
  if (main) { const bc = DLG.bust.getContext('2d'); bc.clearRect(0, 0, 300, 360); bc.drawImage(hiPortrait(who), 0, 0); }
  DLG.sub.style.width = (main ? 246 : 372) + 'px';
  nm.textContent = info ? info.name : '';
  DLG.sub.style.display = sub ? 'block' : 'none'; if (sub) DLG.sub.textContent = '訳）' + sub.replace(/\n/g, '');
  G.log.push({ n: info ? info.name : '', t: shown }); if (G.log.length > 300) G.log.shift();
  return new Promise(res => {
    let i = 0, done = false, autoT = null;
    arw.style.visibility = 'hidden';
    const per = [60, 34, 18, 6][OPT.text] / OPT.speed;
    const finish = () => { clearInterval(tm); tx.textContent = shown; done = true; arw.style.visibility = 'visible'; if (OPT.auto) autoT = setTimeout(close, T(900 + shown.length * 45)); };
    const tm = setInterval(() => { i += Math.max(1, Math.round(16 / Math.max(per, 4))); tx.textContent = shown.slice(0, i); if (i >= shown.length) finish(); }, Math.max(per, 4));
    const close = () => { clearTimeout(autoT); UI.pop(h); SFX.play('cur'); DLG.hideT = setTimeout(hideDlg, 70); res(); };
    const h = { tap: true, onKey(k) { if (k !== 'ok' && k !== 'cancel') return; if (!done) { finish(); return; } close(); } };
    UI.push(h);
  });
}
function hideDlg() { if (DLG.el) { DLG.el.style.display = 'none'; DLG.sub.style.display = 'none'; DLG.bust.style.display = 'none'; } }
function keepDlg() { clearTimeout(DLG.hideT); }
const N = t => say(null, t);
const S = (who, t, std) => say(who, t, std);

function choose(items, o = {}) {
  return new Promise(res => {
    const box = place(el('div', 'win menu' + (o.cls ? ' ' + o.cls : '')), o.x ?? 8, o.y ?? 8, o.w ?? 140);
    if (o.maxH) { box.style.maxHeight = o.maxH + 'px'; box.style.overflowY = 'auto'; }
    if (o.title) el('div', 'ttl', box).textContent = o.title;
    let idx = Math.max(0, Math.min(o.start || 0, items.length - 1));
    const rows = items.map((it, i) => {
      const r = el('div', 'it', box); const lab = typeof it === 'string' ? it : it.label;
      r.innerHTML = `<span>${esc(lab)}</span>` + (it.right != null ? `<span class="rt">${esc(it.right)}</span>` : '');
      if (it.disabled) r.classList.add('dis');
      r.addEventListener('pointerdown', e => { e.stopPropagation(); if (UI.top() !== h) return; if (idx === i) choosePick(); else { idx = i; upd(); SFX.play('cur'); } });
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
        else if ((k === 'left' || k === 'right') && o.onSide) { o.onSide(idx, k === 'left' ? -1 : 1); }
        else if (k === 'ok') choosePick();
        else if (k === 'cancel' && o.cancel !== false) { SFX.play('cancel'); close(-1); }
      }
    };
    if (o.bottom) box.style.top = Math.max(4, o.bottom - box.offsetHeight) + 'px';
    UI.push(h); upd();
  });
}
async function ask(who, text, std) {
  await say(who, text, std); keepDlg(); if (DLG.bust) DLG.bust.style.display = 'none';
  const r = await choose(['はい', 'いいえ'], { x: 154, bottom: 186, w: 76, cls: 'pick' });
  hideDlg(); return r === 0;
}
// 選択肢つきの問い（選択肢は {label, ...}）
async function pickOne(who, text, std, opts, o = {}) {
  // 選択肢は画面の真ん中に小窓で出す（顔絵や人物に重ならないよう、顔絵はいったん隠す）
  if (text) { await say(who, text, std); keepDlg(); }
  if (DLG.bust) DLG.bust.style.display = 'none';
  const w = o.w ?? 226;
  const r = await choose(opts, { x: Math.round((SW - w) / 2), bottom: text ? 186 : 170, w, cancel: false, cls: 'pick' });
  hideDlg(); return r;
}
function panel(html, x, y, w, h, cls = '') { const e = place(el('div', 'win ' + cls), x, y, w, h); e.innerHTML = html; return e; }
// 数量を選ぶ（左右で±10、上下で±1）
function qty(max, unit, label) {
  return new Promise(res => {
    let n = 1; const b = place(el('div', 'win qty'), 160, 120, 210);
    const upd = () => { b.innerHTML = `<div class="ttl">${esc(label)}</div><div class="q">◀ ${n} ▶</div><div class="rt">${unit(n)}</div><small>上下で±1　左右で±10</small>`; };
    const h = { onKey(k) { if (k === 'up' || k === 'right') n = Math.min(max, n + (k === 'right' ? 10 : 1)); if (k === 'down' || k === 'left') n = Math.max(1, n - (k === 'left' ? 10 : 1)); if (k === 'ok') { UI.pop(h); b.remove(); SFX.play('ok'); res(n); return; } if (k === 'cancel') { UI.pop(h); b.remove(); SFX.play('cancel'); res(0); return; } SFX.play('cur'); upd(); } };
    UI.push(h); upd();
  });
}

const fadeEl = $('#fade'), tintEl = $('#tint'), screenEl = $('#screen');
async function fadeOut(ms = 450) { fadeEl.style.transition = `opacity ${ms}ms`; fadeEl.style.opacity = 1; await sleep(ms); }
async function fadeIn(ms = 450) { fadeEl.style.transition = `opacity ${ms}ms`; fadeEl.style.opacity = 0; await sleep(ms); }
function shake(big) { screenEl.classList.remove('shake', 'shake2'); void screenEl.offsetWidth; screenEl.classList.add(big ? 'shake2' : 'shake'); clearTimeout(shake.t); shake.t = setTimeout(() => screenEl.classList.remove('shake', 'shake2'), 500); }
function flashScreen(col = '#fff') { screenEl.style.setProperty('--flash', col); screenEl.classList.remove('flash'); void screenEl.offsetWidth; screenEl.classList.add('flash'); clearTimeout(flashScreen.t); flashScreen.t = setTimeout(() => screenEl.classList.remove('flash'), 450); }
async function card(title, sub, ms = 4200) {
  const c = el('div', 'card'); c.innerHTML = `<div class="ct">${esc(title)}</div><div class="cs">${esc(sub || '').replace(/\n/g, '<br>')}</div>`;
  await sleep(30); c.classList.add('on'); await sleep(800); await waitOk(ms); c.classList.remove('on'); await sleep(600); c.remove();
}
// 一枚絵（文字が中央に浮かぶ演出）
async function still(lines, bgType) {
  const c = el('div', 'still'); if (bgType) { const cv2 = document.createElement('canvas'); cv2.width = 512; cv2.height = 384; cv2.getContext('2d').drawImage(bgImg(bgType), 0, 0); c.appendChild(cv2); }
  const t = el('div', 'st-t', c); await sleep(30); c.classList.add('on');
  for (const l of lines) { t.textContent = ''; t.classList.remove('in'); void t.offsetWidth; t.textContent = l; t.classList.add('in'); G.log.push({ n: '', t: l }); await sleep(600); await waitOk(OPT.auto ? T(3800) : 0); }
  c.classList.remove('on'); await sleep(700); c.remove();
}
function banner(text) { const b = place(el('div', 'win banner'), 8, 8); b.textContent = text; setTimeout(() => b.classList.add('out'), 1800); setTimeout(() => b.remove(), 2600); }
function setWeather(w) { G.weather = w; G.parts = G.parts.filter(p => p.kind === 'fire'); }
function emote(target, ch = '！') { G.emotes.push({ target, ch, t: 0 }); SFX.play(ch === '♪' ? 'learn' : 'cur'); }

// ---------- 仲間・能力値 ----------
function needExp(lv) { return 8 * lv + 5 * lv * lv; }
function expAt(lv) { let s = 0; for (let l = 1; l < lv; l++) s += needExp(l); return s; }
function stat(m, k) { const h = HEROES[m.id]; let v = h.base[k] + h.grow[k] * (m.lv - 1); for (const s in m.eq) { const it = ITEMS[m.eq[s]]; if (it && it[k]) v += it[k]; } return Math.floor(v); }
const mhp = m => stat(m, 'hp'), mki = m => stat(m, 'ki');
function skillsOf(m) { return HEROES[m.id].skills.filter(([sid, lv, f]) => m.lv >= lv && (!f || F(f))).map(s => s[0]).filter(s => !SKILLS[s].need || G.party.includes(SKILLS[s].need)); }
function nameOf(id) { const n = PEOPLE[id].name; return typeof n === 'function' ? n() : n; }
function mkMember(id, lv = 1) { const m = { id, name: nameOf(id), lv, exp: expAt(lv), eq: { ...HEROES[id].start }, hp: 0, ki: 0 }; m.hp = mhp(m); m.ki = mki(m); return m; }
function restAll() { for (const id of [...G.party, ...(G.waiting || [])]) { const m = G.mem[id]; m.hp = mhp(m); m.ki = mki(m); } }
function rebuildChain() { G.chain = G.party.slice(1).map(() => ({ x: G.px, y: G.py, ox: G.px, oy: G.py, dir: G.dir })); }
function partyLv() { return Math.round(G.party.reduce((s, id) => s + G.mem[id].lv, 0) / G.party.length); }
// 連れて行けるのは4人まで。ほかの仲間は「控え」として、道場・宿・茶屋・陣で入れ替えられる
const PARTY_MAX = 4;
const FREE_MATES = GAME.freeMates || [];
async function roster() {
  if (G.party.length + (G.waiting || []).length < 2) { await N('入れ替えられる仲間が まだいない。'); return; }
  let cur = 0;
  while (true) {
    const ids = [...G.party, ...G.waiting];
    const items = ids.map(id => ({ label: (G.party.includes(id) ? '連　' : '控　') + G.mem[id].name, right: `Lv${G.mem[id].lv}`, disabled: id === GAME.leader })).concat([{ label: 'おわる' }]);
    const i = await choose(items, { x: 92, y: 20, w: 200, start: cur, title: `連れて行く仲間（${G.party.length}/${PARTY_MAX}）` });
    if (i < 0 || i === ids.length) break; cur = i;
    const id = ids[i];
    if (id === GAME.leader) { await N(`${G.mem[id].name}は いつも一行の先頭だ。`); continue; }
    if (G.party.includes(id)) { G.party = G.party.filter(p => p !== id); G.waiting.push(id); SFX.play('cancel'); }
    else if (G.party.length >= PARTY_MAX) { await N(`連れて行けるのは ${PARTY_MAX}人までだ。\n先に だれかを控えに回そう。`); }
    else { G.waiting = G.waiting.filter(p => p !== id); G.party.push(id); SFX.play('join'); }
    rebuildChain();
  }
}
// 宿・茶屋・陣・家で：休む／仲間の入れ替え
async function lodge(who, price, msg, std) {
  const i = await choose([{ label: price ? `休む（${price}文）` : '休む' }, { label: '仲間を入れ替える' }, { label: 'やめる' }], { x: 230, y: 120, w: 146 });
  if (i === 0) { if (G.money < price) { await N('お金が足りない。'); return; } G.money -= price; await rest(); }
  if (i === 1) await roster();
}
async function join(id, lv, quiet) {
  if (!G.mem[id]) G.mem[id] = mkMember(id, lv || 1);
  else if (lv && G.mem[id].lv < lv) { const m = G.mem[id]; m.lv = lv; m.exp = expAt(lv); }
  const m = G.mem[id]; m.hp = mhp(m); m.ki = mki(m);
  G.waiting = (G.waiting || []).filter(p => p !== id);
  let benched = null;
  // 4人を超えたら、物語に関わらない仲間（お柚・権兵衛・玄斎・鉄之進）から先に控えへ回す
  if (!G.party.includes(id)) { G.party.push(id); if (G.party.length > PARTY_MAX) { const free = G.party.slice(1, -1).filter(p => FREE_MATES.includes(p)), out = FREE_MATES.includes(id) ? id : free.length ? free[free.length - 1] : G.party[PARTY_MAX - 1]; G.party = G.party.filter(p => p !== out); benched = out; G.waiting.push(benched); } }
  flag('in_' + id); flag(id); rebuildChain(); meet(id);
  if (!quiet) { SFX.play('join'); await N(`${m.name}が 仲間に加わった！`); }
  if (benched) await N(`${G.mem[benched].name}は 控えに回った。\n（道場・宿・茶屋・陣で、連れて行く仲間を入れ替えられる）`);
}
async function leave(id, why) {
  const m = G.mem[id]; if (!m || !(G.party.includes(id) || (G.waiting || []).includes(id))) return;
  G.party = G.party.filter(p => p !== id); G.waiting = (G.waiting || []).filter(p => p !== id); flag('in_' + id, false);
  for (const s of ['a', 'h', 'x']) if (m.eq[s] && !HEROES[id].start[s]) { addItem(m.eq[s]); delete m.eq[s]; }
  rebuildChain();
  await N(why || `${m.name}が 一行を離れた。`);
  // 空いた席には、控えの仲間が戻ってくる
  const back = (G.waiting || []).find(p => FREE_MATES.includes(p)) || (G.waiting || [])[0];
  if (back && G.party.length < PARTY_MAX) { G.waiting = G.waiting.filter(p => p !== back); G.party.push(back); rebuildChain(); await N(`${G.mem[back].name}が 控えから 一行に戻った。`); }
}
function addItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) + n; if (G.inv[id] <= 0) delete G.inv[id]; }
async function give(id, n = 1) { addItem(id, n); SFX.play('item'); await N(`${ITEMS[id].name}${n > 1 ? '×' + n : ''}を 手に入れた！`); }
async function getMoney(n) { G.money += n; SFX.play('coin'); await N(`${n}文を 受け取った！`); }
const hasItem = id => (G.inv[id] || 0) > 0;

// ---------- 図鑑・シリーズの記録 ----------
function meet(id) { if (DEX.people[id] && !G.dex.p[id]) { G.dex.p[id] = 1; toast(`人物図鑑：${DEX.people[id].name}`); seriesUpdate(); } }
function chron(id) { if (!G.dex.e[id]) { G.dex.e[id] = 1; const e = DEX.events.find(e => e.id === id); if (e) toast(`年表：${e.title}`); seriesUpdate(); } }
function visit(id) { if (id && DEX.places[id] && !G.dex.l[id]) { G.dex.l[id] = 1; toast(`ゆかりの地：${DEX.places[id].name}`); seriesUpdate(); } }
function linkedPrefs() {
  const out = {};
  const add = (pref, what) => { if (!pref || pref === GAME.pref) return; (out[pref] = out[pref] || []).push(what); };
  for (const id in G.dex.p) add(DEX.people[id].pref, DEX.people[id].name);
  for (const e of DEX.events) if (G.dex.e[e.id]) add(e.pref, e.title);
  for (const id in G.dex.l) add(DEX.places[id].pref, DEX.places[id].name);
  return out;
}
const SERIES_KEY = 'nihonkoku-series';
function seriesUpdate() {
  try {
    const s = JSON.parse(localStorage.getItem(SERIES_KEY) || '{}');
    s[GAME.pref] = { title: GAME.title, chapter: G.chapter, cleared: F('cleared'), endings: Object.keys(G.dex.end), people: Object.keys(G.dex.p).map(id => DEX.people[id].name), links: linkedPrefs(), t: Date.now() };
    localStorage.setItem(SERIES_KEY, JSON.stringify(s));
  } catch (e) { }
}

// ---------- マップ ----------
const DIRS = [[0, 1], [-1, 0], [1, 0], [0, -1]];
function dirOf(dx, dy) { return dy > 0 ? 0 : dx < 0 ? 1 : dx > 0 ? 2 : 3; }
function tileAt(x, y) { const m = G.map; if (x < 0 || y < 0 || x >= m.w || y >= m.h) return 'x'; return m.g[y][x]; }
function npcs() { return G.map.npcs.filter(n => !n.cond || n.cond()); }
function npcAt(x, y) { return npcs().find(n => n.x === x && n.y === y); }
function passable(x, y) { const t = tileAt(x, y); if (SOLID.has(t)) return false; if (G.map.block && G.map.block.has(x + ',' + y)) return false; if (t === 'D' && !houseAt(x, y)) return false; return !npcAt(x, y); }
function houseAt(x, y) { return (G.map.houses || []).find(h => h.x === x && h.y === y); }
function buildMap(id) {
  const def = MAPS[id] || ROOMS[id];
  _BLD = []; const m = def.build(); m.h = m.g.length; m.w = m.g[0].length; m.id = id;
  setupBuildings(m); setupEdges(m); m.props = m.props || [];
  m.block = new Set(); for (const p of m.props) if (p.img === 'torii') { m.block.add(p.x + ',' + (p.y + 2)); m.block.add((p.x + 2) + ',' + (p.y + 2)); }
  m.warps = m.warps || []; m.triggers = m.triggers || [];
  // ボス戦の入口：ボスの姿をマップに立たせ、話しかけるか近づくと「ボス戦です」と確かめてから始める
  for (const t of m.triggers) if (t.boss) {
    const spr = typeof t.boss === 'function' ? t.boss() : t.boss;
    (m.npcs = m.npcs || []).push({ x: t.bx ?? t.x + ((t.w || 1) >> 1), y: t.by ?? t.y, spr, cond: t.cond, mark: true, bossOf: t, talk: () => bossGate(t), dir: t.bdir ?? 0 });
  }
  m.npcs = (m.npcs || []).map(n => ({ ...n, dir0: n.dir || 0, dir: n.dir || 0 }));
  m.mini = null; return m;
}
// 建物の見た目（名前から種類と看板を決める）と、建物の下に敷く地面
const KAYA_MAPS = ['kirishima', 'enodake', 'aizu', 'kotsuki', 'tabaru', 'kumamoto'];
const SIGNS = [[/鍛冶/, '鍛冶', '#3a3a40'], [/武具/, '武具', '#5a2020'], [/道具/, '道具', '#2a3a6a'], [/寺田屋/, '寺田屋', '#6a2a2a'], [/宿/, '宿', '#7a2a2a'], [/茶屋/, '茶', '#3a5a2a'], [/蕎麦/, '蕎麦', '#4a3020']];
function setupBuildings(m) {
  m.blds = _BLD; m.bmask = null; if (!m.blds.length) return;
  m.bmask = new Array(m.w * m.h).fill(null);
  for (const b of m.blds) {
    const h = (m.houses || []).find(h => h.x === b.door && h.y === b.y + 2), nm = h ? h.name : '';
    if (!b.style) b.style = b.roofCh === 'Q' && m.id === 'tokyo' ? 'yoko' : /蔵/.test(nm) ? 'kura' : /寺/.test(nm) && !/寺田屋/.test(nm) ? 'tera' : /陣|本営/.test(nm) ? 'jin'
      : /屋|宿|町家/.test(nm) ? 'machiya' : (KAYA_MAPS.includes(m.id) || /村|民家/.test(nm)) ? 'kaya' : 'buke';
    const sg = SIGNS.find(s => s[0].test(nm)); if (sg) { b.sign = sg[1]; b.noren = sg[2]; }
    b.locked = m.g[b.y + 2][b.door] === 'L';
    let burnt = false; for (let j = b.y; j < b.y + 3; j++) for (let i = b.x; i < b.x + b.w; i++) if ('rf'.includes(m.g[j][i])) burnt = true;
    b.skip = burnt; if (burnt) continue;
    // 屋根の隅から見える地面は、家の裏（一つ上の段）と同じにする
    for (let i = b.x; i < b.x + b.w; i++) {
      const a = m.g[b.y - 1] && m.g[b.y - 1][i], ground = a && '.,;su'.includes(a) ? a : '.';
      for (let j = b.y; j < b.y + 3; j++) if (SOLID.has(m.g[j][i]) || m.g[j][i] === 'D') m.bmask[j * m.w + i] = ground;
    }
  }
}
function setupEdges(m) {
  m.vmap = new Uint8Array(m.w * m.h);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const i = y * m.w + x, ch = (m.bmask && m.bmask[i]) || m.g[y][x];
    m.vmap[i] = ((x * 7 + y * 13) % 5 === 0 ? 1 : (x * 3 + y * 5) % 7 === 0 ? 2 : 0) | (edgeBits(m, x, y, ch) << 4);
  }
}
function enterMap(id, x, y, dir = 0) {
  const m = buildMap(id);
  G.map = m; G.mapId = id; G.px = x; G.py = y; G.dir = dir; G.move = null; G.encSteps = 0;
  G.night = !!(m.night && m.night()); G.scene = 'map';
  for (const id in G.mem) G.mem[id].name = nameOf(id);
  if (m.noRide && G.ride) { G.ride = false; toast('馬を 降りた'); }
  setWeather(m.weather ? m.weather() : null);
  rebuildChain(); banner(m.name); visit(m.place);
  if (m.bgm) bgm(typeof m.bgm === 'function' ? m.bgm() : m.bgm);
}
function refreshMap() { const keep = { x: G.px, y: G.py, d: G.dir, chain: G.chain }; const m = buildMap(G.mapId); G.map = m; G.night = !!(m.night && m.night()); G.chain = keep.chain; }
async function warp(w) {
  SFX.play('door'); await fadeOut(300); enterMap(w.to, w.x2, w.y2, w.dir ?? G.dir); await fadeIn(300);
  if (G.map.onEnter) await G.map.onEnter();
}
async function bossGate(t, stepped) {
  SFX.play('warn'); emote('player', '！');
  const ok = await ask(null, t.warn || 'この先に 強敵が待ちかまえている。\n【ボス戦】準備はいいですか？');
  if (!ok) { if (stepped) await walk([3 - G.dir]); return; }
  await t.run();
}
async function warpTo(id, x, y, dir) { await fadeOut(); enterMap(id, x, y, dir); await fadeIn(); }
async function run(fn) {
  if (G.busy) return; G.busy = true;
  try { await fn(); }
  catch (e) { if (e === GAMEOVER) await gameOver(); else console.error(e); }
  hideDlg(); G.busy = false;
}
function onStep() {
  const m = G.map;
  const hs = houseAt(G.px, G.py);
  if (hs) { run(() => enterHouse(hs)); return; }
  const w = m.warps.find(w => w.x === G.px && w.y === G.py && (!w.cond || w.cond()));
  if (w) { run(() => warp(w)); return; }
  const tr = m.triggers.find(t => G.px >= t.x && G.px < t.x + (t.w || 1) && G.py >= t.y && G.py < t.y + (t.h || 1) && (!t.cond || t.cond()));
  if (tr) { run(tr.boss ? () => bossGate(tr, true) : tr.run); return; }
  const tbl = m.enc && m.enc();
  if (tbl && (m.encTiles || ['.']).includes(tileAt(G.px, G.py))) {
    G.encSteps++;
    if (G.encSteps > 6 && Math.random() < (G.ride ? 1 / 40 : 1 / 16)) {
      G.encSteps = 0;
      let g = pick(tbl);
      for (const rr of (m.rare || [])) if (Math.random() < rr.p) g = rr.g;
      run(() => battle(g, { bg: m.bbg || 'field', L: m.encL ? m.encL() : 0 }));
    }
  }
}
function mapUpdate() {
  for (const n of G.map.npcs) if (n.mv) { n.mv.t += n.mv.spd; if (n.mv.t >= 1) { const r = n.mv.res; n.mv = null; r(); } }
  if (G.move) {
    G.move.t += G.move.spd;
    if (G.move.t >= 1) { G.move = null; for (const f of G.chain) { f.ox = f.x; f.oy = f.y; } if (G.autoWalk) { const r = G.autoWalk; G.autoWalk = null; r(); } else onStep(); }
    return;
  }
  if (G.busy || UI.top()) return;
  const d = Input.dir(); if (d < 0) return;
  stepPlayer(d);
}
function stepPlayer(d, forced) {
  G.dir = d; const nx = G.px + DIRS[d][0], ny = G.py + DIRS[d][1];
  if (!forced && !passable(nx, ny)) return false;
  let prev = { x: G.px, y: G.py };
  for (const f of G.chain) { const old = { x: f.x, y: f.y }; f.ox = f.x; f.oy = f.y; if (prev.x !== f.x || prev.y !== f.y) f.dir = dirOf(prev.x - f.x, prev.y - f.y); f.x = prev.x; f.y = prev.y; prev = old; }
  const fast = G.ride ? .3 : (Input.held.run || Input.held.cancel) ? .2 : .1;
  G.move = { fx: G.px, fy: G.py, t: 0, spd: forced ? .1 : fast };
  G.px = nx; G.py = ny;
  if (G.ride && G.frame % 2 === 0) SFX.play('step');
  return true;
}
// 演出用：プレイヤー／人物を歩かせる
async function walk(dirs) { for (const d of dirs) { await new Promise(r => { G.autoWalk = r; stepPlayer(d, true); }); } }
function findNpc(spr) { return G.map.npcs.find(n => n.spr === spr && (!n.cond || n.cond())); }
async function walkNpc(spr, dirs, spd = .1) {
  const n = typeof spr === 'string' ? findNpc(spr) : spr; if (!n) return;
  for (const d of dirs) { n.dir = d; n.ox = n.x; n.oy = n.y; n.x += DIRS[d][0]; n.y += DIRS[d][1]; await new Promise(r => n.mv = { t: 0, spd, res: r }); n.ox = n.x; n.oy = n.y; }
}
function face(spr, d) { const n = findNpc(spr); if (n) n.dir = d; }
function mapKey(k) {
  if (k === 'menu') { run(openMenu); return; }
  if (k === 'map') { run(showFullMap); return; }
  if (G.move) return;
  if (k === 'ok') {
    const fx = G.px + DIRS[G.dir][0], fy = G.py + DIRS[G.dir][1];
    const n = npcAt(fx, fy);
    if (n) {
      run(async () => {
        if (!['pot', 'chest', 'boat', 'sign', 'horse'].includes(n.spr)) n.dir = 3 - G.dir;
        if (n.pot) await openPot(n); else if (n.talk) await n.talk(n);
        if (!n.keepDir) n.dir = n.dir0;
      });
      return;
    }
    const t = tileAt(fx, fy);
    if (t === 'L') run(() => openLock(fx, fy));
    else if (t === 'D') run(() => N('戸は 固く閉ざされている。'));
    else if (G.map.look && G.map.look[fx + ',' + fy]) run(G.map.look[fx + ',' + fy]);
  }
}
async function openPot(n) {
  const k = 'pot_' + n.pot;
  if (F(k)) { await N(n.spr === 'chest' ? '葛籠は 空っぽだ。' : `${GAME.pot || '甕'}は 空っぽだ。`); return; }
  flag(k); await N(n.spr === 'chest' ? '葛籠（つづら）を開けた……' : `${GAME.pot || '甕'}を のぞきこんだ……`);
  if (n.money) await getMoney(n.money); else await give(n.item, n.n || 1);
}
async function openLock(x, y) {
  const lk = (G.map.locks || []).find(l => l.x === x && l.y === y);
  if (!lk) { await N('錠がかかっている。'); return; }
  if (F(lk.flag)) return;
  if (!hasItem(lk.key)) { await N(`重い錠がかかっている。\n「${ITEMS[lk.key].name}」が要りそうだ。`); return; }
  SFX.play('door'); flag(lk.flag); await N(`${ITEMS[lk.key].name}で 錠を開けた！`); refreshMap();
}
// 家の中（どの家にも入れる。中の作りは自動生成）
async function enterHouse(h) {
  SFX.play('door'); await fadeOut(250);
  ROOMS['_room'] = { build: () => makeRoom(h) };
  G.ret = { map: G.mapId, x: h.x, y: h.y + 1, ride: G.ride };
  enterMap('_room', h.w ? Math.floor(h.w / 2) : 5, (h.h || 8) - 2, 3);
  await fadeIn(250);
  if (h.onEnter) await h.onEnter();
}
function makeRoom(h) {
  const W = h.w || 11, H = h.h || 8, g = Array.from({ length: H }, () => Array(W).fill(h.floor || 't'));
  for (let i = 0; i < W; i++) { g[0][i] = 'V'; g[1][i] = 'v'; }
  for (let j = 0; j < H; j++) { g[j][0] = 'V'; g[j][W - 1] = 'V'; }
  for (let i = 0; i < W; i++) g[H - 1][i] = 'V';
  const ex = Math.floor(W / 2); g[H - 1][ex] = 'e'; g[H - 2][ex] = 'w';
  if (h.kind !== 'shop' && h.kind !== 'kura') { g[3][Math.floor(W / 2)] = 'I'; }
  if (h.kind === 'kura') for (let j = 2; j < H - 1; j++) for (let i = 1; i < W - 1; i++) g[j][i] = 'w';
  g[1][2] = 'k'; if (W > 8) g[1][W - 3] = 'z';
  if (h.kind === 'shop') for (let i = 2; i < W - 2; i++) g[3][i] = 'k';
  return {
    name: h.name || '民家', g, bgm: h.bgm || (G.map && G.map.bgm) || 'town', noRide: true, place: h.place,
    warps: [{ x: ex, y: H - 1, to: G.ret.map, x2: G.ret.x, y2: G.ret.y, dir: 0 }],
    npcs: (h.npcs || []).concat((h.items || []).map(it => ({ spr: it.chest ? 'chest' : 'pot', pot: h.id + '_' + it.x + '_' + it.y, ...it }))),
    night: () => G.night, look: h.look,
  };
}
const ROOMS = {};

// ---------- 描画 ----------
function cam() {
  const m = G.map, t = G.move ? G.move.t : 1;
  const ppx = (G.move ? G.move.fx + (G.px - G.move.fx) * t : G.px) * TS, ppy = (G.move ? G.move.fy + (G.py - G.move.fy) * t : G.py) * TS;
  const mw = m.w * TS, mh = m.h * TS;
  const ev = v => Math.round(v / 2) * 2;  // ドット(2px)単位でスクロールする
  return { ppx, ppy, t, cx: ev(mw <= CW ? (mw - CW) / 2 : clamp(ppx - CW / 2 + 16, 0, mw - CW)), cy: ev(mh <= CH ? (mh - CH) / 2 : clamp(ppy - CH / 2 + 16, 0, mh - CH)) };
}
function drawMap() {
  const m = G.map, { ppx, ppy, t, cx, cy } = cam();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CW, CH);
  const af = (G.frame >> 4) & 3, fires = [], trees = [];
  for (let y = Math.floor(cy / TS); y <= Math.floor((cy + CH) / TS) + 1; y++) for (let x = Math.floor(cx / TS); x <= Math.floor((cx + CW) / TS); x++) {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
    let ch = (m.bmask && m.bmask[y * m.w + x]) || m.g[y][x];
    if (ch === 'T' || ch === 'P' || ch === 'q') { trees.push([x, y, ch === 'q' ? 'T' : ch]); ch = ch === 'P' ? 's' : '.'; }
    ctx.drawImage(tileImg(ch, ANIM.has(ch) ? (ch === '~' || ch === 'o' ? af : af & 1) : 0, m.vmap[y * m.w + x]), x * TS - cx, y * TS - cy);
    if (ch === 'f') fires.push([x * TS - cx, y * TS - cy]);
    if (ch === 'f' && Math.random() < .35) G.parts.push({ kind: 'fire', x: x * TS + 4 + Math.random() * 24, y: y * TS + 26, vx: (Math.random() - .5) * .3, vy: -.6 - Math.random() * .8, life: 30 + Math.random() * 25, t: 0 });
    if (ch === 'f' && Math.random() < .04) G.parts.push({ kind: 'smoke', x: x * TS + 16, y: y * TS + 4, vx: .2 + Math.random() * .3, vy: -.4, life: 120, t: 0 });
    if (ch === 'O' && Math.random() < .03) G.parts.push({ kind: 'steam', x: x * TS + 8 + Math.random() * 16, y: y * TS + 10, vx: .1, vy: -.3, life: 90, t: 0 });
  }
  const wf = G.move ? ((G.frame >> 3) & 1) + 1 : 0, nf = ((G.frame >> 5) & 1) ? 1 : 0, list = [];
  for (const n of npcs()) {
    let nx = n.x, ny = n.y; if (n.mv) { nx = n.ox + (n.x - n.ox) * n.mv.t; ny = n.oy + (n.y - n.oy) * n.mv.t; }
    const still = ['pot', 'chest', 'boat', 'sign'].includes(n.spr);
    list.push({ x: nx * TS, y: ny * TS, img: charImg(n.spr, n.dir || 0, still ? 0 : n.mv ? ((G.frame >> 3) & 1) + 1 : n.idle === false ? 0 : nf) });
  }
  for (const [tx, ty, tc] of trees) list.push({ x: tx * TS - 4, y: ty * TS - 28, img: treeImg(tc, (tx * 5 + ty * 3) % 6), sy: ty * TS - .2, raw: 1 });
  for (const p of m.props) {
    const im = p.img === 'sakurajima' ? sakurajimaImg() : p.img === 'torii' ? toriiImg() : p.img === 'kaimon' ? kaimonImg() : p.img === 'onsen' ? onsenImg(p.w, p.h) : p.icon ? iconImg(p.icon) : null; if (!im) continue;
    if (p.img === 'onsen') { list.push({ x: p.x * TS - 14, y: p.y * TS - 16, img: im, sy: (p.y + p.h) * TS - 8, raw: 1 }); continue; }
    if (p.icon) { list.push({ x: p.x * TS - 8, y: p.y * TS - 16, img: im, sy: p.y * TS + 31, raw: 1 }); continue; }
    list.push({ x: p.x * TS, y: p.y * TS, img: im, sy: p.y * TS + im.height - (p.img === 'torii' ? 8 : 40), raw: 1 });
    if (p.smoke && Math.random() < .1) G.parts.push({ kind: 'vsmoke', x: p.x * TS + p.smoke[0] + Math.random() * 4, y: p.y * TS + p.smoke[1], vx: .2 + Math.random() * .2, vy: -.3 - Math.random() * .15, life: 220, t: 0 });
  }
  for (const b of m.blds || []) { if (b.skip || (b.x + b.w) * TS < cx - 16 || b.x * TS > cx + CW + 16 || (b.y + 3) * TS < cy || (b.y - 1) * TS > cy + CH) continue; const im = bldImg(b); list.push({ x: b.x * TS + im.ox, y: b.y * TS + im.oy, img: im.c, sy: (b.y + 2) * TS - .5, raw: 1 }); }
  // 馬に乗っているときは、後ろの仲間も馬に乗ってついてくる（犬のツンは横を走る）
  G.chain.forEach((f, i) => {
    const id = G.party[i + 1], fx = (f.ox + (f.x - f.ox) * t) * TS, fy = (f.oy + (f.y - f.oy) * t) * TS, rides = G.ride && !HEROES[id].dog;
    if (rides) list.push({ x: fx - 8, y: fy - .12, img: horseImg(f.dir, G.move ? ((G.frame >> 2) + i) & 1 : 0), horse: 1 });
    list.push({ x: fx, y: fy - .1 + (rides ? -14 : 0), img: charImg(id, f.dir, rides ? 0 : G.move ? wf : 0), sy: rides ? fy - .08 : null, crop: rides ? 40 : 0 });
  });
  if (G.ride) list.push({ x: ppx - 8, y: ppy - .05, img: horseImg(G.dir, G.move ? (G.frame >> 2) & 1 : 0), w: 48, h: 64, horse: 1 });
  list.push({ x: ppx, y: ppy + (G.ride ? -14 : 0), img: charImg(G.party[0], G.dir, G.ride ? 0 : wf), sy: G.ride ? ppy : null, crop: G.ride ? 40 : 0 });
  list.sort((a, b) => (a.sy ?? a.y) - (b.sy ?? b.y));
  // 馬に乗った人は腰から上だけ描き、馬の背にまたがって見えるようにする（crop＝上から何pxまで描くか）
  for (const s of list) { const dx = Math.round((s.x - cx) / 2) * 2, dy = Math.round((s.y - cy - (s.raw ? 0 : s.horse ? 32 : 24)) / 2) * 2; if (s.crop) ctx.drawImage(s.img, 0, 0, s.img.width, s.crop, dx, dy, s.img.width, s.crop); else ctx.drawImage(s.img, dx, dy); }
  for (const p of m.props) if (p.label) {
    const lx = p.x * TS + 16 - cx, ly = p.y * TS + 44 - cy; if (lx < -60 || lx > CW + 60 || ly < -20 || ly > CH + 20) continue;
    ctx.font = '13px DotGothic16, sans-serif'; ctx.textAlign = 'center'; const w = ctx.measureText(p.label).width + 10;
    ctx.fillStyle = 'rgba(10,14,36,.78)'; ctx.fillRect(Math.round(lx - w / 2), ly - 11, Math.round(w), 16); ctx.fillStyle = '#ffe2a0'; ctx.fillText(p.label, lx, ly + 2);
  }
  if (fires.length) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [fx0, fy0] of fires) { const g = ctx.createRadialGradient(fx0 + 16, fy0 + 16, 4, fx0 + 16, fy0 + 16, 60); g.addColorStop(0, `rgba(255,140,40,${.28 + Math.random() * .08})`); g.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = g; ctx.fillRect(fx0 - 44, fy0 - 44, 120, 120); }
    ctx.restore();
    for (const [fx0, fy0] of fires) for (let k = 0; k < 5; k++) {
      const h = 14 + Math.random() * 18 + Math.sin(G.frame / 5 + k + fx0) * 4, bx = fx0 + 2 + k * 6;
      ctx.fillStyle = '#d0381a'; ctx.fillRect(bx, fy0 + 30 - h, 6, h); ctx.fillRect(bx + 1, fy0 + 26 - h, 4, 4);
      ctx.fillStyle = '#ff8a20'; ctx.fillRect(bx + 1, fy0 + 30 - h * .7, 4, h * .7);
      ctx.fillStyle = '#ffe070'; ctx.fillRect(bx + 2, fy0 + 30 - h * .35, 2, h * .35);
    }
  }
  drawParticles(cx, cy);
  for (const e of G.emotes) {
    e.t++; let ex = ppx, ey = ppy;
    if (e.target !== 'player') { const n = typeof e.target === 'string' ? findNpc(e.target) : e.target; if (n) { ex = n.x * TS; ey = n.y * TS; } }
    const bob = Math.min(6, e.t);
    ctx.fillStyle = '#fff'; ctx.fillRect(ex - cx + 6, ey - cy - 30 - bob, 20, 18); ctx.fillStyle = '#1c1219'; ctx.strokeStyle = '#1c1219'; ctx.strokeRect(ex - cx + 6.5, ey - cy - 29.5 - bob, 19, 17);
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = e.ch === '！' ? '#c02020' : '#1c1219'; ctx.fillText(e.ch, ex - cx + 16, ey - cy - 15 - bob);
  }
  G.emotes = G.emotes.filter(e => e.t < 70);
}
function drawParticles(cx, cy) {
  const w = G.weather;
  if (w === 'ash' && Math.random() < .5) G.parts.push({ kind: 'ash', x: cx + Math.random() * CW, y: cy - 4, vx: .3 + Math.random() * .3, vy: .5 + Math.random() * .5, life: 600, t: 0 });
  if (w === 'rain') for (let i = 0; i < 4; i++) G.parts.push({ kind: 'rain', x: cx + Math.random() * (CW + 100), y: cy - 10, vx: -2, vy: 9, life: 60, t: 0 });
  if (w === 'embers' && Math.random() < .6) G.parts.push({ kind: 'fire', x: cx + Math.random() * CW, y: cy + CH, vx: (Math.random() - .3) * .6, vy: -1 - Math.random(), life: 300, t: 0 });
  if (w === 'petals' && Math.random() < .2) G.parts.push({ kind: 'petal', x: cx + Math.random() * CW, y: cy - 4, vx: .6, vy: .6, life: 600, t: 0 });
  if (w === 'fireflies' && Math.random() < .05) G.parts.push({ kind: 'fly', x: cx + Math.random() * CW, y: cy + Math.random() * CH, vx: 0, vy: 0, life: 200, t: 0 });
  if (w === 'snow' && Math.random() < .5) G.parts.push({ kind: 'snow', x: cx + Math.random() * CW, y: cy - 4, vx: .2, vy: .7, life: 600, t: 0 });
  const k = OPT.speed > 1 ? 1 : 1;
  for (const p of G.parts) {
    p.t += k; p.x += p.vx; p.y += p.vy;
    if (p.kind === 'fly') { p.x += Math.sin(p.t / 20) * .5; p.y += Math.cos(p.t / 25) * .4; }
    if (p.kind === 'vsmoke') p.x += Math.sin(p.t / 18 + p.y / 30) * .35;
    const x = p.x - cx, y = p.y - cy, a = 1 - p.t / p.life;
    switch (p.kind) {
      case 'fire': ctx.fillStyle = a > .6 ? '#fff0a0' : a > .3 ? '#ff9a30' : '#d0401a'; ctx.fillRect(x, y, a > .5 ? 3 : 2, a > .5 ? 3 : 2); break;
      case 'smoke': ctx.globalAlpha = a * .35; ctx.fillStyle = '#4a4040'; ctx.beginPath(); ctx.arc(x, y, 6 + p.t / 8, 0, 7); ctx.fill(); ctx.globalAlpha = 1; break;
      case 'vsmoke': ctx.globalAlpha = a * .55; ctx.fillStyle = p.t < 20 ? '#8a7a70' : '#d8d4cc'; ctx.beginPath(); ctx.arc(x, y, 4 + p.t / 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1; break;
      case 'steam': ctx.globalAlpha = a * .5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3 + p.t / 15, 0, 7); ctx.fill(); ctx.globalAlpha = 1; break;
      case 'ash': ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x, y, 2, 2); break;
      case 'rain': ctx.strokeStyle = 'rgba(190,205,230,.6)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 9); ctx.stroke(); break;
      case 'petal': ctx.fillStyle = '#f8c8d8'; ctx.fillRect(x + Math.sin(p.t / 9) * 3, y, 3, 2); break;
      case 'fly': ctx.globalAlpha = .5 + Math.sin(p.t / 6) * .5; ctx.fillStyle = '#e8ff80'; ctx.fillRect(x, y, 2, 2); ctx.globalAlpha = 1; break;
      case 'snow': ctx.fillStyle = '#fff'; ctx.fillRect(x + Math.sin(p.t / 20) * 2, y, 2, 2); break;
    }
  }
  G.parts = G.parts.filter(p => p.t < p.life && p.y < cy + CH + 20 && p.y > cy - 80);
  if (G.parts.length > 600) G.parts.splice(0, G.parts.length - 600);
}
// ミニマップ
const miniCv = $('#mini'), miniCtx = miniCv ? miniCv.getContext('2d') : null;
function drawMini() {
  if (!miniCv) return;
  const show = OPT.mini && G.scene === 'map' && G.map && !G.map.noRide && !UI.top();
  miniCv.style.display = show ? 'block' : 'none'; if (!show) return;
  const m = G.map, s = Math.max(1, Math.min(3, Math.floor(96 / Math.max(m.w, m.h))));
  if (!m.mini) { const c = mk(m.w * s, m.h * s), x = c.getContext('2d'); for (let y = 0; y < m.h; y++) for (let i = 0; i < m.w; i++) P(x, i * s, y * s, s, s, TILE_COLOR[m.g[y][i]] || '#000'); m.mini = c; miniCv.width = m.w * s; miniCv.height = m.h * s; }
  miniCtx.drawImage(m.mini, 0, 0);
  for (const n of npcs()) if (n.mark) P(miniCtx, n.x * s - 1, n.y * s - 1, s + 2, s + 2, '#ffd040');
  if ((G.frame >> 4) % 2) P(miniCtx, G.px * s - 1, G.py * s - 1, s + 2, s + 2, '#ff2a2a');
}
async function showFullMap() {
  const m = G.map; if (!m) return;
  const s = Math.max(2, Math.min(8, Math.floor(Math.min(360 / m.w, 240 / m.h)))), c = mk(m.w * s, m.h * s), x = c.getContext('2d');
  for (let y = 0; y < m.h; y++) for (let i = 0; i < m.w; i++) P(x, i * s, y * s, s, s, TILE_COLOR[m.g[y][i]] || '#000');
  for (const n of npcs()) if (n.mark) P(x, n.x * s, n.y * s, s, s, '#ffd040');
  P(x, G.px * s - 1, G.py * s - 1, s + 2, s + 2, '#ff2a2a');
  const p = panel(`<div class="ttl">${esc(m.name)}</div>`, 8, 8, 368, 272, 'fullmap'); p.appendChild(c);
  // 地名は、実際に表示された地図の位置と大きさから、そのマスの真ん中に置く
  const kx = c.offsetWidth / c.width || 1, ky = c.offsetHeight / c.height || 1;
  for (const l of (m.labels || [])) { const t = el('div', 'lbl', p); t.textContent = l[2]; t.style.left = (c.offsetLeft + (l[0] + .5) * s * kx) + 'px'; t.style.top = (c.offsetTop + (l[1] + .5) * s * ky) + 'px'; }
  const g = el('div', 'goal', p); g.textContent = '目的：' + (typeof GOAL === 'function' ? GOAL() : '');
  await waitOk(); p.remove();
}
function draw() {
  ctx.imageSmoothingEnabled = false;
  if (G.scene === 'map' && G.map) drawMap();
  else if (G.scene === 'battle' && G.B) drawBattle();
  else if (G.scene === 'kassen' && G.K) drawKassen();
  else if (G.scene === 'title') { ctx.drawImage(bgImg(GAME.titleBg || 'title'), 0, 0); drawPlume(ctx, GAME.titleBg || 'title', G.frame); drawParticles(0, 0); }
  tintEl.className = G.scene === 'map' ? (G.weather === 'embers' ? 'fire' : G.weather === 'rain' ? 'rain' : G.night ? 'night' : '') : '';
  drawMini();
}
function loop() {
  G.frame++;
  if (Input.dirs.length && UI.top() && G.frame > Input.rep) { Input.q.push(Input.dirs[Input.dirs.length - 1]); Input.rep = G.frame + 7; }
  let k;
  while ((k = Input.q.shift()) !== undefined) {
    if (k === 'auto') { OPT.auto = !OPT.auto; saveOpt(); toast(OPT.auto ? 'オート ON' : 'オート OFF'); continue; }
    if (k === 'speed') { OPT.speed = OPT.speed === 1 ? 3 : OPT.speed === 3 ? 5 : 1; saveOpt(); toast(`速さ ×${OPT.speed}`); continue; }
    if (k === 'log') { if (!G.logOpen) showLog(); continue; }
    if (k === 'set') { if (!G.setOpen && (G.scene === 'map' || G.scene === 'title') && !G.busy) run(settings); continue; }
    const h = UI.top();
    if (h) h.onKey(k); else if (G.scene === 'map' && !G.busy) mapKey(k);
  }
  if (G.scene === 'map' && G.map) mapUpdate();
  if (G.frame % 60 === 0 && G.scene !== 'title') G.playTime++;
  draw();
  requestAnimationFrame(loop);
}
function updateHud() { const s = $('[data-k="speed"]'), a = $('[data-k="auto"]'); if (s) s.textContent = '×' + OPT.speed; if (a) a.classList.toggle('lit', OPT.auto); }

// ---------- ログ・設定 ----------
function showLog() {
  G.logOpen = true;
  const p = panel(`<div class="ttl">会話の記録（上下で読む・Bで閉じる）</div><div class="logs">${G.log.slice(-150).map(l => `<div class="lg">${l.n ? `<b>${esc(l.n)}</b>` : ''}<span>${esc(l.t).replace(/\n/g, '')}</span></div>`).join('')}</div>`, 8, 8, 368, 272, 'logp');
  const box = p.querySelector('.logs'); box.scrollTop = box.scrollHeight;
  const h = { onKey(k) { if (k === 'up') box.scrollTop -= 40; else if (k === 'down') box.scrollTop += 40; else if (k === 'cancel' || k === 'ok' || k === 'log') { UI.pop(h); p.remove(); G.logOpen = false; } } };
  UI.push(h);
}
async function settings() {
  G.setOpen = true;
  const LANG = { kago: GAME.dialect, std: '標準語', both: GAME.dialect + '＋訳' }, TXT = ['ゆっくり', 'ふつう', 'はやい', '一瞬'];
  let i = 0;
  while (true) {
    const items = [
      { label: '言葉', right: LANG[OPT.lang] }, { label: '文字の速さ', right: TXT[OPT.text] }, { label: '会話・戦闘の速さ', right: '×' + OPT.speed },
      { label: 'オート送り', right: OPT.auto ? 'ON' : 'OFF' }, { label: 'BGM', right: Math.round(OPT.bgm * 10) }, { label: '効果音', right: Math.round(OPT.sfx * 10) }, { label: 'ミニマップ', right: OPT.mini ? '表示' : '非表示' }, { label: '画面の向き', right: OPT.rot ? '横向きで表示' : '端末に合わせる' }, { label: 'パッドの真ん中でA', right: OPT.padA !== false ? 'ON' : 'OFF' }, { label: '閉じる' },
    ];
    const cyc = (k, list) => { const j = list.indexOf(OPT[k]); OPT[k] = list[(j + 1) % list.length]; };
    i = await choose(items, { x: 96, y: 40, w: 200, start: i, title: '設定' });
    if (i < 0 || i === 9) break;
    if (i === 0) cyc('lang', ['kago', 'std', 'both']);
    if (i === 1) OPT.text = (OPT.text + 1) % 4;
    if (i === 2) cyc('speed', [1, 3, 5]);
    if (i === 3) OPT.auto = !OPT.auto;
    if (i === 4) OPT.bgm = Math.round(((OPT.bgm * 10 + 1) % 11)) / 10;
    if (i === 5) { OPT.sfx = Math.round(((OPT.sfx * 10 + 1) % 11)) / 10; }
    if (i === 6) OPT.mini = !OPT.mini;
    if (i === 7) { OPT.rot = !OPT.rot; setTimeout(fit, 50); }
    if (i === 8) OPT.padA = OPT.padA === false;
    saveOpt(); if (i === 5) SFX.play('ok');
  }
  G.setOpen = false;
}

// ---------- メニュー ----------
// つよさ・図鑑の顔：主要人物は会話と同じ高画質の顔絵を縮めて使う（ツンも犬の顔になる）
function faceImg(id) {
  const c = mk(64, 64), x = c.getContext('2d');
  if (isMain(id)) { x.imageSmoothingEnabled = true; x.fillStyle = '#1c2340'; x.fillRect(0, 0, 64, 64); x.drawImage(hiPortrait(id), 45, 20, 210, 210, 0, 0, 64, 64); }
  else { const p = infoOf(id); if (p && p.por) x.drawImage(portraitImg(p.por), 0, 0); }
  return c;
}
function memberLine(m) { return `HP ${m.hp}/${mhp(m)}　気 ${m.ki}/${mki(m)}`; }
async function openMenu() {
  let last = 0;
  while (true) {
    const info = panel(`<div class="money">${G.money}<small>文</small></div><div class="ptime">プレイ時間<br>${fmtTime(G.playTime)}</div>`, 8, 196, 96);
    const items = ['つよさ', 'どうぐ', 'そうび', 'わざ', 'ずかん', 'ならび', 'きろく'].concat(G.ride ? ['馬を降りる'] : []);
    const i = await choose(items, { x: 8, y: 8, w: 96, start: Math.min(last, items.length - 1) });
    info.remove(); if (i < 0) return; last = i;
    if (i === 7) { G.ride = false; SFX.play('horse'); await N(G.party.length > 1 ? 'みんな 馬を降りた。' : '馬を降りた。'); return; }
    if (i === 0) await showStatus();
    if (i === 1) await itemMenu();
    if (i === 2) await equipMenu();
    if (i === 3) await skillMenu();
    if (i === 4) await dexMenu();
    if (i === 5) await orderMenu();
    if (i === 6) await saveMenu();
  }
}
async function showStatus() {
  let page = 0;
  while (true) {
    const id = G.party[page], m = G.mem[id], eq = ['w', 'a', 'h', 'x'].map(s => `<div>${SLOT_NAMES[s]}：${m.eq[s] ? ITEMS[m.eq[s]].name : '―'}</div>`).join('');
    const heart = GAME.heart ? GAME.heart(id) : id === 'shinpachi' ? `<div class="heart">新八の心　<span class="jo">情 ${'●'.repeat(Math.min(8, pts('jo')))}</span>　<span class="ri">理 ${'●'.repeat(Math.min(8, pts('ri')))}</span>${F('in_senkichi') || pts('bond') ? `　仙吉との絆 ${'♥'.repeat(Math.min(6, pts('bond')))}` : ''}</div>` : '';
    const p = panel(`<div class="st2"><canvas width="64" height="64"></canvas><div><b class="big">${esc(m.name)}</b>　Lv ${m.lv}　${elTag(HEROES[id].el)}<br>${memberLine(m)}<br>攻 ${stat(m, 'atk')}　守 ${stat(m, 'def')}　速 ${stat(m, 'spd')}<br><small>次のLvまで ${expAt(m.lv + 1) - m.exp}</small></div></div><div class="eqs">${eq}</div><div class="sks">わざ：${skillsOf(m).map(s => SKILLS[s].name).join('、') || 'なし'}</div>${heart}<div class="pg">◀ ${page + 1} / ${G.party.length} ▶</div>`, 8, 8, 368, 272);
    p.querySelector('canvas').getContext('2d').drawImage(faceImg(id), 0, 0);
    const k = await new Promise(res => { const h = { tap: true, onKey(k) { if (['left', 'right', 'up', 'down', 'ok', 'cancel'].includes(k)) { UI.pop(h); res(k); } } }; UI.push(h); });
    p.remove();
    if (k === 'cancel' || k === 'ok') return;
    page = (page + (k === 'left' || k === 'up' ? -1 : 1) + G.party.length) % G.party.length; SFX.play('cur');
  }
}
async function orderMenu() {
  if (G.party.length < 2) { await N('並び替える仲間がいない。'); return; }
  const a = await pickMember({ right: () => '先頭にする' }); if (!a) return;
  G.party = [a, ...G.party.filter(x => x !== a)]; rebuildChain(); await N(`${G.mem[a].name}が 先頭になった。`);
}
const kiItem = id => !!(ITEMS[id].ki && !ITEMS[id].heal);
function invList(filter) { return Object.keys(G.inv).filter(id => G.inv[id] > 0 && ITEMS[id] && filter(ITEMS[id])); }
function descBox() { return place(el('div', 'win desc'), 8, 236, 368, 44); }
async function pickMember(o = {}) {
  const ids = o.ids || G.party;
  const i = await choose(ids.map(id => ({ label: G.mem[id].name, right: o.right ? o.right(G.mem[id]) : `HP ${G.mem[id].hp}/${mhp(G.mem[id])}` })), { x: o.x ?? 116, y: o.y ?? 8, w: o.w ?? 220, start: o.start || 0 });
  return i < 0 ? null : ids[i];
}
async function itemMenu() {
  let last = 0;
  while (true) {
    const ids = invList(() => true).sort((a, b) => (ITEMS[a].type === 'use' ? 0 : ITEMS[a].type === 'key' ? 2 : 1) - (ITEMS[b].type === 'use' ? 0 : ITEMS[b].type === 'key' ? 2 : 1));
    if (!ids.length) { await N('何も持っていない。'); return; }
    const d = descBox();
    const i = await choose(ids.map(id => ({ label: ITEMS[id].name, right: ITEMS[id].type === 'key' ? '大事' : '×' + G.inv[id], disabled: ITEMS[id].type !== 'use' || ITEMS[id].battleOnly })), { x: 116, y: 8, w: 220, maxH: 220, start: last, onMove: k => d.textContent = ITEMS[ids[k]].desc || '' });
    d.remove(); if (i < 0) return; last = i;
    const id = ids[i];
    if (ITEMS[id].healAll || ITEMS[id].kiAll) { await useItem(id, G.party[0], false); continue; }
    const t = await pickMember({ x: 200, y: 40, w: 176, right: kiItem(id) ? (m => `気 ${m.ki}/${mki(m)}`) : null });
    if (t) await useItem(id, t, false);
  }
}
async function useItem(id, tid, inBattle) {
  const it = ITEMS[id], m = G.mem[tid];
  if (!G.inv[id]) { await msg(`しかし ${it.name}は もう なかった！`); return; }
  if (it.revive) {
    if (m.hp > 0) { await msg(`${m.name}は 倒れていない。`); return; }
    addItem(id, -1); m.hp = Math.max(1, Math.floor(mhp(m) * it.revive)); SFX.play('heal'); fxMember(tid, 'heal'); await msg(`${it.name}を飲ませた！ ${m.name}が 起き上がった！`); return;
  }
  if (it.healAll || it.kiAll) { addItem(id, -1); for (const p of G.party) { const x = G.mem[p]; if (x.hp > 0) { if (it.healAll) x.hp = Math.min(mhp(x), x.hp + it.healAll); if (it.kiAll) x.ki = Math.min(mki(x), x.ki + it.kiAll); fxMember(p, 'heal'); } } SFX.play('heal'); if (inBattle) updateBStat(); await msg(`${it.name}を みんなで分けた！ 全員が元気になった！`); return; }
  if (m.hp <= 0) { await msg(`${m.name}は 倒れている……。`); return; }
  addItem(id, -1);
  if (it.heal) { const v = Math.min(it.heal, mhp(m) - m.hp); m.hp += v; SFX.play('heal'); fxMember(tid, 'heal'); await msg(`${m.name}は ${it.name}を食べた！ HPが ${v} 回復した！`); }
  if (it.ki) { const v = Math.min(it.ki, mki(m) - m.ki); m.ki += v; SFX.play('heal'); await msg(`${m.name}は ${it.name}を口にした！ 気が ${v} 回復した！`); }
  if (inBattle) updateBStat();
}
async function msg(t) { if (G.B) await bmsg(t); else await N(t); }
// 武器は得意な種類だけ。ツン（犬）は着物や笠は着られず、犬用の防具と飾りだけ
function canEquip(m, it) { const h = HEROES[m.id]; if (it.type === 'w') return h.kinds.includes(it.kind); if (h.dog) return it.type === 'x' || !!it.dog; return !it.dog; }
function fixEquips() { for (const id in G.mem) { const m = G.mem[id]; for (const s in m.eq) { const it = ITEMS[m.eq[s]]; if (it && !canEquip(m, it)) { addItem(m.eq[s]); delete m.eq[s]; } } } }
function equipDiff(m, it) { const k = it.type === 'w' ? 'atk' : 'def'; const cur = m.eq[it.type] ? (ITEMS[m.eq[it.type]][k] || 0) : 0; const d = (it[k] || 0) - cur; return `${k === 'atk' ? '攻' : '守'}${d >= 0 ? '+' : ''}${d}`; }
function doEquip(m, id) { const it = ITEMS[id]; if (m.eq[it.type]) addItem(m.eq[it.type]); m.eq[it.type] = id; addItem(id, -1); m.hp = Math.min(m.hp, mhp(m)); m.ki = Math.min(m.ki, mki(m)); }
async function equipMenu() {
  let who = 0;
  while (true) {
    const tid = await pickMember({ right: m => `攻${stat(m, 'atk')} 守${stat(m, 'def')}`, start: who }); if (!tid) return;
    who = G.party.indexOf(tid);
    const m = G.mem[tid]; let si = 0;
    while (true) {
      const slots = ['w', 'a', 'h', 'x'];
      const s = await choose(slots.map(k => ({ label: SLOT_NAMES[k], right: m.eq[k] ? ITEMS[m.eq[k]].name : '―' })), { x: 116, y: 8, w: 250, title: `${m.name}の装備（攻${stat(m, 'atk')} 守${stat(m, 'def')} 速${stat(m, 'spd')}）`, start: si });
      if (s < 0) break;
      si = s;
      const slot = slots[s], ids = invList(it => it.type === slot && canEquip(m, it));
      const opts = ids.map(id => ({ label: ITEMS[id].name, right: equipDiff(m, ITEMS[id]) }));
      if (m.eq[slot]) opts.push({ label: '外す' });
      if (!opts.length) { await N('装備できる物を 持っていない。'); continue; }
      const d = descBox();
      const i = await choose(opts, { x: 136, y: 40, w: 230, maxH: 190, onMove: k => d.textContent = ids[k] ? ITEMS[ids[k]].desc : '' });
      d.remove(); if (i < 0) continue;
      if (i >= ids.length) { addItem(m.eq[slot]); delete m.eq[slot]; m.hp = Math.min(m.hp, mhp(m)); }
      else doEquip(m, ids[i]);
      SFX.play('ok');
    }
  }
}
async function skillMenu() {
  const tid = await pickMember({ right: m => `気 ${m.ki}/${mki(m)}` }); if (!tid) return;
  const m = G.mem[tid], sks = skillsOf(m);
  if (!sks.length) { await N(`${m.name}は まだ わざを覚えていない。`); return; }
  const d = descBox();
  const i = await choose(sks.map(k => ({ label: (skillEl(SKILLS[k]) ? '〔' + skillEl(SKILLS[k]) + '〕' : '') + SKILLS[k].name, right: '気' + SKILLS[k].ki, disabled: SKILLS[k].type !== 'heal' || m.ki < SKILLS[k].ki })), { x: 116, y: 8, w: 236, maxH: 222, onMove: k => d.textContent = skillDesc(sks[k]) });
  d.remove(); if (i < 0) return;
  const sk = SKILLS[sks[i]];
  const targets = sk.target === 'allies' ? G.party : [await pickMember({ x: 200, y: 72, w: 176 })];
  if (!targets[0]) return;
  m.ki -= sk.ki;
  for (const t of targets) { const x = G.mem[t]; if (x.hp <= 0) continue; const v = Math.min(mhp(x) - x.hp, Math.round(sk.pow + m.lv * 3)); x.hp += v; await N(`${x.name}の HPが ${v} 回復した！`); }
  SFX.play('heal');
}
// 五行の相性の図（図鑑から見られる）。矢印の先が「剋たれる」側
async function gogyoChart() {
  const c = mk(220, 200), x = c.getContext('2d'), E = ['木', '火', '土', '金', '水'], pos = E.map((e, i) => [110 + Math.sin(i / 5 * Math.PI * 2) * 76, 104 - Math.cos(i / 5 * Math.PI * 2) * 76]);
  x.strokeStyle = '#ff8a6a'; x.fillStyle = '#ff8a6a'; x.lineWidth = 2;
  E.forEach((e, i) => { const j = E.indexOf(KOKU[e]), [ax, ay] = pos[i], [bx, by] = pos[j], d = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / d, uy = (by - ay) / d, sx = ax + ux * 22, sy = ay + uy * 22, ex = bx - ux * 24, ey = by - uy * 24;
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke(); x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex - ux * 9 - uy * 5, ey - uy * 9 + ux * 5); x.lineTo(ex - ux * 9 + uy * 5, ey - uy * 9 - ux * 5); x.fill(); });
  E.forEach((e, i) => { const [px, py] = pos[i]; x.fillStyle = '#10163a'; x.beginPath(); x.arc(px, py, 19, 0, 7); x.fill(); x.strokeStyle = EL_COL[e]; x.lineWidth = 2; x.stroke(); x.fillStyle = EL_COL[e]; x.font = 'bold 20px DotGothic16, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, px, py + 1); });
  const p = panel(`<div class="ttl">五行の相性</div><div class="gogyo"></div><div class="bio">矢印は「剋つ」向き。木は土に、土は水に、水は火に、火は金に、金は木に剋つ。<br>剋つ属性で攻めると <b>1.5倍</b>、逆だと <b>0.8倍</b>。<br>刀＝金、銃・砲＝火、牙＝木、打つ・投げる＝土、水のわざもある。<br>敵の足もとの字と、わざの名前の〔 〕が属性。</div>`, 8, 8, 368, 272);
  p.querySelector('.gogyo').appendChild(c); await waitOk(); p.remove();
}
async function dexMenu() {
  let tab = 0;
  while (true) {
    const np = Object.keys(DEX.people).length, ne = DEX.events.length, nl = Object.keys(DEX.places).length;
    const cnt = o => Object.keys(o).length;
    tab = await choose([{ label: '人物', right: `${cnt(G.dex.p)}/${np}` }, { label: '年表', right: `${cnt(G.dex.e)}/${ne}` }, { label: 'ゆかりの地', right: `${cnt(G.dex.l)}/${nl}` }, { label: '全国のつながり', right: Object.keys(linkedPrefs()).length + '県' }, { label: '結末', right: `${cnt(G.dex.end)}/${DEX.endings.length}` }, { label: '五行の相性' }], { x: 116, y: 8, w: 220, title: '図鑑', start: tab });
    if (tab < 0) return;
    if (tab === 0) {
      const ids = Object.keys(DEX.people); let last = 0;
      while (true) {
        const i = await choose(ids.map(id => G.dex.p[id] ? { label: DEX.people[id].name, right: DEX.people[id].fic ? '創作' : DEX.people[id].pref } : { label: '？？？', disabled: true }), { x: 116, y: 8, w: 250, maxH: 260, start: last });
        if (i < 0) break; last = i;
        const id = ids[i], d = DEX.people[id], por = infoOf(id) && infoOf(id).por;
        const p = panel(`<div class="st2"><canvas width="64" height="64"></canvas><div><b class="big">${esc(d.name)}</b><br>${d.years || ''}<br>${esc(d.pref)}${d.fic ? '（架空の人物）' : ''}</div></div><div class="bio">${esc(d.bio)}</div>`, 8, 8, 368, 272);
        if (por || isMain(id)) p.querySelector('canvas').getContext('2d').drawImage(faceImg(id), 0, 0); else p.querySelector('canvas').remove();
        await waitOk(); p.remove();
      }
    }
    if (tab === 1) {
      const d = descBox();
      await choose(DEX.events.map(e => G.dex.e[e.id] ? { label: `${e.year}　${e.title}` } : { label: '？？？？' }), { x: 8, y: 8, w: 368, maxH: 220, onMove: k => { const e = DEX.events[k]; d.textContent = G.dex.e[e.id] ? e.desc : 'まだ見ていない出来事'; } });
      d.remove();
    }
    if (tab === 2) {
      const ids = Object.keys(DEX.places), d = place(el('div', 'win desc tall'), 8, 200, 368, 80);
      await choose(ids.map(id => G.dex.l[id] ? { label: DEX.places[id].name, right: DEX.places[id].pref } : { label: '？？？' }), { x: 8, y: 8, w: 368, maxH: 180, onMove: k => { const p = DEX.places[ids[k]]; d.innerHTML = G.dex.l[ids[k]] ? `<b>${esc(p.where)}</b><br>${esc(p.desc)}<br><small>※実際に訪れるときは、最新の公開情報を確かめてください</small>` : 'まだ訪れていない'; } });
      d.remove();
    }
    if (tab === 3) {
      const L = linkedPrefs(), keys = Object.keys(L);
      const p = panel(`<div class="ttl">全国のつながり</div><div class="bio">この物語で出会った、${GAME.pref}の外の人物・出来事・場所です。日本國物語の別の作品で、また出会うかもしれません。</div>${keys.length ? keys.map(k => `<div class="lk"><b>${esc(k)}</b>　${L[k].map(esc).join('、')}</div>`).join('') : '<div class="lk">まだ つながりはない</div>'}`, 8, 8, 368, 272, 'scrollp');
      await waitOk(); p.remove();
    }
    if (tab === 5) await gogyoChart();
    if (tab === 4) {
      const p = panel(`<div class="ttl">結末</div>${DEX.endings.map(e => `<div class="lk">${G.dex.end[e.id] ? `<b>${esc(e.name)}</b>　${esc(e.desc)}` : '？？？？？'}</div>`).join('')}<div class="bio"><br>${GAME.endNote || ''}</div>`, 8, 8, 368, 272, 'scrollp');
      await waitOk(); p.remove();
    }
  }
}
async function shop(list) {
  while (true) {
    const money = panel(`<div class="money">${G.money}<small>文</small></div>`, 8, 196, 96);
    const c = await choose(['買う', '売る', 'やめる'], { x: 8, y: 8, w: 96 });
    money.remove();
    if (c < 0 || c === 2) { await N(GW('shopBye')); return; }
    if (c === 0) {
      let last = 0;
      while (true) {
        const ids = list, d = descBox(), mb = panel(`<div class="money">${G.money}<small>文</small></div>`, 8, 196, 96);
        const i = await choose(ids.map(id => ({ label: ITEMS[id].name + (G.inv[id] ? `（${G.inv[id]}）` : ''), right: ITEMS[id].price + '文' })), {
          x: 112, y: 8, w: 264, maxH: 220, start: last, onMove: k => {
            const it = ITEMS[ids[k]]; let s = it.desc || '';
            if (it.type !== 'use') s += '　' + G.party.map(p => { const m = G.mem[p]; return canEquip(m, it) ? `${m.name}${equipDiff(m, it)}` : `${m.name}×`; }).join(' ');
            d.textContent = s;
          }
        });
        d.remove(); mb.remove(); if (i < 0) break; last = i;
        const it = ITEMS[ids[i]], can = Math.floor(G.money / it.price);
        if (can < 1) { SFX.play('ng'); await N(GW('noMoney')); continue; }
        const n = it.type === 'use' ? await qty(Math.min(99, can), k => `${k * it.price}文`, `${it.name}を いくつ買う？`) : 1;
        if (!n) continue;
        G.money -= it.price * n; addItem(ids[i], n); SFX.play('coin');
        if (it.type !== 'use') {
          const cans = G.party.filter(p => canEquip(G.mem[p], it));
          if (cans.length && await ask(null, `${it.name}を 今すぐ装備しますか？`)) {
            const t = await pickMember({ ids: cans, right: m => equipDiff(m, it) });
            if (t) { doEquip(G.mem[t], ids[i]); await N(`${G.mem[t].name}は ${it.name}を 装備した！`); }
          }
        }
      }
    }
    if (c === 1) {
      let last = 0;
      while (true) {
        const ids = invList(it => it.price > 0 && it.type !== 'key');
        if (!ids.length) { await N(GW('noSell')); break; }
        const i = await choose(ids.map(id => ({ label: ITEMS[id].name + ' ×' + G.inv[id], right: Math.floor(ITEMS[id].price / 2) + '文' })), { x: 112, y: 8, w: 264, maxH: 220, start: Math.min(last, ids.length - 1) });
        if (i < 0) break; last = i;
        const id = ids[i], half = Math.floor(ITEMS[id].price / 2);
        const n = G.inv[id] > 1 ? await qty(G.inv[id], k => `${k * half}文`, `${ITEMS[id].name}を いくつ売る？`) : 1;
        if (!n) continue;
        G.money += half * n; addItem(id, -n); SFX.play('coin');
      }
    }
  }
}
async function shopTalk(kind) {
  const s = SHOP_TALK[kind] || SHOP_TALK.dougu;
  await S(s[0], s[1], s[2]);
  // 戦場の陣では、商人のそばで休める（宿のない場所でも回復できるように）
  if (kind === 'jinchu') { await S(s[0], GW('jinRest'), GW('jinRest', 1)); await lodge(s[0], 0); }
  await shop(SHOPS[kind]());
}
async function rest() { await fadeOut(); restAll(); bgm(null); SFX.play('bell'); await sleep(900); await fadeIn(); SFX.play('heal'); if (G.map && G.map.bgm) { Audio8.cur = null; bgm(typeof G.map.bgm === 'function' ? G.map.bgm() : G.map.bgm); } await N('ぐっすり眠って、みんな元気になった！'); }
async function rentHorse(price = 30) {
  if (G.ride) { await N('もう 馬に乗っている。'); return; }
  if (await ask('umakata', GW('horse').replace('{p}', price), GW('horse', 1).replace('{p}', price))) {
    if (G.money < price) { await S('umakata', GW('horseNg'), GW('horseNg', 1)); return; }
    G.money -= price; G.ride = true; SFX.play('horse'); await N(G.party.length > 1 ? 'みんなで 馬に乗った！ 野山を速く駆けられる。\n（町や家に入るか、メニューの「馬を降りる」で 降りる）' : '馬に乗った！ 野山を速く駆けられる。\n（町や家に入るか、メニューの「馬を降りる」で 降りる）');
  }
}

// ---------- 戦闘 ----------
const B_POS = (i, n) => { const w = Math.floor((368 - (n - 1) * 4) / n); return { x: (8 + i * (w + 4) + w / 2) * CW / SW, y: 40 * CW / SW }; };
function calcDmg(atk, def, pow) { const b = Math.max(1, atk * pow - def * .5); return Math.max(1, Math.round(b * (.85 + Math.random() * .3))); }
function layoutEnemies(B) {
  const gap = 12, total = B.es.reduce((s, e) => s + e.img.width, 0) + gap * (B.es.length - 1);
  const sc = total > CW - 20 ? (CW - 20) / total : 1;
  let x = (CW - total * sc) / 2;
  B.es.forEach(e => { e.w = Math.round(e.img.width * sc); e.h = Math.round(e.img.height * sc); e.x = Math.round(x); e.y = 248 - e.h; x += e.w + gap * sc; });
}
function fx(type, x, y) { if (G.B) G.B.fx.push({ type, x, y, t: 0, dur: { slash: 18, chest: 28, shot: 16, boom: 34, heal: 34, buff: 30, bite: 16, hit: 14, ki: 30 }[type] || 20 }); }
function fxEnemy(e, type) { fx(type, e.x + e.w / 2, e.y + e.h / 2); }
function fxMember(id, type) { const i = G.party.indexOf(id); if (i >= 0 && G.B) { const p = B_POS(i, G.party.length); fx(type, p.x, p.y + 30); } }
function num(x, y, text, col) { if (G.B) G.B.nums.push({ x, y, text, col, t: 0 }); }
function drawBattle() {
  const B = G.B;
  ctx.drawImage(bgImg(B.bg), 0, 0); drawPlume(ctx, B.bg, G.frame);
  if (B.bg === 'storm' || B.bg === 'rain') for (let i = 0; i < 6; i++) { const x = Math.random() * CW, y = Math.random() * CH; ctx.strokeStyle = 'rgba(200,210,230,.5)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 16); ctx.stroke(); }
  if (B.bg === 'fire' || B.bg === 'shiroyama') for (let i = 0; i < 3; i++) { ctx.fillStyle = Math.random() < .5 ? '#ff9a30' : '#e04a1a'; ctx.fillRect(Math.random() * CW, 150 + Math.random() * 230, 2, 2); }
  const bob = Math.sin(G.frame / 20) * 1.5;
  for (const e of B.es) {
    if (e.dead) e.alpha = Math.max(0, e.alpha - .04);
    if (e.alpha <= 0) continue;
    if (e.flash > 0) { e.flash--; if ((e.flash >> 1) % 2) continue; }
    ctx.globalAlpha = e.alpha; ctx.drawImage(e.img, e.x + (e.shk > 0 ? (e.shk-- % 2 ? 3 : -3) : 0), e.y + (e.d.spr.t ? 0 : bob), e.w, e.h); ctx.globalAlpha = 1;
    if (!e.dead && (e.st || e.up)) { e.st = e.st || {};
      const tags = ['atk', 'def', 'spd'].filter(k => est(e, k)).map(k => ST_MARK[k] + '↓').concat(e.st.bleed && e.st.bleed.t > 0 ? ['血'] : [], e.st.stun ? ['ひるみ'] : []);
      const ups = ['atk', 'def', 'spd'].filter(k => eup(e, k)).map(k => ST_MARK[k] + '↑');
      if (ups.length) { ctx.font = '12px DotGothic16, sans-serif'; ctx.textAlign = 'center'; const tx = ups.join(' '), w = ctx.measureText(tx).width + 8; ctx.fillStyle = 'rgba(10,14,36,.8)'; ctx.fillRect(e.x + e.w / 2 - w / 2, e.y - 20, w, 15); ctx.fillStyle = '#ffd040'; ctx.fillText(tx, e.x + e.w / 2, e.y - 9); }
      if (tags.length) { ctx.font = '12px DotGothic16, sans-serif'; ctx.textAlign = 'center'; const tx = tags.join(' '), w = ctx.measureText(tx).width + 8; ctx.fillStyle = 'rgba(10,14,36,.8)'; ctx.fillRect(e.x + e.w / 2 - w / 2, e.y - 4, w, 15); ctx.fillStyle = '#ff9a8a'; ctx.fillText(tx, e.x + e.w / 2, e.y + 7); }
    }
    if (!e.dead && e.d.el) { ctx.font = '12px DotGothic16, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(10,14,36,.75)'; ctx.fillRect(e.x + e.w / 2 - 14, e.y + e.h + 1, 28, 14); ctx.fillStyle = EL_COL[e.d.el]; ctx.fillText(e.d.el, e.x + e.w / 2, e.y + e.h + 12); }
    if (e.rare && G.frame % 20 < 3) { ctx.fillStyle = '#fff'; ctx.fillRect(e.x + Math.random() * e.w, e.y + Math.random() * e.h, 2, 2); }
  }
  if (B.sel != null && B.es[B.sel] && !B.es[B.sel].dead && (G.frame >> 3) % 2) {
    const e = B.es[B.sel]; ctx.fillStyle = '#ffe070'; const cx = e.x + e.w / 2;
    for (let i = 0; i < 8; i++) ctx.fillRect(cx - 8 + i, e.y - 18 + i, 16 - i * 2, 1);
  }
  for (const f of B.fx) {
    f.t += OPT.speed; const p = Math.min(1, f.t / f.dur);  // 5倍速で dur を越えても半径が負にならないように
    ctx.save();
    switch (f.type) {
      case 'slash': case 'chest': {
        const big = f.type === 'chest'; ctx.strokeStyle = big ? '#fff2c0' : '#ffffff'; ctx.lineWidth = big ? 6 : 3;
        for (let k = 0; k < (big ? 3 : 2); k++) { const o = (k - 1) * 14; ctx.globalAlpha = 1 - p; ctx.beginPath(); ctx.moveTo(f.x - 50 + o, f.y - 50); ctx.lineTo(f.x - 50 + o + 100 * Math.min(1, p * 2), f.y - 50 + 100 * Math.min(1, p * 2)); ctx.stroke(); }
        if (big) { ctx.globalAlpha = (1 - p) * .5; ctx.fillStyle = '#c02020'; ctx.fillRect(f.x - 60, f.y - 4, 120 * Math.min(1, p * 3), 8); }
        break;
      }
      case 'shot': ctx.globalAlpha = 1 - p; ctx.fillStyle = '#ffe080'; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28, r = 6 + p * 22; ctx.fillRect(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 3, 3); } ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x, f.y, 8 * (1 - p), 0, 7); ctx.fill(); break;
      case 'boom': ctx.globalAlpha = 1 - p; ctx.fillStyle = '#ff8a20'; ctx.beginPath(); ctx.arc(f.x, f.y, 10 + p * 50, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + p * 26, 0, 7); ctx.fill(); ctx.fillStyle = '#3a3030'; for (let k = 0; k < 10; k++) ctx.fillRect(f.x + Math.cos(k) * p * 70, f.y + Math.sin(k * 2) * p * 50, 4, 4); break;
      case 'heal': case 'ki': ctx.globalAlpha = 1 - p; ctx.fillStyle = f.type === 'ki' ? '#80c0ff' : '#a0ff90'; for (let k = 0; k < 10; k++) { const xx = f.x + Math.sin(k * 3.1) * 30, yy = f.y + 20 - p * 60 - (k % 3) * 8; ctx.fillRect(xx, yy, 3, 8); ctx.fillRect(xx - 3, yy + 3, 9, 2); } break;
      case 'buff': ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y + 30 - p * 50, 40, 10, 0, 0, 7); ctx.stroke(); break;
      case 'bite': ctx.globalAlpha = 1 - p; ctx.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { ctx.fillRect(f.x - 20 + k * 12, f.y - 20 + p * 10, 5, 14); ctx.fillRect(f.x - 20 + k * 12, f.y + 14 - p * 10, 5, 14); } break;
      case 'hit': ctx.globalAlpha = (1 - p) * .8; ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(f.x, f.y, 20 + p * 20, 0, 7); ctx.fill(); break;
    }
    ctx.restore();
  }
  B.fx = B.fx.filter(f => f.t < f.dur);
  ctx.font = 'bold 22px DotGothic16, monospace'; ctx.textAlign = 'center';
  for (const n of B.nums) { n.t += OPT.speed; const y = n.y - Math.min(20, n.t * 1.5); ctx.globalAlpha = Math.min(1, 2 - n.t / 30); ctx.lineWidth = 4; ctx.strokeStyle = '#1c1219'; ctx.strokeText(n.text, n.x, y); ctx.fillStyle = n.col || '#fff'; ctx.fillText(n.text, n.x, y); ctx.globalAlpha = 1; }
  B.nums = B.nums.filter(n => n.t < 60);
}
function updateBStat() {
  const B = G.B; if (!B) return;
  G.party.forEach((id, i) => {
    const m = G.mem[id], e = B.statEls[i]; if (!e) return;
    e.classList.toggle('dead', m.hp <= 0); e.classList.toggle('act', B.actIdx === i); e.classList.toggle('low', m.hp > 0 && m.hp < mhp(m) / 4);
    const hp = Math.max(0, m.hp / mhp(m)), ki = Math.max(0, m.ki / Math.max(1, mki(m)));
    const pb = B.pb[id], chips = ['atk', 'def', 'spd'].filter(k => pst(id, k)).map(k => pst(id, k) > 0 ? `<i class="up">${ST_MARK[k]}↑</i>` : `<i class="dn">${ST_MARK[k]}↓</i>`).join('') + (pb && pb.regen && pb.regen.t > 0 ? '<i class="rg">癒</i>' : '') + (pb && pb.bleed && pb.bleed.t > 0 ? '<i class="dn">血</i>' : '');
    e.innerHTML = `<div class="bn"><span class="nmx">${esc(m.name)}<i class="elc" style="color:${EL_COL[HEROES[id].el]}">${HEROES[id].el}</i></span>${chips ? `<em class="chips">${chips}</em>` : ''}<span>Lv${m.lv}</span></div><div>HP <b>${m.hp}</b><small>/${mhp(m)}</small></div><div class="bar"><i style="width:${hp * 100}%"></i></div><div>気 <b>${m.ki}</b><small>/${mki(m)}</small></div><div class="bar ki"><i style="width:${ki * 100}%"></i></div>`;
  });
}
function hurtFlash(id) { const i = G.party.indexOf(id); const e = G.B && G.B.statEls[i]; if (e) { e.classList.remove('hurt'); void e.offsetWidth; e.classList.add('hurt'); } }
async function bmsg(t, ms = 800) { const B = G.B; B.msgEl.textContent = t; G.log.push({ n: '', t }); await waitOk(OPT.auto ? T(ms) : T(ms)); }
function setMsgWide(wide) { const e = G.B.msgEl; if (wide) place(e, 8, 196, 368, 84); else place(e, 112, 196, 264, 84); }
async function battle(group, opt = {}) {
  hideDlg();
  const prevScene = G.scene, prevBgm = Audio8.cur;
  const counts = {}; group.forEach(id => counts[id] = (counts[id] || 0) + 1);
  const seen = {};
  const B = {
    es: group.map(id => {
      // 野山の敵は、出てくる時期（opt.L）に合わせて強くなる。頭（ボス）は手下より少し上
      const d0 = ENEMIES[id], d = opt.L && d0.scaled ? mkEnemy(id, { ...EN[id], L: Math.max(EN[id].L, opt.L + (EN[id].L - 3) * .4) }) : d0; let name = d.name;
      if (counts[id] > 1) { seen[id] = (seen[id] || 0) + 1; name += 'ABCD'[seen[id] - 1]; }
      return { id, d, name, hp: d.hp, atk: d.atk, def: d.def, spd: d.spd, img: enemyImg(id), flash: 0, alpha: 1, dead: false, buff: 0, rare: d.rare, shk: 0 };
    }), turn: 1, opt, bg: opt.bg || 'field', defend: {}, pb: {}, sel: null, actIdx: -1, fx: [], nums: [],
  };
  layoutEnemies(B);
  for (const id of group) if (ENEMIES[id].dex) meet(ENEMIES[id].dex);
  SFX.play('enc'); flashScreen(); await sleep(350);
  G.B = B; G.scene = 'battle';
  bgm(opt.bgm || (opt.boss ? 'boss' : 'battle'));
  const n = G.party.length, w = Math.floor((368 - (n - 1) * 4) / n);
  B.statEls = G.party.map((id, i) => place(el('div', 'win bst'), 8 + i * (w + 4), 4, w));
  B.msgEl = el('div', 'win bmsg'); setMsgWide(true); updateBStat();
  const names = [...new Set(B.es.map(e => e.d.name))].join('と');
  await bmsg(opt.intro || (opt.boss ? `${names}が 立ちはだかった！` : B.es.some(e => e.rare) ? `${names}が あらわれた！ ……なにやら様子が違う！` : `${names}が あらわれた！`), 1200);
  let result = null;
  while (!result) {
    const acts = await inputCommands(B);
    setMsgWide(true); B.actIdx = -1; updateBStat();
    if (acts === 'run') {
      await bmsg(`${G.mem[G.party[0]].name}たちは 逃げ出した！`, 500); SFX.play('run');
      if (opt.noRun) { await bmsg('しかし 退くことは許されない！'); result = await execTurn(B, []); }
      else if (Math.random() < .7) { result = 'run'; }
      else { await bmsg('しかし 回り込まれてしまった！'); result = await execTurn(B, []); }
    } else result = await execTurn(B, acts);
  }
  if (result === 'win') await victory(B);
  if (result === 'lose') { bgm('sad'); await bmsg(`${G.mem[G.party[0]].name}たちは 力尽きた……`, 1800); }
  B.statEls.forEach(e => e.remove()); B.msgEl.remove();
  G.B = null; G.scene = prevScene === 'battle' ? 'map' : prevScene;
  Audio8.cur = null; if (prevBgm) bgm(prevBgm);
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
    if (OPT.auto && !B.opt.boss) { const e = B.es.findIndex(e => !e.dead); acts.push({ type: 'atk', actor: id, t: e }); i++; continue; }
    const c = await choose(['たたかう', 'わざ', 'どうぐ', 'ぼうぎょ', 'にげる'], { x: 8, y: 172, w: 100, cancel: i > 0 });
    if (c < 0) { i--; acts.pop(); continue; }
    let act = null;
    if (c === 0) { const t = await pickEnemy(B); if (t < 0) continue; act = { type: 'atk', actor: id, t }; }
    if (c === 1) {
      const sks = skillsOf(m);
      if (!sks.length) { B.msgEl.textContent = 'まだ わざを覚えていない。'; await waitOk(900); continue; }
      const k = await choose(sks.map(s => ({ label: (skillEl(SKILLS[s]) ? '〔' + skillEl(SKILLS[s]) + '〕' : '') + SKILLS[s].name, right: '気' + SKILLS[s].ki, disabled: m.ki < SKILLS[s].ki })), { x: 112, y: 52, w: 236, maxH: 138, onMove: j => B.msgEl.textContent = skillDesc(sks[j]) });
      if (k < 0) continue;
      const sk = SKILLS[sks[k]]; let t = null;
      if (sk.target === 'enemy') { t = await pickEnemy(B); if (t < 0) continue; }
      if (sk.target === 'ally') { t = await pickMember({ x: 112, y: 100, w: 220 }); if (!t) continue; }
      act = { type: 'skill', sk: sks[k], actor: id, t };
    }
    if (c === 2) {
      const ids = invList(it => it.type === 'use');
      if (!ids.length) { B.msgEl.textContent = '使える道具を 持っていない。'; await waitOk(900); continue; }
      const k = await choose(ids.map(x => ({ label: ITEMS[x].name, right: '×' + G.inv[x] })), { x: 112, y: 60, w: 220, maxH: 130, onMove: j => B.msgEl.textContent = ITEMS[ids[j]].desc });
      if (k < 0) continue;
      const it = ITEMS[ids[k]];
      if (it.target === 'enemy') { const t = await pickEnemy(B); if (t < 0) continue; act = { type: 'throw', item: ids[k], actor: id, t }; }
      else { const t = (it.healAll || it.kiAll) ? id : await pickMember({ x: 112, y: 100, w: 220, right: kiItem(ids[k]) ? (m => `気 ${m.ki}/${mki(m)}`) : null }); if (!t) continue; act = { type: 'item', item: ids[k], actor: id, t }; }
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
  const k = await choose(alive.map(i => ({ label: B.es[i].name, right: B.es[i].d.el ? '【' + B.es[i].d.el + '】' : '' })), { x: 112, y: 100, w: 236, onMove: j => B.sel = alive[j] });
  B.sel = null; return k < 0 ? -1 : alive[k];
}
const aliveMembers = () => G.party.map(id => G.mem[id]).filter(m => m.hp > 0);
async function execTurn(B, acts) {
  const all = acts.map(a => ({ ...a, side: 'p', r: bstat(G.mem[a.actor], 'spd') * (.7 + Math.random() * .6) }));
  for (const e of B.es) if (!e.dead) for (let k = 0; k < (e.d.acts || 1); k++) all.push({ side: 'e', e, r: eSpd(e) * (.7 + Math.random() * .6) });
  all.sort((a, b) => b.r - a.r);
  B.defend = {}; for (const a of acts) if (a.type === 'def') B.defend[a.actor] = true;
  for (const a of all) {
    if (a.side === 'p') { if (G.mem[a.actor].hp <= 0) continue; await pAct(B, a); }
    else { if (a.e.dead) continue; await eAct(B, a.e); }
    if (B.es.every(e => e.dead)) return B.es.every(e => e.fled) ? 'fled' : 'win';
    if (!aliveMembers().length) return 'lose';
  }
  await tickStatus(B);
  if (B.es.every(e => e.dead)) return B.es.every(e => e.fled) ? 'fled' : 'win';
  B.turn++;
  return null;
}
// ---- 五行（木・火・土・金・水）。相手に剋つ属性で攻めると1.5倍、剋たれる属性だと0.8倍 ----
// 木は土に、土は水に、水は火に、火は金に、金は木に剋つ
const KOKU = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const EL_COL = { 木: '#7ad86a', 火: '#ff7a4a', 土: '#e0b860', 金: '#e8e8f4', 水: '#6ab8ff' };
const FX_EL = { slash: '金', chest: '金', shot: '火', boom: '火', bite: '木', hit: '土' };
function elTag(e) { return e ? `<span class="el" style="color:${EL_COL[e]}">【${e}】</span>` : ''; }
function elRate(a, d) { return !a || !d ? 1 : KOKU[a] === d ? 1.5 : KOKU[d] === a ? .8 : 1; }
function skillEl(sk) { return sk.el || (sk.type === 'atk' ? FX_EL[sk.fx || (sk.first ? 'chest' : 'slash')] : null); }
function skillDesc(id) { const sk = SKILLS[id], e = skillEl(sk); return (e ? `【${e}】` : '') + sk.desc; }
function retarget(B, t) { const e = B.es[t]; if (e && !e.dead) return e; return B.es.find(x => !x.dead); }
// 武器の属性：刀＝金、銃＝火、牙・弓・薙刀＝木、銛＝水、杖＝土、槍＝金（武器に el があればそれ）
const KIND_EL = { sword: '金', gun: '火', pistol: '火', fang: '木', bow: '木', naginata: '木', mori: '水', cane: '土', yari: '金' };
function weaponEl(m) { const w = m.eq.w && ITEMS[m.eq.w]; return (w && (w.el || KIND_EL[w.kind])) || FX_EL[weaponFx(m)]; }
function weaponFx(m) { const w = m.eq.w && ITEMS[m.eq.w]; return w && (w.kind === 'gun' || w.kind === 'pistol' || w.kind === 'bow') ? 'shot' : w && w.kind === 'fang' ? 'bite' : 'slash'; }
// ---- 強化・弱体（戦闘中だけ。v＝割合、t＝残りターン） ----
const ST_NAME = { atk: '攻撃力', def: '守り', spd: '素早さ' }, ST_MARK = { atk: '攻', def: '守', spd: '速' };
function pst(id, k) { const B = G.B, s = B && B.pb[id] && B.pb[id][k]; return s && s.t > 0 ? s.v : 0; }
function bstat(m, k) { return Math.round(stat(m, k) * (1 + pst(m.id, k))); }
function est(e, k) { const s = e.st && e.st[k]; return s && s.t > 0 ? s.v : 0; }
function eup(e, k) { const s = e.up && e.up[k]; return s && s.t > 0 ? s.v : 0; }
const eAtk = e => e.atk * (1 + .25 * e.buff + eup(e, 'atk')) * (1 - est(e, 'atk')), eDef = e => e.def * (1 + eup(e, 'def')) * (1 - est(e, 'def')), eSpd = e => e.spd * (1 + eup(e, 'spd')) * (1 - est(e, 'spd'));
// 敵のわざで、こちらの能力が下がる（強化のわざを使えば打ち消せる）
async function debuffMembers(B, ms, stats, v, turns) {
  const hit = ms.filter(m => m.hp > 0 && Math.random() < .85);
  if (!hit.length) { await bmsg('しかし 効かなかった！', 500); return; }
  for (const m of hit) { const pb = B.pb[m.id] = B.pb[m.id] || {}; for (const k of stats) pb[k] = { v: Math.min(-v, pst(m.id, k)), t: turns + 1 }; fxMember(m.id, 'hit'); }
  SFX.play('debuff'); updateBStat();
  await bmsg(`${hit.length > 1 ? 'みんな' : hit[0].name}の ${stats.map(k => ST_NAME[k]).join('と')}が 下がった！`, 700);
}
async function buffMembers(B, ms, stats, v, turns) {
  for (const m of ms) { const pb = B.pb[m.id] = B.pb[m.id] || {}; for (const k of stats) pb[k] = { v: Math.max(v, pst(m.id, k)), t: turns + 1 }; fxMember(m.id, 'buff'); }
  SFX.play('buff'); updateBStat();
  await bmsg(`${ms.length > 1 ? 'みんな' : ms[0].name}の ${stats.map(k => ST_NAME[k]).join('と')}が 上がった！`, 700);
}
async function debuffEnemy(B, e, stats, v, turns, rate = 1) {
  if (e.dead) return;
  if (Math.random() > rate * (B.opt.boss ? .75 : 1)) { await bmsg(`${e.name}には 効かなかった！`, 500); return; }
  e.st = e.st || {}; for (const k of stats) { e.st[k] = { v: Math.max(v, est(e, k)), t: turns + 1 }; if (e.up && e.up[k]) e.up[k].t = 0; }
  fxEnemy(e, 'hit'); SFX.play('hurt'); await bmsg(`${e.name}の ${stats.map(k => ST_NAME[k]).join('と')}が 下がった！`, 650);
}
async function stunEnemy(B, e, rate) {
  if (e.dead || Math.random() > rate * (B.opt.boss ? .5 : 1)) return false;
  e.st = e.st || {}; e.st.stun = 1; e.shk = 10; await bmsg(`${e.name}は ひるんだ！`, 550); return true;
}
// ターンの終わり：出血・じわじわ回復、効き目の残りターンを減らす
async function tickStatus(B) {
  for (const e of B.es) {
    if (e.dead || !e.st) continue;
    if (e.st.bleed && e.st.bleed.t > 0) {
      const d = Math.max(1, e.st.bleed.v); e.hp -= d; e.flash = 8; num(e.x + e.w / 2, e.y + e.h / 3, d, '#ff7070');
      await bmsg(`${e.name}は 出血で ${d} の ダメージ！`, 500);
      if (e.hp <= 0) { e.hp = 0; e.dead = true; SFX.play('kill'); await bmsg(`${e.name}を 倒した！`); continue; }
    }
    for (const k of ['atk', 'def', 'spd', 'bleed']) if (e.st[k] && e.st[k].t > 0) e.st[k].t--;
  }
  for (const e of B.es) if (e.up) for (const k in e.up) if (e.up[k].t > 0) e.up[k].t--;
  for (const id of G.party) {
    const m = G.mem[id], pb = B.pb[id]; if (!pb) continue;
    if (pb.bleed && pb.bleed.t > 0 && m.hp > 0) { const d = Math.min(m.hp, pb.bleed.v); m.hp -= d; fxMember(id, 'hit'); hurtFlash(id); updateBStat(); await bmsg(`${m.name}は 傷が痛み ${d} の ダメージ！`, 450); if (m.hp <= 0) await bmsg(`${m.name}は 倒れた……`); }
    if (pb.regen && pb.regen.t > 0 && m.hp > 0) { const v = Math.min(mhp(m) - m.hp, pb.regen.v); if (v > 0) { m.hp += v; fxMember(id, 'heal'); updateBStat(); await bmsg(`${m.name}の HPが ${v} 回復した。`, 450); } }
    for (const k in pb) if (pb[k].t > 0) pb[k].t--;
  }
  updateBStat();
}
async function hitEnemy(B, e, atk, pow, sure, fxType = 'slash', el = null) {
  if (!sure && Math.random() < (e.d.evade || .05)) { SFX.play('miss'); await bmsg('しかし 攻撃は かわされた！'); return; }
  const rate = elRate(el, e.d.el);
  let dmg = Math.max(1, Math.round(calcDmg(atk, eDef(e), pow) * rate));
  const crit = Math.random() < 1 / 18;
  if (crit) { dmg = Math.round(atk * pow * 1.6 * rate); }
  if (e.d.armor) dmg = Math.max(1, Math.min(dmg, e.d.armor + (Math.random() < .5 ? 1 : 0)));
  fxEnemy(e, crit && fxType === 'slash' ? 'chest' : fxType); SFX.play(fxType === 'shot' ? 'gun' : fxType === 'boom' ? 'boom' : crit ? 'chest' : 'slash');
  await sleep(T(160));
  e.hp -= dmg; e.flash = 14; e.shk = 8; num(e.x + e.w / 2, e.y + e.h / 3, dmg, crit ? '#ffd040' : '#fff');
  if (crit) { flashScreen('#fff'); await bmsg('見事な一撃！', 450); }
  await bmsg(`${e.name}に ${dmg} の ダメージ！` + (rate > 1 ? `\n【${el}は${e.d.el}に剋つ】五行の相性で 大きな痛手を与えた！` : rate < 1 ? `\n【${e.d.el}は${el}に剋つ】五行の相性が悪い……` : ''), rate === 1 ? 650 : 900);
  if (e.hp <= 0) { e.hp = 0; e.dead = true; SFX.play('kill'); await bmsg(e.d.defeat ? e.d.defeat.replace('{n}', e.name) : `${e.name}を 倒した！`); }
}
async function hitMember(B, m, atk, pow, fxType = 'hit', el = null) {
  if (Math.random() < Math.min(.25, bstat(m, 'spd') / 600)) { SFX.play('miss'); await bmsg(`${m.name}は ひらりと かわした！`, 600); return; }
  const r0 = elRate(el, HEROES[m.id].el), rate = r0 > 1 ? 1.2 : r0 < 1 ? .85 : 1;
  let dmg = Math.max(1, Math.round(calcDmg(atk, bstat(m, 'def'), pow) * rate));
  if (B.defend[m.id]) dmg = Math.max(1, Math.round(dmg / 2));
  m.hp = Math.max(0, m.hp - dmg); fxMember(m.id, fxType); SFX.play(fxType === 'shot' ? 'gun' : fxType === 'boom' ? 'boom' : 'hurt'); shake(fxType === 'boom'); hurtFlash(m.id); updateBStat();
  const p = B_POS(G.party.indexOf(m.id), G.party.length); num(p.x, p.y + 40, dmg, '#ff8a8a');
  await bmsg(`${m.name}は ${dmg} の ダメージを受けた！`, 650);
  if (m.hp <= 0) await bmsg(`${m.name}は 倒れた……`);
}
async function pAct(B, a) {
  const m = G.mem[a.actor];
  if (a.type === 'def') { fxMember(a.actor, 'buff'); await bmsg(`${m.name}は 身を守っている。`, 500); return; }
  if (a.type === 'atk') { const e = retarget(B, a.t); if (!e) return; await bmsg(`${m.name}の 攻撃！`, 350); await hitEnemy(B, e, bstat(m, 'atk'), 1, false, weaponFx(m), weaponEl(m)); return; }
  if (a.type === 'item') { await useItem(a.item, a.t, true); updateBStat(); return; }
  if (a.type === 'throw') { const it = ITEMS[a.item], e = retarget(B, a.t); if (!e || !G.inv[a.item]) return; addItem(a.item, -1); await bmsg(`${m.name}は ${it.name}を 投げつけた！`, 500); await hitEnemy(B, e, it.dmg, 1, true, 'boom', it.el || '火'); return; }
  if (a.type === 'skill') {
    const sk = SKILLS[a.sk];
    if (m.ki < sk.ki) { await bmsg(`${m.name}は ${sk.name}を使おうとした！ しかし 気が足りない！`); return; }
    m.ki -= sk.ki; updateBStat();
    await bmsg(sk.say ? `${m.name}「${sk.say}」` : `${m.name}の ${sk.name}！`, 550);
    if (sk.type === 'atk') {
      let pow = sk.pow;
      if (sk.first && B.turn === 1) { pow *= sk.first; flashScreen('#fff'); await bmsg('初太刀！ チェストォォォッ！！', 600); }
      const ts = sk.target === 'enemies' ? B.es.filter(e => !e.dead) : [retarget(B, a.t)].filter(Boolean);
      for (let hit = 0; hit < (sk.hits || 1); hit++) for (const e of ts) if (!e.dead) await hitEnemy(B, e, bstat(m, 'atk'), pow, sk.sure, sk.fx || (sk.first ? 'chest' : 'slash'), skillEl(sk));
      if (sk.drain) { const v = Math.round(stat(m, 'atk') * sk.drain); m.hp = Math.min(mhp(m), m.hp + v); updateBStat(); }
      for (const e of ts) {
        if (e.dead) continue;
        if (sk.debuff) await debuffEnemy(B, e, sk.debuff.stat, sk.debuff.v, sk.debuff.turns);
        if (sk.bleed) { e.st = e.st || {}; e.st.bleed = { v: Math.round(bstat(m, 'atk') * sk.bleed.pow), t: sk.bleed.turns }; await bmsg(`${e.name}は 傷を負った！（出血）`, 500); }
        if (sk.stun) await stunEnemy(B, e, sk.stun);
      }
    } else if (sk.type === 'heal') {
      const ts = sk.target === 'allies' ? G.party.map(id => G.mem[id]) : [G.mem[a.t]];
      for (const t of ts) {
        if (t.hp <= 0) { if (sk.revive) { t.hp = Math.round(mhp(t) / 3); fxMember(t.id, 'heal'); SFX.play('heal'); updateBStat(); await bmsg(`${t.name}が 立ち上がった！`); } else await bmsg(`しかし ${t.name}は 倒れている……`); continue; }
        const v = Math.min(mhp(t) - t.hp, Math.round((sk.pow + m.lv * 3) * (.9 + Math.random() * .2)));
        t.hp += v; SFX.play('heal'); fxMember(t.id, 'heal'); updateBStat(); await bmsg(`${t.name}の HPが ${v} 回復した！`, 600);
      }
    } else if (sk.type === 'buff') {
      const ts = sk.target === 'allies' ? aliveMembers() : sk.target === 'ally' ? [G.mem[a.t]].filter(t => t.hp > 0) : [m];
      if (sk.extra === 'guard') for (const id of G.party) B.defend[id] = true;
      if (ts.length) await buffMembers(B, ts, sk.stat, sk.v, sk.turns);
    } else if (sk.type === 'regen') {
      const ts = sk.target === 'allies' ? aliveMembers() : sk.target === 'ally' ? [G.mem[a.t]].filter(t => t.hp > 0) : [m];
      const v = Math.round(sk.pow + m.lv * 1.2);
      for (const t of ts) { const pb = B.pb[t.id] = B.pb[t.id] || {}; pb.regen = { v, t: sk.turns }; fxMember(t.id, 'heal'); }
      SFX.play('heal'); updateBStat(); await bmsg(`${ts.length > 1 ? 'みんな' : ts[0].name}の傷が 少しずつ癒えていく……`, 650);
      if (sk.extraBuff) await buffMembers(B, ts, sk.extraBuff.stat, sk.extraBuff.v, sk.extraBuff.turns);
    } else if (sk.type === 'debuff' || sk.type === 'stun') {
      const ts = sk.target === 'enemies' ? B.es.filter(e => !e.dead) : [retarget(B, a.t)].filter(Boolean);
      for (const e of ts) {
        if (sk.type === 'debuff') await debuffEnemy(B, e, sk.stat, sk.v, sk.turns, sk.rate);
        if (sk.debuff) await debuffEnemy(B, e, sk.debuff.stat, sk.debuff.v, sk.debuff.turns, sk.rate);
        if (sk.type === 'stun' || sk.stunRate) { if (!(await stunEnemy(B, e, sk.type === 'stun' ? sk.rate : sk.stunRate)) && sk.type === 'stun') await bmsg(`${e.name}は ひるまなかった。`, 450); }
      }
    } else if (sk.type === 'guard') { for (const id of G.party) B.defend[id] = true; SFX.play('buff'); G.party.forEach(id => fxMember(id, 'buff')); await bmsg('みんなの守りが 固くなった！'); }
    else if (sk.type === 'kiup') { for (const t of aliveMembers()) { t.ki = Math.min(mki(t), t.ki + sk.pow); fxMember(t.id, 'ki'); } SFX.play('buff'); updateBStat(); await bmsg('みんなの気が みなぎった！'); }
  }
}
async function eAct(B, e) {
  if (e.st && e.st.stun) { e.st.stun = 0; await bmsg(`${e.name}は ひるんで 動けない！`, 550); return; }
  let sk = null; for (const s of (e.d.skills || [])) if (Math.random() < s.p) { sk = s; break; }
  const atk = eAtk(e);
  if (e.d.flee && Math.random() < e.d.flee) { SFX.play('run'); e.dead = true; e.fled = true; await bmsg(`${e.name}は 逃げ出した！`); return; }
  const ft = e.d.fx || 'hit';
  const el = e.d.el;
  if (!sk) { const t = pick(aliveMembers()); await bmsg(`${e.name}の 攻撃！`, 400); await hitMember(B, t, atk, 1, ft, el); return; }
  await bmsg(sk.msg.replace('{n}', e.name), 700);
  const sft = sk.fx || ft;
  if (sk.type === 'one') await hitMember(B, pick(aliveMembers()), atk, sk.pow, sft, el);
  else if (sk.type === 'all' || sk.type === 'explode') {
    if (sk.type === 'explode') { e.dead = true; e.hp = 0; SFX.play('boom'); fxEnemy(e, 'boom'); }
    for (const m of aliveMembers()) await hitMember(B, m, atk, sk.pow, sft, el);
  }
  else if (sk.type === 'ebuff') {
    const ts = sk.all ? B.es.filter(x => !x.dead) : [e];
    for (const x of ts) { x.up = x.up || {}; for (const k of sk.stat) x.up[k] = { v: sk.v || .3, t: (sk.turns || 3) + 1 }; fxEnemy(x, 'buff'); }
    SFX.play('buff'); await bmsg(`${sk.all && ts.length > 1 ? '敵みんな' : e.name}の ${sk.stat.map(k => ST_NAME[k]).join('と')}が 上がった！`, 700);
  }
  else if (sk.type === 'pdebuff') { const al = aliveMembers(); await debuffMembers(B, sk.all ? al : [pick(al)], sk.stat, sk.v || .25, sk.turns || 3); }
  else if (sk.type === 'pbleed') {
    const al = aliveMembers(), ts = sk.all ? al : [pick(al)];
    for (const m of ts) { await hitMember(B, m, atk, sk.pow || .9, sft, el); if (m.hp > 0) { const pb = B.pb[m.id] = B.pb[m.id] || {}; pb.bleed = { v: Math.max(2, Math.round(atk * .22)), t: sk.turns || 3 }; } }
    updateBStat(); await bmsg('深い傷を負った！（出血）', 500);
  } else if (sk.type === 'buff') { if (e.buff < 2) { e.buff++; fxEnemy(e, 'buff'); SFX.play('buff'); await bmsg(`${e.name}の 攻撃力が 上がった！`); } else await bmsg('しかし 何も起こらなかった。'); }
  else if (sk.type === 'heal') { const v = Math.round(e.d.hp * sk.pow); e.hp = Math.min(e.d.hp, e.hp + v); fxEnemy(e, 'heal'); SFX.play('heal'); await bmsg(`${e.name}は 態勢を立て直した！`); }
  else if (sk.type === 'kidrain') { for (const m of aliveMembers()) m.ki = Math.max(0, m.ki - sk.pow); updateBStat(); SFX.play('hurt'); await bmsg('みんなの気が 削がれた……'); }
}
async function victory(B) {
  const won = B.es.filter(e => !e.fled), exp = won.reduce((s, e) => s + e.d.exp, 0), gold = won.reduce((s, e) => s + e.d.gold, 0);
  bgm(null); SFX.play('win');
  await bmsg('戦いに 勝った！', 1100);
  if (exp) await bmsg(`それぞれ ${exp} の 経験値を得た。`, 900);
  if (gold) { G.money += gold; SFX.play('coin'); await bmsg(`${gold}文を 手に入れた。`, 900); }
  for (const e of won) if (e.d.drop && Math.random() < e.d.drop[1]) { addItem(e.d.drop[0]); SFX.play('item'); await bmsg(`${e.name}は ${ITEMS[e.d.drop[0]].name}を 落としていった！`, 1000); }
  // 控えの仲間も、半分の経験値を得る（置いていった仲間が弱くなりすぎないように）
  for (const id of G.waiting || []) { const m = G.mem[id]; m.exp += Math.floor(exp / 2); while (m.exp >= expAt(m.lv + 1) && m.lv < 99) m.lv++; }
  for (const id of G.party) {
    const m = G.mem[id]; if (m.hp <= 0) continue;
    m.exp += exp;
    while (m.exp >= expAt(m.lv + 1) && m.lv < 99) {
      const oh = mhp(m), ok = mki(m), oa = stat(m, 'atk'), od = stat(m, 'def'), before = skillsOf(m);
      m.lv++; m.hp += mhp(m) - oh; m.ki += mki(m) - ok; updateBStat();
      SFX.play('lvup'); fxMember(id, 'buff'); flashScreen('#ffe8a0');
      await bmsg(`${m.name}は レベル${m.lv}に 上がった！\nHP+${mhp(m) - oh}　気+${mki(m) - ok}　攻+${stat(m, 'atk') - oa}　守+${stat(m, 'def') - od}`, 1600);
      for (const s of skillsOf(m)) if (!before.includes(s)) { SFX.play('learn'); await bmsg(`${m.name}は「${SKILLS[s].name}」を 覚えた！`, 1400); }
    }
  }
}

// ---------- 合戦（軍と軍の戦い：兵力と士気） ----------
async function kassen(def) {
  hideDlg();
  const prevScene = G.scene, prevBgm = Audio8.cur;
  let retry = 0;
  while (true) {
    const lv = partyLv(), bonus = 1 + .3 * retry;
    const K = G.K = {
      def, turn: 1, us: { ...def.us, troops: Math.round(def.us.troops * bonus), mt: Math.round(def.us.troops * bonus), mm: 100, morale: def.us.morale || 100 }, them: { ...def.them, mt: def.them.troops, mm: 100, morale: def.them.morale || 100 },
      used: {}, aim: 0, storm: 0, guard: false, fx: [], hitUs: 0, hitThem: 0, lv,
    };
    SFX.play('drum'); flashScreen(); await sleep(300);
    G.scene = 'kassen'; bgm(def.bgm || 'war');
    const top = place(el('div', 'win kbar'), 8, 4, 368); const msgE = place(el('div', 'win bmsg'), 8, 196, 368, 84);
    const upd = () => {
      const bar = (s, c) => `<div class="kside"><b>${esc(s.name)}</b><div>兵力 ${Math.max(0, Math.round(s.troops))}<div class="bar"><i style="width:${Math.max(0, s.troops / s.mt * 100)}%;background:${c}"></i></div></div><div>士気 ${Math.max(0, Math.round(s.morale))}<div class="bar"><i style="width:${Math.max(0, s.morale)}%;background:#ffd040"></i></div></div></div>`;
      top.innerHTML = `<div class="ktitle">${esc(def.title)}　<span>${def.goal === 'survive' ? `あと ${Math.max(0, def.turns - K.turn + 1)} 刻 耐えよ` : `${K.turn} 刻目`}</span></div><div class="krow">${bar(K.us, '#6ab0ff')}${bar(K.them, '#ff7a6a')}</div>`;
    };
    const km = async (t, ms = 900) => { msgE.textContent = t; G.log.push({ n: '', t }); await waitOk(T(ms)); };
    upd(); await km(def.intro || `${def.title}――！`, 1400);
    let result = null;
    while (!result) {
      upd(); place(msgE, 112, 196, 264, 84); msgE.textContent = `${K.us.leader || G.mem[GAME.leader].name}の 采配は？`;
      const tac = (def.tactics || []).filter(t => !K.used[t.id]);
      const c = await choose([{ label: def.attackName || '攻めかかる' }, { label: '守りを固める' }, { label: '鼓舞する' }, { label: '策を用いる', disabled: !tac.length }], { x: 8, y: 172, w: 100, cancel: false, onMove: j => msgE.textContent = ['敵の兵力と士気を削る', '受ける被害を半分にし、士気を少し回復', '味方の士気を大きく回復する', '一度だけ使える特別な策'][j] });
      place(msgE, 8, 196, 368, 84);
      K.guard = false;
      const pw = (def.us.power + lv * 5) * (.6 + K.us.morale / 250);
      if (c === 0) {
        const dmg = Math.round(pw * (.8 + Math.random() * .4)), md = Math.round((6 + Math.random() * 4) * (K.aim ? 3 : 1));
        K.them.troops -= dmg; K.them.morale -= md; K.hitThem = 20; SFX.play(def.usFx === 'gun' ? 'gun' : def.usFx === 'slash' ? 'slash' : 'boom'); shake();
        await km(`${def.attackName || '攻めかかった'}！ 敵の兵 ${dmg} を討ち、士気を ${md} 削った！`);
        if (K.aim) { K.aim = 0; await km('狙いすました一撃に、敵がひるんでいる！'); }
      } else if (c === 1) { K.guard = true; K.us.morale = Math.min(100, K.us.morale + 6); SFX.play('buff'); await km('陣を固め、敵の攻めに備えた。'); }
      else if (c === 2) { const v = 18 + Math.round(Math.random() * 8); K.us.morale = Math.min(100, K.us.morale + v); SFX.play('buff'); await km(`${def.rally || '「チェストォ！ 退くな、薩摩の意地を見せぇ！」'}\n味方の士気が ${v} 上がった！`, 1400); }
      else if (c === 3) {
        const j = await choose(tac.map(t => ({ label: t.name, right: '' })), { x: 112, y: 120, w: 260, onMove: k => msgE.textContent = tac[k].desc });
        if (j >= 0) { const t = tac[j]; K.used[t.id] = 1; SFX.play('learn'); await km(t.msg, 1500); if (t.aim) K.aim = 1; if (t.storm) K.storm = t.storm; if (t.morale) K.them.morale -= t.morale; if (t.troops) K.them.troops -= t.troops; if (t.heal) K.us.troops = Math.min(K.us.mt, K.us.troops + t.heal); if (t.rally) K.us.morale = Math.min(100, K.us.morale + t.rally); }
      }
      upd();
      if (K.them.troops <= 0 || K.them.morale <= 0) { result = 'win'; break; }
      // 敵の番
      const ev = def.events && def.events[K.turn];
      if (ev) { await km(ev.msg, 1500); if (ev.us) K.us.troops -= ev.us; if (ev.um) K.us.morale -= ev.um; if (ev.tm) K.them.morale -= ev.tm; SFX.play(ev.sfx || 'boom'); shake(true); upd(); }
      let dmg = Math.round((def.them.power) * (K.storm ? .55 : 1) * (.8 + Math.random() * .4) * (1 + (K.turn - 1) * .04));
      if (K.guard) dmg = Math.round(dmg / 2);
      const md = Math.round(dmg / (def.moraleDiv || 14));
      K.us.troops -= dmg; K.us.morale -= md; K.hitUs = 20; SFX.play(def.themFx === 'gun' ? 'gun' : 'boom'); shake(true);
      await km(`${def.themAttack || '敵の攻撃！'} 味方の兵 ${dmg} が倒れ、士気が ${md} 下がった！`);
      if (K.storm) K.storm--;
      upd();
      if (K.us.troops <= 0 || K.us.morale <= 0) { result = 'lose'; break; }
      K.turn++;
      if (def.goal === 'survive' && K.turn > def.turns) { result = 'win'; break; }
    }
    top.remove(); msgE.remove();
    if (result === 'win') {
      G.scene = prevScene === 'kassen' ? 'map' : prevScene; G.K = null; Audio8.cur = null; if (prevBgm) bgm(prevBgm); SFX.play('win');
      return 'win';
    }
    G.scene = prevScene; G.K = null;
    bgm('sad');
    const again = await pickOne(null, def.loseMsg || '味方の陣が崩れた……', null, ['もう一度 采配をふるう', 'ひとまず退く（最後の記録へ）'], { x: 120, y: 110, w: 250 });
    if (again === 1) { Audio8.cur = null; throw GAMEOVER; }
    retry++; toast('味方の援軍が加わった！（兵力アップ）');
  }
}
function drawKassen() {
  const K = G.K, d = K.def;
  ctx.drawImage(bgImg(d.bg || 'field'), 0, 0); drawPlume(ctx, d.bg || 'field', G.frame);
  const cnt = (s, max) => Math.max(0, Math.ceil(s.troops / s.mt * max));
  const wob = Math.sin(G.frame / 10);
  // 敵（奥）
  const nT = cnt(K.them, 14);
  for (let i = 0; i < nT; i++) {
    const x = 260 + (i % 7) * 34 + (i >= 7 ? 16 : 0), y = 120 + (i >= 7 ? 30 : 0);
    if (d.themUnit === 'ship') ctx.drawImage(tileImg('S', (G.frame >> 4) & 1, 0), x, y - 10);
    else ctx.drawImage(charImg(d.themUnit || 'enemysoldier', 0, ((G.frame >> 4) + i) & 1), x, y - 38 + (K.hitThem > 0 ? (K.hitThem % 4) - 2 : 0));
  }
  // 味方（手前）
  const nU = cnt(K.us, 14);
  for (let i = 0; i < nU; i++) {
    const x = 20 + (i % 7) * 34 + (i >= 7 ? 16 : 0), y = 238 - (i >= 7 ? 26 : 0);
    if (d.usUnit === 'cannon') ctx.drawImage(tileImg('C', 0, 0), x, y - 16);
    else ctx.drawImage(charImg(d.usUnit || 'satsumasoldier', 3, ((G.frame >> 4) + i) & 1), x, y - 48 + (K.hitUs > 0 ? (K.hitUs % 4) - 2 : 0));
  }
  if (K.hitThem > 0) { K.hitThem--; for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#ffe080' : '#ff8a20'; ctx.beginPath(); ctx.arc(300 + Math.random() * 200, 100 + Math.random() * 60, 4 + Math.random() * 10, 0, 7); ctx.fill(); } }
  if (K.hitUs > 0) { K.hitUs--; for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#ffe080' : '#ff8a20'; ctx.beginPath(); ctx.arc(30 + Math.random() * 230, 200 + Math.random() * 40, 4 + Math.random() * 12, 0, 7); ctx.fill(); } }
  if (d.bg === 'storm' || d.bg === 'rain') for (let i = 0; i < 8; i++) { const x = Math.random() * CW, y = Math.random() * CH; ctx.strokeStyle = 'rgba(200,210,230,.5)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 16); ctx.stroke(); }
  ctx.fillStyle = '#f0ece0'; ctx.fillRect(24, 150 + wob, 2, 0);
}

// ---------- 立木打ち（タイミング遊び） ----------
async function tachiki(rounds = 5) {
  hideDlg();
  const box = place(el('div', 'win tachiki'), 40, 100, 304, 92);
  let score = 0;
  for (let r = 0; r < rounds; r++) {
    const zone = 40 + Math.random() * 40, zw = 14 - r * 1.5;
    let pos = 0, dir = 1, hit = null;
    const spd = 1.6 + r * .5;
    await new Promise(res => {
      const h = { tap: true, onKey(k) { if (k === 'ok') { hit = pos; UI.pop(h); res(); } } };
      UI.push(h);
      const tick = () => {
        if (hit !== null) return;
        pos += dir * spd; if (pos > 100 || pos < 0) dir *= -1;
        box.innerHTML = `<div class="ttl">立木打ち　${r + 1} / ${rounds}本目　（Aで打つ）</div><div class="tk"><i class="z" style="left:${zone}%;width:${zw}%"></i><i class="c" style="left:${pos}%"></i></div><div class="tks">命中 ${score}</div>`;
        requestAnimationFrame(tick);
      };
      tick();
    });
    const ok = hit >= zone - 1 && hit <= zone + zw + 1;
    if (ok) { score++; SFX.play('chest'); flashScreen(); } else SFX.play('miss');
    box.querySelector('.tks').textContent = ok ? 'チェストォッ！ 見事！' : '……外れた';
    await sleep(600);
  }
  box.remove();
  return score;
}

// ---------- セーブ・タイトル ----------
// 記録は3つまで。記録1は、以前の版の記録（ひとつだけの記録）を引き継ぐ
const SAVE_KEY = GAME.saveKey, SLOTS = 3, slotKey = i => SAVE_KEY + '-s' + i;
function saveData() { const inRoom = G.mapId === '_room'; return { party: G.party, waiting: G.waiting || [], mem: G.mem, inv: G.inv, money: G.money, flags: G.flags, chapter: G.chapter, mapId: inRoom ? G.ret.map : G.mapId, px: inRoom ? G.ret.x : G.px, py: inRoom ? G.ret.y : G.py, dir: G.dir, dex: G.dex, ride: false, playTime: G.playTime, place: G.map ? G.map.name : '', t: Date.now() }; }
function save(slot = G.slot || 1) { try { G.slot = slot; localStorage.setItem(slotKey(slot), JSON.stringify(saveData())); seriesUpdate(); return true; } catch (e) { return false; } }
function loadData(slot = G.slot || 1) {
  try { let s = localStorage.getItem(slotKey(slot)); if (!s && slot === 1) s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
const fmtTime = sec => `${Math.floor(sec / 3600)}時間${String(Math.floor(sec / 60) % 60).padStart(2, '0')}分`;
function slotLabel(i) {
  const d = loadData(i); if (!d) return { label: `記録${i}　―― 空き ――`, empty: true };
  const lv = d.mem && d.mem[GAME.leader] ? d.mem[GAME.leader].lv : 1;
  return { label: `記録${i}　${CH_NAME[d.chapter] || ''}　${d.place || ''}`, right: `Lv${lv}　${fmtTime(d.playTime || 0)}` };
}
async function pickSlot(title, forLoad) {
  const items = [1, 2, 3].map(i => { const l = slotLabel(i); return { label: l.label, right: l.right || '', disabled: forLoad && l.empty }; });
  const i = await choose(items, { x: 16, y: 60, w: 352, title, start: Math.max(0, (G.slot || 1) - 1) });
  return i < 0 ? 0 : i + 1;
}
async function saveMenu() {
  const n = await pickSlot('どこに記録しますか？'); if (!n) return;
  if (n !== G.slot && loadData(n) && !await ask(null, `記録${n}には 別の冒険が残っています。\n上書きしますか？`)) return;
  await N(save(n) ? `記録${n}に 冒険を記録しました。\n（プレイ時間 ${fmtTime(G.playTime)}）` : '記録できませんでした（ブラウザの保存が無効です）。');
}
function applySave(d) { Object.assign(G, { party: d.party, waiting: d.waiting || [], mem: d.mem, inv: d.inv, money: d.money, flags: d.flags, chapter: d.chapter, dex: d.dex || { p: {}, e: {}, l: {}, end: {} }, ride: false, playTime: d.playTime || 0 }); fixEquips(); enterMap(d.mapId, d.px, d.py, d.dir); }
function newGame() { const L = GAME.leader; G.party = [L]; G.waiting = []; G.mem = { [L]: mkMember(L, 1) }; G.inv = { ...GAME.startInv }; G.money = GAME.startMoney; G.flags = {}; G.chapter = 0; G.dex = { p: {}, e: {}, l: {}, end: {} }; G.log = []; G.playTime = 0; G.ride = false; enterMap(...GAME.start); }
async function gameOver() {
  await fadeOut(); G.scene = 'title'; hideDlg(); bgm('sad');
  await card('力尽きた……', '最後に記録した場所から やり直します');
  const d = loadData(G.slot);
  if (d) applySave(d); else newGame();
  restAll(); await fadeIn();
}
async function title() {
  G.scene = 'title'; G.map = null; G.weather = GAME.titleWeather || 'embers'; bgm('title');
  const t = el('div', 'title'); t.innerHTML = `<div class="tser">日本國物語</div><div class="tt">${GAME.title}</div><div class="ts">${GAME.sub}</div><div class="tv">${GAME.ver}</div>`;
  const has = [1, 2, 3].some(i => loadData(i));
  while (true) {
    const i = await choose(['はじめから', { label: 'つづきから', disabled: !has }, '設定', '日本國物語 トップへ'], { x: 112, y: 192, w: 160, cancel: false, start: has ? 1 : 0 });
    if (i === 2) { await settings(); continue; }
    if (i === 3) { location.href = '../'; return; }
    let slot = 0;
    if (i === 1) { slot = await pickSlot('どの記録から 始めますか？', true); if (!slot) continue; }
    else {
      const free = [1, 2, 3].find(k => !loadData(k));
      slot = await pickSlot('どの記録に 残しますか？（あとで変えられます）'); if (!slot) continue;
      if (loadData(slot) && !free) { if (!await ask(null, `記録${slot}は 新しい冒険で上書きされます。\nよろしいですか？`)) continue; }
      else if (loadData(slot)) { if (!await ask(null, `記録${slot}には 冒険が残っています。\n（記録${free}は空いています）上書きしますか？`)) continue; }
    }
    G.slot = slot;
    await fadeOut(); t.remove(); setWeather(null);
    if (i === 0) { newGame(); run(STORY.opening); } else { applySave(loadData(slot)); await fadeIn(); }
    return;
  }
}
function fit() {
  const pad = $('#pad'), touch = matchMedia('(pointer: coarse)').matches || /touch=1/.test(location.search), rot = !!(touch && OPT.rot && innerHeight > innerWidth);
  const VW = rot ? innerHeight : innerWidth, VH = rot ? innerWidth : innerHeight, land = VW > VH * 1.15;
  document.body.classList.toggle('rot', rot); document.body.classList.toggle('land', land && touch); document.body.classList.toggle('touch', touch);
  const wrap = $('#wrap'); wrap.style.width = rot ? VW + 'px' : ''; wrap.style.height = rot ? VH + 'px' : '';
  const st = $('#stick'), slot = land ? $('#padL') : $('#stickSlot'); if (st && slot && st.parentNode !== slot) slot.appendChild(st);
  const top = $('#topbar'), padH = touch && !land ? (pad.offsetHeight || 220) + (top.offsetHeight || 0) : 0, padW = touch && land ? 400 : 0;
  const k = Math.min((VW - padW) / SW, (VH - padH) / SH);
  screenEl.style.transform = `scale(${k})`;
  const h = $('#holder'); h.style.width = SW * k + 'px'; h.style.height = SH * k + 'px';
  updateTopbar();
}
const CH_NAME = GAME.chapters || ['序章', '第一章', '第二章', '第三章', '第四章', '第五章', '第六章', '第七章', '第八章', '第九章', '第十章', '第十一章', '第十二章', '終章'];
function updateTopbar() {
  const e = $('#tbInfo'); if (!e) return;
  e.textContent = G.map && G.scene !== 'title' ? `${CH_NAME[G.chapter] || ''}　${G.mapId === '_room' ? G.map.name : (G.map.name || '')}\n${G.money ?? 0} 文　⏱${fmtTime(G.playTime)}` : '';
}
setInterval(updateTopbar, 1000);
addEventListener('orientationchange', () => setTimeout(fit, 300));
if (window.visualViewport) visualViewport.addEventListener('resize', fit);
addEventListener('resize', fit);
addEventListener('load', () => { Audio8.vol.bgm = OPT.bgm; Audio8.vol.sfx = OPT.sfx; fit(); updateHud(); title(); loop(); });
