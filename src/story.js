'use strict';
// ===== ストーリー（会話・イベント） =====
const STORY = {
  // ---------------- 序章 ----------------
  async opening() {
    await card('序章　加治屋町の子', '安政五年（1858年）十一月\n薩摩国 鹿児島城下');
    await fadeIn();
    await N('薩摩の武士の子は、六、七歳になると\n「郷中（ごじゅう）」と呼ばれる仲間に入る。');
    await N('年上の者が年下を鍛え、学問と武芸、そして\n「負けるな、嘘をつくな、弱い者をいじめるな」を\n叩きこむ。');
    await N('ここは加治屋町。\n下級武士の家ばかりが並ぶ、小さな町――');
    await S('haha', '新八、いつまで寝ちょっとな。\n郷中の稽古が始まっど。');
    await S('haha', '仙吉どんが、家ん前で待っちょっが。\n早よ行きやんせ。');
    await N('【操作】矢印キー：移動　Z／Enter：決定・話す\nX／Esc：メニュー・戻る　Shift：走る');
  },
  async haha() {
    if (G.chapter === 1 && F('bombarded') && !F('hahaSafe')) {
      flag('hahaSafe');
      await S('haha', '新八！ 無事じゃったか……！');
      await S('haha', '家は焼けんかった。\n近所の衆と、火を消して回っちょったとよ。');
    }
    const line = G.chapter === 0 ? '稽古で疲れたら、いつでん帰ってきやんせ。'
      : F('bombarded') ? 'こげなときこそ、腹いっぱい食べんといかん。' : 'エゲレスの船が、湾いっぱいに並んじょっど……。';
    await S('haha', line);
    if (await ask('haha', '家で休んでいくな？')) await rest();
  },
  async senkichiJoin() {
    await S('senkichi', '遅かど、新八！\n二才頭（にせがしら）の先輩に怒らるっど！');
    await S('senkichi', '今日こそ立木打ちで、おはんに負けんど。\n稽古場は町の南西、生垣の中じゃ。');
    await join('senkichi', 1);
  },
  async senpai() {
    if (!F('senkichi')) { await S('senpai', 'ひとりか？ 仙吉はどげんした。\n郷中は、仲間と一緒に来っもんじゃ。'); return; }
    if (!F('tutorial')) {
      await S('senpai', '来たか、ちびども。');
      await S('senpai', '示現流は「一の太刀を疑わず、二の太刀は負け」じゃ。\n最初の一撃に、命を込めろ。');
      await S('senpai', '今日は、おいが相手をしてやる。\nかかってこい！');
      await N('【戦闘】「たたかう」で攻撃、「ぼうぎょ」で身を守る。\nHPが0になると倒れてしまう。');
      const r = await battle(['senpai'], { bg: 'dojo', canLose: true, noRun: true });
      restAll();
      if (r === 'lose') await S('senpai', '……まだまだじゃな。\nじゃっどん、目は死んじょらん。');
      else await S('senpai', '……ふん、悪くなか。');
      await S('senpai', 'よかか、新八。蜻蛉（とんぼ）に構え、\nただ一撃にすべてを込めっとじゃ。');
      await S('senpai', 'それが「チェスト」じゃ！');
      flag('tutorial'); SFX.play('learn');
      await N('新八は わざ「チェスト」を覚えた！\n（戦いの最初のターンに使うと、威力が2倍になる）');
      await S('senpai', 'そうじゃ、吉之助さぁが おはんらを探しちょったぞ。\n西郷家の前に行ってみれ。');
      return;
    }
    await S('senpai', F('rival') ? '高見馬場の連中を黙らせたげなな。\n噂になっちょっど。' : '負けるな、嘘をつくな、弱い者をいじめるな。\n郷中の教えを忘るっなよ。');
  },
  async saigo() {
    if (!F('tutorial')) { await S('saigo', 'おう、新八か。稽古はどげんした？\n早よ行け行け。'); return; }
    if (!F('quest')) {
      await S('saigo', '来たか、新八、仙吉。');
      await S('saigo', '……殿様（島津斉彬公）が亡くなられて、\nもう四月（よつき）になる。');
      await S('saigo', 'おいは殿様の後を追うて、腹を切ろうとした。\nじゃっどん、京の月照（げっしょう）さぁという\n坊様に止められた。');
      await S('saigo', '「殿の志を継ぐのが、おはんの役目じゃ」とな。');
      await S('saigo', 'その月照さぁが今、幕府に追われちょる。\nおいは薩摩で匿うてもらえるよう、\n藩に頼んじょるところじゃ。');
      await S('saigo', '……湿っぽか話はやめじゃ。頼みがある。');
      await S('saigo', '甲突川（こうつきがわ）の向こうで、\nよその郷中の若衆が暴れちょっ。\n町の者が困っちょっど。');
      await S('saigo', '喧嘩は売っな。じゃっどん、\n弱か者をいじめる奴からは、逃ぐっな。');
      await S('saigo', '町の東の橋を渡った先じゃ。行ってこい。');
      flag('quest'); return;
    }
    await S('saigo', '町の東、甲突川の橋を渡った先じゃ。\n無理はすっなよ。');
  },
  async okubo() {
    if (G.chapter === 0) {
      if (!F('quest')) { await S('okubo', '……新八か。おいは今、書を読んじょる。\n用がなかなら行け。'); return; }
      if (!F('okuboMoney')) {
        await S('okubo', '吉之助さぁから聞いた。……これを持っていけ。');
        await getMoney(50); flag('okuboMoney');
        await S('okubo', '木刀でも買うて来い。\n素手で勝てるほど、世の中は甘うなか。');
        return;
      }
      await S('okubo', 'おいたちは「精忠組（せいちゅうぐみ）」という\n仲間を作った。殿様の志は、おいたちが継ぐ。');
      return;
    }
    if (!F('ch1brief')) return STORY.okuboBrief();
    if (!F('euryalus')) { await S('okubo', '天保山の砲台は、町の南の浜を下った先じゃ。\n……死ぬなよ。'); return; }
    if (!F('ch1end')) return STORY.chapter1End();
    await S('okubo', '吉之助さぁを、島から呼び戻さんといかん。\n今の薩摩には、あん人が要る。');
  },
  async elder() {
    if (G.chapter === 0) await S('elder', '加治屋町は小さか町じゃが、\nなぜか骨のある若者が多か。');
    else if (F('bombarded')) await S('elder', '長生きはするもんじゃなか……。\n町が焼けるのを見るとはな。');
    else await S('elder', 'エゲレスの船は、風がなくても\n煙を吐いて進むげな。蒸気船ちゅうもんか。');
  },
  async woman() {
    if (G.chapter === 0) await S('woman', 'からいもは薩摩の宝じゃ。\n腹が減ったら、道具屋へ行きやんせ。');
    else await S('woman', '子どもたちは、山の方へ逃がしもした。\nおはんらも気をつけてな。');
  },
  async child() {
    if (G.chapter === 0) await S('child', 'チェストーッ！\nおいも大きゅうなったら、示現流を習うど！');
    else await S('child', 'エゲレスなんか、ぶった斬っど！\n……ほんとは、ちょっと怖か。');
  },
  async boy() { await S('boy', '立木打ちは、朝に三千、夕べに八千じゃ。\n手の皮がむけても、やめたらいかん。'); },
  async fisher() {
    if (G.chapter === 0) await S('fisher', '桜島は今日も煙を吐いちょる。\nあん山が静かな日は、何か起こっ日じゃ。');
    else if (!F('ch1end')) await S('fisher', '舟は全部、陸に上げた。\nエゲレスの船とは、大きさがまるで違う……。');
    else await S('fisher', 'エゲレスの船は去った。\n……海は、何もなかったような顔をしちょる。');
  },
  async rival() {
    if (!F('quest')) { await S('rival', 'なんじゃ、ちびども。\nここは高見馬場の郷中の縄張りじゃ。帰れ帰れ。'); return; }
    if (!F('rival')) {
      await S('rival', '加治屋町のちびか。\n西郷どんの使いで来たげなな。');
      await S('rival', '町のもんから、ちいと銭を借りただけじゃ。\n文句があっとなら、腕で来い！');
      await battle(['wakashu', 'taisho', 'wakashu'], { bg: 'field', noRun: true, boss: true });
      await S('rival', '……参った。おはんら、強かな。');
      await S('rival', 'もう町の者には手は出さん。\n郷中の名にかけて、約束すっ。');
      flag('rival');
      await S('senkichi', 'やったな、新八！\n吉之助さぁに知らせに戻っど！');
      return;
    }
    await S('rival', '加治屋町の新八……覚えちょっど。\nいつか、おはんと肩を並べて戦う日が\n来っかもしれん。');
  },
  async rivalkid() { await S('rivalkid', F('rival') ? '大将が負けるとこ、初めて見た……。' : '大将に逆らうと、怖かど。'); },
  async nightCall() {
    if (!F('rival') || F('gesshoQuest')) return;
    await fadeOut(); flag('gesshoQuest'); G.night = true; await fadeIn();
    await N('その夜――');
    await S('okubo', '新八！ 仙吉！ 探しちょったぞ！');
    await S('okubo', '……吉之助さぁが、月照さぁを連れて\n舟で錦江湾に出た。');
    await S('senkichi', 'こげな夜にですか？');
    await S('okubo', '藩は月照さぁを匿わんと決めた。\n「日向送り」……国境で斬れ、という意味じゃ。');
    await S('okubo', '吉之助さぁは……\n月照さぁと一緒に、死ぬつもりかもしれん。');
    await S('okubo', '町の南の道から浜に出らるっ。急げ！');
  },
  async gessho() {
    await N('冬の海に、十六夜（いざよい）の月が浮かんでいた。');
    await N('沖に一艘の小舟が見える。\n……舟の上に、二つの影が立ち上がった。');
    await S('senkichi', '新八！ あれ……！');
    SFX.play('splash'); shake();
    await N('――ザブン！！');
    await N('二つの影が、抱き合うように海へ落ちた。');
    while (true) {
      const c = await choose(['冬の海に飛び込む！', '……足がすくむ'], { x: 120, y: 110, w: 160, cancel: false });
      if (c === 0) break;
      await S('senkichi', '何をぼさっとしちょっとか、新八！');
    }
    SFX.play('splash'); await fadeOut();
    await N('新八は冬の海へ飛び込んだ。\n舟の者たちと一緒に、二人を引き上げる――');
    flag('gessho');
    await sleep(500); await fadeIn();
    await N('……月照は、二度と目を開けなかった。');
    await N('西郷吉之助だけが、息を吹き返した。');
    await S('saigo', '……おいだけ……生き残ってしもうたか……');
    await S('saigo', '月照さぁ……すまん……すまん……');
    await fadeOut();
    await N('藩は幕府に「西郷吉之助は死んだ」と届け出た。');
    await N('そして西郷は名を「菊池源吾」と変え、\n遠い南の島――奄美大島へ送られることになった。');
    G.night = false;
    await fadeIn();
    await N('数日後。夜明けの浜――');
    await S('saigo', '新八。おはんらに助けられた命じゃ。');
    await S('saigo', 'おいは一度死んだ。\nこいからの命は、天からの預かりもんじゃ。');
    await S('saigo', '……島へ行っど。いつか必ず戻っ。');
    await S('saigo', 'こいを持っちょけ。\nおいが若か頃に振っちょった木刀じゃ。');
    await give('saigobokuto');
    await S('saigo', '一蔵どん（大久保）を頼む。\nあいつは、ひとりで何でん背負い込むでな。');
    await N('西郷を乗せた船が、桜島の向こうへ消えていった。');
    await fadeOut();
    await N('それから、時は流れ――');
    await N('文久二年（1862年）。島から呼び戻された西郷は、\n藩の実権を握る島津久光とぶつかり、\nふたたび南の島・沖永良部島へ流された。');
    await N('同じ年、京の寺田屋では、\n薩摩の藩士同士が斬り合う悲劇が起きた。');
    await N('そして八月。江戸から帰る久光の行列を横切った\nイギリス人を、薩摩藩士が斬り殺した。\n――生麦事件である。');
    await N('イギリスは、犯人の引き渡しと賠償金を求めた。');
    await STORY.chapter1Start();
  },

  // ---------------- 第一章 ----------------
  async chapter1Start() {
    G.chapter = 1; G.night = false;
    enterMap('kajiya', 4, 12, 0);
    await card('第一章　錦江湾燃ゆ', '文久三年（1863年）六月\n鹿児島城下');
    await fadeIn();
    await N('五年の月日が流れ、新八は十七になった。');
    await N('文久三年六月二十七日。\n錦江湾に、七隻の黒い船が現れた。\n――イギリス艦隊である。');
    await S('haha', '新八……エゲレスの船が、湾いっぱいに並んじょっど。');
    await S('haha', '大久保さぁが、おはんを呼んじょったよ。\n大久保家の前じゃ。');
    save(); await N('（ここまでの冒険を 自動で記録しました）');
  },
  async okuboBrief() {
    await S('okubo', '来たか、新八、仙吉。');
    await S('okubo', 'イギリスは「生麦の下手人を差し出し、\n二万五千ポンドを払え」と言うてきた。');
    await S('okubo', 'そげな話、薩摩が呑むはずがなか。……戦になる。');
    await S('togo', '大久保さぁ！ おいも行かせてくいやんせ！');
    await S('okubo', '……こいつは東郷平八郎。\nこの町の、東郷家の倅じゃ。');
    await S('togo', '東郷平八郎、十五になりもした！\n砲術を習うちょります。\n大砲なら任せてくいやい！');
    await join('togo', Math.max(1, G.mem.shinpachi.lv - 1));
    await S('okubo', 'おはんらは天保山（てんぽうざん）の砲台へ行け。\n町の南の浜を下った先じゃ。');
    await S('okubo', 'こいで支度を整えよ。');
    await getMoney(300);
    await S('okubo', '……吉之助さぁがおらん今、\n薩摩は、おいたちで守るしかなか。');
    flag('ch1brief');
  },
  async togoWait() { await S('togo', '大久保さぁの話を、一緒に聞いてくいやんせ！'); },
  async seizure() {
    await N('七月二日、夜明け前。');
    await N('イギリス艦隊が、薩摩の蒸気船三隻\n――天佑丸・白鳳丸・青鷹丸を奪いにかかった！');
    await S('togo', '船が盗らるっど！');
    await S('senkichi', '行っど、新八！');
    await battle(['sailor', 'captain', 'sailor'], { bg: 'beach', noRun: true, boss: true });
    await N('新八たちは敵を押し返した。だが――');
    await N('三隻の蒸気船は沖へ引かれ、\n火を放たれて沈んでいった。');
    await S('togo', '……許さん。こいはもう、戦じゃ！');
    shake(); SFX.play('boom');
    await N('正午。嵐の中、天保山砲台が火を噴いた。\n――薩英戦争の始まりである。');
    flag('seizure');
    await N('（砲台の指揮官のもとへ向かおう）');
  },
  async commander() {
    if (G.chapter === 0) { await S('commander', 'ここは天保山の砲台じゃ。\n異国の船が来たら、ここから撃つ。'); return; }
    if (!F('seizure')) { await S('commander', 'まだ撃つなという命令じゃ。\n……ん？ 桟橋の方が騒がしか。\n見てきてくれんか。'); return; }
    if (!F('euryalus')) {
      await S('commander', '来たか！ 敵の旗艦が、\nこっちの射程に入ってきたぞ！');
      await S('commander', '嵐で敵の狙いも定まらん。\n今じゃ、撃て撃てぇ！！');
      await battle(['euryalus'], { bg: 'storm', noRun: true, boss: true });
      await N('薩摩の砲弾が、旗艦ユーリアラス号の艦橋を直撃した！');
      await N('艦長ジョスリング、副長ウィルモットが戦死。');
      await S('commander', 'やったぞ！ ……ようやった。\nこいを持っていけ。島津家の旗印じゃ。');
      await give('hatajirushi');
      shake(); SFX.play('boom');
      await N('しかし――');
      await N('イギリス艦隊のアームストロング砲とロケット弾は、\n薩摩の砲台を次々と打ち崩し、城下に火を放った。');
      await N('島津家の工場「集成館」も、炎に包まれた。');
      await S('togo', '町が……町が燃えちょっ！');
      await S('senkichi', 'おっかんたちが心配じゃ。\n加治屋町へ戻っど！');
      flag('euryalus'); flag('bombarded');
      return;
    }
    await S('commander', '砲台はほとんど崩された。\n……じゃっどん、薩摩は逃げんかった。');
  },
  async chapter1End() {
    await S('okubo', '……七月四日、イギリス艦隊は湾から去った。');
    await S('okubo', '砲台は崩され、城下では\n三百五十軒あまりの家が焼けた。');
    await S('okubo', 'じゃっどん、向こうの旗艦の艦長も討ち取った。\n薩摩は最後まで退かんかった。');
    await S('shinpachi', '……勝ったとですか、負けたとですか。');
    await S('okubo', '負けじゃ。じゃっどん、ただの負けじゃなか。');
    await S('okubo', 'あん大砲は、刀では斬れん。\nこいからは、異国から学ばんといかん。');
    await S('togo', '新八さぁ。おいは決めもした。');
    await S('togo', 'おいは海の男になりもす。\nいつか、あげな船を、薩摩……いや、\n日本の手で動かしてみせもす。');
    await leave('togo');
    await N('東郷平八郎はのちに海軍に進み、\n日本の連合艦隊を率いる提督となる――');
    await fadeOut();
    await N('戦いのあと、薩摩とイギリスは和解した。');
    await N('薩摩は「異国を打ち払え」という考えを捨て、\nイギリスと手を結び、新しい技術を学んでいく。');
    await N('二年後には、十九人の若者が\nひそかにイギリスへ渡ることになる。');
    flag('ch1end');
    await card('第一章　完', '次章　第二章「蛤御門」\n元治元年（1864年）――西郷、島より還る\n（制作中）');
    await fadeIn();
    if (await ask(null, 'ここまでの冒険を 記録しますか？')) { save(); await N('記録しました。'); }
  },
};
