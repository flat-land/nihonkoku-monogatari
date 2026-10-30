'use strict';
// ===== マップ（記号＝タイル。gfx.js の TP を参照） =====
function grid(w, h, f) { return Array.from({ length: h }, () => Array(w).fill(f)); }
function rect(g, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = c; }
function frame(g, x, y, w, h, c) { rect(g, x, y, w, 1, c); rect(g, x, y + h - 1, w, 1, c); rect(g, x, y, 1, h, c); rect(g, x + w - 1, y, 1, h, c); }
// 家：タイルは当たり判定とミニマップ用。見た目は _BLD に記録し、gfx.js の bldImg で一枚絵として描く
let _BLD = [];
function house(g, x, y, w, door, roof = 'H') {
  rect(g, x, y, w, 2, roof); rect(g, x, y + 2, w, 1, 'h'); g[y + 2][door] = 'D';
  const v = (x * 7 + y * 13 + w * 3) % 5, b = { x, y, w, door, roofCh: roof, roof: ['hip', 'gable', 'irimoya', 'hip', 'gable'][v] };
  // 幅のある家は、片側に一段低い棟（離れ）をつけて形を変える
  if (roof === 'H' && w >= 5 && (v === 1 || v === 3)) {
    b.wing = v === 1 ? 'L' : 'R'; const c0 = b.wing === 'L' ? x : x + w - 2;
    for (let i = c0; i < c0 + 2; i++) { const a = g[y - 1] && g[y - 1][i]; g[y][i] = a && '.,su;'.includes(a) ? a : '.'; }
  }
  _BLD.push(b); return [door, y + 2];
}
function dots(g, c, list) { for (const [x, y] of list) if (g[y] && g[y][x] !== undefined) g[y][x] = c; }
function border(g, c = 'T') { const h = g.length, w = g[0].length; rect(g, 0, 0, w, 1, c); rect(g, 0, h - 1, w, 1, c); rect(g, 0, 0, 1, h, c); rect(g, w - 1, 0, 1, h, c); }
const pot = (x, y, id, item, n) => ({ x, y, spr: 'pot', pot: id, item, n });
const chest = (x, y, id, item, n) => ({ x, y, spr: 'chest', pot: id, item, n });
const npc = (x, y, spr, talk, o = {}) => ({ x, y, spr, talk, ...o });
const ch = (...c) => () => c.includes(G.chapter);
const chFrom = (a, b = 99) => () => G.chapter >= a && G.chapter <= b;
const SAT = () => !F('route_gov'), GOV = () => F('route_gov');
// 家の中の住人
const hs = (x, y, name, o = {}) => ({ x, y, name, ...o });

const MAPS = {
  // ---------------- 鹿児島 ----------------
  kajiya: {
    build() {
      const g = grid(32, 24, '.'); border(g);
      rect(g, 26, 0, 2, 24, '~');
      rect(g, 1, 11, 30, 1, ','); rect(g, 26, 11, 2, 1, '='); g[11][31] = ',';
      rect(g, 8, 1, 1, 23, ','); if (G.chapter < 8) g[0][8] = 'T'; else g[0][8] = ',';
      rect(g, 9, 16, 17, 1, ',');
      const H = [];
      H.push(house(g, 2, 2, 4, 3), house(g, 11, 2, 4, 12), house(g, 19, 2, 4, 20));
      H.push(house(g, 2, 8, 5, 4), house(g, 10, 8, 4, 11), house(g, 16, 8, 5, 18));
      H.push(house(g, 10, 13, 5, 12), house(g, 16, 13, 4, 17), house(g, 21, 13, 4, 22));
      rect(g, 22, 8, 2, 2, 'H'); g[10][22] = F('kuraOpen') ? 'D' : 'L'; g[10][23] = 'h'; _BLD.push({ x: 22, y: 8, w: 2, door: 22, style: 'kura' });
      rect(g, 1, 17, 7, 1, 'g'); rect(g, 1, 22, 7, 1, 'g'); rect(g, 1, 17, 1, 6, 'g'); rect(g, 7, 17, 1, 6, 'g');
      rect(g, 2, 18, 5, 4, 'W'); g[19][7] = 'W';
      dots(g, 'K', [[2, 19], [4, 19]]);
      rect(g, 10, 18, 6, 4, 'F');
      dots(g, 'T', [[7, 3], [16, 3], [24, 5], [24, 12], [15, 6], [10, 5], [24, 19], [20, 20], [18, 22], [23, 22], [29, 3], [29, 18], [30, 7]]);
      if (G.chapter >= 7) dots(g, 'l', [[9, 12], [25, 12], [9, 17]]);
      if (F('bombarded') && G.chapter === 1) {
        rect(g, 19, 2, 4, 3, 'r'); rect(g, 11, 2, 4, 2, 'r'); rect(g, 21, 13, 2, 2, 'r');
        if (!F('ch1end')) dots(g, 'f', [[20, 4], [13, 3], [24, 6], [21, 15], [14, 4], [22, 3], [19, 4]]);
      }
      const T = (id) => (n) => STORY.talk(id, n);
      return {
        name: G.chapter >= 7 ? '鹿児島・加治屋町（明治）' : '加治屋町', g, place: 'kajiya',
        bgm: () => (F('bombarded') && G.chapter === 1 && !F('ch1end')) ? 'war' : (G.night ? 'night' : 'town'),
        night: () => (F('gesshoQuest') && !F('gessho')) || F('night8'),
        weather: () => (F('bombarded') && G.chapter === 1 && !F('ch1end')) ? 'embers' : (G.chapter === 0 || G.chapter === 8) && !F('gesshoQuest') ? 'ash' : null,
        noRide: true, onEnter: STORY.kajiyaEnter,
        labels: [[4, 8, '新八の家'], [18, 8, '西郷家'], [12, 13, '大久保家'], [17, 13, '道具屋'], [22, 13, '鍛冶屋'], [3, 19, '稽古場'], [27, 11, '甲突川']],
        warps: [{ x: 31, y: 11, to: 'kotsuki', x2: 1, y2: 10, dir: 2 }, { x: 8, y: 23, to: 'kaigan', x2: 8, y2: 1, dir: 0 }, { x: 8, y: 0, to: 'shiroyama', x2: 14, y2: 20, dir: 3, cond: () => G.chapter >= 8 }],
        locks: [{ x: 22, y: 10, key: 'key_kura', flag: 'kuraOpen' }],
        houses: [
          hs(...H[3], '日高家（新八の家）', { npcs: [npc(3, 4, 'haha', STORY.haha, { dir: 0 })], items: [chest(8, 4, 'home', 'karaimo', 3)], look: { '5,3': STORY.irori } }),
          hs(...H[4], '川上家（仙吉の家）', { npcs: [npc(7, 4, 'woman', T('senkichiMother'))], items: [pot(2, 5, 'senhome', 'kokuto')] }),
          hs(...H[5], '西郷家', { w: 13, npcs: [npc(4, 4, 'elder', T('saigoHouse'))], items: [chest(10, 3, 'saigohome', 'tsukeage', 2)] }),
          hs(...H[6], '大久保家', { npcs: [npc(7, 3, 'elder', T('okuboHouse'))], items: [chest(2, 3, 'okubohome', 'chiran')] }),
          hs(...H[7], '道具屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('dougu'))] }),
          hs(...H[8], '鍛冶屋', { kind: 'shop', npcs: [npc(5, 3, 'smith', () => shopTalk('kaji'))] }),
          hs(...H[0], '民家', { npcs: [npc(6, 4, 'woman', T('house1'))], items: [pot(9, 5, 'h1', 'karaimo', 2)] }),
          hs(...H[1], '郷中の詰所', { npcs: [npc(5, 4, 'boy', T('house2'))], items: [chest(2, 3, 'h2', 'horoku', 2)] }),
          hs(...H[2], '民家', { npcs: [npc(4, 4, 'elder', T('house3'))], items: [pot(8, 3, 'h3', 'omamori')] }),
          { x: 22, y: 10, name: '西郷家の蔵', kind: 'kura', w: 9, h: 7, items: [chest(2, 3, 'kura1', 'yakusugi'), chest(6, 3, 'kura2', 'kiba2'), chest(2, 5, 'kura3', 'meishu', 2), { x: 6, y: 5, spr: 'chest', pot: 'kura4', money: 800 }] },
        ],
        npcs: [
          npc(12, 12, 'senkichi', STORY.senkichiJoin, { cond: () => G.chapter === 0 && !F('senkichi'), mark: true }),
          npc(5, 19, 'senpai', STORY.senpai, { dir: 1, cond: () => G.chapter <= 1, mark: true }),
          npc(3, 21, 'boy', STORY.tachikiBoy, { dir: 3 }),
          npc(18, 12, 'saigo', STORY.saigo, { cond: () => G.chapter === 0 && !F('gesshoQuest') && F('tutorial'), mark: true }),
          npc(13, 17, 'okubo', STORY.okubo, { cond: () => G.chapter <= 1, mark: true }),
          npc(14, 17, 'togo', STORY.togoWait, { cond: () => G.chapter === 1 && !F('togo') }),
          npc(15, 12, 'elder', T('elder')), npc(22, 12, 'woman', T('woman')), npc(9, 6, 'child', T('child')),
          npc(20, 17, 'student', T('student'), { cond: chFrom(8, 8) }),
          npc(6, 13, 'rival', STORY.rival8, { cond: ch(8), mark: true }),
          pot(6, 6, 'kajiya1', 'karaimo'), pot(25, 21, 'kajiya2', 'kokuto'), pot(30, 21, 'kajiya3', 'omamori'),
          { x: 29, y: 13, spr: 'sign', talk: () => N('立て札：「甲突川の石橋。\n東へ行けば 城下の外れ」') },
        ],
      };
    },
  },
  kotsuki: {
    build() {
      const g = grid(30, 20, '.');
      rect(g, 0, 0, 30, 3, '~'); rect(g, 0, 3, 30, 1, 's');
      rect(g, 0, 19, 30, 1, 'T'); rect(g, 29, 0, 1, 20, 'T'); rect(g, 0, 4, 1, 15, 'T'); g[10][0] = ',';
      rect(g, 0, 10, 12, 1, ','); rect(g, 11, 6, 1, 5, ','); rect(g, 11, 6, 10, 1, ','); rect(g, 20, 6, 1, 8, ','); rect(g, 20, 13, 10, 1, ',');
      rect(g, 4, 13, 3, 3, 'T'); rect(g, 14, 9, 3, 3, 'T'); rect(g, 24, 5, 3, 2, 'T'); rect(g, 6, 5, 2, 2, 'T'); rect(g, 16, 15, 4, 2, 'b');
      dots(g, 'T', [[3, 7], [9, 16], [25, 9], [27, 16], [13, 4]]);
      dots(g, 'R', [[5, 3], [18, 3], [23, 3]]);
      rect(g, 22, 15, 4, 3, 'F'); g[13][29] = (G.chapter === 3 || G.chapter === 8) ? ',' : 'T';
      return {
        name: '甲突川の河原', g, bbg: 'field', place: 'kotsuki', bgm: 'field',
        night: () => (F('gesshoQuest') && !F('gessho')),
        weather: () => G.chapter === 0 || G.chapter === 8 ? 'ash' : null,
        enc: () => G.chapter >= 8 ? ENC.kago8 : G.chapter >= 1 ? ENC.kaigan1.slice(0, 4) : ENC.kotsuki, encTiles: ['.', 's'], rare: G.chapter >= 7 ? RARE.meiji : RARE.early,
        labels: [[26, 13, '高見馬場の若衆'], [3, 12, '馬方']],
        warps: [{ x: 0, y: 10, to: 'kajiya', x2: 30, y2: 11, dir: 1 }, { x: 29, y: 13, to: 'kirishima', x2: 16, y2: 22, dir: 3, cond: () => G.chapter === 3 || G.chapter === 8 }],
        triggers: [{ x: 18, y: 6, w: 4, h: 3, cond: () => G.chapter === 8 && F('rival8') && !F('senkichi8'), run: STORY.senkichi8 }],
        npcs: [
          npc(27, 13, 'rival', STORY.rival, { dir: 1, cond: () => G.chapter <= 1, mark: true }),
          npc(27, 12, 'rivalkid', STORY.rivalkid, { dir: 1, cond: () => G.chapter <= 1 }),
          npc(27, 14, 'rivalkid', STORY.rivalkid, { dir: 1, cond: () => G.chapter <= 1 }),
          npc(3, 12, 'umakata', () => rentHorse(30), { cond: chFrom(1) }),
          npc(2, 13, 'horse', () => rentHorse(30), { cond: chFrom(1) }),
          pot(2, 17, 'kotsuki1', 'tsukeage'), pot(27, 17, 'kotsuki2', 'kokuto'), chest(12, 15, 'kotsuki3', 'shochu'),
        ],
      };
    },
  },
  kaigan: {
    build() {
      const g = grid(30, 22, 's');
      rect(g, 0, 0, 30, 6, '.'); rect(g, 0, 0, 30, 1, 'T'); rect(g, 0, 0, 1, 15, 'T'); rect(g, 29, 0, 1, 6, 'T');
      rect(g, 8, 0, 1, 7, ',');
      rect(g, 0, 15, 30, 7, '~'); rect(g, 22, 6, 8, 9, '~'); rect(g, 0, 19, 30, 3, 'o');
      rect(g, 12, 15, 1, 4, 'p');
      dots(g, '#', [[15, 14], [17, 14], [19, 14], [21, 14]]); dots(g, 'C', [[16, 14], [18, 14], [20, 14]]);
      dots(g, 'P', [[2, 7], [5, 6], [10, 6], [14, 7], [19, 6], [3, 11], [20, 9]]);
      dots(g, 'R', [[6, 13], [1, 14]]);
      if (G.chapter === 1 && !F('ch1end')) dots(g, 'S', [[4, 18], [9, 20], [16, 19], [20, 17], [25, 16], [15, 21], [27, 19]]);
      if (F('bombarded') && !F('ch1end')) dots(g, 'f', [[17, 13], [19, 12], [2, 5]]);
      return {
        name: '錦江湾の浜・天保山砲台', g, props: [{ x: 22, y: 6, img: 'sakurajima', smoke: [137, 46] }], bbg: 'beach', encTiles: ['s'], place: 'tenpozan', bgm: () => G.night ? 'night' : (G.chapter === 1 && !F('ch1end')) ? 'war' : 'field',
        night: () => F('gesshoQuest') && !F('gessho'),
        weather: () => G.chapter === 1 && F('seizure') && !F('euryalus') ? 'rain' : G.chapter === 0 ? 'ash' : null,
        enc: () => (G.chapter === 1 && F('ch1brief') && !F('euryalus')) ? ENC.kaigan1 : null, rare: RARE.early,
        labels: [[18, 13, '天保山砲台'], [12, 16, '桟橋'], [26, 9, '桜島']],
        warps: [{ x: 8, y: 0, to: 'kajiya', x2: 8, y2: 22, dir: 3 }],
        triggers: [
          { x: 9, y: 12, w: 7, h: 3, cond: () => F('gesshoQuest') && !F('gessho'), run: STORY.gessho },
          { x: 10, y: 13, w: 5, h: 2, cond: () => F('ch1brief') && !F('seizure'), run: STORY.seizure },
          { x: 9, y: 11, w: 7, h: 4, cond: () => G.chapter === 2 && !F('saigoBack'), run: STORY.saigoReturn },
          { x: 12, y: 15, w: 1, h: 1, cond: () => G.chapter === 2 && F('saigoBack') && !F('kyoto2'), run: STORY.toKyoto },
        ],
        npcs: [
          npc(18, 12, 'commander', STORY.commander, { mark: true, cond: () => G.chapter <= 1 }),
          npc(6, 10, 'fisher', (n) => STORY.talk('fisher', n)),
          npc(13, 18, 'boat', () => N('小舟が 波に揺れている……'), { cond: () => (F('gesshoQuest') && !F('gessho')) }),
          pot(2, 9, 'kaigan1', 'tsukeage'), pot(27, 5, 'kaigan2', 'shochu'), pot(21, 7, 'kaigan3', 'karukan'),
        ],
      };
    },
  },
  shiroyama: {
    build() {
      const g = grid(28, 22, 'T'); rect(g, 2, 2, 24, 18, '.');
      rect(g, 14, 10, 1, 12, ','); rect(g, 6, 10, 16, 1, ','); rect(g, 6, 4, 1, 7, ','); rect(g, 21, 4, 1, 7, ',');
      const sg = house(g, 8, 14, 6, 11); rect(g, 15, 14, 2, 3, '#');
      rect(g, 18, 15, 5, 3, 'u'); rect(g, 3, 13, 4, 4, 'b');
      rect(g, 4, 2, 5, 2, 'M'); g[4][6] = 'c';
      rect(g, 19, 2, 5, 2, 'M');
      dots(g, 'T', [[10, 5], [12, 7], [17, 6], [3, 8], [24, 12], [24, 17]]);
      if (G.chapter === 12) { dots(g, 'X', [[8, 8], [9, 8], [18, 8], [19, 8], [12, 12], [16, 12]]); dots(g, 'Y', [[11, 4]]); }
      return {
        name: '城山', g, place: G.chapter === 12 ? 'shiroyama' : 'shigakko', bbg: G.chapter === 12 ? 'shiroyama' : 'field',
        bgm: () => G.chapter === 12 ? 'sad' : 'field', night: () => G.chapter === 12, weather: () => G.chapter === 12 ? 'embers' : 'ash', noRide: true,
        labels: [[11, 14, '私学校'], [6, 4, '洞窟'], [14, 20, '加治屋町へ']],
        warps: [{ x: 14, y: 21, to: 'kajiya', x2: 8, y2: 1, dir: 0, cond: () => G.chapter !== 12 }],
        houses: [hs(...sg, '私学校', { w: 15, npcs: [npc(4, 4, 'student', (n) => STORY.talk('student', n)), npc(10, 4, 'kirino', STORY.kirino8, { cond: () => G.chapter === 8 && !F('in_kirino'), mark: true })], items: [chest(2, 3, 'sg1', 'kurobuta', 2), chest(12, 3, 'sg2', 'snider')] })],
        triggers: [
          { x: 5, y: 5, w: 3, h: 2, cond: () => G.chapter === 12 && !F('s12night'), run: STORY.s12night },
          { x: 13, y: 9, w: 3, h: 3, cond: () => G.chapter === 8 && F('kayaku') && !F('branch'), run: STORY.branch },
        ],
        npcs: [
          npc(6, 5, 'saigo', STORY.saigoCave, { cond: () => G.chapter === 12 && SAT() && !F('s12night'), mark: true }),
          npc(12, 9, 'beppu', (n) => STORY.talk('beppu', n), { cond: () => G.chapter === 12 && SAT() }),
          npc(16, 9, 'satsumasoldier', (n) => STORY.talk('s12soldier', n), { cond: () => G.chapter === 12 && SAT() }),
          npc(14, 11, 'saigo', STORY.saigo8, { cond: () => G.chapter === 8 && F('kayaku') && !F('branch'), mark: true }),
          npc(20, 5, 'merchant', () => shopTalk('jinchu'), { cond: () => G.chapter === 12 }),
          chest(23, 5, 'sy1', 'meishu'), chest(3, 18, 'sy2', 'keihan'),
        ],
      };
    },
  },
  kirishima: {
    build() {
      const g = grid(32, 24, '.'); border(g, 'T');
      rect(g, 1, 1, 30, 7, 'M'); rect(g, 13, 1, 6, 6, '.'); rect(g, 15, 0, 2, 3, 'M'); g[2][16] = 'm';
      rect(g, 16, 7, 1, 16, ','); rect(g, 4, 15, 24, 1, ','); rect(g, 16, 3, 1, 5, ',');
      rect(g, 5, 10, 4, 3, 'O'); rect(g, 22, 17, 4, 3, 'O');
      const inn = house(g, 4, 17, 6, 6); const inn2 = house(g, 22, 10, 5, 24);
      dots(g, 'T', [[11, 9], [12, 12], [20, 9], [27, 14], [3, 21], [12, 20], [20, 21], [27, 21], [10, 18]]);
      rect(g, 1, 8, 3, 6, 'b'); rect(g, 28, 8, 3, 6, 'b');
      g[23][16] = ',';
      return {
        name: G.chapter === 8 ? '霧島・日当山温泉' : '霧島', g, bbg: 'mountain', place: 'kirishima', bgm: 'field', weather: () => 'fireflies',
        enc: () => G.chapter === 3 ? ENC.kirishima : null, rare: RARE.early,
        labels: [[16, 2, '高千穂峰'], [6, 11, '塩浸温泉'], [6, 17, '宿']],
        warps: [{ x: 16, y: 23, to: 'kajiya', x2: 30, y2: 11, dir: 1 }],
        triggers: [{ x: 14, y: 1, w: 5, h: 3, cond: () => G.chapter === 3 && F('kirishimaIn') && !F('sakahoko'), run: STORY.sakahoko }],
        houses: [hs(...inn, '湯治宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }), hs(...inn2, '山の茶屋', { kind: 'shop', npcs: [npc(4, 3, 'merchant', () => shopTalk('dougu'))] })],
        look: { '16,1': () => N('山頂に、青銅の矛が 突き立っている。\n「天の逆鉾」――神話の時代から伝わる という。') },
        npcs: [
          npc(8, 13, 'ryoma', STORY.ryomaOnsen, { cond: () => G.chapter === 3 && F('sakahoko') && !F('onsen3'), mark: true }),
          npc(9, 13, 'oryo', (n) => STORY.talk('oryo', n), { cond: () => G.chapter === 3 }),
          npc(10, 11, 'saigo', STORY.onsen8, { cond: () => G.chapter === 8 && !F('onsen8'), mark: true }),
          npc(14, 16, 'umakata', () => rentHorse(40)), npc(13, 16, 'horse', () => rentHorse(40)),
          chest(29, 20, 'kr1', 'kurobuta'), pot(2, 20, 'kr2', 'mikan'), chest(18, 5, 'kr3', 'kubiwa'),
        ],
      };
    },
  },
  // ---------------- 京・伏見 ----------------
  kyoto: {
    build() {
      const g = grid(36, 26, ';'); border(g, '#');
      const H = [];
      for (let yy = 2; yy < 20; yy += 7) for (let xx = 2; xx < 34; xx += 8) { if (xx <= 10 && yy === 2) continue; if (xx >= 26 && yy >= 16) continue; const hh = house(g, xx, yy, 6, xx + 3); H.push(hh); }
      rect(g, 2, 2, 12, 6, '#'); rect(g, 3, 3, 10, 4, ','); const hantei = house(g, 4, 3, 7, 7); g[7][7] = ','; g[4][12] = F('hanzoOpen') ? 'D' : 'L'; g[3][12] = 'H';
      rect(g, 26, 16, 8, 8, '.'); dots(g, 'T', [[27, 17], [32, 17], [27, 22], [32, 22]]); dots(g, 'J', [[29, 19]]); dots(g, 'l', [[28, 20], [31, 20]]);
      g[0][18] = ';'; g[25][18] = ';';
      if (F('kinmonFire') && !F('kinmonEnd')) dots(g, 'f', [[10, 10], [20, 3], [22, 10], [31, 4], [14, 17], [5, 17]]);
      const T = (id) => (n) => STORY.talk(id, n);
      return {
        name: '京の町', g, bbg: 'kyoto', place: G.chapter === 2 ? 'hamaguri' : null, bgm: () => (F('kinmonFire') && !F('kinmonEnd')) ? 'war' : 'kyoto', noRide: true,
        weather: () => (F('kinmonFire') && !F('kinmonEnd')) ? 'embers' : G.chapter === 3 ? 'snow' : null,
        enc: () => (G.chapter === 2 && F('kyoto2') && !F('kinmonEnd')) ? ENC.kyoto : null, encTiles: [';'], rare: RARE.kyoto,
        labels: [[7, 3, '薩摩藩邸'], [18, 0, '御所へ'], [18, 25, '伏見へ'], [29, 19, '神社']],
        warps: [{ x: 18, y: 0, to: 'gosho', x2: 15, y2: 18, dir: 3, cond: () => G.chapter === 2 || G.chapter === 4 }, { x: 18, y: 25, to: G.chapter === 4 ? 'toba' : 'fushimi', x2: G.chapter === 4 ? 2 : 13, y2: G.chapter === 4 ? 10 : 1, dir: 0, cond: () => G.chapter === 3 || G.chapter === 4 }],
        locks: [{ x: 12, y: 4, key: 'key_hanzo', flag: 'hanzoOpen' }],
        houses: [
          hs(...hantei, '薩摩藩邸（二本松）', { w: 15, place: 'hamaguri', npcs: [npc(7, 4, 'komatsu', STORY.komatsu, { mark: true }), npc(3, 4, 'kido', STORY.kido3, { cond: () => G.chapter === 3 && !F('satcho') }), npc(11, 4, 'ryoma', STORY.ryoma3, { cond: () => G.chapter === 3 && !F('satcho') })], items: [chest(13, 5, 'hantei1', 'key_hanzo')] }),
          { x: 12, y: 4, name: '藩邸の蔵', kind: 'kura', w: 9, h: 7, items: [chest(2, 3, 'hz1', 'masakiyo'), chest(6, 3, 'hz2', 'kurobuta', 3), chest(4, 5, 'hz3', 'kiriko')] },
          ...H.map((h, i) => hs(...h, ['武具屋', '道具屋', '茶屋', '町家', '宿屋', '町家', '寺', '町家', '町家', '町家', '町家', '町家'][i] || '町家', i === 0 ? { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('kyoto'))] } : i === 1 ? { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('kyotoDougu'))] } : i === 4 ? { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] } : i === 6 ? { npcs: [npc(5, 4, 'monk', T('kyotoMonk'))] } : { npcs: [npc(5, 4, i % 2 ? 'woman' : 'elder', T('kyoto' + (i % 3)))], items: i % 3 === 0 ? [pot(8, 4, 'kh' + i, ['chiran', 'tsukeage', 'horoku', 'karukan'][i % 4])] : [] })),
        ],
        npcs: [
          npc(16, 8, 'woman', T('kyotoA')), npc(24, 15, 'elder', T('kyotoB')), npc(9, 22, 'child', T('kyotoC')),
          npc(18, 1, 'satsumasoldier', T('kyotoGate'), { cond: () => G.chapter === 3 }),
        ],
      };
    },
  },
  gosho: {
    build() {
      const g = grid(30, 20, ','); border(g, '#');
      rect(g, 1, 1, 28, 5, '#'); rect(g, 2, 2, 26, 3, '.'); dots(g, 'P', [[4, 3], [9, 3], [20, 3], [25, 3]]);
      rect(g, 13, 5, 4, 1, 'G'); g[5][14] = ','; g[5][15] = ',';
      rect(g, 2, 8, 6, 3, 'P'); rect(g, 22, 8, 6, 3, 'P');
      dots(g, 'X', [[10, 9], [11, 9], [18, 9], [19, 9]]);
      g[19][15] = ',';
      if (F('kinmonFire')) dots(g, 'f', [[3, 14], [25, 15], [7, 17]]);
      return {
        name: '御所・蛤御門', g, bbg: 'kyoto', place: 'hamaguri', bgm: () => G.chapter === 2 && !F('kinmonEnd') ? 'war' : 'kyoto', noRide: true,
        enc: () => G.chapter === 2 && F('kinmon') && !F('kijima') ? ENC.kyoto : null, encTiles: [','],
        labels: [[14, 5, '蛤御門']],
        warps: [{ x: 15, y: 19, to: 'kyoto', x2: 18, y2: 1, dir: 0 }],
        triggers: [{ x: 11, y: 6, w: 8, h: 3, cond: () => G.chapter === 2 && F('kinmon') && !F('kijima'), run: STORY.kijima }],
        npcs: [
          npc(14, 7, 'satsumasoldier', (n) => STORY.talk('goshoGuard', n), { cond: () => !(G.chapter === 2 && F('kinmon')) }),
          npc(16, 12, 'satsumasoldier', STORY.kinmonStart, { cond: () => G.chapter === 2 && F('kyoto2') && !F('kinmon'), mark: true }),
          chest(3, 12, 'gs1', 'horoku', 3), pot(26, 12, 'gs2', 'chiran'),
        ],
      };
    },
  },
  fushimi: {
    build() {
      const g = grid(26, 18, ';'); border(g, '#'); rect(g, 0, 13, 26, 5, '~'); rect(g, 1, 12, 24, 1, 's'); rect(g, 10, 13, 1, 3, 'p');
      const tera = house(g, 4, 6, 7, 7), yashiki = house(g, 16, 6, 7, 19), h3 = house(g, 4, 1, 5, 6), h4 = house(g, 17, 1, 5, 19);
      dots(g, 'P', [[13, 8], [24, 3]]); g[0][13] = ';';
      return {
        name: '伏見', g, bbg: 'town', place: 'teradaya', bgm: () => F('teradaya3') && !F('teradayaEnd') ? 'war' : 'kyoto', noRide: true, night: () => F('teradaya3') && !F('teradayaEnd'),
        enc: () => F('teradaya3') && !F('teradayaEnd') ? ENC.fushimi : null, encTiles: [';', 's'],
        labels: [[7, 6, '寺田屋'], [19, 6, '薩摩藩伏見屋敷']],
        warps: [{ x: 13, y: 0, to: 'kyoto', x2: 18, y2: 24, dir: 3 }],
        houses: [
          hs(...tera, '寺田屋', { npcs: [npc(5, 4, 'innkeeper', STORY.teradayaInn)] }),
          hs(...yashiki, '薩摩藩伏見屋敷', { npcs: [npc(5, 4, 'satsumasoldier', STORY.fushimiYashiki, { mark: true })] }),
          hs(...h3, '船宿', { npcs: [npc(5, 4, 'fisher', (n) => STORY.talk('fushimiA', n))], items: [pot(8, 4, 'fs1', 'karukan')] }),
          hs(...h4, '酒蔵', { npcs: [npc(5, 4, 'elder', (n) => STORY.talk('fushimiB', n))], items: [chest(8, 4, 'fs2', 'meishu')] }),
        ],
        triggers: [{ x: 6, y: 9, w: 3, h: 2, cond: () => G.chapter === 3 && F('satcho') && !F('teradaya3'), run: STORY.teradaya3 }],
        npcs: [npc(12, 10, 'torikata', STORY.torikashira, { cond: () => F('teradaya3') && !F('teradayaEnd'), mark: true })],
      };
    },
  },
  toba: {
    build() {
      const g = grid(34, 20, 'u'); border(g, 'T');
      rect(g, 0, 10, 34, 1, ','); rect(g, 4, 2, 8, 6, 'n'); rect(g, 20, 13, 10, 5, 'n'); rect(g, 4, 13, 8, 5, 'n'); rect(g, 20, 2, 8, 6, 'n');
      dots(g, 'X', [[14, 8], [15, 8], [16, 8], [17, 12], [18, 12], [19, 12]]);
      const bugyo = house(g, 27, 8, 6, 30, 'Q'); g[10][33] = 'T';
      if (F('nishiki')) dots(g, 'Y', [[3, 9], [3, 11]]);
      if (F('toba') && !F('hijikata')) dots(g, 'f', [[27, 8], [28, 9], [31, 8], [32, 9]]);
      g[10][0] = ',';
      return {
        name: '鳥羽・伏見の戦場', g, bbg: 'field', place: 'toba', bgm: () => F('hijikata') ? 'field' : 'war',
        weather: () => F('toba') && !F('hijikata') ? 'embers' : 'snow',
        enc: () => F('toba') && !F('hijikata') ? ENC.toba : null, encTiles: ['u', ','], rare: RARE.kyoto,
        labels: [[30, 8, '伏見奉行所'], [2, 10, '京へ']],
        warps: [{ x: 0, y: 10, to: 'kyoto', x2: 18, y2: 24, dir: 3 }],
        triggers: [{ x: 22, y: 9, w: 3, h: 3, cond: () => F('toba') && !F('hijikata'), run: STORY.hijikataBoss }],
        npcs: [
          npc(5, 9, 'oyama', STORY.tobaCamp, { cond: () => G.chapter === 4 && !F('toba'), mark: true }),
          npc(6, 11, 'merchant', () => shopTalk('jinchu')),
          chest(10, 18, 'tb1', 'horoku', 3), chest(25, 1, 'tb2', 'enfield'), pot(31, 18, 'tb3', 'mikan'),
        ],
      };
    },
  },
  // ---------------- 江戸・会津・東京 ----------------
  edo: {
    build() {
      const g = grid(34, 24, ';'); border(g, '#');
      rect(g, 0, 11, 34, 2, ','); rect(g, 16, 0, 2, 24, ',');
      const H = [];
      for (const [x, y] of [[2, 2], [8, 2], [2, 15], [8, 15], [19, 15]]) H.push(house(g, x, y, 5, x + 2));
      rect(g, 25, 13, 8, 9, '#'); rect(g, 26, 14, 6, 7, ','); const han = house(g, 26, 14, 6, 29); g[21][29] = ',';
      rect(g, 2, 7, 12, 3, '.'); dots(g, 'T', [[3, 8], [6, 8], [9, 8], [12, 8]]);
      rect(g, 19, 6, 12, 4, '.'); dots(g, 'G', [[24, 6], [25, 6]]); dots(g, 'T', [[20, 7], [22, 7], [28, 7], [30, 7]]); rect(g, 19, 5, 12, 1, '#'); g[5][24] = 'G'; g[5][25] = 'G';
      if (F('ueno') && !F('uenoEnd')) dots(g, 'f', [[21, 8], [29, 8], [23, 6], [27, 6]]);
      const T = (id) => (n) => STORY.talk(id, n);
      return {
        name: '江戸', g, bbg: 'town', place: 'satsumahantei', bgm: () => F('ueno') && !F('uenoEnd') ? 'war' : 'town', noRide: true,
        enc: () => F('muketsu') && !F('uenoEnd') ? ENC.edo : null, encTiles: [';', ','], rare: RARE.edo,
        labels: [[29, 14, '薩摩藩邸（田町）'], [24, 6, '上野・寛永寺 黒門']],
        warps: [],
        triggers: [{ x: 22, y: 9, w: 6, h: 2, cond: () => F('muketsu') && !F('uenoEnd'), run: STORY.ueno }],
        houses: [
          hs(...han, '薩摩藩邸（田町）', { w: 15, place: 'satsumahantei', npcs: [npc(7, 4, 'saigo', STORY.edoSaigo, { cond: () => !F('muketsu'), mark: true })], items: [chest(12, 3, 'eh1', 'kobo')] }),
          ...H.map((h, i) => hs(...h, ['武具屋', '道具屋', '長屋', '蕎麦屋', '長屋'][i], i === 0 ? { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('edo'))] } : i === 1 ? { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('tokyoDougu'))] } : i === 3 ? { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] } : { npcs: [npc(5, 4, i % 2 ? 'woman' : 'elder', T('edo' + (i % 3)))], items: [pot(8, 4, 'ed' + i, ['chiran', 'karukan', 'horoku'][i % 3])] })),
        ],
        npcs: [npc(17, 13, 'satsumasoldier', T('edoGuard')), npc(10, 12, 'child', T('edoKid')), npc(28, 12, 'katsu', STORY.katsuStreet, { cond: () => !F('muketsu') })],
      };
    },
  },
  aizu: {
    build() {
      const g = grid(32, 24, '.'); border(g, 'T');
      rect(g, 10, 1, 14, 12, '~'); rect(g, 12, 2, 10, 9, 'A'); rect(g, 14, 3, 6, 5, 'U'); rect(g, 14, 2, 6, 1, 'Q'); rect(g, 16, 10, 2, 3, '='); g[10][16] = 'G'; g[10][17] = 'G';
      rect(g, 16, 13, 2, 10, ','); rect(g, 1, 17, 30, 1, ',');
      dots(g, 'X', [[6, 14], [7, 14], [25, 14], [26, 14], [12, 15], [21, 15]]);
      const camp = house(g, 3, 19, 6, 6); const camp2 = house(g, 23, 19, 6, 26);
      for (let i = 0; i < 30; i++) { const x = 1 + ((i * 7) % 29), y = 13 + ((i * 5) % 9); if (g[y][x] === '.' && y < 18) g[y][x] = i % 3 ? 'T' : '.'; }
      if (F('aizuSiege') && !F('aizuEnd')) dots(g, 'f', [[13, 2], [20, 9], [12, 9]]);
      return {
        name: '会津若松・鶴ヶ城', g, bbg: 'aizu', place: 'tsurugajo', bgm: () => F('aizuEnd') ? 'sad' : 'war', weather: () => F('aizuEnd') ? 'petals' : null,
        enc: () => G.chapter === 6 && !F('aizuEnd') ? ENC.aizu : null, encTiles: ['.', ','], rare: RARE.edo,
        labels: [[16, 4, '鶴ヶ城'], [5, 19, '新政府軍の陣']],
        triggers: [
          { x: 15, y: 13, w: 4, h: 2, cond: () => G.chapter === 6 && F('aizu6') && !F('yae'), run: STORY.yaeBoss },
          { x: 15, y: 11, w: 4, h: 2, cond: () => G.chapter === 6 && F('yae') && !F('aizuEnd'), run: STORY.tsurugajo },
        ],
        houses: [hs(...camp, '新政府軍の陣', { npcs: [npc(5, 3, 'commander', STORY.aizuCamp, { cond: () => !F('aizu6'), mark: true }), npc(8, 4, 'merchant', () => shopTalk('jinchu'))] }), hs(...camp2, '陣小屋', { npcs: [npc(5, 4, 'satsumasoldier', (n) => STORY.talk('aizuSoldier', n))], items: [chest(2, 3, 'az1', 'yasuyo'), chest(8, 3, 'az2', 'keihan')] })],
        npcs: [chest(2, 2, 'az3', 'kurobuta', 2), pot(29, 2, 'az4', 'meishu')],
      };
    },
  },
  tokyo: {
    build() {
      const g = grid(34, 24, ';'); border(g, '#');
      rect(g, 0, 11, 34, 2, ','); rect(g, 16, 0, 2, 24, ',');
      const H = [];
      for (const [x, y] of [[2, 2], [8, 2], [20, 2], [26, 2], [2, 15], [8, 15], [20, 15], [26, 15]]) H.push(house(g, x, y, 5, x + 2, 'Q'));
      dots(g, 'l', [[5, 10], [12, 10], [21, 10], [29, 10], [5, 14], [12, 14], [21, 14], [29, 14]]);
      rect(g, 2, 7, 12, 3, '.'); dots(g, 'T', [[3, 8], [7, 8], [11, 8]]);
      rect(g, 19, 7, 12, 3, '.'); dots(g, 'P', [[20, 8], [24, 8], [28, 8]]);
      g[23][17] = ','; g[12][0] = ',';
      return {
        name: G.chapter >= 13 ? '東京・紀尾井坂' : '東京・銀座', g, bbg: 'tokyo', place: G.chapter >= 13 ? 'kioizaka' : 'ginza', bgm: () => G.chapter >= 13 ? 'sad' : 'town', noRide: true, weather: () => G.chapter >= 13 ? 'petals' : null,
        enc: () => G.chapter === 7 && !F('seihen') ? ENC.tokyo : null, encTiles: [';', ','], rare: RARE.meiji,
        labels: [[4, 2, '太政官'], [28, 15, '西郷邸']],
        triggers: [{ x: 0, y: 11, w: 2, h: 2, cond: () => G.chapter >= 13 && !F('kioi'), run: STORY.kioizaka }],
        houses: H.map((h, i) => hs(...h, ['太政官', '武器商', '洋品店', '牛鍋屋', '煉瓦蔵', '道具屋', '新聞社', '西郷邸'][i], [
          { w: 15, npcs: [npc(4, 4, 'iwakura', STORY.iwakuraTalk, { cond: () => G.chapter === 7 }), npc(10, 4, 'okubo', STORY.okubo7, { cond: () => G.chapter === 7 && F('okuboBack'), mark: true }), npc(7, 4, 'okubo', STORY.okubo13, { cond: () => G.chapter >= 13 && !F('letterGiven'), mark: true })] },
          { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('tokyo'))] },
          { npcs: [npc(5, 4, 'woman', (n) => STORY.talk('tokyoA', n))], items: [pot(8, 4, 'tk1', 'kiriko')] },
          { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] },
          { npcs: [], items: [chest(4, 4, 'tk2', 'motohira'), chest(7, 4, 'tk3', 'keihan', 2)] },
          { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('tokyoDougu'))] },
          { npcs: [npc(5, 4, 'elder', (n) => STORY.talk('tokyoNews', n))] },
          { npcs: [npc(5, 4, 'saigo', STORY.saigo7, { cond: () => G.chapter === 7 && !F('seihen'), mark: true })], items: [chest(9, 4, 'tk4', 'snider')] },
        ][i])).map((h, i) => i === 4 ? h : h),
        locks: [],
        npcs: [npc(16, 13, 'soldier', (n) => STORY.talk('tokyoPolice', n)), npc(10, 12, 'child', (n) => STORY.talk('tokyoKid', n)), npc(25, 12, 'woman', (n) => STORY.talk('tokyoB', n))],
      };
    },
  },
  // ---------------- 西南戦争 ----------------
  kumamoto: {
    build() {
      const g = grid(32, 24, '.'); border(g, 'T');
      rect(g, 9, 1, 14, 11, 'A'); rect(g, 12, 2, 8, 6, 'U'); rect(g, 12, 1, 8, 1, 'Q'); rect(g, 15, 11, 2, 1, 'G');
      if (F('tenshuFire')) { rect(g, 12, 2, 8, 2, 'r'); }
      rect(g, 15, 12, 2, 11, ','); rect(g, 1, 16, 30, 1, ',');
      dots(g, 'X', [[5, 13], [6, 13], [7, 13], [24, 13], [25, 13], [26, 13], [11, 14], [20, 14]]);
      const camp = house(g, 3, 18, 6, 6), camp2 = house(g, 23, 18, 6, 26);
      dots(g, 'b', [[2, 3], [3, 3], [2, 4], [28, 3], [29, 3], [29, 4]]);
      dots(g, 'T', [[4, 8], [6, 6], [26, 8], [27, 6], [10, 20], [21, 20]]);
      return {
        name: '熊本城', g, bbg: 'castle', place: 'kumamotojo', bgm: 'war', weather: () => 'snow',
        enc: () => G.chapter === 9 && !F('kumaEnd') ? (SAT() ? ENC.kumamotoS : ENC.kumamotoG) : null, encTiles: ['.', ','], rare: RARE.meiji,
        labels: [[16, 4, '熊本城'], [5, 18, '陣']],
        triggers: [{ x: 14, y: 12, w: 4, h: 2, cond: () => G.chapter === 9 && F('kuma9') && !F('kumaEnd'), run: STORY.kumamotoBoss }],
        houses: [hs(...camp, SAT() ? '薩軍の本営' : '政府軍の陣', { npcs: [npc(5, 3, SAT() ? 'saigo' : 'yamagata', STORY.kumaCamp, { cond: () => !F('kuma9'), mark: true }), npc(8, 4, 'merchant', () => shopTalk('jinchu'))] }), hs(...camp2, '陣小屋', { npcs: [npc(5, 4, 'smith', () => shopTalk('jinchuArms'))], items: [chest(2, 3, 'km1', 'meishu'), chest(8, 3, 'km2', 'horoku2', 3)] })],
        npcs: [pot(2, 21, 'km3', 'keihan'), pot(29, 21, 'km4', 'mikan')],
      };
    },
  },
  tabaru: {
    build() {
      const g = grid(34, 22, 'T');
      rect(g, 1, 9, 32, 4, ','); rect(g, 1, 8, 32, 1, '#'); rect(g, 1, 13, 32, 1, '#');
      for (let i = 1; i < 33; i += 3) { g[8][i] = 'b'; g[13][i] = 'b'; }
      rect(g, 2, 2, 8, 5, 'u'); rect(g, 22, 15, 10, 5, 'u'); rect(g, 2, 15, 8, 5, 'u'); rect(g, 22, 2, 10, 5, 'u');
      rect(g, 4, 7, 1, 2, ','); g[8][4] = ','; rect(g, 28, 13, 1, 3, ','); g[13][28] = ',';
      dots(g, 'X', [[6, 10], [12, 11], [18, 10], [24, 11], [5, 4], [26, 17]]);
      g[10][0] = ','; g[10][33] = ',';
      return {
        name: '田原坂', g, bbg: 'rain', place: 'tabaruzaka', bgm: 'war', weather: () => 'rain',
        enc: () => G.chapter === 10 && !F('tabaruEnd') ? (SAT() ? ENC.tabaruS : ENC.tabaruG) : null, encTiles: [',', 'u'], rare: RARE.meiji,
        labels: [[16, 10, '田原坂']],
        triggers: [{ x: 26, y: 9, w: 3, h: 4, cond: () => G.chapter === 10 && F('tabaru10') && !F('tabaruEnd'), run: STORY.tabaruBoss }],
        npcs: [
          npc(4, 10, SAT() ? 'beppu' : 'yamagata', STORY.tabaruCamp, { cond: () => G.chapter === 10 && !F('tabaru10'), mark: true }),
          npc(3, 11, 'merchant', () => shopTalk('jinchu')), npc(3, 9, 'smith', () => shopTalk('jinchuArms')),
          chest(5, 3, 'tr1', 'meishu'), chest(30, 18, 'tr2', 'keihan', 2), chest(28, 3, 'tr3', 'kiba3'),
        ],
      };
    },
  },
  enodake: {
    build() {
      const g = grid(32, 24, 'T');
      rect(g, 2, 14, 14, 9, '.'); const H = [house(g, 3, 15, 5, 5), house(g, 9, 15, 5, 11), house(g, 3, 19, 5, 5)];
      rect(g, 2, 13, 17, 1, ','); rect(g, 15, 2, 1, 12, ','); rect(g, 15, 2, 14, 1, ','); rect(g, 28, 2, 1, 8, ',');
      rect(g, 17, 4, 10, 8, 'M'); rect(g, 26, 9, 5, 4, '.');
      rect(g, 18, 14, 12, 8, 'u'); dots(g, 'X', [[20, 16], [24, 18], [27, 15]]);
      g[13][2] = ',';
      return {
        name: '可愛岳と長井村', g, bbg: 'mountain', place: 'enodake', bgm: () => F('enoEnd') ? 'sad' : 'war', night: () => F('enoNight') && !F('enoEnd'),
        enc: () => G.chapter === 11 && !F('enoEnd') ? (SAT() ? ENC.enoS : ENC.enoG) : null, encTiles: ['.', ',', 'u'], rare: RARE.meiji,
        labels: [[8, 15, '長井村'], [22, 6, '可愛岳'], [28, 10, '山頂']],
        triggers: [{ x: 26, y: 9, w: 5, h: 4, cond: () => G.chapter === 11 && F('enoNight') && !F('enoEnd'), run: STORY.enoBoss }],
        houses: [hs(...H[0], '長井村の家（宿陣）', { place: 'enodake', npcs: [npc(5, 3, 'saigo', STORY.nagai, { cond: () => SAT() && !F('nagai'), mark: true }), npc(5, 3, 'tsun', STORY.tsunGov, { cond: () => GOV() && !F('nagai'), mark: true })], items: [chest(9, 4, 'en1', 'meishu')] }), hs(...H[1], '村の家', { npcs: [npc(5, 4, 'elder', (n) => STORY.talk('nagaiVillager', n))], items: [pot(8, 4, 'en2', 'keihan')] }), hs(...H[2], '村の家', { npcs: [npc(5, 4, 'merchant', () => shopTalk('jinchu'))] })],
        npcs: [chest(20, 20, 'en3', 'horoku2', 3), chest(29, 15, 'en4', 'kurobuta', 3)],
      };
    },
  },
};
