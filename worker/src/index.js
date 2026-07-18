/* ═══ Crumb Village ─ room server ═══
   Cloudflare Worker + one Durable Object class ("Village").
   - WebSocket Hibernation API, so idle campers cost nothing.
   - No per-user persistence: only ephemeral positions + country code,
     plus two aggregate counters (all-time loaves, all-time visitors).
   - Rooms cap at MAX_CAMPERS; the worker overflows to village-2, etc.

   Deploy:  cd worker && npx wrangler deploy
   Then paste the URL (wss://<worker>.workers.dev/ws) into v2/js/config.js. */

const MAX_CAMPERS = 40;
const MAX_ROOMS = 5;
const KNEAD_STEP = 2;        /* % per knead */
const KNEAD_MIN_MS = 200;    /* per-connection rate limit */
const IDLE_TIMEOUT_MS = 90000;  /* reap sockets silent for this long */
const SWEEP_EVERY_MS = 60000;   /* alarm cadence while occupied */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      /* try rooms in order until one has space */
      for (let i = 1; i <= MAX_ROOMS; i++) {
        const id = env.VILLAGE.idFromName("village-" + i);
        const stub = env.VILLAGE.get(id);
        const res = await stub.fetch(request);
        if (res.status !== 503) return res;
      }
      return new Response("village is packed", { status: 503 });
    }

    if (url.pathname === "/") {
      return new Response("crumb village worker. the game talks to /ws.", {
        headers: { "content-type": "text/plain" },
      });
    }
    return new Response("not found", { status: 404 });
  },
};

export class Village {
  constructor(ctx, env) {
    this.ctx = ctx;
    /* in-memory only; repopulated after hibernation as clients keep sending.
       Liveness (ls) lives in the socket attachment instead, because this
       memory is wiped every time the DO hibernates. */
    this.positions = new Map();  /* id -> [x, y] */
    this.kneadTimes = new Map(); /* id -> last knead ts */
    this.dropped = new Set();    /* ids already announced as left */
  }

  async fetch(request) {
    const sockets = this.ctx.getWebSockets();
    if (sockets.length >= MAX_CAMPERS) {
      return new Response("full", { status: 503 });
    }

    const country = (request.cf && request.cf.country) || "??";
    const id = crypto.randomUUID().slice(0, 8);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id, c: country, h: "", ls: Date.now() });

    /* keep an idle-socket sweep scheduled while anyone is here */
    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.ctx.storage.setAlarm(Date.now() + SWEEP_EVERY_MS);
    }

    /* aggregate counters (the only persistent state) */
    const visitors = ((await this.ctx.storage.get("visitors")) || 0) + 1;
    await this.ctx.storage.put("visitors", visitors);
    const loaves = (await this.ctx.storage.get("loaves")) || 0;
    const oven = (await this.ctx.storage.get("oven")) || 0;

    const roster = [];
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (!a || a.id === id) continue;
      const pos = this.positions.get(a.id) || [0, 0];
      roster.push({ id: a.id, c: a.c, h: a.h, x: pos[0], y: pos[1] });
    }

    const n = this.ctx.getWebSockets().length;
    server.send(JSON.stringify({
      t: "hi", id, c: country, n, roster, oven, loaves, visitors,
    }));

    this.broadcast({ t: "j", id, c: country, h: "" }, id);
    this.broadcast({ t: "n", n });

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(msg, exceptId) {
    const str = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (exceptId && a && a.id === exceptId) continue;
      try { ws.send(str); } catch (_) { /* closing socket, ignore */ }
    }
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 200) return;
    let m;
    try { m = JSON.parse(raw); } catch (_) { return; }
    const a = ws.deserializeAttachment();
    if (!a) return;
    /* refresh liveness in the attachment, at most every 30s to keep
       storage writes cheap */
    const nowTs = Date.now();
    if (nowTs - (a.ls || 0) > 30000) {
      a.ls = nowTs;
      ws.serializeAttachment(a);
    }

    switch (m.t) {
      case "p": /* heartbeat; lastSeen updated above is the point */
        break;
      case "m": {
        const x = Math.max(0, Math.min(4000, m.x | 0));
        const y = Math.max(0, Math.min(4000, m.y | 0));
        this.positions.set(a.id, [x, y]);
        this.broadcast({ t: "m", id: a.id, x, y }, a.id);
        break;
      }
      case "e": {
        const k = String(m.k || "").slice(0, 8);
        if (["wave", "heart", "zzz", "bang", "note"].includes(k)) {
          this.broadcast({ t: "e", id: a.id, k }, a.id);
        }
        break;
      }
      case "w":
        this.broadcast({ t: "w", id: a.id }, a.id);
        break;
      case "h": {
        const h = String(m.h || "").slice(0, 12);
        a.h = h;
        ws.serializeAttachment(a);
        this.broadcast({ t: "h", id: a.id, h }, a.id);
        break;
      }
      case "k": {
        const now = Date.now();
        const last = this.kneadTimes.get(a.id) || 0;
        if (now - last < KNEAD_MIN_MS) return;
        this.kneadTimes.set(a.id, now);

        let oven = (await this.ctx.storage.get("oven")) || 0;
        oven += KNEAD_STEP;
        if (oven >= 100) {
          const loaves = ((await this.ctx.storage.get("loaves")) || 0) + 1;
          await this.ctx.storage.put("loaves", loaves);
          await this.ctx.storage.put("oven", 0);
          this.broadcast({ t: "b", loaves });
        } else {
          await this.ctx.storage.put("oven", oven);
          this.broadcast({ t: "o", p: oven });
        }
        break;
      }
    }
  }

  webSocketClose(ws) { this.dropSocket(ws); }
  webSocketError(ws) { this.dropSocket(ws); }

  /* reap sockets that have gone silent (dead clients never say goodbye) */
  async alarm() {
    const now = Date.now();
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (!a) continue;
      if (!a.ls) {
        /* pre-reaper attachment: stamp it and give it one sweep */
        a.ls = now;
        ws.serializeAttachment(a);
      } else if (now - a.ls > IDLE_TIMEOUT_MS) {
        this.dropSocket(ws);
      }
    }
    if (this.ctx.getWebSockets().length > 0) {
      await this.ctx.storage.setAlarm(now + SWEEP_EVERY_MS);
    }
  }

  dropSocket(ws) {
    const a = ws.deserializeAttachment();
    try { ws.close(1000, "bye"); } catch (_) {}
    if (!a || this.dropped.has(a.id)) return;
    this.dropped.add(a.id);
    this.positions.delete(a.id);
    this.kneadTimes.delete(a.id);
    /* don't count the socket we're dropping */
    const n = this.ctx.getWebSockets().filter((s) => s !== ws).length;
    this.broadcast({ t: "l", id: a.id }, a.id);
    this.broadcast({ t: "n", n });
  }
}
