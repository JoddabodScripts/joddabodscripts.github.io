/* ═══ Crumb Village ─ multiplayer client ═══
   Talks to the Cloudflare Worker (worker/ in the repo). If WS_URL is empty
   or the socket dies, the game silently runs solo. Protocol is tiny JSON;
   positions go out at ~10/s, everything else is event-driven. */

var NET = (function () {
  var ws = null;
  var online = false;
  var myId = null, myCountry = "";
  var others = new Map(); /* id -> {c, h, x, y, tx, ty, has} */
  var tries = 0;
  var reconnectTimer = null;
  var pingTimer = null;
  var lastMoveSent = 0, pendingMove = null, moveTimer = null;

  /* game.js fills these in before connect() */
  var on = {
    hello: function () {}, join: function () {}, leave: function () {},
    emote: function () {}, wiggle: function () {}, oven: function () {},
    bake: function () {}, count: function () {}, hat: function () {},
    drop: function () {},
  };

  function connect() {
    if (!WS_URL || ws || tries > 4 || !("WebSocket" in window)) return;
    try {
      ws = new WebSocket(WS_URL);
    } catch (_) { return; }

    ws.onopen = function () { tries = 0; };

    ws.onmessage = function (ev) {
      var m;
      try { m = JSON.parse(ev.data); } catch (_) { return; }
      switch (m.t) {
        case "hi":
          online = true;
          myId = m.id;
          myCountry = m.c || "";
          others.clear();
          (m.roster || []).forEach(function (r) {
            if (r.id !== myId) {
              others.set(r.id, { c: r.c, h: r.h || "", x: r.x, y: r.y, tx: r.x, ty: r.y, has: !!(r.x || r.y) });
            }
          });
          on.hello(m);
          /* heartbeat so the server's idle reaper knows we're alive */
          if (!pingTimer) pingTimer = setInterval(function () { send({ t: "p" }); }, 25000);
          break;
        case "j":
          if (m.id !== myId) others.set(m.id, { c: m.c, h: m.h || "", x: 0, y: 0, tx: 0, ty: 0, has: false });
          on.join(m);
          break;
        case "l":
          others.delete(m.id);
          on.leave(m);
          break;
        case "m": {
          var o = others.get(m.id);
          if (o) {
            if (!o.has) { o.x = m.x; o.y = m.y; o.has = true; }
            o.tx = m.x; o.ty = m.y;
          }
          break;
        }
        case "e": on.emote(m.id, m.k); break;
        case "w": on.wiggle(m.id); break;
        case "h": {
          var oh = others.get(m.id);
          if (oh) oh.h = m.h || "";
          break;
        }
        case "o": on.oven(m.p); break;
        case "b": on.bake(m.loaves); break;
        case "n": on.count(m.n); break;
      }
    };

    ws.onclose = ws.onerror = function () {
      /* onerror and onclose can both fire for the same socket; and a stale
         socket's late event must not clobber a newer connection */
      var sock = this;
      try { sock.close(); } catch (_) {}
      if (sock !== ws) return;
      var wasOnline = online;
      online = false;
      ws = null;
      others.clear();
      if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
      if (wasOnline) on.drop();
      tries++;
      /* quiet retry with backoff; solo mode meanwhile */
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(function () {
          reconnectTimer = null;
          connect();
        }, Math.min(30000, 2000 * Math.pow(2, tries)));
      }
    };
  }

  function send(obj) {
    if (ws && ws.readyState === 1 && online) {
      try { ws.send(JSON.stringify(obj)); } catch (_) {}
    }
  }

  return {
    connect: connect,
    on: on,
    get online() { return online; },
    get id() { return myId; },
    get country() { return myCountry; },
    others: others,

    sendMove: function (x, y) {
      if (!online) return;
      pendingMove = { t: "m", x: Math.round(x), y: Math.round(y) };
      var now = Date.now();
      if (now - lastMoveSent >= 100) {
        lastMoveSent = now;
        send(pendingMove);
        pendingMove = null;
      } else if (!moveTimer) {
        moveTimer = setTimeout(function () {
          moveTimer = null;
          if (pendingMove) {
            lastMoveSent = Date.now();
            send(pendingMove);
            pendingMove = null;
          }
        }, 100 - (now - lastMoveSent));
      }
    },
    sendEmote: function (k) { send({ t: "e", k: k }); },
    sendWiggle: function () { send({ t: "w" }); },
    sendKnead: function () { send({ t: "k" }); },
    sendHat: function (h) { send({ t: "h", h: h || "" }); },
  };
})();
