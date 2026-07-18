/* ═══ Crumb Village ─ audio ═══
   Tiny synthesized SFX + an original lo-fi chiptune loop. No audio files.
   Music is OFF by default; both toggles live in the HUD. */

var AUD = (function () {
  var ctx = null;
  var master = null, musicGain = null, sfxGain = null;
  var soundOn = true, musicOn = false;
  var musicTimer = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = soundOn ? 1 : 0;
    sfxGain.connect(master);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
    if (musicOn) startMusic();
    return true;
  }

  /* One synthesized note. o: {f, f2, type, d, v, delay, dest} */
  function tone(o) {
    if (!ctx) return;
    var t0 = ctx.currentTime + (o.delay || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = o.type || "square";
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.d);
    var v = o.v || 0.12;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(v, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + o.d);
    osc.connect(g);
    g.connect(o.dest || sfxGain);
    osc.start(t0);
    osc.stop(t0 + o.d + 0.05);
  }

  function noise(o) {
    if (!ctx) return;
    var t0 = ctx.currentTime + (o.delay || 0);
    var len = Math.ceil(ctx.sampleRate * o.d);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var filt = ctx.createBiquadFilter();
    filt.type = o.hp ? "highpass" : "lowpass";
    filt.frequency.value = o.fc || 1200;
    var g = ctx.createGain();
    g.gain.setValueAtTime(o.v || 0.1, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + o.d);
    src.connect(filt); filt.connect(g); g.connect(sfxGain);
    src.start(t0);
  }

  /* ── Named SFX ── */
  var SFX = {
    click:   function () { tone({ f: 660, f2: 880, type: "square", d: 0.06, v: 0.06 }); },
    pop:     function () { tone({ f: 300, f2: 900, type: "square", d: 0.08, v: 0.1 }); },
    thud:    function () { tone({ f: 140, f2: 60, type: "triangle", d: 0.12, v: 0.2 }); },
    wobble:  function () { tone({ f: 220, f2: 180, type: "triangle", d: 0.1, v: 0.08 }); },
    coin:    function () { tone({ f: 990, type: "square", d: 0.07, v: 0.08 }); tone({ f: 1320, type: "square", d: 0.18, v: 0.08, delay: 0.07 }); },
    splash:  function () { noise({ d: 0.3, fc: 900, v: 0.12 }); tone({ f: 300, f2: 90, type: "sine", d: 0.25, v: 0.1 }); },
    knead:   function () { tone({ f: 180, f2: 90, type: "sine", d: 0.12, v: 0.18 }); noise({ d: 0.06, fc: 500, v: 0.05 }); },
    poof:    function () { noise({ d: 0.22, fc: 700, v: 0.14 }); },
    ding:    function () { tone({ f: 1047, type: "triangle", d: 0.4, v: 0.14 }); tone({ f: 1568, type: "triangle", d: 0.6, v: 0.1, delay: 0.12 }); },
    bake:    function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone({ f: f, type: "square", d: 0.16, v: 0.09, delay: i * 0.09 });
      });
    },
    collect: function () {
      [784, 988, 1319].forEach(function (f, i) {
        tone({ f: f, type: "square", d: 0.1, v: 0.09, delay: i * 0.06 });
      });
    },
    badge:   function () {
      [523, 523, 784, 1047].forEach(function (f, i) {
        tone({ f: f, type: "square", d: i === 3 ? 0.35 : 0.11, v: 0.1, delay: i * 0.11 });
      });
    },
    meow:    function () { tone({ f: 700, f2: 400, type: "sawtooth", d: 0.18, v: 0.05 }); },
    purr:    function () {
      for (var i = 0; i < 8; i++) tone({ f: 85, f2: 70, type: "triangle", d: 0.06, v: 0.14, delay: i * 0.07 });
    },
    quack:   function () { tone({ f: 300, f2: 200, type: "sawtooth", d: 0.09, v: 0.09 }); tone({ f: 260, f2: 170, type: "sawtooth", d: 0.1, v: 0.07, delay: 0.1 }); },
    creak:   function () { tone({ f: 90, f2: 130, type: "sawtooth", d: 0.35, v: 0.05 }); },
    door:    function () { tone({ f: 160, f2: 110, type: "triangle", d: 0.15, v: 0.12 }); tone({ f: 220, type: "triangle", d: 0.08, v: 0.06, delay: 0.12 }); },
    bell:    function () { tone({ f: 1760, type: "triangle", d: 0.3, v: 0.07 }); tone({ f: 2217, type: "triangle", d: 0.4, v: 0.05, delay: 0.05 }); },
    chime:   function () {
      [880, 660, 880, 1100].forEach(function (f, i) {
        tone({ f: f, type: "triangle", d: 0.4, v: 0.08, delay: i * 0.28 });
      });
    },
    serve:   function () { tone({ f: 1200, type: "triangle", d: 0.06, v: 0.08 }); tone({ f: 900, type: "triangle", d: 0.09, v: 0.06, delay: 0.07 }); },
    slurp:   function () { noise({ d: 0.18, fc: 2500, hp: true, v: 0.05 }); tone({ f: 250, f2: 400, type: "sine", d: 0.15, v: 0.06, delay: 0.05 }); },
    drum:    function () { tone({ f: 100, f2: 50, type: "sine", d: 0.18, v: 0.3 }); noise({ d: 0.08, fc: 3000, hp: true, v: 0.06 }); },
    strum:   function () {
      [196, 247, 294, 392].forEach(function (f, i) {
        tone({ f: f, type: "sawtooth", d: 0.5, v: 0.045, delay: i * 0.03 });
      });
    },
    key:     function (n) {
      var scale = [523, 587, 659, 784, 880, 1047];
      tone({ f: scale[(n || 0) % scale.length], type: "square", d: 0.25, v: 0.08 });
    },
    micTap:  function () { tone({ f: 200, f2: 190, type: "sine", d: 0.08, v: 0.2 }); tone({ f: 1400, type: "sine", d: 0.12, v: 0.03, delay: 0.09 }); },
    scratch: function () { noise({ d: 0.12, fc: 1800, hp: true, v: 0.07 }); noise({ d: 0.08, fc: 1200, hp: true, v: 0.05, delay: 0.14 }); },
    rustle:  function () { noise({ d: 0.18, fc: 4000, hp: true, v: 0.06 }); },
    crackle: function () {
      for (var i = 0; i < 4; i++) noise({ d: 0.04, fc: 2200, hp: true, v: 0.07, delay: i * 0.07 + Math.random() * 0.03 });
      tone({ f: 110, f2: 80, type: "triangle", d: 0.2, v: 0.08 });
    },
    sparkle: function () { tone({ f: 1568, type: "triangle", d: 0.12, v: 0.06 }); tone({ f: 2093, type: "triangle", d: 0.2, v: 0.05, delay: 0.08 }); },
    wiggle:  function () { tone({ f: 500, f2: 750, type: "square", d: 0.06, v: 0.05 }); tone({ f: 750, f2: 500, type: "square", d: 0.06, v: 0.05, delay: 0.06 }); },
    jingle:  function () {
      [659, 784, 988, 784, 1319].forEach(function (f, i) {
        tone({ f: f, type: "square", d: 0.13, v: 0.08, delay: i * 0.12 });
      });
    },
    whoosh:  function () { noise({ d: 0.25, fc: 500, v: 0.08 }); },
    switch:  function () { tone({ f: 800, type: "square", d: 0.03, v: 0.08 }); tone({ f: 500, type: "square", d: 0.04, v: 0.06, delay: 0.04 }); },
  };

  /* ── Secret song: a short original melody, played once when the band
     is triggered in the right order ── */
  function playSecretSong() {
    if (!ensure()) return;
    var mel = [
      [659, 0.0], [784, 0.18], [880, 0.36], [1047, 0.54],
      [880, 0.78], [784, 0.96], [880, 1.14], [1319, 1.44],
      [1175, 1.8], [1047, 1.98], [880, 2.16], [784, 2.4],
      [659, 2.64], [784, 2.82], [880, 3.0], [880, 3.3],
    ];
    mel.forEach(function (n) {
      tone({ f: n[0], type: "square", d: 0.22, v: 0.09, delay: n[1] });
      tone({ f: n[0] / 2, type: "triangle", d: 0.3, v: 0.06, delay: n[1] });
    });
    [131, 165, 196, 165].forEach(function (f, i) {
      tone({ f: f, type: "triangle", d: 0.7, v: 0.09, delay: i * 0.9 });
    });
  }

  /* ── Music loop ──
     Original cozy chiptune: Am / F / C / G, 76bpm, 4 bars, scheduled ahead. */
  var BPM = 76, STEP = 60 / BPM / 2; /* 8th notes */
  var bass = [110, 110, 87, 87, 131, 131, 98, 98]; /* per half-bar */
  var chords = [
    [220, 262, 330], [220, 262, 330], [175, 220, 262], [175, 220, 262],
    [131, 165, 196].map(function (f) { return f * 2; }), [262, 330, 392],
    [196, 247, 294], [196, 247, 294],
  ];
  var melody = [
    440, 0, 523, 0, 440, 392, 0, 330,
    349, 0, 440, 0, 523, 0, 440, 0,
    523, 0, 587, 523, 659, 0, 523, 0,
    494, 0, 392, 0, 440, 0, 0, 0,
  ];
  var nextStep = 0, stepIdx = 0;

  function scheduleMusic() {
    if (!ctx || !musicOn) return;
    while (nextStep < ctx.currentTime + 0.4) {
      var s = stepIdx % 32;
      var half = Math.floor(s / 4) % 8;
      /* bass on beat */
      if (s % 4 === 0) {
        tone({ f: bass[half], type: "triangle", d: STEP * 3.4, v: 0.1, delay: nextStep - ctx.currentTime, dest: musicGain });
      }
      /* soft chord shimmer off-beat */
      if (s % 8 === 4) {
        chords[half].forEach(function (f) {
          tone({ f: f, type: "sine", d: STEP * 3, v: 0.028, delay: nextStep - ctx.currentTime, dest: musicGain });
        });
      }
      /* melody */
      var m = melody[s];
      if (m) {
        tone({ f: m, type: "square", d: STEP * 1.6, v: 0.035, delay: nextStep - ctx.currentTime, dest: musicGain });
      }
      nextStep += STEP;
      stepIdx++;
    }
  }

  function startMusic() {
    if (!ctx) return;
    nextStep = ctx.currentTime + 0.1;
    stepIdx = 0;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setTargetAtTime(1, ctx.currentTime, 0.5);
    if (!musicTimer) musicTimer = setInterval(scheduleMusic, 150);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  }

  return {
    ensure: ensure,
    play: function (name, arg) {
      if (!soundOn) return;
      if (!ensure()) return;
      if (SFX[name]) SFX[name](arg);
    },
    playSecretSong: playSecretSong,
    setSound: function (on) {
      soundOn = on;
      if (ctx) sfxGain.gain.value = on ? 1 : 0;
    },
    setMusic: function (on) {
      musicOn = on;
      if (!on) { stopMusic(); return; }
      if (ensure()) startMusic();
    },
    get soundOn() { return soundOn; },
    get musicOn() { return musicOn; },
  };
})();
