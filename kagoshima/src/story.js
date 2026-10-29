'use strict';
// ===== ストーリー（序章〜第六章） =====
// Q([...]) : 会話をまとめて流す。要素は ['人物', '鹿児島弁などの原文', '標準語訳'] か、地の文の文字列。
async function Q(list) { for (const l of list) { if (typeof l === 'string') await N(l); else await S(l[0], l[1], l[2]); } }
async function interlude(title, fn) { await fadeOut(); hideDlg(); const pb = Audio8.cur; bgm('night'); await card('幕間', title, 3000); await fn(); await fadeOut(); Audio8.cur = null; if (pb) bgm(pb); await fadeIn(); }
async function startChapter(n, title, sub, mapId, x, y, lines) {
  await fadeOut(800); hideDlg(); G.chapter = n; G.night = false; G.ride = false; flag('ch' + n);
  enterMap(mapId, x, y, 0); bgm(null);
  await card(title, sub, 5000);
  if (lines && lines.length) await still(lines, 'title');
  Audio8.cur = null; bgm(typeof G.map.bgm === 'function' ? G.map.bgm() : G.map.bgm);
  await fadeIn(800);
}
function drop(id) { G.party = G.party.filter(p => p !== id); flag('in_' + id, false); rebuildChain(); }
function lvUp(id, lv) { const m = G.mem[id]; if (m && m.lv < lv) { m.lv = lv; m.exp = expAt(lv); m.hp = mhp(m); m.ki = mki(m); } }
async function choice(text, std, opts, who = 'shinpachi') { return pickOne(who === null ? null : who, text, std, opts); }

const STORY = {
  // ---------- 町の人の会話（章ごとに変わる） ----------
  talk(id, n) {
    const t = TALKS[id]; if (!t) return N('……。');
    const keys = Object.keys(t).map(Number).filter(k => k <= G.chapter).sort((a, b) => b - a);
    const line = t[keys.length ? keys[0] : Object.keys(t)[0]];
    return S(line[2] || (n && n.spr) || null, line[0], line[1]);
  },
  async kajiyaEnter() {
    if (G.chapter === 0 && F('rival') && !F('gesshoQuest')) return STORY.nightCall();
    if (G.chapter === 1 && F('bombarded') && !F('senkichiFire')) return STORY.senkichiFire();
    if (G.chapter === 8 && F('senkichi8') && !F('kayaku')) return STORY.kayaku();
  },
  async irori() { await N('囲炉裏で、からいもが ほっこりと焼けている。'); },

  // ================= 序章 =================
  async opening() {
    bgm(null);
    await card('序章　加治屋町の子', '安政五年（1858年）十一月\n薩摩国 鹿児島城下', 5000);
    await still(['薩摩の武士の子は、六、七歳になると\n「郷中（ごじゅう）」と呼ばれる仲間に入る。', '年上の者が年下を鍛え、学問と武芸、そして\n「負けるな、嘘をつくな、弱い者をいじめるな」を叩きこむ。', 'ここは加治屋町。\n下級武士の家ばかりが並ぶ、小さな町――'], 'title');
    const home = G.map.houses.find(h => h.name.startsWith('日高家'));
    bgm('town'); await enterHouse(home);
    await Q([
      ['haha', '新八、いつまで寝ちょっとな。\n郷中の稽古が始まっど。', '新八、いつまで寝ているの。\n郷中の稽古が始まるよ。'],
      ['haha', '仙吉どんが、家ん前で待っちょっが。\n早よ行きやんせ。', '仙吉さんが、家の前で待っているよ。\n早く行きなさい。'],
      '【操作】移動：十字キー／スティック　決定・話す：A\n走る：Bを押しながら移動　メニュー：メニューボタン',
      '【ヒント】家の戸（のれんのある戸）からは中に入れる。\n甕（かめ）や葛籠（つづら）には、道具が入っていることがある。',
    ]);
    flag('opened');
  },
  async haha() {
    if (G.chapter === 1 && F('bombarded') && !F('hahaSafe')) {
      flag('hahaSafe');
      await Q([['haha', '新八！ 無事じゃったか……！', '新八！ 無事だったのね……！'], ['haha', '家は焼けんかった。\n近所の衆と、火を消して回っちょったとよ。', '家は焼けなかった。\n近所の人たちと、火を消して回っていたのよ。']]);
    }
    if (G.chapter === 8 && !F('haha8')) { flag('haha8'); await Q([['haha', '新八……ずいぶん、たくましゅうなったねえ。', '新八……ずいぶん、たくましくなったねえ。'], ['haha', 'おまえの背中は、吉之助さぁに似てきたよ。', 'あなたの背中は、吉之助さんに似てきたよ。']]); }
    const L = HAHA[Math.min(G.chapter, 8)] || HAHA[0];
    await S('haha', L[0], L[1]);
    if (await ask('haha', '家で休んでいくな？', '家で休んでいく？')) await rest();
  },
  async senkichiJoin() {
    await Q([
      ['senkichi', '遅かど、新八！\n二才頭（にせがしら）の先輩に怒らるっど！', '遅いぞ、新八！\n二才頭（にせがしら）の先輩に怒られるぞ！'],
      ['senkichi', '今日こそ立木打ちで、おはんに負けんど。\n稽古場は町の南西、生垣の中じゃ。', '今日こそ立木打ちで、君に負けないぞ。\n稽古場は町の南西、生垣の中だ。'],
    ]);
    await join('senkichi', 1);
  },
  async senpai() {
    if (G.chapter === 1) { await S('senpai', 'エゲレスが来ても、示現流の心は変わらん。\n一の太刀に、命を込めっとじゃ。', 'イギリスが来ても、示現流の心は変わらない。\n最初の一撃に、命を込めるのだ。'); return; }
    if (!F('senkichi')) { await S('senpai', 'ひとりか？ 仙吉はどげんした。\n郷中は、仲間と一緒に来っもんじゃ。', 'ひとりか？ 仙吉はどうした。\n郷中には、仲間と一緒に来るものだ。'); return; }
    if (!F('tutorial')) {
      await Q([
        ['senpai', '来たか、ちびども。', '来たか、ちびども。'],
        ['senpai', '示現流は「一の太刀を疑わず、二の太刀は負け」じゃ。\n最初の一撃に、命を込めろ。', '示現流は「最初の一撃を疑わず、二撃目は負け」だ。\n最初の一撃に、命を込めろ。'],
        ['senpai', '今日は、おいが相手をしてやる。\nかかってこい！', '今日は、私が相手をしてやる。\nかかってこい！'],
        '【戦闘】「たたかう」で攻撃、「ぼうぎょ」で身を守る。\n右下のボタンで オート・倍速 にもできる。',
      ]);
      const r = await battle(['senpai'], { bg: 'dojo', canLose: true, noRun: true });
      restAll();
      if (r === 'lose') await S('senpai', '……まだまだじゃな。\nじゃっどん、目は死んじょらん。', '……まだまだだな。\nだが、目は死んでいない。');
      else await S('senpai', '……ふん、悪くなか。', '……ふん、悪くない。');
      await Q([['senpai', 'よかか、新八。蜻蛉（とんぼ）に構え、\nただ一撃にすべてを込めっとじゃ。', 'いいか、新八。蜻蛉（とんぼ）に構え、\nただ一撃にすべてを込めるのだ。'], ['senpai', 'それが「チェスト」じゃ！', 'それが「チェスト」だ！']]);
      flag('tutorial'); SFX.play('learn');
      await N('新八は わざ「チェスト」を覚えた！\n（戦いの最初のターンに使うと、威力が2倍になる）');
      await STORY.sengi();
      await S('senpai', 'そうじゃ、吉之助さぁが おはんらを探しちょったぞ。\n西郷家の前に行ってみれ。', 'そうだ、吉之助さんが お前たちを探していたぞ。\n西郷家の前に行ってみろ。');
      return;
    }
    await S('senpai', F('rival') ? '高見馬場の連中を黙らせたげなな。\n噂になっちょっど。' : '負けるな、嘘をつくな、弱い者をいじめるな。\n郷中の教えを忘るっなよ。', F('rival') ? '高見馬場の連中を黙らせたそうだな。\n噂になっているぞ。' : '負けるな、嘘をつくな、弱い者をいじめるな。\n郷中の教えを忘れるなよ。');
  },
  // 郷中の「詮議」――答えのない問いを考えさせる、郷中の教え
  async sengi() {
    await Q([
      ['senpai', '稽古の締めは「詮議（せんぎ）」じゃ。\n答えのなか問いを、己の頭で考えっとじゃ。', '稽古の締めは「詮議（せんぎ）」だ。\n答えのない問いを、自分の頭で考えるのだ。'],
      ['senpai', '道で、親の仇（かたき）に出会うた。\nじゃっどん そいつは、川で溺れかけちょる。\n……新八、おはんなら どげんすっ？', '道で、親の仇に出会った。\nだがそいつは、川で溺れかけている。\n……新八、お前ならどうする？'],
    ]);
    const c = await pickOne(null, null, null, ['まず助ける。仇討ちはそのあとじゃ', '見捨てる。仇は仇じゃ', '助けて、仇も討たん'], { x: 120, y: 100, w: 256 });
    if (c === 0) { addPt('ri'); await S('senpai', '……筋を通す、ちゅうことか。理（り）の答えじゃな。', '……筋を通す、ということか。理の答えだな。'); }
    if (c === 1) { addPt('ri'); await S('senpai', '……ふむ。そいも一つの答えじゃ。\nじゃっどん、その答えは 一生背負わんといかんど。', '……ふむ。それも一つの答えだ。\nだが、その答えは一生背負わなければならないぞ。'); }
    if (c === 2) { addPt('jo'); await S('senpai', '……情（じょう）の深か奴じゃ。\n吉之助さぁも、きっと同じことを言いやっど。', '……情の深いやつだ。\n吉之助さんも、きっと同じことを言うだろう。'); }
    await N('（詮議の答えは、新八の「心」に残る。\n心のあり方は、のちの運命を左右するかもしれない）');
  },
  async tachikiBoy() {
    await S('boy', '立木打ちは、朝に三千、夕べに八千じゃ。\n……一本勝負、やってみっか？', '立木打ちは、朝に三千、夕方に八千だ。\n……五本勝負、やってみる？');
    if (!await ask(null, '立木打ちに挑戦しますか？（Aを押すタイミング勝負）')) return;
    const sc = await tachiki(5);
    const k = 'tachiki' + G.chapter;
    if (sc === 5 && !F(k + 'p')) { flag(k + 'p'); await S('boy', '五本とも当てた！？ ……こいは、おいの宝もんじゃが、やる！', '五本とも当てた!? ……これは僕の宝物だけど、あげる！'); await give(G.chapter >= 2 ? 'yakusugi' : 'omamori'); }
    else if (sc >= 3) { await S('boy', 'なかなかやっど！', 'なかなかやるね！'); await give(G.chapter >= 2 ? 'karukan' : 'karaimo', 2); }
    else await S('boy', 'まだまだじゃ。朝に三千、夕べに八千！', 'まだまだだ。朝に三千、夕方に八千！');
  },
  async saigo() {
    if (!F('quest')) {
      await Q([
        ['saigo', '来たか、新八、仙吉。', '来たか、新八、仙吉。'],
        ['saigo', '……殿様（島津斉彬公）が亡くなられて、\nもう四月（よつき）になる。', '……殿様（島津斉彬公）が亡くなられて、\nもう四か月になる。'],
        ['saigo', 'おいは殿様の後を追うて、腹を切ろうとした。\nじゃっどん、京の月照（げっしょう）さぁという\n坊様に止められた。', '私は殿様の後を追って、腹を切ろうとした。\nだが、京の月照さんという\nお坊さんに止められた。'],
        ['saigo', '「殿の志を継ぐのが、おはんの役目じゃ」とな。', '「殿の志を継ぐのが、あなたの役目だ」とね。'],
        ['saigo', 'その月照さぁが今、幕府に追われちょる。\nおいは薩摩で匿うてもらえるよう、\n藩に頼んじょるところじゃ。', 'その月照さんが今、幕府に追われている。\n私は薩摩でかくまってもらえるよう、\n藩に頼んでいるところだ。'],
        ['saigo', '……湿っぽか話はやめじゃ。頼みがある。', '……しめっぽい話はやめだ。頼みがある。'],
        ['saigo', '甲突川（こうつきがわ）の向こうで、\nよその郷中の若衆が暴れちょっ。\n町の者が困っちょっど。', '甲突川の向こうで、\nよその郷中の若者が暴れている。\n町の人が困っているんだ。'],
        ['saigo', '喧嘩は売っな。じゃっどん、\n弱か者をいじめる奴からは、逃ぐっな。', 'けんかは売るな。だが、\n弱い者をいじめるやつからは、逃げるな。'],
        ['saigo', '町の東の橋を渡った先じゃ。行ってこい。', '町の東の橋を渡った先だ。行ってこい。'],
      ]);
      chron('nariakira'); chron('ansei'); meet('nariakira');
      flag('quest'); return;
    }
    await S('saigo', '町の東、甲突川の橋を渡った先じゃ。\n無理はすっなよ。', '町の東、甲突川の橋を渡った先だ。\n無理はするなよ。');
  },
  async okubo() {
    if (G.chapter === 0) {
      if (!F('quest')) { await S('okubo', '……新八か。おいは今、書を読んじょる。\n用がなかなら行け。', '……新八か。私は今、本を読んでいる。\n用がないなら行け。'); return; }
      if (!F('okuboMoney')) {
        await S('okubo', '吉之助さぁから聞いた。……これを持っていけ。', '吉之助さんから聞いた。……これを持っていけ。');
        await getMoney(60); flag('okuboMoney');
        await S('okubo', '木刀でも買うて来い。\n素手で勝てるほど、世の中は甘うなか。', '木刀でも買ってこい。\n素手で勝てるほど、世の中は甘くない。');
        return;
      }
      await S('okubo', 'おいたちは「精忠組（せいちゅうぐみ）」という\n仲間を作った。殿様の志は、おいたちが継ぐ。', '私たちは「精忠組」という\n仲間を作った。殿様の志は、私たちが継ぐ。');
      return;
    }
    if (!F('ch1brief')) return STORY.okuboBrief();
    if (!F('euryalus')) { await S('okubo', '天保山の砲台は、町の南の浜を下った先じゃ。\n……死ぬなよ。', '天保山の砲台は、町の南の浜を下った先だ。\n……死ぬなよ。'); return; }
    if (!F('ch1end')) return STORY.chapter1End();
  },
  async rival() {
    if (G.chapter === 1) { await S('rival', '加治屋町の新八か。\nエゲレスが来たら、おいたちも黙っちょらんど。', '加治屋町の新八か。\nイギリスが来たら、俺たちも黙っていないぞ。'); return; }
    if (!F('quest')) { await S('rival', 'なんじゃ、ちびども。\nここは高見馬場の郷中の縄張りじゃ。帰れ帰れ。', 'なんだ、ちびども。\nここは高見馬場の郷中の縄張りだ。帰れ帰れ。'); return; }
    if (!F('rival')) {
      await Q([['rival', '加治屋町のちびか。\n西郷どんの使いで来たげなな。', '加治屋町のちびか。\n西郷さんの使いで来たそうだな。'], ['rival', '町のもんから、ちいと銭を借りただけじゃ。\n文句があっとなら、腕で来い！', '町の人から、少しお金を借りただけだ。\n文句があるなら、腕で来い！']]);
      await battle(['wakashu', 'taisho', 'wakashu'], { bg: 'field', noRun: true, boss: true });
      await Q([['rival', '……参った。おはんら、強かな。', '……参った。お前たち、強いな。'], ['rival', 'もう町の者には手は出さん。\n郷中の名にかけて、約束すっ。', 'もう町の人には手を出さない。\n郷中の名にかけて、約束する。']]);
      flag('rival'); meet('rival');
      await S('senkichi', 'やったな、新八！\n吉之助さぁに知らせに戻っど！', 'やったな、新八！\n吉之助さんに知らせに戻ろう！');
      return;
    }
    await S('rival', '加治屋町の新八……覚えちょっど。\nいつか、おはんと肩を並べて戦う日が\n来っかもしれん。', '加治屋町の新八……覚えておくぞ。\nいつか、お前と肩を並べて戦う日が\n来るかもしれない。');
  },
  async rivalkid() { await S('rivalkid', F('rival') ? '大将が負けるとこ、初めて見た……。' : '大将に逆らうと、怖かど。', F('rival') ? '大将が負けるところ、初めて見た……。' : '大将に逆らうと、怖いぞ。'); },
  async nightCall() {
    await fadeOut(); flag('gesshoQuest'); G.night = true; Audio8.cur = null; bgm('night'); await fadeIn();
    await Q([
      'その夜――',
      ['okubo', '新八！ 仙吉！ 探しちょったぞ！', '新八！ 仙吉！ 探していたぞ！'],
      ['okubo', '……吉之助さぁが、月照さぁを連れて\n舟で錦江湾に出た。', '……吉之助さんが、月照さんを連れて\n舟で錦江湾に出た。'],
      ['senkichi', 'こげな夜にですか？', 'こんな夜にですか？'],
      ['okubo', '藩は月照さぁを匿わんと決めた。\n「日向送り」……国境で斬れ、という意味じゃ。', '藩は月照さんをかくまわないと決めた。\n「日向送り」……国境で斬れ、という意味だ。'],
      ['okubo', '吉之助さぁは……\n月照さぁと一緒に、死ぬつもりかもしれん。', '吉之助さんは……\n月照さんと一緒に、死ぬつもりかもしれない。'],
      ['okubo', '町の南の道から浜に出らるっ。急げ！', '町の南の道から浜に出られる。急げ！'],
    ]);
  },
  async gessho() {
    bgm('sad');
    await Q(['冬の海に、十六夜（いざよい）の月が浮かんでいた。', '沖に一艘の小舟が見える。\n……舟の上に、二つの影が立ち上がった。', ['senkichi', '新八！ あれ……！', '新八！ あれ……！']]);
    SFX.play('splash'); shake(true); flashScreen('#a0c0ff');
    await Q(['――ザブン！！', '二つの影が、抱き合うように海へ落ちた。']);
    while (true) {
      const c = await pickOne(null, null, null, ['冬の海に飛び込む！', '……足がすくむ'], { x: 120, y: 110, w: 180 });
      if (c === 0) break;
      await S('senkichi', '何をぼさっとしちょっとか、新八！', '何をぼんやりしているんだ、新八！');
    }
    SFX.play('splash'); await fadeOut();
    await N('新八は冬の海へ飛び込んだ。\n舟の者たちと一緒に、二人を引き上げる――');
    flag('gessho'); chron('jusui'); meet('gessho');
    await sleep(600); await fadeIn();
    await Q(['……月照は、二度と目を開けなかった。', '西郷吉之助だけが、息を吹き返した。', ['saigo', '……おいだけ……生き残ってしもうたか……', '……私だけ……生き残ってしまったのか……'], ['saigo', '月照さぁ……すまん……すまん……', '月照さん……すまない……すまない……']]);
    await fadeOut();
    await still(['藩は幕府に「西郷吉之助は死んだ」と届け出た。', 'そして西郷は名を「菊池源吾」と変え、\n遠い南の島――奄美大島へ送られることになった。'], 'night');
    G.night = false; Audio8.cur = null; bgm('sad');
    await fadeIn();
    await Q([
      '数日後。夜明けの浜――',
      ['saigo', '新八。おはんらに助けられた命じゃ。', '新八。君たちに助けられた命だ。'],
      ['saigo', 'おいは一度死んだ。\nこいからの命は、天からの預かりもんじゃ。', '私は一度死んだ。\nこれからの命は、天からの預かりものだ。'],
      ['saigo', '……島へ行っど。いつか必ず戻っ。', '……島へ行くよ。いつか必ず戻る。'],
      ['saigo', 'こいを持っちょけ。\nおいが若か頃に振っちょった木刀じゃ。', 'これを持っておけ。\n私が若い頃に振っていた木刀だ。'],
    ]);
    await give('saigobokuto');
    SFX.play('bark');
    await Q([
      ['tsun', 'ワン！ ワンワン！', '（ワン！ ワンワン！）'],
      ['saigo', 'こいつはツン。おいの可愛か犬じゃ。\n島へは連れて行けん。……おはんに頼めっか。', 'こいつはツン。私のかわいい犬だ。\n島へは連れて行けない。……君に頼めるか。'],
    ]);
    await join('tsun', Math.max(1, G.mem.shinpachi.lv - 1));
    const c = await pickOne('shinpachi', 'ツンは、おいが預かりもす。\n吉之助さぁ……', 'ツンは、私が預かります。\n吉之助さん……', ['必ず、戻ってきてくいやんせ！', '薩摩は、おいたちで守りもす！'], { w: 240 });
    if (c === 0) addPt('jo'); else addPt('ri');
    await Q([['saigo', '……おう。', '……ああ。'], ['saigo', '一蔵どん（大久保）を頼む。\nあいつは、ひとりで何でん背負い込むでな。', '一蔵さん（大久保）を頼む。\nあいつは、ひとりで何でも背負い込むからな。'], '西郷を乗せた船が、桜島の向こうへ消えていった。']);
    chron('amami');
    await fadeOut();
    await still(['それから、時は流れ――', '文久二年（1862年）。島から呼び戻された西郷は、\n藩の実権を握る島津久光とぶつかり、\nふたたび南の島・沖永良部島へ流された。', '同じ年、京の寺田屋では、\n薩摩の藩士同士が斬り合う悲劇が起きた。', 'そして八月。江戸から帰る久光の行列を横切った\nイギリス人を、薩摩藩士が斬り殺した。\n――生麦事件である。'], 'night');
    chron('okinoerabu'); chron('teradaya'); chron('namamugi'); meet('hisamitsu');
    await STORY.ch1Start();
  },

  // ================= 第一章 =================
  async ch1Start() {
    await startChapter(1, '第一章　錦江湾燃ゆ', '文久三年（1863年）六月\n鹿児島城下', 'kajiya', 4, 12, ['五年の月日が流れ、新八は十七になった。', '文久三年六月二十七日。\n錦江湾に、七隻の黒い船が現れた。\n――イギリス艦隊である。']);
    chron('fleet');
    for (const id of G.party) lvUp(id, 5);
    await Q([['haha', '新八……エゲレスの船が、湾いっぱいに並んじょっど。', '新八……イギリスの船が、湾いっぱいに並んでいるよ。'], ['haha', '大久保さぁが、おはんを呼んじょったよ。\n大久保家の前じゃ。', '大久保さんが、あなたを呼んでいたよ。\n大久保家の前だよ。']]);
    save(); toast('自動で記録しました');
  },
  async okuboBrief() {
    await Q([
      ['okubo', '来たか、新八、仙吉。', '来たか、新八、仙吉。'],
      ['okubo', 'イギリスは「生麦の下手人を差し出し、\n二万五千ポンドを払え」と言うてきた。', 'イギリスは「生麦事件の犯人を差し出し、\n二万五千ポンドを払え」と言ってきた。'],
      ['okubo', 'そげな話、薩摩が呑むはずがなか。……戦になる。', 'そんな話、薩摩がのむはずがない。……戦になる。'],
      ['togo', '大久保さぁ！ おいも行かせてくいやんせ！', '大久保さん！ 私も行かせてください！'],
      ['okubo', '……こいつは東郷平八郎。\nこの町の、東郷家の倅じゃ。', '……こいつは東郷平八郎。\nこの町の、東郷家の息子だ。'],
      ['togo', '東郷平八郎、十五になりもした！\n砲術を習うちょります。\n大砲なら任せてくいやい！', '東郷平八郎、十五歳になりました！\n砲術を習っています。\n大砲なら任せてください！'],
    ]);
    await join('togo', Math.max(1, G.mem.shinpachi.lv - 1));
    await Q([['okubo', 'おはんらは天保山（てんぽうざん）の砲台へ行け。\n町の南の浜を下った先じゃ。', 'お前たちは天保山の砲台へ行け。\n町の南の浜を下った先だ。'], ['okubo', 'こいで支度を整えよ。', 'これで支度を整えなさい。']]);
    await getMoney(300);
    await Q([['okubo', '……吉之助さぁがおらん今、\n薩摩は、おいたちで守るしかなか。', '……吉之助さんがいない今、\n薩摩は、私たちで守るしかない。'], '【ヒント】甲突川の河原に「馬方」がいる。\n馬に乗ると、野山を速く駆けられる。']);
    flag('ch1brief');
  },
  async togoWait() { await S('togo', '大久保さぁの話を、一緒に聞いてくいやんせ！', '大久保さんの話を、一緒に聞いてください！'); },
  async seizure() {
    await Q(['七月二日、夜明け前。', 'イギリス艦隊が、薩摩の蒸気船三隻\n――天佑丸・白鳳丸・青鷹丸を奪いにかかった！', ['togo', '船が盗らるっど！', '船が盗られるぞ！'], ['senkichi', '行っど、新八！', '行くぞ、新八！']]);
    await battle(['sailor', 'captain', 'sailor'], { bg: 'beach', noRun: true, boss: true });
    await Q(['新八たちは敵を押し返した。だが――', '三隻の蒸気船は沖へ引かれ、\n火を放たれて沈んでいった。', ['togo', '……許さん。こいはもう、戦じゃ！', '……許さない。これはもう、戦だ！']]);
    await interlude('旗艦ユーリアラス号の甲板にて', async () => {
      await Q([
        ['neale', '薩摩は、我々の要求を拒んだ。\n蒸気船を押さえれば、交渉に応じると思ったのだが。'],
        ['kuper', '代理公使、嵐が近い。\n長くは留まれんぞ。'],
        ['satow', '……彼らは、引かないと思います。\n薩摩の侍は、負けを認めることを\nなによりも嫌う人たちです。'],
        ['josling', '提督、陸の砲台に動きがあります！'],
        ['kuper', 'まさか――撃つ気か？ この艦隊に？'],
      ]);
      meet('neale'); meet('kuper'); meet('satow'); meet('josling');
    });
    shake(true); SFX.play('boom');
    await N('正午。嵐の中、天保山砲台が火を噴いた。\n――薩英戦争の始まりである。');
    chron('satsuei'); flag('seizure');
    await STORY.kassenSatsuei();
  },
  async kassenSatsuei() {
    await Q([['commander', '全砲門、撃ち方はじめ！\n嵐で敵の狙いも定まらん。今じゃ！', '全砲門、撃ち方はじめ！\n嵐で敵の狙いも定まらない。今だ！'], '【合戦】軍と軍の戦い。「兵力」と「士気」のどちらかが\n尽きたほうが負け。策をうまく使おう。']);
    await kassen({
      title: '天保山砲台の砲撃戦', bg: 'storm', goal: 'survive', turns: 6, themUnit: 'ship', usUnit: 'cannon', usFx: 'boom', attackName: '砲撃する',
      us: { name: '天保山砲台', troops: 900, power: 70 }, them: { name: 'イギリス艦隊', troops: 1100, power: 150 }, themAttack: '敵艦隊の アームストロング砲！',
      intro: '嵐の錦江湾。七隻の艦隊と、薩摩の砲台が向かい合う――', rally: '東郷「撃て撃てぇ！ 薩摩の大砲を見せちゃれ！」',
      tactics: [{ id: 'storm', name: '嵐を待つ', desc: '台風の荒波で、2刻のあいだ敵の狙いが鈍る', msg: '東郷「嵐が強うなりもす！ 敵の船が揺れちょっ！」', storm: 2 }, { id: 'aim', name: '旗艦を狙え', desc: '次の砲撃で、敵の士気を大きく削る', msg: '「狙いは旗艦ユーリアラス号じゃ！」', aim: 1 }],
      events: { 3: { msg: 'ロケット弾が城下に落ちた！ 町が燃えている……', um: 10 } },
    });
    await N('砲撃戦を耐え抜いた！ 敵の旗艦が、砲台の目の前に迫ってくる――');
    await Q([['commander', '旗艦が射程に入ったぞ！\n新八、とどめを刺せぇ！', '旗艦が射程に入ったぞ！\n新八、とどめを刺せ！']]);
    await battle(['euryalus'], { bg: 'storm', noRun: true, boss: true });
    await Q(['薩摩の砲弾が、旗艦ユーリアラス号の艦橋を直撃した！', '艦長ジョスリング、副長ウィルモットが戦死。']);
    await S('commander', 'やったぞ！ ……ようやった。\nこいを持っていけ。島津家の旗印じゃ。', 'やったぞ！ ……よくやった。\nこれを持っていけ。島津家の旗印だ。');
    await give('hatajirushi');
    shake(true); SFX.play('boom'); flag('euryalus'); flag('bombarded');
    await Q(['しかし――', 'イギリス艦隊のアームストロング砲とロケット弾は、\n薩摩の砲台を次々と打ち崩し、城下に火を放った。', '島津家の工場「集成館」も、炎に包まれた。', ['togo', '町が……町が燃えちょっ！', '町が……町が燃えている！'], ['senkichi', 'おっかんたちが心配じゃ。\n加治屋町へ戻っど！', '母さんたちが心配だ。\n加治屋町へ戻ろう！']]);
    visit('shuseikan'); refreshMap(); setWeather('embers');
  },
  async commander() {
    if (G.chapter === 0) { await S('commander', 'ここは天保山の砲台じゃ。\n異国の船が来たら、ここから撃つ。', 'ここは天保山の砲台だ。\n外国の船が来たら、ここから撃つ。'); return; }
    if (!F('seizure')) { await S('commander', 'まだ撃つなという命令じゃ。\n……ん？ 桟橋の方が騒がしか。\n見てきてくれんか。', 'まだ撃つなという命令だ。\n……ん？ 桟橋のほうが騒がしい。\n見てきてくれないか。'); return; }
    await S('commander', '砲台はほとんど崩された。\n……じゃっどん、薩摩は逃げんかった。', '砲台はほとんど崩された。\n……だが、薩摩は逃げなかった。');
  },
  async senkichiFire() {
    flag('senkichiFire'); Audio8.cur = null; bgm('war');
    await Q(['加治屋町にも、火の粉が降りそそいでいた。', ['senkichi', '……新八。おいは、悔しか。', '……新八。おれは、悔しい。'], ['senkichi', 'あん大砲の前じゃ、示現流も なんも通じらん。\n刀の時代は、終わっとかもしれん。', 'あの大砲の前では、示現流も何も通じない。\n刀の時代は、終わるのかもしれない。']]);
    const c = await pickOne('shinpachi', null, null, ['……そいでも、おいは刀で守る', '……仙吉。おいたちも、学ばんといかんな', '（黙って、仙吉の肩に手を置く）'], { w: 250 });
    if (c === 0) { addPt('jo'); await S('senkichi', '……おはんらしか。', '……君らしいな。'); }
    if (c === 1) { addPt('ri'); addPt('bond'); await S('senkichi', '……！ うん。おいは、異国の学問を学びたか。', '……！ うん。おれは、外国の学問を学びたい。'); }
    if (c === 2) { addPt('bond'); await S('senkichi', '……あいがと、新八。', '……ありがとう、新八。'); }
    Audio8.cur = null; bgm('war');
  },
  async chapter1End() {
    bgm('sad');
    await Q([
      ['okubo', '……七月四日、イギリス艦隊は湾から去った。', '……七月四日、イギリス艦隊は湾から去った。'],
      ['okubo', '砲台は崩され、城下では\n三百五十軒あまりの家が焼けた。', '砲台は崩され、城下では\n三百五十軒あまりの家が焼けた。'],
      ['okubo', 'じゃっどん、向こうの旗艦の艦長も討ち取った。\n薩摩は最後まで退かんかった。', 'だが、向こうの旗艦の艦長も討ち取った。\n薩摩は最後まで退かなかった。'],
      ['shinpachi', '……勝ったとですか、負けたとですか。', '……勝ったのですか、負けたのですか。'],
      ['okubo', '負けじゃ。じゃっどん、ただの負けじゃなか。', '負けだ。だが、ただの負けではない。'],
      ['okubo', 'あん大砲は、刀では斬れん。\nこいからは、異国から学ばんといかん。', 'あの大砲は、刀では斬れない。\nこれからは、外国から学ばなければならない。'],
      ['togo', '新八さぁ。おいは決めもした。', '新八さん。私は決めました。'],
      ['togo', 'おいは海の男になりもす。\nいつか、あげな船を、薩摩……いや、\n日本の手で動かしてみせもす。', '私は海の男になります。\nいつか、あんな船を、薩摩……いや、\n日本の手で動かしてみせます。'],
    ]);
    await leave('togo', '東郷平八郎が 一行を離れた。');
    await N('東郷平八郎はのちに海軍に進み、\n日本の連合艦隊を率いる提督となる――');
    chron('withdraw'); flag('ch1end');
    await fadeOut();
    await still(['戦いのあと、薩摩とイギリスは和解した。', '薩摩は「異国を打ち払え」という考えを捨て、\nイギリスと手を結び、新しい技術を学んでいく。'], 'beach');
    chron('peace');
    await STORY.ch2Start();
  },

  // ================= 第二章 =================
  async ch2Start() {
    await startChapter(2, '第二章　蛤御門', '元治元年（1864年）二月\n鹿児島城下', 'kajiya', 8, 21, ['仲間たちの願いが届き、\n西郷が島から呼び戻されることになった。', '長い牢の暮らしで、西郷の足は弱っていた。\nそれでも、その目の光は消えていなかった。']);
    for (const id of G.party) lvUp(id, 10);
    await Q([['senkichi', '新八！ 吉之助さぁの船が、浜に着くげな！', '新八！ 吉之助さんの船が、浜に着くそうだ！'], ['tsun', 'ワンッ！', '（ワンッ！）']]);
    save(); toast('自動で記録しました');
  },
  async saigoReturn() {
    flag('saigoBack'); chron('return'); visit('okinoerabu'); visit('amami');
    bgm('title');
    await Q(['小舟から、大きな体の男が 杖をついて降りてきた。']);
    SFX.play('bark'); emote('player', '！');
    await Q([
      ['tsun', 'ワン！ ワンワンワン！', '（ワン！ ワンワンワン！）'],
      ['saigo', '……ツン！ おお、おお……覚えちょったか！', '……ツン！ おお、おお……覚えていたか！'],
      ['saigo', '新八、仙吉……でかくなったのう。\nツンを、よう守ってくれた。', '新八、仙吉……大きくなったなあ。\nツンを、よく守ってくれた。'],
      ['shinpachi', '吉之助さぁ……！ 足は……', '吉之助さん……！ 足は……'],
      ['saigo', 'なあに、牢の中で ちいと弱っただけじゃ。\nすぐに歩けるようになっ。', 'なあに、牢の中で少し弱っただけだ。\nすぐに歩けるようになる。'],
      ['saigo', '京で、長州と会津がにらみ合うちょる。\n薩摩も黙っちょれん。……一緒に来てくれっか。', '京で、長州と会津がにらみ合っている。\n薩摩も黙っていられない。……一緒に来てくれるか。'],
    ]);
    await join('saigo', partyLv() + 1);
    await S('saigo', 'そうじゃ、こいを渡しちょく。\n西郷家の蔵の鍵じゃ。中のもんは好きに使え。', 'そうだ、これを渡しておく。\n西郷家の蔵の鍵だ。中のものは好きに使え。');
    await give('key_kura');
    await N('【ヒント】西郷家の蔵（加治屋町・西郷家の東）が開けられる。\n準備ができたら、桟橋から京へ向かおう。');
  },
  async toKyoto() {
    if (!await ask(null, '桟橋から船に乗り、京へ向かいますか？\n（しばらく鹿児島には戻れません）')) { await walk([3]); return; }
    await fadeOut(800); bgm(null);
    await still(['船は錦江湾を出て、海を渡る。', '元治元年 夏。京――'], 'kyoto');
    flag('kyoto2'); enterMap('kyoto', 7, 8, 0); await fadeIn();
    await Q([['saigo', 'ここが京の薩摩藩邸（二本松）じゃ。\n家老の小松帯刀どんに挨拶してこい。', 'ここが京の薩摩藩邸（二本松）だ。\n家老の小松帯刀さんに挨拶してこい。']]);
  },
  async komatsu() {
    if (G.chapter === 2 && !F('komatsu2')) {
      flag('komatsu2');
      await Q([
        ['komatsu', 'よう来てくれた、新八どん。\n西郷どんから話は聞いちょる。', 'よく来てくれた、新八さん。\n西郷さんから話は聞いている。'],
        ['komatsu', '去年、長州は京から追い出された。\nその長州が、兵を率いて京へ戻ろうとしちょる。', '去年、長州は京から追い出された。\nその長州が、兵を率いて京へ戻ろうとしている。'],
        ['komatsu', '御所を守るのが、薩摩の役目じゃ。\n……戦になれば、北の門から御所へ急いでくれ。', '御所を守るのが、薩摩の役目だ。\n……戦になれば、北の門から御所へ急いでくれ。'],
      ]);
      await interlude('長州の陣にて', async () => {
        await Q([
          ['kijima', '何をためらう、久坂！\n御所へ攻め上り、我らの正しさを訴えるのじゃ！'],
          ['kusaka', '来島さん……今、兵を動かせば、\n長州は「朝敵」の汚名を着ることになります。'],
          ['kijima', '臆したか！ 卑怯者は ここに残れ。\nわしは行くぞ！'],
          ['kusaka', '…………。\n（このままでは、長州が滅びる……）'],
        ]);
        meet('kusaka'); meet('kijima');
      });
      await N('【目的】京の町を見て回り、準備ができたら\n北の門から御所へ向かおう。');
      return;
    }
    if (G.chapter === 2 && F('kijima') && !F('kinmonEnd')) return STORY.ch2End();
    if (G.chapter === 3) { await S('komatsu', '龍馬どんと桂どんは、ここで話し合うちょる。\n……なかなか進まんようじゃが。', '龍馬さんと桂さんは、ここで話し合っている。\n……なかなか進まないようだが。'); return; }
    await S('komatsu', '京は物騒じゃ。気をつけてな。', '京は物騒だ。気をつけてな。');
  },
  async kinmonStart() {
    flag('kinmon'); flag('kinmonFire'); chron('kinmon'); visit('hamaguri');
    Audio8.cur = null; bgm('war');
    await Q([['satsumasoldier', '伝令！ 長州勢が 蛤御門に攻めかかっちょります！\n会津が押されちょる！', '伝令！ 長州軍が 蛤御門に攻めかかっています！\n会津が押されています！'], ['saigo', '乾門から回り込むっど！\n新八、ついて来い！', '乾門から回り込むぞ！\n新八、ついて来い！']]);
    await kassen({
      title: '禁門の変・蛤御門', bg: 'kyoto', goal: 'rout', themUnit: 'choshusoldier', usUnit: 'satsumasoldier', usFx: 'gun', attackName: '撃ちかける',
      us: { name: '会津・薩摩', troops: 2000, power: 90, leader: '西郷' }, them: { name: '長州勢', troops: 1600, power: 160 }, themAttack: '長州勢が 御門に押し寄せる！', moraleDiv: 20,
      intro: '御所の門をめぐり、長州と会津・薩摩が激突する！', rally: '西郷「薩摩の兵は 一歩も退かん！」',
      tactics: [{ id: 'flank', name: '乾門から側面を突く', desc: '西郷の策。敵の横腹を突き、兵力と士気を大きく削る', msg: '西郷「今じゃ、横から突っ込めぇ！」\n薩摩兵が長州勢の側面に躍りこんだ！', troops: 400, morale: 22 }, { id: 'aim', name: '大将を狙い撃て', desc: '次の攻撃で敵の士気を大きく削る', msg: '「馬上の老将を狙え！」', aim: 1 }],
    });
    await N('長州勢が崩れはじめた！ だが、蛤御門の前で\nひとりの老将が 槍を振るって踏みとどまっている――');
  },
  async kijima() {
    await S('kijima', '薩摩の芋侍どもが……！\nわしの槍、受けてみよ！', '薩摩の芋侍どもが……！\nわしの槍を受けてみよ！');
    await battle(['yugeki', 'kijima', 'yugeki'], { bg: 'kyoto', noRun: true, boss: true });
    flag('kijima');
    await Q(['薩摩兵の放った銃弾が、来島又兵衛の胸を貫いた。', '長州勢は総崩れとなり、久坂玄瑞は鷹司邸で自刃した。', 'さらに、戦火は京の町へ燃え広がった。\nのちに「どんどん焼け」と呼ばれる大火である。', ['saigo', '……っ。', '……っ。'], ['senkichi', '吉之助さぁ、足から血が……！', '吉之助さん、足から血が……！'], ['saigo', 'かすり傷じゃ。……それより、町の衆を助けんか！\n藩邸へ戻って、小松どんに知らせっど。', 'かすり傷だ。……それより、町の人を助けるんだ！\n藩邸へ戻って、小松さんに知らせよう。']]);
    refreshMap();
  },
  async ch2End() {
    flag('kinmonEnd'); Audio8.cur = null; bgm('sad');
    await Q([
      ['komatsu', 'ご苦労じゃった。御所は守られた。\n……じゃっどん、京の町は 三日三晩燃え続けた。', 'ご苦労だった。御所は守られた。\n……だが、京の町は 三日三晩燃え続けた。'],
      ['saigo', '……長州の連中も、国を思うて戦うたとじゃ。\n敵とはいえ、日本の侍じゃ。', '……長州の者たちも、国を思って戦ったのだ。\n敵とはいえ、日本の侍だ。'],
      ['saigo', '新八。いつか、長州と手を結ぶ日が\n来っかもしれん。', '新八。いつか、長州と手を結ぶ日が\n来るかもしれない。'],
      ['shinpachi', '長州と……ですか？', '長州と……ですか？'],
      ['saigo', '日本の中で争うちょる場合じゃなか。\n異国は、すぐそこまで来ちょっでな。', '日本の中で争っている場合ではない。\n外国は、すぐそこまで来ているからな。'],
    ]);
    await STORY.ch3Start();
  },

  // ================= 第三章 =================
  async ch3Start() {
    await startChapter(3, '第三章　盟約', '慶応二年（1866年）一月\n京・薩摩藩邸', 'kyoto', 7, 8, ['幕府は長州を討つため、兵を送った。\n西郷はその戦を、血を流さずに収めた。', '慶応元年（1865年）。\n薩摩の十九人の若者が、ひそかにイギリスへ渡った。', 'そして慶応二年一月。\n土佐の脱藩浪士が、ひとつの「無茶」を企てていた。']);
    chron('ryugaku'); visit('ryugakusei');
    for (const id of G.party) lvUp(id, 14);
    await leave('saigo', '西郷は 藩邸の奥で話し合いに臨むため、一行を離れた。');
    await Q([['senkichi', '新八、藩邸に土佐の坂本龍馬ちゅう男が来ちょるげな。\n長州の桂小五郎どんも一緒らしか。', '新八、藩邸に土佐の坂本龍馬という男が来ているそうだ。\n長州の桂小五郎さんも一緒らしい。'], ['senkichi', '長州と薩摩が……同じ屋根の下におっとか？', '長州と薩摩が……同じ屋根の下にいるのか？']]);
    save(); toast('自動で記録しました');
  },
  async kido3() { await S('kido', '……十日も待たされている。\n薩摩は、何も言い出さぬ。\n長州から頭を下げることは できぬのだ。'); },
  async ryoma3() {
    Audio8.cur = null; bgm('kyoto');
    await Q([
      ['ryoma', 'おまんが新八か！ 西郷さんから聞いちゅう。\nわしは坂本龍馬じゃ。', '君が新八か！ 西郷さんから聞いている。\n私は坂本龍馬だ。'],
      ['ryoma', 'まっこと、困ったもんぜよ。\n薩摩も長州も、意地っぱりじゃき\nどっちも先に口を開かん。', '本当に、困ったものだ。\n薩摩も長州も、意地っぱりだから\nどちらも先に口を開かない。'],
      ['ryoma', 'こんなことしゆう間に、日本は\n異国に食われてしまうぜよ！', 'こんなことをしている間に、日本は\n外国に食われてしまうぞ！'],
    ]);
    const c = await pickOne('shinpachi', null, null, ['薩摩から、話を切り出すべきじゃ', '長州が先に、頭を下げるべきじゃ', '……龍馬さぁ、なんとかしてくいやんせ'], { w: 256 });
    if (c === 0) addPt('jo'); if (c === 1) addPt('ri');
    await fadeOut();
    await N('龍馬は西郷のもとへ向かい、膝を詰めて談判した。\n――そして。');
    await fadeIn();
    await Q([
      ['saigo', '桂どん。……薩摩は、長州のために\n力を尽くしもす。', '桂さん。……薩摩は、長州のために\n力を尽くします。'],
      ['kido', '……西郷殿。その言葉、しかと聞いた。'],
      ['ryoma', 'よっしゃあ！ これで日本は変わるぜよ！', 'よし！ これで日本は変わるぞ！'],
      '慶応二年一月二十一日。\n薩摩と長州は、ひそかに手を結んだ。――薩長同盟である。',
    ]);
    flag('satcho'); chron('satcho'); meet('kido'); meet('komatsu');
    await join('ryoma', partyLv() + 1);
    await Q([['ryoma', '新八、ちっくと伏見の寺田屋まで付き合うとうせ。\n定宿ながよ。', '新八、ちょっと伏見の寺田屋まで付き合ってくれ。\nいつもの宿なんだ。'], '【目的】京の南の道から、伏見の寺田屋へ向かおう。']);
  },
  async teradaya3() {
    flag('teradaya3'); Audio8.cur = null; bgm('war');
    await Q(['一月二十三日、夜更け。寺田屋――']);
    meet('oryo');
    await Q([['oryo', '龍馬さん！ 捕り方どす！\n宿の周りを、ぎょうさん取り囲んでます！', '龍馬さん！ 捕り方です！\n宿の周りを、たくさんの人が取り囲んでいます！'], ['ryoma', 'お龍、ようやった！\n新八、ひと暴れするぜよ！', 'お龍、よくやった！\n新八、ひと暴れするぞ！']]);
    await battle(['torikata', 'torikata', 'torikata'], { bg: 'town', noRun: true, intro: '寺田屋を 伏見奉行所の捕り方が取り囲んだ！' });
    await N('【目的】東の「薩摩藩伏見屋敷」へ逃げこもう！\n捕り方の頭が、行く手をふさいでいる――');
  },
  async teradayaInn() { await S('innkeeper', F('teradaya3') ? 'お登勢でございます。\n龍馬さんを、どうか……！' : 'ようおこしやす。寺田屋でございます。', F('teradaya3') ? '登勢です。\n龍馬さんを、どうか……！' : 'いらっしゃいませ。寺田屋でございます。'); },
  async torikashira() {
    await S('torikashira', '坂本龍馬、御用だ！\n神妙にいたせ！');
    await battle(['torikata', 'torikashira', 'torikata'], { bg: 'town', noRun: true, boss: true });
    await Q(['捕り方の頭を打ち倒した！', ['ryoma', 'っ……手を、斬られてしもうた……。', 'っ……手を、斬られてしまった……。'], ['senkichi', '龍馬さぁ、こっちじゃ！ 薩摩の屋敷へ！', '龍馬さん、こっちだ！ 薩摩の屋敷へ！']]);
    flag('teradayaEnd'); chron('teradaya2'); visit('teradaya');
    refreshMap();
  },
  async fushimiYashiki() {
    if (!F('teradayaEnd')) { await S('satsumasoldier', 'ここは薩摩藩の伏見屋敷じゃ。', 'ここは薩摩藩の伏見屋敷だ。'); return; }
    if (F('kirishimaIn')) return;
    await Q([['satsumasoldier', '龍馬どんの傷は、命に別状なか。\n西郷先生から伝言じゃ。', '龍馬さんの傷は、命に別状はない。\n西郷先生から伝言だ。'], ['satsumasoldier', '「龍馬どんを薩摩へ連れて行き、\n霧島の湯で 傷を癒やさせよ」とのこと。', '「龍馬さんを薩摩へ連れて行き、\n霧島の温泉で 傷を癒やさせよ」とのことだ。']]);
    await fadeOut(800);
    await still(['三月。龍馬とお龍は、薩摩の船で鹿児島へ渡った。', '二人は霧島の山々を巡り、温泉に浸かり、\n高千穂峰に登った。', 'のちに「日本で初めての新婚旅行」とも\n呼ばれる旅である。'], 'mountain');
    flag('kirishimaIn'); chron('honeymoon');
    enterMap('kirishima', 16, 21, 3); await fadeIn();
    await Q([['ryoma', 'うわあ、まっことええ所じゃのう！\n新八、あの山のてっぺんまで登るぜよ！', 'うわあ、本当にいい所だなあ！\n新八、あの山のてっぺんまで登るぞ！'], '【目的】霧島の北、高千穂峰の山頂へ登ろう。']);
  },
  async sakahoko() {
    flag('sakahoko'); visit('takachiho');
    Audio8.cur = null; bgm('title');
    await Q([
      '山頂に、青銅の矛が突き立っている。\n神話の時代から伝わるという「天の逆鉾」だ。',
      ['ryoma', 'これが天の逆鉾か……。\n新八、ちっくと引き抜いてみいや！', 'これが天の逆鉾か……。\n新八、ちょっと引き抜いてみろよ！'],
      ['senkichi', 'ば、罰が当たっど！', 'ば、罰が当たるぞ！'],
      ['ryoma', 'ははは！ ほんならわしがやっちゃる！\n……うおおおっ！', 'ははは！ それなら私がやってやる！\n……うおおおっ！'],
    ]);
    SFX.play('quake'); shake(true);
    await Q(['龍馬は逆鉾を引き抜くと、\n大笑いしながら、また元の場所に戻した。', ['ryoma', 'あははは！ お龍への土産話ができたぜよ！', 'あははは！ お龍へのいい土産話ができたぞ！'], '（龍馬は、この話を姉への手紙に 絵入りで書き残している）']);
    await leave('ryoma', '龍馬は「お龍が待っちゅう」と、ひと足先に山を下りていった。');
    await N('【目的】塩浸温泉（霧島の西）にいる 龍馬に会いに行こう。');
  },
  async ryomaOnsen() {
    flag('onsen3'); Audio8.cur = null; bgm('ending');
    await Q([
      ['ryoma', 'ええ湯じゃった。傷も、だいぶ良うなったぜよ。', 'いいお湯だった。傷も、だいぶ良くなったよ。'],
      ['ryoma', 'のう、新八。わしはのう、\n日本を今一度、洗濯したいがぜよ。', 'なあ、新八。私はね、\n日本をもう一度、洗濯したいんだ。'],
      ['ryoma', '藩も、身分も関係ない。\nみんなが同じ日本人として、海の向こうと\n渡り合える国にしたいがじゃ。', '藩も、身分も関係ない。\nみんなが同じ日本人として、海の向こうと\n渡り合える国にしたいんだ。'],
      ['ryoma', 'これ、やるき。長崎で撮った写真じゃ。\nわしのことを、忘れんといてくれや。', 'これ、あげるよ。長崎で撮った写真だ。\n私のことを、忘れないでくれよ。'],
    ]);
    await give('ryomaphoto');
    await Q([['oryo', '新八はん、おおきに。\n龍馬さんを守ってくれはって。', '新八さん、ありがとう。\n龍馬さんを守ってくれて。'], ['ryoma', 'ほいたら、またのう！ 新しい日本で会おうぜよ！', 'それじゃあ、またな！ 新しい日本で会おう！']]);
    await fadeOut(800); bgm('sad');
    await still(['慶応三年（1867年）十月。\n将軍・徳川慶喜は、政権を朝廷に返した。――大政奉還。', 'そして十一月十五日。\n京の近江屋で、坂本龍馬は刺客に襲われ、命を落とした。', '三十三歳の誕生日だった。'], 'night');
    chron('taisei'); chron('omiya'); meet('ryoma');
    await N('新八は、龍馬の写真を 長いあいだ見つめていた。');
    await STORY.ch4Start();
  },
  async inn() {
    if (await ask('innkeeper', 'お泊まりですか？ 20文でございます。')) {
      if (G.money < 20) { await N('お金が足りない。'); return; }
      G.money -= 20; await rest();
    }
  },
  async onsen8() { return STORY.onsen8Impl(); },

  // ================= 第四章 =================
  async ch4Start() {
    await startChapter(4, '第四章　鳥羽伏見', '慶応四年（1868年）一月\n京', 'kyoto', 7, 8, ['慶応三年十二月。朝廷は「王政復古」を宣言した。', '話し合いが行き詰まると、西郷はこう言ったという。\n「短刀一本あれば、片がつく」', '慶応四年一月三日。京の南、鳥羽と伏見で\n薩摩・長州と旧幕府軍がにらみ合っていた。']);
    for (const id of G.party) lvUp(id, 18);
    await Q([['senkichi', '新八、いよいよ戦じゃ。\n砲隊の大山弥助さぁが、南の陣で待っちょる。', '新八、いよいよ戦だ。\n砲隊の大山弥助さんが、南の陣で待っている。'], '【目的】京の南の道から、鳥羽・伏見の陣へ向かおう。']);
    save(); toast('自動で記録しました');
  },
  async tobaCamp() {
    await Q([['oyama', 'おう、新八！ 吉之助どんのいとこの、大山弥助じゃ。\nおいの大砲、見せちゃっど。', 'おう、新八！ 吉之助さんのいとこの、大山弥助だ。\n私の大砲を見せてやる。'], ['oyama', '敵は一万五千。こっちは五千ばっかい。\n……じゃっどん、負くっ気はせんど。', '敵は一万五千。こちらは五千ほど。\n……だが、負ける気はしない。']]);
    await join('oyama', partyLv() + 1); meet('oyama');
    await interlude('伏見奉行所にて', async () => {
      await Q([
        ['hijikata', '薩摩の連中、洋式の銃をずらりと並べてやがる。'],
        ['hijikata', '……構うものか。新選組は、斬り込みで\n道を開いてきた。今度もそうするまでだ。'],
        ['hijikata', '全員、刀を抜け。\n――誠の旗のもとに、死ね。'],
      ]);
      meet('hijikata');
    });
    bgm('war');
    await kassen({
      title: '鳥羽・伏見の戦い', bg: 'field', goal: 'rout', themUnit: 'bakufusoldier', usUnit: 'satsumasoldier', usFx: 'boom', attackName: '砲撃する',
      us: { name: '薩摩・長州', troops: 5000, power: 230 }, them: { name: '旧幕府軍', troops: 15000, power: 560 }, themAttack: '旧幕府軍が 押し寄せる！', moraleDiv: 70,
      intro: '小枝橋で、薩摩の大砲が火を噴いた。戊辰戦争の始まりである！', rally: '大山「弥助砲、撃てぇ！」',
      tactics: [{ id: 'nishiki', name: '錦の御旗を掲げる', desc: '天皇の軍であることを示す旗。敵の士気を大きく下げる', msg: '新政府軍の陣に、錦の御旗がひるがえった！\n「官軍じゃ！ 我らは官軍ぞ！」\n旧幕府軍に動揺が走る！', morale: 40, rally: 20 }, { id: 'aim', name: '小枝橋の砲撃', desc: '次の攻撃で、敵の士気を大きく削る', msg: '大山「街道の敵を 狙い撃つっど！」', aim: 1 }],
    });
    flag('toba'); flag('nishiki'); chron('toba'); visit('toba');
    await Q(['旧幕府軍は崩れた。\n錦の御旗を見た諸藩は、次々と新政府軍についた。', ['oyama', 'こいは、錦の御旗の切れ端じゃ。\nお守りにせえ。', 'これは、錦の御旗の切れ端だ。\nお守りにしろ。']]);
    await give('nishiki');
    await N('【目的】東の伏見奉行所へ！ 新選組が まだ残っている。');
    refreshMap();
  },
  async hijikataBoss() {
    await S('hijikata', '……来たか、薩摩。\n刀で勝てぬなら、せめて意地を見せてやる。');
    await battle(['shinsengumi', 'hijikata', 'shinsengumi'], { bg: 'fire', noRun: true, boss: true });
    await Q([['hijikata', '……もう、刀や槍の時代ではないな。\nだが――俺は、北で戦い続ける。'], '土方歳三は、燃える奉行所を背に去っていった。', ['oyama', '……あん男、最後まで退かんかったな。', '……あの男、最後まで退かなかったな。']]);
    flag('hijikata');
    await STORY.ch5Start();
  },

  // ================= 第五章 =================
  async ch5Start() {
    await startChapter(5, '第五章　江戸へ', '慶応四年（1868年）三月\n江戸', 'edo', 17, 13, ['新政府軍は東へ進み、\n江戸の総攻撃は 三月十五日と決まった。', '百万の人が暮らす町が、火の海になろうとしていた。']);
    for (const id of G.party) lvUp(id, 22);
    await interlude('江戸城・大奥にて', async () => {
      await Q([
        ['atsuhime', '……私は、薩摩の島津家に生まれました。'],
        ['atsuhime', 'けれど今は、徳川の家の者です。\n徳川を守るためなら、生まれた家にも\n頭を下げましょう。'],
        ['katsu', '天璋院さま。西郷という男は、話の分かる男です。\nこの勝が、命に代えても話をつけてまいります。'],
      ]);
      meet('atsuhime'); meet('katsu');
    });
    await N('【目的】江戸の薩摩藩邸（田町・南東）にいる\n西郷さぁのもとへ向かおう。');
    save(); toast('自動で記録しました');
  },
  async katsuStreet() { await S('katsu', 'おや、薩摩のお若いの。\n西郷さんは藩邸かい？ おいらは勝ってもんだ。\nちょいと話をしに来たのさ。'); },
  async edoSaigo() {
    Audio8.cur = null; bgm('title');
    await Q(['三月十四日。薩摩藩邸――', ['katsu', '西郷さん。江戸を攻めれば、町は焼け、\n何十万の民が路頭に迷う。'], ['katsu', '徳川は、江戸城を明け渡す。\n慶喜公の命と、江戸の町だけは 助けてもらいたい。'], ['saigo', '…………。', '…………。']]);
    const c = await pickOne('saigo', '新八。おはんは、どげん思う。', '新八。君は、どう思う。', ['江戸を焼いてはなりもはん', '徳川を討たねば、新しか国はできもはん'], { w: 260 });
    if (c === 0) { addPt('jo', 2); await S('saigo', '……そうじゃな。', '……そうだな。'); }
    else { addPt('ri', 2); await S('saigo', '……そいも、一つの道じゃ。\nじゃっどん――', '……それも、一つの道だ。\nだが――'); }
    await Q([['saigo', '勝先生。お申し出の件、おいが一身に引き受けもす。\n明日の総攻撃は、取りやめもそ。', '勝先生。お申し出の件、私が一身に引き受けます。\n明日の総攻撃は、取りやめましょう。'], ['katsu', '……ありがてえ。西郷さん、恩に着るぜ。'], '江戸城は、戦うことなく明け渡されることになった。\n――江戸無血開城である。']);
    flag('muketsu'); chron('muketsu'); visit('satsumahantei');
    await Q([['saigo', 'じゃっどん、上野の寛永寺に 彰義隊ちゅう連中が\n立てこもって、町を荒らしちょる。', 'だが、上野の寛永寺に 彰義隊という者たちが\n立てこもって、町を荒らしている。'], ['saigo', 'おいも行っど。黒門口は、薩摩が攻める。', '私も行く。黒門口は、薩摩が攻める。']]);
    await leave('oyama', '大山は 砲隊を率いて 別の陣へ向かった。');
    await join('saigo', partyLv() + 1);
    await N('【目的】北の上野・寛永寺の黒門へ向かおう。');
  },
  async ueno() {
    flag('ueno'); Audio8.cur = null; bgm('war');
    await Q(['五月十五日、雨。上野――', ['saigo', '黒門口は、薩摩の持ち場じゃ。\nかかれぇ！', '黒門口は、薩摩の持ち場だ。\nかかれ！']]);
    await battle(['shogitai', 'shogitaiArmy', 'hatamoto'], { bg: 'town', noRun: true, boss: true });
    await Q(['激しい戦いは夕方まで続き、彰義隊は敗れた。\n――上野戦争である。']);
    flag('uenoEnd'); chron('ueno'); visit('ueno');
    await fadeOut(); bgm('ending');
    await still(['のちに――', 'この上野の山には、浴衣姿で犬を連れた\n西郷の銅像が建てられることになる。', 'その犬は、ツンがモデルだといわれている。'], 'town');
    SFX.play('bark');
    await fadeIn();
    await Q([['tsun', 'ワン？', '（ワン？）'], ['saigo', 'どげんした、ツン。……はは、腹が減ったか。', 'どうした、ツン。……はは、おなかがすいたか。'], ['saigo', '新八、おいは一度国へ戻る。\n北の戦は、弥助どんたちに任せっど。', '新八、私は一度国へ戻る。\n北の戦は、弥助さんたちに任せる。']]);
    await leave('saigo', '西郷は 鹿児島へ戻るため、一行を離れた。');
    await STORY.ch6Start();
  },

  // ================= 第六章 =================
  async ch6Start() {
    await startChapter(6, '第六章　北へ', '慶応四年（1868年）八月\n会津若松', 'aizu', 6, 22, ['戦は北へ広がった。', '新政府軍は、最後まで抵抗を続ける会津へ迫った。', '会津の人々は、鶴ヶ城に籠もった。']);
    for (const id of G.party) lvUp(id, 25);
    await join('oyama', partyLv() + 1, true);
    await Q([['oyama', '新八、待っちょったぞ。\n陣の指揮官に、挨拶してこい。', '新八、待っていたぞ。\n陣の指揮官に、挨拶してこい。']]);
    save(); toast('自動で記録しました');
  },
  async aizuCamp() {
    await Q([['commander', '会津の城は堅か。\n籠城して、もう一月近うになる。', '会津の城は堅い。\n籠城して、もう一か月近くになる。'], ['commander', '城の南の橋のあたりで、\n女子が銃を撃ってくっちゅう噂もある。', '城の南の橋のあたりで、\n女性が銃を撃ってくるという噂もある。']]);
    await interlude('鶴ヶ城の中で', async () => {
      await Q([
        ['yae', '父上から習った砲術……\n今こそ役に立てるとき。'],
        ['yae', '弟の三郎は、鳥羽伏見で死んだ。\nこの銃は、三郎の形見の服を着て撃つ。'],
        ['yae', '会津は、朝敵などではない。\n――最後の一発まで、戦ってみせる！'],
      ]);
      meet('yae');
    });
    flag('aizu6'); flag('aizuSiege'); refreshMap();
    await N('【目的】鶴ヶ城の南、堀にかかる橋へ向かおう。');
  },
  async yaeBoss() {
    await battle(['aizuho', 'yae', 'aizuhei2'], { bg: 'aizu', noRun: true, boss: true, intro: 'スペンサー銃を構えた女が 城の前に立ちはだかった！' });
    await Q(['女は傷ついた兵を背負い、城の中へと退いていった。', ['oyama', '……なんちゅう腕じゃ。\nあれが、会津の意地か。', '……なんという腕だ。\nあれが、会津の意地か。']]);
    flag('yae');
  },
  async tsurugajo() {
    await kassen({
      title: '鶴ヶ城の攻防', bg: 'aizu', goal: 'rout', themUnit: 'bakufusoldier', usUnit: 'govsoldier', usFx: 'boom', attackName: '砲撃する',
      us: { name: '新政府軍', troops: 3000, power: 250 }, them: { name: '鶴ヶ城の籠城兵', troops: 3000, power: 230 }, themAttack: '城の石垣から 銃火が走る！', moraleDiv: 28,
      intro: '一か月に及ぶ籠城。鶴ヶ城は、なお落ちない――',
      tactics: [{ id: 'odayama', name: '小田山から砲撃', desc: '城を見下ろす山から、大砲を撃ちこむ', msg: '大山「小田山から 撃ち下ろせぇ！」\n砲弾が 天守に命中した！', troops: 600, morale: 15 }, { id: 'aim', name: '城門を狙う', desc: '次の攻撃で敵の士気を大きく削る', msg: '「城門じゃ！ 城門を狙え！」', aim: 1 }],
    });
    await battle(['tsurugajo'], { bg: 'aizu', noRun: true, boss: true });
    flag('aizuEnd'); chron('aizu'); visit('tsurugajo');
    Audio8.cur = null; bgm('sad');
    await Q(['九月二十二日。鶴ヶ城に、白旗が上がった。', ['oyama', 'ぐっ……！', 'ぐっ……！'], ['senkichi', '弥助さぁ！ 脚を撃たれちょる！', '弥助さん！ 脚を撃たれている！'], ['oyama', '……すまん、新八。\nおいは、ここまでじゃ。', '……すまない、新八。\n私は、ここまでだ。']]);
    await leave('oyama', '大山弥助は 傷の手当てのため、一行を離れた。');
    await Q(['城下には、焼けた家と、泣く人々がいた。', '少し前、飯盛山では、城が燃えていると思いこんだ\n少年たちの隊――白虎隊が、自ら命を絶っていた。', ['senkichi', '……新八。勝った者も、負けた者も、\n同じ日本の人間じゃ。', '……新八。勝った者も、負けた者も、\n同じ日本の人間だ。'], ['senkichi', 'おいは……こげな戦がなか国を作りたか。\n二度と、こげな景色を見らんでよか国を。', 'おれは……こんな戦のない国を作りたい。\n二度と、こんな景色を見なくていい国を。']]);
    const c = await pickOne('shinpachi', null, null, ['……おいも同じじゃ、仙吉', '戦わんと、守れんもんもある'], { w: 240 });
    if (c === 0) { addPt('bond'); addPt('jo'); await S('senkichi', '……うん。', '……うん。'); } else { addPt('ri'); await S('senkichi', '……そうかもしれん。じゃっどん、おいは諦めん。', '……そうかもしれない。でも、おれは諦めない。'); }
    await STORY.ch7Start();
  },
};

// 母のひとこと（章ごと）
const HAHA = {
  0: ['稽古で疲れたら、いつでん帰ってきやんせ。', '稽古で疲れたら、いつでも帰ってきなさい。'],
  1: ['エゲレスの船が、湾いっぱいに並んじょっど……。', 'イギリスの船が、湾いっぱいに並んでいるよ……。'],
  2: ['吉之助さぁが帰ってきやったとね。\nよかった、よかった。', '吉之助さんが帰ってきたのね。\nよかった、よかった。'],
  3: ['京は寒かろう。体に気をつけてね。', '京は寒いでしょう。体に気をつけてね。'],
  8: ['おまえも、ずいぶん髪が短うなったねえ。\n……時代が変わったとよ。', 'あなたも、ずいぶん髪が短くなったねえ。\n……時代が変わったのよ。'],
};
