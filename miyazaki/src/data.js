'use strict';
// ===== 日本國物語 宮崎編「日向の灯」 =====
// 西南戦争の終わり（明治十年）から、宮崎県がふたたび置かれる（明治十六年）までの日向の国が舞台。
// 主人公の甲斐源太と幼なじみのお菊、猟犬のアカは架空の人物。歴史上の人物と出来事は史実をもとにしている。

const GAME = {
  pref: '宮崎県', title: '日向の灯', sub: '〜残り火を継ぐ少年〜', ver: '宮崎編　v1.0', saveKey: 'nihonkoku-miyazaki-v1', leader: 'genta',
  start: ['nagai', 9, 9, 0], dialect: '日向弁', pot: '甕', startInv: { hiyajiru: 3 }, startMoney: 30, titleBg: 'hyuga', titleWeather: 'fireflies',
  freeMates: ['osuzu', 'tatsu', 'heizo', 'yashichi'],
  chapters: ['序章', '第一章', '第二章', '第三章', '第四章', '終章'],
  endNote: '源太の心（海と山）と、お菊との絆で結末が変わります。',
  heart: id => id === 'genta' ? `<div class="heart">源太の心　<span class="jo">海 ${'●'.repeat(Math.min(8, pts('umi')))}</span>　<span class="ri">山 ${'●'.repeat(Math.min(8, pts('yama')))}</span>${pts('kizuna') ? `　お菊との絆 ${'♥'.repeat(Math.min(6, pts('kizuna')))}` : ''}</div>` : '',
  words: {
    shopBye: ['また来ないよ。', 'またおいでください。'], noMoney: ['お金が 足らんとよ。'], noSell: ['売れる物が ないっちゃが。'],
    jinRest: ['休んでいくね？\n控えの衆も ここに おるっちゃが。', '休んでいきますか？\n控えの人たちも ここにいますよ。'],
    horse: ['馬に乗っていかんね？\n{p}文で、野山なら どこでん走るっちゃが。', '馬に乗っていきませんか？\n{p}文で、野山ならどこへでも走りますよ。'], horseNg: ['……銭が足らんね。', '……お金が足りませんね。'],
  },
};
const SKIN = '#f2c49c', SKIN2 = '#dca77a';
const GOVU0 = { body: '#1a2244', body2: '#1a2244', cloth: 'uniform', hs: 'short', hat: 'kepi' };
const ADULT = () => G.chapter >= 2;

// ===== 登場人物 =====
const PEOPLE = {
  genta: {
    name: '源太',
    spr: () => ADULT() ? { body: '#3a6a4a', body2: '#4a4a3a', belt: '#c8a040', cloth: 'hakama', hs: 'spiky', sword: true, brow: 1 } : { body: '#4a7a4a', body2: '#6a5a3a', cloth: 'kimono', hs: 'spiky', hat: 'hachimaki', hatc: '#e8e0d0', blush: true },
    por: () => ({ style: ADULT() ? 'mage' : 'boy', fw: 7, brow: 2, eye: 'big', cloth: '#3a6a4a', blush: !ADULT(), mouth: 'smile', bg: '#1e3a2a' }),
  },
  kiku: { name: 'お菊', spr: () => ({ body: ADULT() ? '#6a4a8a' : '#c86a7a', cloth: 'dress', hs: 'woman', belt: '#e8c040', blush: !ADULT() }), por: () => ({ style: 'woman', fw: 6.2, eye: 'big', cloth: ADULT() ? '#6a4a8a' : '#c86a7a', bg: '#3a2a3a', mouth: 'smile', blush: !ADULT() }) },
  aka: { name: 'アカ', spr: { kind: 'dog', body: '#a8542a' }, por: { style: 'bald' }, dogHi: { fur: '#a8542a', furL: '#d8884a', muzzle: '#e8c8a0', collar: '#2a5aa8' } },
  jiji: { name: '源太の祖父', spr: { body: '#5a5a4a', body2: '#4a4a3a', hair: '#d0d0d0', eyes: 'closed', beard: '#d0d0d0', skin: '#c88a5a' }, por: { fw: 7.5, eye: 'gentle', hair: '#d0d0d0', cloth: '#5a5a4a', beard: 'full', skin: '#c08050' } },
  ogura: { name: '小倉処平', spr: { body: '#3a3a4a', body2: '#2a2a2a', cloth: 'hakama', hs: 'mage', sword: true }, por: { style: 'mage', fw: 6.6, brow: 2, eye: 'normal', cloth: '#3a3a4a', mouth: 'firm', bg: '#22303a' } },
  shinpachi: { name: '日高新八', spr: { body: '#2a2a2a', body2: '#2a2a2a', cloth: 'hakama', hs: 'spiky', sword: true, brow: 1, crest: true }, por: { style: 'short', fw: 7, brow: 2, eye: 'big', cloth: '#2f4a7a', scar: true, bg: '#2a2430' } },
  saigo: { name: '西郷隆盛', spr: { body: '#1a2244', body2: '#1a2244', cloth: 'uniform', hs: 'short', big: true, skin: SKIN2, brow: 2, eyes: 'big' }, por: { style: 'short', fw: 8.5, brow: 3, eye: 'big', cloth: '#22252e', skin: SKIN2, mouth: 'firm', bg: '#3a2a2a' } },
  kirino: { name: '桐野利秋', spr: { body: '#4a3a2a', body2: '#2a2a2a', cloth: 'hakama', hs: 'spiky', sword: true, brow: 2 }, por: { style: 'short', fw: 7, brow: 3, eye: 'sharp', cloth: '#4a3a2a', mouth: 'firm', bg: '#3a2a22', scar: true } },
  yamagata: { name: '山県有朋', spr: { body: '#1a2244', body2: '#1a2244', cloth: 'uniform', hs: 'short', hat: 'kepi' }, por: { style: 'short', fw: 6.5, brow: 2, eye: 'sharp', cloth: '#1a2244', collar: 'uniform', beard: 'mustache', hat: 'kepi', bg: '#1a2030' } },
  yamagata2: { name: '山田顕義（内務卿）', spr: { body: '#1a1a22', body2: '#1a1a22', cloth: 'west', hs: 'west', beard: '#1c1a22' }, por: { style: 'west', fw: 6.8, brow: 2, eye: 'sharp', cloth: '#1a1a22', collar: 'west', beard: 'full', bg: '#22222a' } },
  naito: { name: '内藤政挙', spr: { body: '#3a3a5a', body2: '#2a2a3a', cloth: 'hakama', hs: 'short' }, por: { style: 'short', fw: 6.6, brow: 1, eye: 'gentle', cloth: '#3a3a5a', mouth: 'smile', bg: '#2a2a3a' } },
  kawagoe: { name: '川越進', spr: { body: '#2a3a3a', body2: '#3a3a3a', cloth: 'hakama', hs: 'short', beard: '#1a1a1a' }, por: { style: 'short', fw: 7, brow: 2, eye: 'normal', cloth: '#2a3a3a', beard: 'whiskers', mouth: 'firm', bg: '#1e3030' } },
  komura: { name: '小村寿太郎', spr: { body: '#1a1a22', body2: '#2a2a2a', cloth: 'west', hs: 'west', beard: '#1c1a22' }, por: { style: 'west', fw: 6, brow: 2, eye: 'sharp', cloth: '#1a1a22', collar: 'west', beard: 'mustache', bg: '#22283a' } },
  kenrei: { name: '鹿児島県の役人', spr: { body: '#1a1a22', body2: '#1a1a22', cloth: 'west', hs: 'west' }, por: { style: 'west', fw: 7, brow: 2, eye: 'sharp', cloth: '#1a1a22', collar: 'west' } },
  // 寄り道の仲間（架空の人物）
  osuzu: { name: 'お鈴', spr: { body: '#f0ece0', body2: '#c02020', cloth: 'hakama', hs: 'woman', hat: 'hachimaki', hatc: '#e8c040' }, por: { style: 'woman', fw: 6.2, eye: 'gentle', cloth: '#f0ece0', bg: '#3a2a20', mouth: 'smile' } },
  tatsu: { name: '辰五郎', spr: { body: '#2f5a7a', body2: '#c8b48a', skin: '#c88a5a', cloth: 'kimono', hat: 'hachimaki', hatc: '#2a2a2a', beard: '#2a1a10', big: true }, por: { style: 'short', fw: 8.2, brow: 2, eye: 'normal', skin: '#c88a5a', cloth: '#2f5a7a', beard: 'stubble', mouth: 'smile', bg: '#1e3a4a' } },
  heizo: { name: '平蔵', spr: { body: '#5a4a2a', body2: '#3a3a2a', cloth: 'hakama', hs: 'mage', brow: 2 }, por: { style: 'mage', fw: 7.2, brow: 3, eye: 'sharp', cloth: '#5a4a2a', mouth: 'firm', bg: '#2a2a1e', beard: 'stubble' } },
  yashichi: { name: '弥七', spr: { body: '#4a3a2a', body2: '#3a2a1a', skin: '#c88a5a', cloth: 'kimono', hs: 'short', hat: 'kasa' }, por: { style: 'short', fw: 7, brow: 2, eye: 'sharp', skin: '#c08050', cloth: '#4a3a2a', bg: '#2a3020' } },
  // 町の人
  elder: { name: '村の年寄り', spr: { body: '#6a6a5a', body2: '#4a4a3a', hair: '#d0d0d0', eyes: 'closed', beard: '#d0d0d0' }, por: { fw: 7, eye: 'gentle', hair: '#d0d0d0', cloth: '#6a6a5a' } },
  woman: { name: '村の女', spr: { body: '#8a5a4a', cloth: 'dress', hs: 'woman' }, por: { style: 'woman', fw: 6.5, cloth: '#8a5a4a' } },
  child: { name: '村の子', spr: { body: '#5a7a9a', body2: '#5a7a9a', cloth: 'kimono', hs: 'kid', blush: true }, por: { style: 'short', fw: 7, eye: 'big', cloth: '#5a7a9a' } },
  merchant: { name: '店の主', spr: { body: '#3a6a5a', body2: '#2a4a3a', cloth: 'kimono', eyes: 'closed' }, por: { fw: 7.5, eye: 'gentle', cloth: '#3a6a5a' } },
  smith: { name: '鍛冶屋', spr: { body: '#5a4a3a', body2: '#3a2a1a', skin: '#c88a5a', hat: 'hachimaki', beard: '#2a1a10' }, por: { fw: 8, skin: '#c88a5a', cloth: '#5a4a3a' } },
  fisher: { name: '漁師', spr: { body: '#3a5a7a', body2: '#c8b48a', skin: '#c88a5a', cloth: 'kimono', hat: 'kasa' }, por: { fw: 7, skin: '#c08050', cloth: '#3a5a7a' } },
  umakata: { name: '馬方', spr: { body: '#6a5a3a', body2: '#4a3a2a', skin: '#c88a5a', hat: 'kasa' }, por: { fw: 7.5, skin: '#c08050', cloth: '#6a5a3a' } },
  innkeeper: { name: '宿の女将', spr: { body: '#4a5a7a', cloth: 'dress', hs: 'woman' }, por: { style: 'woman', fw: 6.8, cloth: '#4a5a7a' } },
  monk: { name: '寺の僧', spr: { body: '#4a4a50', cloth: 'robe', hs: 'bald', eyes: 'closed' }, por: { style: 'bald', fw: 7, cloth: '#4a4a50' } },
  kannushi: { name: '神主', spr: { body: '#f0ece0', body2: '#6a5aa0', cloth: 'robe', hat: 'eboshi', eyes: 'closed' }, por: { fw: 7, cloth: '#f0ece0' } },
  student: { name: '書生', spr: { body: '#3a3a44', body2: '#2a2a2a', cloth: 'hakama', hs: 'short' }, por: { style: 'short', fw: 7, cloth: '#3a3a44' } },
  soldier: { name: '政府軍の兵', spr: { body: '#1a2244', body2: '#1a2244', cloth: 'uniform', hs: 'short', hat: 'kepi' }, por: { style: 'short', fw: 7, cloth: '#1a2244', collar: 'uniform', hat: 'kepi' } },
  satsuhei: { name: '薩軍の兵', spr: { body: '#2a2a2a', body2: '#2a2a2a', cloth: 'hakama', hs: 'short', sword: true, crest: true }, por: { style: 'short', fw: 7, cloth: '#2a2a2a' } },
  police: { name: '巡査', spr: { body: '#1a1a2a', body2: '#1a1a2a', cloth: 'uniform', hs: 'short', hat: 'kepi', hatc: '#1a1a1a' }, por: { style: 'short', fw: 7, cloth: '#1a1a2a', collar: 'uniform', hat: 'kepi' } },
  official: { name: '役人', spr: { body: '#2a2a32', body2: '#2a2a32', cloth: 'west', hs: 'west' }, por: { style: 'west', fw: 7, cloth: '#2a2a32', collar: 'west' } },
  ochiB: { name: '落ち武者の頭', spr: { body: '#3a2a22', body2: '#2a2a2a', cloth: 'hakama', hs: 'spiky', sword: true, big: true, brow: 2, beard: '#2a1a10' }, por: { fw: 8, brow: 3, eye: 'sharp', cloth: '#3a2a22', beard: 'full' } },
  hantaiB: { name: '都城の論客', spr: { body: '#2a2a3a', body2: '#3a3a3a', cloth: 'hakama', hs: 'mage', brow: 2 }, por: { fw: 7, brow: 3, eye: 'sharp', cloth: '#2a2a3a' } },
  satsumasoldier: { name: '薩軍の兵', spr: { body: '#2a2a2a', body2: '#2a2a2a', cloth: 'hakama', hat: 'jingasa', crest: true, sword: true } },
  govsoldier: { name: '政府軍の兵', spr: { ...GOVU0 } },
  pot: { name: '甕', spr: { kind: 'pot' } }, chest: { name: '葛籠', spr: { kind: 'chest' } }, boat: { name: '小舟', spr: { kind: 'boat' } }, horse: { name: '馬', spr: { kind: 'horse' } }, sign: { name: '立て札', spr: { kind: 'sign' } }, crane: { name: '鶴', spr: { kind: 'crane' } },
};
// 会話の顔絵を出さない人（モブ）
for (const id of ['satsumasoldier', 'govsoldier', 'jiji', 'elder', 'woman', 'child', 'merchant', 'smith', 'fisher', 'umakata', 'innkeeper', 'monk', 'kannushi', 'student', 'soldier', 'satsuhei', 'police', 'official', 'ochiB', 'hantaiB', 'kenrei', 'pot', 'chest', 'boat', 'horse', 'sign', 'crane']) MOBS.add(id);
HI_HAIR.genta = 'spiky'; HI_HAIR.shinpachi = 'spiky';

// ===== 仲間の能力 =====
const HEROES = {
  genta: { el: '木', base: { hp: 30, ki: 6, atk: 8, def: 5, spd: 7 }, grow: { hp: 6.6, ki: 1.7, atk: 2.4, def: 1.6, spd: 1.4 }, kinds: ['sword', 'gun'], skills: [['yamagatana', 1], ['karyudo', 3], ['emono', 7], ['enodake', 11], ['hyugaoroshi', 16], ['nokoribi', 22], ['akebono', 28], ['himuka', 34]], start: { w: 'yamagatana1', a: 'nobaki', h: 'hachimaki' } },
  kiku: { el: '水', base: { hp: 24, ki: 12, atk: 5, def: 4, spd: 8 }, grow: { hp: 5.4, ki: 2.6, atk: 1.6, def: 1.4, spd: 1.4 }, kinds: ['cane'], skills: [['teate', 1], ['yakusou', 4], ['hiyajiru', 8], ['inori', 12], ['souteate', 16], ['ranpo', 22], ['hyuganatsu', 28]], start: { w: 'tsue1', a: 'kasuri' } },
  aka: { el: '木', dog: true, base: { hp: 24, ki: 6, atk: 9, def: 3, spd: 12 }, grow: { hp: 5.2, ki: 1.2, atk: 2.3, def: 1.2, spd: 1.7 }, kinds: ['fang'], skills: [['kamitsuki', 1], ['hoeru', 3], ['oikomi', 7], ['nodobue', 12], ['yamainu', 18], ['banken', 24]], start: { w: 'kiba', a: 'inudo' } },
  ogura: { el: '金', base: { hp: 40, ki: 14, atk: 13, def: 8, spd: 9 }, grow: { hp: 6, ki: 2, atk: 2.2, def: 1.5, spd: 1.3 }, kinds: ['sword'], skills: [['obiken', 1], ['obisaigo', 1], ['gakumon', 1]], start: { w: 'katana1', a: 'haori' } },
  shinpachi: { el: '火', base: { hp: 60, ki: 16, atk: 20, def: 12, spd: 12 }, grow: { hp: 7, ki: 1.8, atk: 2.6, def: 1.7, spd: 1.3 }, kinds: ['sword'], skills: [['chest', 1], ['tonbo', 1], ['enkyo', 1]], start: { w: 'katana2', a: 'satsugun' } },
  kawagoe: { el: '土', base: { hp: 40, ki: 18, atk: 11, def: 10, spd: 8 }, grow: { hp: 6, ki: 2.4, atk: 2.0, def: 1.7, spd: 1.2 }, kinds: ['sword', 'cane'], skills: [['enzetsu', 1], ['shomei', 1], ['kenpaku', 18], ['bunken', 22], ['kiyotake', 26], ['hyugakoku', 30]], start: { w: 'tessen', a: 'haori' } },
  komura: { el: '水', base: { hp: 44, ki: 24, atk: 12, def: 10, spd: 13 }, grow: { hp: 6, ki: 2.6, atk: 2.0, def: 1.6, spd: 1.6 }, kinds: ['cane', 'pistol'], skills: [['harvard', 1], ['kosho', 1], ['nezumi', 30], ['gaiko', 32], ['jyoyaku', 35]], start: { w: 'tsue3', a: 'yofuku' } },
  osuzu: { el: '木', base: { hp: 26, ki: 12, atk: 7, def: 5, spd: 10 }, grow: { hp: 6, ki: 2.2, atk: 2.1, def: 1.4, spd: 1.6 }, kinds: ['naginata'], skills: [['kagura', 1], ['iwato', 5], ['ameno', 10], ['yokagura', 15], ['tajikara', 21], ['sarutahiko', 27]], start: { w: 'naginata1', a: 'kasuri' } },
  tatsu: { el: '水', base: { hp: 34, ki: 6, atk: 9, def: 6, spd: 5 }, grow: { hp: 7.4, ki: 1.4, atk: 2.5, def: 1.8, spd: 1.0 }, kinds: ['mori'], skills: [['morinage', 1], ['amiuchi', 5], ['kuroshio', 10], ['katsuo', 15], ['mimitsu', 21], ['umiotoko', 27]], start: { w: 'mori1', a: 'nobaki' } },
  heizo: { el: '木', base: { hp: 28, ki: 8, atk: 10, def: 5, spd: 9 }, grow: { hp: 6.2, ki: 1.6, atk: 2.6, def: 1.4, spd: 1.4 }, kinds: ['bow'], skills: [['nerai', 1], ['yazame', 5], ['oyumi', 10], ['shimazu', 15], ['hamaya', 21], ['ichimonji', 27]], start: { w: 'yumi1', a: 'nobaki' } },
  yashichi: { el: '火', base: { hp: 30, ki: 8, atk: 10, def: 6, spd: 8 }, grow: { hp: 6.6, ki: 1.6, atk: 2.5, def: 1.6, spd: 1.3 }, kinds: ['gun'], skills: [['nerai', 1], ['wana', 5], ['shishigari', 10], ['heike', 15], ['tsurutomi', 21], ['matagi', 27]], start: { w: 'hinawa', a: 'nobaki', h: 'kasa' } },
};

const SKILLS = {
  // 源太（猟師の子）
  yamagatana: { name: '山刀', ki: 2, target: 'enemy', type: 'atk', pow: 1.6, fx: 'slash', desc: '猟で使う山刀の一撃' },
  karyudo: { name: '猟師の目', ki: 3, target: 'enemy', type: 'debuff', stat: ['def'], v: .3, turns: 3, rate: .9, desc: '獲物の弱いところを見抜く。敵の守りを3ターン下げる' },
  emono: { name: '追い込み', ki: 5, target: 'enemies', type: 'atk', pow: 1.1, fx: 'slash', el: '木', desc: '山の中で獲物を追い込むように 敵全体を斬る' },
  enodake: { name: '可愛岳の抜け道', ki: 6, target: 'allies', type: 'buff', stat: ['spd'], v: .35, turns: 3, desc: '猟師だけが知る山道の歩き方。仲間全員の素早さが上がる' },
  hyugaoroshi: { name: '日向おろし', ki: 9, target: 'enemy', type: 'atk', pow: 3.0, fx: 'chest', el: '木', desc: '山から吹きおろす風のような一太刀' },
  nokoribi: { name: '残り火', ki: 12, target: 'enemies', type: 'atk', pow: 1.9, fx: 'boom', el: '火', desc: '可愛岳の夜に見た かがり火を胸に。敵全体を焼くような一撃' },
  akebono: { name: '曙の誓い', ki: 10, target: 'allies', type: 'buff', stat: ['atk', 'def'], v: .25, turns: 3, say: '日向の夜明けは、おれたちで迎えるっちゃ！', desc: '仲間全員の攻撃力と守りが3ターン上がる' },
  himuka: { name: '日向（ひむか）の灯', ki: 20, target: 'enemies', type: 'atk', pow: 3.2, fx: 'chest', el: '木', desc: '日に向かう国の名を背負った 渾身の一撃' },
  // お菊（医者の娘）
  teate: { name: '手当て', ki: 3, target: 'ally', type: 'heal', pow: 28, desc: '仲間ひとりのHPを回復' },
  yakusou: { name: '薬草の湿布', ki: 4, target: 'ally', type: 'regen', pow: 16, turns: 4, desc: '山の薬草を貼る。ひとりのHPが4ターン少しずつ回復' },
  hiyajiru: { name: '冷や汁', ki: 6, target: 'allies', type: 'heal', pow: 30, desc: '日向の家の味。仲間全員のHPを回復' },
  inori: { name: '鵜戸の祈り', ki: 7, target: 'allies', type: 'buff', stat: ['def'], v: .3, turns: 4, desc: '鵜戸神宮で覚えた祈り。仲間全員の守りが4ターン上がる' },
  souteate: { name: '総手当て', ki: 10, target: 'allies', type: 'heal', pow: 70, desc: '仲間全員のHPを大きく回復' },
  ranpo: { name: '蘭方の気付け', ki: 12, target: 'ally', type: 'heal', pow: 120, revive: true, desc: '父に習った西洋の医術。倒れた仲間も起こす' },
  hyuganatsu: { name: '日向夏', ki: 14, target: 'all', type: 'kiup', pow: 18, desc: '日向夏のさわやかな香り。仲間全員の気を回復' },
  // アカ（猟犬）
  kamitsuki: { name: 'かみつく', ki: 2, target: 'enemy', type: 'atk', pow: 1.5, fx: 'bite', desc: 'するどい牙でかみつく' },
  hoeru: { name: 'ほえる', ki: 3, target: 'enemies', type: 'debuff', stat: ['atk'], v: .2, turns: 3, rate: .85, desc: '猟犬のほえ声。敵全体の攻撃力を下げる' },
  oikomi: { name: '獲物追い', ki: 5, target: 'enemies', type: 'atk', pow: 1.2, sure: true, fx: 'bite', desc: '走り回って 敵全体にかみつく' },
  nodobue: { name: '喉笛かみ', ki: 6, target: 'enemy', type: 'atk', pow: 1.7, fx: 'bite', bleed: { pow: .35, turns: 3 }, desc: 'のどもとにかみつき、出血させる' },
  yamainu: { name: '山犬の遠吠え', ki: 7, target: 'allies', type: 'buff', stat: ['atk'], v: .3, turns: 3, desc: '仲間全員の攻撃力が3ターン上がる' },
  banken: { name: '主を守る', ki: 8, target: 'allies', type: 'buff', stat: ['def'], v: .3, turns: 3, extra: 'guard', desc: 'このターンの守りを固め、仲間全員の守りを上げる' },
  // 小倉処平・新八（序章のみ）
  obiken: { name: '飫肥の剣', ki: 4, target: 'enemy', type: 'atk', pow: 2.2, fx: 'slash', desc: '飫肥藩士の剣' },
  obisaigo: { name: '飫肥西郷の采配', ki: 6, target: 'allies', type: 'buff', stat: ['atk', 'spd'], v: .25, turns: 3, desc: '「飫肥西郷」と呼ばれた男の采配。仲間全員の攻撃力と素早さが上がる' },
  gakumon: { name: '学問のすすめ', ki: 5, target: 'all', type: 'kiup', pow: 8, desc: '学ぶことの大切さを説く。仲間全員の気を少し回復' },
  chest: { name: 'チェスト', ki: 3, target: 'enemy', type: 'atk', pow: 1.6, first: 2, fx: 'chest', desc: '示現流の一撃。戦いの最初のターンは威力2倍' },
  tonbo: { name: '蜻蛉の構え', ki: 4, target: 'enemy', type: 'atk', pow: 2.2, sure: true, fx: 'chest', desc: '高く構えた刀を振り下ろす。必ず当たる' },
  enkyo: { name: '猿叫', ki: 4, target: 'self', type: 'buff', stat: ['atk'], v: .4, turns: 3, say: 'キィエエエェェッ！', desc: '自分の攻撃力が3ターン大きく上がる' },
  // 川越進（分県運動）
  enzetsu: { name: '演説', ki: 4, target: 'allies', type: 'buff', stat: ['atk'], v: .25, turns: 3, desc: '日向のためを説く。仲間全員の攻撃力が上がる' },
  shomei: { name: '署名の束', ki: 5, target: 'enemy', type: 'atk', pow: 2.0, fx: 'hit', el: '土', desc: '集めた署名の重みで ぶつかる' },
  kenpaku: { name: '建白書', ki: 8, target: 'enemies', type: 'debuff', stat: ['atk', 'def'], v: .25, turns: 3, rate: .85, desc: '理の通った建白書。敵全体の攻撃力と守りを下げる' },
  bunken: { name: '分県の訴え', ki: 10, target: 'enemies', type: 'atk', pow: 1.9, fx: 'hit', el: '土', desc: '日向の声を集めた訴え。敵全体に土の攻撃' },
  kiyotake: { name: '清武の郷士', ki: 7, target: 'all', type: 'guard', desc: '故郷・清武の意地。このターン仲間全員の受けるダメージを半分にする' },
  hyugakoku: { name: '日向一国', ki: 16, target: 'enemy', type: 'atk', pow: 4.2, fx: 'chest', el: '土', desc: '日向はひとつの国である――その信念の一撃' },
  // 小村寿太郎（外交）
  harvard: { name: 'ハーバードの学', ki: 6, target: 'enemies', type: 'debuff', stat: ['def'], v: .3, turns: 3, rate: .9, desc: 'アメリカで学んだ法律で 相手の理屈の弱みを突く' },
  kosho: { name: '交渉', ki: 7, target: 'enemy', type: 'stun', rate: .7, desc: '粘り強い交渉。敵をひるませる' },
  nezumi: { name: 'ねずみ公使の意地', ki: 8, target: 'self', type: 'regen', pow: 30, turns: 4, extraBuff: { stat: ['def', 'spd'], v: .3, turns: 4 }, desc: '小柄でも退かない。自分のHPが回復し、守りと素早さが上がる' },
  gaiko: { name: '外交の一手', ki: 12, target: 'enemies', type: 'atk', pow: 2.0, fx: 'shot', el: '水', desc: '理と言葉で押し返す。敵全体に水の攻撃' },
  jyoyaku: { name: '条約改正の志', ki: 16, target: 'allies', type: 'buff', stat: ['atk', 'def', 'spd'], v: .25, turns: 3, desc: '国の誇りを取り戻す志。仲間全員の攻撃力・守り・素早さを上げる' },
  // お鈴（高千穂の夜神楽）
  kagura: { name: '神楽舞い', ki: 3, target: 'enemies', type: 'atk', pow: 1.0, fx: 'slash', el: '木', desc: '舞いながら 敵全体を薙ぐ' },
  iwato: { name: '岩戸開き', ki: 5, target: 'enemy', type: 'stun', rate: .7, desc: '天岩戸を開いた舞い。敵ひとりをひるませる' },
  ameno: { name: '天の鈴', ki: 6, target: 'allies', type: 'regen', pow: 14, turns: 3, desc: '鈴の音で傷が癒える。仲間全員のHPが3ターン少しずつ回復' },
  yokagura: { name: '夜神楽', ki: 8, target: 'enemies', type: 'debuff', stat: ['atk', 'spd'], v: .25, turns: 3, rate: .85, desc: '夜通し続く神楽。敵全体の攻撃力と素早さを下げる' },
  tajikara: { name: '手力雄の舞', ki: 10, target: 'enemy', type: 'atk', pow: 3.6, fx: 'chest', el: '木', desc: '岩戸をこじ開けた神の舞い' },
  sarutahiko: { name: '猿田彦の導き', ki: 12, target: 'allies', type: 'buff', stat: ['spd', 'atk'], v: .3, turns: 3, desc: '道をひらく神の導き。仲間全員の素早さと攻撃力を上げる' },
  // 辰五郎（美々津の船頭）
  morinage: { name: '銛投げ', ki: 3, target: 'enemy', type: 'atk', pow: 1.7, sure: true, fx: 'shot', el: '水', desc: '銛を投げつける。必ず当たる' },
  amiuchi: { name: '投網', ki: 4, target: 'enemies', type: 'debuff', stat: ['spd'], v: .35, turns: 3, rate: .85, desc: '網を投げて 敵全体の動きを鈍らせる' },
  kuroshio: { name: '黒潮', ki: 7, target: 'enemies', type: 'atk', pow: 1.4, fx: 'boom', el: '水', desc: '日向灘の黒潮のような勢いで 敵全体を押し流す' },
  katsuo: { name: '鰹の一本釣り', ki: 8, target: 'enemy', type: 'atk', pow: 3.2, fx: 'chest', el: '水', desc: '日向の鰹漁の豪快な一撃' },
  mimitsu: { name: '美々津の船出', ki: 10, target: 'allies', type: 'buff', stat: ['atk', 'spd'], v: .3, turns: 3, desc: '神武天皇の船出の地の勢い。仲間全員の攻撃力と素早さを上げる' },
  umiotoko: { name: '海の男の意地', ki: 8, target: 'self', type: 'regen', pow: 34, turns: 4, extraBuff: { stat: ['def', 'atk'], v: .3, turns: 4 }, desc: '自分のHPが回復し、攻撃力と守りも上がる' },
  // 平蔵（都城の大弓）
  nerai: { name: '狙い撃ち', ki: 3, target: 'enemy', type: 'atk', pow: 2.0, sure: true, fx: 'shot', desc: '必ず当たる強力な一発' },
  yazame: { name: '矢雨', ki: 5, target: 'enemies', type: 'atk', pow: 1.1, fx: 'shot', el: '木', desc: '矢を雨のように降らせ 敵全体を撃つ' },
  oyumi: { name: '都城大弓', ki: 7, target: 'enemy', type: 'atk', pow: 2.8, sure: true, fx: 'shot', el: '木', debuff: { stat: ['def'], v: .25, turns: 3 }, desc: '都城の大弓。必ず当たり、守りを崩す' },
  shimazu: { name: '島津の弓衆', ki: 8, target: 'allies', type: 'buff', stat: ['atk'], v: .3, turns: 3, desc: '仲間全員の攻撃力を上げる' },
  hamaya: { name: '破魔矢', ki: 9, target: 'enemy', type: 'atk', pow: 3.0, fx: 'shot', el: '木', stun: .35, desc: '魔をはらう矢。ひるませることがある' },
  ichimonji: { name: '一文字射ち', ki: 14, target: 'enemies', type: 'atk', pow: 2.2, sure: true, fx: 'shot', el: '木', desc: '一文字に並んだ敵を まとめて射抜く' },
  // 弥七（椎葉の狩人）
  wana: { name: 'くくり罠', ki: 4, target: 'enemy', type: 'stun', rate: .7, desc: '罠で足を取る。敵ひとりをひるませる' },
  shishigari: { name: '猪狩り', ki: 6, target: 'enemy', type: 'atk', pow: 2.6, fx: 'shot', bleed: { pow: .3, turns: 3 }, desc: '椎葉の猪狩りの一発。出血させる' },
  heike: { name: '平家の隠れ里', ki: 6, target: 'allies', type: 'buff', stat: ['def', 'spd'], v: .25, turns: 3, desc: '落人が隠れ住んだ里の知恵。仲間全員の守りと素早さを上げる' },
  tsurutomi: { name: '鶴富の子守唄', ki: 8, target: 'allies', type: 'regen', pow: 18, turns: 3, desc: '椎葉の子守唄。仲間全員のHPが3ターン少しずつ回復' },
  matagi: { name: '山の神の一発', ki: 13, target: 'enemy', type: 'atk', pow: 4.0, fx: 'shot', el: '火', desc: '山の神にささげる 渾身の一発' },
};

const ITEMS = {
  hiyajiru: { name: '冷や汁', type: 'use', price: 10, heal: 35, desc: '焼いた魚と麦みその冷たい汁。HPを35回復' },
  obiten: { name: '飫肥天', type: 'use', price: 26, heal: 80, desc: '飫肥の甘いさつま揚げ。HPを80回復' },
  shiitake: { name: '干し椎茸', type: 'use', price: 40, ki: 12, desc: '日向の山の干し椎茸。気を12回復' },
  hyuganatsu: { name: '日向夏', type: 'use', price: 90, ki: 30, desc: '宮崎で生まれた柑橘。気を30回復' },
  jidori: { name: '地鶏の炭火焼', type: 'use', price: 75, heal: 160, desc: '炭火で焼いた地鶏。HPを160回復' },
  akumaki: { name: '灰汁巻き', type: 'use', price: 170, healAll: 90, desc: '端午の節句のちまき。全員のHPを90回復' },
  katsuo: { name: '鰹のたたき', type: 'use', price: 170, heal: 360, desc: '日向灘の鰹。HPを360回復' },
  kinkan: { name: '金柑の甘煮', type: 'use', price: 150, kiAll: 20, desc: '甘く煮た金柑。全員の気を20回復' },
  shochu: { name: '焼酎', type: 'use', price: 120, revive: .5, desc: '倒れた仲間を起こす（HP半分）' },
  koshu: { name: '古酒', type: 'use', price: 400, revive: 1, desc: '倒れた仲間を全快で起こす' },
  horoku: { name: '焙烙玉', type: 'use', price: 60, target: 'enemy', dmg: 60, battleOnly: true, desc: '火薬を詰めた焼き物の玉。敵に投げる' },
  horoku2: { name: '大焙烙玉', type: 'use', price: 220, target: 'enemy', dmg: 180, battleOnly: true, desc: '大きな焙烙玉。敵に投げる' },
  // 武器
  yamagatana1: { name: '猟師の山刀', type: 'w', kind: 'sword', atk: 3, price: 10, desc: '祖父にもらった 使いこまれた山刀' },
  katana1: { name: '飫肥の刀', type: 'w', kind: 'sword', atk: 14, price: 300, desc: '飫肥藩士の刀' },
  katana2: { name: '薩摩拵の刀', type: 'w', kind: 'sword', atk: 22, price: 800, desc: '鍔が小さく柄の長い、薩摩独特の刀' },
  katana3: { name: '延岡の名刀', type: 'w', kind: 'sword', atk: 30, price: 1800, desc: '延岡藩の侍が差した刀' },
  katana4: { name: '日向正宗', type: 'w', kind: 'sword', atk: 40, price: 4200, desc: '名刀・日向正宗の名を借りた写し（ゲームの創作）' },
  katana5: { name: '夜明けの太刀', type: 'w', kind: 'sword', atk: 52, price: 0, desc: '宮崎県の再置を祝って 贈られた太刀（ゲームの創作）' },
  hinawa: { name: '火縄銃', type: 'w', kind: 'gun', atk: 8, price: 200, desc: '猟師が使う古い鉄砲' },
  murata: { name: '村田銃', type: 'w', kind: 'gun', atk: 30, price: 2600, desc: '明治十三年に生まれた 日本の銃' },
  snider: { name: 'スナイドル銃', type: 'w', kind: 'gun', atk: 22, price: 1200, desc: '後ろから弾を込める 新式の銃' },
  tsue1: { name: '樫の杖', type: 'w', kind: 'cane', atk: 4, price: 40, desc: '堅い樫の木の杖' },
  tessen: { name: '鉄扇', type: 'w', kind: 'cane', atk: 14, price: 600, desc: '鉄の骨の扇' },
  tsue3: { name: '洋杖', type: 'w', kind: 'cane', atk: 24, price: 1600, desc: '西洋の紳士が持つ ステッキ' },
  tsue4: { name: '仕込み杖', type: 'w', kind: 'cane', atk: 34, price: 3600, desc: '中に細い刃を隠した杖' },
  kiba: { name: 'アカの牙', type: 'w', kind: 'fang', atk: 3, price: 0, desc: '小さいが するどい' },
  kiba2: { name: '猟犬の牙', type: 'w', kind: 'fang', atk: 16, price: 0, desc: '猪にも負けない 猟犬の牙' },
  kiba3: { name: '山の主の牙', type: 'w', kind: 'fang', atk: 34, price: 0, desc: '山の主とも呼ばれる 猟犬の牙' },
  naginata1: { name: '神楽の薙刀', type: 'w', kind: 'naginata', atk: 5, price: 50, desc: '神楽で舞う薙刀' },
  naginata2: { name: '高千穂の薙刀', type: 'w', kind: 'naginata', atk: 20, price: 900, desc: '神楽面の飾りのついた 薙刀' },
  naginata3: { name: '天の薙刀', type: 'w', kind: 'naginata', atk: 36, price: 3600, desc: '天岩戸の伝説にちなむ 名品' },
  mori1: { name: '漁の銛', type: 'w', kind: 'mori', atk: 7, price: 60, desc: '美々津の漁師の銛' },
  mori2: { name: '鯨銛', type: 'w', kind: 'mori', atk: 22, price: 900, desc: '鯨を突くための 大きな銛' },
  mori3: { name: '黒潮の銛', type: 'w', kind: 'mori', atk: 38, price: 3800, desc: '黒潮の大魚を仕留めたという銛' },
  yumi1: { name: '半弓', type: 'w', kind: 'bow', atk: 8, price: 70, desc: '小さな弓' },
  yumi2: { name: '都城大弓', type: 'w', kind: 'bow', atk: 23, price: 1000, desc: '都城の竹で作る 大きな弓（都城大弓）' },
  yumi3: { name: '名人の重籐弓', type: 'w', kind: 'bow', atk: 38, price: 3900, desc: '籐を何重にも巻いた 名人の弓' },
  // 防具
  nobaki: { name: '野良着', type: 'a', def: 2, price: 10, desc: '畑仕事の木綿の着物' },
  kasuri: { name: '絣の着物', type: 'a', def: 5, price: 70, desc: '丈夫な木綿の絣' },
  haori: { name: '羽織', type: 'a', def: 10, price: 300, desc: '紋付きの羽織' },
  satsugun: { name: '薩軍の軍服', type: 'a', def: 18, price: 0, desc: '西南戦争で薩軍が着た服' },
  yofuku: { name: '洋服', type: 'a', def: 20, price: 1500, desc: '明治の紳士の洋服' },
  tsumeeri: { name: '詰襟', type: 'a', def: 27, price: 2800, desc: '黒い詰襟の洋服' },
  obisugi: { name: '飫肥杉の胴', type: 'a', def: 34, price: 4400, desc: '軽くて丈夫な飫肥杉を使った胴' },
  inudo: { name: '犬の胴当て', type: 'a', dog: true, def: 5, price: 90, desc: '木綿の犬用の胴当て（アカ専用）' },
  inukawa: { name: '革の犬よろい', type: 'a', dog: true, def: 17, price: 1100, desc: '猪の牙も通さない革の胴（アカ専用）' },
  inusugi: { name: '飫肥杉の犬よろい', type: 'a', dog: true, def: 30, price: 4000, desc: '杉板を重ねた犬の鎧（アカ専用）' },
  hachimaki: { name: '鉢巻', type: 'h', def: 1, price: 5, desc: '気合いを入れる鉢巻' },
  kasa: { name: '菅笠', type: 'h', def: 3, price: 60, desc: '日よけの笠' },
  jingasa: { name: '陣笠', type: 'h', def: 6, price: 200, desc: '兵がかぶる笠' },
  bowler: { name: '山高帽', type: 'h', def: 14, price: 1400, desc: '明治の紳士の帽子' },
  kaguramen: { name: '神楽面', type: 'h', def: 20, price: 2600, desc: '夜神楽で使う面。不思議な力がある' },
  goishi: { name: '蛤の碁石', type: 'x', def: 3, spd: 3, price: 200, desc: '日向の浜の蛤で作る白い碁石' },
  magatama: { name: '天岩戸の勾玉', type: 'x', ki: 12, def: 4, price: 0, desc: '高千穂で授かった勾玉' },
  kaigara: { name: '青島の貝殻', type: 'x', spd: 6, def: 3, price: 600, desc: '青島の浜の きれいな貝殻' },
  obisugi2: { name: '飫肥杉の数珠', type: 'x', hp: 30, def: 6, price: 1300, desc: '飫肥杉で作った数珠' },
  oguraf: { name: '小倉処平の扇', type: 'x', atk: 6, ki: 10, price: 0, desc: '「学べ」と託された扇' },
  udo: { name: '鵜戸の運玉', type: 'x', atk: 5, spd: 5, price: 0, desc: '鵜戸神宮の亀石に投げる 願いの玉' },
  kenpaku: { name: '分県の建白書', type: 'key', price: 0, desc: '日向の人々の署名を集めた建白書' },
  ogurapack: { name: '小倉処平の遺品', type: 'key', price: 0, desc: '飫肥の家族に届けると約束した品' },
};
const SLOT_NAMES = { w: '武器', a: '体', h: '頭', x: '装飾' };

// ===== 敵（実在した人々・軍・戦争・城・災い） =====
const EN_EL = {};
function mkEnemy(id, d) {
  if (!d.el) d.el = EN_EL[id] || ({ slash: '金', chest: '金', shot: '火', boom: '火', bite: '木', hit: '土' })[d.fx] || (d.spr && d.spr.t === 'army' ? '金' : '土');
  const L = d.L, m = Object.assign({ hp: 1, atk: 1, def: 1, spd: 1, exp: 1, gold: 1 }, d.m);
  return Object.assign({ hp: Math.round((12 + 5.5 * L) * m.hp), atk: Math.round((6 + 2.4 * L) * m.atk), def: Math.round((2 + 1.2 * L) * m.def), spd: Math.round((4 + .9 * L) * m.spd), exp: Math.round((3 + L * L * .45) * m.exp), gold: Math.round((4 + L * 3.2) * m.gold) }, d);
}
const GOVU = { body: '#1a2244', body2: '#1a2244', cloth: 'uniform', hs: 'short', hat: 'kepi' };
const EN = {
  // 序章：延岡・長井村
  sekko: { name: '政府軍の斥候', L: 2, scaled: true, fx: 'shot', spr: { ...GOVU, pose: 'rifle' } },
  hohei: { name: '政府軍の歩兵', L: 3, scaled: true, fx: 'shot', spr: { ...GOVU, pose: 'rifle' }, skills: [{ p: .2, type: 'all', pow: .7, msg: '{n}の 一斉射撃！', fx: 'shot' }] },
  keisatsu: { name: '警視隊', L: 3.5, scaled: true, m: { atk: 1.1 }, fx: 'slash', spr: { body: '#1a1a2a', body2: '#1a1a2a', cloth: 'uniform', hs: 'short', hat: 'kepi', hatc: '#1a1a1a', pose: 'tonbo' } },
  hoijin: { name: '可愛岳の包囲陣', L: 6, m: { hp: 6, atk: 1.05, exp: 6, gold: 5 }, fx: 'shot', spr: { t: 'army', body: '#1a2244', hat: '#1a2244', flag: '#f0f0f0', flagMark: '#c02020' }, skills: [{ p: .3, type: 'all', pow: .8, msg: '{n}の 一斉射撃！', fx: 'shot' }, { p: .15, type: 'pdebuff', all: true, stat: ['spd'], v: .2, msg: '闇の中、足もとが見えない……' }], desc: '可愛岳の山頂近くに陣を張った政府軍' },
  // 第一章：残り火
  ochimusha: { name: '落ち武者', L: 4, scaled: true, fx: 'slash', spr: { body: '#3a2a2a', body2: '#2a2a2a', cloth: 'hakama', hs: 'spiky', pose: 'tonbo' }, skills: [{ p: .2, type: 'one', pow: 1.6, msg: '{n}の 捨て身の一撃！', fx: 'chest' }] },
  muhou: { name: '略奪する無頼', L: 3, scaled: true, m: { gold: 1.5 }, fx: 'hit', spr: { body: '#5a4a3a', body2: '#3a3a3a', cloth: 'kimono', hs: 'short', pose: 'club' }, skills: [{ p: .15, type: 'pdebuff', stat: ['def'], v: .2, msg: '{n}は 砂をかけてきた！' }] },
  kiri: { name: '高千穂の朝霧', L: 4, scaled: true, m: { hp: 1.3, def: 1.6, gold: .2 }, el: '水', spr: { t: 'cloud' }, skills: [{ p: .4, type: 'kidrain', pow: 4, msg: '{n}が 視界をうばう……' }, { p: .2, type: 'pdebuff', all: true, stat: ['spd'], v: .2, msg: '霧で 足もとが見えない' }], desc: '高千穂の谷を埋める 深い霧' },
  ochiB: { name: '落ち武者の頭', L: 6, scaled: true, m: { hp: 3.2, atk: 1.05, exp: 5, gold: 6 }, fx: 'slash', spr: { body: '#3a2a22', body2: '#2a2a2a', cloth: 'hakama', hs: 'spiky', pose: 'tonbo', big: true, brow: 2, beard: '#2a1a10' }, skills: [{ p: .25, type: 'one', pow: 1.8, msg: '{n}「おいたちの戦は、まだ終わっちょらん！」', fx: 'chest' }, { p: .15, type: 'ebuff', all: true, stat: ['atk'], v: .25, msg: '{n}は 手下を叱咤した！' }] },
  // 野山
  sanzoku: { name: '日向の山賊', L: 3, scaled: true, fx: 'slash', el: '木', spr: { body: '#5a4a2a', body2: '#3a2a1a', cloth: 'kimono', hs: 'spiky', pose: 'club', beard: '#2a1a10' } },
  oihagi: { name: '追い剥ぎ', L: 2.5, scaled: true, m: { hp: .9, gold: 1.4 }, fx: 'hit', spr: { body: '#4a4a3a', body2: '#3a3a2a', cloth: 'kimono', hat: 'zukin', hatc: '#3a3a2a', pose: 'club' }, flee: .1 },
  kaizoku: { name: '日向灘の海賊', L: 3.5, scaled: true, m: { hp: .9 }, fx: 'slash', el: '水', spr: { body: '#1e2a3a', body2: '#3a3a3a', skin: '#c88a5a', cloth: 'kimono', hat: 'hachimaki', hatc: '#1a1a1a', pose: 'cutlass' } },
  fuhei: { name: '不平士族', L: 4, scaled: true, m: { atk: 1.1 }, fx: 'slash', spr: { body: '#3a3a3a', body2: '#2a2a2a', cloth: 'hakama', hs: 'mage', pose: 'tonbo' }, skills: [{ p: .15, type: 'pbleed', pow: .9, msg: '{n}の 抜き打ち！' }] },
  bakuto: { name: '博徒', L: 3.5, scaled: true, m: { gold: 1.6 }, fx: 'slash', spr: { body: '#4a2a3a', body2: '#2a2a2a', cloth: 'kimono', hs: 'short', pose: 'tonbo' }, skills: [{ p: .2, type: 'pdebuff', stat: ['atk'], v: .2, msg: '{n}は 賽を振った！ 運が悪い……' }] },
  inoshishi: { name: '暴れ馬', L: 4, scaled: true, m: { hp: 1.2, spd: 1.3 }, fx: 'hit', el: '火', spr: { t: 'boat' }, desc: '' },
  // 第二章：分県のための旅
  taifu: { name: '台風', L: 6, scaled: true, m: { hp: 3.4, def: 1.2, exp: 5, gold: 2 }, el: '水', spr: { t: 'cloud' }, skills: [{ p: .35, type: 'all', pow: .8, msg: '{n}の 暴風！' }, { p: .2, type: 'pdebuff', all: true, stat: ['spd', 'def'], v: .2, msg: '{n}の 横なぐりの雨！' }, { p: .1, type: 'heal', pow: .1, msg: '{n}は 海の上で 勢いを取り戻した！' }], desc: '日向灘から来る 大きな嵐' },
  hantai: { name: '分県反対の郷士', L: 4, scaled: true, fx: 'hit', spr: { body: '#2a2a3a', body2: '#3a3a3a', cloth: 'hakama', hs: 'mage', pose: 'fan' }, skills: [{ p: .2, type: 'kidrain', pow: 4, msg: '{n}「島津の殿さまに 背くとか！」' }] },
  hantaiB: { name: '都城の論客', L: 6.5, scaled: true, m: { hp: 3.2, exp: 5, gold: 5 }, fx: 'hit', spr: { body: '#2a2a3a', body2: '#3a3a3a', cloth: 'hakama', hs: 'mage', pose: 'fan', big: true }, skills: [{ p: .25, type: 'all', pow: .9, msg: '{n}「都城は 三百年 島津と共にあった！」' }, { p: .2, type: 'pdebuff', all: true, stat: ['atk'], v: .25, msg: '{n}の 理詰めの反論！' }, { p: .1, type: 'kidrain', pow: 6, msg: '{n}は 古い証文を 突きつけた！' }] },
  heikeB: { name: '平家の亡霊', L: 7, scaled: true, m: { hp: 3, def: 1.3, exp: 6, gold: 3 }, el: '水', spr: { t: 'cloud' }, skills: [{ p: .3, type: 'all', pow: .9, msg: '{n}「源氏の世など……認めぬ……」' }, { p: .2, type: 'pbleed', all: true, pow: .6, msg: '{n}の 怨念の矢！' }, { p: .15, type: 'kidrain', pow: 6, msg: '壇ノ浦の波の音が 聞こえる……' }], desc: '椎葉に伝わる 平家の落人の言い伝え（ゲームの創作）' },
  kaizokuB: { name: '耳川の海賊の頭', L: 6, scaled: true, m: { hp: 2.9, atk: .95, exp: 5, gold: 6 }, fx: 'slash', el: '水', spr: { body: '#1e2a3a', body2: '#3a3a3a', skin: '#c88a5a', cloth: 'kimono', hat: 'hachimaki', hatc: '#1a1a1a', pose: 'cutlass', beard: '#1a1a1a', big: true, brow: 2 }, skills: [{ p: .2, type: 'all', pow: .8, msg: '{n}の 薙ぎ払い！' }, { p: .12, type: 'pbleed', pow: .9, msg: '{n}の 鮫の歯の刀！' }] },
  // 第三章・第四章：鹿児島と東京
  kenkai: { name: '県会の多数決', L: 9, m: { hp: 6.5, def: 1.3, exp: 7, gold: 4 }, spr: { t: 'scroll', text: '否決' }, skills: [{ p: .3, type: 'all', pow: .9, msg: '{n}「賛成の者は 起立を……少数！」' }, { p: .2, type: 'pdebuff', all: true, stat: ['atk', 'spd'], v: .25, msg: '{n}が 議場の空気を 重くする……' }, { p: .1, type: 'heal', pow: .1, msg: '{n}は 委員会に 持ち帰った！' }], desc: '鹿児島県会では、日向の議員は少数だった' },
  giin: { name: '県会議員', L: 9, scaled: true, fx: 'hit', spr: { body: '#2a2a32', body2: '#2a2a32', cloth: 'west', hs: 'west', pose: 'fan' }, skills: [{ p: .2, type: 'kidrain', pow: 5, msg: '{n}「予算がない」' }] },
  junsa: { name: '巡査', L: 9, scaled: true, fx: 'slash', spr: { body: '#1a1a2a', body2: '#1a1a2a', cloth: 'uniform', hs: 'short', hat: 'kepi', hatc: '#1a1a1a', pose: 'tonbo' } },
  shorui: { name: '書類の山', L: 10, scaled: true, m: { hp: 1.4, def: 1.5 }, el: '木', spr: { t: 'scroll', text: '前例ナシ' }, skills: [{ p: .3, type: 'kidrain', pow: 6, msg: '{n}「前例が ございません」' }, { p: .2, type: 'pdebuff', all: true, stat: ['spd'], v: .25, msg: '{n}「書類に 不備がございます」' }] },
  kanryo: { name: '内務省の官僚', L: 10, scaled: true, fx: 'hit', spr: { body: '#1a1a22', body2: '#1a1a22', cloth: 'west', hs: 'west', pose: 'fan' } },
  yamagata2: { name: '山田顕義（内務卿）', dex: 'yamagata2', L: 12, m: { hp: 7, atk: 1.1, exp: 8, gold: 6 }, fx: 'hit', spr: { body: '#1a1a22', cloth: 'west', hs: 'west', pose: 'fan', beard: '#1c1a22' }, intro: '論戦が 始まった！', skills: [{ p: .3, type: 'all', pow: 1, msg: '{n}「一県を置けば、費用がかかる。その覚悟は あるか」' }, { p: .2, type: 'pdebuff', all: true, stat: ['atk'], v: .25, msg: '{n}の 冷たい眼差し……' }, { p: .15, type: 'ebuff', stat: ['def'], v: .35, msg: '{n}は 腕を組んで 黙りこんだ' }] },
  // 珍しい敵
  shonin: { name: '飫肥杉の材木商', L: 4, scaled: true, rare: true, m: { hp: 1.5, exp: 2, gold: 30 }, flee: .35, spr: { body: '#7a6a3a', body2: '#5a4a2a', cloth: 'kimono', hat: 'kasa', eyes: 'closed' }, desc: '飫肥杉で 大もうけした商人' },
  hikyaku: { name: '早飛脚', L: 4, scaled: true, rare: true, m: { hp: .6, def: 6, exp: 22, gold: 2 }, flee: .45, evade: .3, armor: 2, spr: { body: '#3a3a5a', body2: '#3a3a5a', cloth: 'kimono', hat: 'zukin', hatc: '#2a2a3a' }, desc: '手紙を運ぶ 足の速い飛脚' },
};
EN.inoshishi.spr = { body: '#6a4a2a', body2: '#3a2a1a', cloth: 'kimono', hs: 'spiky', pose: 'club', beard: '#2a1a10' }; EN.inoshishi.name = '猪狩りくずれ';
const ENEMIES = {}; for (const id in EN) ENEMIES[id] = mkEnemy(id, EN[id]);
function fieldL(add = 0) { return (({ 0: 2, 1: 8, 2: 14, 3: 20, 4: 26, 5: 28 })[G.chapter] ?? 10) + add; }

const ENC = {
  nagai: [['sekko'], ['sekko', 'sekko'], ['hohei'], ['sekko', 'hohei']],
  enodake: [['hohei'], ['hohei', 'sekko'], ['keisatsu'], ['hohei', 'keisatsu'], ['sekko', 'sekko', 'hohei']],
  north: [['muhou'], ['ochimusha'], ['muhou', 'muhou'], ['ochimusha', 'muhou'], ['sanzoku', 'oihagi']],
  takachiho: [['kiri'], ['ochimusha'], ['kiri', 'ochimusha'], ['ochimusha', 'ochimusha']],
  coast: [['kaizoku'], ['kaizoku', 'oihagi'], ['bakuto'], ['kaizoku', 'kaizoku']],
  south: [['sanzoku'], ['oihagi', 'oihagi'], ['fuhei'], ['bakuto', 'sanzoku'], ['inoshishi']],
  mountain: [['sanzoku'], ['inoshishi'], ['sanzoku', 'inoshishi'], ['fuhei', 'sanzoku']],
  later: [['fuhei'], ['bakuto', 'fuhei'], ['junsa'], ['fuhei', 'sanzoku'], ['kaizoku', 'bakuto']],
  kago: [['giin'], ['junsa'], ['giin', 'junsa']],
};
const RARE = { early: [{ g: ['hikyaku'], p: .04 }, { g: ['shonin'], p: .04 }] };

const SHOPS = {
  nagai: () => ['hiyajiru', 'shiitake', 'yamagatana1', 'kasuri', 'kasa', 'inudo'],
  nobeoka: () => G.chapter >= 2 ? ['katana3', 'snider', 'tessen', 'yofuku', 'jingasa', 'inukawa', 'goishi'] : ['katana1', 'hinawa', 'tessen', 'haori', 'kasa', 'jingasa', 'inudo', 'goishi'],
  nobeokaDougu: () => ['hiyajiru', 'obiten', 'shiitake', 'hyuganatsu', 'jidori', 'shochu', 'horoku'],
  takachiho: () => ['hiyajiru', 'shiitake', 'jidori', 'shochu', 'naginata2', 'kaguramen', 'horoku'],
  miyazaki: () => ['katana3', 'snider', 'tsue3', 'yofuku', 'bowler', 'inukawa', 'kaigara', 'naginata2', 'mori2', 'yumi2'],
  miyazakiDougu: () => ['obiten', 'hyuganatsu', 'jidori', 'akumaki', 'katsuo', 'kinkan', 'shochu', 'horoku2'],
  mimitsu: () => ['obiten', 'katsuo', 'shiitake', 'shochu', 'mori2', 'mori3', 'goishi'],
  miyakonojo: () => ['yumi2', 'yumi3', 'katana4', 'murata', 'tsumeeri', 'obisugi', 'jingasa', 'jidori', 'akumaki'],
  obi: () => ['obiten', 'jidori', 'akumaki', 'koshu', 'obisugi', 'obisugi2', 'inusugi', 'tsue4', 'katana4'],
  shiiba: () => ['shiitake', 'jidori', 'shochu', 'murata', 'naginata3', 'inukawa'],
  kago: () => ['katana4', 'murata', 'tsumeeri', 'obisugi', 'bowler', 'koshu', 'katsuo', 'akumaki', 'kinkan'],
  tokyo: () => ['katana4', 'murata', 'tsue4', 'tsumeeri', 'bowler', 'yumi3', 'mori3', 'naginata3', 'inusugi', 'koshu', 'katsuo', 'kinkan'],
};
const SHOP_TALK = {
  nagai: ['merchant', '村の よろず屋っちゃ。\n戦のせいで 品が少ないけんど。', '村の よろず屋です。\n戦のせいで 品が少ないけど。'],
  nobeoka: ['smith', '延岡の武具屋じゃ。\nよか品が そろっちょるよ。', '延岡の武具屋だ。\nいい品が そろっているよ。'],
  nobeokaDougu: ['merchant', 'いらっしゃい。\n冷や汁の素も 飫肥天も あるっちゃが。', 'いらっしゃい。\n冷や汁の素も 飫肥天も ありますよ。'],
  takachiho: ['merchant', '高千穂の店っちゃ。\n山のもんなら なんでん あるよ。', '高千穂の店です。\n山のものなら なんでもありますよ。'],
  miyazaki: ['smith', '宮崎の武具屋じゃ。\n東京からの品も 入っちょる。', '宮崎の武具屋だ。\n東京からの品も 入っている。'],
  miyazakiDougu: ['merchant', 'いらっしゃい。\n日向夏も 地鶏も てげ うまいとよ。', 'いらっしゃい。\n日向夏も 地鶏も とてもおいしいですよ。'],
  mimitsu: ['fisher', '美々津の浜の店じゃ。\n鰹は 今朝あがったばっかりよ。', '美々津の浜の店だ。\n鰹は 今朝あがったばかりだよ。'],
  miyakonojo: ['smith', '都城の弓師の店じゃ。\n都城大弓は 日本一ど。', '都城の弓師の店だ。\n都城大弓は 日本一だぞ。'],
  obi: ['merchant', '飫肥の城下の店でございます。\n飫肥杉の品も ございます。'],
  shiiba: ['merchant', '椎葉の よろず屋じゃ。\nよう ここまで 来なさった。', '椎葉の よろず屋だ。\nよく ここまで 来なさった。'],
  kago: ['merchant', 'いらっしゃいもうせ。\n鹿児島の品を そろえちょります。', 'いらっしゃいませ。\n鹿児島の品を そろえております。'],
  tokyo: ['merchant', 'いらっしゃいませ。\n東京の舶来品で ございます。'],
  jinchu: ['merchant', '陣中の物売りでございます。'],
};

// ===== 図鑑 =====
const DEX = {
  people: {
    genta: { name: '甲斐源太', pref: '宮崎県', fic: true, bio: 'この物語の主人公（架空の人物）。延岡・長井村の猟師の子。可愛岳の夜に西郷たちを山道へ導き、のちに日向の国の行く末を見つめることになる。' },
    kiku: { name: 'お菊', pref: '宮崎県', fic: true, bio: '源太の幼なじみ（架空の人物）。長井村の医者の娘で、父から蘭方（西洋医学）を習っている。' },
    aka: { name: 'アカ', pref: '宮崎県', fic: true, bio: '源太の猟犬（架空の犬）。赤茶色の毛で、山の匂いをよく知っている。' },
    ogura: { name: '小倉処平', years: '1846〜1877', pref: '宮崎県', bio: '飫肥藩士。藩の若者の教育に力を尽くし、小村寿太郎を見出したともいわれる。「飫肥西郷」と呼ばれ、西南戦争では飫肥隊を率いて薩軍に加わった。延岡の長井村で傷を負い、自ら命を絶った。' },
    shinpachi: { name: '日高新八', pref: '鹿児島県', fic: true, bio: '日本國物語 鹿児島編「薩摩の焔」の主人公（架空の人物）。加治屋町の出身で、西郷のそばで戦い続けた。' },
    saigo: { name: '西郷隆盛', years: '1828〜1877', pref: '鹿児島県', bio: '西南戦争の薩軍の総大将。延岡の長井村で包囲され、軍服や書類を焼き、可愛岳を越えて鹿児島へ向かった。九月二十四日、城山で亡くなった。' },
    kirino: { name: '桐野利秋', years: '1838〜1877', pref: '鹿児島県', bio: '薩軍の中心的な指揮官。可愛岳の突破でも先頭に立った。' },
    yamagata: { name: '山県有朋', years: '1838〜1922', pref: '山口県', bio: '長州出身。西南戦争では政府軍の参軍として指揮をとり、延岡で薩軍を包囲した。' },
    yamagata2: { name: '山田顕義', years: '1844〜1892', pref: '山口県', bio: '長州出身。西南戦争では政府軍の旅団を率いた。明治十四年から十六年まで内務卿をつとめ、宮崎県が再び置かれたときの内務卿だった。のちに日本法律学校（今の日本大学）を開いた。' },
    naito: { name: '内藤政挙', years: '1852〜1927', pref: '宮崎県', bio: '延岡藩の最後の藩主。西南戦争のとき延岡の町を守ることに心を砕き、のちに学校「亮天社」を開いて人を育てた。' },
    kawagoe: { name: '川越進', years: '1848〜1914', pref: '宮崎県', bio: '清武の出身。鹿児島県会の議員となり、日向の人々の声を集めて「分県」を訴え続けた。宮崎県の再置に力を尽くし、「宮崎県の父」とも呼ばれる。' },
    komura: { name: '小村寿太郎', years: '1855〜1911', pref: '宮崎県', bio: '飫肥の出身。アメリカのハーバード大学で法律を学び、明治十三年に帰国して司法省に勤めた。のちに外務大臣となり、条約改正を成しとげた。小柄なことから「ねずみ公使」とあだ名された。' },
    osuzu: { name: 'お鈴', pref: '宮崎県', fic: true, bio: '高千穂の夜神楽の舞い手（架空の人物）。' },
    tatsu: { name: '辰五郎', pref: '宮崎県', fic: true, bio: '美々津の船頭（架空の人物）。耳川の河口の港で生まれ育った。' },
    heizo: { name: '平蔵', pref: '宮崎県', fic: true, bio: '都城の弓師（架空の人物）。都城大弓を作り、自らも名人と呼ばれる。' },
    yashichi: { name: '弥七', pref: '宮崎県', fic: true, bio: '椎葉の狩人（架空の人物）。山の神を敬い、猪狩りの名手。' },
  },
  events: [
    { id: 'merge', year: '1876年8月', title: '宮崎県、鹿児島県に合わさる', pref: '宮崎県', desc: '明治六年に置かれた宮崎県は、明治九年に鹿児島県に合わされ、日向は鹿児島県の一部になった。' },
    { id: 'wadagoe', year: '1877年8月15日', title: '和田越の戦い', pref: '宮崎県', desc: '延岡の北、和田越で薩軍と政府軍が戦った。西郷が自ら戦場で指揮をとった、ただ一度の戦いといわれる。' },
    { id: 'kaisan', year: '1877年8月16日', title: '薩軍の解散', pref: '宮崎県', desc: '長井村で西郷は軍の解散を告げ、陸軍大将の軍服や書類を焼いたと伝わる。' },
    { id: 'toppa', year: '1877年8月17〜18日', title: '可愛岳の突破', pref: '宮崎県', desc: '西郷らは夜の可愛岳を越えて包囲を抜け、山の中を鹿児島へ向かった。' },
    { id: 'ogura', year: '1877年8月', title: '小倉処平の死', pref: '宮崎県', desc: '飫肥隊を率いた小倉処平は、長井村で自ら命を絶った。' },
    { id: 'shiroyama', year: '1877年9月24日', title: '城山の戦い', pref: '鹿児島県', desc: '西郷隆盛が城山で亡くなり、西南戦争が終わった。' },
    { id: 'ryotensha', year: '1880年', title: '亮天社', pref: '宮崎県', desc: '内藤政挙が延岡に学校「亮天社」を開いた。' },
    { id: 'bunken', year: '1880年ごろ〜', title: '分県運動', pref: '宮崎県', desc: '日向の人々が、鹿児島県から分かれて県を置くことを求めた。川越進らが中心となって署名を集め、建白書を出した。' },
    { id: 'saichi', year: '1883年5月9日', title: '宮崎県の再置', pref: '宮崎県', desc: '日向の人々の願いがかない、宮崎県がふたたび置かれた。' },
  ],
  places: {
    nagai: { name: '西郷隆盛宿陣跡資料館', where: '宮崎県延岡市北川町', pref: '宮崎県', desc: '西郷が長井村で泊まった家（児玉熊四郎宅）が残る。' },
    enodake: { name: '可愛岳', where: '宮崎県延岡市', pref: '宮崎県', desc: '西郷らが夜に越えた山。登山道がある。' },
    wadagoe: { name: '和田越決戦場跡', where: '宮崎県延岡市', pref: '宮崎県', desc: '西郷が自ら指揮をとった和田越の戦いの跡。' },
    nobeoka: { name: '延岡城跡（城山公園）', where: '宮崎県延岡市', pref: '宮崎県', desc: '「千人殺し」と呼ばれる高い石垣が残る。' },
    takachiho: { name: '高千穂峡と天岩戸神社', where: '宮崎県西臼杵郡高千穂町', pref: '宮崎県', desc: '神話の里。夜神楽が今も舞われている。' },
    mimitsu: { name: '美々津の町並み', where: '宮崎県日向市', pref: '宮崎県', desc: '耳川の河口の港町。神武天皇の船出の地という伝説がある。' },
    shiiba: { name: '椎葉村', where: '宮崎県東臼杵郡椎葉村', pref: '宮崎県', desc: '平家の落人の伝説が残る山の村。「ひえつき節」で知られる。' },
    miyazaki: { name: '宮崎県庁', where: '宮崎県宮崎市', pref: '宮崎県', desc: '宮崎県の役所。昭和七年に建てられた本館が今も使われている。' },
    aoshima: { name: '青島', where: '宮崎県宮崎市', pref: '宮崎県', desc: 'まわりを「鬼の洗濯板」と呼ばれる岩に囲まれた小さな島。' },
    udo: { name: '鵜戸神宮', where: '宮崎県日南市', pref: '宮崎県', desc: '海に面した洞窟の中に本殿がある神社。「運玉」を亀石に投げる。' },
    obi: { name: '飫肥城下町', where: '宮崎県日南市', pref: '宮崎県', desc: '石垣と武家屋敷の残る城下町。小村寿太郎の生家がある。' },
    miyakonojo: { name: '都城', where: '宮崎県都城市', pref: '宮崎県', desc: '島津家の発祥の地。都城大弓は国の伝統的工芸品。' },
    kagoshima: { name: '鹿児島（県庁）', where: '鹿児島県鹿児島市', pref: '鹿児島県', desc: '明治九年から十六年まで、日向も鹿児島県の一部だった。' },
    naimusho: { name: '内務省のあった場所', where: '東京都千代田区', pref: '東京都', desc: '地方の政治を受けもった役所。' },
  },
  endings: [
    { id: 'm1', name: '日向の灯', desc: '宮崎の町で、お菊と共に新しい県の始まりを見届けた。' },
    { id: 'm2', name: '海の向こうへ', desc: '小村寿太郎を追って、海の向こうへ学びに出た。' },
    { id: 'm3', name: '山の灯', desc: '長井村へ帰り、可愛岳のふもとで子どもたちを育てた。' },
  ],
};
