'use strict';
// ===== 薩摩・大隅の各地（知覧・指宿・坊津・出水）と、物語に関わらない仲間たち =====
// 仲間：お柚（知覧）・権兵衛（指宿）・玄斎（坊津）・鉄之進（出水）。いずれも架空の人物。

Object.assign(PEOPLE, {
  oyuzu: { name: 'お柚', spr: { body: '#7a3a5a', body2: '#4a2a3a', cloth: 'hakama', hs: 'woman', hat: 'hachimaki', hatc: '#f0ece0', belt: '#e8c040', eyes: 'big' }, por: { style: 'woman', fw: 6.3, eye: 'big', brow: 1, cloth: '#7a3a5a', bg: '#3a2a3a', mouth: 'firm' } },
  gonbe: { name: '権兵衛', spr: { body: '#2f5a7a', body2: '#c8b48a', skin: '#c88a5a', cloth: 'kimono', hat: 'hachimaki', hatc: '#e8e0d0', beard: '#2a1a10', big: true }, por: { style: 'short', fw: 8.2, brow: 2, eye: 'normal', skin: '#c88a5a', cloth: '#2f5a7a', beard: 'stubble', mouth: 'smile', bg: '#1e3a4a' } },
  gensai: { name: '玄斎', spr: { body: '#2a2a3a', body2: '#3a3a4a', cloth: 'kimono', hs: 'bald', eyes: 'closed', beard: '#8a8a8a' }, por: { style: 'bald', fw: 6.8, eye: 'gentle', cloth: '#2a2a3a', glasses: true, beard: 'mustache', bg: '#2a3a34', hair: '#8a8a8a' } },
  tetsu: { name: '鉄之進', spr: { body: '#2a3a2a', body2: '#3a3428', cloth: 'hakama', hs: 'spiky', hat: 'hachimaki', hatc: '#c02020', brow: 2 }, por: { style: 'mage', fw: 7.5, brow: 3, eye: 'sharp', cloth: '#2a3a2a', mouth: 'firm', bg: '#2a3428' } },
  torikashira: { name: '捕り方の頭', spr: { body: '#2a2a2a', body2: '#2a2a2a', cloth: 'hakama', hat: 'jingasa', sword: true, brow: 2 }, por: { fw: 7.5, brow: 3, eye: 'sharp', cloth: '#2a2a2a', hat: 'jingasa' } },
  henmi: { name: '辺見十郎太', spr: { body: '#3a2a22', body2: '#2a2a2a', cloth: 'hakama', hs: 'short', sword: true, big: true, brow: 2 }, por: { style: 'short', fw: 8, brow: 3, eye: 'sharp', cloth: '#3a2a22', mouth: 'firm', bg: '#2a1a1a' } },
  crane: { name: '鶴', spr: { kind: 'crane' } },
  kannushi: { name: '神主', spr: { body: '#f0ece0', body2: '#6a5aa0', cloth: 'robe', hat: 'eboshi', eyes: 'closed' }, por: { fw: 7, eye: 'gentle', cloth: '#f0ece0', hat: 'eboshi' } },
  miko: { name: '巫女', spr: { body: '#f4f0e8', body2: '#c02020', cloth: 'hakama', hs: 'woman' }, por: { style: 'woman', fw: 6.3, cloth: '#f4f0e8' } },
  sanzokuB: { name: '山賊の頭', spr: { body: '#5a4a2a', body2: '#3a2a1a', cloth: 'kimono', hs: 'spiky', beard: '#2a1a10', big: true, brow: 2 }, por: { fw: 8.5, brow: 3, eye: 'sharp', cloth: '#5a4a2a', beard: 'full' } },
  kaizokuB: { name: '黒鮫の頭', spr: { body: '#1e2a3a', body2: '#3a3a3a', skin: '#c88a5a', cloth: 'kimono', hat: 'hachimaki', hatc: '#1a1a1a', beard: '#1a1a1a', big: true, brow: 2 }, por: { fw: 8.5, brow: 3, eye: 'sharp', skin: '#c08050', cloth: '#1e2a3a', beard: 'full' } },
  nukeniB: { name: '抜け荷の元締め', spr: { body: '#7a5a2a', body2: '#4a3a1a', cloth: 'kimono', hat: 'kasa', eyes: 'narrow' }, por: { fw: 7.5, eye: 'sharp', cloth: '#7a5a2a', mouth: 'smile' } },
  onmitsuB: { name: '公儀隠密の頭', spr: { body: '#1a1a2a', body2: '#1a1a2a', cloth: 'kimono', hat: 'zukin', hatc: '#101018' }, por: { fw: 7, eye: 'sharp', cloth: '#1a1a2a' } },
  sekimori: { name: '関所の番人', spr: { body: '#3a3a2a', body2: '#2a2a2a', cloth: 'hakama', hat: 'jingasa', crest: true, sword: true }, por: { fw: 7, cloth: '#3a3a2a', hat: 'jingasa' } },
});

Object.assign(HEROES, {
  oyuzu: { el: '木', base: { hp: 26, ki: 10, atk: 8, def: 5, spd: 10 }, grow: { hp: 6.0, ki: 2.0, atk: 2.3, def: 1.4, spd: 1.6 }, kinds: ['naginata'], skills: [['nagi', 1], ['chaka', 4], ['ikegaki', 9], ['tsubame', 14], ['hanafubuki', 20], ['bukemusume', 27]], start: { w: 'naginata1', a: 'kasuri', h: 'hachimaki' } },
  gonbe: { el: '水', base: { hp: 34, ki: 6, atk: 9, def: 6, spd: 5 }, grow: { hp: 7.4, ki: 1.4, atk: 2.5, def: 1.8, spd: 1.0 }, kinds: ['mori'], skills: [['morinage', 1], ['amiuchi', 5], ['sunamushi', 9], ['kujira', 15], ['ooshio', 22], ['umiotoko', 29]], start: { w: 'mori1', a: 'keikogi', h: 'hachimaki' } },
  gensai: { el: '土', base: { hp: 24, ki: 16, atk: 6, def: 5, spd: 7 }, grow: { hp: 5.4, ki: 2.8, atk: 1.7, def: 1.4, spd: 1.2 }, kinds: ['cane'], skills: [['shinsatsu', 1], ['masui', 4], ['tsuejutsu', 6], ['gedoku', 8], ['shuto', 12], ['oranda', 18], ['shohou', 25]], start: { w: 'tsue1', a: 'kasuri' } },
  tetsu: { el: '金', base: { hp: 32, ki: 8, atk: 10, def: 7, spd: 7 }, grow: { hp: 7.0, ki: 1.5, atk: 2.6, def: 1.7, spd: 1.2 }, kinds: ['yari'], skills: [['yaritsuki', 1], ['hekonoko', 5], ['kakuyoku', 10], ['izumisuji', 15], ['jumonji', 20], ['nomanoseki', 27]], start: { w: 'yari1', a: 'keikogi', h: 'hachimaki' } },
});

Object.assign(SKILLS, {
  // お柚（薙刀・木）
  nagi: { name: '薙ぎ払い', ki: 3, target: 'enemies', type: 'atk', pow: 1.0, fx: 'slash', el: '木', desc: '長い薙刀で 敵全体を薙ぎ払う' },
  chaka: { name: '知覧茶の一服', ki: 4, target: 'all', type: 'kiup', pow: 8, desc: '香りのよい茶をいれる。仲間全員の気を少し回復' },
  ikegaki: { name: '生垣の守り', ki: 6, target: 'allies', type: 'buff', stat: ['def'], v: .3, turns: 3, desc: '知覧の武家屋敷の生垣のように、仲間全員の守りを3ターン上げる' },
  tsubame: { name: '燕返し', ki: 7, target: 'enemy', type: 'atk', pow: 2.6, fx: 'slash', el: '木', debuff: { stat: ['spd'], v: .3, turns: 3 }, desc: '返す刃で斬る。敵の素早さを下げる' },
  hanafubuki: { name: '花吹雪', ki: 9, target: 'enemies', type: 'debuff', stat: ['atk', 'spd'], v: .25, turns: 3, rate: .85, desc: '舞うような薙刀さばきで 敵全体の攻撃力と素早さを下げる' },
  bukemusume: { name: '武家の娘の覚悟', ki: 15, target: 'enemy', type: 'atk', pow: 4.2, fx: 'chest', el: '木', desc: '知覧の武家の娘の、渾身の一撃' },
  // 権兵衛（銛・水）
  morinage: { name: '銛投げ', ki: 3, target: 'enemy', type: 'atk', pow: 1.7, sure: true, fx: 'shot', el: '水', desc: '漁の銛を投げつける。必ず当たる' },
  amiuchi: { name: '投網', ki: 4, target: 'enemies', type: 'debuff', stat: ['spd'], v: .35, turns: 3, rate: .85, desc: '網を投げて 敵全体の動きを鈍らせる' },
  sunamushi: { name: '砂むし', ki: 7, target: 'allies', type: 'regen', pow: 16, turns: 3, desc: '指宿の砂むし温泉の知恵。仲間全員のHPが3ターン少しずつ回復' },
  kujira: { name: '鯨突き', ki: 9, target: 'enemy', type: 'atk', pow: 3.4, fx: 'chest', el: '水', bleed: { pow: .35, turns: 3 }, desc: '鯨をも仕留める突き。出血させる' },
  ooshio: { name: '大潮', ki: 11, target: 'enemies', type: 'atk', pow: 2.0, fx: 'boom', el: '水', desc: '潮の満ち引きのような力で 敵全体を押し流す' },
  umiotoko: { name: '海の男の意地', ki: 8, target: 'self', type: 'regen', pow: 34, turns: 4, extraBuff: { stat: ['def', 'atk'], v: .3, turns: 4 }, desc: '自分のHPが4ターン回復し、攻撃力と守りも上がる' },
  // 玄斎（杖・土）
  shinsatsu: { name: '診察', ki: 3, target: 'ally', type: 'heal', pow: 34, desc: '傷を見立てて手当てする。仲間ひとりのHPを回復' },
  masui: { name: '麻酔の針', ki: 4, target: 'enemy', type: 'stun', rate: .65, desc: '眠り薬を塗った針。敵ひとりをひるませる（1回休み）' },
  tsuejutsu: { name: '杖術', ki: 3, target: 'enemy', type: 'atk', pow: 1.8, fx: 'hit', el: '土', stun: .2, desc: '杖で打ちすえる。ひるませることがある' },
  gedoku: { name: '煎じ薬', ki: 7, target: 'allies', type: 'regen', pow: 13, turns: 4, desc: '薬草を煎じて飲ませる。仲間全員のHPが4ターン少しずつ回復' },
  shuto: { name: '種痘', ki: 8, target: 'allies', type: 'buff', stat: ['def'], v: .3, turns: 4, desc: '蘭方の予防の術。仲間全員の守りが4ターン上がる' },
  oranda: { name: '蘭方の大手術', ki: 13, target: 'ally', type: 'heal', pow: 170, revive: true, desc: '倒れた仲間も起こす、西洋の医術' },
  shohou: { name: '処方箋', ki: 12, target: 'allies', type: 'heal', pow: 95, desc: '仲間全員のHPを大きく回復' },
  // 鉄之進（槍・金）
  yaritsuki: { name: '突き', ki: 3, target: 'enemy', type: 'atk', pow: 1.9, sure: true, fx: 'slash', el: '金', desc: 'まっすぐな槍の突き。必ず当たる' },
  hekonoko: { name: '兵児の雄叫び', ki: 4, target: 'self', type: 'buff', stat: ['atk', 'def'], v: .3, turns: 3, say: 'チェストォ！ 出水兵児の意地じゃ！', desc: '自分の攻撃力と守りが3ターン上がる' },
  kakuyoku: { name: '鶴翼の陣', ki: 7, target: 'allies', type: 'buff', stat: ['def', 'spd'], v: .25, turns: 3, desc: '出水の鶴のように翼を広げる陣。仲間全員の守りと素早さを上げる' },
  izumisuji: { name: '出水筋の守り', ki: 6, target: 'all', type: 'guard', desc: '国境を守る兵の構え。このターン、仲間全員の受けるダメージを半分にする' },
  jumonji: { name: '十文字突き', ki: 10, target: 'enemies', type: 'atk', pow: 1.9, fx: 'slash', el: '金', debuff: { stat: ['def'], v: .25, turns: 3 }, desc: '十文字槍で 敵全体を突き、守りを崩す' },
  nomanoseki: { name: '野間の関', ki: 15, target: 'enemy', type: 'atk', pow: 4.4, fx: 'chest', el: '金', stun: .3, desc: '何者も通さぬ関所の一撃' },
});

Object.assign(ITEMS, {
  naginata1: { name: '稽古の薙刀', type: 'w', kind: 'naginata', atk: 5, price: 50, desc: '武家の娘が稽古に使う薙刀' },
  naginata2: { name: '薩摩薙刀', type: 'w', kind: 'naginata', atk: 18, price: 760, desc: '柄の長い、反りの強い薙刀' },
  naginata3: { name: '静の大薙刀', type: 'w', kind: 'naginata', atk: 34, price: 3300, desc: '舞うように振るえる名品の薙刀' },
  naginata4: { name: '巴形薙刀', type: 'w', kind: 'naginata', atk: 47, price: 6400, desc: '大きく反った刃の薙刀の名品' },
  mori1: { name: '漁の銛', type: 'w', kind: 'mori', atk: 7, price: 60, desc: '指宿の漁師が使う銛' },
  mori2: { name: '鯨銛', type: 'w', kind: 'mori', atk: 21, price: 820, desc: '鯨を突くための大きな銛' },
  mori3: { name: '鋼の大銛', type: 'w', kind: 'mori', atk: 35, price: 3400, desc: '鍛冶屋が鋼で打った銛' },
  mori4: { name: '黒潮の銛', type: 'w', kind: 'mori', atk: 48, price: 6600, desc: '黒潮の大魚を仕留めたという銛' },
  tsue1: { name: '樫の杖', type: 'w', kind: 'cane', atk: 4, price: 40, desc: '堅い樫の木の杖' },
  tsue2: { name: '鉄扇', type: 'w', kind: 'cane', atk: 15, price: 700, desc: '鉄の骨の扇。身を守るのにも使う' },
  tsue3: { name: '仕込み杖', type: 'w', kind: 'cane', atk: 28, price: 3000, desc: '中に細い刃を隠した杖' },
  tsue4: { name: '蘭方医の銀杖', type: 'w', kind: 'cane', atk: 38, price: 6000, desc: '長崎から取り寄せた銀の杖' },
  yari1: { name: '素槍', type: 'w', kind: 'yari', atk: 8, price: 70, desc: 'まっすぐな穂先の槍' },
  yari2: { name: '十文字槍', type: 'w', kind: 'yari', atk: 22, price: 860, desc: '穂先が十文字の槍' },
  yari3: { name: '大身槍', type: 'w', kind: 'yari', atk: 36, price: 3500, desc: '穂先の長い、重い槍' },
  yari4: { name: '島津の御槍', type: 'w', kind: 'yari', atk: 49, price: 6800, desc: '島津家の行列で掲げられた槍' },
  ibusukisuna: { name: '指宿の湯の花', type: 'use', price: 50, ki: 18, desc: '温泉の湯の花。気を18回復' },
  tsurunohane: { name: '鶴の羽根', type: 'x', spd: 7, def: 3, price: 600, desc: '出水に冬を越しにくる鶴の羽根' },
  bonotsugarasu: { name: '唐渡りの硝子玉', type: 'x', ki: 16, def: 4, price: 900, desc: '坊津の港に入った異国の品' },
  chirancha2: { name: '知覧の新茶', type: 'use', price: 150, kiAll: 15, desc: '初摘みの茶。全員の気を15回復' },
  omikuji: { name: '神社のお守り', type: 'x', def: 5, hp: 20, price: 0, desc: '神社でいただいたお守り' },
});

// ---- 野山の敵（scaled：出る時期に合わせて強さが変わる） ----
Object.assign(EN, {
  sanzoku: { name: '山賊', L: 3, scaled: true, m: {}, fx: 'slash', el: '木', spr: { body: '#5a4a2a', body2: '#3a2a1a', cloth: 'kimono', hs: 'spiky', pose: 'club', beard: '#2a1a10' }, skills: [{ p: .15, type: 'pdebuff', stat: ['def'], v: .2, msg: '{n}は 砂をかけてきた！' }] },
  oihagi: { name: '追い剥ぎ', L: 2.5, scaled: true, m: { hp: .9, gold: 1.4 }, fx: 'hit', spr: { body: '#4a4a3a', body2: '#3a3a2a', cloth: 'kimono', hat: 'zukin', hatc: '#3a3a2a', pose: 'club' }, flee: .1 },
  ronin: { name: '食い詰め浪人', L: 4, scaled: true, m: { atk: 1.1 }, fx: 'slash', spr: { body: '#4a4a52', body2: '#3a3a3a', cloth: 'hakama', hs: 'mage', pose: 'tonbo' }, skills: [{ p: .2, type: 'one', pow: 1.5, msg: '{n}の 居合い抜き！' }] },
  yamabushi: { name: 'にせ山伏', L: 4, scaled: true, m: { hp: 1.1 }, fx: 'hit', el: '土', spr: { body: '#e8e0d0', body2: '#5a5a5a', cloth: 'robe', hat: 'eboshi', pose: 'club' }, skills: [{ p: .2, type: 'kidrain', pow: 3, msg: '{n}は あやしい呪文を唱えた！' }, { p: .12, type: 'ebuff', stat: ['def'], v: .3, msg: '{n}は 九字を切った！' }] },
  shugen: { name: '霧島の修験者', L: 5, scaled: true, m: { hp: 1.2, def: 1.2 }, fx: 'hit', el: '土', spr: { body: '#d8d0c0', body2: '#3a3a3a', cloth: 'robe', hat: 'eboshi', pose: 'spear' }, skills: [{ p: .2, type: 'heal', pow: .2, msg: '{n}は 山の気を集めた！' }] },
  kaizoku: { name: '海賊', L: 3.5, scaled: true, m: { hp: .9, atk: .95 }, fx: 'slash', el: '水', spr: { body: '#1e2a3a', body2: '#3a3a3a', skin: '#c88a5a', cloth: 'kimono', hat: 'hachimaki', hatc: '#1a1a1a', pose: 'cutlass' } },
  mikkoku: { name: '密航の荒くれ', L: 4.5, scaled: true, m: { hp: 1.2 }, fx: 'hit', el: '水', spr: { body: '#3a4a5a', body2: '#2a2a2a', skin: '#c88a5a', cloth: 'kimono', hs: 'short', pose: 'club' }, skills: [{ p: .2, type: 'all', pow: .8, msg: '{n}は 櫂を振り回した！' }] },
  kagemono: { name: '隠密の手下', L: 4.5, scaled: true, m: { spd: 1.4 }, evade: .12, fx: 'slash', el: '水', spr: { body: '#2a2a3a', body2: '#2a2a3a', cloth: 'kimono', hat: 'zukin', hatc: '#1a1a2a', pose: 'tonbo' }, skills: [{ p: .18, type: 'pdebuff', stat: ['atk'], v: .25, msg: '{n}は 目つぶしを投げた！' }] },
  // ---- 寄り道の頭（ボス） ----
  sanzokuB: { name: '開聞の山賊頭', L: 6, scaled: true, m: { hp: 3.4, atk: 1.05, exp: 5, gold: 6 }, fx: 'slash', el: '木', spr: { body: '#5a4a2a', body2: '#3a2a1a', cloth: 'kimono', hs: 'spiky', pose: 'club', beard: '#2a1a10', big: true, brow: 2 }, skills: [{ p: .25, type: 'one', pow: 1.8, msg: '{n}の 丸太のような一撃！' }, { p: .15, type: 'ebuff', all: true, stat: ['atk'], v: .3, msg: '{n}「野郎ども、かかれぇ！」' }, { p: .12, type: 'pdebuff', all: true, stat: ['spd'], v: .25, msg: '{n}の 大声が 山に響く！' }] },
  kaizokuB: { name: '黒鮫の頭', L: 6, scaled: true, m: { hp: 2.9, atk: .95, exp: 5, gold: 6 }, fx: 'slash', el: '水', spr: { body: '#1e2a3a', body2: '#3a3a3a', skin: '#c88a5a', cloth: 'kimono', hat: 'hachimaki', hatc: '#1a1a1a', pose: 'cutlass', beard: '#1a1a1a', big: true, brow: 2 }, skills: [{ p: .2, type: 'all', pow: .8, msg: '{n}の 薙ぎ払い！' }, { p: .12, type: 'pbleed', pow: .9, msg: '{n}の 鮫の歯の刀！' }, { p: .08, type: 'ebuff', stat: ['atk'], v: .2, msg: '{n}は 酒をあおった！' }] },
  nukeniB: { name: '抜け荷の元締め', L: 7, scaled: true, m: { hp: 3.2, atk: 1, exp: 5, gold: 12 }, fx: 'shot', el: '金', spr: { body: '#7a5a2a', body2: '#4a3a1a', cloth: 'kimono', hat: 'kasa', pose: 'rifle', big: true }, skills: [{ p: .25, type: 'one', pow: 1.7, msg: '{n}の 南蛮渡りの短筒！', fx: 'shot' }, { p: .15, type: 'pdebuff', all: true, stat: ['atk'], v: .25, msg: '{n}は 金をばらまいた！ 気がそれる……' }, { p: .1, type: 'heal', pow: .12, msg: '{n}は 唐の薬を飲んだ！' }] },
  yojinbo: { name: '元締めの用心棒', L: 6, scaled: true, m: { hp: 1.4, atk: 1.1 }, fx: 'slash', spr: { body: '#3a2a2a', body2: '#2a2a2a', cloth: 'hakama', hs: 'mage', pose: 'tonbo', brow: 2 } },
  onmitsuB: { name: '公儀隠密の頭', L: 7, scaled: true, m: { hp: 3.2, atk: 1.05, spd: 1.5, exp: 5, gold: 6 }, evade: .15, fx: 'slash', el: '水', spr: { body: '#1a1a2a', body2: '#1a1a2a', cloth: 'kimono', hat: 'zukin', hatc: '#101018', pose: 'tonbo', big: true }, skills: [{ p: .2, type: 'pdebuff', all: true, stat: ['atk'], v: .25, msg: '{n}は 煙玉を投げた！' }, { p: .2, type: 'one', pow: 1.9, msg: '{n}の 忍び刀！' }, { p: .12, type: 'pbleed', pow: .9, msg: '{n}の 手裏剣！', fx: 'shot' }] },
});
EN.hikyaku.scaled = true; EN.nukeni.scaled = true;
for (const id of ['kagemono', 'sanzoku', 'oihagi', 'ronin', 'yamabushi', 'shugen', 'kaizoku', 'mikkoku', 'sanzokuB', 'kaizokuB', 'nukeniB', 'yojinbo', 'onmitsuB']) ENEMIES[id] = mkEnemy(id, EN[id]);
// 出る時期に合わせた強さ（L）。章ごとの目安
function fieldL(add = 0) { return (({ 0: 3, 1: 8, 2: 12, 3: 16, 8: 31 })[G.chapter] ?? Math.max(3, G.chapter * 4)) + add; }
// 寄り道の頭や神主には、会話の顔絵を出さない（モブ扱い）
for (const id of ['torikashira', 'kannushi', 'miko', 'sanzokuB', 'kaizokuB', 'nukeniB', 'onmitsuB', 'sekimori']) MOBS.add(id);
HI_HAIR.tetsu = 'spiky';

Object.assign(ENC, {
  satsumaN: [['sanzoku'], ['oihagi', 'oihagi'], ['ronin'], ['sanzoku', 'oihagi'], ['yamabushi'], ['ronin', 'sanzoku']],
  satsumaC: [['oihagi'], ['sanzoku'], ['oihagi', 'sanzoku'], ['ronin'], ['oihagi', 'oihagi', 'oihagi']],
  satsumaS: [['kaizoku'], ['mikkoku'], ['kaizoku', 'mikkoku'], ['sanzoku', 'kaizoku'], ['mikkoku', 'mikkoku']],
  satsumaK: [['yamabushi'], ['shugen'], ['yamabushi', 'sanzoku'], ['shugen', 'yamabushi'], ['ronin', 'shugen']],
  kaimon: [['sanzoku'], ['sanzoku', 'sanzoku'], ['sanzoku', 'oihagi'], ['ronin', 'sanzoku'], ['sanzoku', 'sanzoku', 'oihagi']],
  meijiField: [['mittei'], ['fuhei'], ['burai', 'fuhei'], ['mittei', 'burai']],
});

Object.assign(SHOPS, {
  chiran: () => G.chapter >= 8 ? ['naginata4', 'mori4', 'tsue4', 'yari4', 'satsugun', 'gunbo', 'inusatsu', 'tsurunohane'] : G.chapter >= 2 ? ['naginata2', 'naginata3', 'mori2', 'yari2', 'yari3', 'tsue2', 'jinbaori', 'gusoku', 'nirayama', 'inukawa'] : ['naginata1', 'naginata2', 'yari1', 'mori1', 'tsue1', 'kasuri', 'jingasa', 'inudo'],
  chiranDougu: () => ['karaimo', 'tsukeage', 'kokuto', 'chiran', 'chirancha2', 'shochu', 'karukan', 'horoku'],
  ibusuki: () => ['karaimo', 'tsukeage', 'karukan', 'ibusukisuna', 'kokuto', 'shochu', 'daikon', 'horoku', G.chapter >= 8 ? 'mori4' : G.chapter >= 2 ? 'mori3' : 'mori2'],
  bonotsu: () => G.chapter >= 8 ? ['tsue4', 'snider', 'oshima', 'bonotsugarasu', 'kiriko', 'meishu', 'keihan'] : ['tsue2', 'tsue3', 'geweer', 'minie', 'kasuri', 'bonotsugarasu', 'kokuto', 'shochu', 'mikan'],
  izumi: () => G.chapter >= 8 ? ['yari4', 'motohira', 'satsugun', 'gunbo', 'tsurunohane', 'kurobuta', 'meishu'] : ['yari2', 'yari3', 'naginata2', 'naminohira', 'gusoku', 'jingasa', 'tsurunohane', 'tsukeage', 'karukan', 'shochu'],
});
Object.assign(SHOP_TALK, {
  chiran: ['merchant', '知覧の武具屋でござる。\n薙刀も槍も、そろえちょります。', '知覧の武具屋です。\n薙刀も槍も、そろえています。'],
  chiranDougu: ['merchant', '知覧茶は 気が晴るっど。\nどうぞ見ていきやんせ。', '知覧茶は 気分が晴れますよ。\nどうぞ見ていってください。'],
  ibusuki: ['fisher', '指宿の浜の店じゃ。\n湯の花も 魚も あっど。', '指宿の浜の店だ。\n湯の花も 魚も あるよ。'],
  bonotsu: ['merchant', '……ここだけの話、唐の品も ありもす。', '……ここだけの話、中国の品も ありますよ。'],
  izumi: ['smith', '出水は国境の町じゃ。\n槍の備えは 欠かせん。', '出水は国境の町だ。\n槍の備えは 欠かせない。'],
});

Object.assign(DEX.people, {
  oyuzu: { name: 'お柚', pref: '鹿児島県', fic: true, bio: '知覧の武家の娘（架空の人物）。薙刀の名手で、気が強く面倒見がよい。家の茶畑を荒らす山賊に、ひとりで立ち向かおうとしていた。' },
  gonbe: { name: '権兵衛', pref: '鹿児島県', fic: true, bio: '指宿の漁師（架空の人物）。体が大きく力持ち。砂むし温泉の浜で生まれ育ち、海のことなら何でも知っている。' },
  gensai: { name: '玄斎', pref: '鹿児島県', fic: true, bio: '坊津の町医者（架空の人物）。長崎で蘭方（オランダ医学）を学んだ。口は悪いが、病人を見捨てない。' },
  tetsu: { name: '黒木鉄之進', pref: '鹿児島県', fic: true, bio: '出水の郷士（架空の人物）。肥後との国境を守る「出水兵児」の気風を受け継ぐ槍の使い手。' },
});
Object.assign(DEX.places, {
  chiran: { name: '知覧武家屋敷庭園', where: '鹿児島県南九州市知覧町', pref: '鹿児島県', desc: '石垣と生垣が続く武家屋敷の町並み。七つの庭園が公開されている。' },
  ibusuki: { name: '指宿の砂むし温泉', where: '鹿児島県指宿市', pref: '鹿児島県', desc: '海岸の砂に湧く温泉で体を温める「砂むし」で知られる。' },
  kaimon: { name: '開聞岳', where: '鹿児島県指宿市', pref: '鹿児島県', desc: '「薩摩富士」と呼ばれる、円すい形の美しい山。' },
  bonotsu: { name: '坊津', where: '鹿児島県南さつま市坊津町', pref: '鹿児島県', desc: '古くから中国や琉球との船が出入りした港町。密貿易の舞台にもなった。' },
  izumi: { name: '出水麓武家屋敷群', where: '鹿児島県出水市', pref: '鹿児島県', desc: '国境を守る武士たちが住んだ町。冬には万羽を超える鶴が飛来する。' },
  terukuni: { name: '照国神社', where: '鹿児島県鹿児島市照国町', pref: '鹿児島県', desc: '島津斉彬をまつる神社。斉彬の死後、文久三年（1863年）に神号が贈られ、翌年社殿が建てられた。' },
  satsumaroad: { name: '薩摩の街道', where: '鹿児島県', pref: '鹿児島県', desc: '城下から出水筋・大口筋・日向筋などの街道が国境へのびていた。' },
});
