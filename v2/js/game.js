/* ═══ Crumb Village ─ game ═══
   Main loop, input, camera, particles, multiplayer rendering, the cat,
   progression wiring. Loads last; everything else is already defined. */

var GAME = {}; /* public API for world.js props */
var FX = {};   /* particle helpers */

(function () {
  "use strict";

  /* ────────────────────────────── boot ── */
  var cv = document.getElementById("game");
  var g = cv.getContext("2d");
  var SC = CV.SCALE;
  var vw = 0, vh = 0;             /* viewport in art px */
  var cam = { x: 0, y: 0 };
  var camCentered = false;
  var mx = -100, my = -100;       /* pointer, CSS px */
  var wx = 0, wy = 0;             /* my avatar, world art px */
  var pointerIn = false;
  var time = 0, lastTs = 0;

  var bg = document.createElement("canvas");
  bg.width = WORLD.W; bg.height = WORLD.H;
  WORLD.paintStatic(bg.getContext("2d"));

  /* ── Scenes ──
     The village is one scene; each building interior is its own little map
     you walk into. A scene owns its size, background, and prop list. */
  var outdoorScene = { id: "outdoor", W: WORLD.W, H: WORLD.H, bg: bg, props: WORLD.props, outdoor: true };
  var scene = outdoorScene;
  var roomCache = {};

  var vignette = null;

  function resize() {
    vw = Math.ceil(window.innerWidth / SC);
    vh = Math.ceil(window.innerHeight / SC);
    cv.width = vw; cv.height = vh;
    g.imageSmoothingEnabled = false;
    vignette = document.createElement("canvas");
    vignette.width = vw; vignette.height = vh;
    var vg = vignette.getContext("2d");
    var grad = vg.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.36, vw / 2, vh / 2, Math.max(vw, vh) * 0.72);
    grad.addColorStop(0, "rgba(4,6,12,0)");
    grad.addColorStop(1, "rgba(4,6,12,0.55)");
    vg.fillStyle = grad;
    vg.fillRect(0, 0, vw, vh);
  }
  window.addEventListener("resize", resize);
  resize();

  /* spawn looking at the village square */
  if (!camCentered) {
    camCentered = true;
    cam.x = WORLD.fountain.x - vw / 2;
    cam.y = WORLD.fountain.y - vh / 2;
  }

  /* ────────────────────────────── state ── */
  GAME.flags = {
    coins: 0,
    lampOff: {},
    spotlight: false,
    houseLights: true,
    treeShake: 0,
    wellReady: false,
    sackPoofs: 0,
  };

  var revealed = {};        /* baguette trigger flags */
  var stageRepoNames = [];  /* for the Critic badge */
  var ripples = { fountain: [], pond: [] };
  var floaters = [];        /* emotes floating up */
  var parts = [];           /* particles */
  var fireflies = [];
  var oven = { p: SAVE.data.ovenP || 0, shownP: 0, loaves: SAVE.data.loaves, contributed: false, lastKnead: 0, serverLoaves: null };
  var visitorsTotal = null;
  var wiggleUntil = 0;
  var hoverProp = null, hoverBag = null;
  var instrumentSeq = [];
  var camVel = { x: 0, y: 0 };

  /* ────────────────────────────── tiny DOM helpers ── */
  function el(id) { return document.getElementById(id); }
  var tooltipEl = el("tooltip"), toastsEl = el("toasts"), overlayEl = el("overlay");
  var zoneTagEl = el("zone-tag"), campersEl = el("campers"), campersN = el("campers-n");
  var bagCounterEl = el("bag-counter"), bagCountEl = el("bag-count");

  function showToast(title, sub, icon) {
    var t = document.createElement("div");
    t.className = "toast";
    if (icon) t.appendChild(scaleSprite(icon, 2));
    var span = document.createElement("span");
    var b = document.createElement("span");
    b.className = "t-title";
    b.textContent = title + " ";
    span.appendChild(b);
    span.appendChild(document.createTextNode(sub || ""));
    t.appendChild(span);
    toastsEl.appendChild(t);
    setTimeout(function () { t.classList.add("gone"); }, 3600);
    setTimeout(function () { t.remove(); }, 4400);
  }

  /* ────────────────────────────── particles ── */
  function spawn(p) {
    if (parts.length > (CV.RM ? 120 : 300)) return;
    p.age = 0;
    parts.push(p);
  }

  function burst(x, y, n, opts) {
    n = CV.RM ? Math.ceil(n / 2) : n;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = (opts.speed || 30) * (0.4 + Math.random() * 0.8);
      spawn({
        x: x, y: y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - (opts.up || 0),
        grav: opts.grav || 0, life: (opts.life || 0.7) * (0.7 + Math.random() * 0.6),
        color: opts.colors[(Math.random() * opts.colors.length) | 0],
        size: opts.size || 1, spr: opts.spr || null,
      });
    }
  }

  FX.burst = burst;
  FX.dust = function (x, y) { burst(x, y, 6, { colors: [PAL.path2, PAL.sand], speed: 18, up: 10, grav: 40, life: 0.5 }); };
  FX.crumbs = function (x, y) { burst(x, y, 8, { colors: [PAL.bread1, PAL.bread2, PAL.bread0], speed: 26, up: 24, grav: 90, life: 0.7 }); };
  FX.steam = function (x, y) { burst(x, y, 5, { colors: ["#cfd6e4", "#9aa4bc"], speed: 6, up: 18, grav: -6, life: 1.1 }); };
  FX.sparkle = function (x, y) { burst(x, y, 8, { colors: [PAL.glow1, PAL.glow2, PAL.gold2], speed: 22, life: 0.6 }); };
  FX.leaves = function (x, y) { burst(x, y, 8, { colors: [PAL.grass2, PAL.grass3, PAL.grass1], speed: 20, up: 14, grav: 32, life: 0.9 }); };
  FX.notes = function (x, y) { burst(x, y - 4, 3, { colors: ["x"], speed: 8, up: 22, grav: -4, life: 1.1, spr: SPR.em_note }); };
  FX.flour = function (x, y) { burst(x, y, 10, { colors: [PAL.white, PAL.sand, "#cfc8b8"], speed: 20, up: 16, grav: 14, life: 0.8 }); };
  FX.envelope = function (x, y) { burst(x, y, 1, { colors: ["x"], speed: 2, up: 26, grav: 20, life: 1, spr: null, size: 0 }); spawn({ x: x, y: y, vx: 0, vy: -26, grav: 24, life: 1, color: PAL.cream, size: 3 }); };
  FX.smokePuff = function (x, y) { burst(x, y, 4, { colors: ["#5a6178", "#454b60"], speed: 5, up: 12, grav: -8, life: 1.6, size: 2 }); };
  FX.hearts = function (x, y) { burst(x, y - 4, 3, { colors: ["x"], speed: 10, up: 20, grav: -4, life: 1.2, spr: SPR.em_heart }); };
  FX.stars = function (x, y) { burst(x, y, 5, { colors: ["x"], speed: 16, up: 12, grav: 10, life: 0.8, spr: SPR.star }); };
  FX.confetti = function (x, y) {
    burst(x, y, 26, { colors: [PAL.orange, PAL.glow1, PAL.red, PAL.blue, PAL.pink, PAL.gold2], speed: 46, up: 40, grav: 70, life: 1.4 });
  };
  FX.breadPop = function (x, y) {
    for (var i = 0; i < 3; i++) {
      spawn({ x: x, y: y, vx: (i - 1) * 18, vy: -55 - Math.random() * 12, grav: 110, life: 1.3, color: "x", spr: SPR.loaf });
    }
    FX.confetti(x, y - 6);
  };
  FX.ring = function (x, y) { ripples.fountain.push({ x: x, y: y, t: 0, free: true }); };
  FX.starRain = function (x0, x1, y) {
    var n = CV.RM ? 10 : 26;
    for (var i = 0; i < n; i++) {
      spawn({ x: x0 + Math.random() * (x1 - x0), y: y - 60 - Math.random() * 30, vx: (Math.random() - 0.5) * 6, vy: 20 + Math.random() * 18, grav: 6, life: 2.2, color: "x", spr: SPR.star });
    }
  };

  function updateParts(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.age += dt;
      if (p.age >= p.life) { parts.splice(i, 1); continue; }
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function drawParts(gg) {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var a = 1 - p.age / p.life;
      gg.globalAlpha = a < 0.4 ? a / 0.4 : 1;
      if (p.spr) gg.drawImage(p.spr, p.x - p.spr.width / 2, p.y - p.spr.height / 2);
      else if (p.size) { gg.fillStyle = p.color; gg.fillRect(p.x, p.y, p.size, p.size); }
      gg.globalAlpha = 1;
    }
  }

  /* ripples */
  GAME.ripple = function (key, x, y) { ripples[key].push({ x: x, y: y, t: 0 }); };
  GAME.drawRipples = function (gg, key) {
    var arr = ripples[key];
    for (var i = arr.length - 1; i >= 0; i--) {
      var r = arr[i];
      if (r.t > 1) { arr.splice(i, 1); continue; }
      gg.globalAlpha = 1 - r.t;
      gg.strokeStyle = key === "fountain" && r.free ? PAL.glow1 : PAL.water2;
      gg.lineWidth = 1;
      gg.beginPath();
      gg.arc(r.x, r.y, 2 + r.t * 12, 0, Math.PI * 2);
      gg.stroke();
      gg.globalAlpha = 1;
    }
  };

  /* fireflies */
  (function initFireflies() {
    var n = CV.RM ? 10 : 22;
    for (var i = 0; i < n; i++) {
      var area = WORLD.fireflyAreas[i % WORLD.fireflyAreas.length];
      fireflies.push({
        ax: area[0], ay: area[1], aw: area[2], ah: area[3],
        x: area[0] + Math.random() * area[2], y: area[1] + Math.random() * area[3],
        seed: Math.random() * 100,
      });
    }
  })();

  /* ────────────────────────────── audio + HUD toggles ── */
  var btnSound = el("btn-sound"), btnMusic = el("btn-music");
  AUD.setSound(SAVE.data.sound);
  AUD.setMusic(false); /* music starts only after a gesture; restored below */

  function syncAudioBtns() {
    btnSound.classList.toggle("on", AUD.soundOn);
    btnMusic.classList.toggle("on", AUD.musicOn);
  }
  btnSound.addEventListener("click", function () {
    AUD.setSound(!AUD.soundOn);
    SAVE.data.sound = AUD.soundOn; SAVE.commit();
    syncAudioBtns();
  });
  btnMusic.addEventListener("click", function () {
    AUD.setMusic(!AUD.musicOn);
    SAVE.data.music = AUD.musicOn; SAVE.commit();
    syncAudioBtns();
  });
  syncAudioBtns();

  var firstGesture = false;
  function onFirstGesture() {
    if (firstGesture) return;
    firstGesture = true;
    AUD.ensure();
    if (SAVE.data.music) { AUD.setMusic(true); syncAudioBtns(); }
  }

  /* ────────────────────────────── country flags ── */
  var flagCache = {};
  var emojiFlagsOK = (function () {
    try {
      var c = document.createElement("canvas");
      c.width = c.height = 20;
      var cg = c.getContext("2d");
      cg.font = "16px sans-serif";
      cg.fillText("🇦🇪", 0, 16);
      var d = cg.getImageData(0, 0, 20, 20).data;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 40) {
          var mx1 = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          if (mx1 - mn > 40) return true; /* found a saturated pixel: real flag */
        }
      }
    } catch (_) {}
    return false;
  })();

  function flagFor(cc) {
    if (!cc || cc === "??") return null;
    if (flagCache[cc]) return flagCache[cc];
    var c = document.createElement("canvas");
    var cg = c.getContext("2d");
    if (emojiFlagsOK && /^[A-Z]{2}$/.test(cc)) {
      c.width = 14; c.height = 12;
      var em = String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65, 0x1F1E6 + cc.charCodeAt(1) - 65);
      cg.font = "10px sans-serif";
      cg.textBaseline = "top";
      cg.fillText(em, 1, 1);
    } else {
      c.width = 13; c.height = 9;
      cg.fillStyle = "rgba(11,14,26,0.85)";
      cg.fillRect(0, 0, 13, 9);
      cg.fillStyle = PAL.glow1;
      cg.font = "bold 7px monospace";
      cg.fillText(cc.slice(0, 2), 2, 7);
    }
    flagCache[cc] = c;
    return c;
  }

  /* ────────────────────────────── avatar drawing ── */
  function drawHat(gg, hatId, x, y) {
    if (!hatId || !HATS[hatId]) return;
    var s = SPR[HATS[hatId].spr];
    /* perched right on the cursor tip */
    gg.drawImage(s, Math.round(x - s.width / 2 + 3), Math.round(y - s.height + 2));
  }

  function drawAvatar(gg, x, y, cc, hatId, jitter) {
    var jx = 0, jy = 0;
    if (jitter && !CV.RM) {
      jx = (Math.random() - 0.5) * 3;
      jy = (Math.random() - 0.5) * 3;
    }
    x = Math.round(x + jx); y = Math.round(y + jy);
    gg.drawImage(SPR.cursor, x, y);
    var f = flagFor(cc);
    if (f) gg.drawImage(f, x - 2, y + SPR.cursor.height + 1);
    drawHat(gg, hatId, x, y);
  }

  /* ────────────────────────────── input ── */
  var moveHist = [];      /* wiggle detection */
  var lastWiggle = 0;
  var downAt = null;      /* {x, y, t} for click-vs-drag */
  var longPressTimer = null;
  var emoteOpen = false;

  function screenToWorld(sx, sy) { return [cam.x + sx / SC, cam.y + sy / SC]; }

  cv.addEventListener("pointermove", function (e) {
    mx = e.clientX; my = e.clientY;
    var w0 = screenToWorld(mx, my);
    wx = w0[0]; wy = w0[1];
    pointerIn = true;
    onFirstGesture();

    /* wiggle detection: direction reversals in a short window */
    var now = performance.now();
    moveHist.push({ x: e.clientX, t: now });
    while (moveHist.length && now - moveHist[0].t > 400) moveHist.shift();
    if (moveHist.length > 4 && now - lastWiggle > 900) {
      var flips = 0, lastSign = 0;
      for (var i = 1; i < moveHist.length; i++) {
        var dx = moveHist[i].x - moveHist[i - 1].x;
        if (Math.abs(dx) < 3) continue;
        var s = dx > 0 ? 1 : -1;
        if (lastSign && s !== lastSign) flips++;
        lastSign = s;
      }
      if (flips >= 4) {
        lastWiggle = now;
        doWiggle();
      }
    }
    if (longPressTimer && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 10) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  cv.addEventListener("pointerleave", function () { pointerIn = false; });

  cv.addEventListener("pointerdown", function (e) {
    onFirstGesture();
    mx = e.clientX; my = e.clientY;
    pointerIn = true;
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (emoteOpen) return;
    if (CV.TOUCH) {
      longPressTimer = setTimeout(function () {
        longPressTimer = null;
        openEmoteMenu(mx, my);
      }, 480);
    }
  });

  cv.addEventListener("pointerup", function (e) {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    if (emoteOpen) { closeEmoteMenu(); return; }
    if (!downAt) return;
    var moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    var held = performance.now() - downAt.t;
    downAt = null;
    if (moved < 9 && held < 600) handleClick(e.clientX, e.clientY);
  });

  cv.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    onFirstGesture();
    if (emoteOpen) closeEmoteMenu();
    else openEmoteMenu(e.clientX, e.clientY);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeEmoteMenu();
      closePanels();
      if (!scene.outdoor) GAME.exitRoom();
    }
  });

  /* ────────────────────────────── hit testing ── */
  function propAt(wxp, wyp) {
    var best = null, bestArea = Infinity;
    for (var i = 0; i < scene.props.length; i++) {
      var p = scene.props[i];
      if (wxp >= p.x && wxp <= p.x + p.w && wyp >= p.y && wyp <= p.y + p.h) {
        var area = p.w * p.h;
        if (area < bestArea) { best = p; bestArea = area; }
      }
    }
    return best;
  }

  function baguetteAt(wxp, wyp) {
    for (var i = 0; i < WORLD.baguettes.length; i++) {
      var b = WORLD.baguettes[i];
      if (SAVE.hasBaguette(b.id)) continue;
      if (b.hidden && !revealed[b.hidden]) continue;
      if (wxp >= b.x - 3 && wxp <= b.x + 17 && wyp >= b.y - 3 && wyp <= b.y + 9) return b;
    }
    return null;
  }

  function handleClick(sx, sy) {
    var w = screenToWorld(sx, sy);
    if (scene.outdoor) {
      var bag = baguetteAt(w[0], w[1]);
      if (bag) { collectBaguette(bag.id, bag.x, bag.y); return; }
    }
    var p = propAt(w[0], w[1]);
    if (p && p.onClick) { p.onClick(p, w[0], w[1]); return; }
    /* clicking nothing still does a little something */
    AUD.play("click");
    FX.dust(w[0], w[1] + 6);
  }

  /* ────────────────────────────── tooltip ── */
  var tipShownFor = null;
  function updateTooltip() {
    var target = hoverBag ? { tip: "A baguette?!", sub: "Take it before someone else does" } : hoverProp;
    if (!target || !pointerIn) {
      if (tipShownFor) { tooltipEl.hidden = true; tipShownFor = null; }
      return;
    }
    if (tipShownFor !== target) {
      tipShownFor = target;
      var sub = typeof target.sub === "function" ? target.sub() : target.sub;
      tooltipEl.innerHTML = "";
      var t1 = document.createElement("div");
      t1.className = "tt-title";
      t1.textContent = target.tip;
      tooltipEl.appendChild(t1);
      if (sub) {
        var t2 = document.createElement("div");
        t2.className = "tt-sub";
        t2.textContent = sub;
        tooltipEl.appendChild(t2);
      }
      tooltipEl.hidden = false;
    }
    var tx = Math.min(mx + 18, window.innerWidth - tooltipEl.offsetWidth - 8);
    var ty = Math.min(my + 18, window.innerHeight - tooltipEl.offsetHeight - 8);
    tooltipEl.style.left = tx + "px";
    tooltipEl.style.top = ty + "px";
  }

  /* ────────────────────────────── emotes ── */
  var EMOTES = ["wave", "heart", "zzz", "bang", "note"];
  var emoteMenuEl = el("emote-menu");

  (function buildEmoteMenu() {
    EMOTES.forEach(function (k, i) {
      var b = document.createElement("button");
      b.className = "emote-btn";
      var a = -Math.PI / 2 + i * (Math.PI * 2 / EMOTES.length);
      b.style.left = Math.cos(a) * 54 + "px";
      b.style.top = Math.sin(a) * 54 + "px";
      b.appendChild(scaleSprite(SPR["em_" + k], 3));
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        sendEmote(k);
        closeEmoteMenu();
      });
      emoteMenuEl.appendChild(b);
    });
  })();

  function openEmoteMenu(sx, sy) {
    emoteOpen = true;
    emoteMenuEl.style.left = sx + "px";
    emoteMenuEl.style.top = sy + "px";
    emoteMenuEl.hidden = false;
    AUD.play("pop");
  }
  function closeEmoteMenu() {
    emoteOpen = false;
    emoteMenuEl.hidden = true;
  }
  document.addEventListener("pointerdown", function (e) {
    if (emoteOpen && !emoteMenuEl.contains(e.target) && e.target !== cv) closeEmoteMenu();
  });

  function sendEmote(k) {
    floaters.push({ x: wx, y: wy, k: k, t: 0 });
    AUD.play("pop");
    NET.sendEmote(k);
    if (NET.online && NET.others.size > 0) earnBadge("socialite");
  }

  function doWiggle() {
    wiggleUntil = performance.now() + 500;
    AUD.play("wiggle");
    if (!CV.RM) FX.stars(wx + 4, wy + 2);
    NET.sendWiggle();
    /* wiggling over the cat = petting */
    if (cat.img && Math.abs(wx - cat.x) < 22 && Math.abs(wy - cat.y) < 22) petCat();
  }

  function drawFloaters(gg, dt) {
    for (var i = floaters.length - 1; i >= 0; i--) {
      var f = floaters[i];
      f.t += dt;
      if (f.t > 1.4) { floaters.splice(i, 1); continue; }
      var s = SPR["em_" + f.k];
      if (!s) continue;
      gg.globalAlpha = f.t < 1 ? 1 : 1 - (f.t - 1) / 0.4;
      gg.drawImage(s, Math.round(f.x + 6 - s.width / 2), Math.round(f.y - 10 - f.t * 16));
      gg.globalAlpha = 1;
    }
  }

  /* ────────────────────────────── ducks ── */
  var ducks = [
    { x: 380, y: 990, vx: 4, vy: 1.6, dartT: 0, scared: false },
    { x: 445, y: 1016, vx: -4, vy: -1.2, dartT: 0, scared: false },
  ];

  ducks.forEach(function (d, i) {
    WORLD.props.push({
      id: "duck" + i, zone: "park", x: 0, y: 0, w: 18, h: 16, duck: d,
      tip: "Duck", sub: "Seems busy",
      draw: function (gg) {
        gg.save();
        gg.translate(Math.round(d.x), Math.round(d.y));
        if (d.vx < 0) { gg.scale(-1, 1); gg.translate(-18, 0); }
        gg.drawImage(scaleCache(SPR.duck, 2), 0, 0);
        gg.restore();
      },
      onClick: function () {
        AUD.play("quack");
        d.dartT = 0.5;
        GAME.ripple("pond", d.x + 9, d.y + 14);
        if (!d.scared) {
          d.scared = true;
          GAME.reveal("duck");
        }
      },
    });
  });

  var scaleCacheMap = new Map();
  function scaleCache(spr, n) {
    var key = spr.width + "x" + spr.height + "@" + n;
    if (!scaleCacheMap.has(key)) scaleCacheMap.set(key, scaleSprite(spr, n));
    return scaleCacheMap.get(key);
  }

  function updateDucks(dt) {
    var P = WORLD.pond;
    ducks.forEach(function (d, i) {
      var speed = d.dartT > 0 ? 6 : 1;
      d.dartT = Math.max(0, d.dartT - dt);
      d.x += d.vx * speed * dt * (d.dartT > 0 ? 8 : 1);
      d.y += d.vy * speed * dt * (d.dartT > 0 ? 8 : 1);
      /* stay in the pond */
      var nx = (d.x + 9 - P.x) / (P.rx - 12), ny = (d.y + 8 - P.y) / (P.ry - 10);
      if (nx * nx + ny * ny > 1) {
        d.vx = -d.vx + (Math.random() - 0.5);
        d.vy = -d.vy + (Math.random() - 0.5);
        d.x += d.vx * 2 * dt * 8;
        d.y += d.vy * 2 * dt * 8;
      }
      /* occasionally wander */
      if (Math.random() < dt * 0.2) { d.vx = (Math.random() - 0.5) * 8; d.vy = (Math.random() - 0.5) * 4; }
      var prop = WORLD.props.find(function (p) { return p.id === "duck" + i; });
      if (prop) { prop.x = d.x; prop.y = d.y; }
    });
  }

  /* ────────────────────────────── oneko NPC ── */
  var cat = {
    img: null, x: 320, y: 950, tx: 320, ty: 950,
    frame: 0, idleTime: 0, idleAnim: null, idleFrame: 0,
    tickAcc: 0, moving: false, wanderT: 0,
  };

  (function loadCat() {
    var img = new Image();
    img.onload = function () { cat.img = img; };
    img.src = "../oneko.gif";
  })();

  var CAT_SPRITES = {
    idle: [[-3, -3]], alert: [[-7, -3]],
    scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
    tired: [[-3, -2]], sleeping: [[-2, 0], [-2, -1]],
    N: [[-1, -2], [-1, -3]], NE: [[0, -2], [0, -3]], E: [[-3, 0], [-3, -1]],
    SE: [[-5, -1], [-5, -2]], S: [[-6, -3], [-7, -2]], SW: [[-5, -3], [-6, -1]],
    W: [[-4, -2], [-4, -3]], NW: [[-1, 0], [-1, -1]],
  };
  var catSprite = CAT_SPRITES.idle[0];
  var catFrameCount = 0;

  WORLD.props.push({
    id: "cat", zone: "park", x: 0, y: 0, w: 30, h: 28,
    tip: "oneko", sub: "The village cat. Wiggle to pet.",
    draw: function () {}, /* drawn separately, above props */
    onClick: function () { AUD.play("meow"); FX.hearts(cat.x, cat.y - 14); },
  });

  function nearestCursorToCat() {
    var best = null, bestD = 140;
    if (pointerIn) {
      var d = Math.hypot(wx - cat.x, wy - cat.y);
      if (d < bestD) { bestD = d; best = [wx, wy]; }
    }
    NET.others.forEach(function (o) {
      if (!o.has) return;
      var d = Math.hypot(o.x - cat.x, o.y - cat.y);
      if (d < bestD) { bestD = d; best = [o.x, o.y]; }
    });
    return best;
  }

  function setCatSprite(name, frame) {
    var set = CAT_SPRITES[name] || CAT_SPRITES.idle;
    catSprite = set[frame % set.length];
  }

  function catTick() {
    catFrameCount++;
    var target = nearestCursorToCat();
    if (target) { cat.tx = target[0]; cat.ty = target[1]; cat.wanderT = 0; }
    else {
      cat.wanderT += 0.14;
      if (cat.wanderT > 7 && Math.random() < 0.02) {
        var B = WORLD.catBounds;
        cat.tx = B[0] + Math.random() * B[2];
        cat.ty = B[1] + Math.random() * B[3];
        cat.wanderT = 0;
      }
    }

    var dx = cat.x - cat.tx, dy = cat.y - cat.ty;
    var dist = Math.hypot(dx, dy);

    if (dist < 40) {
      cat.moving = false;
      cat.idleTime++;
      if (cat.idleTime > 10 && Math.random() < 0.005 && !cat.idleAnim) {
        cat.idleAnim = Math.random() < 0.5 ? "sleeping" : "scratchSelf";
        cat.idleFrame = 0;
      }
      if (cat.idleAnim === "sleeping") {
        setCatSprite(cat.idleFrame < 8 ? "tired" : "sleeping", (cat.idleFrame / 4) | 0);
        if (cat.idleFrame > 160) cat.idleAnim = null, cat.idleFrame = 0;
        cat.idleFrame++;
      } else if (cat.idleAnim === "scratchSelf") {
        setCatSprite("scratchSelf", cat.idleFrame);
        if (cat.idleFrame > 9) cat.idleAnim = null, cat.idleFrame = 0;
        cat.idleFrame++;
      } else {
        setCatSprite("idle", 0);
      }
      return;
    }

    cat.idleAnim = null;
    cat.idleFrame = 0;
    if (cat.idleTime > 1) {
      cat.moving = false;
      setCatSprite("alert", 0);
      cat.idleTime = Math.min(cat.idleTime, 7) - 1;
      return;
    }

    var dir = "";
    if (dy / dist > 0.5) dir += "N";
    if (dy / dist < -0.5) dir += "S";
    if (dx / dist > 0.5) dir += "W";
    if (dx / dist < -0.5) dir += "E";
    setCatSprite(dir || "idle", catFrameCount);
    cat.moving = true;
  }

  function updateCat(dt) {
    cat.tickAcc += dt * 1000;
    if (cat.tickAcc > 140) { cat.tickAcc = 0; catTick(); }
    if (cat.moving) {
      var dx = cat.tx - cat.x, dy = cat.ty - cat.y;
      var dist = Math.hypot(dx, dy);
      if (dist > 40) {
        var step = Math.min(46 * dt, dist - 40);
        cat.x += dx / dist * step;
        cat.y += dy / dist * step;
      }
      var B = WORLD.catBounds;
      cat.x = Math.max(B[0], Math.min(B[0] + B[2], cat.x));
      cat.y = Math.max(B[1], Math.min(B[1] + B[3], cat.y));
    }
    var prop = WORLD.props.find(function (p) { return p.id === "cat"; });
    if (prop) { prop.x = cat.x - 15; prop.y = cat.y - 14; }
  }

  function drawCat(gg) {
    if (!cat.img) return;
    gg.drawImage(cat.img, -catSprite[0] * 32, -catSprite[1] * 32, 32, 32,
      Math.round(cat.x - 16), Math.round(cat.y - 16), 32, 32);
  }

  var lastPet = 0;
  function petCat() {
    var now = Date.now();
    if (now - lastPet < 1800) return;
    lastPet = now;
    AUD.play("purr");
    FX.hearts(cat.x, cat.y - 14);
    SAVE.data.pets++;
    SAVE.commit();
    if (SAVE.data.pets >= 5) earnBadge("catperson");
  }

  /* ────────────────────────────── oven ── */
  GAME.kneadOven = function () {
    var now = Date.now();
    if (now - oven.lastKnead < 240) return;
    oven.lastKnead = now;
    oven.contributed = true;
    AUD.play("knead");
    FX.flour(WORLD.oven.x + 23, WORLD.oven.y + 26);
    if (NET.online) {
      NET.sendKnead();
    } else {
      oven.p += 6;
      if (oven.p >= 100) soloBake();
      SAVE.data.ovenP = Math.min(oven.p, 100);
      SAVE.commit();
    }
  };

  function soloBake() {
    oven.p = 0;
    oven.loaves = ++SAVE.data.loaves;
    SAVE.data.ovenP = 0;
    SAVE.commit();
    bakeParty();
  }

  function bakeParty() {
    AUD.play("bake");
    setTimeout(function () { AUD.play("ding"); }, 500);
    FX.breadPop(WORLD.oven.x + 23, WORLD.oven.y + 20);
    if (oven.contributed) earnBadge("firstloaf");
    if (oven.contributed && GAME.allLampsOff && GAME.allLampsOff()) earnBadge("moonbaker");
    oven.contributed = false;
  }

  GAME.drawOven = function (gg, t, x, y) {
    var p = oven.shownP;
    /* fire in the mouth */
    var flick = CV.RM ? 0.5 : 0.4 + Math.abs(Math.sin(t * 7 + Math.sin(t * 13))) * 0.6;
    var inten = 0.25 + (p / 100) * 0.75;
    px(gg, x + 15, y + 28, 16, 7, "rgba(226,87,30," + (0.5 + inten * 0.4) + ")");
    px(gg, x + 17 + Math.sin(t * 9) * 2, y + 24, 5, 5, "rgba(255,184,77," + flick * inten + ")");
    px(gg, x + 24 + Math.cos(t * 8) * 2, y + 25, 4, 4, "rgba(255,217,138," + flick * inten + ")");
    /* progress bar */
    if (p > 0.5) {
      px(gg, x + 3, y - 8, 40, 5, PAL.ink);
      px(gg, x + 4, y - 7, 38, 3, PAL.night2);
      px(gg, x + 4, y - 7, Math.max(1, Math.round(38 * p / 100)), 3, p > 90 ? PAL.glow1 : PAL.orange);
    }
    var loaves = NET.online && oven.serverLoaves !== null ? oven.serverLoaves : oven.loaves;
    PAINT.label(gg, x + 23, y + 46, loaves + (loaves === 1 ? " loaf" : " loaves"), PAL.glow1);
  };

  GAME.loafLine = function () {
    var loaves = NET.online && oven.serverLoaves !== null ? oven.serverLoaves : oven.loaves;
    return loaves + (loaves === 1 ? " loaf" : " loaves") + " baked by visitors" + (NET.online ? "" : " (this browser)");
  };

  /* ────────────────────────────── misc prop logic ── */
  GAME.flags.lampOff = {};

  GAME.tossCoin = function () {
    GAME.flags.coins++;
    AUD.play("coin");
    var f = WORLD.fountain;
    spawn({ x: f.x - 20, y: f.y - 24, vx: 28, vy: -40, grav: 160, life: 0.75, color: "x", spr: SPR.coin });
    setTimeout(function () {
      AUD.play("splash");
      GAME.ripple("fountain", f.x + (Math.random() - 0.5) * 16, f.y + (Math.random() - 0.5) * 8);
    }, 620);
    var total = SAVE.addCoin();
    if (total >= 10 && !SAVE.data.secrets.wish) {
      SAVE.data.secrets.wish = true;
      SAVE.commit();
      setTimeout(function () {
        AUD.play("sparkle");
        FX.starRain(f.x - 30, f.x + 30, f.y - 10);
        FX.ring(f.x, f.y);
        earnBadge("wishmaker");
        showToast("A wish granted", "The fountain keeps your secret. (10 coins in.)", SPR.coin);
      }, 700);
    }
  };

  GAME.sackPoof = function (p) {
    AUD.play("poof");
    FX.flour(p.x + 10, p.y + 6);
    GAME.flags.sackPoofs++;
    if (GAME.flags.sackPoofs >= 3) GAME.reveal("sack");
  };

  GAME.reveal = function (key) {
    if (revealed[key]) return;
    revealed[key] = true;
    AUD.play("sparkle");
  };
  GAME.revealed = function (key) { return !!revealed[key]; };

  /* ── Lamps → the constellation ──
     Turn every lamp off and the sky answers. A crumb-shaped constellation
     glows in over the village until a lamp is lit again. */
  var CONSTELLATION = [
    [712, 128], [740, 104], [772, 94], [806, 90],
    [840, 96], [870, 112], [890, 136], [806, 66],
  ];
  function allLampsOff() {
    for (var i = 0; i < WORLD.lamps.length; i++) {
      if (!GAME.flags.lampOff[i]) return false;
    }
    return true;
  }
  GAME.allLampsOff = allLampsOff;
  GAME.checkLamps = function () {
    if (allLampsOff() && !SAVE.data.secrets.lamps) {
      SAVE.data.secrets.lamps = true;
      SAVE.commit();
      earnBadge("lamplighter");
      showToast("Lights out", "The village sleeps — look up", SPR.star);
    }
  };

  GAME.shakeTree = function (p) {
    AUD.play("rustle");
    GAME.flags.treeShake = 0.4;
    FX.leaves(186, 790);
    GAME.reveal("tree");
  };

  GAME.wellClick = function () {
    if (!GAME.flags.wellReady) {
      GAME.flags.wellReady = true;
      AUD.play("creak");
      FX.dust(WORLD.well.x + 13, WORLD.well.y + 14);
      return;
    }
    AUD.play("whoosh");
    SAVE.data.secrets.well = true;
    SAVE.commit();
    GAME.openPanel("panel-well");
  };

  GAME.instrumentHit = function (id) {
    instrumentSeq.push(id);
    if (instrumentSeq.length > 4) instrumentSeq.shift();
    if (instrumentSeq.join(",") === "drum,keys,guitar,mic" && !SAVE.data.secrets.song) {
      SAVE.data.secrets.song = true;
      SAVE.commit();
      AUD.playSecretSong();
      var s = WORLD.stagePlat;
      FX.starRain(s.x, s.x + s.w, s.y);
      GAME.flags.spotlight = true;
      earnBadge("encore");
    }
  };

  GAME.hasPlayed = function (name) { return SAVE.data.played.indexOf(name) !== -1; };

  GAME.playRepo = function (p) {
    AUD.play("jingle");
    GAME.flags.spotlight = true;
    FX.sparkle(p.x + 11, p.y + 15);
    SAVE.addPlayed(p.repo.name);
    checkCritic();
    GAME.openLink(p.repo.html_url);
  };

  function checkCritic() {
    if (!stageRepoNames.length) return;
    var all = stageRepoNames.every(function (n) { return SAVE.data.played.indexOf(n) !== -1; });
    if (all) earnBadge("critic");
  }

  GAME.serve = function (p, url) {
    AUD.play("serve");
    spawn({ x: p.x + p.w / 2, y: p.y, vx: 14, vy: -22, grav: 70, life: 0.8, color: "x", spr: SPR.cup });
    GAME.openLink(url);
  };

  GAME.openLink = function (url) {
    if (url.indexOf("mailto:") === 0) { window.location.href = url; return; }
    window.open(url, "_blank", "noopener");
  };

  /* Dubai time, cached per half-minute */
  var dubaiCache = { at: 0, h: 0, m: 0, str: "" };
  function refreshDubai() {
    var now = Date.now();
    if (now - dubaiCache.at < 30000) return;
    dubaiCache.at = now;
    try {
      var s = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Dubai",
      }).format(new Date());
      dubaiCache.str = s;
      var parts2 = s.split(":");
      dubaiCache.h = +parts2[0]; dubaiCache.m = +parts2[1];
    } catch (_) {
      var d = new Date();
      dubaiCache.h = d.getUTCHours() + 4; dubaiCache.m = d.getUTCMinutes();
      dubaiCache.str = ("0" + (dubaiCache.h % 24)).slice(-2) + ":" + ("0" + dubaiCache.m).slice(-2);
    }
  }
  GAME.dubaiTime = function () { refreshDubai(); return { h: dubaiCache.h, m: dubaiCache.m }; };
  GAME.dubaiClock = function () { refreshDubai(); return dubaiCache.str; };

  /* ────────────────────────────── baguettes ── */
  function bagCount() { return SAVE.data.bag.length; }

  function updateBagCounter() {
    if (bagCount() === 0) return;
    bagCounterEl.hidden = false;
    bagCountEl.textContent = bagCount() + "/" + CV.BAGUETTE_TOTAL;
    if (!el("bag-ico").firstChild) el("bag-ico").appendChild(scaleSprite(SPR.baguette, 2));
  }

  function collectBaguette(id, x, y) {
    if (!SAVE.addBaguette(id)) return;
    AUD.play("collect");
    if (x !== undefined) { FX.crumbs(x + 7, y + 2); FX.sparkle(x + 7, y + 2); }
    if (bagCount() === 1) showToast("A baguette!", "There are " + CV.BAGUETTE_TOTAL + " hiding around the village", SPR.baguette);
    updateBagCounter();
    checkHatUnlocks();
    if (bagCount() >= CV.BAGUETTE_TOTAL) {
      FX.confetti(wx, wy);
      showToast("All " + CV.BAGUETTE_TOTAL + " baguettes!", "The crown is yours. Visit the hat shop.", SPR.hat_crown);
    }
  }
  GAME.collect = collectBaguette;

  function drawBaguettes(gg, t) {
    hoverBag = null;
    for (var i = 0; i < WORLD.baguettes.length; i++) {
      var b = WORLD.baguettes[i];
      if (SAVE.hasBaguette(b.id)) continue;
      if (b.hidden && !revealed[b.hidden]) continue;
      gg.drawImage(SPR.baguette, b.x, b.y);
      /* occasional glint so they are findable */
      if (!CV.RM && ((t * 0.35 + i * 0.7) % 3) < 0.1) {
        gg.drawImage(SPR.star, b.x + 5, b.y - 5);
      }
      if (pointerIn && wx >= b.x - 3 && wx <= b.x + 17 && wy >= b.y - 3 && wy <= b.y + 9) hoverBag = b;
    }
  }

  /* ────────────────────────────── badges + hats ── */
  var badgeIcons = {}; /* id -> sprite for toasts */
  Object.keys(BADGES).forEach(function (id) { badgeIcons[id] = SPR.medal; });

  var prevHatUnlocks = {};
  Object.keys(HATS).forEach(function (id) { prevHatUnlocks[id] = HATS[id].unlock(SAVE.data); });

  function earnBadge(id) {
    if (!SAVE.earnBadge(id)) return;
    AUD.play("badge");
    showToast("Badge: " + BADGES[id].name, BADGES[id].desc, badgeIcons[id]);
    renderBadgeList();
    checkHatUnlocks();
  }
  GAME.earnBadge = earnBadge;

  function checkHatUnlocks() {
    Object.keys(HATS).forEach(function (id) {
      var now = HATS[id].unlock(SAVE.data);
      if (now && !prevHatUnlocks[id]) {
        prevHatUnlocks[id] = true;
        showToast("Hat unlocked: " + HATS[id].name, "Claim it at the hat shop", SPR[HATS[id].spr]);
      }
    });
  }

  function renderBadgeList() {
    var list = el("badge-list");
    list.innerHTML = "";
    Object.keys(BADGES).forEach(function (id) {
      var earned = !!SAVE.data.badges[id];
      var d = document.createElement("div");
      d.className = "badge" + (earned ? "" : " locked");
      d.appendChild(scaleSprite(SPR.medal, 2));
      var txt = document.createElement("div");
      var secret = !!BADGES[id].secret;
      var n = document.createElement("div");
      n.className = "b-name";
      n.textContent = earned || !secret ? BADGES[id].name : "???";
      var ds = document.createElement("div");
      ds.className = "b-desc";
      ds.textContent = earned ? BADGES[id].desc : secret ? "Secret" : BADGES[id].desc;
      txt.appendChild(n); txt.appendChild(ds);
      d.appendChild(txt);
      list.appendChild(d);
    });
  }

  function renderHatGrid() {
    var grid = el("hat-grid");
    grid.innerHTML = "";
    Object.keys(HATS).forEach(function (id) {
      var h = HATS[id];
      var unlocked = h.unlock(SAVE.data);
      var card = document.createElement("button");
      card.className = "hat-card" + (unlocked ? "" : " locked") + (SAVE.data.hat === id ? " worn" : "");
      card.appendChild(scaleSprite(SPR[h.spr], 3));
      var n = document.createElement("span");
      n.className = "h-name";
      n.textContent = unlocked ? h.name : "???";
      card.appendChild(n);
      var c = document.createElement("span");
      c.className = "h-cond";
      c.textContent = unlocked ? (SAVE.data.hat === id ? "Wearing" : "Wear it") : h.cond;
      card.appendChild(c);
      if (unlocked) {
        card.addEventListener("click", function () {
          SAVE.data.hat = SAVE.data.hat === id ? "" : id;
          SAVE.commit();
          NET.sendHat(SAVE.data.hat);
          AUD.play("pop");
          renderHatGrid();
        });
      }
      grid.appendChild(card);
    });
  }

  /* ────────────────────────────── panels ── */
  function openPanel(id) {
    overlayEl.hidden = false;
    Array.prototype.forEach.call(document.querySelectorAll(".cv-panel"), function (p) {
      p.hidden = p.id !== id;
    });
    if (id === "panel-hats") renderHatGrid();
    if (id === "panel-notice") {
      renderBadgeList();
      var vline = el("visitors-line");
      if (visitorsTotal !== null) {
        vline.hidden = false;
        vline.textContent = visitorsTotal + " visitors have wandered through";
      }
    }
    if (id === "panel-well") {
      el("well-baguette").classList.toggle("taken", SAVE.hasBaguette("b15"));
    }
    var pk = { "panel-house": "house", "panel-hats": "hats", "panel-well": "well" }[id];
    if (pk) markInterior(pk);
  }
  GAME.openPanel = openPanel;

  /* records which of the five interiors you've stepped into → Explorer */
  function markInterior(key) {
    SAVE.addInterior(key);
    var need = ["bakery", "cafe", "house", "hats", "well"];
    if (need.every(function (k) { return SAVE.data.interiors.indexOf(k) !== -1; })) {
      earnBadge("explorer");
    }
  }

  /* ══════════════════════════════ interior rooms ══
     Each building has a real interior scene you walk into (world.js paints
     it and lists its props). enterRoom swaps the active scene; exitRoom
     drops you back where you were standing outside. */
  function getRoom(id) {
    if (roomCache[id]) return roomCache[id];
    var def = WORLD.rooms[id];
    var c = document.createElement("canvas");
    c.width = def.W; c.height = def.H;
    def.paint(c.getContext("2d"));
    roomCache[id] = {
      id: id, W: def.W, H: def.H, bg: c,
      props: def.props, lights: def.lights, label: def.label, outdoor: false,
    };
    return roomCache[id];
  }

  var returnCam = { x: 0, y: 0 };
  var roomZoneTimer = null;
  var leaveBtn = el("leave-room");
  if (leaveBtn) leaveBtn.addEventListener("click", function () { GAME.exitRoom(); });

  function flashZone(text) {
    zoneTagEl.textContent = text;
    zoneTagEl.hidden = false;
    zoneTagEl.classList.add("show");
    clearTimeout(roomZoneTimer);
    roomZoneTimer = setTimeout(function () { zoneTagEl.classList.remove("show"); }, 2000);
  }

  var BAKERY_SPECIALS = [
    "Sourdough, proofed overnight while the cat supervised.",
    "Cardamom buns. Recipe's a secret (it's just cardamom).",
    "Day-old baguettes: now with character.",
    "Cinnamon knots, slightly wrong on purpose.",
    "Cursor-shaped shortbread. Uncanny. Delicious.",
  ];
  var bakerySpecial = BAKERY_SPECIALS[0];
  GAME.bakerySpecial = function () { return bakerySpecial; };

  GAME.enterRoom = function (id) {
    if (!WORLD.rooms || !WORLD.rooms[id] || !scene.outdoor) return;
    returnCam.x = cam.x; returnCam.y = cam.y;
    scene = getRoom(id);
    cam.x = scene.W / 2 - vw / 2;
    cam.y = scene.H / 2 - vh / 2;
    camVel.x = camVel.y = 0;
    hoverProp = null; hoverBag = null;
    closeEmoteMenu();
    if (id === "bakery") bakerySpecial = BAKERY_SPECIALS[(Math.random() * BAKERY_SPECIALS.length) | 0];
    markInterior(id);
    flashZone(scene.label);
    if (leaveBtn) leaveBtn.hidden = false;
  };

  GAME.exitRoom = function () {
    if (scene.outdoor) return;
    AUD.play("door");
    scene = outdoorScene;
    cam.x = returnCam.x; cam.y = returnCam.y;
    camVel.x = camVel.y = 0;
    hoverProp = null;
    if (leaveBtn) leaveBtn.hidden = true;
  };

  /* interior interaction state (session-scoped; badges persist) */
  var TREATS = ["loaf", "baguette", "croissant", "cookie", "cupcake", "donut", "pretzel"];
  var DRINKS = ["espresso", "latte", "cocoa", "chai", "icedtea"];
  var tasted = {}, ordered = {}, booksRead = {};
  var BOOK_TOTAL = 5;

  GAME.tasteTreat = function (id) {
    AUD.play("pop");
    if (tasted[id]) return;
    tasted[id] = true;
    if (TREATS.every(function (t) { return tasted[t]; })) earnBadge("sweettooth");
  };
  GAME.isTasted = function (id) { return !!tasted[id]; };

  GAME.orderDrink = function (id, sfx) {
    AUD.play(sfx || "slurp");
    if (ordered[id]) return;
    ordered[id] = true;
    if (DRINKS.every(function (t) { return ordered[t]; })) earnBadge("caffeinated");
  };
  GAME.isOrdered = function (id) { return !!ordered[id]; };

  GAME.readBook = function (idx, url) {
    AUD.play("rustle");
    booksRead[idx] = true;
    if (Object.keys(booksRead).length >= BOOK_TOTAL) earnBadge("bookworm");
    if (url) GAME.openLink(url);
  };
  GAME.isRead = function (idx) { return !!booksRead[idx]; };

  var juke = { idx: 0, until: 0, label: "" };
  var JUKE_TRACKS = ["crumbwave", "lo-fi loaves", "3am in dubai", "night shift", "oneko's theme"];
  GAME.playJuke = function () {
    AUD.play(juke.idx % 2 ? "chime" : "jingle");
    juke.label = JUKE_TRACKS[juke.idx % JUKE_TRACKS.length];
    juke.idx++;
    juke.until = performance.now() + 2600;
  };
  GAME.jukeState = function () {
    return { playing: performance.now() < juke.until, label: juke.label };
  };

  var mouseHideUntil = 0, mouseFound = false;
  GAME.mouseSqueak = function () {
    AUD.play("wiggle");
    mouseHideUntil = performance.now() + 1600;
    if (!mouseFound) {
      mouseFound = true;
      showToast("Eek!", "A flour-dusted mouse skitters off behind the ovens", SPR.mouse);
    }
  };
  GAME.mouseHidden = function () { return performance.now() < mouseHideUntil; };

  function closePanels() { overlayEl.hidden = true; }

  overlayEl.addEventListener("pointerdown", function (e) {
    if (e.target === overlayEl) closePanels();
  });
  Array.prototype.forEach.call(document.querySelectorAll(".panel-close"), function (b) {
    b.addEventListener("click", closePanels);
  });

  /* house shelf — every tool is a real tool now: click for its story */
  (function buildShelf() {
    var TECHS = [
      ["tool_hammer", "JavaScript", "the one that started it all."],
      ["tool_wrench", "TypeScript", "JavaScript that went to finishing school."],
      ["tool_screwdriver", "Go", "for when the bots need to be fast."],
      ["tool_saw", "Git", "undo, but make it a lifestyle."],
      ["tool_brush", "Docker", "\"it works on my machine\" — now everywhere."],
      ["tool_oilcan", "SQLite", "a whole database in one little file."],
      ["tool_ruler", "Arch Linux", "yes, I use it. btw."],
      ["tool_pliers", "Linux", "home."],
    ];
    var shelf = el("shelf");
    var blurb = document.createElement("p");
    blurb.className = "shelf-label";
    blurb.id = "tool-blurb";
    blurb.textContent = "pick one up";
    shelf.parentNode.insertBefore(blurb, shelf.nextSibling);

    var picked = {};
    TECHS.forEach(function (t) {
      var d = document.createElement("button");
      d.className = "tool";
      d.type = "button";
      d.title = t[1];
      d.appendChild(scaleSprite(SPR[t[0]], 3));
      d.addEventListener("click", function () {
        AUD.play("thud");
        blurb.innerHTML = "";
        var b = document.createElement("span");
        b.className = "accent";
        b.textContent = t[1] + " — ";
        blurb.appendChild(b);
        blurb.appendChild(document.createTextNode(t[2]));
        if (!picked[t[1]]) {
          picked[t[1]] = true;
          if (TECHS.every(function (x) { return picked[x[1]]; })) {
            earnBadge("handy");
            showToast("Tidy toolbox", "A note was tucked behind it: \"the well remembers 31\"", SPR.tool_hammer);
          }
        }
      });
      shelf.appendChild(d);
    });
  })();

  /* well baguette (#15) */
  (function () {
    var b = el("well-baguette");
    b.appendChild(scaleSprite(SPR.baguette, 3));
    b.classList.toggle("taken", SAVE.hasBaguette("b15"));
    b.addEventListener("click", function () {
      collectBaguette("b15");
      b.classList.add("taken");
    });
  })();

  /* ────────────────────────────── stage repos ── */
  var FALLBACK_REPOS = [
    "confession", "Wordle-nerimity", "nerimity-minecraft-bot", "Welcome-nerimity",
    "pollmaster-bot", "quote-bot-nerimity", "Neri-cat-bot", "Gun-bot-nerimity",
  ].map(function (n) {
    return { name: n, html_url: "https://github.com/JoddabodScripts/" + n, description: null, stargazers_count: 0 };
  });

  function initRepos(repos) {
    var n = WORLD.addStageRepos(repos);
    stageRepoNames = repos.slice(0, n).map(function (r) { return r.name; });
    checkCritic();
  }

  (function fetchRepos() {
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem("cv_repos")); } catch (_) {}
    if (cached && Date.now() - cached.at < 3600000) { initRepos(cached.repos); return; }

    fetch("https://api.github.com/users/" + CV.GH_USER + "/repos?per_page=100&sort=updated")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (repos) {
        repos = repos.filter(function (r) { return !r.fork; });
        repos.sort(function (a, b) {
          return (b.stargazers_count - a.stargazers_count) || (a.updated_at < b.updated_at ? 1 : -1);
        });
        var slim = repos.slice(0, 8).map(function (r) {
          return { name: r.name, html_url: r.html_url, description: r.description, stargazers_count: r.stargazers_count };
        });
        try { sessionStorage.setItem("cv_repos", JSON.stringify({ at: Date.now(), repos: slim })); } catch (_) {}
        initRepos(slim);
      })
      .catch(function () { initRepos(FALLBACK_REPOS); });
  })();

  /* ────────────────────────────── zones ── */
  var currentZone = null;
  var allZoneIds = Object.keys(WORLD.zones);
  var zoneTagTimer = null;

  setInterval(function () {
    if (!pointerIn || !scene.outdoor) return;
    var found = null;
    for (var i = 0; i < allZoneIds.length; i++) {
      var z = WORLD.zones[allZoneIds[i]].r;
      if (wx >= z[0] && wx <= z[0] + z[2] && wy >= z[1] && wy <= z[1] + z[3]) { found = allZoneIds[i]; break; }
    }
    if (found && found !== currentZone) {
      currentZone = found;
      SAVE.addZone(found);
      zoneTagEl.textContent = WORLD.zones[found].label;
      zoneTagEl.hidden = false;
      zoneTagEl.classList.add("show");
      clearTimeout(zoneTagTimer);
      zoneTagTimer = setTimeout(function () { zoneTagEl.classList.remove("show"); }, 1800);
      if (allZoneIds.every(function (id) { return SAVE.data.zones.indexOf(id) !== -1; })) {
        earnBadge("wanderer");
      }
    } else if (!found) {
      currentZone = null;
    }
  }, 400);

  /* ────────────────────────────── daily badges ── */
  if (SAVE.touchToday() >= 3) earnBadge("regular");
  (function nightOwl() {
    var h = new Date().getHours();
    if (h < 5) earnBadge("nightowl");
  })();

  /* ────────────────────────────── multiplayer wiring ── */
  var remoteWiggles = {}; /* id -> until-ts */

  NET.on.hello = function (m) {
    oven.p = m.oven || 0;
    oven.serverLoaves = m.loaves || 0;
    visitorsTotal = m.visitors || null;
    campersEl.hidden = false;
    campersN.textContent = m.n || 1;
  };
  NET.on.count = function (n) {
    campersEl.hidden = false;
    campersN.textContent = n;
  };
  NET.on.drop = function () { campersEl.hidden = true; oven.serverLoaves = null; };
  NET.on.emote = function (id, k) {
    var o = NET.others.get(id);
    if (o && o.has && EMOTES.indexOf(k) !== -1) floaters.push({ x: o.x, y: o.y, k: k, t: 0 });
  };
  NET.on.wiggle = function (id) { remoteWiggles[id] = performance.now() + 500; };
  NET.on.oven = function (p) { oven.p = p; };
  NET.on.bake = function (loaves) {
    oven.p = 0;
    oven.serverLoaves = loaves;
    bakeParty();
  };

  NET.connect();

  /* ────────────────────────────── main loop ── */
  var smokeAcc = 0;

  function update(dt) {
    time += dt;

    /* camera: dead zone in the middle, pans as the pointer leaves it */
    if (pointerIn && !overlayVisible()) {
      var dead = CV.CAM_DEAD;
      var nx = (mx - window.innerWidth / 2) / (window.innerWidth / 2);
      var ny = (my - window.innerHeight / 2) / (window.innerHeight / 2);
      var pushX = 0, pushY = 0;
      if (Math.abs(nx) > dead) pushX = (nx - (nx > 0 ? dead : -dead)) / (1 - dead);
      if (Math.abs(ny) > dead) pushY = (ny - (ny > 0 ? dead : -dead)) / (1 - dead);
      camVel.x += (pushX * CV.CAM_SPEED * 60 - camVel.x) * Math.min(1, dt * 10);
      camVel.y += (pushY * CV.CAM_SPEED * 60 - camVel.y) * Math.min(1, dt * 10);
      cam.x += camVel.x * dt;
      cam.y += camVel.y * dt;
    }
    cam.x = Math.max(0, Math.min(scene.W - vw, cam.x));
    cam.y = Math.max(0, Math.min(scene.H - vh, cam.y));
    if (scene.W < vw) cam.x = (scene.W - vw) / 2;
    if (scene.H < vh) cam.y = (scene.H - vh) / 2;

    /* my avatar */
    var w = screenToWorld(mx, my);
    wx = w[0]; wy = w[1];
    if (scene.outdoor && pointerIn) NET.sendMove(wx, wy);

    /* remote interpolation (village only) */
    if (scene.outdoor) {
      NET.others.forEach(function (o) {
        if (!o.has) return;
        var k = Math.min(1, dt * 10);
        o.x += (o.tx - o.x) * k;
        o.y += (o.ty - o.y) * k;
      });
    }

    /* hover */
    hoverProp = pointerIn ? propAt(wx, wy) : null;

    /* oven progress easing (shared by the village + the bakery interior) */
    oven.shownP += (oven.p - oven.shownP) * Math.min(1, dt * 6);
    if (Math.abs(oven.p - oven.shownP) < 0.5) oven.shownP = oven.p;

    updateParts(dt);

    if (!scene.outdoor) return;

    GAME.flags.treeShake = Math.max(0, GAME.flags.treeShake - dt);

    /* ambient smoke */
    smokeAcc += dt;
    if (smokeAcc > 0.8) {
      smokeAcc = 0;
      if (!CV.RM) {
        WORLD.smokeSources.forEach(function (s) {
          spawn({ x: s[0] + (Math.random() - 0.5) * 3, y: s[1], vx: 3 + Math.random() * 3, vy: -9 - Math.random() * 4, grav: -2, life: 2.4, color: "#454b60", size: 2 });
        });
      }
    }

    /* ripple aging */
    ["fountain", "pond"].forEach(function (k) {
      ripples[k].forEach(function (r) { r.t += dt * 1.2; });
    });

    updateDucks(dt);
    updateCat(dt);

    /* fireflies drift */
    for (var i = 0; i < fireflies.length; i++) {
      var f = fireflies[i];
      var sp = CV.RM ? 0.3 : 1;
      f.x += Math.sin(time * 0.7 + f.seed) * 8 * dt * sp;
      f.y += Math.cos(time * 0.5 + f.seed * 2) * 6 * dt * sp;
      if (f.x < f.ax) f.x = f.ax + f.aw; if (f.x > f.ax + f.aw) f.x = f.ax;
      if (f.y < f.ay) f.y = f.ay + f.ah; if (f.y > f.ay + f.ah) f.y = f.ay;
    }
  }

  function overlayVisible() { return !overlayEl.hidden; }

  function draw() {
    var cx = Math.round(cam.x), cy2 = Math.round(cam.y);
    g.clearRect(0, 0, vw, vh);
    g.drawImage(scene.bg, cx, cy2, vw, vh, 0, 0, vw, vh);

    g.save();
    g.translate(-cx, -cy2);

    if (scene.outdoor) drawBaguettes(g, time);

    /* props */
    var i, p;
    for (i = 0; i < scene.props.length; i++) {
      p = scene.props[i];
      var hov = p === hoverProp;
      if (p.spr) {
        var s = scaleCache(SPR[p.spr], p.scale || 2);
        var bob = hov && !CV.RM ? Math.round(Math.sin(time * 10)) : 0;
        g.drawImage(s, p.sx, p.sy + bob);
      }
      if (p.draw) p.draw(g, time, hov);
    }
    for (i = 0; i < scene.props.length; i++) {
      p = scene.props[i];
      if (p.drawOver) p.drawOver(g, time, p === hoverProp);
    }

    /* hover brackets */
    if (hoverProp && !CV.TOUCH) drawBrackets(g, hoverProp.x, hoverProp.y, hoverProp.w, hoverProp.h);
    if (hoverBag) drawBrackets(g, hoverBag.x - 2, hoverBag.y - 3, 18, 11);

    drawParts(g);

    /* remote players + the cat live in the village only */
    if (scene.outdoor) {
      drawCat(g);
      NET.others.forEach(function (o, id) {
        if (!o.has) return;
        g.globalAlpha = 0.95;
        drawAvatar(g, o.x, o.y, o.c, o.h, remoteWiggles[id] > performance.now());
        g.globalAlpha = 1;
      });
    }

    /* me */
    if (pointerIn) {
      drawAvatar(g, wx, wy, NET.online ? NET.country : "", SAVE.data.hat, performance.now() < wiggleUntil);
    }

    drawFloaters(g, 0.016);

    /* ── lighting ── */
    g.globalCompositeOperation = "lighter";
    if (!scene.outdoor) {
      if (scene.lights) scene.lights(g, time);
      g.globalCompositeOperation = "source-over";
      g.restore();
      g.drawImage(vignette, 0, 0);
      return;
    }
    /* lamps */
    for (i = 0; i < WORLD.lamps.length; i++) {
      if (GAME.flags.lampOff[i]) continue;
      var L = WORLD.lamps[i];
      var flick2 = CV.RM ? 0.24 : 0.22 + Math.sin(time * 6 + i * 3) * 0.03;
      var grad = g.createRadialGradient(L[0], L[1] - 20, 2, L[0], L[1] - 20, 42);
      grad.addColorStop(0, "rgba(255,184,77," + flick2 + ")");
      grad.addColorStop(1, "rgba(255,184,77,0)");
      g.fillStyle = grad;
      g.fillRect(L[0] - 42, L[1] - 62, 84, 84);
    }
    /* oven glow */
    var ov = WORLD.oven;
    var og = g.createRadialGradient(ov.x + 23, ov.y + 28, 2, ov.x + 23, ov.y + 28, 34);
    var oInt = 0.12 + (oven.shownP / 100) * 0.2;
    og.addColorStop(0, "rgba(255,150,60," + oInt + ")");
    og.addColorStop(1, "rgba(255,150,60,0)");
    g.fillStyle = og;
    g.fillRect(ov.x - 12, ov.y - 6, 70, 70);
    /* campfire */
    var cf = WORLD.campfire;
    var cfFlick = CV.RM ? 0.2 : 0.16 + Math.abs(Math.sin(time * 8)) * 0.1;
    var cfg = g.createRadialGradient(cf.x, cf.y, 2, cf.x, cf.y, 36);
    cfg.addColorStop(0, "rgba(255,150,60," + cfFlick + ")");
    cfg.addColorStop(1, "rgba(255,150,60,0)");
    g.fillStyle = cfg;
    g.fillRect(cf.x - 36, cf.y - 36, 72, 72);
    /* house windows */
    if (GAME.flags.houseLights) {
      var hg = g.createRadialGradient(834, 928, 2, 834, 928, 30);
      hg.addColorStop(0, "rgba(255,184,77,0.14)");
      hg.addColorStop(1, "rgba(255,184,77,0)");
      g.fillStyle = hg;
      g.fillRect(804, 898, 60, 60);
    }
    /* spotlight */
    if (GAME.flags.spotlight) {
      var sp2 = WORLD.stagePlat;
      var mxs = sp2.x + sp2.w / 2;
      g.fillStyle = "rgba(255,230,170,0.10)";
      g.beginPath();
      g.moveTo(mxs - 6, sp2.y - 52);
      g.lineTo(mxs - 40, sp2.y + 20);
      g.lineTo(mxs + 40, sp2.y + 20);
      g.lineTo(mxs + 6, sp2.y - 52);
      g.closePath();
      g.fill();
    }
    /* fireflies */
    for (i = 0; i < fireflies.length; i++) {
      var fl = fireflies[i];
      var pulse = 0.35 + Math.sin(time * 2 + fl.seed * 7) * 0.3;
      if (pulse < 0.15) continue;
      g.fillStyle = "rgba(255,217,138," + pulse.toFixed(2) + ")";
      g.fillRect(fl.x, fl.y, 1, 1);
      g.fillStyle = "rgba(255,217,138," + (pulse * 0.25).toFixed(2) + ")";
      g.fillRect(fl.x - 1, fl.y - 1, 3, 3);
    }
    /* constellation — only when the whole village is dark */
    if (allLampsOff()) {
      var tw = 0.55 + Math.sin(time * 1.5) * 0.2;
      g.strokeStyle = "rgba(154,184,255,0.18)";
      g.lineWidth = 1;
      g.beginPath();
      for (i = 0; i < 7; i++) {
        var a0 = CONSTELLATION[i], a1 = CONSTELLATION[i + 1];
        g.moveTo(a0[0] + 0.5, a0[1] + 0.5);
        g.lineTo(a1[0] + 0.5, a1[1] + 0.5);
      }
      g.stroke();
      for (i = 0; i < CONSTELLATION.length; i++) {
        var c0 = CONSTELLATION[i];
        var tg = g.createRadialGradient(c0[0], c0[1], 0, c0[0], c0[1], 7);
        tg.addColorStop(0, "rgba(255,243,201," + tw.toFixed(2) + ")");
        tg.addColorStop(1, "rgba(255,243,201,0)");
        g.fillStyle = tg;
        g.fillRect(c0[0] - 7, c0[1] - 7, 14, 14);
        g.drawImage(SPR.star, c0[0] - 2, c0[1] - 2);
      }
    }
    g.globalCompositeOperation = "source-over";

    g.restore();

    /* vignette (screen space) */
    g.drawImage(vignette, 0, 0);
  }

  function drawBrackets(gg, x, y, w, h) {
    gg.strokeStyle = "rgba(255,217,138,0.7)";
    gg.lineWidth = 1;
    var s = 3;
    gg.beginPath();
    gg.moveTo(x - 2 + s, y - 2 + 0.5); gg.lineTo(x - 2 + 0.5, y - 2 + 0.5); gg.lineTo(x - 2 + 0.5, y - 2 + s);
    gg.moveTo(x + w + 2 - s, y - 2 + 0.5); gg.lineTo(x + w + 2 - 0.5, y - 2 + 0.5); gg.lineTo(x + w + 2 - 0.5, y - 2 + s);
    gg.moveTo(x - 2 + 0.5, y + h + 2 - s); gg.lineTo(x - 2 + 0.5, y + h + 2 - 0.5); gg.lineTo(x - 2 + s, y + h + 2 - 0.5);
    gg.moveTo(x + w + 2 - 0.5, y + h + 2 - s); gg.lineTo(x + w + 2 - 0.5, y + h + 2 - 0.5); gg.lineTo(x + w + 2 - s, y + h + 2 - 0.5);
    gg.stroke();
  }

  function loop(ts) {
    var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    update(dt);
    draw();
    updateTooltip();
    requestAnimationFrame(loop);
  }

  updateBagCounter();
  requestAnimationFrame(loop);

  /* tiny debug handle (used by dev tooling, harmless in prod) */
  window.CVDBG = {
    get cam() { return { x: cam.x, y: cam.y }; },
    worldToScreen: function (x, y) { return [(x - cam.x) * SC, (y - cam.y) * SC]; },
    jump: function (x, y) { cam.x = x - vw / 2; cam.y = y - vh / 2; camVel.x = camVel.y = 0; },
  };
})();
