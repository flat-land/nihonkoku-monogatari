'use strict';
// ===== 薩摩の国（野山の地図）と、鹿児島県の各地の町 =====
// 町から町へは、野山の地図を実際に歩いて向かう。野山では敵が出るが、町の中では出ない。

// 道を引く：点から点へ、縦横に ',' を敷く。川や海を横切るところは橋 '=' にする
function road(g, pts) {
  for (let k = 0; k < pts.length - 1; k++) {
    let [x, y] = pts[k]; const [x1, y1] = pts[k + 1];
    while (true) {
      const t = g[y][x]; g[y][x] = t === '~' ? '=' : t === '=' ? '=' : ',';
      if (x === x1 && y === y1) break;
      if (x !== x1) x += Math.sign(x1 - x); else y += Math.sign(y1 - y);
    }
  }
}
// 野山の敵：場所（北・中・南・霧島）と時期で変わる。明治の頃は不平士族や密偵が出る
function satsumaEnc() {
  if (G.chapter >= 7) return ENC.meijiField;
  const x = G.px, y = G.py;
  if (x >= 28 && y <= 10) return ENC.satsumaK;
  if (y <= 14) return ENC.satsumaN;
  if (y >= 33) return ENC.satsumaS;
  return ENC.satsumaC;
}
// 鹿児島に居る章だけ、野山へ出られる
const IN_SATSUMA = () => [0, 1, 2, 3, 8].includes(G.chapter);

Object.assign(MAPS, {
  // ---------------- 薩摩の国（野山） ----------------
  satsuma: {
    build() {
      const W = 44, H = 46, g = grid(W, H, '.');
      const r = rnd(1868);
      // 西の海と南の海、錦江湾（東）
      for (let y = 0; y < H; y++) {
        const west = 2 + Math.round(1.6 * Math.sin(y / 4.5));
        for (let x = 0; x < west; x++) g[y][x] = '~';
        const south = 42 + Math.round(Math.sin(y / 3));
        if (y >= 11) { const bay = 26 + Math.round(1.4 * Math.sin(y / 3.2)) - (y > 36 ? 1 : 0); for (let x = bay; x < W; x++) g[y][x] = '~'; }
      }
      for (let x = 0; x < W; x++) { const s0 = 42 + Math.round(Math.sin(x / 3.5)); for (let y = s0; y < H; y++) g[y][x] = '~'; }
      // 岸辺の砂浜
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx] === '~')) g[y][x] = 's';
      // 霧島の山々（北東）と、中央の山地、開聞岳
      rect(g, 30, 0, 14, 4, 'M'); rect(g, 33, 4, 9, 1, 'M'); g[1][37] = 'm'; g[2][38] = 'm';
      for (let y = 15; y < 27; y++) { const a = 9 + Math.round(Math.sin(y / 2) * 1.5), b = 16 + Math.round(Math.cos(y / 3) * 1.5); for (let x = a; x < b; x++) g[y][x] = 'M'; }
      rect(g, 15, 39, 4, 2, 'M');
      // 森・竹林・田畑
      // 森はかたまりで（ところどころに竹林）
      for (let i = 0; i < 34; i++) { const cx = 2 + r() * (W - 4), cy = 2 + r() * (H - 4), rad = 1.5 + r() * 2.8, bam = r() < .15; for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) if (g[y] && g[y][x] === '.' && (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad + r() * 2) g[y][x] = bam ? 'b' : 'q'; }
      for (let i = 0; i < 70; i++) { const x = 1 + (r() * (W - 2)) | 0, y = 1 + (r() * (H - 2)) | 0; if (g[y][x] === '.') g[y][x] = 'q'; }
      for (const [x0, y0, w, h] of [[3, 13, 6, 3], [17, 28, 4, 2], [20, 37, 3, 2], [8, 6, 5, 2]]) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if ('.qb'.includes(g[y][x])) g[y][x] = 'u';
      // 川内川
      for (let x = 2; x < 23; x++) g[12 + Math.round(Math.sin(x / 3))][x] = '~';
      // 街道：城下から北の霧島・北西の出水・南の知覧、知覧から坊津・指宿へ
      road(g, [[24, 21], [24, 9], [36, 9], [36, 6]]);
      road(g, [[24, 21], [20, 21], [20, 8], [6, 8], [6, 5]]);
      road(g, [[21, 21], [21, 31], [16, 31]]);
      road(g, [[16, 31], [8, 31], [8, 40], [5, 40]]);
      road(g, [[21, 31], [21, 39], [23, 39]]);
      road(g, [[8, 35], [12, 35]]);
      // 町の目印のまわりは 森を払っておく
      for (const [x, y] of [[24, 21], [36, 6], [6, 4], [16, 31], [23, 40], [5, 40], [12, 35]]) { for (let j = y - 2; j <= y + 2; j++) for (let i = x - 2; i <= x + 2; i++) if (g[j] && 'qb'.includes(g[j][i])) g[j][i] = '.'; g[y][x] = ','; }
      return {
        name: '薩摩の国', g, bbg: 'field', bgm: 'field', place: 'satsumaroad', onEnter: () => STORY3.satsumaTip(),
        night: () => (F('gesshoQuest') && !F('gessho')),
        weather: () => G.chapter === 0 || G.chapter === 8 ? 'ash' : null,
        enc: satsumaEnc, encTiles: ['.', 'q', 'u', 'b'], encL: () => fieldL(), rare: G.chapter >= 7 ? RARE.meiji : RARE.early,
        props: [
          { x: 29, y: 12, img: 'sakurajima', smoke: [137, 46] }, { x: 13, y: 36, img: 'kaimon' },
          { x: 24, y: 21, icon: 'castle', label: '鹿児島城下' }, { x: 36, y: 6, icon: 'onsen', label: '霧島' }, { x: 6, y: 4, icon: 'buke', label: '出水' },
          { x: 16, y: 31, icon: 'buke', label: '知覧' }, { x: 23, y: 40, icon: 'onsen', label: '指宿' }, { x: 5, y: 40, icon: 'port', label: '坊津' }, { x: 12, y: 35, icon: 'cave', label: '開聞の森' },
        ],
        labels: [[24, 21, '鹿児島城下'], [36, 6, '霧島'], [6, 4, '出水'], [16, 31, '知覧'], [23, 40, '指宿'], [5, 40, '坊津'], [12, 35, '開聞の森'], [32, 14, '桜島'], [12, 12, '川内川']],
        warps: [
          { x: 24, y: 21, to: 'kotsuki', x2: 28, y2: 13, dir: 1 }, { x: 36, y: 6, to: 'kirishima', x2: 16, y2: 22, dir: 3 }, { x: 6, y: 4, to: 'izumi', x2: 15, y2: 20, dir: 3 },
          { x: 16, y: 31, to: 'chiran', x2: 1, y2: 11, dir: 2 }, { x: 23, y: 40, to: 'ibusuki', x2: 1, y2: 8, dir: 2 }, { x: 5, y: 40, to: 'bonotsu', x2: 26, y2: 9, dir: 1 }, { x: 12, y: 35, to: 'kaimon', x2: 12, y2: 22, dir: 3 },
        ],
        triggers: [
          // 第三章：龍馬を霧島へ案内する道中、幕府の隠密が待ち伏せる
          { x: 24, y: 12, w: 1, h: 3, cond: () => G.chapter === 3 && F('kirishimaIn') && !F('ambush3'), run: () => STORY3.ambush3() },
        ],
        npcs: [
          npc(23, 23, 'umakata', () => rentHorse(30), { cond: chFrom(1), dir: 0 }), npc(22, 23, 'horse', () => rentHorse(30), { cond: chFrom(1) }),
          chest(3, 18, 'sa1', 'yakusugi'), chest(40, 8, 'sa2', 'kiriko'), chest(10, 38, 'sa3', 'meishu'), pot(19, 10, 'sa4', 'chiran', 2), pot(10, 28, 'sa5', 'kurobuta'),
          { x: 23, y: 22, spr: 'sign', talk: () => N('立て札：「北　霧島・出水筋　　南　知覧・指宿・坊津\n野山には 山賊・海賊が出る。用心されたし」') },
        ],
      };
    },
  },

  // ---------------- 知覧（武家屋敷の町） ----------------
  chiran: {
    build() {
      // 知覧：三本分の広い通りの両側に、石垣と生垣。北の家は通りへ、南の家は裏の小道へ戸が開く
      const g = grid(30, 22, '.'); border(g, 'T');
      rect(g, 0, 10, 29, 3, ','); g[11][0] = ',';
      rect(g, 1, 8, 28, 1, 'g'); rect(g, 1, 9, 28, 1, '#'); rect(g, 1, 13, 28, 1, '#'); rect(g, 1, 14, 28, 1, 'g');
      const H = [house(g, 3, 4, 5, 5), house(g, 10, 4, 5, 12), house(g, 18, 4, 6, 20), house(g, 25, 4, 3, 26), house(g, 3, 15, 5, 5), house(g, 10, 15, 5, 12)];
      for (const [hx, hy] of H.slice(0, 4)) rect(g, hx, hy + 1, 1, 3, ',');
      // 南へ下りる石段と、裏の小道
      rect(g, 16, 13, 2, 2, ','); rect(g, 16, 15, 2, 6, ','); rect(g, 1, 18, 17, 1, ',');
      // 庭園：白砂、石、松、池
      rect(g, 19, 15, 9, 6, 's'); rect(g, 21, 17, 4, 2, '~'); dots(g, 'R', [[19, 16], [26, 16], [27, 19]]); dots(g, 'P', [[19, 15], [27, 15], [25, 20], [20, 19]]); rect(g, 18, 16, 1, 3, 's');
      rect(g, 2, 19, 12, 2, 'F');
      dots(g, 'T', [[2, 2], [8, 2], [16, 2], [24, 2], [28, 3], [15, 5], [15, 16]]);
      return {
        name: '知覧', g, place: 'chiran', bgm: 'town', noRide: true,
        labels: [[5, 4, '武具屋'], [12, 4, '道具屋'], [20, 4, '柚の家'], [5, 15, '宿'], [12, 15, '茶屋'], [22, 15, '庭園'], [0, 11, '野山へ']],
        warps: [{ x: 0, y: 11, to: 'satsuma', x2: 16, y2: 32, dir: 0 }],
        houses: [
          hs(...H[0], '武具屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('chiran'))] }),
          hs(...H[1], '道具屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('chiranDougu'))] }),
          hs(...H[2], '佐多家（お柚の家）', { w: 13, npcs: [npc(4, 4, 'elder', () => STORY3.yuzuFather())], items: [chest(10, 3, 'yuzuhome', 'chirancha2', 2)] }),
          hs(...H[3], '民家', { npcs: [npc(5, 4, 'woman', () => STORY3.line('chiranW'))], items: [pot(8, 4, 'ch1', 'chiran')] }),
          hs(...H[4], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[5], '茶屋', { npcs: [npc(5, 4, 'woman', () => STORY3.chiranChaya())] }),
        ],
        npcs: [
          npc(22, 10, 'oyuzu', () => STORY3.oyuzu(), { cond: () => !F('oyuzu'), mark: true }),
          npc(8, 12, 'elder', () => STORY3.line('chiranElder')), npc(26, 12, 'child', () => STORY3.line('chiranKid')), npc(1, 20, 'woman', () => STORY3.line('chiranTea'), { dir: 2 }),
          { x: 18, y: 13, spr: 'sign', talk: () => N('立て札：「南へ下りると 庭園と宿・茶屋。\n石と砂と刈り込みで、山や海をあらわす」') },
          pot(28, 20, 'ch2', 'kokuto'), chest(1, 17, 'ch3', 'naginata2'),
        ],
      };
    },
  },
  // 開聞の森（山賊の砦）
  kaimon: {
    build() {
      const g = grid(26, 24, 'T');
      const r = rnd(41);
      rect(g, 11, 18, 3, 6, ','); rect(g, 4, 18, 18, 2, '.'); rect(g, 4, 10, 2, 9, '.'); rect(g, 20, 10, 2, 9, '.'); rect(g, 4, 10, 18, 2, '.');
      rect(g, 11, 3, 3, 8, '.'); rect(g, 7, 2, 12, 3, 'u'); rect(g, 8, 13, 10, 3, '.'); rect(g, 6, 14, 2, 1, '.');
      for (let i = 0; i < 18; i++) { const x = 4 + (r() * 18) | 0, y = 10 + (r() * 10) | 0; if (g[y][x] === '.' && !(x >= 11 && x <= 13)) g[y][x] = 'q'; }
      dots(g, 'X', [[8, 2], [17, 2]]); g[1][12] = 'c';
      return {
        name: '開聞の森（山賊の砦）', g, bbg: 'field', bgm: () => F('sanzokuDone') ? 'field' : 'battle', place: 'kaimon', noRide: true,
        enc: () => F('sanzokuDone') ? null : ENC.kaimon, encTiles: ['.', 'q', 'u'], encL: () => fieldL(1), rare: RARE.early,
        labels: [[12, 2, '山賊の砦'], [12, 23, '野山へ']],
        warps: [{ x: 12, y: 23, to: 'satsuma', x2: 12, y2: 36, dir: 0 }],
        triggers: [{ x: 10, y: 4, w: 5, h: 2, cond: () => !F('sanzokuDone'), boss: 'sanzokuB', bx: 12, by: 3, run: () => STORY3.sanzokuBoss(), warn: '砦の奥に、山賊の頭が待ちかまえている。\n【ボス戦】準備はいいですか？' }],
        npcs: [chest(5, 11, 'km1', 'karukan', 2), chest(20, 18, 'km2', 'horoku', 3), chest(16, 14, 'km3', 'yakusugi'), chest(8, 3, 'km4', 'chiran', 3), chest(17, 3, 'km5', 'naginata3')],
      };
    },
  },

  // ---------------- 指宿（砂むし温泉と漁村） ----------------
  ibusuki: {
    build() {
      const g = grid(30, 22, '.'); border(g, 'T');
      rect(g, 0, 8, 26, 1, ','); g[8][0] = ','; rect(g, 1, 14, 28, 4, 's'); rect(g, 0, 18, 30, 4, '~'); rect(g, 1, 13, 28, 1, 's');
      rect(g, 13, 9, 1, 5, ',');
      const H = [house(g, 2, 3, 5, 4), house(g, 8, 3, 5, 10), house(g, 14, 3, 5, 16), house(g, 2, 9, 4, 3)];
      for (const [hx] of H.slice(0, 3)) g[7][hx] = ',';
      // 枚聞神社（北東）
      rect(g, 21, 1, 7, 2, 'H'); rect(g, 21, 3, 7, 1, 'h'); _BLD.push({ x: 21, y: 1, w: 7, door: 24, style: 'jinja' }); rect(g, 24, 4, 1, 4, ',');
      dots(g, 'l', [[23, 4], [25, 4]]);
      // 岩風呂
      rect(g, 7, 10, 5, 2, 'O'); rect(g, 17, 10, 4, 3, 'O'); dots(g, 'R', [[22, 15], [3, 16], [26, 16]]);
      dots(g, 'P', [[9, 14], [19, 15], [27, 14], [1, 15]]);
      rect(g, 22, 18, 1, 3, 'p');
      dots(g, 'T', [[19, 2], [28, 5], [20, 6], [27, 10]]);
      return {
        name: '指宿', g, place: 'ibusuki', bgm: () => F('kaizoku') && !F('kaizokuDone') ? 'war' : 'town', noRide: true,
        props: [{ x: 23, y: 5, img: 'torii' }, { x: 7, y: 10, img: 'onsen', w: 5, h: 2 }, { x: 17, y: 10, img: 'onsen', w: 4, h: 3 }],
        labels: [[4, 3, '湯治宿'], [10, 3, '浜の店'], [16, 3, '権兵衛の家'], [24, 1, '枚聞神社'], [9, 10, '岩風呂'], [3, 9, '漁師小屋'], [12, 15, '砂むしの浜'], [0, 8, '野山へ']],
        warps: [{ x: 0, y: 8, to: 'satsuma', x2: 22, y2: 39, dir: 1 }],
        triggers: [{ x: 22, y: 13, w: 6, h: 5, cond: () => F('kaizoku') && !F('kaizokuDone'), boss: 'kaizokuB', bx: 25, by: 15, bdir: 1, run: () => STORY3.kaizokuBoss(), warn: '浜に、黒鮫の海賊たちが 上がってきている！\n【ボス戦】準備はいいですか？' }],
        houses: [
          hs(...H[0], '湯治宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[1], '浜の店', { kind: 'shop', npcs: [npc(5, 3, 'fisher', () => shopTalk('ibusuki'))] }),
          hs(...H[2], '権兵衛の家', { npcs: [npc(5, 4, 'woman', () => STORY3.line('gonbeWife'))], items: [pot(8, 4, 'gonhome', 'tsukeage', 3)] }),
          hs(...H[3], '漁師小屋', { npcs: [npc(4, 4, 'fisher', () => STORY3.line('ibusukiFisher'))], items: [chest(8, 3, 'ib1', 'mori2')] }),
        ],
        look: Object.fromEntries([[7, 10, 5, 2], [17, 10, 4, 3]].flatMap(([x, y, w, h]) => Array.from({ length: w * h }, (_, k) => [(x + k % w) + ',' + (y + (k / w | 0)), () => STORY3.iwaburo()]))),
        npcs: [
          npc(12, 15, 'gonbe', () => STORY3.gonbe(), { cond: () => !F('gonbe'), mark: true }),
          npc(7, 15, 'woman', () => STORY3.sunamushi(), { dir: 0 }), npc(16, 15, 'elder', () => STORY3.line('ibusukiElder')),
          npc(24, 7, 'kannushi', () => STORY3.shrine('hiraki'), { dir: 0 }), npc(6, 13, 'child', () => STORY3.line('ibusukiKid')),
          pot(1, 13, 'ib2', 'ibusukisuna', 3), chest(28, 12, 'ib3', 'kubiwa'),
        ],
      };
    },
  },

  // ---------------- 坊津（唐船の港） ----------------
  bonotsu: {
    build() {
      const g = grid(28, 20, '.'); border(g, 'T');
      rect(g, 0, 13, 28, 7, '~'); rect(g, 0, 0, 3, 20, '~'); rect(g, 3, 12, 25, 1, 's'); rect(g, 3, 1, 1, 12, 's');
      rect(g, 4, 9, 24, 1, ','); g[9][27] = ',';
      const H = [house(g, 5, 2, 5, 7), house(g, 11, 2, 5, 13), house(g, 17, 2, 5, 19), house(g, 23, 2, 4, 24)];
      for (const [hx] of H) rect(g, hx, 5, 1, 4, ',');
      // 浜の蔵（抜け荷の蔵）
      rect(g, 6, 10, 3, 2, 'H'); rect(g, 6, 12, 3, 1, 'h'); g[12][7] = F('nukeniDone') ? 'D' : 'L'; _BLD.push({ x: 6, y: 10, w: 3, door: 7, style: 'kura' }); rect(g, 5, 13, 5, 1, 's');
      rect(g, 14, 13, 1, 5, 'p'); dots(g, 'S', [[12, 16], [17, 17], [8, 17]]);
      dots(g, 'T', [[10, 6], [22, 6], [26, 11]]); dots(g, 'P', [[4, 11], [20, 11], [11, 11]]);
      return {
        name: '坊津', g, place: 'bonotsu', bgm: 'town', noRide: true,
        labels: [[7, 2, '唐物屋'], [13, 2, '玄斎の医院'], [19, 2, '一乗院'], [25, 2, '宿'], [7, 10, '浜の蔵'], [14, 14, '桟橋'], [27, 9, '野山へ']],
        warps: [{ x: 27, y: 9, to: 'satsuma', x2: 6, y2: 40, dir: 2 }],
        houses: [
          hs(...H[0], '唐物屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('bonotsu'))] }),
          hs(...H[1], '玄斎の医院', { npcs: [npc(5, 4, 'gensai', () => STORY3.gensai(), { cond: () => !F('gensai') }), npc(8, 4, 'woman', () => STORY3.line('clinicW'))], items: [pot(2, 4, 'bo1', 'chiran', 2)] }),
          hs(...H[2], '一乗院（寺）', { npcs: [npc(5, 4, 'monk', () => STORY3.line('ichijoin'))], items: [chest(8, 3, 'bo2', 'omamori')] }),
          hs(...H[3], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          { x: 7, y: 12, name: '抜け荷の蔵', kind: 'kura', w: 9, h: 7, items: [chest(2, 3, 'bo3', 'bonotsugarasu'), chest(6, 3, 'bo4', 'tsue3'), chest(2, 5, 'bo5', 'kiriko'), { x: 6, y: 5, spr: 'chest', pot: 'bo6', money: 600 }] },
        ],
        npcs: [
          npc(7, 13, 'nukeniB', () => F('gensaiAsk') ? bossGate({ warn: '蔵の前に、抜け荷の元締めと用心棒がいる。\n【ボス戦】準備はいいですか？', run: () => STORY3.nukeniBoss() }) : S('nukeniB', '……ここは わしらの蔵じゃ。用がなかなら 去ね。', '……ここは私たちの蔵だ。用がないなら 立ち去れ。'), { cond: () => !F('nukeniDone'), mark: true }),
          npc(15, 11, 'fisher', () => STORY3.line('bonotsuFisher')), npc(22, 10, 'merchant', () => STORY3.line('bonotsuM')), npc(18, 7, 'child', () => STORY3.line('bonotsuKid')),
          pot(26, 7, 'bo7', 'kokuto', 2),
        ],
      };
    },
  },

  // ---------------- 出水（麓の武家屋敷と鶴、野間の関） ----------------
  izumi: {
    build() {
      const g = grid(30, 22, '.'); border(g, 'T');
      rect(g, 15, 3, 1, 19, ','); rect(g, 1, 12, 28, 1, ',');
      rect(g, 2, 11, 12, 1, 'g'); rect(g, 2, 13, 12, 1, 'g'); rect(g, 16, 11, 12, 1, 'g'); rect(g, 16, 13, 12, 1, 'g');
      const H = [house(g, 3, 7, 5, 5), house(g, 9, 7, 5, 11), house(g, 17, 7, 5, 19), house(g, 3, 14, 5, 5), house(g, 9, 14, 5, 11), house(g, 23, 7, 5, 25)];
      for (const [hx, hy] of H) { if (hy === 9) rect(g, hx, 10, 1, 2, ','); else g[13][hx] = ','; }
      // 野間の関（北）
      rect(g, 11, 2, 9, 1, '#'); rect(g, 11, 0, 1, 3, '#'); rect(g, 19, 0, 1, 3, '#'); g[2][15] = 'G'; g[0][15] = F('onmitsuDone') ? 'T' : 'T';
      rect(g, 12, 1, 3, 1, ','); rect(g, 16, 1, 3, 1, ',');
      // 鶴の来る田
      rect(g, 17, 14, 11, 7, 'u'); rect(g, 17, 17, 11, 1, 'n');
      dots(g, 'T', [[2, 3], [7, 3], [23, 3], [27, 4], [2, 19], [14, 19]]);
      const crane = (x, y, d) => npc(x, y, 'crane', () => N('鶴が 田んぼで 羽を休めている。\n出水には 冬になると、北の国から 鶴が渡ってくる。'), { dir: d });
      return {
        name: '出水', g, place: 'izumi', bgm: 'town', noRide: true,
        labels: [[5, 7, '武具屋'], [11, 7, '宿'], [19, 7, '黒木家'], [25, 7, '道具屋'], [15, 2, '野間の関'], [22, 15, '鶴の田'], [15, 21, '野山へ']],
        warps: [{ x: 15, y: 21, to: 'satsuma', x2: 6, y2: 5, dir: 0 }],
        triggers: [{ x: 14, y: 3, w: 3, h: 2, cond: () => F('onmitsuHunt') && !F('onmitsuDone'), boss: 'onmitsuB', bx: 15, by: 3, run: () => STORY3.onmitsuBoss(), warn: '関所の前に、怪しい黒ずくめの男がいる！\n【ボス戦】準備はいいですか？' }],
        houses: [
          hs(...H[0], '武具屋', { kind: 'shop', npcs: [npc(5, 3, 'smith', () => shopTalk('izumi'))] }),
          hs(...H[1], '宿', { npcs: [npc(5, 4, 'innkeeper', STORY.inn)] }),
          hs(...H[2], '黒木家', { npcs: [npc(5, 4, 'elder', () => STORY3.line('kuroki'))], items: [chest(8, 3, 'iz1', 'yari2')] }),
          hs(...H[3], '民家', { npcs: [npc(5, 4, 'woman', () => STORY3.line('izumiW'))], items: [pot(8, 4, 'iz2', 'karukan')] }),
          hs(...H[4], '郷士の詰所', { npcs: [npc(5, 4, 'boy', () => STORY3.line('izumiBoy'))], items: [chest(2, 3, 'iz3', 'tsurunohane')] }),
          hs(...H[5], '道具屋', { kind: 'shop', npcs: [npc(5, 3, 'merchant', () => shopTalk('dougu'))] }),
        ],
        npcs: [
          npc(15, 5, 'tetsu', () => STORY3.tetsu(), { cond: () => !F('tetsu'), mark: true, dir: 0 }),
          npc(13, 2, 'sekimori', () => STORY3.line('sekimori'), { dir: 0 }), npc(17, 2, 'sekimori', () => STORY3.line('sekimori'), { dir: 0 }),
          crane(19, 15, 1), crane(22, 16, 2), crane(25, 15, 1), crane(21, 19, 2), crane(26, 19, 1),
          npc(8, 12, 'elder', () => STORY3.line('izumiElder')), npc(22, 12, 'child', () => STORY3.line('izumiKid')),
          pot(28, 13, 'iz4', 'tsukeage', 2),
        ],
      };
    },
  },
});
