'use strict';
// ===== マップ（記号＝タイル。gfx.js の TP を参照） =====
function grid(w, h, f) { return Array.from({ length: h }, () => Array(w).fill(f)); }
function rect(g, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = c; }
function house(g, x, y, w, door) { rect(g, x, y, w, 2, 'H'); rect(g, x, y + 2, w, 1, 'h'); g[y + 2][door] = 'D'; }
function dots(g, c, list) { for (const [x, y] of list) g[y][x] = c; }
const pot = (x, y, id, item) => ({ x, y, spr: 'pot', pot: id, item });

const MAPS = {
  kajiya: {
    build() {
      const g = grid(32, 24, '.');
      rect(g, 0, 0, 32, 1, 'T'); rect(g, 0, 23, 32, 1, 'T'); rect(g, 0, 0, 1, 24, 'T'); rect(g, 31, 0, 1, 24, 'T');
      rect(g, 26, 0, 2, 24, '~');
      rect(g, 1, 11, 30, 1, ','); rect(g, 26, 11, 2, 1, '='); g[11][31] = ',';
      rect(g, 8, 1, 1, 23, ','); g[0][8] = 'T';
      rect(g, 9, 16, 17, 1, ',');
      house(g, 2, 2, 4, 3); house(g, 11, 2, 4, 12); house(g, 19, 2, 4, 20);
      house(g, 2, 8, 5, 4); house(g, 10, 8, 4, 11); house(g, 16, 8, 5, 18);
      house(g, 10, 13, 5, 12); house(g, 16, 13, 4, 17); house(g, 21, 13, 4, 22);
      rect(g, 1, 17, 7, 1, 'g'); rect(g, 1, 22, 7, 1, 'g'); rect(g, 1, 17, 1, 6, 'g'); rect(g, 7, 17, 1, 6, 'g');
      rect(g, 2, 18, 5, 4, 'W'); g[19][7] = 'W';
      dots(g, 'K', [[2, 19], [4, 19]]);
      rect(g, 10, 18, 6, 4, 'F');
      dots(g, 'T', [[7, 3], [16, 3], [24, 5], [24, 8], [15, 6], [10, 5], [24, 19], [20, 20], [18, 22], [23, 22], [29, 3], [29, 18], [30, 7]]);
      if (F('bombarded')) {
        rect(g, 19, 2, 4, 3, 'r'); rect(g, 11, 2, 4, 2, 'r'); rect(g, 21, 13, 2, 2, 'r');
        if (!F('ch1end')) dots(g, 'f', [[20, 4], [13, 3], [24, 6], [21, 15]]);
      }
      return {
        name: '加治屋町', g,
        night: () => F('gesshoQuest') && !F('gessho'),
        onEnter: STORY.nightCall,
        warps: [{ x: 31, y: 11, to: 'kotsuki', x2: 1, y2: 10, dir: 2 }, { x: 8, y: 23, to: 'kaigan', x2: 8, y2: 1, dir: 0 }],
        npcs: [
          { x: 3, y: 12, spr: 'haha', dir: 0, talk: STORY.haha },
          { x: 12, y: 12, spr: 'senkichi', dir: 0, cond: () => !F('senkichi'), talk: STORY.senkichiJoin },
          { x: 5, y: 19, spr: 'senpai', dir: 1, cond: () => G.chapter === 0, talk: STORY.senpai },
          { x: 3, y: 21, spr: 'boy', dir: 3, talk: STORY.boy },
          { x: 18, y: 12, spr: 'saigo', dir: 0, cond: () => G.chapter === 0 && !F('gesshoQuest'), talk: STORY.saigo },
          { x: 13, y: 17, spr: 'okubo', dir: 0, talk: STORY.okubo },
          { x: 14, y: 17, spr: 'togo', dir: 0, cond: () => G.chapter === 1 && !F('togo'), talk: STORY.togoWait },
          { x: 17, y: 17, spr: 'merchant', dir: 0, talk: () => shopTalk('dougu') },
          { x: 22, y: 17, spr: 'smith', dir: 0, talk: () => shopTalk('kaji') },
          { x: 15, y: 12, spr: 'elder', dir: 0, talk: STORY.elder },
          { x: 22, y: 12, spr: 'woman', dir: 0, talk: STORY.woman },
          { x: 9, y: 6, spr: 'child', dir: 0, talk: STORY.child },
          pot(6, 6, 'kajiya1', 'karaimo'), pot(25, 21, 'kajiya2', 'kokuto'), pot(30, 21, 'kajiya3', 'omamori'),
        ],
      };
    },
  },
  kotsuki: {
    build() {
      const g = grid(30, 20, '.');
      rect(g, 0, 0, 30, 3, '~'); rect(g, 0, 3, 30, 1, 's');
      rect(g, 0, 19, 30, 1, 'T'); rect(g, 29, 0, 1, 20, 'T'); rect(g, 0, 4, 1, 15, 'T'); g[10][0] = ',';
      rect(g, 0, 10, 12, 1, ','); rect(g, 11, 6, 1, 5, ','); rect(g, 11, 6, 10, 1, ','); rect(g, 20, 6, 1, 8, ','); rect(g, 20, 13, 7, 1, ',');
      rect(g, 4, 13, 3, 3, 'T'); rect(g, 14, 9, 3, 3, 'T'); rect(g, 24, 5, 3, 2, 'T'); rect(g, 6, 5, 2, 2, 'T'); rect(g, 16, 15, 4, 2, 'T');
      dots(g, 'T', [[3, 7], [9, 16], [25, 9], [27, 16], [13, 4]]);
      dots(g, 'R', [[5, 3], [18, 3], [23, 3]]);
      return {
        name: '甲突川の河原', g, bbg: 'field',
        night: () => F('gesshoQuest') && !F('gessho'),
        enc: () => ENC.kotsuki, encTiles: ['.', 's'],
        warps: [{ x: 0, y: 10, to: 'kajiya', x2: 30, y2: 11, dir: 1 }],
        npcs: [
          { x: 27, y: 13, spr: 'rival', dir: 1, talk: STORY.rival },
          { x: 27, y: 12, spr: 'rivalkid', dir: 1, talk: STORY.rivalkid },
          { x: 27, y: 14, spr: 'rivalkid', dir: 1, talk: STORY.rivalkid },
          pot(2, 17, 'kotsuki1', 'tsukeage'), pot(27, 17, 'kotsuki2', 'kokuto'),
        ],
      };
    },
  },
  kaigan: {
    build() {
      const g = grid(30, 22, 's');
      rect(g, 0, 0, 30, 6, '.'); rect(g, 0, 0, 30, 1, 'T'); rect(g, 0, 0, 1, 15, 'T'); rect(g, 29, 0, 1, 6, 'T');
      rect(g, 8, 0, 1, 7, ',');
      rect(g, 0, 15, 30, 7, '~'); rect(g, 22, 6, 8, 9, '~');
      rect(g, 25, 8, 4, 4, 'M'); g[8][26] = 'm'; g[8][27] = 'm';
      rect(g, 12, 15, 1, 4, 'p');
      dots(g, '#', [[15, 14], [17, 14], [19, 14], [21, 14]]); dots(g, 'C', [[16, 14], [18, 14], [20, 14]]);
      dots(g, 'P', [[2, 7], [5, 6], [10, 6], [14, 7], [19, 6], [3, 11], [20, 9]]);
      dots(g, 'R', [[6, 13], [1, 14]]);
      if (G.chapter === 1 && !F('ch1end')) dots(g, 'S', [[4, 18], [9, 20], [16, 19], [20, 17], [25, 16], [15, 21], [27, 19]]);
      return {
        name: '錦江湾の浜', g, bbg: 'beach', encTiles: ['s'],
        night: () => F('gesshoQuest') && !F('gessho'),
        enc: () => (G.chapter === 1 && F('ch1brief') && !F('euryalus')) ? ENC.kaigan1 : null,
        warps: [{ x: 8, y: 0, to: 'kajiya', x2: 8, y2: 22, dir: 3 }],
        triggers: [
          { x: 9, y: 12, w: 7, h: 3, cond: () => F('gesshoQuest') && !F('gessho'), run: STORY.gessho },
          { x: 10, y: 13, w: 5, h: 2, cond: () => F('ch1brief') && !F('seizure'), run: STORY.seizure },
        ],
        npcs: [
          { x: 18, y: 12, spr: 'commander', dir: 0, talk: STORY.commander },
          { x: 6, y: 10, spr: 'fisher', dir: 0, talk: STORY.fisher },
          { x: 13, y: 18, spr: 'boat', cond: () => F('gesshoQuest') && !F('gessho'), talk: () => N('小舟が 波に揺れている……') },
          pot(2, 9, 'kaigan1', 'tsukeage'), pot(27, 5, 'kaigan2', 'shochu'), pot(21, 7, 'kaigan3', 'karukan'),
        ],
      };
    },
  },
};
