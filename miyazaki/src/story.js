'use strict';
// ===== 宮崎編の物語 =====
// Q([...]) : 会話をまとめて流す。要素は ['人物', '日向弁などの原文', '標準語訳'] か、地の文の文字列。
async function Q(list) { for (const l of list) { if (typeof l === 'string') await N(l); else await S(l[0], l[1], l[2]); } }
async function interlude(title, fn) { await fadeOut(); hideDlg(); const pb = Audio8.cur; bgm('night'); await card('幕間', title, 3000); await fn(); await fadeOut(); Audio8.cur = null; if (pb) bgm(pb); await fadeIn(); }
async function startChapter(n, title, sub, mapId, x, y, lines) {
  await fadeOut(800); hideDlg(); G.chapter = n; G.night = false; G.ride = false; flag('ch' + n);
  enterMap(mapId, x, y, 0); bgm(null);
  await card(title, sub, 5000);
  if (lines && lines.length) await still(lines, 'hyuga');
  Audio8.cur = null; bgm(typeof G.map.bgm === 'function' ? G.map.bgm() : G.map.bgm);
  await fadeIn(800);
}
function lvUp(id, lv) { const m = G.mem[id]; if (m && m.lv < lv) { m.lv = lv; m.exp = expAt(lv); m.hp = mhp(m); m.ki = mki(m); } }
async function choice(text, std, opts, who = 'genta') { return pickOne(who, text, std, opts); }

const STORY = {
  talk(id, n) {
    const t = TALKS[id]; if (!t) return N('……。');
    const keys = Object.keys(t).map(Number).filter(k => k <= G.chapter).sort((a, b) => b - a);
    const line = t[keys.length ? keys[0] : Object.keys(t)[0]];
    return S(line[2] || (n && n.spr) || null, line[0], line[1]);
  },
  async inn() { await S('innkeeper', 'お泊まりですか？ 20文です。\nお連れさまを お預かりすることもできますよ。'); await lodge('innkeeper', 20); },
  async hyugaTip() {
    if (F('tipHyuga')) return; flag('tipHyuga');
    await Q(['【日向の国】町の目印に入ると、延岡・高千穂・美々津・椎葉・宮崎・都城・飫肥・鵜戸神宮へ行ける。\n野山には 山賊や海賊が出る（町の中では 敵は出ない）。',
      '【寄り道】各地には、旅の仲間になってくれる人がいる。\n仲間は 宿で 入れ替えられる。']);
  },
  async shrine(id) {
    const name = { iwato: '天岩戸神社', jingu: '宮崎神宮', udo: '鵜戸神宮', shiiba: '十根川神社' }[id] || '神社';
    await S('kannushi', `${name}へ ようこそ。\nおみくじを 引いていきますか？（10文）`);
    if (!await ask(null, 'おみくじを引きますか？（10文）')) return;
    if (G.money < 10) { await N('お金が足りない。'); return; }
    G.money -= 10; SFX.play('bell');
    const k = Math.random(), res = k < .15 ? '大吉' : k < .5 ? '吉' : k < .8 ? '中吉' : k < .95 ? '末吉' : '凶';
    await N(`おみくじを引いた……　「${res}」！`);
    if (!F('charm_' + id)) { flag('charm_' + id); await S('kannushi', '初めての参拝の 記念に、これを差し上げましょう。'); await give(id === 'udo' ? 'goishi' : 'hyuganatsu'); return; }
    if (res === '大吉') await give('jidori', 2); else if (res === '吉' || res === '中吉') await give('shiitake');
  },
  async undama() {
    await N('海に突き出た亀石。背中のくぼみに「運玉」が入ると、願いがかなうという。');
    if (!await ask(null, '運玉を投げますか？（5文で5個）')) return;
    if (G.money < 5) { await N('お金が足りない。'); return; }
    G.money -= 5; let hit = 0;
    for (let i = 0; i < 5; i++) { SFX.play('miss'); await sleep(250); if (Math.random() < .25) { hit++; SFX.play('coin'); } }
    await N(hit ? `${hit}個 入った！ 願いが かなうかもしれない。` : '……ひとつも入らなかった。');
    if (hit && !F('undama')) { flag('undama'); await give('udo'); if (G.party.includes('kiku')) { await S('kiku', '源太、なにを お願いしたと？', '源太、なにを お願いしたの？'); const c = await choice(null, null, ['……日向が 元気になるように', '……お菊が ずっと笑っちょるように']); if (c === 1) { addPt('kizuna'); await S('kiku', '……ばか。', '……ばか。'); } else { addPt('umi'); await S('kiku', '源太らしいね。', '源太らしいね。'); } } }
  },

  // ================= 序章　可愛岳の夜 =================
  async opening() {
    bgm(null);
    await card('序章　可愛岳の夜', '明治十年（1877年）八月\n日向国　延岡・長井村', 5000);
    await still(['明治十年。鹿児島の士族が 西郷隆盛を担いで兵を挙げた。\n――西南戦争である。', '熊本、田原坂、人吉……。\n負けを重ねた薩軍は、日向の国を北へ追われた。', 'そして八月。延岡の北の小さな村・長井村に、\n西郷と三千あまりの兵が 逃れてきた。'], 'hyuga');
    const home = G.map.houses.find(h => h.name.startsWith('甲斐家'));
    bgm('town'); await enterHouse(home);
    await Q([
      ['jiji', '源太、起きたか。\n村は 薩摩の兵で いっぱいじゃ。', '源太、起きたか。\n村は 薩摩の兵で いっぱいだ。'],
      ['jiji', 'お菊の家（医者）に、怪我人が 運び込まれちょる。\n手伝いに行ってやらんね。', 'お菊の家（医者）に、怪我人が 運び込まれている。\n手伝いに行ってあげなさい。'],
      ['jiji', 'アカも 連れていけ。\n……戦の匂いに、おびえちょるけん。', 'アカも 連れていけ。\n……戦の匂いに、おびえているから。'],
    ]);
    SFX.play('bark'); await join('aka', 1);
    await Q(['【操作】移動：十字キー／スティック　決定・話す：A\n走る：Bを押しながら移動　メニュー：メニューボタン', '【ヒント】戸（のれんのある戸）からは中に入れる。\n甕（かめ）や葛籠（つづら）には、道具が入っていることがある。']);
    flag('opened');
  },
  async jiji() {
    if (G.chapter === 0 && !F('kiku')) { await S('jiji', 'お菊の家は、すぐ東じゃ。', 'お菊の家は、すぐ東だ。'); return; }
    if (G.chapter === 1 && !F('naitoMet')) { await S('jiji', '延岡の 内藤のお殿さまに、村のことを 伝えてくれんね。\n村の東の橋を渡れば、野山に出らるっど。', '延岡の 内藤のお殿さまに、村のことを 伝えてくれないか。\n村の東の橋を渡れば、野山に出られるよ。'); }
    else await STORY.talk('jijiLine', { spr: 'jiji' });
    await S('jiji', '休んでいくね？', '休んでいくか？'); await lodge('jiji', 0);
  },
  async kiku0() {
    await Q([
      ['kiku', '源太！ ちょうどよかった。\n薩摩の兵隊さんが、てげ たくさん 怪我しちょると。', '源太！ ちょうどよかった。\n薩摩の兵隊さんが、とても たくさん 怪我しているの。'],
      ['kiku', '父さんは 手が離せんけん、\nうちが 宿陣（児玉さんの家）へ 薬を届けに行くと。', '父さんは 手が離せないから、\n私が 宿陣（児玉さんの家）へ 薬を届けに行くの。'],
    ]);
    const c = await choice(null, null, ['一緒に行くっちゃ', '……戦の兵なんか、ほっとけ']);
    if (c === 0) { addPt('kizuna'); await S('kiku', 'ありがと、源太！', 'ありがとう、源太！'); }
    else await S('kiku', '怪我人に、敵も味方もないっちゃ！\n……ほら、行くよ！', '怪我人に、敵も味方もないよ！\n……ほら、行くよ！');
    await join('kiku', 1);
    await N('【目的】村の北東、児玉家（西郷の宿陣）へ。');
  },
  async kikuHome() { await S('kiku', '源太。うちも 連れて行って。\n父さんの代わりに、うちが 手当てするけん。', '源太。私も 連れて行って。\n父さんの代わりに、私が 手当てするから。'); await join('kiku', Math.max(1, partyLv())); },
  async saigo0() {
    if (!F('kiku')) { await S('satsuhei', '……ここは 西郷先生の宿陣じゃ。子どもは帰れ。', '……ここは 西郷先生の宿陣だ。子どもは帰れ。'); return; }
    if (F('kaisan')) { await S('saigo', '源太どん、頼んだど。\n村の西の道から、可愛岳へ。', '源太さん、頼んだぞ。\n村の西の道から、可愛岳へ。'); return; }
    if (!F('wadagoe')) return STORY.wadagoe();
  },
  async ogura0() {
    await Q([['ogura', '……飫肥の小倉処平だ。足を撃たれてな。\nお嬢さん、手当てを ありがとう。'], ['ogura', '少年。戦は もうすぐ終わる。\n終わったあとの日向を 作るのは、お前たちだ。']]);
    meet('ogura');
  },
  async shinpachi0() {
    await Q([['shinpachi', 'おはんが 村の猟師の子か。\nおいは 日高新八。鹿児島の加治屋町の者じゃ。', 'あなたが 村の猟師の子か。\n私は 日高新八。鹿児島の加治屋町の者だ。'], ['shinpachi', '……ここまで 長か道のりじゃった。', '……ここまで 長い道のりだった。']]);
    meet('shinpachi');
  },
  async wadagoe() {
    await Q([
      '奥の座敷に、大きな体の男が 座っていた。',
      ['saigo', '……村の衆には、迷惑を かけもした。', '……村の人たちには、迷惑を かけました。'],
      ['kiku', 'に、西郷さま……！ 薬を 持ってきました。', 'さ、西郷さま……！ 薬を 持ってきました。'],
      ['saigo', 'あいがとさげもす。……おはんは 猟師の子か。\nよか目を しちょる。', 'ありがとう。……あなたは 猟師の子か。\nいい目を している。'],
    ]);
    meet('saigo');
    SFX.play('drum'); shake();
    await Q([['satsuhei', '伝令！ 政府軍が 延岡から 和田越へ 押し寄せちょります！', '伝令！ 政府軍が 延岡から 和田越へ 押し寄せています！'], ['saigo', '……おいが 出っど。', '……私が 出る。'], ['shinpachi', '先生！ 先生が 自ら……!?', '先生！ 先生が 自ら……!?'], ['saigo', '最後の戦じゃ。おいが 見届けんで どげんすっか。', '最後の戦だ。私が 見届けなくて どうする。']]);
    await join('shinpachi', 12, true); await join('ogura', 10, true);
    await N('新八と 小倉処平が、一時 一行に加わった！');
    await interlude('延岡・政府軍の本営にて', async () => {
      await Q([['yamagata', '西郷は 長井村に追い込んだ。\n北は可愛岳、まわりは すべて我が軍だ。'], ['yamagata', '……五万の兵で囲んでいる。もう、逃げ道はない。'], ['yamagata', 'だが、西郷という男は……何をするか 分からん。\n山にも、見張りを 怠るな。']]);
      meet('yamagata');
    });
    await kassen({
      title: '和田越の戦い', bg: 'hfield', goal: 'survive', turns: 5, themUnit: 'govsoldier', usUnit: 'satsumasoldier', usFx: 'gun', attackName: '撃ちかける',
      us: { name: '薩軍', troops: 3500, power: 60, leader: '西郷' }, them: { name: '政府軍', troops: 30000, power: 120 }, themAttack: '政府軍の 大砲と銃が 火を噴く！', moraleDiv: 18,
      intro: '八月十五日。和田越の丘で、西郷が 自ら指揮をとった――', rally: '西郷「退くな！ もうひと踏ん張りじゃ！」',
      tactics: [{ id: 'hill', name: '丘の上に 陣を敷く', desc: '高いところから撃ちおろす。2刻のあいだ 敵の狙いが鈍る', msg: '西郷「丘を とれ！」\n薩軍が 和田越の丘に 陣取った！', storm: 2 }, { id: 'guide', name: '源太の抜け道', desc: '猟師の道から 敵の横を突く', msg: '源太「こっちっちゃ！ この谷を抜ければ 横に出らるっ！」\n薩軍の一隊が 政府軍の横腹を突いた！', troops: 2000, morale: 20 }],
    });
    flag('wadagoe'); chron('wadagoe'); visit('wadagoe');
    await Q(['薩軍は 和田越で敗れ、長井村へ 押し戻された。', ['shinpachi', '……囲まれた。もう、どこにも 抜け道がなか。', '……囲まれた。もう、どこにも 抜け道がない。']]);
    await battle(['hohei', 'keisatsu', 'hohei'], { bg: 'hfield', noRun: true, boss: true, L: 4, intro: '村へ退く道を、政府軍が ふさいでいる！' });
    await STORY.kaisan();
  },
  async kaisan() {
    await fadeOut(800); bgm('sad'); G.night = true;
    await still(['八月十六日。', '西郷は 軍の解散を告げた。\n「降る者は降り、死ぬ者は死ね。士の 欲するままに 任せよ」', 'そして 陸軍大将の軍服と、たくさんの書類を 庭で焼いた。', '炎が 夜空に 舞い上がった。'], 'night');
    flag('kaisan'); chron('kaisan'); refreshMap(); Audio8.cur = null; bgm('night');
    await fadeIn(800);
    await Q([
      ['saigo', '……おいは、鹿児島へ 帰る。', '……私は、鹿児島へ 帰る。'],
      ['shinpachi', 'じゃっどん先生、まわりは 政府軍だらけです。\n北の可愛岳は、崖ばかりで 道も なか……', 'でも先生、まわりは 政府軍だらけです。\n北の可愛岳は、崖ばかりで 道も ない……'],
      ['genta', '……道なら あるっちゃ。', '……道なら あります。'],
      ['genta', 'じいちゃんと 猪を追う、猟師の道が あります。\n夜でも、おれなら 迷わん。', 'じいちゃんと 猪を追う、猟師の道が あります。\n夜でも、おれなら 迷わない。'],
      ['kiku', '源太……！', '源太……！'],
    ]);
    const c = await choice('おれが 案内します。', 'おれが 案内します。', ['この国の山を、おれが 一番 知っちょる', '……戦は 早う 終わってほしいけん']);
    if (c === 0) addPt('yama'); else addPt('umi');
    await Q([['saigo', '……おはんの命を、預かってよかか。', '……あなたの命を、預かっていいか。'], ['saigo', '頼んだど、源太どん。', '頼んだぞ、源太さん。']]);
    // 小倉処平との別れ
    await Q([['ogura', '……わたしは この足では、山は越えられん。'], ['ogura', '源太。これを 持っていけ。わたしの扇だ。'], ['ogura', '飫肥の家に、わたしの品を届けてほしい。\nそれから――'], ['ogura', '学べ。日向の若い者が 学ばねば、\nこの国は いつまでも 誰かの言いなりだ。']]);
    await give('oguraf'); await give('ogurapack');
    flag('oguraBye'); await leave('ogura', '小倉処平は 村に残った。');
    await N('【目的】夜のうちに、村の西から 可愛岳を越えよう。\n（村の西の端の兵に 話しかけると出発）');
  },
  async toEnodake() { await S('satsuhei', '先生たちは 先に登られた。\n案内を 頼む！', '先生たちは 先に登られた。\n案内を 頼む！'); await warpTo('enodake', 13, 28, 3); },
  async toppa() {
    await Q(['山頂の先に、政府軍の陣の かがり火が 揺れている。', ['shinpachi', '源太、ここまで ようやった。\nあとは おいたちの仕事じゃ。', '源太、ここまで よくやった。\nあとは 私たちの仕事だ。'], ['kirino', '突っ込むぞ！ 夜明け前に 抜けるんじゃ！'], ['genta', 'おれも 行くっちゃ！', 'おれも 行く！']]);
    meet('kirino');
    await battle(['hohei', 'hoijin', 'hohei'], { bg: 'night', noRun: true, boss: true, L: 5 });
    flag('toppa'); chron('toppa'); visit('enodake');
    await fadeOut(800); bgm('title');
    await still(['八月十七日の夜。山を登りつづけ、十八日の夜明け前――', '薩軍は 可愛岳の上から 政府軍の陣に 斬りこみ、\n包囲を 破った。', '政府軍は、まさか あの崖を越えてくるとは 思っていなかった。'], 'night');
    await fadeIn(800);
    await Q([
      ['saigo', '源太どん。おはんのおかげで、鹿児島へ 帰れもす。', '源太さん。あなたのおかげで、鹿児島へ 帰れます。'],
      ['saigo', 'こいからの日向は、おはんらが 作っとじゃ。\n――天を敬い、人を愛せよ。', 'これからの日向は、あなたたちが 作るのだ。\n――天を敬い、人を愛しなさい。'],
      ['shinpachi', '源太。……生きろよ。', '源太。……生きろよ。'],
    ]);
    await leave('shinpachi', '新八は 西郷たちと 山の向こうへ 消えていった。');
    await fadeOut(800); bgm('sad');
    await still(['源太たちが 村へ戻ると――', '長井村に残った小倉処平は、\n自ら 命を絶っていた。', '三十一歳だった。'], 'night');
    chron('ogura');
    await Q([['kiku', '……小倉さま、最後まで「学べ」っち 言いよったと。', '……小倉さま、最後まで「学べ」って 言っていたの。'], ['genta', '……おれ、飫肥に 届けに行く。\nいつか 必ず。', '……おれ、飫肥に 届けに行く。\nいつか 必ず。']]);
    await STORY.ch1Start();
  },

  // ================= 第一章　残り火 =================
  async ch1Start() {
    await startChapter(1, '第一章　残り火', '明治十年（1877年）九月\n延岡・長井村', 'nagai', 4, 8, ['西郷たちは 山の中を 鹿児島へ向かった。', '戦は 日向から 去った。\nだが、焼けた家と、散り散りになった兵が 残された。']);
    for (const id of G.party) lvUp(id, 7);
    await Q([['jiji', '源太。延岡の内藤のお殿さまが、\n村々の困りごとを 聞いてくださるそうじゃ。', '源太。延岡の内藤のお殿さまが、\n村々の困りごとを 聞いてくださるそうだ。'], '【目的】村の東の橋を渡って 野山へ。南東の延岡へ向かおう。']);
    save(); toast('自動で記録しました');
  },
  async naito() {
    if (G.chapter === 1 && !F('naitoMet')) {
      flag('naitoMet'); meet('naito');
      await Q([
        ['naito', 'よく来てくれた。延岡の内藤政挙だ。\n長井村の者か。……大変な目に 遭わせたな。'],
        ['naito', '戦は 終わりかけている。だが、高千穂の山に\n薩軍から はぐれた者たちが 立てこもり、村を襲っている。'],
        ['naito', '彼らは まだ 戦が終わったと 思っていないのだ。\n……誰かが、伝えねばならぬ。'],
      ]);
      const c = await choice(null, null, ['おれが 行きます', '政府軍に 任せれば よかっちゃないですか']);
      if (c === 1) { addPt('umi'); await S('naito', '政府軍が行けば、また 血が流れる。\n同じ日向の山を知る者に、行ってほしいのだ。'); } else addPt('yama');
      flag('ochiQuest');
      await N('【目的】北西の高千穂へ。天岩戸の奥に、落ち武者たちがいる。');
      return;
    }
    if (G.chapter === 2 && !F('naito2')) {
      flag('naito2'); chron('ryotensha');
      await Q([['naito', '源太、立派になったな。\nわたしは 亮天社という学校を開いた。若い者が 学ぶ場だ。'], ['naito', '……日向は 今、鹿児島県の一部だ。\n戦のあと、県のお金は 鹿児島の立て直しに使われ、\n日向の道も学校も 後回しにされている。'], ['naito', '宮崎に、川越進という男がいる。\n日向を ふたたび 一つの県にしようと 声を上げている。\n会ってみなさい。']]);
      await N('【目的】日向の国の南、宮崎へ。川越進に会おう。');
      return;
    }
    await STORY.talk('naitoLine', { spr: 'naito' });
  },
  async osuzu() {
    await Q([['osuzu', '旅の人？ うちは 鈴。夜神楽を 舞いよると。', '旅の人？ 私は 鈴。夜神楽を 舞っているの。'], ['osuzu', '天岩戸の奥に 怖い人たちが おるけん、\n神楽の道具を 取りに行けんとよ。', '天岩戸の奥に 怖い人たちが いるから、\n神楽の道具を 取りに行けないの。']]);
    if (F('ochiDone')) { await S('osuzu', '……もう 退治してくれたと!?\nお礼に、うちも 旅について行く！ 舞いで 力になるけん。', '……もう 退治してくれたの!?\nお礼に、私も 旅について行く！ 舞いで 力になるから。'); await join('osuzu', Math.max(1, partyLv())); return; }
    const c = await choice(null, null, ['一緒に 行こう', '危ないけん、ここで待っちょって']);
    if (c === 1) { await S('osuzu', '……うん。気をつけてね。', '……うん。気をつけてね。'); return; }
    await S('osuzu', 'うん！ 神楽の舞いは、戦うときにも 役に立つとよ。', 'うん！ 神楽の舞いは、戦うときにも 役に立つのよ。');
    await join('osuzu', Math.max(1, partyLv()));
  },
  async ochiBoss() {
    await Q([['ochiB', '……日向の子どもか。ここは 薩軍の陣じゃ。\n西郷先生が 戻られるまで、おいたちは 退かん！', '……日向の子どもか。ここは 薩軍の陣だ。\n西郷先生が 戻られるまで、私たちは 退かない！'], ['genta', '……村の米を 奪って、なにが 陣じゃ！', '……村の米を 奪って、なにが 陣だ！']]);
    await battle(['ochimusha', 'ochiB', 'ochimusha'], { bg: 'mountain', noRun: true, boss: true, L: fieldL() });
    flag('ochiDone'); visit('takachiho');
    bgm('sad');
    await Q([
      ['ochiB', '……つ、強かな。', '……つ、強いな。'],
      ['genta', '西郷さまは、可愛岳で 言いよった。\n「天を敬い、人を愛せよ」っち。', '西郷さまは、可愛岳で 言っていた。\n「天を敬い、人を愛せよ」と。'],
      ['ochiB', '……先生に、会うたとか。', '……先生に、会ったのか。'],
    ]);
    await fadeOut(800);
    await still(['そのとき、山を越えて 知らせが届いた。', '明治十年九月二十四日。\n鹿児島の城山で、西郷隆盛が 亡くなった。', '西南戦争は、終わった。'], 'night');
    chron('shiroyama');
    await fadeIn(800);
    await Q([['ochiB', '…………先生。', '…………先生。'], ['ochiB', '刀を 置く。村の衆には、詫びて回る。\n……日向の子、すまんかった。', '刀を 置く。村の人たちには、詫びて回る。\n……日向の子、すまなかった。'], ['kiku', '源太……。', '源太……。']]);
    const c = await choice('……。', '……。', ['（空を見上げる）', '（お菊の手を握る）']);
    if (c === 1) addPt('kizuna'); else addPt('yama');
    await STORY.ch2Start();
  },

  // ================= 第二章　日向は鹿児島県 =================
  async ch2Start() {
    await startChapter(2, '第二章　日向は鹿児島県', '明治十三年（1880年）春\n延岡', 'nobeoka', 15, 19, ['それから 三年。源太は 十八になった。', '日向は 明治九年から、鹿児島県の一部になっていた。\n戦のあと、県のお金の多くは 鹿児島の立て直しに 使われた。', '日向の人々の中に、ある声が 生まれはじめていた。\n――日向は、日向の県を 持つべきではないか。']);
    chron('merge');
    for (const id of G.party) lvUp(id, 13);
    await Q([['kiku', '源太、内藤さまが 呼びよったよ。\nうちは 延岡で、医者の勉強をしよると。', '源太、内藤さまが 呼んでいたよ。\n私は 延岡で、医者の勉強をしているの。'], '【目的】延岡の内藤家へ。']);
    save(); toast('自動で記録しました');
  },
  signCount() { return ['sign_mimitsu', 'sign_miyakonojo', 'sign_obi'].filter(F).length; },
  async kawagoe() {
    if (F('kawagoe')) return;
    meet('kawagoe');
    await Q([
      ['kawagoe', '延岡の内藤さまの紹介か。清武の 川越進じゃ。', '延岡の内藤さまの紹介か。清武の 川越進だ。'],
      ['kawagoe', '鹿児島県の県会で、日向の議員は ほんの一握り。\n何を訴えても、多数決で 負けてしまう。', '鹿児島県の県会で、日向の議員は ほんの一握り。\n何を訴えても、多数決で 負けてしまう。'],
      ['kawagoe', 'じゃから、日向じゅうの声を 集めたい。\n「日向に 県を置いてほしい」という 署名をな。', 'だから、日向じゅうの声を 集めたい。\n「日向に 県を置いてほしい」という 署名をな。'],
      ['kawagoe', '美々津、都城、飫肥。\nこの三つの町の 有力者を 説いて回ってくれんか。わしも 行く。', '美々津、都城、飫肥。\nこの三つの町の 有力者を 説いて回ってくれないか。私も 行く。'],
    ]);
    await join('kawagoe', partyLv() + 1); chron('bunken');
    await N('【目的】美々津（北の港）・都城（南西）・飫肥（南）で、\n分県の署名を集めよう。');
  },
  async kawagoeBack() {
    flag('kenpakuDone');
    await Q([['kawagoe', '美々津、都城、飫肥……。\nこれで 日向じゅうの声が そろった！', '美々津、都城、飫肥……。\nこれで 日向じゅうの声が そろった！'], ['kawagoe', '建白書に まとめて、鹿児島の県会に 出す。\n源太、これは おまえが 持っちょってくれ。', '建白書に まとめて、鹿児島の県会に 出す。\n源太、これは お前が 持っていてくれ。']]);
    await give('kenpaku');
    await STORY.ch3Start();
  },
  async mimitsuBoss() {
    if (F('sign_mimitsu')) { await S('merchant', '美々津の港は、分県に 賛成じゃ。', '美々津の港は、分県に 賛成だ。'); return; }
    if (!F('kawagoe')) { await S('merchant', '回船問屋でございます。'); return; }
    if (!F('taifuDone')) {
      await Q([['merchant', '分県の署名？ ……それどころじゃなか。\n大きな台風が 近づいちょる。船を守らんと。', '分県の署名？ ……それどころじゃない。\n大きな台風が 近づいている。船を守らないと。'], ['merchant', '浜にいる 辰五郎に 手を貸してやってくれ。\n話は そのあとじゃ。', '浜にいる 辰五郎に 手を貸してやってくれ。\n話は そのあとだ。']]);
      flag('taifuQ'); refreshMap(); Audio8.cur = null; bgm('war'); setWeather('rain');
      await N('【目的】桟橋へ。台風から 船を守れ！'); return;
    }
    flag('sign_mimitsu'); visit('mimitsu'); SFX.play('item');
    await Q([['merchant', '船は 一艘も 沈まんかった。恩に着るぞ。\n美々津の港の者は、みな 署名する！', '船は 一艘も 沈まなかった。恩に着るぞ。\n美々津の港の者は、みな 署名する！'], '美々津の署名を 手に入れた！']);
  },
  async tatsu() {
    await Q([['tatsu', 'おう、旅の衆！ 美々津の船頭、辰五郎じゃ。\nここは 神武さまが 船出しなさった港っちゃ。', 'おう、旅の人たち！ 美々津の船頭、辰五郎だ。\nここは 神武天皇が 船出なさった港だよ。']]);
    if (F('taifuDone')) { await S('tatsu', '台風のときは 世話になった。\nおれも 一緒に 行かせてくれ！ 海のことなら 任せちょけ。', '台風のときは 世話になった。\nおれも 一緒に 行かせてくれ！ 海のことなら 任せておけ。'); await join('tatsu', Math.max(1, partyLv())); return; }
    await S('tatsu', '……空の色が おかしい。でかい嵐が 来るかもしれん。', '……空の色が おかしい。大きな嵐が 来るかもしれない。');
  },
  async taifuBoss() {
    await Q([['tatsu', '来たぞ！ 船を 浜に 引き上げるんじゃ！\n手を貸せ！', '来たぞ！ 船を 浜に 引き上げるんだ！\n手を貸せ！']]);
    await battle(['taifu'], { bg: 'storm', noRun: true, boss: true, L: fieldL(), intro: '日向灘から、台風が 襲いかかってきた！' });
    flag('taifuDone'); refreshMap(); setWeather(null); Audio8.cur = null; bgm('town');
    await Q(['嵐は 過ぎ去った。船は 一艘も 流されなかった。', ['tatsu', 'やった……！ 恩に着る！\nおれも おまえたちの旅に 加わらせてくれ！', 'やった……！ 恩に着る！\nおれも お前たちの旅に 加わらせてくれ！']]);
    await join('tatsu', Math.max(1, partyLv()));
    await N('【目的】回船問屋の主人に 話をしよう。');
  },
  async hantai() {
    if (!F('kawagoe')) { await S('hantaiB', '……何の用じゃ。', '……何の用だ。'); return; }
    await Q([
      ['hantaiB', '分県じゃと？ 都城は 島津の殿さまの 発祥の地じゃ。\n三百年、鹿児島と 共に 生きてきた。', '分県だと？ 都城は 島津の殿さまの 発祥の地だ。\n三百年、鹿児島と 共に 生きてきた。'],
      ['kawagoe', 'それは わかっちょる。じゃが、都城の子どもも\n日向の学校で 学ぶべきじゃ。', 'それは わかっている。だが、都城の子どもも\n日向の学校で 学ぶべきだ。'],
      ['hantaiB', '口では 何とでも言える。\n……ならば、論で 勝ってみせい！', '口では 何とでも言える。\n……ならば、議論で 勝ってみせろ！'],
    ]);
    await battle(['hantai', 'hantaiB', 'hantai'], { bg: 'interior', noRun: true, boss: true, L: fieldL(), intro: '論戦が 始まった！' });
    flag('sign_miyakonojo'); visit('miyakonojo');
    await Q([['hantaiB', '……まいった。おはんらの言う日向の行く末、\nわしらも 見てみたくなった。', '……まいった。君たちの言う日向の行く末、\n私たちも 見てみたくなった。'], ['hantaiB', '都城の郷士の半分は、署名しよう。\n残りの者は……時間をかけて 話すがよい。', '都城の郷士の半分は、署名しよう。\n残りの者は……時間をかけて 話すがいい。'], '都城の署名を 手に入れた！']);
  },
  async heizo() {
    await Q([['heizo', '都城大弓の 弓師、平蔵じゃ。\n竹を選び、膠で貼り、何年もかけて 一張の弓を作る。', '都城大弓の 弓師、平蔵だ。\n竹を選び、膠で貼り、何年もかけて 一張の弓を作る。']]);
    const c = await choice('……あの的、射てみるか？', '……あの的、射てみるか？', ['射ってみる', 'やめておく']);
    if (c === 1) return;
    const sc = await tachiki(3);
    if (sc >= 2) { await S('heizo', 'ほう……筋がよか。おもしろか若者じゃ。\nわしも 旅に ついて行こう。弓は 遠くから仲間を守れる。', 'ほう……筋がいい。おもしろい若者だ。\n私も 旅に ついて行こう。弓は 遠くから仲間を守れる。'); await join('heizo', Math.max(1, partyLv())); }
    else await S('heizo', 'まだまだじゃな。また 来い。', 'まだまだだな。また 来い。');
  },
  async oguraHome() {
    if (!hasItem('ogurapack')) { await S('woman', '小倉家でございます。'); return; }
    await Q([['woman', '……処平の 品を、届けてくださったのですか。'], '源太は、長井村での 小倉処平の最後を 話した。', ['woman', '……あの子は、最後まで 「学べ」と 言っていましたか。\nあの子らしい……。'], ['woman', '飫肥の者は みな、処平の願いを 知っています。\n日向の子が 学べる国を――。署名は、飫肥の皆で いたします。']]);
    addItem('ogurapack', -1); flag('sign_obi'); visit('obi');
    if (G.chapter === 2) await N('飫肥の署名を 手に入れた！');
    await S('woman', '飫肥の小村寿太郎という若者も、今は 東京で 働いています。\n処平が 見出した子です。いつか 会うことも あるでしょう。');
  },
  async yashichi() {
    await Q([['yashichi', '……椎葉の狩人、弥七じゃ。', '……椎葉の狩人、弥七だ。'], ['yashichi', '近ごろ、夜になると 山の上に 青白い火が出る。\n村の者は「平家の落人の亡霊」っち 怖がっちょる。', '近ごろ、夜になると 山の上に 青白い火が出る。\n村の人は「平家の落人の亡霊」と 怖がっている。']]);
    const c = await choice(null, null, ['確かめに行こう', 'また今度']);
    if (c === 1) return;
    await S('yashichi', '……おまえ、変わったやつじゃな。よか、一緒に行こう。', '……お前、変わったやつだな。いい、一緒に行こう。');
    await join('yashichi', Math.max(1, partyLv())); flag('heikeQ'); refreshMap();
    await N('【寄り道】村の北の山道へ。');
  },
  async heikeBoss() {
    await battle(['heikeB'], { bg: 'night', noRun: true, boss: true, L: fieldL() });
    flag('heikeDone'); visit('shiiba'); refreshMap();
    await Q(['青白い火は、夜明けとともに 消えていった。', ['yashichi', '……鶴富姫と 那須大八郎の話を 知っちょるか。\n平家の姫と、討ちに来た源氏の侍が、この村で 恋をした。', '……鶴富姫と 那須大八郎の話を 知っているか。\n平家の姫と、討ちに来た源氏の侍が、この村で 恋をした。'], ['yashichi', '敵どうしでも、同じ山で 生きられる。\n……日向も そうなれば よかな。', '敵どうしでも、同じ山で 生きられる。\n……日向も そうなればいいな。']]);
    await give('kiba3');
  },

  // ================= 第三章　鹿児島県会 =================
  async ch3Start() {
    await startChapter(3, '第三章　鹿児島県会', '明治十五年（1882年）\n宮崎', 'miyazaki', 15, 11, ['日向じゅうから 集めた署名は、一万を 超えた。', '川越進らは、建白書を 鹿児島県会に 出すことにした。']);
    for (const id of G.party) lvUp(id, 19);
    await Q([['kawagoe', '源太、鹿児島へ 行くぞ。\n県会で、日向の声を 正面から ぶつける。', '源太、鹿児島へ 行くぞ。\n県会で、日向の声を 正面から ぶつける。'], '【目的】日向の国の南西の端から、鹿児島へ。']);
    save(); toast('自動で記録しました');
  },
  async shinpachi3() {
    if (F('shin3')) { await S('shinpachi', '日向の声、届くとよかな。', '日向の声、届くといいな。'); return; }
    flag('shin3');
    await Q([
      ['shinpachi', '……源太？ 長井村の 源太か！\nでこう なったのう。', '……源太？ 長井村の 源太か！\n大きく なったなあ。'],
      ['genta', '新八さん……！ 生きちょったとですね！', '新八さん……！ 生きていたんですね！'],
      ['shinpachi', '……おいだけ、生き残ってしもうた。\n城山のあと、おいは 鹿児島で 子どもらに 剣を教えちょる。', '……私だけ、生き残ってしまった。\n城山のあと、私は 鹿児島で 子どもたちに 剣を教えている。'],
      ['shinpachi', '分県か。……鹿児島の者として 言えば、寂しか。\nじゃっどん、日向の者が 自分の国を 作りたかち思うのは 当たり前じゃ。', '分県か。……鹿児島の者として 言えば、寂しい。\nだが、日向の者が 自分の国を 作りたいと思うのは 当たり前だ。'],
      ['shinpachi', '先生も きっと、そう言いやっど。', '先生も きっと、そう言うだろう。'],
    ]);
  },
  async kenkaiEnter() {
    if (G.chapter !== 3 || F('kenkaiDone')) return;
    await Q(['県会議事堂。議員たちが ずらりと並んでいる。', ['kawagoe', '日向の民 一万あまりの声を 持ってまいった！\n日向に、ふたたび 県を置かれたい！', '日向の民 一万あまりの声を 持ってきた！\n日向に、ふたたび 県を置いてほしい！'], ['official', '……予算は どうする。\n分ければ、鹿児島も 日向も 弱くなるだけだ。']]);
    await battle(['giin', 'kenkai', 'giin'], { bg: 'interior', noRun: true, boss: true, intro: '論戦が 始まった！ 相手は 県会の多数決！' });
    flag('kenkaiDone');
    await Q(['議場は 静まりかえった。', ['official', '……日向の議員の言い分は、筋が通っている。\nだが、県を置くかどうかを 決めるのは、県会ではない。'], ['official', '東京の 内務省だ。'], ['kawagoe', '……ならば、東京へ 行くまでじゃ！', '……ならば、東京へ 行くまでだ！']]);
    await STORY.ch4Start();
  },

  // ================= 第四章　東京へ =================
  async ch4Start() {
    await startChapter(4, '第四章　東京へ', '明治十六年（1883年）春\n東京', 'tokyo', 15, 11, ['川越進と源太たちは、船で 東京へ 渡った。', '内務卿は、長州出身の 山田顕義。\n西南戦争では、政府軍の旅団を 率いた男である。']);
    for (const id of G.party) lvUp(id, 26);
    await Q([['kawagoe', '内務省へ 行く前に、司法省に 寄りたい。\n飫肥の出の 小村という男が おる。', '内務省へ 行く前に、司法省に 寄りたい。\n飫肥の出の 小村という男が いる。'], '【目的】北東の司法省で 小村寿太郎に会おう。']);
    save(); toast('自動で記録しました');
  },
  async komura() {
    meet('komura');
    await Q([
      ['komura', '日向の分県のことは 聞いている。\n小倉先生のことも、な。'],
      ['komura', 'わたしを アメリカに送り出してくれたのは、\n小倉先生が 開いてくれた道だった。'],
      ['genta', '小倉さまは、最後に「学べ」っち 言いよりました。', '小倉さまは、最後に「学べ」と 言っていました。'],
      ['komura', '……そうか。ならば、わたしも 力を貸そう。\n内務卿の山田さんは 法律に明るい人だ。理と 数字で 攻めることだ。'],
    ]);
    await join('komura', partyLv() + 1);
    await N('【目的】北西の内務省で、内務卿・山田顕義に 分県を訴えよう。');
  },
  async naimushoEnter() {
    if (G.chapter !== 4 || F('saichi')) return;
    if (!F('komura')) { await S('official', '内務卿は お忙しい。……紹介状は お持ちか？'); return; }
    await Q(['内務省の奥の部屋。小柄な男が、机の向こうから こちらを見た。', ['yamagata2', '……日向の者か。山県さんから、延岡で 西郷を逃がした山の子が おったと聞いたが。'], ['genta', '……おれです。', '……おれです。'], ['yamagata2', 'ふむ。……県を置くには 役所も 役人も いる。\nその金を、日向は 払えるのか。']]);
    meet('yamagata2');
    await battle(['shorui', 'yamagata2', 'kanryo'], { bg: 'interior', noRun: true, boss: true, intro: '論戦が 始まった！ 相手は 内務卿・山田顕義！' });
    await Q(['山田は 長いあいだ、黙って 建白書を 読んでいた。', ['yamagata2', '……一万の署名か。'], ['yamagata2', '日向の民が これほど 望むなら、それも 国のためだろう。\n――よかろう。'], '明治十六年五月九日。\n宮崎県が、ふたたび 置かれた。']);
    flag('saichi'); chron('saichi'); visit('naimusho');
    await STORY.ch5Start();
  },

  // ================= 終章　日向の夜明け =================
  async ch5Start() {
    await startChapter(5, '終章　日向の夜明け', '明治十六年（1883年）\n宮崎', 'miyazaki', 15, 11, ['宮崎の町に、新しい県庁が 置かれた。', '日向の人々は、通りに出て 祝った。']);
    await Q([['kawagoe', '源太、ようやった。\n……お菊さんが、神宮の前で 待っちょったぞ。', '源太、よくやった。\n……お菊さんが、神宮の前で 待っていたぞ。'], '【目的】町の真ん中にいる お菊に会おう。']);
    if (!G.party.includes('kiku') && G.mem.kiku) { G.waiting = G.waiting.filter(p => p !== 'kiku'); }
    save(); toast('自動で記録しました');
  },
  async finale() {
    bgm('ending');
    await Q([['kiku', '源太。……宮崎県、できたね。', '源太。……宮崎県、できたね。'], ['kiku', '可愛岳の夜から、六年。\n長かったね。', '可愛岳の夜から、六年。\n長かったね。'], ['kiku', '源太は これから、どうすると？', '源太は これから、どうするの？']]);
    const opts = [{ label: '宮崎で、お菊と 新しい県を 作っていく', end: 'm1', disabled: pts('kizuna') < 2 }, { label: '小村さんのように、海の向こうで 学ぶ', end: 'm2' }, { label: '長井村へ帰って、子どもらに 山を教える', end: 'm3' }];
    if (pts('kizuna') < 2) opts[0].label += '（お菊との絆が足りない）';
    const i = await choice(null, null, opts);
    await STORY.ending(opts[i].end);
  },
  async ending(id) {
    G.dex.end[id] = 1; flag('cleared'); seriesUpdate();
    await fadeOut(1000); bgm('ending');
    const L = {
      m1: ['源太は 宮崎に残り、新しい県の 道や学校づくりに 走り回った。', 'お菊は 宮崎で 最初の 女の医者の一人になった。', '二人の家の前には、日向夏の木が 植えられた。'],
      m2: ['源太は 小村寿太郎を頼って、海の向こうへ 学びに出た。', '異国の町で、源太は いつも 日向の空を 思い出した。', '「学べ」――あの夜の言葉を 胸に。'],
      m3: ['源太は 長井村へ帰り、可愛岳のふもとで 子どもたちに 山の歩き方と、読み書きを教えた。', 'アカの子どもたちが、村の子と 一緒に 野山を駆けた。', '可愛岳の夜の話は、村で 長く 語り継がれた。'],
    }[id];
    await still(L, 'hyuga');
    await card('― ' + DEX.endings.find(e => e.id === id).name + ' ―', '日向の灯　完', 6000);
    await still(['日本國物語　宮崎編「日向の灯」', '登場人物の多くは実在の人物で、出来事は史実をもとにしています。\n源太・お菊・アカ・お鈴・辰五郎・平蔵・弥七は 架空の人物です。', '遊んでくれて、ありがとう。'], 'hyuga');
    save(); location.reload();
  },
};

// ===== 目的（地図に表示） =====
function GOAL() {
  const c = G.chapter;
  const side = [[F('ochiQuest') && !F('ochiDone') && c > 1, '高千穂の天岩戸の奥の落ち武者'], [F('heikeQ') && !F('heikeDone'), '椎葉の北の山道の青白い火']].filter(x => x[0]).map(x => x[1]);
  const L = {
    0: [[!F('opened'), '家の外へ出よう'], [!F('kiku'), '東のお菊の家の前へ'], [!F('wadagoe'), '北東の児玉家（西郷の宿陣）へ'], [!F('toppa'), '村の西から、可愛岳を越えよう']],
    1: [[!F('naitoMet'), '村の東から野山へ。南東の延岡の内藤家へ'], [!F('ochiDone'), '北西の高千穂へ。天岩戸の奥（北）の落ち武者を説こう']],
    2: [[!F('naito2'), '延岡の内藤家へ'], [!F('kawagoe'), '南の宮崎で 川越進に会おう（町の南の宿）'], [STORY.signCount() < 3, `署名を集めよう（${STORY.signCount()}/3）：${[!F('sign_mimitsu') && '美々津', !F('sign_miyakonojo') && '都城', !F('sign_obi') && '飫肥（小倉家に遺品を）'].filter(Boolean).join('・')}`], [true, '宮崎の川越進に 知らせよう']],
    3: [[!F('kenkaiDone'), '日向の国の南西の端から 鹿児島へ。県会議事堂へ']],
    4: [[!F('komura'), '北東の司法省で 小村寿太郎に会おう'], [true, '北西の内務省へ']],
    5: [[true, '町の真ん中の お菊に会おう']],
  }[c] || [];
  const tail = side.length ? '\n寄り道：' + side.join('／') : '';
  for (const [cond, t] of L) if (cond) return t + tail;
  return '自由に歩いてみよう' + tail;
}

// ===== 町の人の会話（[原文, 標準語訳, 話し手]。章番号ごと） =====
const TALKS = {
  jijiLine: { 0: ['気をつけていけよ。', '気をつけていけよ。'], 1: ['戦は 終わった。……じゃが、山は 変わらん。', '戦は 終わった。……だが、山は 変わらない。'], 2: ['源太も 大人になったのう。', '源太も 大人になったなあ。'], 3: ['鹿児島か。遠かのう。', '鹿児島か。遠いなあ。'], 4: ['東京とは、たまがった。', '東京とは、驚いた。'], 5: ['宮崎県か……。長生きは するもんじゃ。', '宮崎県か……。長生きは するものだ。'] },
  naitoLine: { 1: ['高千穂の件、頼んだぞ。'], 2: ['日向の若い者が 学べば、日向は 変わる。'], 3: ['鹿児島の県会は 手ごわいぞ。'], 5: ['宮崎県、ほんとうに よかった。'] },
  kikuFather: { 0: ['怪我人が 多すぎる……。\nお菊を 頼んだぞ、源太。', '怪我人が 多すぎる……。\nお菊を 頼んだぞ、源太。', 'elder'], 1: ['お菊は 医者になりたいと 言いよる。', 'お菊は 医者になりたいと 言っている。', 'elder'] },
  nagaiW: { 0: ['西郷さまは、子どもにも 頭を下げなさる お方じゃった。', '西郷さまは、子どもにも 頭を下げなさる お方だった。'], 1: ['家は 焼けんかった。それだけで 十分よ。', '家は 焼けなかった。それだけで 十分よ。'] },
  nagaiKid: { 0: ['兵隊さん、てげ 怖い顔しちょる……。', '兵隊さん、とても 怖い顔をしている……。'], 1: ['源太にいちゃん、また 猪 獲りに行こう！'] },
  nagaiElder: { 0: ['可愛岳は 崖ばっかりじゃ。\n猟師しか 通れん道が あるっちゃけど。', '可愛岳は 崖ばかりだ。\n猟師しか 通れない道が あるけど。'], 1: ['西郷さまは、城山で 亡くなったげな……。', '西郷さまは、城山で 亡くなったそうだ……。'], 2: ['日向が 鹿児島県になってから、\n道ひとつ 直してもらえん。', '日向が 鹿児島県になってから、\n道ひとつ 直してもらえない。'] },
  satsuhei: { 0: ['腹が 減った……。日向の芋は うまかね。', '腹が 減った……。日向の芋は うまいね。'] },
  satsuhei2: { 0: ['熊本から ここまで、ずっと 負け戦じゃ。', '熊本から ここまで、ずっと 負け戦だ。'] },
  satsuhei3: { 0: ['……国に 帰りたか。', '……国に 帰りたい。'] },
  tonsho: { 1: ['政府軍の屯所だ。\n山の中の 薩軍の残党には 手を焼いている。'] },
  ryotensha: { 2: ['亮天社で 学んでいます！\n英語も 算術も 教わっています。'] },
  nobeokaSoldier: { 1: ['戦は 終わった。……おれは 東京へ 帰れるのかな。'] },
  nobeokaKid: { 1: ['政府軍の兵隊さん、飴を くれたっちゃが！'], 2: ['亮天社に 入りたかぁ！', '亮天社に 入りたい！'] },
  nobeokaElder: { 1: ['内藤のお殿さまは、町を焼かせんと 走り回りなさった。', '内藤のお殿さまは、町を焼かせまいと 走り回られた。'], 2: ['日向にも 県が あれば……。'] },
  nobeokaW: { 1: ['延岡の城の石垣は「千人殺し」っち 言うとよ。', '延岡の城の石垣は「千人殺し」と 言うのよ。'] },
  kaguraElder: { 1: ['高千穂の夜神楽は、冬の夜に 一晩じゅう 舞うとじゃ。', '高千穂の夜神楽は、冬の夜に 一晩じゅう 舞うのだ。'] },
  takachihoW: { 1: ['天岩戸の奥に、刀を持った人たちが おると……。', '天岩戸の奥に、刀を持った人たちが いるの……。'] },
  takachihoKid: { 1: ['天照大神が 岩戸に 隠れたとよ！ 知っちょる？', '天照大神が 岩戸に 隠れたんだよ！ 知ってる？'] },
  takachihoElder: { 1: ['薩軍は、高千穂を通って 鹿児島へ 向かったげな。', '薩軍は、高千穂を通って 鹿児島へ 向かったそうだ。'] },
  tatsuWife: { 2: ['うちの人は、海のことしか 頭にないとよ。', 'うちの人は、海のことしか 頭にないのよ。'] },
  mimitsuElder: { 2: ['美々津は、神武さまが 東へ 船出した港じゃ。', '美々津は、神武天皇が 東へ 船出した港だ。'] },
  mimitsuKid: { 2: ['船、かっこいいっちゃが！', '船、かっこいい！'] },
  mimitsuFisher: { 2: ['日向灘の鰹は、日本一じゃ。', '日向灘の鰹は、日本一だ。'] },
  kencho: { 2: ['ここは 鹿児島県の 宮崎出張所です。\n大事なことは みな 鹿児島で 決まります。'], 5: ['宮崎県庁へ ようこそ！ 今日から ここが 日向の県庁です。'] },
  miyazakiW: { 2: ['宮崎神宮は、神武天皇を まつっちょるとよ。', '宮崎神宮は、神武天皇を まつっているのよ。'], 5: ['今日は お祭りよ！'] },
  miyazakiKid: { 2: ['大淀川で 泳ぐと、気持ちよかっちゃが！', '大淀川で 泳ぐと、気持ちいいよ！'], 5: ['宮崎県、ばんざーい！'] },
  miyazakiElder: { 2: ['川越さんは、清武の 頑固者じゃ。\nじゃが、日向のことを 一番 考えちょる。', '川越さんは、清武の 頑固者だ。\nだが、日向のことを 一番 考えている。'], 5: ['長生きして よかった……。'] },
  goshi: { 2: ['都城は 島津のふるさとじゃ。分県なぞ……。', '都城は 島津のふるさとだ。分県など……。'], 3: ['……日向の県か。悪くないかもしれん。', '……日向の県か。悪くないかもしれない。'] },
  heizoWife: { 2: ['うちの人の弓は、何年もかけて 作るとよ。', 'うちの人の弓は、何年もかけて 作るのよ。'] },
  miyakonojoElder: { 2: ['都城大弓は、竹と はぜの木で 作るとじゃ。', '都城大弓は、竹と はぜの木で 作るのだ。'] },
  miyakonojoElder2: { 2: ['集会所の論客どのは、口が 立つぞ。', '集会所の論客どのは、口が 立つぞ。'] },
  miyakonojoKid: { 2: ['大きゅうなったら、弓の名人になるっど！', '大きくなったら、弓の名人になるぞ！'] },
  shimazuke: { 2: ['都城の島津家は、島津の本家と 同じ 古い家でございます。'] },
  shintokudo: { 2: ['振徳堂は 飫肥藩の学校です。\n小倉処平どのも 小村寿太郎どのも、ここで 学びました。'] },
  komuraMother: { 2: ['寿太郎は、小さいころから 本ばかり 読んでおりました。\n今は 東京で 働いております。'] },
  obiElder: { 2: ['飫肥杉は、まっすぐで 腐りにくい。\n船の材木に いちばんじゃ。', '飫肥杉は、まっすぐで 腐りにくい。\n船の材木に いちばんだ。'] },
  obiKid: { 2: ['飫肥天、食べたことある？ 甘いとよ！', '飫肥天、食べたことある？ 甘いんだよ！'] },
  obiStudent: { 2: ['小倉先生は、飫肥の若い者を 長崎や東京へ 学びに 送り出してくださった。'] },
  tsurutomi: { 2: ['ここは 鶴富屋敷。平家の姫・鶴富と、\n源氏の那須大八郎の 物語が 残っちょる。', 'ここは 鶴富屋敷。平家の姫・鶴富と、\n源氏の那須大八郎の 物語が 残っている。'] },
  yashichiMother: { 2: ['弥七は 山に入ると 何日も 帰ってこんとよ。', '弥七は 山に入ると 何日も 帰ってこないのよ。'] },
  shiibaKid: { 2: ['ひえつき節、歌えるよ！\n「庭の山椒の木 鳴る鈴かけて」……'] },
  udoW: { 1: ['亀石のくぼみに 運玉が入ると、願いが かなうとよ。', '亀石のくぼみに 運玉が入ると、願いが かなうのよ。'] },
  kencho2: { 3: ['鹿児島県庁です。日向の分県？ ……県会で 話しなさい。'] },
  gijido: { 3: ['ここは 鹿児島県会の議事堂です。'] },
  kagoPolice: { 3: ['鹿児島の巡査だ。\n桜島の灰が 今日も 降っておる。'] },
  kagoW: { 3: ['戦のあと、鹿児島も 苦しかとよ。', '戦のあと、鹿児島も 苦しいのよ。'] },
  naimusho: { 4: ['内務省でございます。'] },
  gyunabe: { 4: ['牛鍋は いかが？ 文明開化の味ですよ。'] },
  shinbun: { 4: ['新聞記者だ。日向の分県？ ……面白い。記事にしよう。'] },
  tokyoPolice: { 4: ['東京の巡査です。道に迷ったら 聞いてください。'] },
  tokyoKid: { 4: ['ガス灯って、夜でも 明るいんだよ！'] },
};
