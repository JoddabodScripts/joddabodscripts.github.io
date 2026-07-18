/* ═══════════════════════════════════════════════════════════════════
   CRUMB VILLAGE ─ config

   ┌─────────────────────────────────────────────────────────────────┐
   │  WS_URL: paste the deployed worker URL here to go multiplayer.  │
   │  Example: "wss://crumb-village.yourname.workers.dev/ws"         │
   │  Leave "" and the village runs in solo mode (still fully        │
   │  playable, oven progress is just local).                        │
   └─────────────────────────────────────────────────────────────────┘ */
var WS_URL = "wss://crumb-village.joddabod4.workers.dev/ws";

var CV = {
  // Render scale: 1 world "art pixel" = SCALE screen pixels.
  SCALE: 2,

  // World size in art pixels (several screens at SCALE 2).
  WORLD_W: 1600,
  WORLD_H: 1200,

  // Camera: the middle CAM_DEAD fraction of the screen (per axis) is a dead
  // zone; outside it the camera pans, ramping up to CAM_SPEED * 60 art px/s
  // at the screen edge.
  CAM_DEAD: 0.28,
  CAM_SPEED: 7.5,

  // Accessibility / device
  RM: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  TOUCH: window.matchMedia("(pointer: coarse)").matches,

  GH_USER: "JoddabodScripts",
  EMAIL: "joddabod4@joddabod.is-a.dev",
  NERIMITY: "https://nerimity.com/app/profile/1750075711936438273",
  GITHUB: "https://github.com/JoddabodScripts",
  FRIEND_MIKU: "https://nerimity.com/app/profile/1750175709051138049",

  SAVE_KEY: "crumbvillage",
  BAGUETTE_TOTAL: 15,
};
