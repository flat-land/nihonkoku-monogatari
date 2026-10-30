'use strict';
// ===== 宮崎編のマップ（記号＝タイル。common/gfx.js の TP を参照） =====
function grid(w, h, f) { return Array.from({ length: h }, () => Array(w).fill(f)); }
function rect(g, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = c; }
let _BLD = [];
function house(g, x, y, w, door, roof = 'H') {
  rect(g, x, y, w, 2, roof); rect(g, x, y + 2, w, 1, 'h'); g[y + 2][door] = 'D';
  const v = (x * 7 + y * 13 + w * 3) % 5, b = { x, y, w, door, roofCh: roof, roof: ['hip', 'gable', 'irimoya', 'hip', 'gable'][v] };
  if (roof === 'H' && w >= 5 && (v === 1 || v === 3)) {
    b.wing = v === 1 ? 'L' : 'R'; const c0 = b.wing === 'L' ? x : x + w - 2;
    for (let i = c0; i < c0 + 2; i++) { const a = g[y - 1] && g[y - 1][i]; g[y][i] = a && '.,su;'.includes(a) ? a : '.'; }
  }
  _BLD.push(b); return [door, y + 2];
}
// 鳥居つきの神社（本殿は通れない。w は幅）
function shrine(g, x, y, w = 5) { rect(g, x, y, w, 2, 'H'); rect(g, x, y + 2, w, 1, 'h'); _BLD.push({ x, y, w, door: x + (w >> 1), style: 'jinja' }); return { x: x + (w >> 1) - 1, y: y + 4, img: 'torii' }; }
function dots(g, c, list) { for (const [x, y] of list) if (g[y] && g[y][x] !== undefined) g[y][x] = c; }
function border(g, c = 'T') { const h = g.length, w = g[0].length; rect(g, 0, 0, w, 1, c); rect(g, 0, h - 1, w, 1, c); rect(g, 0, 0, 1, h, c); rect(g, w - 1, 0, 1, h, c); }
function road(g, pts) {
  for (let k = 0; k < pts.length - 1; k++) {
    let [x, y] = pts[k]; const [x1, y1] = pts[k + 1];
    while (true) { const t = g[y][x]; g[y][x] = t === '~' || t === '=' ? '=' : ','; if (x === x1 && y === y1) break; if (x !== x1) x += Math.sign(x1 - x); else y += Math.sign(y1 - y); }
  }
}
const pot = (x, y, id, item, n) => ({ x, y, spr: 'pot', pot: id, item, n });
const chest = (x, y, id, item, n) => ({ x, y, spr: 'chest', pot: id, item, n });
const npc = (x, y, spr, talk, o = {}) => ({ x, y, spr, talk, ...o });
const ch = (...c) => () => c.includes(G.chapter);
const chFrom = (a, b = 99) => () => G.chapter >= a && G.chapter <= b;
const hs = (x, y, name, o = {}) => ({ x, y, name, ...o });
const TK = (id) => (n) => STORY.talk(id, n);
const IN_HYUGA = () => [1, 2, 3, 5].includes(G.chapter);

// 野山の敵：場所と時期で変わる
function hyugaEnc() {
  const x = G.px, y = G.py;
  if (G.chapter >= 3 && Math.random() < .4) return ENC.later;
  if (y <= 12 && x <= 16) return ENC.takachiho;
  if (y <= 13) return ENC.north;
  if (x <= 14 && y <= 36) return ENC.mountain;
  if (x >= 26 && y <= 34) return ENC.coast;
  return ENC.south;
}

const MAPS = {
  // ---------------- 長井村（延岡の北） ----------------
  nagai: {
    build() {
      const g = grid(30, 22, '.'); border(g, 'T');
      rect(g, 0, 9, 30, 1, ','); rect(g, 26, 0, 2, 22, '~'); rect(g, 26, 9, 2, 1, '='); g[9][29] = ',';
      const H = [house(g, 3, 3, 5, 5), house(g, 10, 3, 5, 12), house(g, 17, 3, 7, 20), house(g, 3, 12, 5, 5), house(g, 10, 12, 4, 11)];
      for (const [dx] of H.slice(0, 3)) rect(g, dx, 6, 1, 3, ',');
      for (const [dx] of H.slice(3)) g[15][dx] = ',';
      rect(g, 4, 15, 1, 1, ','); rect(g, 3, 16, 20, 1, ','); rect(g, 22, 10, 1, 7, ',');
      rect(g, 16, 12, 8, 3, 'u'); rect(g, 3, 18, 20, 3, 'F');
      g[9][0] = F('kaisan') || G.chapter >= 1 ? ',' : 'T';
      g[9][29] = IN_HYUGA() ? ',' : 'T';
      dots(g, 'T', [[2, 2], [9, 2], [15, 2], [25, 2], [24, 12], [2, 13], [15, 11]]);
      if (G.chapter === 0 && !F('kaisan')) dots(g, 'X', [[24, 6], [24, 7]]);
      if (F('kaisan') && G.chapter === 0) dots(g, 'f', [[22, 7]]);
      return {
        name: '長井村', g, place: 'nagai', bgm: () => G.chapter === 0 && F('wadagoe') && !F('toppa') ? 'night' : 'town', noRide: true,
        night: () => G.chapter === 0 && F('kaisan') && !F('toppa'),
        labels: [[5, 3, '源太の家'], [12, 3, 'お菊の家（医者）'], [20, 3, '児玉家（西郷の宿陣）'], [5, 12, 'よろず屋'], [0, 9, '可愛岳へ'], [29, 9, '野山へ']],
        warps: [{ x: 0, y: 9, to: 'enodake', x2: 13, y2: 28, dir: 3, cond: () => F('kaisan') || G.chapter >= 1 }, { x: 29, y: 9, to: 'hyuga', x2: 23, y2: 5, dir: 2, cond: IN_HYUGA }],
        houses: [
          hs(...H[0], '甲斐家（源太の家）', { npcs: [npc(5, 4, 'jiji', STORY.jiji, { dir: 0 })], items: [chest(9, 4, 'home', 'hiyajiru', 3)] }),
          hs(...H[1], 'お菊の家（医者）', { npcs: [npc(5, 4, 'elder', TK('kikuFather')), npc(8, 4, 'kiku', STORY.kikuHome, { cond: () => G.chapter >= 1 && !G.party.includes('kiku') && !(G.waiting || []).includes('kiku') })], items: [pot(2, 4, 'kh1', 'shiitake', 2)] }),
          hs(...H[2], '児玉家（西郷の宿陣）', { w: 15, place: 'nagai', npcs: [npc(7, 3, 'saigo', STORY.saigo0, { cond: () => G.chapter === 0 && !F('toppa'), mark: true }), npc(4, 4, 'ogura', STORY.ogura0, { cond: () => G.chapter === 0 && !F('oguraBye') }), npc(10, 4, 'shinpachi', STORY.shinpachi0, { cond: () => G.chapter === 0 && !F('wadagoe') })], items: [chest(12, 3, 'kodama', 'koshu')] }),
          hs(...H[3], 'よろず屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('nagai'))] }),
          hs(...H[4], '村の家', { npcs: [npc(5, 4, 'woman', TK('nagaiW'))], items: [pot(8, 4, 'nh1', 'obiten', 2)] }),
        ],
        npcs: [
          npc(13, 8, 'kiku', STORY.kiku0, { cond: () => G.chapter === 0 && !F('kiku'), mark: true, dir: 0 }),
          npc(18, 8, 'satsuhei', TK('satsuhei'), { cond: () => G.chapter === 0 && !F('toppa') }), npc(23, 8, 'satsuhei', TK('satsuhei2'), { cond: () => G.chapter === 0 && !F('toppa') }),
          npc(21, 13, 'satsuhei', TK('satsuhei3'), { cond: () => G.chapter === 0 && !F('toppa'), dir: 1 }),
          npc(7, 10, 'child', TK('nagaiKid')), npc(14, 10, 'elder', TK('nagaiElder')),
          npc(2, 8, 'satsuhei', STORY.toEnodake, { cond: () => G.chapter === 0 && F('kaisan') && !F('toppa'), mark: true, dir: 2 }),
          { x: 25, y: 10, spr: 'sign', talk: () => N('立て札：「北川の橋。\n東へ行けば 延岡」') },
          pot(28, 3, 'nv1', 'hiyajiru', 2), chest(1, 20, 'nv2', 'goishi'),
        ],
      };
    },
  },
  // ---------------- 可愛岳（夜の山越え） ----------------
  enodake: {
    build() {
      const g = grid(26, 30, 'M');
      const r = rnd(1877);
      // 曲がりくねった猟師の道
      road(g, [[13, 29], [13, 24], [6, 24], [6, 17], [18, 17], [18, 10], [9, 10], [9, 5], [13, 5], [13, 2]]);
      for (let y = 1; y < 29; y++) for (let x = 1; x < 25; x++) if (g[y][x] === 'M' && [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx] === ',') && r() < .75) g[y][x] = r() < .55 ? 'q' : '.';
      rect(g, 10, 1, 7, 4, '.'); g[0][13] = 'M'; for (const [x, y] of [[5, 18], [19, 12], [8, 6], [12, 25]]) g[y][x] = '.';
      for (let i = 0; i < 18; i++) { const x = 2 + (r() * 22) | 0, y = 2 + (r() * 26) | 0; if (g[y][x] === '.') g[y][x] = 'q'; }
      return {
        name: G.chapter === 0 ? '可愛岳（夜）' : '可愛岳', g, bbg: 'night', place: 'enodake', bgm: () => G.chapter === 0 && !F('toppa') ? 'war' : 'field', noRide: true,
        night: () => G.chapter === 0, weather: () => G.chapter === 0 ? 'fireflies' : null,
        enc: () => G.chapter === 0 && !F('toppa') ? ENC.enodake : ENC.north, encTiles: ['.', ',', 'q'], encL: () => G.chapter === 0 ? 5 : fieldL(), rare: RARE.early,
        labels: [[13, 2, '山頂'], [13, 29, '長井村へ']],
        warps: [{ x: 13, y: 29, to: 'nagai', x2: 1, y2: 9, dir: 2 }],
        triggers: [{ x: 10, y: 3, w: 7, h: 2, cond: () => G.chapter === 0 && !F('toppa'), boss: 'soldier', bx: 13, by: 2, run: STORY.toppa, warn: '山頂の先に、政府軍の陣のかがり火が見える！\n【ボス戦】準備はいいですか？' }],
        npcs: [chest(5, 18, 'en1', 'hiyajiru', 3), chest(19, 12, 'en2', 'shochu'), chest(8, 6, 'en3', 'kiba2'), pot(12, 25, 'en4', 'shiitake', 2)],
      };
    },
  },

  // ---------------- 日向の国（野山） ----------------
  hyuga: {
    build() {
      const W = 40, H = 50, g = grid(W, H, '.'), r = rnd(1883);
      for (let y = 0; y < H; y++) { const cx = 33 + Math.round(2 * Math.sin(y / 6)); for (let x = cx; x < W; x++) g[y][x] = '~'; }
      for (let x = 0; x < W; x++) { const s0 = 47 + Math.round(Math.sin(x / 4)); for (let y = s0; y < H; y++) g[y][x] = '~'; }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx] === '~')) g[y][x] = 's';
      // 九州山地（西）
      for (let y = 0; y < 44; y++) { const mx = 9 + Math.round(3 * Math.sin(y / 5)); for (let x = 0; x < mx; x++) g[y][x] = 'M'; }
      rect(g, 15, 0, 6, 2, 'M');
      // 森・竹林・田畑
      for (let i = 0; i < 40; i++) { const cx = 2 + r() * (W - 4), cy = 2 + r() * (H - 4), rad = 1.5 + r() * 2.6; for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) if (g[y] && g[y][x] === '.' && (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad + r() * 2) g[y][x] = r() < .9 ? 'q' : 'b'; }
      for (const [x0, y0, w, h] of [[20, 26, 5, 3], [16, 40, 5, 3], [22, 12, 4, 2]]) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if ('.qb'.includes(g[y][x])) g[y][x] = 'u';
      // 川：五ヶ瀬川・耳川・大淀川
      for (const [y0, x0] of [[8, 13], [17, 11], [32, 9]]) for (let x = x0; x < 36; x++) { const y = y0 + Math.round(Math.sin(x / 3)); if (g[y][x] !== '~') g[y][x] = '~'; }
      // 街道
      road(g, [[24, 4], [24, 10], [30, 10], [30, 9]]);
      road(g, [[24, 4], [12, 4], [12, 5]]);
      road(g, [[29, 10], [29, 18], [31, 18]]);
      road(g, [[29, 18], [28, 18], [28, 30]]);
      road(g, [[28, 24], [16, 24], [6, 24], [6, 20]]);
      road(g, [[28, 30], [20, 30], [20, 38], [14, 38]]);
      road(g, [[28, 30], [28, 42], [25, 42]]);
      road(g, [[25, 42], [31, 42], [31, 41]]);
      road(g, [[14, 38], [4, 38], [4, 45]]);
      const towns = [[24, 4], [30, 9], [12, 5], [31, 18], [6, 20], [28, 30], [14, 38], [25, 42], [31, 41], [4, 45]];
      for (const [x, y] of towns) { for (let j = y - 1; j <= y + 1; j++) for (let i = x - 1; i <= x + 1; i++) if (g[j] && 'qbM'.includes(g[j][i])) g[j][i] = '.'; g[y][x] = ','; }
      return {
        name: '日向の国', g, bbg: 'hfield', bgm: 'field', place: null, onEnter: () => STORY.hyugaTip(),
        weather: () => null,
        enc: hyugaEnc, encTiles: ['.', 'q', 'u', 's'], encL: () => fieldL(), rare: RARE.early,
        props: [
          { x: 24, y: 4, icon: 'town', label: '長井村' }, { x: 30, y: 9, icon: 'castle', label: '延岡' }, { x: 12, y: 5, icon: 'shrine', label: '高千穂' },
          { x: 31, y: 18, icon: 'port', label: '美々津' }, { x: 6, y: 20, icon: 'town', label: '椎葉' }, { x: 28, y: 30, icon: 'castle', label: '宮崎' },
          { x: 14, y: 38, icon: 'buke', label: '都城' }, { x: 25, y: 42, icon: 'buke', label: '飫肥' }, { x: 31, y: 41, icon: 'shrine', label: '鵜戸神宮' }, { x: 4, y: 45, icon: 'seki', label: '鹿児島へ' },
        ],
        labels: [[24, 4, '長井村'], [30, 9, '延岡'], [12, 5, '高千穂'], [31, 18, '美々津'], [6, 20, '椎葉'], [28, 30, '宮崎'], [14, 38, '都城'], [25, 42, '飫肥'], [31, 41, '鵜戸神宮'], [4, 45, '鹿児島へ'], [33, 33, '青島'], [20, 9, '五ヶ瀬川'], [20, 32, '大淀川']],
        warps: [
          { x: 24, y: 4, to: 'nagai', x2: 28, y2: 9, dir: 1 }, { x: 30, y: 9, to: 'nobeoka', x2: 15, y2: 20, dir: 3 }, { x: 12, y: 5, to: 'takachiho', x2: 15, y2: 22, dir: 3 },
          { x: 31, y: 18, to: 'mimitsu', x2: 1, y2: 9, dir: 2 }, { x: 6, y: 20, to: 'shiiba', x2: 13, y2: 18, dir: 3 }, { x: 28, y: 30, to: 'miyazaki', x2: 15, y2: 20, dir: 3 },
          { x: 14, y: 38, to: 'miyakonojo', x2: 28, y2: 11, dir: 1 }, { x: 25, y: 42, to: 'obi', x2: 26, y2: 10, dir: 1 }, { x: 31, y: 41, to: 'udo', x2: 10, y2: 14, dir: 3 },
          { x: 4, y: 45, to: 'kagoshima', x2: 1, y2: 10, dir: 2, cond: () => G.chapter >= 3 },
        ],
        npcs: [
          npc(29, 11, 'umakata', () => rentHorse(30), { dir: 1 }), npc(28, 11, 'horse', () => rentHorse(30)),
          { x: 5, y: 45, spr: 'sign', talk: () => N(G.chapter >= 3 ? '立て札：「この先 鹿児島。」' : '立て札：「この先 鹿児島。\n（今は用がない）」') },
          chest(22, 21, 'h1', 'kaigara'), chest(17, 44, 'h2', 'koshu'), chest(27, 26, 'h3', 'katsuo', 2), pot(19, 14, 'h4', 'hyuganatsu', 2), chest(12, 29, 'h5', 'obisugi2'),
        ],
      };
    },
  },

  // ---------------- 延岡 ----------------
  nobeoka: {
    build() {
      const g = grid(30, 22, ';'); border(g, 'T');
      // 延岡城跡（千人殺しの石垣）
      rect(g, 2, 1, 10, 6, 'A'); rect(g, 4, 2, 6, 3, 'U'); rect(g, 4, 1, 6, 1, 'Q');
      rect(g, 15, 0, 1, 22, ','); rect(g, 1, 9, 28, 1, ','); g[21][15] = ',';
      const H = [house(g, 17, 2, 5, 19), house(g, 23, 2, 5, 25), house(g, 2, 11, 5, 4), house(g, 8, 11, 5, 10), house(g, 17, 11, 6, 20), house(g, 24, 11, 4, 25)];
      for (const [dx, dy] of H) rect(g, dx, dy + 1, 1, dy === 4 ? 4 : 1, ',');
      rect(g, 2, 16, 12, 1, ','); rect(g, 17, 16, 11, 1, ',');
      rect(g, 2, 18, 12, 3, 'F'); dots(g, 'T', [[13, 3], [28, 7], [1, 14], [28, 19], [20, 19], [24, 19]]);
      return {
        name: G.chapter >= 2 ? '延岡（明治十三年）' : '延岡', g, place: 'nobeoka', bgm: 'town', noRide: true,
        labels: [[6, 2, '延岡城跡'], [19, 2, '内藤家'], [25, 2, G.chapter >= 2 ? '亮天社（学校）' : '政府軍の屯所'], [4, 11, '武具屋'], [10, 11, '道具屋'], [20, 11, '宿'], [25, 11, '民家'], [15, 21, '野山へ']],
        warps: [{ x: 15, y: 21, to: 'hyuga', x2: 30, y2: 10, dir: 0 }],
        houses: [
          hs(...H[0], '内藤家', { w: 13, npcs: [npc(6, 3, 'naito', STORY.naito, { mark: true })], items: [chest(11, 3, 'nb1', 'katana1')] }),
          hs(...H[1], G.chapter >= 2 ? '亮天社（学校）' : '政府軍の屯所', { npcs: [npc(5, 3, G.chapter >= 2 ? 'student' : 'soldier', TK(G.chapter >= 2 ? 'ryotensha' : 'tonsho'))] }),
          hs(...H[2], '武具屋', { kind: 'shop', npcs: [npc(5, 3, 'smith', () => shopTalk('nobeoka'))] }),
          hs(...H[3], '道具屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('nobeokaDougu'))] }),
          hs(...H[4], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[5], '民家', { npcs: [npc(5, 4, 'woman', TK('nobeokaW'))], items: [pot(8, 4, 'nb2', 'jidori')] }),
        ],
        look: { '6,4': () => N('延岡城の跡。高く積まれた石垣は「千人殺し」と呼ばれる。\n（一つの石を外すと 石垣が崩れ、千人を倒すという）') },
        npcs: [
          npc(14, 8, 'soldier', TK('nobeokaSoldier'), { cond: () => G.chapter === 1 }), npc(10, 10, 'child', TK('nobeokaKid')), npc(22, 10, 'elder', TK('nobeokaElder')),
          pot(28, 15, 'nb3', 'hiyajiru', 2),
        ],
      };
    },
  },
  // ---------------- 高千穂 ----------------
  takachiho: {
    build() {
      const g = grid(30, 24, '.'); border(g, 'T');
      rect(g, 15, 0, 1, 24, ','); rect(g, 1, 12, 28, 1, ',');
      const tor = shrine(g, 18, 2, 5);
      rect(g, 20, 6, 1, 6, ',');
      const H = [house(g, 3, 3, 5, 5), house(g, 9, 3, 4, 10), house(g, 3, 14, 5, 5), house(g, 9, 14, 5, 11)];
      for (const [dx, dy] of H) rect(g, dx, dy + 1, 1, dy === 5 ? 6 : 2, ',');
      // 高千穂峡（深い谷と川）
      rect(g, 17, 15, 12, 8, 'M'); rect(g, 18, 17, 10, 3, '~'); rect(g, 24, 14, 1, 9, '='); g[23][24] = 'T';
      rect(g, 22, 14, 2, 1, ','); g[13][22] = ','; g[13][23] = ',';
      dots(g, 'T', [[2, 8], [7, 9], [12, 8], [26, 8], [27, 3], [2, 20], [13, 20]]);
      rect(g, 2, 18, 12, 3, 'F');
      return {
        name: '高千穂', g, place: 'takachiho', bgm: () => 'town', noRide: true,
        weather: () => 'fireflies', props: [tor],
        labels: [[20, 2, '天岩戸神社'], [5, 3, 'よろず屋'], [10, 3, '宿'], [5, 14, '神楽宿'], [11, 14, '民家'], [24, 17, '高千穂峡'], [15, 0, '天岩戸の奥へ'], [15, 23, '野山へ']],
        warps: [{ x: 15, y: 23, to: 'hyuga', x2: 12, y2: 6, dir: 0 }, { x: 15, y: 0, to: 'iwato', x2: 12, y2: 22, dir: 3 }],
        houses: [
          hs(...H[0], 'よろず屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('takachiho'))] }),
          hs(...H[1], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[2], '神楽宿', { npcs: [npc(5, 4, 'elder', TK('kaguraElder'))], items: [chest(9, 3, 'tk1', 'kaguramen')] }),
          hs(...H[3], '民家', { npcs: [npc(5, 4, 'woman', TK('takachihoW'))], items: [pot(8, 4, 'tk2', 'shiitake', 2)] }),
        ],
        look: { '24,18': () => N('高千穂峡。柱のような岩の崖の間を、川が流れている。\n上から 細い滝が落ちている。') },
        npcs: [
          npc(22, 9, 'kannushi', () => STORY.shrine('iwato'), { dir: 0 }),
          npc(18, 11, 'osuzu', STORY.osuzu, { cond: () => !F('osuzu'), mark: true, dir: 0 }),
          npc(8, 11, 'child', TK('takachihoKid')), npc(26, 11, 'elder', TK('takachihoElder')),
          pot(1, 22, 'tk3', 'hiyajiru', 3),
        ],
      };
    },
  },
  // 天岩戸の奥（落ち武者が隠れる谷）
  iwato: {
    build() {
      const g = grid(24, 24, 'T'), r = rnd(31);
      road(g, [[12, 23], [12, 18], [4, 18], [4, 10], [19, 10], [19, 4], [12, 4], [12, 2]]);
      for (let y = 1; y < 23; y++) for (let x = 1; x < 23; x++) if (g[y][x] === 'T' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx] === ',') && r() < .6) g[y][x] = r() < .5 ? 'q' : '.';
      rect(g, 9, 1, 7, 3, '.'); g[1][12] = 'c'; rect(g, 14, 14, 6, 3, '~'); for (const [x, y] of [[5, 12], [20, 5], [7, 17]]) g[y][x] = '.';
      return {
        name: '天岩戸の奥', g, bbg: 'mountain', place: 'takachiho', bgm: () => F('ochiDone') ? 'field' : 'battle', noRide: true, weather: () => 'fireflies',
        enc: () => F('ochiDone') ? null : ENC.takachiho, encTiles: ['.', ',', 'q'], encL: () => fieldL(), rare: RARE.early,
        labels: [[12, 1, '岩屋'], [12, 23, '高千穂へ']],
        warps: [{ x: 12, y: 23, to: 'takachiho', x2: 15, y2: 1, dir: 0 }],
        triggers: [{ x: 10, y: 3, w: 5, h: 2, cond: () => G.chapter >= 1 && F('ochiQuest') && !F('ochiDone'), boss: 'ochiB', bx: 12, by: 2, run: STORY.ochiBoss, warn: '岩屋の前に、刀を抜いた男たちがいる！\n【ボス戦】準備はいいですか？' }],
        npcs: [chest(5, 12, 'iw1', 'magatama'), chest(20, 5, 'iw2', 'jidori', 2), chest(7, 17, 'iw3', 'horoku', 3)],
      };
    },
  },
  // ---------------- 美々津（耳川の河口の港） ----------------
  mimitsu: {
    build() {
      const g = grid(28, 20, ';'); border(g, 'T');
      rect(g, 0, 14, 28, 6, '~'); rect(g, 22, 0, 6, 14, '~'); rect(g, 1, 13, 21, 1, 's'); rect(g, 21, 1, 1, 13, 's');
      rect(g, 0, 9, 21, 1, ','); g[9][0] = ',';
      const H = [house(g, 2, 3, 5, 4), house(g, 8, 3, 5, 10), house(g, 14, 3, 5, 16), house(g, 2, 10, 4, 3), house(g, 8, 10, 5, 10)];
      for (const [dx, dy] of H) if (dy === 5) rect(g, dx, 6, 1, 3, ',');
      rect(g, 15, 14, 1, 4, 'p'); dots(g, 'S', [[12, 16], [18, 17]]);
      dots(g, 'P', [[19, 11], [14, 11], [1, 12]]);
      return {
        name: '美々津', g, bbg: 'nada', place: 'mimitsu', bgm: () => F('taifuQ') && !F('taifuDone') ? 'war' : 'town', noRide: true,
        weather: () => F('taifuQ') && !F('taifuDone') ? 'rain' : null,
        labels: [[4, 3, '回船問屋'], [10, 3, '浜の店'], [16, 3, '宿'], [3, 10, '辰五郎の家'], [10, 10, '民家'], [15, 15, '桟橋'], [0, 9, '野山へ']],
        warps: [{ x: 0, y: 9, to: 'hyuga', x2: 30, y2: 18, dir: 1 }],
        triggers: [{ x: 13, y: 12, w: 5, h: 2, cond: () => F('taifuQ') && !F('taifuDone'), boss: 'tatsu', bx: 15, by: 13, run: STORY.taifuBoss, warn: '沖から 台風が迫っている！ 船を守れ！\n【ボス戦】準備はいいですか？' }],
        houses: [
          hs(...H[0], '回船問屋', { npcs: [npc(5, 4, 'merchant', STORY.mimitsuBoss, { mark: true })], items: [chest(8, 3, 'mm1', 'katsuo', 2)] }),
          hs(...H[1], '浜の店', { kind: 'shop', npcs: [npc(5, 3, 'fisher', () => shopTalk('mimitsu'))] }),
          hs(...H[2], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[3], '辰五郎の家', { npcs: [npc(4, 4, 'woman', TK('tatsuWife'))], items: [pot(8, 4, 'mm2', 'obiten', 2)] }),
          hs(...H[4], '民家', { npcs: [npc(5, 4, 'elder', TK('mimitsuElder'))] }),
        ],
        npcs: [
          npc(15, 12, 'tatsu', STORY.tatsu, { cond: () => !F('tatsu') && !(F('taifuQ') && !F('taifuDone')), mark: true }),
          npc(6, 12, 'child', TK('mimitsuKid')), npc(18, 8, 'fisher', TK('mimitsuFisher')),
          pot(20, 2, 'mm3', 'shiitake', 2),
        ],
      };
    },
  },
  // ---------------- 宮崎 ----------------
  miyazaki: {
    build() {
      const g = grid(30, 22, '.'); border(g, 'T');
      rect(g, 15, 1, 1, 21, ','); rect(g, 1, 10, 28, 1, ','); g[21][15] = ',';
      rect(g, 1, 17, 28, 3, '~'); rect(g, 15, 17, 1, 3, '='); rect(g, 1, 16, 28, 1, 's'); g[16][15] = ',';
      const tor = shrine(g, 22, 1, 5);
      rect(g, 24, 5, 1, 5, ',');
      const H = [house(g, 2, 2, 5, 4), house(g, 8, 2, 6, 11, 'Q'), house(g, 2, 12, 5, 4), house(g, 8, 12, 5, 10), house(g, 17, 12, 5, 19), house(g, 23, 12, 5, 25)];
      for (const [dx, dy] of H) rect(g, dx, dy + 1, 1, dy === 4 ? 5 : 1, ',');
      dots(g, 'T', [[20, 2], [28, 6], [20, 7], [1, 8]]); dots(g, 'P', [[3, 15], [26, 15], [7, 15]]);
      return {
        name: G.chapter >= 5 ? '宮崎（宮崎県庁）' : '宮崎', g, place: 'miyazaki', bgm: () => G.chapter >= 5 ? 'ending' : 'town', noRide: true, props: [tor],
        weather: () => G.chapter >= 5 ? 'petals' : null,
        labels: [[24, 1, '宮崎神宮'], [4, 2, '武具屋'], [11, 2, G.chapter >= 5 ? '宮崎県庁' : '県の出張所'], [4, 12, '道具屋'], [10, 12, '宿'], [19, 12, '川越の宿'], [25, 12, '民家'], [15, 18, '大淀川'], [15, 21, '野山へ']],
        warps: [{ x: 15, y: 21, to: 'hyuga', x2: 28, y2: 31, dir: 0 }],
        houses: [
          hs(...H[0], '武具屋', { kind: 'shop', npcs: [npc(5, 3, 'smith', () => shopTalk('miyazaki'))] }),
          hs(...H[1], G.chapter >= 5 ? '宮崎県庁' : '鹿児島県 宮崎出張所', { w: 13, npcs: [npc(6, 3, 'official', TK('kencho'))], items: [chest(11, 3, 'mz1', 'bowler')] }),
          hs(...H[2], '道具屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('miyazakiDougu'))] }),
          hs(...H[3], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[4], '川越の宿', { npcs: [npc(5, 4, 'kawagoe', STORY.kawagoe, { cond: () => !G.party.includes('kawagoe') && !(G.waiting || []).includes('kawagoe') && G.chapter >= 2 && G.chapter < 5, mark: true })], items: [pot(8, 4, 'mz2', 'hyuganatsu', 2)] }),
          hs(...H[5], '民家', { npcs: [npc(5, 4, 'woman', TK('miyazakiW'))] }),
        ],
        npcs: [
          npc(26, 7, 'kannushi', () => STORY.shrine('jingu'), { dir: 0 }),
          npc(14, 9, 'kawagoe', STORY.kawagoeBack, { cond: () => G.chapter === 2 && F('kawagoe') && STORY.signCount() >= 3 && !F('kenpakuDone'), mark: true }),
          npc(18, 9, 'kiku', STORY.finale, { cond: () => G.chapter === 5 && !F('cleared'), mark: true }),
          npc(8, 9, 'child', TK('miyazakiKid')), npc(22, 9, 'elder', TK('miyazakiElder')),
          pot(1, 15, 'mz3', 'katsuo'),
        ],
      };
    },
  },
  // ---------------- 都城 ----------------
  miyakonojo: {
    build() {
      const g = grid(30, 22, '.'); border(g, 'T');
      rect(g, 1, 11, 29, 1, ','); g[11][29] = ',';
      rect(g, 1, 9, 28, 1, 'g'); rect(g, 1, 13, 28, 1, 'g');
      const H = [house(g, 2, 5, 5, 4), house(g, 8, 5, 6, 10), house(g, 16, 5, 7, 19), house(g, 2, 14, 5, 4), house(g, 9, 14, 5, 11), house(g, 18, 14, 6, 21)];
      for (const [dx, dy] of H) { if (dy === 7) rect(g, dx, 8, 1, 3, ','); else rect(g, dx, 12, 1, 4, ','); }
      for (const [dx, dy] of H.slice(3)) { rect(g, dx, 17, 1, 1, ','); }
      rect(g, 1, 17, 27, 1, ','); rect(g, 25, 12, 1, 5, ',');
      rect(g, 2, 18, 22, 3, 'u'); dots(g, 'K', [[26, 6], [27, 6]]); rect(g, 24, 3, 5, 4, 'W');
      dots(g, 'T', [[2, 2], [9, 2], [15, 2], [23, 2], [26, 19], [28, 19]]);
      return {
        name: '都城', g, place: 'miyakonojo', bgm: () => 'town', noRide: true,
        labels: [[4, 5, '弓師の店'], [10, 5, '宿'], [19, 5, '郷士の集会所'], [4, 14, '平蔵の家'], [11, 14, '民家'], [21, 14, '島津邸'], [26, 3, '弓の稽古場'], [29, 11, '野山へ']],
        warps: [{ x: 29, y: 11, to: 'hyuga', x2: 15, y2: 38, dir: 2 }],
        houses: [
          hs(...H[0], '弓師の店', { kind: 'shop', npcs: [npc(5, 3, 'smith', () => shopTalk('miyakonojo'))] }),
          hs(...H[1], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[2], '郷士の集会所', { w: 15, npcs: [npc(7, 3, 'hantaiB', STORY.hantai, { cond: () => G.chapter === 2 && !F('sign_miyakonojo'), mark: true }), npc(4, 4, 'student', TK('goshi')), npc(10, 4, 'student', TK('goshi'))] }),
          hs(...H[3], '平蔵の家', { npcs: [npc(5, 4, 'woman', TK('heizoWife'))], items: [chest(8, 3, 'mk1', 'yumi2')] }),
          hs(...H[4], '民家', { npcs: [npc(5, 4, 'elder', TK('miyakonojoElder'))], items: [pot(8, 4, 'mk2', 'jidori')] }),
          hs(...H[5], '島津邸', { w: 13, npcs: [npc(6, 3, 'elder', TK('shimazuke'))] }),
        ],
        npcs: [
          npc(26, 7, 'heizo', STORY.heizo, { cond: () => !F('heizo'), mark: true, dir: 0 }),
          npc(7, 12, 'child', TK('miyakonojoKid')), npc(16, 10, 'elder', TK('miyakonojoElder2')),
          pot(28, 20, 'mk3', 'akumaki'),
        ],
      };
    },
  },
  // ---------------- 飫肥 ----------------
  obi: {
    build() {
      const g = grid(28, 22, '.'); border(g, 'T');
      // 飫肥城（石垣と大手門）
      rect(g, 2, 1, 12, 6, '#'); rect(g, 3, 2, 10, 4, '.'); dots(g, 'P', [[4, 3], [11, 3]]); g[6][7] = 'G'; g[6][8] = 'G';
      rect(g, 7, 7, 2, 3, ','); rect(g, 1, 10, 27, 1, ','); g[10][27] = ',';
      rect(g, 1, 9, 6, 1, '#'); rect(g, 10, 9, 17, 1, '#'); rect(g, 1, 11, 26, 1, '#'); dots(g, ',', [[16, 9], [22, 9], [4, 11], [10, 11], [18, 11], [24, 11]]);
      const H = [house(g, 14, 5, 5, 16), house(g, 20, 5, 5, 22), house(g, 2, 13, 5, 4), house(g, 8, 13, 5, 10), house(g, 16, 13, 5, 18), house(g, 22, 13, 5, 24)];
      for (const [dx, dy] of H) { if (dy === 7) rect(g, dx, 8, 1, 1, ','); else rect(g, dx, 12, 1, 3, ','); }
      rect(g, 2, 18, 24, 3, 'q');
      return {
        name: '飫肥', g, place: 'obi', bgm: 'town', noRide: true,
        labels: [[7, 1, '飫肥城'], [16, 5, '振徳堂（藩校）'], [22, 5, '小倉家'], [4, 13, '道具屋'], [10, 13, '宿'], [18, 13, '小村家'], [24, 13, '民家'], [27, 10, '野山へ']],
        warps: [{ x: 27, y: 10, to: 'hyuga', x2: 26, y2: 42, dir: 2 }],
        houses: [
          hs(...H[0], '振徳堂（藩校）', { npcs: [npc(5, 4, 'elder', TK('shintokudo'))], items: [chest(8, 3, 'ob1', 'tsue3')] }),
          hs(...H[1], '小倉家', { npcs: [npc(5, 4, 'woman', STORY.oguraHome, { mark: () => G.chapter === 2 })] }),
          hs(...H[2], '道具屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('obi'))] }),
          hs(...H[3], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[4], '小村家', { npcs: [npc(5, 4, 'woman', TK('komuraMother'))], items: [pot(8, 4, 'ob2', 'obiten', 3)] }),
          hs(...H[5], '民家', { npcs: [npc(5, 4, 'elder', TK('obiElder'))] }),
        ],
        look: { '7,6': () => N('飫肥城の大手門。苔むした石垣と、まっすぐな飫肥杉。') },
        npcs: [npc(12, 10, 'child', TK('obiKid')), npc(20, 10, 'student', TK('obiStudent')), chest(25, 20, 'ob3', 'obisugi')],
      };
    },
  },
  // ---------------- 椎葉（山の村） ----------------
  shiiba: {
    build() {
      const g = grid(26, 20, 'M'), r = rnd(9);
      rect(g, 2, 2, 22, 16, '.'); for (let y = 3; y < 17; y += 3) rect(g, 2, y, 22, 1, 'F');
      rect(g, 13, 1, 1, 19, ','); rect(g, 2, 9, 22, 1, ','); for (let y = 3; y < 17; y += 3) g[y][13] = ',';
      const H = [house(g, 4, 6, 5, 6), house(g, 17, 6, 5, 19), house(g, 4, 12, 5, 6)];
      for (const [dx, dy] of H) g[dy + 1][dx] = ',';
      const tor = shrine(g, 16, 11, 5);
      rect(g, 18, 15, 1, 3, ','); rect(g, 13, 17, 6, 1, ',');
      g[1][13] = F('heikeDone') ? '.' : 'T';
      return {
        name: '椎葉', g, place: 'shiiba', bgm: () => F('heikeQ') && !F('heikeDone') ? 'sad' : 'town', noRide: true, night: () => F('heikeQ') && !F('heikeDone'), props: [tor],
        labels: [[6, 6, 'よろず屋'], [19, 6, '鶴富屋敷'], [6, 12, '弥七の家'], [18, 11, '十根川神社'], [13, 19, '野山へ']],
        warps: [{ x: 13, y: 19, to: 'hyuga', x2: 6, y2: 21, dir: 0 }],
        triggers: [{ x: 12, y: 2, w: 3, h: 2, cond: () => F('heikeQ') && !F('heikeDone'), boss: 'yashichi', bx: 13, by: 1, run: STORY.heikeBoss, warn: '山の上で、青白い火が いくつも揺れている……\n【ボス戦】準備はいいですか？' }],
        houses: [
          hs(...H[0], 'よろず屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('shiiba'))] }),
          hs(...H[1], '鶴富屋敷', { npcs: [npc(5, 4, 'elder', TK('tsurutomi'))], items: [chest(8, 3, 'sb1', 'naginata3')] }),
          hs(...H[2], '弥七の家', { npcs: [npc(5, 4, 'woman', TK('yashichiMother'))], items: [pot(8, 4, 'sb2', 'shiitake', 3)] }),
        ],
        npcs: [npc(10, 9, 'yashichi', STORY.yashichi, { cond: () => !F('yashichi') && !(F('heikeQ') && !F('heikeDone')), mark: true }), npc(16, 9, 'child', TK('shiibaKid')), npc(19, 16, 'kannushi', () => STORY.shrine('shiiba'), { dir: 3 })],
      };
    },
  },
  // ---------------- 鵜戸神宮（海の洞窟の中の神社） ----------------
  udo: {
    build() {
      const g = grid(22, 16, '~');
      rect(g, 2, 2, 16, 13, 'M'); rect(g, 4, 4, 12, 9, 'W'); rect(g, 10, 13, 1, 3, ','); rect(g, 7, 11, 7, 2, ',');
      const s0 = shrine(g, 7, 4, 5); rect(g, 9, 8, 1, 3, ',');
      dots(g, 'R', [[17, 8], [18, 9]]); dots(g, 'l', [[6, 8], [12, 8]]);
      return {
        name: '鵜戸神宮', g, place: 'udo', bgm: 'title', noRide: true, props: [s0],
        labels: [[9, 4, '本殿（洞窟の中）'], [18, 9, '亀石'], [10, 15, '野山へ']],
        warps: [{ x: 10, y: 15, to: 'hyuga', x2: 31, y2: 42, dir: 0 }],
        look: { '17,8': () => STORY.undama(), '18,9': () => STORY.undama() },
        npcs: [npc(13, 10, 'kannushi', () => STORY.shrine('udo'), { dir: 1 }), npc(15, 12, 'woman', TK('udoW'))],
      };
    },
  },
  // ---------------- 鹿児島（県庁と県会） ----------------
  kagoshima: {
    build() {
      const g = grid(28, 20, '.'); border(g, 'T');
      rect(g, 0, 10, 28, 1, ','); g[10][0] = ','; rect(g, 14, 1, 1, 19, ',');
      const H = [house(g, 2, 2, 7, 5, 'Q'), house(g, 17, 2, 7, 20, 'Q'), house(g, 2, 12, 5, 4), house(g, 8, 12, 5, 10), house(g, 17, 12, 5, 19)];
      for (const [dx, dy] of H) rect(g, dx, dy + 1, 1, dy === 4 ? 5 : 1, ',');
      rect(g, 22, 13, 5, 6, '~'); dots(g, 'T', [[11, 3], [25, 7], [12, 18], [1, 17]]);
      return {
        name: '鹿児島（県庁）', g, bbg: 'beach', place: 'kagoshima', bgm: 'town', noRide: true, weather: () => 'ash',
        props: [{ x: 21, y: 11, img: 'sakurajima', smoke: [137, 46] }],
        labels: [[5, 2, '鹿児島県庁'], [20, 2, '県会議事堂'], [4, 12, '道具屋'], [10, 12, '宿'], [19, 12, '新八の家'], [0, 10, '日向へ']],
        warps: [{ x: 0, y: 10, to: 'hyuga', x2: 5, y2: 44, dir: 0 }],
        houses: [
          hs(...H[0], '鹿児島県庁', { w: 15, npcs: [npc(7, 3, 'kenrei', TK('kencho2'))] }),
          hs(...H[1], '県会議事堂', { w: 15, onEnter: () => STORY.kenkaiEnter(), npcs: [npc(7, 3, 'official', TK('gijido'))] }),
          hs(...H[2], '道具屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('kago'))] }),
          hs(...H[3], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[4], '新八の家', { npcs: [npc(5, 4, 'shinpachi', STORY.shinpachi3)] }),
        ],
        npcs: [npc(9, 9, 'police', TK('kagoPolice')), npc(20, 9, 'woman', TK('kagoW'))],
      };
    },
  },
  // ---------------- 東京 ----------------
  tokyo: {
    build() {
      const g = grid(30, 22, ';'); border(g, '#');
      rect(g, 0, 10, 30, 2, ','); rect(g, 14, 0, 2, 22, ',');
      const H = [house(g, 2, 2, 8, 6, 'Q'), house(g, 18, 2, 6, 21, 'Q'), house(g, 25, 2, 4, 26, 'Q'), house(g, 2, 14, 5, 4, 'Q'), house(g, 8, 14, 5, 10, 'Q'), house(g, 18, 14, 5, 20, 'Q')];
      for (const [dx, dy] of H) rect(g, dx, dy + 1, 1, dy === 4 ? 6 : 1, ',');
      dots(g, 'l', [[5, 9], [12, 9], [19, 9], [26, 9], [5, 12], [12, 12], [19, 12], [26, 12]]);
      return {
        name: '東京', g, bbg: 'tokyo', place: 'naimusho', bgm: 'town', noRide: true,
        labels: [[6, 2, '内務省'], [21, 2, '司法省'], [26, 2, '宿'], [4, 14, '舶来品店'], [10, 14, '牛鍋屋'], [20, 14, '新聞社']],
        houses: [
          hs(...H[0], '内務省', { w: 15, onEnter: () => STORY.naimushoEnter(), npcs: [npc(7, 3, 'official', TK('naimusho'))] }),
          hs(...H[1], '司法省', { npcs: [npc(5, 4, 'komura', STORY.komura, { cond: () => !F('komura'), mark: true })] }),
          hs(...H[2], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[3], '舶来品店', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('tokyo'))] }),
          hs(...H[4], '牛鍋屋', { npcs: [npc(5, 4, 'woman', TK('gyunabe'))] }),
          hs(...H[5], '新聞社', { npcs: [npc(5, 4, 'elder', TK('shinbun'))] }),
        ],
        npcs: [npc(15, 12, 'police', TK('tokyoPolice')), npc(8, 10, 'child', TK('tokyoKid'))],
      };
    },
  },
};
