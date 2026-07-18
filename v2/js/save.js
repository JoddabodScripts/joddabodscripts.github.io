/* ═══ Crumb Village ─ progression ═══
   Everything lives in localStorage. No accounts, no server-side state
   about you. Clearing site data resets the village's opinion of you. */

var BADGES = {
  firstloaf: { name: "First Loaf",  desc: "Helped bake a batch of bread" },
  regular:   { name: "Regular",     desc: "Visited on 3 different days" },
  nightowl:  { name: "Night Owl",   desc: "Visited between midnight and 5am" },
  catperson: { name: "Cat Person",  desc: "Petted the cat 5 times" },
  critic:    { name: "Critic",      desc: "Played every record on the stage" },
  wanderer:  { name: "Wanderer",    desc: "Visited every corner of the village" },
  socialite: { name: "Socialite",   desc: "Emoted at another visitor" },
  encore:    { name: "???",         desc: "The band remembers" },
};

/* unlock() runs against SAVE.data */
var HATS = {
  chef:    { name: "Chef Hat",        spr: "hat_chef",    cond: "Help bake a loaf",
             unlock: function (d) { return !!d.badges.firstloaf; } },
  beret:   { name: "Beret",           spr: "hat_beret",   cond: "Play every record on stage",
             unlock: function (d) { return !!d.badges.critic; } },
  catears: { name: "Cat Ears",        spr: "hat_catears", cond: "Befriend the cat",
             unlock: function (d) { return !!d.badges.catperson; } },
  bag:     { name: "Paper Bag",       spr: "hat_bag",     cond: "See the whole village",
             unlock: function (d) { return !!d.badges.wanderer; } },
  drills:  { name: "Drill Twintails", spr: "hat_drills",  cond: "Keep finding baguettes...",
             unlock: function (d) { return d.bag.length >= 8; } },
  crown:   { name: "Crumb Crown",     spr: "hat_crown",   cond: "Find all 15 baguettes",
             unlock: function (d) { return d.bag.length >= CV.BAGUETTE_TOTAL; } },
};

var SAVE = (function () {
  var DEFAULTS = {
    bag: [],          /* collected baguette ids */
    badges: {},       /* id -> timestamp */
    hat: "",          /* worn hat id */
    days: [],         /* distinct visit dates (YYYY-MM-DD) */
    pets: 0,          /* oneko pets */
    played: [],       /* repo names played on stage */
    zones: [],        /* zones visited */
    loaves: 0,        /* solo-mode loaves */
    ovenP: 0,         /* solo-mode oven progress 0..100 */
    sound: true,
    music: false,
    secrets: { well: false, song: false },
  };

  var data;

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(CV.SAVE_KEY));
      data = raw && typeof raw === "object" ? raw : {};
    } catch (_) { data = {}; }
    Object.keys(DEFAULTS).forEach(function (k) {
      if (data[k] === undefined) {
        data[k] = JSON.parse(JSON.stringify(DEFAULTS[k]));
      }
    });
    return data;
  }

  function commit() {
    try { localStorage.setItem(CV.SAVE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  load();

  return {
    get data() { return data; },
    commit: commit,

    /* returns true if newly earned */
    earnBadge: function (id) {
      if (!BADGES[id] || data.badges[id]) return false;
      data.badges[id] = Date.now();
      commit();
      return true;
    },

    addBaguette: function (id) {
      if (data.bag.indexOf(id) !== -1) return false;
      data.bag.push(id);
      commit();
      return true;
    },

    hasBaguette: function (id) { return data.bag.indexOf(id) !== -1; },

    addPlayed: function (name) {
      if (data.played.indexOf(name) === -1) {
        data.played.push(name);
        commit();
      }
    },

    addZone: function (id) {
      if (data.zones.indexOf(id) === -1) {
        data.zones.push(id);
        commit();
        return true;
      }
      return false;
    },

    touchToday: function () {
      var d = new Date();
      var key = d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
      if (data.days.indexOf(key) === -1) {
        data.days.push(key);
        commit();
      }
      return data.days.length;
    },
  };
})();
