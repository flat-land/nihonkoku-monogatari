'use strict';
// ===== 会話の顔絵（主要人物だけ、ドットではなく線と塗りで高画質に描く） =====
// 町の人・兵士などのモブには顔絵を出さない。顔は 300x360 で描き、会話窓の右上に重ねて表示する。
const MOBS = new Set(['senpai', 'rivalkid', 'commander', 'elder', 'woman', 'child', 'boy', 'merchant', 'smith', 'fisher', 'umakata', 'innkeeper', 'monk', 'student', 'soldier', 'satsumasoldier', 'enemysoldier', 'choshusoldier', 'bakufusoldier', 'govsoldier', 'pot', 'chest', 'boat', 'horse', 'sign']);
// 髪型の上書き（鳥山明ふうの逆立った髪）
const HI_HAIR = { shinpachi: 'spiky', kirino: 'spiky', rival: 'spiky', ryoma: 'wavy' };
const SATSUMA_MON = new Set(['shinpachi', 'senkichi', 'saigo', 'okubo', 'togo', 'oyama', 'kirino', 'rival', 'komatsu', 'beppu']);
function isMain(id) { return typeof id === 'string' && PEOPLE[id] && !MOBS.has(id) && !!PEOPLE[id].por; }
const HI_CACHE = {};
function hiPortrait(id) {
  const P0 = PEOPLE[id], por = typeof P0.por === 'function' ? P0.por() : P0.por, key = id + JSON.stringify(por);
  if (HI_CACHE[key]) return HI_CACHE[key];
  const c = mk(300, 360), x = c.getContext('2d');
  x.translate(150, 0); x.scale(1.2, 1.2); x.translate(-150, -6);   // 顔を大きめに（肩は下で切れる）
  if (id === 'tsun') paintTsunHi(x); else paintHi(x, id, por);
  return (HI_CACHE[key] = c);
}
function paintHi(x, id, p) {
  const LINE = '#2a1a1e', cx = 148;
  const skin = p.skin && p.skin !== '#3a2e2a' ? p.skin : '#f3cfa8', skS = shade(skin, -.13), skSS = shade(skin, -.27);
  const hair = p.hair || '#1e1c28', black = parseInt(hair.slice(1, 3), 16) < 0x60;
  const hairL = black ? mix(hair, '#6a7ab8', .5) : shade(hair, .35), hairD = shade(hair, -.35);
  const style = HI_HAIR[id] || p.style || 'mage', W = 46 + ((p.fw || 7) - 7) * 6, chinY = 222 + ((p.fw || 7) > 8 ? 6 : 0);
  const cl = p.cloth || '#3a4a6a', clL = shade(cl, .22), clD = shade(cl, -.35);
  const path = (fn, fill, stroke = LINE, lw = 3) => { x.beginPath(); fn(); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); } };
  const poly = (pts, fill, stroke, lw) => path(() => { x.moveTo(...pts[0]); for (const q of pts.slice(1)) x.lineTo(...q); x.closePath(); }, fill, stroke, lw);
  const lin = (x0, y0, x1, y1, a, b) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const r = rnd(id.length * 97 + 13);
  // 髪の房：根元の2点から先端へ、ふくらみのある葉の形。房ごとに陰影とハイライトを入れる
  const clump = (b1, b2, tip, bend = 0) => {
    const m1 = [(b1[0] + tip[0]) / 2 + bend, (b1[1] + tip[1]) / 2], m2 = [(b2[0] + tip[0]) / 2 + bend, (b2[1] + tip[1]) / 2];
    const sh = () => { x.moveTo(...b1); x.quadraticCurveTo(...m1, ...tip); x.quadraticCurveTo(...m2, ...b2); x.closePath(); };
    path(sh, lin(b1[0], b1[1], tip[0], tip[1], hair, hairL), LINE, 3);
    path(() => { x.moveTo((b1[0] * 2 + b2[0]) / 3, (b1[1] * 2 + b2[1]) / 3); x.quadraticCurveTo(m1[0] * .7 + m2[0] * .3, m1[1] * .7 + m2[1] * .3, tip[0] * .85 + b1[0] * .15, tip[1] * .85 + b1[1] * .15); }, null, mix(hairL, '#ffffff', .25), 2.2);
  };
  // --- 後ろ髪 ---
  if (style === 'woman') { path(() => x.ellipse(cx, 150, W + 18, 78, 0, 0, 7), hair); }
  if (style === 'spiky' || style === 'wavy' || style === 'boy') {
    const pts = [], n = style === 'boy' ? 9 : 11, R0 = W + 6, R1 = style === 'boy' ? W + 38 : W + 62;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * (1.02 + i / n * .96), a2 = a + Math.PI * .96 / n / 2, len = R1 + (r() - .5) * 26;
      pts.push([cx + Math.cos(a) * R0, 128 + Math.sin(a) * R0 * .95]);
      if (i < n) pts.push([cx + Math.cos(a2) * len, 128 + Math.sin(a2) * len * .9 - 6]);
    }
    path(() => x.ellipse(cx, 112, W + 12, 64, 0, 0, 7), hair, LINE, 3);
    if (style === 'wavy') { for (let i = 0; i < 12; i++) { const a = Math.PI * (1 + i / 11), rr = W + 22 + r() * 10; path(() => x.arc(cx + Math.cos(a) * rr, 126 + Math.sin(a) * rr * .9, 26, 0, 7), lin(0, 60, 0, 160, hairL, hair), LINE, 3); } }
    else {
      // 王冠のようにギザギザの、太い房のシルエット（一枚の形で塗って線で囲む）
      const n2 = style === 'boy' ? 5 : 6, Rv = W + 6, Rt = W + (style === 'boy' ? 32 : 50), pts = [];
      for (let i = 0; i <= n2; i++) {
        const a = Math.PI * (1.06 + i / n2 * .88); pts.push([cx + Math.cos(a) * Rv, 118 + Math.sin(a) * Rv * .95]);
        if (i < n2) { const am = a + Math.PI * .88 / n2 / 2 + .06, len = Rt + (r() - .5) * 16; pts.push([cx + Math.cos(am) * len, 118 + Math.sin(am) * len * .92]); }
      }
      poly([[cx - W - 6, 170], ...pts, [cx + W + 6, 170]], lin(cx, 20, cx, 150, hairL, hair));
      for (let i = 1; i < pts.length - 1; i += 2) path(() => { x.moveTo(cx + (pts[i][0] - cx) * .45, 118 + (pts[i][1] - 118) * .45); x.lineTo(cx + (pts[i][0] - cx) * .82, 118 + (pts[i][1] - 118) * .82); }, null, mix(hairL, '#ffffff', .2), 2.5);
    }
    // 横に流れる房
    clump([cx - W + 2, 112], [cx - W + 8, 150], [cx - W - 30, 204], -6); clump([cx + W - 8, 150], [cx + W - 2, 112], [cx + W + 30, 200], 6);
  }
  // --- 体 ---
  const body = () => { x.moveTo(cx - 26, 238); x.quadraticCurveTo(cx - 92, 250, cx - 128, 292); x.lineTo(cx - 146, 362); x.lineTo(cx + 146, 362); x.lineTo(cx + 128, 292); x.quadraticCurveTo(cx + 92, 250, cx + 26, 238); x.closePath(); };
  path(body, lin(cx - 100, 250, cx + 120, 340, clL, clD));
  // 首
  poly([[cx - 22, 190], [cx + 20, 190], [cx + 24, 252], [cx - 24, 252]], skin, LINE, 3);
  x.save(); x.beginPath(); x.rect(cx - 30, 190, 60, 60); x.clip(); path(() => x.ellipse(cx - 2, 206, 34, 22, 0, 0, 7), skSS, null); x.restore();
  const col = p.collar;
  if (col === 'west') {
    poly([[cx - 26, 240], [cx + 26, 240], [cx, 340]], '#f4f2ee');
    poly([[cx - 6, 250], [cx + 6, 250], [cx + 10, 330], [cx, 344], [cx - 10, 330]], p.tie || '#5a1a22');
    poly([[cx - 26, 240], [cx - 50, 256], [cx - 12, 352], [cx - 4, 338]], clD); poly([[cx + 26, 240], [cx + 50, 256], [cx + 12, 352], [cx + 4, 338]], clD);
  } else if (col === 'uniform') {
    path(() => { x.moveTo(cx - 36, 232); x.lineTo(cx + 36, 232); x.lineTo(cx + 40, 260); x.lineTo(cx - 40, 260); x.closePath(); }, shade(cl, -.45));
    poly([[cx - 36, 236], [cx - 20, 236], [cx - 20, 256], [cx - 38, 256]], '#b82a2a', LINE, 2); poly([[cx + 36, 236], [cx + 20, 236], [cx + 20, 256], [cx + 38, 256]], '#b82a2a', LINE, 2);
    for (const by of [284, 314, 344]) path(() => x.arc(cx, by, 5, 0, 7), '#f0d050', LINE, 2);
    for (const s of [-1, 1]) path(() => x.ellipse(cx + s * 108, 270, 26, 9, s * .35, 0, 7), '#e0b840', LINE, 2.5);
  } else {
    // 着物：白い襟（襦袢）と、その外の襟。左前ではなく右前（見る人から見て、左の襟が上）
    poly([[cx - 22, 240], [cx + 22, 240], [cx + 2, 292]], skS, null);
    const kc = col === 'robe' ? '#8a3a22' : shade(cl, -.45);
    poly([[cx + 20, 238], [cx + 34, 242], [cx + 10, 318], [cx + 2, 300]], '#f6f2e8'); poly([[cx + 34, 242], [cx + 50, 250], [cx + 18, 330], [cx + 10, 318]], kc);
    poly([[cx - 20, 238], [cx - 34, 242], [cx + 10, 334], [cx + 18, 322]], '#f6f2e8'); poly([[cx - 34, 242], [cx - 50, 250], [cx + 2, 346], [cx + 10, 334]], kc);
    if (col === 'robe') poly([[cx - 120, 300], [cx - 90, 280], [cx + 60, 362], [cx + 10, 362]], '#a0502a');
    if (SATSUMA_MON.has(id) || p.mon) { const mx = cx - 84, my = 306; path(() => x.arc(mx, my, 13, 0, 7), '#f6f2e8', LINE, 2); x.strokeStyle = LINE; x.lineWidth = 3; x.beginPath(); x.arc(mx, my, 8, 0, 7); x.moveTo(mx - 8, my); x.lineTo(mx + 8, my); x.moveTo(mx, my - 8); x.lineTo(mx, my + 8); x.stroke(); }
  }
  // 体の陰
  x.save(); x.beginPath(); body(); x.clip(); x.fillStyle = 'rgba(20,10,30,.25)'; x.beginPath(); x.moveTo(cx + 60, 240); x.quadraticCurveTo(cx + 90, 300, cx + 70, 362); x.lineTo(cx + 160, 362); x.lineTo(cx + 160, 240); x.fill(); x.restore();
  // --- 顔 ---
  for (const s of [-1, 1]) path(() => x.ellipse(cx + s * (W + 2), 152, 9, 15, 0, 0, 7), skS);
  const face = () => { x.moveTo(cx - W, 118); x.bezierCurveTo(cx - W, 66, cx + W, 66, cx + W, 118); x.bezierCurveTo(cx + W + 2, 166, cx + W - 10, 196, cx + 18, chinY - 10); x.quadraticCurveTo(cx + 2, chinY + 2, cx - 4, chinY); x.quadraticCurveTo(cx - 20, chinY - 6, cx - W + 10, 196); x.bezierCurveTo(cx - W - 2, 172, cx - W - 2, 150, cx - W, 118); x.closePath(); };
  path(face, skin, null);
  x.save(); x.beginPath(); face(); x.clip();
  x.fillStyle = skS; x.beginPath(); x.moveTo(cx + W * .5, 100); x.bezierCurveTo(cx + W * .75, 150, cx + W * .5, 190, cx + 6, chinY + 4); x.lineTo(cx + W + 10, chinY + 10); x.lineTo(cx + W + 10, 100); x.fill();
  x.fillStyle = 'rgba(120,60,50,.18)'; x.fillRect(cx - W, 104, W * 2, 26);
  x.restore();
  path(face, null, LINE, 3);
  // ひげ
  const bd = p.beard;
  if (bd === 'full' || bd === 'whiskers') {
    const bc = bd === 'whiskers' ? hair : shade(hair, .05);
    path(() => { x.moveTo(cx - W - 2, 150); x.bezierCurveTo(cx - W, 215, cx - 30, chinY + 26, cx - 2, chinY + 30); x.bezierCurveTo(cx + 30, chinY + 26, cx + W, 215, cx + W + 2, 150); x.lineTo(cx + W - 8, 160); x.bezierCurveTo(cx + W - 14, 200, cx + 20, 206, cx, 206); x.bezierCurveTo(cx - 20, 206, cx - W + 14, 200, cx - W + 8, 160); x.closePath(); }, bc, LINE, 2.5);
    for (let i = 0; i < 18; i++) { const a = r() * Math.PI, rr = W * .8; x.strokeStyle = shade(bc, .3); x.lineWidth = 1.5; x.beginPath(); const sx = cx + Math.cos(a) * rr, sy = 190 + Math.sin(a) * 30; x.moveTo(sx, sy); x.lineTo(sx + (r() - .5) * 6, sy + 10); x.stroke(); }
  }
  if (bd === 'mustache' || bd === 'full' || bd === 'whiskers') path(() => { x.moveTo(cx - 2, 188); x.quadraticCurveTo(cx - 26, 186, cx - 34, 200); x.quadraticCurveTo(cx - 14, 194, cx - 2, 196); x.quadraticCurveTo(cx + 12, 194, cx + 30, 200); x.quadraticCurveTo(cx + 22, 186, cx - 2, 188); }, hair, LINE, 2);
  if (bd === 'stubble') { x.fillStyle = 'rgba(40,50,70,.18)'; x.beginPath(); x.ellipse(cx - 2, 206, W * .7, 22, 0, 0, 7); x.fill(); }
  // 目
  const eye = p.eye || 'normal', ey = 152, iris = p.iris || '#7a4426';
  const EH = { big: 26, normal: 21, gentle: 17, sharp: 15, narrow: 5, closed: 0 }[eye] ?? 19, tilt = { sharp: 7, normal: 2, big: 0, gentle: -3 }[eye] ?? 1;
  for (const s of [-1, 1]) {
    const ex = cx - 2 + s * 25, inner = ex - s * 15, outer = ex + s * 16;
    if (EH <= 5) { path(() => { x.moveTo(inner, ey); x.quadraticCurveTo(ex, ey + (eye === 'closed' ? 6 : -3), outer, ey - tilt * .5); }, null, LINE, 3.5); continue; }
    const almond = () => { x.moveTo(inner, ey + 2); x.quadraticCurveTo(ex, ey - EH - 2, outer, ey - tilt); x.quadraticCurveTo(ex, ey + EH * .75, inner, ey + 2); x.closePath(); };
    path(almond, '#fffdf8', null);
    x.save(); x.beginPath(); almond(); x.clip();
    const ir = Math.min(14, EH * .66), ix = ex + s * 1, iy = ey - 3;
    const g = x.createLinearGradient(ix, iy - ir, ix, iy + ir); g.addColorStop(0, shade(iris, -.65)); g.addColorStop(.55, iris); g.addColorStop(1, shade(iris, .55));
    path(() => x.arc(ix, iy, ir, 0, 7), g, shade(iris, -.6), 1.5);
    path(() => x.arc(ix, iy, ir * .45, 0, 7), '#120a0c', null);
    path(() => x.arc(ix - 3, iy - 4, Math.max(2, ir * .3), 0, 7), '#ffffff', null);
    path(() => x.arc(ix + 3.5, iy + 3, 1.6, 0, 7), 'rgba(255,255,255,.8)', null);
    x.fillStyle = 'rgba(60,30,40,.18)'; x.fillRect(inner - 20, ey - EH - 4, 60, 4);
    x.restore();
    path(() => { x.moveTo(inner - s * 1, ey + 1); x.quadraticCurveTo(ex, ey - EH - 3, outer + s * 3, ey - tilt - 1); x.lineTo(outer + s * 8, ey - tilt + 3); }, null, LINE, 6);
    path(() => { x.moveTo(ex - s * 4, ey + EH * .55); x.quadraticCurveTo(ex + s * 8, ey + EH * .5, outer - s * 1, ey - tilt + 3); }, null, shade(LINE, .2), 1.5);
    // 眉
    const bw = 2.5 + (p.brow || 1) * 1.6, byy = ey - EH - 12 - (eye === 'big' ? 2 : 0);
    path(() => { x.moveTo(inner + s * 2, byy + (eye === 'sharp' ? 6 : 1)); x.quadraticCurveTo(ex, byy - 6, outer + s * 4, byy + (eye === 'gentle' ? 4 : 1)); }, null, p.browc || shade(hair, -.2), bw);
  }
  if (p.glasses) for (const s of [-1, 1]) { x.strokeStyle = '#3a3a40'; x.lineWidth = 2.5; x.beginPath(); x.arc(cx - 2 + s * 25, ey - 2, 19, 0, 7); x.stroke(); if (s < 0) { x.beginPath(); x.moveTo(cx - 8, ey - 6); x.quadraticCurveTo(cx - 2, ey - 10, cx + 4, ey - 6); x.stroke(); } }
  // 鼻と口
  path(() => { x.moveTo(cx - 1, 166); x.lineTo(cx - 5, 180); x.lineTo(cx + 1, 182); }, null, skSS, 2.5);
  const my = 200 + ((p.fw || 7) > 8 ? 3 : 0), mo = p.mouth;
  if (mo === 'smile') path(() => { x.moveTo(cx - 16, my - 2); x.quadraticCurveTo(cx - 2, my + 9, cx + 13, my - 3); }, null, LINE, 3);
  else if (mo === 'open') { path(() => x.ellipse(cx - 2, my + 2, 11, 8, 0, 0, 7), '#6a1e24', LINE, 2.5); path(() => x.ellipse(cx - 2, my + 6, 7, 3, 0, 0, 7), '#e07070', null); }
  else if (mo === 'firm') path(() => { x.moveTo(cx - 15, my); x.lineTo(cx + 12, my - 1); }, null, LINE, 3.5);
  else path(() => { x.moveTo(cx - 11, my); x.quadraticCurveTo(cx - 2, my + 3, cx + 9, my - 1); }, null, LINE, 3);
  if (p.blush) for (const s of [-1, 1]) path(() => x.ellipse(cx - 2 + s * 32, 178, 12, 5, 0, 0, 7), 'rgba(240,110,110,.35)', null);
  if (p.scar) path(() => { x.moveTo(cx - 44, 160); x.lineTo(cx - 20, 186); }, null, '#b04a40', 2.5);
  // --- 前髪 ---
  const fr = (pts, fill = lin(cx, 60, cx, 170, hairL, hair)) => poly(pts, fill);
  if (style === 'spiky' || style === 'boy') {
    // 前髪：額にかかる、先のとがった大きな房
    fr([[cx - W - 8, 158], [cx - W - 4, 90], [cx - 20, 62], [cx + 28, 64], [cx + W + 4, 92], [cx + W + 10, 156], [cx + W - 8, 120], [cx + W - 14, 158], [cx + 22, 112], [cx + 12, 150], [cx - 2, 114], [cx - 16, 156], [cx - 22, 112], [cx - 40, 150], [cx - W + 4, 118]]);
    for (const [a, b, c2, d] of [[cx - 34, 82, cx - 36, 132], [cx - 4, 74, cx - 8, 128], [cx + 26, 80, cx + 18, 124], [cx + W - 10, 96, cx + W - 10, 140]]) path(() => { x.moveTo(a, b); x.quadraticCurveTo((a + c2) / 2 + 6, (b + d) / 2, c2, d); }, null, mix(hairL, '#ffffff', .2), 2.5);
  } else if (style === 'wavy') {
    for (const [a, b, rr] of [[cx - 36, 100, 22], [cx - 10, 88, 24], [cx + 18, 90, 24], [cx + 42, 104, 20], [cx - 50, 128, 14], [cx + 52, 130, 14]]) path(() => x.arc(a, b, rr, 0, 7), lin(a, b - rr, a, b + rr, hairL, hair));
    fr([[cx - 40, 110], [cx - 30, 140], [cx - 18, 114], [cx - 4, 136], [cx + 8, 112], [cx + 24, 138], [cx + 34, 110]]);
  } else if (style === 'woman') {
    path(() => x.ellipse(cx, 58, W + 2, 30, 0, 0, 7), lin(cx, 30, cx, 90, hairL, hair));
    path(() => x.ellipse(cx, 36, 26, 18, 0, 0, 7), lin(cx, 20, cx, 54, hairL, hair));
    fr([[cx - W - 8, 168], [cx - W - 6, 90], [cx, 76], [cx + W + 6, 90], [cx + W + 8, 168], [cx + W - 4, 120], [cx + 6, 98], [cx - W + 4, 122]]);
    poly([[cx + 30, 40], [cx + 70, 20], [cx + 72, 24], [cx + 32, 46]], '#d8b040', LINE, 2); path(() => x.arc(cx + 72, 20, 6, 0, 7), '#d84a6a', LINE, 2);
    poly([[cx - 40, 46], [cx - 6, 46], [cx - 6, 54], [cx - 40, 54]], '#c89a4a', LINE, 2);
  } else if (style === 'bald') {
    path(() => x.ellipse(cx - 18, 92, 14, 6, -.3, 0, 7), 'rgba(255,255,255,.4)', null);
  } else {
    // 髷（mage）、短髪（short）、洋風の七三（west）
    const top = style === 'west' ? 62 : 64;
    fr([[cx - W - 6, 150], [cx - W - 4, 96], [cx - 24, top], [cx + 24, top], [cx + W + 4, 96], [cx + W + 6, 150], [cx + W - 4, 120], ...(style === 'short' ? [[cx + 24, 108], [cx + 16, 128], [cx + 4, 106], [cx - 8, 126], [cx - 18, 104], [cx - 30, 124]] : style === 'west' ? [[cx + 30, 100], [cx - 10, 112], [cx - 26, 104]] : [[cx + 20, 104], [cx - 20, 104]]), [cx - W + 4, 120]]);
    for (const k of [-24, -6, 12, 30]) path(() => { x.moveTo(cx + k, top + 8); x.quadraticCurveTo(cx + k * 1.4, 88, cx + k * 1.6, 104); }, null, hairL, 2);
    if (style === 'mage') {
      path(() => { x.moveTo(cx - 12, 74); x.bezierCurveTo(cx - 16, 40, cx - 8, 16, cx + 4, 18); x.bezierCurveTo(cx + 16, 20, cx + 14, 44, cx + 12, 74); x.closePath(); }, lin(cx, 18, cx, 74, hairL, hair));
      path(() => { x.moveTo(cx - 4, 26); x.quadraticCurveTo(cx - 8, 46, cx - 6, 66); }, null, mix(hairL, '#ffffff', .25), 2.2);
      poly([[cx - 13, 62], [cx + 13, 62], [cx + 13, 72], [cx - 13, 72]], '#f2ece0', LINE, 2.5);
    }
    if (style === 'west') path(() => { x.moveTo(cx - 10, 66); x.quadraticCurveTo(cx - 14, 84, cx - 12, 104); }, null, hairD, 2.5);
  }
  // --- 帽子 ---
  const hat = p.hat;
  if (hat === 'kepi') { poly([[cx - W + 4, 104], [cx - W + 10, 46], [cx + W - 10, 46], [cx + W - 4, 104]], lin(cx - W, 50, cx + W, 100, '#2a3870', '#121a3a')); poly([[cx - W + 4, 92], [cx + W - 4, 92], [cx + W - 3, 104], [cx - W + 3, 104]], '#b82a2a', LINE, 2.5); path(() => x.ellipse(cx, 108, W + 6, 10, 0, 0, Math.PI), '#141414'); path(() => x.arc(cx, 72, 8, 0, 7), '#f0d050', LINE, 2); }
  if (hat === 'jingasa') { path(() => x.ellipse(cx, 92, W + 64, 22, 0, 0, 7), lin(cx, 70, cx, 114, '#4a4038', '#1e1a18')); path(() => x.ellipse(cx, 80, W + 4, 18, 0, 0, 7), '#3a322c'); path(() => x.arc(cx, 76, 8, 0, 7), '#d8b040', LINE, 2); }
  if (hat === 'eboshi') { poly([[cx - 30, 92], [cx - 26, 6], [cx + 24, 0], [cx + 30, 92]], '#1a1a1a'); }
}
// ツン（薩摩犬）
function paintTsunHi(x) {
  const LINE = '#120c0a', cx = 150, f = '#2e2624', fL = '#5a4a44', m = '#6a5048';
  const path = (fn, fill, lw = 3) => { x.beginPath(); fn(); if (fill) { x.fillStyle = fill; x.fill(); } x.strokeStyle = LINE; x.lineWidth = lw; x.lineJoin = 'round'; x.stroke(); };
  path(() => { x.moveTo(cx - 110, 362); x.quadraticCurveTo(cx - 100, 250, cx - 40, 220); x.lineTo(cx + 40, 220); x.quadraticCurveTo(cx + 100, 250, cx + 110, 362); x.closePath(); }, f);
  for (const s of [-1, 1]) path(() => { x.moveTo(cx + s * 30, 110); x.lineTo(cx + s * 70, 30); x.lineTo(cx + s * 82, 120); x.closePath(); }, f);
  for (const s of [-1, 1]) path(() => { x.moveTo(cx + s * 40, 104); x.lineTo(cx + s * 68, 52); x.lineTo(cx + s * 72, 112); x.closePath(); }, '#8a5a50', 2);
  path(() => x.ellipse(cx, 160, 78, 72, 0, 0, 7), f);
  path(() => x.ellipse(cx - 20, 130, 40, 26, -.3, 0, 7), fL, 0.1);
  path(() => x.ellipse(cx, 196, 42, 32, 0, 0, 7), m);
  path(() => x.ellipse(cx, 176, 13, 9, 0, 0, 7), '#0a0606'); path(() => x.ellipse(cx - 4, 173, 4, 2, 0, 0, 7), '#8a8a90', 0.1);
  path(() => { x.moveTo(cx, 186); x.lineTo(cx, 198); x.moveTo(cx - 16, 204); x.quadraticCurveTo(cx, 212, cx + 16, 204); }, null, 3);
  path(() => x.ellipse(cx + 2, 220, 10, 14, 0, 0, 7), '#e06a7a', 2);
  for (const s of [-1, 1]) { path(() => x.ellipse(cx + s * 34, 146, 11, 12, 0, 0, 7), '#1a0e08'); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx + s * 34 - 4, 141, 4, 0, 7); x.fill(); }
  path(() => { x.moveTo(cx - 70, 240); x.quadraticCurveTo(cx, 268, cx + 70, 240); x.lineTo(cx + 74, 256); x.quadraticCurveTo(cx, 286, cx - 74, 256); x.closePath(); }, '#c02020');
  path(() => x.arc(cx, 276, 9, 0, 7), '#d8b040', 2);
}
