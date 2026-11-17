// VOID GARDEN — tuning constants. Everything gameplay-related lives here so
// the balance can be adjusted in one place.
export const CONFIG = {
  width: 960,
  height: 600,
  arenaRadius: 262,          // the garden is a circle in the middle of the void
  startTime: 75,             // seconds on the clock at the start of a run
  targetScore: 1200,         // reach this to make the garden Bloom (win)
  startHearts: 3,
  playerRadius: 13,
  playerSpeed: 235,          // px per second
  dashSpeed: 640,
  dashTime: 0.16,            // seconds a dash lasts
  dashCooldown: 0.55,
  moteRadius: 8,
  moteValue: 10,
  moteTimeBonus: 0.6,        // seconds added per mote gathered
  comboWindow: 3.0,          // seconds to keep a combo alive
  comboMax: 5,
  shatterValue: 25,
  sentinelRadius: 15,
  hurtInvulnerable: 1.4,     // seconds of grace after losing a heart
};
