/* ═══ Crumb Village ─ sprites & painters ═══
   All pixel art is generated at load: string-map sprites for small props,
   procedural painters for terrain and buildings. 1 unit = 1 art pixel. */

/* ── Palette ── */
var PAL = {
  night0: "#0b0e1a", night1: "#121729", night2: "#1a2138",
  grass0: "#1c2b22", grass1: "#233529", grass2: "#2c4032", grass3: "#3a5a42",
  path0: "#4a3b2b", path1: "#5b4936", path2: "#6d5843",
  wood0: "#4e3722", wood1: "#6b4a2f", wood2: "#8a6440", wood3: "#a87e52",
  roof0: "#6e3325", roof1: "#8a4130", roof2: "#a5533a",
  stone0: "#3f4353", stone1: "#565b70", stone2: "#6f7590", stone3: "#8b91a8",
  glow0: "#ffb84d", glow1: "#ffd98a", glow2: "#fff3c9",
  orange: "#ff9838", ember: "#e2571e",
  bread0: "#a5652f", bread1: "#c98b47", bread2: "#e8b36a",
  water0: "#1d3a52", water1: "#2c567a", water2: "#4d84ad",
  red: "#c04a30", redHi: "#e06a48", teto: "#a03a52", tetoHi: "#c85a72",
  white: "#f2efe4", cream: "#e8e4d8", ink: "#10131f", iron: "#2b2b35",
  gold0: "#8a6420", gold1: "#e0b040", gold2: "#ffe080",
  pink: "#e78aa0", blue: "#9ab8ff", sand: "#d8c8a8",
};

/* ── Helpers ── */
function makeSprite(rows, map) {
  var h = rows.length, w = 0, i;
  for (i = 0; i < h; i++) if (rows[i].length > w) w = rows[i].length;
  var c = document.createElement("canvas");
  c.width = w; c.height = h;
  var g = c.getContext("2d");
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < rows[y].length; x++) {
      var ch = rows[y][x];
      if (ch !== "." && ch !== " ") {
        g.fillStyle = map[ch] || "#f0f";
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
}

function scaleSprite(src, n) {
  var c = document.createElement("canvas");
  c.width = src.width * n; c.height = src.height * n;
  var g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

function px(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x | 0, y | 0, w, h);
}

function disk(g, cx, cy, r, color) {
  g.fillStyle = color;
  for (var dy = -r; dy <= r; dy++) {
    var w = Math.floor(Math.sqrt(r * r - dy * dy));
    g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
  }
}

/* Deterministic rng so the grass looks the same every visit */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Sprite registry ── */
var SPR = {};

(function buildSprites() {
  var P = PAL;

  SPR.cursor = makeSprite([
    "O.........",
    "OO........",
    "OwO.......",
    "OwwO......",
    "OwwwO.....",
    "OwwwwO....",
    "OwwwwwO...",
    "OwwwwwwO..",
    "OwwwwwwwO.",
    "OwwwwwwwwO",
    "OwwwwwOOOO",
    "OwwOwwO...",
    "OwO.OwwO..",
    "OO..OwwO..",
    ".....OO...",
  ], { O: P.ink, w: P.white });

  SPR.baguette = makeSprite([
    "..bbbbbbbbbb..",
    ".bcbbcbbcbbcb.",
    "bbbcbbbcbbbcbb",
    ".bbbbbbbbbbbb.",
    "..bbbbbbbbbb..",
  ], { b: P.bread1, c: P.bread2 });

  SPR.loaf = makeSprite([
    "..ooooo..",
    ".obbbbbo.",
    "obcbbcbbo",
    "obbbbbbbo",
    "obbbbbbbo",
    ".obbbbbo.",
  ], { o: P.bread0, b: P.bread1, c: P.bread2 });

  SPR.coin = makeSprite([
    ".gggg.",
    "gGGGGg",
    "gGyyGg",
    "gGyyGg",
    "gGGGGg",
    ".gggg.",
  ], { g: P.gold0, G: P.gold1, y: P.gold2 });

  /* Hats (drawn centered above the cursor tip) */
  SPR.hat_chef = makeSprite([
    "..wWWwwWWw..",
    ".wwwwwwwwww.",
    ".wWwwWWwwWw.",
    "..wwwwwwww..",
    "..gggggggg..",
  ], { w: P.cream, W: "#ffffff", g: "#b8b4a8" });

  SPR.hat_beret = makeSprite([
    ".....rr.....",
    "..rrrrrrrr..",
    ".rrRRrrrrrr.",
    "rrRRrrrrrrrr",
    ".rrrrrrrrrr.",
  ], { r: P.red, R: P.redHi });

  SPR.hat_catears = makeSprite([
    ".k........k.",
    "kkk......kkk",
    "kpkk....kkpk",
    "kkkk....kkkk",
  ], { k: P.iron, p: P.pink });

  SPR.hat_drills = makeSprite([
    "tt............tt",
    "tTt..........tTt",
    "tTtt........ttTt",
    "ttTt........tTtt",
    "tTtt........ttTt",
    "ttt..........ttt",
    ".t............t.",
  ], { t: P.teto, T: P.tetoHi });

  SPR.hat_bag = makeSprite([
    "pppppppppp",
    "pPpppppPpp",
    "pppppppppp",
    "ppEppppEpp",
    "pppppppppp",
    "pppPPppppp",
    "pppppppppp",
  ], { p: "#c9a06a", P: "#b08850", E: P.ink });

  SPR.hat_crown = makeSprite([
    "g.....g.....g",
    "gg...ggg...gg",
    "ggg.ggggg.ggg",
    "ggggggggggggg",
    "gGrGgGgGgrGgg",
    "ggggggggggggg",
  ], { g: P.gold1, G: P.gold2, r: P.red });

  /* Emotes */
  SPR.em_heart = makeSprite([
    ".rr...rr.",
    "rrrr.rrrr",
    "rRrrrrrrr",
    "rrrrrrrrr",
    ".rrrrrrr.",
    "..rrrrr..",
    "...rrr...",
    "....r....",
  ], { r: "#e05a5a", R: "#ff9a9a" });

  SPR.em_zzz = makeSprite([
    ".ZZZZ....",
    "...Z.....",
    "..Z......",
    ".ZZZZ....",
    ".....zzzz",
    ".......z.",
    "......z..",
    ".....zzzz",
  ], { Z: "#cfe0ff", z: P.blue });

  SPR.em_bang = makeSprite([
    ".oo.",
    ".oo.",
    ".oo.",
    ".oo.",
    ".oo.",
    "....",
    ".oo.",
    ".oo.",
  ], { o: P.orange });

  SPR.em_note = makeSprite([
    "..nnnnnn",
    "..n....n",
    "..n....n",
    "..n....n",
    "..n....n",
    ".nn...nn",
    "nnn..nnn",
    ".n....n.",
  ], { n: P.white });

  SPR.em_wave = makeSprite([
    "..w.w.w.",
    "..w.w.w.",
    "w.wwwww.",
    ".wwwwww.",
    ".wwwwww.",
    "..wwww..",
    "..wwww..",
  ], { w: "#f0c8a0" });

  /* Props */
  SPR.duck = makeSprite([
    ".....hh..",
    "....hhhh.",
    "....hEhbb",
    ".hh.hhh..",
    "hhhhhhh..",
    "hhhhhhh..",
    ".hhhhh...",
    "..hhh....",
  ], { h: P.cream, E: P.ink, b: P.orange });

  SPR.mushroom = makeSprite([
    "..rrrrr..",
    ".rrWrrWr.",
    "rrrrrrrrr",
    "rWrrrWrrr",
    "..sssss..",
    "..sssss..",
    "...sss...",
  ], { r: P.red, W: P.white, s: P.sand });

  SPR.flowerA = makeSprite([
    ".fff.",
    "ffyff",
    ".fff.",
    "..g..",
    ".g.g.",
    "..g..",
  ], { f: P.pink, y: P.gold2, g: P.grass2 });

  SPR.flowerB = makeSprite([
    ".fff.",
    "ffyff",
    ".fff.",
    "..g..",
    ".g.g.",
    "..g..",
  ], { f: P.blue, y: P.gold2, g: P.grass2 });

  SPR.bench = makeSprite([
    "BBBBBBBBBBBBBBBBBB",
    "B................B",
    "BBBBBBBBBBBBBBBBBB",
    ".B..............B.",
    "WWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWWWW",
    ".B..............B.",
    ".B..............B.",
  ], { B: P.wood1, W: P.wood2 });

  SPR.barrel = makeSprite([
    ".BBBBBBBB.",
    "BWWWWWWWWB",
    "BWWWWWWWWB",
    "MMMMMMMMMM",
    "BWWWWWWWWB",
    "BWWWWWWWWB",
    "MMMMMMMMMM",
    "BWWWWWWWWB",
    "BWWWWWWWWB",
    ".BBBBBBBB.",
  ], { B: P.wood1, W: P.wood2, M: P.stone1 });

  SPR.crate = makeSprite([
    "BBBBBBBBBB",
    "BWWWWWWWWB",
    "BWBWWWWBWB",
    "BWWBWWBWWB",
    "BWWWBBWWWB",
    "BWWWBBWWWB",
    "BWWBWWBWWB",
    "BWBWWWWBWB",
    "BWWWWWWWWB",
    "BBBBBBBBBB",
  ], { B: P.wood1, W: P.wood2 });

  SPR.lamppost = makeSprite([
    "...gggg...",
    "..gYYYYg..",
    "..gYYYYg..",
    "..gYYYYg..",
    "...gggg...",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "...pppp...",
    "..pppppp..",
  ], { g: P.iron, Y: P.glow1, p: P.iron });

  SPR.mailbox = makeSprite([
    "f.rrrrrrr.",
    "ffrrrrrrrr",
    "f.rWWWWWWr",
    "..rWWWWWWr",
    "..rrrrrrrr",
    "..rrrrrrrr",
    "....pp....",
    "....pp....",
    "....pp....",
    "...pppp...",
  ], { r: P.red, W: P.cream, f: P.gold2, p: P.wood1 });

  SPR.signpost = makeSprite([
    "BBBBBBBBBBBBBBBB",
    "BWWWWWWWWWWWWWWB",
    "BWWWWWWWWWWWWWWB",
    "BWWWWWWWWWWWWWWB",
    "BBBBBBBBBBBBBBBB",
    ".......pp.......",
    ".......pp.......",
    ".......pp.......",
    ".......pp.......",
    "......pppp......",
  ], { B: P.wood0, W: P.wood2, p: P.wood1 });

  SPR.cup = makeSprite([
    ".CCCCCCC..",
    "CFFFFFFFC.",
    "CFnFFnFFCh",
    "CFFnnFFFCh",
    "CFFFFFFFC.",
    ".CCCCCCC..",
    "..CCCCC...",
  ], { C: P.cream, F: "#d9a05b", n: "#8a5a30", h: P.cream });

  SPR.vinylCrate = makeSprite([
    "..vvv.Vvv.v...",
    ".vVvvVvvVvvv..",
    "BBBBBBBBBBBBBB",
    "BWWWWWWWWWWWWB",
    "BWWWWWWWWWWWWB",
    "BWWWWWWWWWWWWB",
    "BBBBBBBBBBBBBB",
  ], { v: "#1c1c26", V: "#3a3a4a", B: P.wood1, W: P.wood2 });

  SPR.drum = makeSprite([
    "..DDDDDDDDDD..",
    ".DWWWWWWWWWWD.",
    "DDDDDDDDDDDDDD",
    "DrrrrrrrrrrrrD",
    "DrrrrrrrrrrrrD",
    "DrrrrrrrrrrrrD",
    "DDDDDDDDDDDDDD",
    ".D..........D.",
    ".D..........D.",
  ], { D: P.iron, W: P.cream, r: P.red });

  SPR.guitar = makeSprite([
    "...gggg...",
    "...g..g...",
    "....gg....",
    "....gg....",
    "....gg....",
    "....gg....",
    "...BBBB...",
    "..BBBBBB..",
    ".BBBBBBBB.",
    ".BBBooBBB.",
    ".BBBooBBB.",
    ".BBBBBBBB.",
    "..BBBBBB..",
    "...BBBB...",
  ], { g: P.wood1, B: P.roof2, o: P.ink });

  SPR.keys = makeSprite([
    "BBBBBBBBBBBBBBBBBB",
    "BWkWkWWkWkWkWWkWkB",
    "BWWWWWWWWWWWWWWWWB",
    "BBBBBBBBBBBBBBBBBB",
    "..p............p..",
    "..p............p..",
  ], { B: P.iron, W: P.cream, k: P.ink, p: P.iron });

  SPR.mic = makeSprite([
    "..mmm...",
    ".mMMMm..",
    ".mMMMm..",
    "..mmm...",
    "...p....",
    "...p....",
    "...p....",
    "...p....",
    "...p....",
    "...p....",
    "..ppp...",
    ".ppppp..",
  ], { m: P.stone1, M: P.stone3, p: P.iron });

  SPR.sack = makeSprite([
    "....ss.....",
    "...ssss....",
    "..SSSSSS...",
    ".SSSSSSSS..",
    "SSSSSSSSSS.",
    "SSSWWSSSSS.",
    "SSSWWSSSSS.",
    "SSSSSSSSSS.",
    ".SSSSSSSS..",
  ], { S: P.sand, s: "#b0a080", W: P.white });

  SPR.bush = makeSprite([
    "...gggggg....",
    ".gggggggggg..",
    "gggGGgggGggg.",
    "ggGggggggggg.",
    ".gggggggggg..",
    "..gggggggg...",
  ], { g: P.grass1, G: P.grass2 });

  SPR.hatstand = makeSprite([
    ".rrrr.....",
    "rrrrrr....",
    "....pp....",
    "..pppppp..",
    "....pp....",
    "....pp....",
    "..pppppp..",
    "....pp....",
    "....pp....",
    "....pp....",
    "...pppp...",
    "..pppppp..",
  ], { r: P.red, p: P.wood1 });

  SPR.pastry = makeSprite([
    "GGGGGGGGGGGGGGGG",
    "G..............G",
    "G.bb..oo..cc...G",
    "GGGGGGGGGGGGGGGG",
    "BWWWWWWWWWWWWWWB",
    "BWWWWWWWWWWWWWWB",
    "BBBBBBBBBBBBBBBB",
  ], { G: "#3a4568", b: P.bread2, o: P.pink, c: "#8a5a30", B: P.wood1, W: P.wood2 });

  SPR.star = makeSprite([
    "..y..",
    "..y..",
    "yyYyy",
    "..y..",
    "..y..",
  ], { y: P.glow1, Y: P.glow2 });

  SPR.medal = makeSprite([
    "..r....r..",
    "..rr..rr..",
    "...rrrr...",
    "..gGGGGg..",
    ".gGGyyGGg.",
    ".gGyyyyGg.",
    ".gGyyyyGg.",
    ".gGGyyGGg.",
    "..gGGGGg..",
    "...gggg...",
  ], { r: P.red, g: P.gold0, G: P.gold1, y: P.gold2 });

  SPR.lily = makeSprite([
    "..gggggg..",
    ".gGGGGGGg.",
    "gGGGG..GGg",
    ".gGGGGGGg.",
    "..gggggg..",
  ], { g: P.grass2, G: P.grass3 });

  SPR.basket = makeSprite([
    ".LbLLbLLbL..",
    "BWBWBWBWBWBW",
    "BWBWBWBWBWB.",
    ".BBBBBBBBB..",
  ], { L: P.bread2, b: P.bread1, B: P.wood1, W: P.wood2 });

  SPR.stump = makeSprite([
    ".BBBBBBBB.",
    "BWWwwWWWWB",
    "BWwBBwWWWB",
    "BWwBBwWWWB",
    "BWWwwWWWWB",
    "BBBBBBBBBB",
    "BBBBBBBBBB",
    ".BBBBBBBB.",
  ], { B: P.wood0, W: P.wood2, w: P.wood3 });

  SPR.logs = makeSprite([
    "....ss....",
    "..bbbbbb..",
    "bBBBBBBBBb",
    "..bbbbbb..",
    "s...ss...s",
  ], { b: P.wood0, B: P.wood1, s: P.stone1 });

  /* Toolbox tools (house interior shelf) */
  SPR.tool_hammer = makeSprite([
    "..MMMMM...",
    "..MMMMM...",
    "..MM......",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
    "....pp....",
  ], { M: P.stone2, p: P.wood2 });

  SPR.tool_wrench = makeSprite([
    ".M..M.....",
    ".MMMM.....",
    "..MM......",
    "...MM.....",
    "....MM....",
    ".....MM...",
    "......MM..",
    "......MMM.",
  ], { M: P.stone2 });

  SPR.tool_screwdriver = makeSprite([
    "....rrr...",
    "....rrr...",
    "....rrr...",
    ".....M....",
    ".....M....",
    ".....M....",
    ".....M....",
    ".....M....",
  ], { r: P.red, M: P.stone2 });

  SPR.tool_saw = makeSprite([
    "BB........",
    "BBMMMMMMMM",
    "BBMMMMMMMM",
    "..M.M.M.M.",
  ], { B: P.wood2, M: P.stone2 });

  SPR.tool_brush = makeSprite([
    "....BB....",
    "....BB....",
    "....BB....",
    "...MMMM...",
    "...ffff...",
    "...ffff...",
  ], { B: P.wood2, M: P.stone1, f: P.orange });

  SPR.tool_oilcan = makeSprite([
    "......M...",
    ".....M....",
    ".MMMM.....",
    ".MMMMM....",
    ".MMMM.....",
    ".MMMM.....",
  ], { M: P.stone2 });

  SPR.tool_ruler = makeSprite([
    "yyyyyyyyyy",
    "y.y.y.y.yy",
    "yyyyyyyyyy",
  ], { y: P.gold1 });

  SPR.tool_pliers = makeSprite([
    ".MM..MM...",
    "..MMMM....",
    "...MM.....",
    "..M..M....",
    ".M....M...",
    ".M....M...",
  ], { M: P.stone2 });

  /* Two more hats */
  SPR.hat_toque = makeSprite([
    "..wwwwwwww..",
    ".wwwwwwwwww.",
    ".wWwwWWwwWw.",
    ".wwwwwwwwww.",
    "..wwwwwwww..",
    "..gggggggg..",
  ], { w: P.cream, W: "#ffffff", g: "#b8b4a8" });

  SPR.hat_cap = makeSprite([
    "...cccccc...",
    "..cccccccc..",
    ".cccccccccc.",
    "cccccccccccc",
    "bbbbbbbbbbbb",
  ], { c: "#7d8a5a", b: "#5c6642" });

  /* Bakery-case treats */
  SPR.croissant = makeSprite([
    ".bb...bb.",
    "bccb.bccb",
    "bcccbcccb",
    ".bcccccb.",
    "..bcccb..",
    "...bbb...",
  ], { b: P.bread0, c: P.bread2 });

  SPR.cookie = makeSprite([
    ".ccccc.",
    "ccdccdc",
    "cccccdc",
    "cdccccc",
    "ccdcdcc",
    ".ccccc.",
  ], { c: "#c98b47", d: "#5a3a1e" });

  SPR.cupcake = makeSprite([
    "...r...",
    "..rrr..",
    ".fffff.",
    "fffffff",
    ".BwBwB.",
    ".BwBwB.",
    "..BBB..",
  ], { r: P.red, f: P.pink, B: P.wood1, w: P.wood2 });

  SPR.donut = makeSprite([
    ".oyogo.",
    "oo...oo",
    "y.....g",
    "o.....o",
    "g.....y",
    "oo...oo",
    ".ogoyo.",
  ], { o: P.pink, y: P.gold2, g: P.grass3 });

  SPR.pretzel = makeSprite([
    ".bb..bb.",
    "b.b..b.b",
    "b..bb..b",
    ".b.bb.b.",
    "b.b..b.b",
    ".bb..bb.",
  ], { b: P.bread0 });

  /* A shy bakery mouse (secret) */
  SPR.mouse = makeSprite([
    "gg......gg",
    "gng....gng",
    ".ggg..ggg.",
    "..gggggg..",
    ".gggEgggg.",
    "gggggggggt",
    ".gggggg..t",
    "..gggg...t",
  ], { g: P.stone2, n: P.pink, E: P.ink, t: P.stone1 });
})();

/* ── Procedural painters (static world background) ── */
var PAINT = {};

PAINT.label = function (g, x, y, text, color, align) {
  g.font = "bold 7px monospace";
  g.textAlign = align || "center";
  g.textBaseline = "top";
  g.fillStyle = color || PAL.cream;
  g.fillText(text, x, y);
  g.textAlign = "left";
};

/* Grass base + tufts + stars are painted by world.js using these */
PAINT.grass = function (g, w, h) {
  px(g, 0, 0, w, h, PAL.grass0);
  var rnd = mulberry32(31);
  for (var i = 0; i < 5200; i++) {
    var x = (rnd() * w) | 0, y = (rnd() * h) | 0, r = rnd();
    g.fillStyle = r < 0.5 ? PAL.grass1 : r < 0.85 ? "#182620" : PAL.grass2;
    g.fillRect(x, y, r < 0.9 ? 2 : 3, 1);
  }
};

PAINT.pathBlob = function (g, x, y, r) {
  /* squashed 2:1 so it reads as ground, not smoke */
  var hr = Math.max(2, Math.floor(r / 2));
  for (var dy = -hr; dy <= hr; dy++) {
    var t = dy / hr;
    var w = Math.floor(Math.sqrt(Math.max(0, 1 - t * t)) * r);
    px(g, x - w, y + dy, w * 2 + 1, 1, PAL.path0);
  }
  var hr2 = Math.max(1, hr - 2);
  for (dy = -hr2; dy <= hr2; dy++) {
    var t2 = dy / hr2;
    var w2 = Math.floor(Math.sqrt(Math.max(0, 1 - t2 * t2)) * (r - 3));
    if (w2 > 0) px(g, x - w2, y + dy, w2 * 2 + 1, 1, "#52412f");
  }
};

/* A dirt path between two points, drawn as overlapping blobs */
PAINT.path = function (g, x1, y1, x2, y2, width) {
  var d = Math.hypot(x2 - x1, y2 - y1);
  var steps = Math.ceil(d / Math.max(3, width * 0.45));
  var rnd = mulberry32((x1 * 7 + y2 * 13) | 0);
  for (var i = 0; i <= steps; i++) {
    var t = i / steps;
    var x = x1 + (x2 - x1) * t + (rnd() - 0.5) * 4;
    var y = y1 + (y2 - y1) * t + (rnd() - 0.5) * 4;
    PAINT.pathBlob(g, x | 0, y | 0, width);
  }
};

PAINT.plaza = function (g, cx, cy, w, h) {
  var x0 = cx - w / 2, y0 = cy - h / 2;
  px(g, x0, y0, w, h, PAL.path0);
  var rnd = mulberry32(64);
  for (var y = 0; y < h; y += 8) {
    for (var x = ((y / 8) % 2) * 6; x < w - 6; x += 12) {
      var shade = rnd();
      g.fillStyle = shade < 0.55 ? PAL.path1 : shade < 0.92 ? "#54432f" : PAL.path2;
      g.fillRect(x0 + x + 1, y0 + y + 1, 10, 6);
    }
  }
  /* worn edges */
  for (var i = 0; i < 90; i++) {
    var ex = x0 + rnd() * w, ey = y0 + (rnd() < 0.5 ? rnd() * 4 : h - rnd() * 4);
    px(g, ex, ey, 3, 2, PAL.path0);
  }
};

/* Generic cottage. o: {x,y,w,h, wall, wallDark, roof, roofHi, door:{x,w}, windows:[{x,y,w,h}], chimney:x|null} */
PAINT.cottage = function (g, o) {
  var x = o.x, y = o.y, w = o.w, h = o.h;
  var roofH = Math.floor(w * 0.28);

  /* walls */
  px(g, x, y, w, h, o.wall);
  px(g, x, y + h - 3, w, 3, o.wallDark);
  /* timber frame lines */
  px(g, x, y, w, 2, o.wallDark);
  px(g, x, y, 2, h, o.wallDark);
  px(g, x + w - 2, y, 2, h, o.wallDark);

  /* roof: ridge on top, eaves overhang at the bottom */
  for (var i = 0; i < roofH; i++) {
    var f = (roofH - 1 - i) / Math.max(1, roofH - 1);
    var inset = Math.floor(f * (w / 2 - 8));
    px(g, x - 4 + inset, y - roofH + i, w + 8 - inset * 2, 1,
      i === 0 || i % 4 === 0 ? o.roofHi : o.roof);
  }
  px(g, x - 5, y - 2, w + 10, 3, o.roof);

  /* chimney */
  if (o.chimney != null) {
    px(g, x + o.chimney, y - roofH - 8, 8, roofH + 6, PAL.stone1);
    px(g, x + o.chimney - 1, y - roofH - 9, 10, 3, PAL.stone2);
  }

  /* door */
  if (o.door) {
    var dx = x + o.door.x, dw = o.door.w, dh = Math.floor(h * 0.62);
    px(g, dx - 1, y + h - dh - 1, dw + 2, dh + 1, o.wallDark);
    px(g, dx, y + h - dh, dw, dh, PAL.wood0);
    px(g, dx + 1, y + h - dh + 1, dw - 2, 2, PAL.wood1);
    px(g, dx + dw - 3, y + h - Math.floor(dh / 2), 2, 2, PAL.gold1); /* knob */
  }

  /* windows (warm glow) */
  (o.windows || []).forEach(function (win) {
    px(g, x + win.x - 1, y + win.y - 1, win.w + 2, win.h + 2, o.wallDark);
    px(g, x + win.x, y + win.y, win.w, win.h, PAL.glow0);
    px(g, x + win.x + 1, y + win.y + 1, win.w - 2, 1, PAL.glow1);
    px(g, x + win.x + Math.floor(win.w / 2), y + win.y, 1, win.h, o.wallDark);
    px(g, x + win.x, y + win.y + Math.floor(win.h / 2), win.w, 1, o.wallDark);
  });
};

PAINT.tree = function (g, x, y, size) {
  /* x,y = trunk base */
  px(g, x - 2, y - size * 0.5, 4, size * 0.5, PAL.wood0);
  disk(g, x, y - size * 0.55, size * 0.42, "#16211b");
  disk(g, x - size * 0.18, y - size * 0.72, size * 0.34, PAL.grass1);
  disk(g, x + size * 0.15, y - size * 0.66, size * 0.3, PAL.grass1);
  disk(g, x, y - size * 0.85, size * 0.28, PAL.grass2);
  disk(g, x - size * 0.1, y - size * 0.9, size * 0.14, PAL.grass3);
};

PAINT.fountain = function (g, cx, cy) {
  disk(g, cx, cy, 26, PAL.stone0);
  disk(g, cx, cy, 23, PAL.stone1);
  disk(g, cx, cy, 19, PAL.stone0);
  disk(g, cx, cy, 17, PAL.water0);
  /* center pillar */
  disk(g, cx, cy - 2, 6, PAL.stone1);
  px(g, cx - 3, cy - 12, 6, 10, PAL.stone1);
  px(g, cx - 5, cy - 14, 10, 3, PAL.stone2);
};

PAINT.pond = function (g, cx, cy, rx, ry) {
  var steps = ry;
  for (var i = -steps; i <= steps; i++) {
    var w = Math.floor(Math.sqrt(1 - (i / steps) * (i / steps)) * rx);
    px(g, cx - w, cy + i, w * 2, 1, PAL.water0);
  }
  for (i = -steps + 3; i <= steps - 3; i++) {
    var w2 = Math.floor(Math.sqrt(1 - (i / (steps - 3)) * (i / (steps - 3))) * (rx - 5));
    if (w2 > 0) px(g, cx - w2, cy + i, w2 * 2, 1, "#22435e");
  }
  /* bank */
  var rnd = mulberry32(9);
  for (i = 0; i < 40; i++) {
    var a = rnd() * Math.PI * 2;
    px(g, cx + Math.cos(a) * (rx - 1), cy + Math.sin(a) * (ry - 1), 3, 2, PAL.path0);
  }
};

PAINT.well = function (g, x, y) {
  /* stone ring */
  px(g, x, y + 10, 26, 10, PAL.stone0);
  px(g, x + 1, y + 10, 24, 3, PAL.stone2);
  px(g, x + 3, y + 13, 20, 5, PAL.ink);
  /* posts + roof */
  px(g, x + 1, y - 6, 3, 16, PAL.wood1);
  px(g, x + 22, y - 6, 3, 16, PAL.wood1);
  for (var i = 0; i < 7; i++) {
    px(g, x - 2 + i, y - 6 - i, 30 - i * 2, 2, i % 2 ? PAL.roof1 : PAL.roof2);
  }
  /* crank + rope */
  px(g, x + 4, y - 1, 18, 2, PAL.wood2);
  px(g, x + 12, y + 1, 1, 9, "#b0a080");
};

PAINT.stage = function (g, x, y, w, h) {
  /* backdrop wall */
  px(g, x, y - 52, w, 52, "#20263f");
  px(g, x, y - 52, w, 3, PAL.wood0);
  px(g, x, y - 52, 3, 52, PAL.wood0);
  px(g, x + w - 3, y - 52, 3, 52, PAL.wood0);
  /* curtain top */
  for (var i = 0; i < w; i += 8) {
    px(g, x + i, y - 52, 4, 8, PAL.red);
    px(g, x + i + 4, y - 52, 4, 10, PAL.roof0);
  }
  /* platform */
  px(g, x - 4, y, w + 8, h, PAL.wood2);
  px(g, x - 4, y, w + 8, 3, PAL.wood3);
  for (i = 8; i < w + 4; i += 14) px(g, x - 4 + i, y + 3, 1, h - 3, PAL.wood1);
  px(g, x - 4, y + h, w + 8, 4, PAL.wood0);
};

PAINT.clocktower = function (g, x, y) {
  /* x,y = base center-bottom. Tower is 30 wide, ~92 tall */
  var w = 30, h = 68, tx = x - w / 2;
  px(g, tx, y - h, w, h, PAL.stone1);
  px(g, tx, y - h, 3, h, PAL.stone0);
  px(g, tx + w - 3, y - h, 3, h, PAL.stone0);
  /* brick hints */
  var rnd = mulberry32(7);
  for (var i = 0; i < 26; i++) {
    px(g, tx + 3 + rnd() * (w - 9), y - h + 4 + rnd() * (h - 10), 5, 2, PAL.stone0);
  }
  /* clock face backing (hands are drawn live) */
  disk(g, x, y - h + 18, 11, PAL.stone2);
  disk(g, x, y - h + 18, 9, PAL.cream);
  /* roof: pointed, ridge at top */
  for (i = 0; i < 14; i++) {
    var f = (13 - i) / 13;
    var inset = Math.floor(f * (w / 2 + 1));
    px(g, tx - 3 + inset, y - h - 14 + i, w + 6 - inset * 2, 2, i % 3 ? PAL.roof1 : PAL.roof2);
  }
  px(g, x - 1, y - h - 18, 2, 6, PAL.gold1);
  /* door */
  px(g, x - 5, y - 14, 10, 14, PAL.wood0);
};

/* Little market stall: posts, striped awning, counter with bread */
PAINT.stall = function (g, x, y) {
  /* posts */
  px(g, x, y + 6, 2, 22, PAL.wood1);
  px(g, x + 40, y + 6, 2, 22, PAL.wood1);
  /* counter */
  px(g, x - 2, y + 20, 46, 9, PAL.wood2);
  px(g, x - 2, y + 20, 46, 2, PAL.wood3);
  px(g, x - 2, y + 27, 46, 2, PAL.wood0);
  /* bread on the counter */
  g.drawImage(SPR.basket, x + 3, y + 13, 24, 8);
  g.drawImage(SPR.loaf, x + 29, y + 14, 9, 6);
  /* awning */
  for (var i = 0; i < 7; i++) {
    px(g, x - 3 + i * 7, y, 7, 5, i % 2 ? PAL.cream : PAL.red);
  }
  px(g, x - 3, y + 5, 49, 1, PAL.roof0);
};

PAINT.oven = function (g, x, y) {
  /* big communal stone oven, x,y = top-left; ~46x38. Mouth glow is live. */
  px(g, x + 2, y + 6, 42, 32, PAL.stone1);
  disk(g, x + 23, y + 8, 21, PAL.stone1);
  disk(g, x + 23, y + 8, 18, PAL.stone2);
  /* mouth arch (dark, fire drawn dynamically) */
  disk(g, x + 23, y + 22, 12, PAL.stone0);
  px(g, x + 11, y + 22, 24, 14, PAL.stone0);
  px(g, x + 13, y + 24, 20, 12, PAL.ink);
  /* chimney pipe */
  px(g, x + 19, y - 14, 8, 16, PAL.stone0);
  px(g, x + 18, y - 15, 10, 3, PAL.stone1);
  /* hearth slab */
  px(g, x - 2, y + 38, 50, 5, PAL.stone0);
};
