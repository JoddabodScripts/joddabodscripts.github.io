/* ═══ Crumb Village ─ world ═══
   Map layout, zones, props (the clickable everything), baguette spots.
   Prop handlers call GAME.* / FX.* / AUD.* which game.js provides. */

var WORLD = (function () {
  var W = CV.WORLD_W, H = CV.WORLD_H;

  /* ── Zones (Wanderer badge + the little name tag) ── */
  var zones = {
    square:  { r: [640, 400, 340, 300], label: "VILLAGE SQUARE" },
    bakery:  { r: [880, 170, 330, 270], label: "THE BAKERY" },
    hatshop: { r: [330, 180, 300, 260], label: "THE HAT SHOP" },
    stage:   { r: [110, 500, 360, 330], label: "MUSIC STAGE" },
    cafe:    { r: [1120, 430, 400, 320], label: "THE CAFE" },
    house:   { r: [720, 800, 360, 320], label: "JODDABOD'S HOUSE" },
    park:    { r: [120, 850, 500, 330], label: "THE PARK" },
  };

  /* ── Fixed anchors ── */
  var fountain = { x: 810, y: 545 };
  var oven = { x: 900, y: 300 };          /* top-left of the oven painter */
  var stagePlat = { x: 170, y: 640, w: 230, h: 34 };
  var pond = { x: 400, y: 1000, rx: 110, ry: 52 };
  var well = { x: 230, y: 900 };          /* top-left-ish of well painter */
  var towerBase = { x: 705, y: 470 };

  var lamps = [
    [650, 520], [980, 520], [820, 700], [560, 730],
    [1120, 620], [900, 810], [470, 470], [270, 790], [1060, 420],
    [700, 870], [420, 560], [1300, 700],
  ];

  var smokeSources = [
    [oven.x + 23, oven.y - 15],   /* oven pipe */
    [888, 848],                   /* house chimney */
  ];

  var fireflyAreas = [
    [140, 860, 460, 300],  /* park */
    [640, 410, 340, 280],  /* square */
    [1140, 450, 340, 280], /* cafe garden */
  ];

  var staticTrees = [
    [70, 120, 60], [150, 80, 44], [1520, 100, 56], [1440, 60, 40],
    [60, 500, 48], [1550, 420, 50], [1540, 760, 56], [80, 1120, 50],
    [700, 90, 52], [900, 70, 40], [1200, 90, 48], [520, 100, 44],
    [1300, 1120, 56], [1100, 1140, 44], [640, 1140, 48], [60, 780, 40],
    [1480, 950, 48], [560, 560, 36], [1060, 720, 40],
    [520, 610, 40], [620, 250, 42], [270, 350, 40], [1340, 300, 44],
    [640, 700, 38], [1000, 640, 40], [1180, 780, 46], [960, 1060, 44],
    [1360, 880, 50], [420, 420, 36], [880, 130, 38], [1420, 180, 40],
    [240, 540, 34], [130, 640, 42], [1500, 600, 44], [720, 1080, 40],
    [1250, 950, 38], [1440, 520, 36],
  ];

  var flowers = [
    [930, 580, "A"], [945, 592, "B"], [918, 592, "A"], [960, 582, "A"],
    [700, 620, "B"], [1240, 470, "A"], [1256, 462, "B"],
    [500, 850, "A"], [880, 1050, "B"], [1420, 620, "A"],
  ];

  /* ── Baguettes (15) ──
     hidden: null = always visible (just tucked away),
     otherwise the reveal trigger flag game.js flips. b15 lives in the well. */
  var baguettes = [
    { id: "b1",  x: 818,  y: 574,  hidden: null },   /* fountain south rim */
    { id: "b2",  x: 936,  y: 597,  hidden: null },   /* square flower bed */
    { id: "b3",  x: 574,  y: 914,  hidden: null },   /* under the park bench */
    { id: "b4",  x: 1068, y: 318,  hidden: "sack" }, /* 3rd flour poof */
    { id: "b5",  x: 430,  y: 706,  hidden: "vinyl" },/* dig the crate once */
    { id: "b6",  x: 1049, y: 242,  hidden: null },   /* behind the bakery */
    { id: "b7",  x: 1252, y: 552,  hidden: null },   /* behind pastry case */
    { id: "b8",  x: 188,  y: 832,  hidden: "tree" }, /* shake the big tree */
    { id: "b9",  x: 606,  y: 1018, hidden: "bush" }, /* rustle the bush */
    { id: "b10", x: 352,  y: 1030, hidden: "duck" }, /* scare the duck */
    { id: "b11", x: 224,  y: 896,  hidden: null },   /* behind the well */
    { id: "b12", x: 518,  y: 294,  hidden: null },   /* behind the hatstand */
    { id: "b13", x: 686,  y: 460,  hidden: null },   /* clock tower base */
    { id: "b14", x: 163,  y: 604,  hidden: null },   /* behind stage curtain */
    /* b15: bottom of the well (DOM panel) */
  ];

  /* ── Static painting ── */
  function paintStatic(g) {
    PAINT.grass(g, W, H);

    /* paths: square is the hub */
    PAINT.path(g, 810, 545, 950, 330, 9);    /* square -> bakery */
    PAINT.path(g, 810, 545, 470, 300, 9);    /* square -> hat shop */
    PAINT.path(g, 810, 545, 300, 660, 9);    /* square -> stage */
    PAINT.path(g, 810, 545, 1210, 560, 9);   /* square -> cafe */
    PAINT.path(g, 810, 545, 855, 940, 9);    /* square -> house */
    PAINT.path(g, 855, 940, 420, 1000, 8);   /* house -> park */
    PAINT.path(g, 300, 660, 250, 880, 7);    /* stage -> park/well */

    PAINT.plaza(g, 810, 545, 220, 160);
    PAINT.pond(g, pond.x, pond.y, pond.rx, pond.ry);

    /* ground clutter: tall grass, pebbles, stray flowers (painted before
       buildings so anything that lands badly gets built over) */
    var dec = mulberry32(4242);
    for (var d = 0; d < 300; d++) {
      var gx = dec() * W, gy = dec() * H;
      g.fillStyle = dec() < 0.5 ? PAL.grass3 : "#2e4636";
      g.fillRect(gx | 0, gy | 0, 1, 2 + (dec() * 2 | 0));
      if (dec() < 0.4) g.fillRect((gx + 2) | 0, (gy + 1) | 0, 1, 2);
    }
    for (d = 0; d < 16; d++) {
      var cx2 = 40 + dec() * (W - 80), cy2 = 40 + dec() * (H - 80);
      for (var s2 = 0; s2 < 2 + (dec() * 3 | 0); s2++) {
        px(g, cx2 + dec() * 10, cy2 + dec() * 6, 2 + (dec() * 2 | 0), 2, dec() < 0.5 ? PAL.stone0 : PAL.stone1);
      }
    }
    for (d = 0; d < 14; d++) {
      var fs = dec() < 0.5 ? SPR.flowerA : SPR.flowerB;
      g.drawImage(fs, (40 + dec() * (W - 80)) | 0, (40 + dec() * (H - 80)) | 0, fs.width * 2, fs.height * 2);
    }

    /* buildings */
    PAINT.cottage(g, {
      x: 930, y: 230, w: 110, h: 58,
      wall: "#7d6850", wallDark: PAL.wood0, roof: PAL.roof1, roofHi: PAL.roof2,
      door: { x: 66, w: 14 },
      windows: [{ x: 14, y: 22, w: 14, h: 14 }, { x: 38, y: 22, w: 14, h: 14 }],
      chimney: null,
    });
    PAINT.oven(g, oven.x, oven.y);

    PAINT.cottage(g, {
      x: 400, y: 245, w: 92, h: 54,
      wall: "#5d5468", wallDark: "#3a3444", roof: "#4a3f5c", roofHi: "#5d5072",
      door: { x: 36, w: 14 },
      windows: [{ x: 12, y: 20, w: 12, h: 12 }, { x: 66, y: 20, w: 12, h: 12 }],
      chimney: null,
    });

    PAINT.cottage(g, {
      x: 1180, y: 490, w: 120, h: 62,
      wall: "#6d5843", wallDark: PAL.wood0, roof: PAL.grass2, roofHi: PAL.grass3,
      door: { x: 50, w: 15 },
      windows: [{ x: 12, y: 24, w: 16, h: 14 }, { x: 90, y: 24, w: 16, h: 14 }],
      chimney: null,
    });
    /* cafe awning */
    for (var a = 0; a < 7; a++) {
      px(g, 1180 + a * 18, 486, 9, 6, a % 2 ? PAL.cream : PAL.red);
      px(g, 1189 + a * 18 - 9 + 9, 486, 9, 6, a % 2 ? PAL.red : PAL.cream);
    }

    PAINT.cottage(g, {
      x: 800, y: 890, w: 110, h: 64,
      wall: "#8a7358", wallDark: PAL.wood0, roof: PAL.roof0, roofHi: PAL.roof1,
      door: { x: 64, w: 15 },
      windows: [{ x: 14, y: 26, w: 15, h: 14 }, { x: 40, y: 26, w: 15, h: 14 }],
      chimney: 84,
    });
    /* little fence by the house */
    for (var f = 0; f < 5; f++) {
      px(g, 760 + f * 10, 946, 4, 12, PAL.wood1);
      px(g, 758, 950, 50, 2, PAL.wood2);
    }

    PAINT.clocktower(g, towerBase.x, towerBase.y);
    PAINT.stage(g, stagePlat.x, stagePlat.y, stagePlat.w, stagePlat.h);
    PAINT.well(g, well.x, well.y);
    PAINT.fountain(g, fountain.x, fountain.y);
    PAINT.stall(g, 730, 468);

    /* trees + border forest */
    staticTrees.forEach(function (t) { PAINT.tree(g, t[0], t[1], t[2]); });
    var rnd = mulberry32(1231);
    for (var i = 0; i < 46; i++) {
      var edge = i % 4;
      var tx = edge === 0 ? rnd() * W : edge === 1 ? rnd() * W : edge === 2 ? 12 + rnd() * 66 : W - 12 - rnd() * 66;
      var ty = edge === 0 ? 14 + rnd() * 40 : edge === 1 ? H - 10 - rnd() * 40 : rnd() * H;
      PAINT.tree(g, tx | 0, ty | 0, 34 + rnd() * 26);
    }

    /* flower beds */
    flowers.forEach(function (f) {
      var s = f[2] === "A" ? SPR.flowerA : SPR.flowerB;
      g.drawImage(s, f[0], f[1], s.width * 2, s.height * 2);
    });

    /* the "31" pebbles, park corner */
    paintPebbles31(g, 540, 1066);

    /* labels */
    PAINT.label(g, 985, 206, "BAKERY", PAL.glow1);
    PAINT.label(g, 446, 222, "HATS", PAL.glow1);
    PAINT.label(g, 1240, 468, "CAFE", PAL.glow1);
  }

  function paintPebbles31(g, x, y) {
    var three = ["sss", "..s", ".ss", "..s", "sss"];
    var one = [".s.", "ss.", ".s.", ".s.", "sss"];
    function digit(rows, ox) {
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < rows[r].length; c++) {
          if (rows[r][c] === "s") {
            px(g, x + ox + c * 4, y + r * 4, 3, 2, PAL.stone1);
            px(g, x + ox + c * 4, y + r * 4 + 2, 3, 1, PAL.stone0);
          }
        }
      }
    }
    digit(three, 0);
    digit(one, 16);
  }

  /* ── Props ── */
  var props = [];

  function add(p) { props.push(p); return p; }

  function corner(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }

  function buildProps() {
    /* ═ VILLAGE SQUARE ═ */
    add({
      id: "fountain", zone: "square", x: fountain.x - 27, y: fountain.y - 18, w: 54, h: 42,
      tip: "The fountain", sub: "Toss a coin",
      draw: function (g, t) {
        /* shimmering water ring */
        for (var i = 0; i < 5; i++) {
          var a = t * 0.8 + i * 1.256;
          px(g, fountain.x + Math.cos(a) * 10 - 1, fountain.y + Math.sin(a) * 5 - 1, 2, 1, PAL.water2);
        }
        px(g, fountain.x - 1, fountain.y - 16 + Math.sin(t * 3) * 1.5, 2, 4, PAL.water2);
        /* tossed coins resting in the water */
        var n = Math.min(GAME.flags.coins, 6);
        for (i = 0; i < n; i++) {
          g.drawImage(SPR.coin, fountain.x - 12 + (i % 3) * 8, fountain.y + 2 + ((i / 3) | 0) * 5);
        }
        /* live ripples */
        GAME.drawRipples(g, "fountain");
      },
      onClick: function () { GAME.tossCoin(); },
    });

    add({
      id: "noticeboard", zone: "square", x: 878, y: 450, w: 40, h: 40,
      tip: "Noticeboard", sub: "Village records",
      draw: function (g, t, hov) {
        var bob = hov && !CV.RM ? Math.round(Math.sin(t * 10)) : 0;
        /* posts */
        px(g, 880, 458, 3, 32, PAL.wood1);
        px(g, 913, 458, 3, 32, PAL.wood1);
        /* board + little roof */
        px(g, 876, 452 + bob, 44, 4, PAL.roof1);
        px(g, 878, 456 + bob, 40, 26, PAL.wood0);
        px(g, 880, 458 + bob, 36, 22, PAL.wood2);
        /* pinned notes */
        px(g, 883, 461 + bob, 10, 8, PAL.cream);
        px(g, 896, 460 + bob, 8, 10, PAL.glow1);
        px(g, 906, 462 + bob, 7, 7, PAL.pink);
        px(g, 885, 471 + bob, 12, 6, PAL.sand);
        px(g, 887, 462 + bob, 1, 1, PAL.red);
        px(g, 899, 461 + bob, 1, 1, PAL.red);
      },
      onClick: function () { AUD.play("click"); GAME.openPanel("panel-notice"); },
    });

    add({
      id: "clock", zone: "square", x: towerBase.x - 16, y: towerBase.y - 70, w: 32, h: 70,
      tip: "Clock tower", sub: function () { return "It's " + GAME.dubaiClock() + " in Dubai"; },
      draw: function (g) {
        /* live hands over the painted face */
        var cx = towerBase.x, cy = towerBase.y - 50;
        var tm = GAME.dubaiTime();
        var ah = (tm.h % 12 + tm.m / 60) / 12 * Math.PI * 2 - Math.PI / 2;
        var am = tm.m / 60 * Math.PI * 2 - Math.PI / 2;
        g.strokeStyle = PAL.ink; g.lineWidth = 1;
        g.beginPath(); g.moveTo(cx + 0.5, cy + 0.5); g.lineTo(cx + Math.cos(ah) * 4 + 0.5, cy + Math.sin(ah) * 4 + 0.5); g.stroke();
        g.beginPath(); g.moveTo(cx + 0.5, cy + 0.5); g.lineTo(cx + Math.cos(am) * 7 + 0.5, cy + Math.sin(am) * 7 + 0.5); g.stroke();
      },
      onClick: function () { AUD.play("chime"); FX.ring(towerBase.x, towerBase.y - 50); },
    });

    add({
      id: "bench_sq", zone: "square", x: 700, y: 614, w: 36, h: 16,
      spr: "bench", sx: 700, sy: 614, scale: 2,
      tip: "A bench", sub: "For sitting. Allegedly.",
      onClick: function (p) { AUD.play("creak"); FX.dust(p.x + 18, p.y + 14); },
    });

    add({
      id: "stall", zone: "square", x: 726, y: 468, w: 48, h: 30,
      tip: "Bread stall", sub: "Self service. Pay in compliments.",
      draw: function () {},
      onClick: function (p) { AUD.play("pop"); FX.crumbs(p.x + 24, p.y + 20); },
    });

    add({
      id: "junction", zone: "square", x: 845, y: 630, w: 32, h: 22,
      spr: "signpost", sx: 845, sy: 630, scale: 2,
      tip: "Signpost", sub: "Bakery N. Cafe E. Stage W. House S. Cat: varies.",
      onClick: function (p) { AUD.play("wobble"); FX.dust(p.x + 16, p.y + 20); },
    });

    /* lampposts (each one clickable, because everything is) */
    lamps.forEach(function (L, i) {
      add({
        id: "lamp" + i, zone: null, x: L[0] - 6, y: L[1] - 26, w: 12, h: 28,
        tip: "Lamppost",
        draw: function (g, t, hov) {
          var off = GAME.flags.lampOff[i];
          g.drawImage(SPR.lamppost, L[0] - 5, L[1] - 24);
          if (off) px(g, L[0] - 3, L[1] - 23, 6, 3, PAL.iron);
        },
        onClick: function () {
          GAME.flags.lampOff[i] = !GAME.flags.lampOff[i];
          AUD.play("switch");
        },
      });
    });

    /* ═ BAKERY ═ */
    add({
      id: "oven", zone: "bakery", x: oven.x, y: oven.y - 16, w: 48, h: 60,
      tip: "The communal oven", sub: "Knead! Everyone's bread rises together",
      draw: function (g, t) { GAME.drawOven(g, t, oven.x, oven.y); },
      onClick: function () { GAME.kneadOven(); },
    });

    add({
      id: "basket", zone: "bakery", x: 1008, y: 300, w: 24, h: 10,
      spr: "basket", sx: 1008, sy: 300, scale: 2,
      tip: "Fresh loaves", sub: "Still warm",
      onClick: function (p) {
        AUD.play("pop");
        FX.steam(p.x + 12, p.y - 2);
      },
    });

    add({
      id: "sack1", zone: "bakery", x: 1058, y: 292, w: 22, h: 20,
      spr: "sack", sx: 1058, sy: 292, scale: 2,
      tip: "Flour sack",
      onClick: function (p) { GAME.sackPoof(p); },
    });

    add({
      id: "sack2", zone: "bakery", x: 1078, y: 306, w: 20, h: 18,
      spr: "sack", sx: 1078, sy: 306, scale: 2,
      tip: "More flour",
      onClick: function (p) { GAME.sackPoof(p); },
    });

    add({
      id: "bakerybarrel", zone: "bakery", x: 1040, y: 350, w: 20, h: 20,
      spr: "barrel", sx: 1040, sy: 350, scale: 2,
      tip: "Water barrel",
      onClick: function (p) { AUD.play("thud"); FX.dust(p.x + 10, p.y + 18); },
    });

    add({
      id: "bakerycrate", zone: "bakery", x: 1064, y: 358, w: 20, h: 20,
      spr: "crate", sx: 1064, sy: 358, scale: 2,
      tip: "Crate", sub: "Property of the bakery",
      onClick: function (p) { AUD.play("thud"); FX.dust(p.x + 10, p.y + 18); },
    });

    add({
      id: "bakerysign", zone: "bakery", x: 962, y: 200, w: 46, h: 12,
      tip: "The bakery", sub: function () { return GAME.loafLine(); },
      draw: function () {},
      onClick: function () { AUD.play("wobble"); FX.crumbs(985, 212); },
    });

    /* ═ HAT SHOP ═ */
    add({
      id: "hatdoor", zone: "hatshop", x: 434, y: 266, w: 18, h: 34,
      tip: "The hat shop", sub: "Cosmetics. All free, all earned",
      onClick: function () { AUD.play("door"); GAME.openPanel("panel-hats"); },
    });

    add({
      id: "hatstand", zone: "hatshop", x: 506, y: 274, w: 20, h: 26,
      spr: "hatstand", sx: 506, sy: 274, scale: 2,
      tip: "Hat stand", sub: "Display only",
      onClick: function (p) { AUD.play("wobble"); FX.dust(p.x + 10, p.y + 24); },
    });

    /* ═ MUSIC STAGE ═ */
    add({
      id: "drum", zone: "stage", x: 186, y: 641, w: 28, h: 20,
      spr: "drum", sx: 186, sy: 641, scale: 2,
      tip: "Drum",
      onClick: function (p) {
        AUD.play("drum"); FX.ring(p.x + 14, p.y + 8);
        GAME.instrumentHit("drum");
      },
    });

    add({
      id: "keysprop", zone: "stage", x: 232, y: 648, w: 36, h: 14,
      spr: "keys", sx: 232, sy: 648, scale: 2,
      tip: "Keys",
      onClick: function (p) {
        AUD.play("key", (Math.random() * 6) | 0); FX.notes(p.x + 18, p.y);
        GAME.instrumentHit("keys");
      },
    });

    add({
      id: "guitar", zone: "stage", x: 352, y: 644, w: 20, h: 30,
      spr: "guitar", sx: 352, sy: 644, scale: 2,
      tip: "Guitar",
      onClick: function (p) {
        AUD.play("strum"); FX.notes(p.x + 10, p.y + 4);
        GAME.instrumentHit("guitar");
      },
    });

    add({
      id: "mic", zone: "stage", x: 300, y: 644, w: 16, h: 26,
      spr: "mic", sx: 300, sy: 644, scale: 2,
      tip: "Mic", sub: "Check, one two",
      onClick: function (p) {
        AUD.play("micTap"); FX.ring(p.x + 8, p.y + 2);
        GAME.instrumentHit("mic");
      },
    });

    add({
      id: "vinyl", zone: "stage", x: 416, y: 688, w: 28, h: 16,
      spr: "vinylCrate", sx: 416, sy: 688, scale: 2,
      tip: "Vinyl crate", sub: "Dig through the records",
      onClick: function (p) { AUD.play("scratch"); GAME.reveal("vinyl"); FX.dust(p.x + 14, p.y + 12); },
    });

    add({
      id: "botsign", zone: "stage", x: 424, y: 640, w: 32, h: 22,
      spr: "signpost", sx: 424, sy: 640, scale: 2,
      tip: "Sign", sub: "\"Most of these are Nerimity bots\"",
      onClick: function () { AUD.play("wobble"); },
    });

    add({
      id: "spotlight", zone: "stage", x: 146, y: 688, w: 14, h: 14,
      tip: "Spotlight switch",
      draw: function (g, t, hov) {
        px(g, 146, 688, 12, 12, PAL.iron);
        px(g, 149, 691, 6, 6, GAME.flags.spotlight ? PAL.glow0 : PAL.stone0);
      },
      onClick: function () {
        GAME.flags.spotlight = !GAME.flags.spotlight;
        AUD.play("switch");
      },
    });

    /* ═ CAFE ═ */
    /* menu board: three servable items */
    var MENU = [
      { id: "menu_gh", label: "HOUSE BREW", sub2: "GitHub", url: CV.GITHUB },
      { id: "menu_ne", label: "TETO TART", sub2: "Nerimity", url: CV.NERIMITY },
      { id: "menu_em", label: "POSTCARD", sub2: "Email me", url: "mailto:" + CV.EMAIL },
    ];
    MENU.forEach(function (m, i) {
      add({
        id: m.id, zone: "cafe", x: 1122, y: 512 + i * 16, w: 52, h: 14,
        tip: m.label, sub: m.sub2,
        draw: function (g, t, hov) {
          if (i === 0) { /* the board itself, drawn once by the first item */
            px(g, 1118, 498, 60, 62, PAL.wood0);
            px(g, 1120, 500, 56, 58, "#241a10");
            PAINT.label(g, 1148, 502, "MENU", PAL.glow1);
            px(g, 1146, 555, 4, 14, PAL.wood1);
          }
        },
        drawOver: function (g, t, hov) {
          if (hov) px(g, this.x, this.y, this.w, this.h, "rgba(255,184,77,0.18)");
          PAINT.label(g, 1148, 514 + i * 16, m.label, hov ? PAL.glow2 : PAL.cream);
          PAINT.label(g, 1148, 520 + i * 16, "~ " + m.sub2 + " ~", hov ? PAL.glow1 : "#8b91a8");
        },
        onClick: function (p) { GAME.serve(p, m.url); },
      });
    });

    add({
      id: "corkboard", zone: "cafe", x: 1320, y: 512, w: 30, h: 24,
      tip: "Friends corkboard", sub: "Hatsune:MIKU was here",
      draw: function (g, t, hov) {
        px(g, 1320, 512, 30, 24, PAL.wood1);
        px(g, 1322, 514, 26, 20, "#a8895e");
        px(g, 1325, 517, 9, 7, PAL.cream);   /* pinned notes */
        px(g, 1337, 519, 8, 9, "#9ee0e8");   /* a teal one. wonder whose */
        px(g, 1328, 526, 10, 6, PAL.pink);
        px(g, 1329, 516, 1, 1, PAL.red);
        px(g, 1341, 518, 1, 1, PAL.red);
      },
      onClick: function () { AUD.play("pop"); GAME.openLink(CV.FRIEND_MIKU); },
    });

    add({
      id: "latte", zone: "cafe", x: 1200, y: 586, w: 20, h: 14,
      spr: "cup", sx: 1200, sy: 586, scale: 2,
      tip: "Latte", sub: "The foam art looks... familiar",
      onClick: function (p) { AUD.play("slurp"); FX.steam(p.x + 10, p.y - 4); },
    });

    add({
      id: "pastrycase", zone: "cafe", x: 1250, y: 556, w: 32, h: 14,
      spr: "pastry", sx: 1250, sy: 556, scale: 2,
      tip: "Pastry case", sub: "Look, don't lick the glass",
      onClick: function (p) { AUD.play("wobble"); FX.crumbs(p.x + 16, p.y + 6); },
    });

    add({
      id: "cafedoor", zone: "cafe", x: 1228, y: 518, w: 20, h: 36,
      tip: "Cafe door", sub: "The bell is the best part",
      onClick: function () { AUD.play("bell"); },
    });

    ["1198,596", "1288,600"].forEach(function (s, i) {
      var xy = s.split(",");
      add({
        id: "cafebarrel" + i, zone: "cafe", x: +xy[0], y: +xy[1], w: 20, h: 20,
        spr: "barrel", sx: +xy[0], sy: +xy[1], scale: 2,
        tip: "Barrel table",
        onClick: function (p) { AUD.play("thud"); FX.dust(p.x + 10, p.y + 18); },
      });
    });

    /* ═ HOUSE ═ */
    add({
      id: "mailbox", zone: "house", x: 764, y: 956, w: 20, h: 22,
      spr: "mailbox", sx: 764, sy: 956, scale: 2,
      tip: "Mailbox", sub: "joddabod4@joddabod.is-a.dev",
      onClick: function (p) {
        AUD.play("serve");
        FX.envelope(p.x + 10, p.y - 4);
        GAME.openLink("mailto:" + CV.EMAIL);
      },
    });

    add({
      id: "housedoor", zone: "house", x: 862, y: 916, w: 18, h: 38,
      tip: "Joddabod's front door", sub: "Come in, it's open",
      onClick: function () { AUD.play("door"); GAME.openPanel("panel-house"); },
    });

    add({
      id: "housewin", zone: "house", x: 812, y: 914, w: 44, h: 18,
      tip: "Windows",
      draw: function (g) {
        if (!GAME.flags.houseLights) {
          px(g, 814, 916, 15, 14, PAL.night2);
          px(g, 840, 916, 15, 14, PAL.night2);
        }
      },
      onClick: function () {
        GAME.flags.houseLights = !GAME.flags.houseLights;
        AUD.play("switch");
      },
    });

    add({
      id: "chimneyprop", zone: "house", x: 880, y: 828, w: 14, h: 20,
      tip: "Chimney",
      onClick: function (p) { AUD.play("poof"); FX.smokePuff(p.x + 6, p.y); },
    });

    /* ═ PARK ═ */
    add({
      id: "wellprop", zone: "park", x: well.x - 4, y: well.y - 14, w: 34, h: 36,
      tip: "The old well", sub: function () { return GAME.flags.wellReady ? "It looks... climbable" : "Deep. Very deep."; },
      onClick: function () { GAME.wellClick(); },
    });

    add({
      id: "campfire", zone: "park", x: 490, y: 926, w: 24, h: 18,
      tip: "Campfire", sub: "Somebody keeps it going",
      draw: function (g, t) {
        g.drawImage(SPR.logs, 0, 0, 10, 5, 492, 936, 20, 10);
        if (!CV.RM) {
          /* flickering flame, squat and cozy */
          var f1 = Math.abs(Math.sin(t * 9));
          px(g, 496 + Math.sin(t * 11) * 1.5, 930, 8, 6, "rgba(226,87,30," + (0.7 + f1 * 0.3) + ")");
          px(g, 498 + Math.cos(t * 13) * 1.5, 928, 5, 5, "rgba(255,184,77," + (0.6 + f1 * 0.4) + ")");
          px(g, 500, 927 + Math.sin(t * 17), 2, 2, PAL.glow2);
        } else {
          px(g, 496, 930, 8, 6, PAL.ember);
          px(g, 498, 928, 5, 4, PAL.glow0);
        }
      },
      onClick: function (p) {
        AUD.play("crackle");
        FX.burst(502, 928, 8, { colors: [PAL.ember, PAL.glow0, PAL.glow1], speed: 14, up: 30, grav: -8, life: 0.9 });
      },
    });

    add({
      id: "stump", zone: "park", x: 246, y: 806, w: 20, h: 16,
      spr: "stump", sx: 246, sy: 806, scale: 2,
      tip: "Tree stump", sub: "Knock knock",
      onClick: function (p) { AUD.play("thud"); FX.dust(p.x + 10, p.y + 12); },
    });

    add({
      id: "bench_park", zone: "park", x: 556, y: 896, w: 36, h: 16,
      spr: "bench", sx: 556, sy: 896, scale: 2,
      tip: "Quiet bench", sub: "Best seat in the village",
      onClick: function (p) { AUD.play("creak"); FX.dust(p.x + 18, p.y + 14); },
    });

    add({
      id: "bigtree", zone: "park", x: 156, y: 756, w: 60, h: 80,
      tip: "Big old tree", sub: "Sturdy. Shakeable?",
      draw: function (g, t, hov) {
        var sway = GAME.flags.treeShake > 0 ? Math.sin(t * 40) * 2 : 0;
        g.save();
        g.translate(sway, 0);
        PAINT.tree(g, 186, 836, 78);
        g.restore();
      },
      onClick: function (p) { GAME.shakeTree(p); },
    });

    add({
      id: "bush", zone: "park", x: 596, y: 1004, w: 28, h: 14,
      spr: "bush", sx: 596, sy: 1004, scale: 2,
      tip: "Bush", sub: "Rustle rustle",
      onClick: function (p) { AUD.play("rustle"); GAME.reveal("bush"); FX.leaves(p.x + 14, p.y + 6); },
    });

    add({
      id: "mushrooms", zone: "park", x: 162, y: 1006, w: 20, h: 16,
      spr: "mushroom", sx: 162, sy: 1006, scale: 2,
      tip: "Mushroom ring", sub: "Do not eat the decor",
      onClick: function (p) { AUD.play("sparkle"); FX.sparkle(p.x + 10, p.y + 4); },
    });

    add({
      id: "pebbles", zone: "park", x: 536, y: 1060, w: 34, h: 24,
      tip: "Some pebbles", sub: "Arranged... deliberately?",
      draw: function () {},
      onClick: function (p) { AUD.play("sparkle"); FX.sparkle(p.x + 16, p.y + 10); },
    });

    add({
      id: "pond", zone: "park", x: pond.x - pond.rx, y: pond.y - pond.ry, w: pond.rx * 2, h: pond.ry * 2,
      tip: "The pond", sub: "Ripple factory",
      draw: function (g, t) {
        for (var i = 0; i < 4; i++) {
          var a = t * 0.5 + i * 1.7;
          px(g, pond.x + Math.cos(a) * (pond.rx * 0.6) - 2, pond.y + Math.sin(a) * (pond.ry * 0.6), 4, 1, "#3a6a8e");
        }
        g.drawImage(SPR.lily, 344, 1024);
        if (GAME.revealed("duck") ) g.drawImage(SPR.lily, 452, 986);
        GAME.drawRipples(g, "pond");
      },
      onClick: function (p, wx, wy) { AUD.play("splash"); GAME.ripple("pond", wx, wy); },
    });
  }

  buildProps();

  /* ── Stage posters, one per GitHub repo (added after fetch) ── */
  var posterColors = [PAL.red, PAL.water1, PAL.roof1, PAL.grass3, PAL.teto, PAL.path2, PAL.stone1, PAL.gold1];

  function addStageRepos(repos) {
    var maxN = Math.min(repos.length, 8);
    for (var i = 0; i < maxN; i++) {
      (function (repo, i) {
        var pxX = stagePlat.x + 8 + i * 27;
        var pxY = stagePlat.y - 46;
        add({
          id: "poster_" + repo.name, zone: "stage", x: pxX, y: pxY, w: 22, h: 30,
          repo: repo, poster: true,
          tip: repo.name,
          sub: function () {
            var s = repo.description || "No description. Bold.";
            return s + "  [" + (repo.stargazers_count || 0) + " stars]";
          },
          draw: function (g, t, hov) {
            var bob = hov && !CV.RM ? Math.sin(t * 10) : 0;
            px(g, pxX, pxY + bob, 22, 30, PAL.sand);
            px(g, pxX + 1, pxY + 1 + bob, 20, 8, posterColors[i % posterColors.length]);
            px(g, pxX + 3, pxY + 12 + bob, 16, 1, PAL.wood0);
            px(g, pxX + 3, pxY + 15 + bob, 12, 1, PAL.wood0);
            px(g, pxX + 3, pxY + 18 + bob, 14, 1, PAL.wood0);
            /* tiny vinyl */
            disk(g, pxX + 11, pxY + 24 + bob, 3, "#1c1c26");
            px(g, pxX + 10, pxY + 23 + bob, 1, 1, PAL.cream);
            if (GAME.hasPlayed(repo.name)) px(g, pxX + 17, pxY + 25 + bob, 3, 3, PAL.glow0);
          },
          onClick: function (p) { GAME.playRepo(p); },
        });
      })(repos[i], i);
    }
    return maxN;
  }

  return {
    W: W, H: H,
    zones: zones,
    props: props,
    baguettes: baguettes,
    lamps: lamps,
    smokeSources: smokeSources,
    fireflyAreas: fireflyAreas,
    fountain: fountain,
    campfire: { x: 502, y: 930 },
    oven: oven,
    stagePlat: stagePlat,
    pond: pond,
    well: well,
    towerBase: towerBase,
    paintStatic: paintStatic,
    addStageRepos: addStageRepos,
    catBounds: [150, 870, 430, 280],
  };
})();
