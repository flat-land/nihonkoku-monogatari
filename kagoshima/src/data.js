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
  kuper: { name: 'キューパー提督', spr: { body: '#141a3a', west: true, hair: '#9a9a9a', style: 'short' }, por: { style: 'west', fw: 7, brow: 2, eye: 'sharp', hair: '#a8a8a8', skin: '#f2d0b8', collar: 'west', cloth: '#141a3a', beard: 'full', bg: '#1a2238' } },
  josling: { name: 'ジョスリング艦長', spr: { body: '#141a3a', west: true, hair: '#6a4a2a', style: 'short' }, por: { style: 'west', fw: 7, brow: 2, hair: '#6a4a2a', skin: '#f2d0b8', collar: 'west', cloth: '#141a3a', beard: 'whiskers', bg: '#1a2238' } },
  neale: { name: 'ニール代理公使', spr: { body: '#2a2a2a', west: true, hair: '#8a8a8a', style: 'short' }, por: { style: 'west', fw: 6.5, brow: 1, eye: 'sharp', hair: '#8a8a8a', skin: '#f2d0b8', collar: 'west', cloth: '#2a2a2a', beard: 'mustache', bg: '#22222a' } },
  satow: { name: 'アーネスト・サトウ', spr: { body: '#3a3a4a', west: true, hair: '#3a2a1a', style: 'short' }, por: { style: 'west', fw: 6.5, brow: 1, eye: 'big', hair: '#3a2a1a', skin: '#f2d0b8', collar: 'west', cloth: '#3a3a4a', bg: '#22283a' } },
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
  taisho: { dex: 'rival', name: '高見馬場の大将', spr: { kind: 'samurai', hairStyle: 'mage', body: '#5a2a2a', lower: '#2a1a1a', hakama: true, w: 'bokuto', beard: '#3a2a2a' }, hp: 110, atk: 15, def: 6, spd: 6, exp: 45, gold: 60, skills: [{ p: .3, type: 'one', pow: 1.8, msg: '{n}の 渾身の一撃！' }, { p: .2, type: 'all', pow: .9, msg: '{n}は 木刀を振り回した！' }] },
  sailor: { dex: null, name: '英国水兵', spr: { kind: 'sailor', hairStyle: 'west', hair: '#8a5a2a', skin: '#f2c8a8', body: '#1a2a5a', lower: '#e8e8e8', hat: 'cap', w: 'cutlass' }, hp: 38, atk: 20, def: 10, spd: 9, exp: 18, gold: 24 },
  marine: { name: '英国海兵隊', spr: { kind: 'marine', hairStyle: 'west', hair: '#c8a060', skin: '#f2c8a8', body: '#b02020', lower: '#1a1a2a', hat: 'shako', w: 'rifle' }, hp: 52, atk: 22, def: 13, spd: 7, exp: 26, gold: 32, skills: [{ p: .25, type: 'all', pow: .8, msg: '{n}の 一斉射撃！' }] },
  boat: { name: '艦載ボート隊', spr: { t: 'boat' }, hp: 70, atk: 18, def: 11, spd: 6, exp: 32, gold: 40, skills: [{ p: .3, type: 'all', pow: .7, msg: '{n}が ボートから小銃を撃ってきた！' }] },
  shell: { name: 'アームストロング砲弾', spr: { t: 'shell' }, hp: 26, atk: 26, def: 22, spd: 14, exp: 24, gold: 6, skills: [{ p: .45, type: 'explode', pow: .9, msg: '{n}が 炸裂した！' }] },
  captain: { name: '拿捕隊の士官', spr: { kind: 'officer', hairStyle: 'west', hair: '#6a4a2a', skin: '#f2c8a8', body: '#141a3a', lower: '#141a3a', hat: 'bicorne', w: 'cutlass', beard: '#6a4a2a' }, hp: 200, atk: 26, def: 13, spd: 9, exp: 120, gold: 150, skills: [{ p: .25, type: 'one', pow: 1.6, msg: '{n}の 鋭い斬撃！' }, { p: .15, type: 'buff', msg: '{n}は 水兵たちを鼓舞した！' }] },
  euryalus: { dex: 'josling', name: '旗艦ユーリアラス号', spr: { t: 'ship' }, hp: 620, atk: 30, def: 15, spd: 5, exp: 400, gold: 300, defeat: '{n}の 艦橋に 砲弾が命中した！', skills: [{ p: .28, type: 'all', pow: .95, msg: '{n}の アームストロング砲が 火を噴いた！' }, { p: .2, type: 'all', pow: .75, msg: '{n}から ロケット弾が降り注ぐ！' }, { p: .12, type: 'buff', msg: '{n}は 舷側をこちらに向けた！' }] },
};

const ENC = {
  kotsuki: [['wakashu'], ['wakashu', 'wakashu'], ['nise'], ['wakashu', 'nise'], ['nise', 'nise'], ['wakashu', 'wakashu', 'wakashu']],
  kaigan1: [['sailor'], ['sailor', 'sailor'], ['marine'], ['sailor', 'marine'], ['boat'], ['shell', 'shell'], ['marine', 'marine'], ['sailor', 'shell', 'sailor']],
};

const SHOPS = {
  dougu: () => G.chapter >= 1 ? ['karaimo', 'tsukeage', 'kokuto', 'karukan', 'daikon', 'shochu'] : ['karaimo', 'tsukeage', 'kokuto', 'shochu'],
  kaji: () => G.chapter >= 1 ? ['satsumagoshirae', 'naminohira', 'hinawa', 'geweer', 'kasuri', 'jinbaori', 'gusoku', 'jingasa', 'omamori'] : ['yusu', 'kasuri', 'jingasa'],
};

// ===== 図鑑（人物・年表・ゆかりの地・結末） =====
// pref は出身・関わりの深い都道府県。鹿児島県以外は「全国のつながり」に表示され、
// 将来の日本國物語シリーズ（他の県の作品）とのつながりに使う。
const DEX = {
  people: {
    shinpachi: { name: '日高新八', pref: '鹿児島県', fic: true, bio: 'この物語の主人公（架空の人物）。加治屋町の下級武士の子で、示現流を学ぶ。西郷と大久保、二人の背中を追いかけて生きる。' },
    senkichi: { name: '川上仙吉', pref: '鹿児島県', fic: true, bio: '新八の幼なじみ（架空の人物）。おだやかで面倒見がよい。新しい世の中に強いあこがれを持っている。' },
    saigo: { name: '西郷隆盛（吉之助）', years: '1828〜1877', pref: '鹿児島県', bio: '加治屋町の下級武士の家に生まれる。藩主・島津斉彬に見出され、幕末の政局で活躍。薩長同盟、江戸無血開城を経て明治政府の中心となるが、のちに政府を去り、西南戦争に敗れて城山で亡くなった。' },
    okubo: { name: '大久保利通（一蔵）', years: '1830〜1878', pref: '鹿児島県', bio: '西郷と同じ加治屋町で育った幼なじみ。精忠組を率い、明治政府では内務卿として国づくりを進めた。西南戦争の翌年、東京の紀尾井坂で暗殺された。' },
    togo: { name: '東郷平八郎', years: '1848〜1934', pref: '鹿児島県', bio: '加治屋町の出身。薩英戦争に砲台の一員として加わった。のちにイギリスで学び、日露戦争では連合艦隊司令長官として日本海海戦を指揮した。' },
    nariakira: { name: '島津斉彬', years: '1809〜1858', pref: '鹿児島県', bio: '薩摩藩第11代藩主。集成館事業を起こし、洋式の工場や造船を進めた。身分の低い西郷を取り立てた。' },
    gessho: { name: '月照', years: '1813〜1858', pref: '京都府', bio: '京都・清水寺成就院の僧。尊王攘夷派の志士と交わり、安政の大獄で幕府に追われた。西郷とともに錦江湾に身を投げ、亡くなった。' },
    hisamitsu: { name: '島津久光', years: '1817〜1887', pref: '鹿児島県', bio: '斉彬の異母弟。藩主・忠義の父として藩の実権を握った。生麦事件は、久光の行列で起きた。' },
    rival: { name: '高見馬場の大将', pref: '鹿児島県', fic: true, bio: 'よその郷中の若衆頭（架空の人物）。乱暴者だが、約束は守る。' },
    neale: { name: 'ニール代理公使', years: '1812〜1866', pref: 'イギリス', bio: 'イギリスの代理公使。生麦事件の賠償を求め、艦隊とともに鹿児島へ来て交渉にあたった。' },
    kuper: { name: 'キューパー提督', years: '1809〜1885', pref: 'イギリス', bio: 'イギリス東インド・中国艦隊の司令長官。7隻の艦隊を率いて鹿児島に来航し、薩英戦争を指揮した。' },
    josling: { name: 'ジョスリング艦長', years: '？〜1863', pref: 'イギリス', bio: '旗艦ユーリアラス号の艦長。薩摩の砲台からの砲弾を受け、副長ウィルモットとともに戦死した。' },
    satow: { name: 'アーネスト・サトウ', years: '1843〜1929', pref: 'イギリス', bio: 'イギリス公使館の若い通訳。薩英戦争に艦隊とともに同行した。のちに外交官として日本と深く関わり、多くの記録を残した。' },
  },
  events: [
    { id: 'nariakira', year: '1858年7月', title: '島津斉彬、死去', pref: '鹿児島県', desc: '集成館事業を進めた名君が急死。西郷は後を追おうとしたが、月照に止められた。' },
    { id: 'ansei', year: '1858年', title: '安政の大獄', pref: '東京都', desc: '大老・井伊直弼が、幕府に反対する大名や志士を厳しく取り締まった。月照も追われる身となった。' },
    { id: 'jusui', year: '1858年11月', title: '西郷と月照、錦江湾に入水', pref: '鹿児島県', desc: '藩に月照を匿うことを拒まれ、二人は冬の海に身を投げた。西郷だけが助かった。' },
    { id: 'amami', year: '1859年', title: '西郷、奄美大島へ', pref: '鹿児島県', desc: '藩は西郷を死んだことにし、「菊池源吾」の名で奄美大島に移した。西郷は島で家族を持った。' },
    { id: 'teradaya', year: '1862年4月', title: '寺田屋事件', pref: '京都府', desc: '京都・伏見の船宿で、過激な薩摩藩士たちを、久光の命を受けた同じ薩摩の藩士が斬った。' },
    { id: 'okinoerabu', year: '1862年', title: '西郷、ふたたび島へ', pref: '鹿児島県', desc: '島から呼び戻された西郷は久光とぶつかり、徳之島、さらに沖永良部島へ流された。' },
    { id: 'namamugi', year: '1862年8月', title: '生麦事件', pref: '神奈川県', desc: '久光の行列を横切ったイギリス人を、薩摩藩士が斬った。イギリスは犯人の引き渡しと賠償を求めた。' },
    { id: 'fleet', year: '1863年6月', title: 'イギリス艦隊、来航', pref: '鹿児島県', desc: '7隻のイギリス艦隊が錦江湾に現れ、生麦事件の賠償を迫った。' },
    { id: 'satsuei', year: '1863年7月2日', title: '薩英戦争、始まる', pref: '鹿児島県', desc: '薩摩の蒸気船3隻が奪われ、天保山砲台が砲撃を開始。嵐の中の砲撃戦となった。' },
    { id: 'withdraw', year: '1863年7月4日', title: 'イギリス艦隊、去る', pref: '鹿児島県', desc: '旗艦の艦長が戦死するなど艦隊も傷つき、湾を去った。城下と集成館は大きく焼けた。' },
    { id: 'peace', year: '1863年11月', title: '薩英の和議', pref: '神奈川県', desc: '横浜で和議が結ばれた。これをきっかけに、薩摩とイギリスは近づいていく。' },
    { id: 'ryugaku', year: '1865年', title: '薩摩藩英国留学生', pref: '鹿児島県', desc: '国の決まりを破り、19人の薩摩の若者がひそかにイギリスへ渡った。' },
  ],
  places: {
    kajiya: { name: '加治屋町', where: '鹿児島県鹿児島市加治屋町', pref: '鹿児島県', desc: '西郷隆盛、大久保利通、東郷平八郎ゆかりの町。誕生地などを示す碑が建ち、歴史館「維新ふるさと館」がある。' },
    kotsuki: { name: '甲突川と石橋', where: '鹿児島県鹿児島市', pref: '鹿児島県', desc: '城下を流れる川。江戸時代の終わりに架けられた石橋のいくつかは、「石橋記念公園」に移されて残っている。' },
    tenpozan: { name: '天保山砲台跡', where: '鹿児島県鹿児島市天保山町', pref: '鹿児島県', desc: '薩英戦争で、最初にイギリス艦隊へ砲撃した砲台の跡。' },
    sakurajima: { name: '錦江湾と桜島', where: '鹿児島県鹿児島市', pref: '鹿児島県', desc: '今も煙を上げる活火山・桜島。薩英戦争の舞台となった海。' },
    shuseikan: { name: '旧集成館（尚古集成館）', where: '鹿児島県鹿児島市吉野町', pref: '鹿児島県', desc: '斉彬が始めた工場群の跡。世界遺産「明治日本の産業革命遺産」の一部。' },
    amami: { name: '西郷南洲謫居跡（奄美大島）', where: '鹿児島県大島郡龍郷町', pref: '鹿児島県', desc: '西郷が「菊池源吾」として暮らした地。' },
    okinoerabu: { name: '沖永良部島', where: '鹿児島県大島郡和泊町', pref: '鹿児島県', desc: '西郷が牢に入れられて過ごした島。' },
    kiyomizu: { name: '清水寺', where: '京都府京都市東山区', pref: '京都府', desc: '月照が住職を務めた成就院がある寺。' },
    teradaya: { name: '寺田屋', where: '京都府京都市伏見区', pref: '京都府', desc: '寺田屋事件の舞台となった伏見の船宿。' },
    namamugi: { name: '生麦事件の碑', where: '神奈川県横浜市鶴見区', pref: '神奈川県', desc: '生麦事件が起きた場所の近くに碑が建つ。' },
    ryugakusei: { name: '薩摩藩英国留学生記念館', where: '鹿児島県いちき串木野市羽島', pref: '鹿児島県', desc: '留学生たちが旅立った羽島の浜に建つ記念館。' },
  },
  endings: [{ id: 'end1' }, { id: 'end2' }, { id: 'end3' }, { id: 'end4' }],
};
