// VOID GARDEN — simulation. Owns all game state and the per-frame update:
// movement, dashing, mote gathering, sentinel hunting, scoring and the clock.
// Rendering lives in render.js; this file never touches the canvas.
import { CONFIG as C } from './config.js';
import { makeRng, range } from './random.js';

export function createWorld(seed) {
  const rng = makeRng(seed);
  const world = {
    rng,
    cx: C.width / 2,
    cy: C.height / 2,
    state: 'menu', // menu | playing | paused | won | lost
    time: 0,
    clock: C.startTime,
    score: 0,
    combo: 1,
    comboTimer: 0,
    gathered: 0,
    shattered: 0,
    hearts: C.startHearts,
    player: {
      x: C.width / 2, y: C.height / 2, vx: 0, vy: 0,
      faceX: 1, faceY: 0, dashT: 0, dashCd: 0, invuln: 0, trail: [],
    },
    motes: [],
    sentinels: [],
    particles: [],
    floaters: [],
    moteTimer: 0,
    sentinelTimer: 2.2,
    shake: 0,
    events: [], // sound cues for main.js: gather | shatter | hurt | dash
  };
  for (let i = 0; i < 7; i++) spawnMote(world);
  return world;
}

function arenaPoint(world, minR, maxR) {
  const a = world.rng() * Math.PI * 2;
  const r = range(world.rng, minR, maxR);
  return { x: world.cx + Math.cos(a) * r, y: world.cy + Math.sin(a) * r };
}

export function spawnMote(world) {
  const p = arenaPoint(world, 30, C.arenaRadius - 26);
  world.motes.push({
    x: p.x, y: p.y,
    vx: range(world.rng, -14, 14), vy: range(world.rng, -14, 14),
    phase: world.rng() * Math.PI * 2,
  });
}

function spawnSentinel(world) {
  const p = arenaPoint(world, C.arenaRadius - 6, C.arenaRadius - 6);
  const speed = range(world.rng, 62, 84) + Math.min(38, world.time * 0.55);
  world.sentinels.push({
    x: p.x, y: p.y, vx: 0, vy: 0, speed,
    wobble: world.rng() * Math.PI * 2, spin: range(world.rng, -1.4, 1.4),
  });
}

function burst(world, x, y, colour, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = world.rng() * Math.PI * 2;
    const s = range(world.rng, speed * 0.3, speed);
    world.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: range(world.rng, 0.3, 0.7), maxLife: 0.7, colour,
    });
  }
}

function floater(world, x, y, text, colour) {
  world.floaters.push({ x, y, text, colour, life: 0.9 });
}

export function startRun(world) {
  const fresh = createWorld((world.rng() * 1e9) | 0);
  Object.assign(world, fresh);
  world.state = 'playing';
}

export function update(world, input, dt) {
  if (world.state !== 'playing') return;
  const P = world.player;
  world.time += dt;
  world.clock -= dt;
  world.shake = Math.max(0, world.shake - dt * 26);

  // --- combo decay -------------------------------------------------------
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 1;
  }

  // --- player movement ---------------------------------------------------
  const mv = input.moveVector();
  if (mv.x || mv.y) { P.faceX = mv.x; P.faceY = mv.y; }
  P.dashCd = Math.max(0, P.dashCd - dt);
  P.invuln = Math.max(0, P.invuln - dt);
  if (input.consume('dashPressed') && P.dashCd <= 0) {
    let dx = mv.x, dy = mv.y;
    if (!dx && !dy) { dx = P.faceX; dy = P.faceY; }
    P.dashT = C.dashTime;
    P.dashCd = C.dashCooldown;
    P.vx = dx * C.dashSpeed;
    P.vy = dy * C.dashSpeed;
    world.events.push('dash');
  }
  if (P.dashT > 0) {
    P.dashT -= dt;
  } else {
    P.vx = mv.x * C.playerSpeed;
    P.vy = mv.y * C.playerSpeed;
  }
  P.x += P.vx * dt;
  P.y += P.vy * dt;
  // stay inside the garden
  const dx = P.x - world.cx, dy = P.y - world.cy;
  const dist = Math.hypot(dx, dy);
  const maxD = C.arenaRadius - C.playerRadius;
  if (dist > maxD) {
    P.x = world.cx + (dx / dist) * maxD;
    P.y = world.cy + (dy / dist) * maxD;
  }
  P.trail.push({ x: P.x, y: P.y, life: 0.28 });
  if (P.trail.length > 22) P.trail.shift();
  for (const t of P.trail) t.life -= dt;
  world.player.trail = P.trail.filter((t) => t.life > 0);

  // --- motes -------------------------------------------------------------
  world.moteTimer -= dt;
  const moteCap = 9;
  if (world.moteTimer <= 0 && world.motes.length < moteCap) {
    spawnMote(world);
    world.moteTimer = range(world.rng, 0.5, 1.1);
  }
  for (const m of world.motes) {
    m.x += m.vx * dt; m.y += m.vy * dt; m.phase += dt * 2.4;
    const mx = m.x - world.cx, my = m.y - world.cy;
    const md = Math.hypot(mx, my);
    if (md > C.arenaRadius - 20) { m.vx = -m.vx; m.vy = -m.vy; }
  }
  for (let i = world.motes.length - 1; i >= 0; i--) {
    const m = world.motes[i];
    if (Math.hypot(m.x - P.x, m.y - P.y) < C.moteRadius + C.playerRadius + 2) {
      world.motes.splice(i, 1);
      world.gathered++;
      world.combo = Math.min(C.comboMax, world.combo + (world.comboTimer > 0 ? 1 : 0));
      world.comboTimer = C.comboWindow;
      const gain = C.moteValue * world.combo;
      world.score += gain;
      world.clock = Math.min(C.startTime + 20, world.clock + C.moteTimeBonus);
      floater(world, m.x, m.y - 14, `+${gain}`, '#ffe9a3');
      burst(world, m.x, m.y, '#ffd968', 7, 130);
      world.events.push('gather');
      spawnMote(world);
    }
  }

  // --- sentinels ---------------------------------------------------------
  world.sentinelTimer -= dt;
  const sentinelCap = 3 + Math.floor(world.time / 16);
  if (world.sentinelTimer <= 0 && world.sentinels.length < sentinelCap) {
    spawnSentinel(world);
    world.sentinelTimer = Math.max(1.5, 3.4 - world.time * 0.02);
  }
  for (let i = world.sentinels.length - 1; i >= 0; i--) {
    const s = world.sentinels[i];
    s.wobble += dt * 3;
    const tx = P.x - s.x, ty = P.y - s.y;
    const td = Math.hypot(tx, ty) || 1;
    const steer = 2.6 * dt;
    s.vx += ((tx / td) * s.speed - s.vx) * steer;
    s.vy += ((ty / td) * s.speed - s.vy) * steer;
    s.x += s.vx * dt + Math.cos(s.wobble) * 9 * dt;
    s.y += s.vy * dt + Math.sin(s.wobble) * 9 * dt;
    if (td < C.sentinelRadius + C.playerRadius) {
      if (P.dashT > 0) {
        world.sentinels.splice(i, 1);
        world.shattered++;
        const gain = C.shatterValue * world.combo;
        world.score += gain;
        floater(world, s.x, s.y - 16, `+${gain}`, '#ff9d7a');
        burst(world, s.x, s.y, '#ff7a59', 16, 220);
        world.events.push('shatter');
      } else if (P.invuln <= 0) {
        world.hearts--;
        P.invuln = C.hurtInvulnerable;
        world.shake = 9;
        burst(world, P.x, P.y, '#ff5d73', 14, 200);
        world.events.push('hurt');
        // knock the wisp away from the sentinel
        P.x -= (tx / td) * 34;
        P.y -= (ty / td) * 34;
        if (world.hearts <= 0) return endRun(world, false);
      }
    }
  }

  // --- particles & floaters ----------------------------------------------
  for (const p of world.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.92; p.vy *= 0.92; p.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const f of world.floaters) { f.y -= 30 * dt; f.life -= dt; }
  world.floaters = world.floaters.filter((f) => f.life > 0);

  // --- win / lose ----------------------------------------------------------
  if (world.score >= C.targetScore) return endRun(world, true);
  if (world.clock <= 0) {
    world.clock = 0;
    return endRun(world, false);
  }
}

function endRun(world, won) {
  world.state = won ? 'won' : 'lost';
  world.events.push(won ? 'win' : 'lose');
}
