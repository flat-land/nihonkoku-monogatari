'use strict';
// ===== 音（効果音・BGM）。音声ファイルを使わず、その場で合成する =====
const Audio8 = {
  ac: null, master: null, sfxGain: null, bgmGain: null, unlocked: false, cur: null, timer: null, step: 0, nextT: 0,
  vol: { bgm: .5, sfx: .8 },
  init() {
    if (this.ac) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain(); this.master.connect(this.ac.destination);
    this.sfxGain = this.ac.createGain(); this.sfxGain.connect(this.master);
    this.bgmGain = this.ac.createGain(); this.bgmGain.connect(this.master);
    this.setVol();
    this.noiseBuf = this.ac.createBuffer(1, this.ac.sampleRate, this.ac.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  },
  setVol() { if (!this.ac) return; this.sfxGain.gain.value = this.vol.sfx; this.bgmGain.gain.value = this.vol.bgm * .55; },
  // スマホ（特にiPhone）は、画面に触れた瞬間に音を解錠しないと鳴らない。
  // マナーモードでも鳴るよう、無音の<audio>を流して「再生」扱いにする。
  unlock() {
    this.init(); if (!this.ac) return;
    if (this.ac.state !== 'running') this.ac.resume();
    if (this.unlocked) return;
    this.unlocked = true;
    const b = this.ac.createBuffer(1, 1, 22050), s = this.ac.createBufferSource(); s.buffer = b; s.connect(this.ac.destination); s.start(0);
    try {
      const n = 4410, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
      const w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
      const a = document.createElement('audio'); a.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })); a.loop = true; a.setAttribute('playsinline', ''); a.volume = .01;
      a.play().catch(() => { });
    } catch (e) { }
    if (this.want) { const w = this.want; this.want = null; this.play(w); }
  },
  tone(f, dur, type = 'square', vol = .05, when = 0, slide = 0, out) {
    const c = this.ac; if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = (when > 1000 ? when : c.currentTime + when);
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(out || this.sfxGain); o.start(t); o.stop(t + dur + .05);
  },
  noise(dur, vol = .1, when = 0, freq = 1200, out, q = 1) {
    const c = this.ac; if (!c) return;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = (when > 1000 ? when : c.currentTime + when);
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || this.sfxGain); s.start(t, Math.random() * .5); s.stop(t + dur + .05);
  },
  sfx(n) {
    if (!this.ac || this.ac.state !== 'running') return;
    const T = (...a) => this.tone(...a), Nz = (...a) => this.noise(...a);
    const fx = {
      cur: () => T(1046, .03, 'square', .025), ok: () => { T(784, .05, 'square', .04); T(1175, .06, 'square', .03, .04); }, cancel: () => T(392, .07, 'square', .035), ng: () => T(130, .15, 'square', .05),
      slash: () => { Nz(.12, .3, 0, 3500, null, .7); T(1400, .08, 'sawtooth', .03, 0, -1100); },
      chest: () => { Nz(.2, .4, 0, 2500, null, .5); T(160, .25, 'sawtooth', .1, 0, -100); T(1800, .1, 'sawtooth', .04, 0, -1500); },
      gun: () => { Nz(.16, .5, 0, 900, null, .4); T(90, .12, 'square', .1, 0, -50); },
      boom: () => { Nz(.7, .6, 0, 300, null, .3); T(70, .6, 'sawtooth', .16, 0, -40); },
      hurt: () => { T(160, .16, 'sawtooth', .09, 0, -90); Nz(.1, .2, 0, 600); },
      kill: () => { T(400, .08, 'square', .06, 0, -300); T(200, .25, 'square', .05, .07, -150); Nz(.3, .15, .05, 500); },
      heal: () => [784, 988, 1175, 1568].forEach((f, i) => T(f, .18, 'triangle', .08, i * .06)),
      buff: () => [523, 659, 784, 1046, 1318].forEach((f, i) => T(f, .12, 'square', .03, i * .04)),
      miss: () => T(600, .1, 'triangle', .05, 0, -400),
      enc: () => { [523, 622, 784, 1046, 1244].forEach((f, i) => T(f, .07, 'square', .045, i * .035)); Nz(.3, .12, 0, 2000); },
      lvup: () => { [523, 659, 784, 1046].forEach((f, i) => T(f, .14, 'square', .05, i * .1)); T(1318, .5, 'square', .05, .42); T(659, .5, 'triangle', .07, .42); T(784, .5, 'triangle', .06, .42); },
      join: () => { [392, 523, 659, 784].forEach((f, i) => T(f, .12, 'square', .045, i * .09)); T(1046, .45, 'square', .05, .38); T(523, .45, 'triangle', .07, .38); },
      learn: () => [880, 1108, 1318, 1760].forEach((f, i) => T(f, .16, 'triangle', .07, i * .07)),
      item: () => { T(988, .08, 'square', .04); T(1318, .2, 'square', .04, .08); },
      coin: () => { T(1318, .05, 'square', .04); T(1760, .15, 'square', .04, .05); },
      door: () => { Nz(.18, .15, 0, 400); T(220, .1, 'triangle', .05); },
      step: () => Nz(.04, .05, 0, 900),
      splash: () => { Nz(.8, .4, 0, 700, null, .3); T(500, .5, 'triangle', .06, 0, -420); },
      fire: () => { for (let i = 0; i < 6; i++) Nz(.08, .12, i * .05 + Math.random() * .03, 1500 + Math.random() * 2000); },
      run: () => [880, 660, 440].forEach((f, i) => T(f, .06, 'square', .04, i * .05)),
      horse: () => { [0, .12, .3, .42].forEach(t => Nz(.06, .2, t, 500)); T(660, .3, 'sawtooth', .03, .5, 200); },
      quake: () => { Nz(1.2, .5, 0, 120, null, .3); },
      bark: () => { T(520, .07, 'sawtooth', .07, 0, -200); T(500, .09, 'sawtooth', .07, .14, -220); },
      win: () => { [659, 784, 1046].forEach((f, i) => T(f, .15, 'square', .05, i * .12)); T(1318, .6, 'square', .05, .36); T(784, .6, 'triangle', .07, .36); T(1046, .6, 'triangle', .05, .36); },
      bell: () => { T(392, 2.5, 'sine', .12); T(784, 2, 'sine', .05); T(1176, 1.5, 'sine', .03); },
      drum: () => { T(90, .25, 'sine', .25, 0, -40); Nz(.1, .2, 0, 300); },
    };
    (fx[n] || (() => { }))();
  },
  // ---- BGM：音符を並べた簡易シーケンサー ----
  play(name) {
    if (this.cur === name) return;
    this.cur = name;
    if (!this.ac || this.ac.state !== 'running') { this.want = name; return; }
    clearInterval(this.timer); this.timer = null;
    const tr = BGM_TRACKS[name]; if (!tr) return;
    this.track = tr; this.step = 0; this.nextT = this.ac.currentTime + .1;
    this.timer = setInterval(() => this.tick(), 50);
  },
  stop() { this.cur = null; this.want = null; clearInterval(this.timer); this.timer = null; },
  tick() {
    const tr = this.track, c = this.ac; if (!tr || !c) return;
    const stepDur = 60 / tr.bpm / 2;
    while (this.nextT < c.currentTime + .25) {
      for (const v of tr.voices) {
        const seq = v.seq, tok = seq[this.step % seq.length];
        if (tok && tok !== '-' && tok !== '.') {
          let len = 1; while (seq[(this.step + len) % seq.length] === '-' && len < 16) len++;
          if (v.drum) { if (tok === 'k') this.tone(80, .2, 'sine', v.vol * 3, this.nextT, -40, this.bgmGain); else if (tok === 's') this.noise(.12, v.vol * 2, this.nextT, 1800, this.bgmGain); else if (tok === 'h') this.noise(.04, v.vol, this.nextT, 7000, this.bgmGain); else if (tok === 't') this.tone(180, .15, 'sine', v.vol * 2.5, this.nextT, -60, this.bgmGain); }
          else this.tone(noteHz(tok), stepDur * len * (v.gate || .9), v.wave || 'square', v.vol, this.nextT, 0, this.bgmGain);
        }
      }
      this.step++; this.nextT += stepDur;
    }
  },
};
function noteHz(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n); if (!m) return 440;
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (m[3] - 4) * 12;
  return 440 * Math.pow(2, base / 12);
}
const sq = s => s.trim().split(/\s+/);
// 和の音階（都節・民謡音階）を中心に作曲
const BGM_TRACKS = {
  title: {
    bpm: 84, voices: [
      { wave: 'square', vol: .045, seq: sq('E5 - - - D5 - B4 - A4 - - - B4 - D5 - E5 - - - G5 - E5 - D5 - - - - - - - E5 - - - D5 - B4 - A4 - - - G4 - A4 - B4 - - - D5 - B4 - A4 - - - - - - -') },
      { wave: 'triangle', vol: .09, seq: sq('E3 - - - - - - - A2 - - - - - - - C3 - - - - - - - D3 - - - - - - - E3 - - - - - - - A2 - - - - - - - G2 - - - - - - - A2 - - - - - - -') },
      { drum: 1, vol: .05, seq: sq('k - - - - - - - t - - - - - - - k - - - - - - - t - - - t - t -') },
    ]
  },
  town: {
    bpm: 112, voices: [
      { wave: 'square', vol: .035, gate: .7, seq: sq('A4 - C5 D5 E5 - D5 C5 A4 - G4 - A4 - - - C5 - D5 E5 G5 - E5 D5 C5 - A4 - C5 - - - E5 - G5 - A5 - G5 E5 D5 - C5 - D5 - - - E5 D5 C5 - A4 - G4 - A4 - - - - - - -') },
      { wave: 'triangle', vol: .08, seq: sq('A2 - E3 - A2 - E3 - G2 - D3 - G2 - D3 - F2 - C3 - F2 - C3 - E2 - B2 - E2 - B2 - A2 - E3 - A2 - E3 - C3 - G3 - C3 - G3 - D3 - A3 - E3 - B2 - A2 - E3 - A2 - - -') },
      { drum: 1, vol: .04, seq: sq('k - h - t - h - k - h - t - h h') },
    ]
  },
  field: {
    bpm: 126, voices: [
      { wave: 'square', vol: .035, gate: .8, seq: sq('D5 - - E5 G5 - A5 - G5 - E5 - D5 - - - B4 - D5 - E5 - G5 - E5 - D5 - B4 - - - D5 - - E5 G5 - A5 - B5 - A5 - G5 - E5 - G5 - - - A5 G5 E5 D5 E5 - - - - -') },
      { wave: 'triangle', vol: .085, seq: sq('G2 - D3 - G3 - D3 - E2 - B2 - E3 - B2 - C3 - G3 - C3 - G3 - D3 - A3 - D3 - A3 -') },
      { drum: 1, vol: .045, seq: sq('k - h - s - h - k k h - s - h h') },
    ]
  },
  battle: {
    bpm: 168, voices: [
      { wave: 'square', vol: .04, gate: .75, seq: sq('E5 E5 G5 E5 A5 - G5 E5 D5 - E5 - B4 - - - E5 E5 G5 E5 B5 - A5 G5 E5 - G5 - A5 - - - C6 - B5 A5 G5 - E5 - D5 E5 G5 - E5 - - - D5 - E5 G5 A5 - B5 A5 G5 - E5 - E5 - - -') },
      { wave: 'sawtooth', vol: .03, seq: sq('E2 E3 E2 E3 E2 E3 E2 E3 G2 G3 G2 G3 A2 A3 B2 B3 E2 E3 E2 E3 E2 E3 E2 E3 C3 C4 C3 C4 D3 D4 B2 B3') },
      { drum: 1, vol: .05, seq: sq('k h s h k k s h k h s h k s s s') },
    ]
  },
  boss: {
    bpm: 150, voices: [
      { wave: 'square', vol: .04, gate: .9, seq: sq('E4 - - - F4 - - - E4 - D4 - B3 - - - E4 - - - G4 - - - A4 - G4 - F4 - - - E5 - D5 - C5 - B4 - A4 - - - F4 - - - E4 - F4 - A4 - B4 - C5 - B4 - - - - - - -') },
      { wave: 'sawtooth', vol: .035, seq: sq('E2 - E2 E2 E2 - E2 E2 F2 - F2 F2 F2 - F2 F2 E2 - E2 E2 E2 - E2 E2 D2 - D2 D2 B1 - C2 D2') },
      { drum: 1, vol: .06, seq: sq('k - s - k k s - k - s - k s t t') },
    ]
  },
  sad: {
    bpm: 66, voices: [
      { wave: 'triangle', vol: .09, seq: sq('E5 - - - F5 - E5 - C5 - - - B4 - - - A4 - - - B4 - C5 - B4 - - - - - - - E5 - - - F5 - A5 - G5 - F5 - E5 - - - C5 - B4 - A4 - - - - - - - - - - -') },
      { wave: 'sine', vol: .08, seq: sq('A2 - - - E3 - - - F2 - - - C3 - - - D2 - - - A2 - - - E2 - - - B2 - - - A2 - - - E3 - - - F2 - - - C3 - - - D2 - - - E2 - - - A2 - - - - - - -') },
    ]
  },
  war: {
    bpm: 132, voices: [
      { wave: 'square', vol: .035, gate: .6, seq: sq('E4 . E4 . F4 . E4 . E4 . E4 . B3 . C4 . E4 . E4 . F4 . A4 . G4 . F4 . E4 . . .') },
      { wave: 'sawtooth', vol: .03, seq: sq('E2 - - - E2 - - - F2 - - - E2 - - -') },
      { drum: 1, vol: .06, seq: sq('k . . k t . k . k . . k t t t t') },
    ]
  },
  kyoto: {
    bpm: 90, voices: [
      { wave: 'triangle', vol: .09, seq: sq('D5 - Eb5 - G5 - - - A5 - G5 - Eb5 - D5 - Bb4 - - - A4 - - - D5 - - - - - - - G5 - A5 - Bb5 - A5 - G5 - Eb5 - D5 - - - Eb5 - D5 - Bb4 - A4 - - - D4 - - - - - - -') },
      { wave: 'sine', vol: .07, seq: sq('D3 - - - A3 - - - G2 - - - D3 - - - Bb2 - - - F3 - - - A2 - - - D3 - - -') },
      { drum: 1, vol: .03, seq: sq('t - - - - - - - - - - - t - t -') },
    ]
  },
  night: {
    bpm: 72, voices: [
      { wave: 'sine', vol: .08, seq: sq('B4 - - - - - E5 - - - D5 - B4 - - - A4 - - - - - B4 - G4 - E4 - - - - - B4 - - - - - E5 - - - G5 - F#5 - - - E5 - - - D5 - B4 - - - - - - - - - - -') },
      { wave: 'triangle', vol: .06, seq: sq('E2 - - - - - - - E2 - - - - - - - C2 - - - - - - - D2 - - - - - - -') },
    ]
  },
  ending: {
    bpm: 76, voices: [
      { wave: 'triangle', vol: .1, seq: sq('E5 - - - D5 - E5 - G5 - - - A5 - - - G5 - E5 - D5 - B4 - D5 - - - - - - - E5 - - - D5 - E5 - G5 - - - A5 - B5 - A5 - G5 - E5 - G5 - - - - - - - - - - -') },
      { wave: 'square', vol: .025, seq: sq('B4 - G4 - B4 - G4 - E5 - C5 - E5 - C5 - D5 - B4 - D5 - B4 - B4 - G4 - B4 - G4 -') },
      { wave: 'sine', vol: .09, seq: sq('G2 - - - - - - - C3 - - - - - - - D3 - - - - - - - G2 - - - - - - -') },
    ]
  },
};
