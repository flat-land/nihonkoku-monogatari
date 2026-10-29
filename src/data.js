'use strict';
// ===== 登場人物（マップ上の姿 spr ／ 会話の顔 por） =====
const PEOPLE = {
  shinpachi: { name: '新八', spr: { body: '#2f4a7a', legs: '#3a3a48' }, por: () => ({ style: G.chapter === 0 ? 'boy' : 'mage', fw: 7, brow: 2, eye: 'big', cloth: '#2f4a7a', skin: '#f0c39a', blush: G.chapter === 0 }) },
  senkichi: { name: '仙吉', spr: { body: '#7a5432', legs: '#4a3a2a' }, por: { fw: 7.5, brow: 1, eye: 'gentle', mouth: 'smile', cloth: '#7a5432', blush: true } },
  saigo: { name: '西郷吉之助', spr: { body: '#22252e', legs: '#22252e', skin: '#d9a477' }, por: { fw: 8.5, brow: 3, eye: 'big', cloth: '#22252e', skin: '#d9a477', mouth: 'firm', bg: '#3a2a2a' } },
  okubo: { name: '大久保一蔵', spr: { body: '#4a4f5c', legs: '#33363f' }, por: { fw: 6, brow: 2, eye: 'sharp', cloth: '#4a4f5c', bg: '#22303a' } },
  togo: { name: '東郷平八郎', spr: { body: '#2a3550', legs: '#2a2a3a', hat: 'jingasa' }, por: { style: 'boy', fw: 6.5, brow: 2, eye: 'sharp', cloth: '#2a3550', blush: true, bg: '#1e2c48' } },
  haha: { name: '母', spr: { body: '#6a4a6a', legs: '#6a4a6a', style: 'woman' }, por: { style: 'woman', fw: 6.5, eye: 'gentle', cloth: '#6a4a6a', bg: '#3a2a3a' } },
  senpai: { name: '二才頭の先輩', spr: { body: '#3a3a3a', legs: '#5a4a3a' }, por: { fw: 7, brow: 3, eye: 'sharp', cloth: '#3a3a3a' } },
  gessho: { name: '月照', spr: { body: '#5a5a60', legs: '#5a5a60', style: 'bald' }, por: { style: 'bald', fw: 6.5, eye: 'gentle', collar: 'robe', cloth: '#5a5a60' } },
  rival: { name: '高見馬場の大将', spr: { body: '#5a2a2a', legs: '#3a2a2a' }, por: { fw: 8, brow: 3, eye: 'sharp', cloth: '#5a2a2a', beard: 'stubble', bg: '#3a2222' } },
  rivalkid: { name: '高見馬場の若衆', spr: { body: '#6a3a2a', legs: '#3a2a2a' }, por: { fw: 7, brow: 2, eye: 'sharp', cloth: '#6a3a2a' } },
  commander: { name: '砲台の指揮官', spr: { body: '#2a2a2a', legs: '#2a2a2a', hat: 'jingasa' }, por: { fw: 7, brow: 2, eye: 'sharp', cloth: '#2a2a2a', mon: true, hat: 'jingasa', beard: 'stubble' } },
  elder: { name: '町の年寄り', spr: { body: '#6a6a5a', legs: '#4a4a3a', hair: '#cfcfcf' }, por: { fw: 7, eye: 'gentle', hair: '#d0d0d0', cloth: '#6a6a5a', beard: 'mustache' } },
  woman: { name: '町の女', spr: { body: '#8a5a4a', legs: '#8a5a4a', style: 'woman' }, por: { style: 'woman', fw: 6.5, cloth: '#8a5a4a', bg: '#3a2a2a' } },
  child: { name: '町の子', spr: { body: '#5a7a9a', legs: '#5a7a9a', style: 'short' }, por: { style: 'boy', fw: 7, eye: 'big', cloth: '#5a7a9a', blush: true } },
  boy: { name: '郷中の少年', spr: { body: '#4a5a3a', legs: '#3a3a2a' }, por: { style: 'boy', fw: 6.5, cloth: '#4a5a3a', blush: true } },
  merchant: { name: '道具屋', spr: { body: '#3a6a5a', legs: '#2a4a3a' }, por: { fw: 7.5, eye: 'gentle', mouth: 'smile', cloth: '#3a6a5a' } },
  smith: { name: '鍛冶屋', spr: { body: '#5a4a3a', legs: '#3a2a1a', skin: '#c88a5a' }, por: { fw: 8, brow: 2, skin: '#c88a5a', cloth: '#5a4a3a', beard: 'stubble' } },
  fisher: { name: '漁師', spr: { body: '#3a5a7a', legs: '#c8b48a', skin: '#c88a5a' }, por: { fw: 7, eye: 'gentle', skin: '#c08050', cloth: '#3a5a7a' } },
  pot: { name: '甕', spr: { kind: 'pot' } },
  boat: { name: '小舟', spr: { kind: 'boat' } },
};

// ===== 仲間の能力 =====
// skills: [わざID, 覚えるレベル, 必要なフラグ]
const HEROES = {
  shinpachi: { base: { hp: 30, ki: 5, atk: 8, def: 5, spd: 6 }, grow: { hp: 6.5, ki: 1.6, atk: 2.4, def: 1.6, spd: 1.3 }, kinds: ['sword'], skills: [['chest', 1, 'tutorial'], ['unyo', 8]], start: { w: 'kotou', a: 'keikogi', h: 'hachimaki' } },
  senkichi: { base: { hp: 27, ki: 9, atk: 7, def: 5, spd: 7 }, grow: { hp: 5.8, ki: 2.2, atk: 2.0, def: 1.5, spd: 1.3 }, kinds: ['sword'], skills: [['teate', 1], ['tsubute', 3], ['souteate', 7]], start: { w: 'kotou', a: 'keikogi' } },
  togo: { base: { hp: 26, ki: 10, atk: 7, def: 4, spd: 8 }, grow: { hp: 5.5, ki: 2.0, atk: 2.2, def: 1.3, spd: 1.4 }, kinds: ['gun'], skills: [['hougeki', 1], ['nerai', 8]], start: { w: 'hinawa', a: 'kasuri', h: 'jingasa' } },
};

const SKILLS = {
  chest: { name: 'チェスト', ki: 3, target: 'enemy', type: 'atk', pow: 1.6, first: 2, desc: '示現流の一撃。戦いの最初のターンは威力2倍' },
  unyo: { name: '雲耀の太刀', ki: 7, target: 'enemy', type: 'atk', pow: 3.0, desc: '稲妻より速いといわれる示現流の奥義' },
  teate: { name: '手当て', ki: 3, target: 'ally', type: 'heal', pow: 28, desc: '仲間ひとりのHPを回復' },
  souteate: { name: '総手当て', ki: 8, target: 'allies', type: 'heal', pow: 30, desc: '仲間全員のHPを回復' },
  tsubute: { name: '石つぶて', ki: 2, target: 'enemy', type: 'atk', pow: 1.3, sure: true, desc: '必ず当たる投石' },
  hougeki: { name: '砲撃', ki: 5, target: 'enemies', type: 'atk', pow: 1.0, desc: '敵全体を撃つ' },
  nerai: { name: '狙い撃ち', ki: 4, target: 'enemy', type: 'atk', pow: 2.2, sure: true, desc: '必ず当たる強力な一発' },
};

// ===== 道具・武器・防具（鹿児島ゆかりの品） =====
// type: use=道具 w=武器 a=体 h=頭 x=装飾
const ITEMS = {
  karaimo: { name: 'からいも', type: 'use', price: 8, heal: 30, desc: '薩摩の芋。HPを30回復' },
  tsukeage: { name: 'つけあげ', type: 'use', price: 24, heal: 70, desc: '魚のすり身の揚げ物。HPを70回復' },
  kokuto: { name: '黒糖', type: 'use', price: 40, ki: 12, desc: '奄美の黒砂糖。気を12回復' },
  karukan: { name: 'かるかん', type: 'use', price: 70, heal: 150, desc: '山芋の蒸し菓子。HPを150回復' },
  daikon: { name: '桜島大根', type: 'use', price: 160, healAll: 90, desc: '世界一大きな大根。全員のHPを90回復' },
  shochu: { name: '芋焼酎', type: 'use', price: 120, revive: 0.5, desc: '倒れた仲間を起こす（HP半分）' },
  kotou: { name: '稽古の木刀', type: 'w', kind: 'sword', atk: 2, price: 10, desc: '郷中で使う古い木刀' },
  yusu: { name: '柞の木刀', type: 'w', kind: 'sword', atk: 6, price: 60, desc: '示現流で使う、硬い柞（ゆす）の木刀' },
  saigobokuto: { name: '吉之助の木刀', type: 'w', kind: 'sword', atk: 9, price: 0, desc: '西郷吉之助が若い頃に振っていた木刀' },
  satsumagoshirae: { name: '薩摩拵の刀', type: 'w', kind: 'sword', atk: 13, price: 240, desc: '鍔が小さく柄の長い、薩摩独特の刀' },
  naminohira: { name: '波平の刀', type: 'w', kind: 'sword', atk: 20, price: 720, desc: '薩摩の刀工・波平一派の名刀' },
  hinawa: { name: '火縄銃', type: 'w', kind: 'gun', atk: 8, price: 200, desc: '種子島に伝わった鉄砲の流れをくむ銃' },
  geweer: { name: 'ゲベール銃', type: 'w', kind: 'gun', atk: 15, price: 650, desc: 'オランダから入った洋式銃' },
  keikogi: { name: '稽古着', type: 'a', def: 2, price: 10, desc: '汗のしみた木綿の稽古着' },
  kasuri: { name: '薩摩絣の着物', type: 'a', def: 5, price: 70, desc: '薩摩の紺絣。丈夫な木綿' },
  jinbaori: { name: '陣羽織', type: 'a', def: 10, price: 320, desc: '戦のときに鎧の上に着る羽織' },
  gusoku: { name: '島津の具足', type: 'a', def: 16, price: 900, desc: '島津家の家臣が使った鎧' },
  hachimaki: { name: '鉢巻', type: 'h', def: 1, price: 5, desc: '気合いを入れる白い鉢巻' },
  jingasa: { name: '陣笠', type: 'h', def: 4, price: 110, desc: '足軽や砲手がかぶる笠' },
  omamori: { name: '薩摩焼の守り', type: 'x', def: 2, spd: 3, price: 180, desc: '白薩摩の小さなお守り' },
  hatajirushi: { name: '丸に十字の旗印', type: 'x', atk: 4, spd: 1, price: 0, desc: '島津家の家紋。士気が上がる' },
};
const SLOT_NAMES = { w: '武器', a: '体', h: '頭', x: '装飾' };

// ===== 敵（実在した人々・軍・戦争） =====
// skills: { p:確率, type: one|all|explode|buff, pow, msg ({n}=敵の名前) }
const ENEMIES = {
  senpai: { name: '二才頭の先輩', spr: { kind: 'samurai', hairStyle: 'mage', body: '#3a3a3a', lower: '#5a4a3a', hakama: true, w: 'bokuto' }, hp: 45, atk: 8, def: 3, spd: 4, exp: 12, gold: 0, skills: [{ p: .25, type: 'one', pow: 1.5, msg: '{n}は 立木打ちの勢いで打ちかかってきた！' }] },
  wakashu: { name: '他郷中の若衆', spr: { kind: 'samurai', hairStyle: 'mage', body: '#6a3a2a', lower: '#3a2a2a', hakama: true, w: 'bokuto', hat: 'hachimaki' }, hp: 16, atk: 8, def: 3, spd: 5, exp: 5, gold: 7 },
  nise: { name: '喧嘩っ早い二才', spr: { kind: 'samurai', hairStyle: 'mage', body: '#5a5a2a', lower: '#3a3a2a', hakama: true, w: 'club' }, hp: 24, atk: 10, def: 4, spd: 6, exp: 8, gold: 10, skills: [{ p: .3, type: 'one', pow: 1.2, msg: '{n}は 石を投げてきた！' }] },
  taisho: { name: '高見馬場の大将', spr: { kind: 'samurai', hairStyle: 'mage', body: '#5a2a2a', lower: '#2a1a1a', hakama: true, w: 'bokuto', beard: '#3a2a2a' }, hp: 110, atk: 15, def: 6, spd: 6, exp: 45, gold: 60, skills: [{ p: .3, type: 'one', pow: 1.8, msg: '{n}の 渾身の一撃！' }, { p: .2, type: 'all', pow: .9, msg: '{n}は 木刀を振り回した！' }] },
  sailor: { name: '英国水兵', spr: { kind: 'sailor', hairStyle: 'west', hair: '#8a5a2a', skin: '#f2c8a8', body: '#1a2a5a', lower: '#e8e8e8', hat: 'cap', w: 'cutlass' }, hp: 38, atk: 20, def: 10, spd: 9, exp: 18, gold: 24 },
  marine: { name: '英国海兵隊', spr: { kind: 'marine', hairStyle: 'west', hair: '#c8a060', skin: '#f2c8a8', body: '#b02020', lower: '#1a1a2a', hat: 'shako', w: 'rifle' }, hp: 52, atk: 22, def: 13, spd: 7, exp: 26, gold: 32, skills: [{ p: .25, type: 'all', pow: .8, msg: '{n}の 一斉射撃！' }] },
  boat: { name: '艦載ボート隊', spr: { t: 'boat' }, hp: 70, atk: 18, def: 11, spd: 6, exp: 32, gold: 40, skills: [{ p: .3, type: 'all', pow: .7, msg: '{n}が ボートから小銃を撃ってきた！' }] },
  shell: { name: 'アームストロング砲弾', spr: { t: 'shell' }, hp: 26, atk: 26, def: 22, spd: 14, exp: 24, gold: 6, skills: [{ p: .45, type: 'explode', pow: .9, msg: '{n}が 炸裂した！' }] },
  captain: { name: '拿捕隊の士官', spr: { kind: 'officer', hairStyle: 'west', hair: '#6a4a2a', skin: '#f2c8a8', body: '#141a3a', lower: '#141a3a', hat: 'bicorne', w: 'cutlass', beard: '#6a4a2a' }, hp: 200, atk: 26, def: 13, spd: 9, exp: 120, gold: 150, skills: [{ p: .25, type: 'one', pow: 1.6, msg: '{n}の 鋭い斬撃！' }, { p: .15, type: 'buff', msg: '{n}は 水兵たちを鼓舞した！' }] },
  euryalus: { name: '旗艦ユーリアラス号', spr: { t: 'ship' }, hp: 620, atk: 30, def: 15, spd: 5, exp: 400, gold: 300, defeat: '{n}の 艦橋に 砲弾が命中した！', skills: [{ p: .28, type: 'all', pow: .95, msg: '{n}の アームストロング砲が 火を噴いた！' }, { p: .2, type: 'all', pow: .75, msg: '{n}から ロケット弾が降り注ぐ！' }, { p: .12, type: 'buff', msg: '{n}は 舷側をこちらに向けた！' }] },
};

const ENC = {
  kotsuki: [['wakashu'], ['wakashu', 'wakashu'], ['nise'], ['wakashu', 'nise'], ['nise', 'nise'], ['wakashu', 'wakashu', 'wakashu']],
  kaigan1: [['sailor'], ['sailor', 'sailor'], ['marine'], ['sailor', 'marine'], ['boat'], ['shell', 'shell'], ['marine', 'marine'], ['sailor', 'shell', 'sailor']],
};

const SHOPS = {
  dougu: () => G.chapter >= 1 ? ['karaimo', 'tsukeage', 'kokuto', 'karukan', 'daikon', 'shochu'] : ['karaimo', 'tsukeage', 'kokuto', 'shochu'],
  kaji: () => G.chapter >= 1 ? ['satsumagoshirae', 'naminohira', 'hinawa', 'geweer', 'kasuri', 'jinbaori', 'gusoku', 'jingasa', 'omamori'] : ['yusu', 'kasuri', 'jingasa'],
};
