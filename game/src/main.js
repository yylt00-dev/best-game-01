// VOID GARDEN — entry point. Wires input, sound and the render loop, runs
// the state machine (menu → playing ⇄ paused → won/lost), and supports the
// screenshot convention used by the kit: ?shot=start|play|end&seed=N renders
// one genuine game state (menu, mid-run, or the Bloom ending).
import { CONFIG as C } from './config.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { createWorld, startRun, update, spawnMote } from './world.js';
import { draw } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const sound = new SoundBank();

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '20261118');
const shot = params.get('shot');

const world = createWorld(seed);

if (shot === 'play') setupPlayShot(world);
if (shot === 'end') setupEndShot(world);

function setupPlayShot(w) {
  w.state = 'playing';
  w.time = 28; w.clock = 47; w.score = 340; w.combo = 3; w.comboTimer = 2.1;
  w.gathered = 19; w.shattered = 3; w.hearts = 2;
  w.player.x = w.cx - 60; w.player.y = w.cy + 30;
  w.player.faceX = 1; w.player.faceY = -0.4;
  for (let i = 0; i < 14; i++) w.player.trail.push({ x: w.player.x - i * 7, y: w.player.y + i * 3, life: 0.28 - i * 0.015 });
  while (w.motes.length < 6) spawnMote(w);
  const fakeInput = { moveVector: () => ({ x: 1, y: -0.4 }), consume: () => false };
  for (let i = 0; i < 40; i++) update(w, fakeInput, 1 / 30);
  w.state = 'playing';
}

function setupEndShot(w) {
  setupPlayShot(w);
  w.score = 1240; w.gathered = 61; w.shattered = 9; w.hearts = 2;
  w.state = 'won';
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (input.consume('pausePressed') && (world.state === 'playing' || world.state === 'paused')) {
    world.state = world.state === 'playing' ? 'paused' : 'playing';
  }
  if (world.state === 'menu' || world.state === 'won' || world.state === 'lost') {
    if (input.consume('confirmPressed')) {
      sound.unlock();
      startRun(world);
    }
  } else {
    input.consume('confirmPressed');
  }
  if (input.keys.has('m')) { sound.muted = true; }

  update(world, input, dt);
  for (const ev of world.events.splice(0)) {
    if (ev === 'gather') sound.gather(world.combo);
    else if (ev === 'win') sound.win();
    else if (ev === 'lose') sound.lose();
    else if (sound[ev]) sound[ev]();
  }

  draw(ctx, world, input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
