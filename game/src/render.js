// VOID GARDEN — rendering. Draws the world and every screen (menu, HUD,
// pause, win, lose) onto the 2D canvas. Reads state, never changes it.
import { CONFIG as C } from './config.js';

export function draw(ctx, world, input) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawVoid(ctx, world);
  drawArena(ctx, world);
  for (const m of world.motes) drawMote(ctx, m, world.time);
  for (const s of world.sentinels) drawSentinel(ctx, s, world.time);
  drawParticles(ctx, world);
  drawPlayer(ctx, world);
  drawFloaters(ctx, world);
  ctx.restore();

  if (world.state !== 'menu') drawHud(ctx, world);
  if (world.state === 'menu') drawMenu(ctx, world);
  if (world.state === 'paused') drawPause(ctx);
  if (world.state === 'won') drawEnd(ctx, world, true);
  if (world.state === 'lost') drawEnd(ctx, world, false);
}

function drawVoid(ctx, world) {
  const g = ctx.createRadialGradient(world.cx, world.cy, 60, world.cx, world.cy, 560);
  g.addColorStop(0, '#1d1430');
  g.addColorStop(0.55, '#120c22');
  g.addColorStop(1, '#07040f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, C.width, C.height);
  // drifting spores in the void
  ctx.fillStyle = 'rgba(190,160,255,0.25)';
  for (let i = 0; i < 42; i++) {
    const x = (i * 173.3 + world.time * (4 + (i % 5))) % C.width;
    const y = (i * 97.7) % C.height;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawArena(ctx, world) {
  const { cx, cy } = world;
  const R = C.arenaRadius;
  // soil disc
  const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, R);
  g.addColorStop(0, '#2c1e47');
  g.addColorStop(0.8, '#241739');
  g.addColorStop(1, '#1a102e');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  // petal ring
  const petals = 28;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 + Math.sin(world.time * 0.4 + i) * 0.02;
    const x = cx + Math.cos(a) * (R + 7);
    const y = cy + Math.sin(a) * (R + 7);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = i % 2 ? '#7d5ba6' : '#9778c2';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(255,217,104,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  // faint inner rings, like raked soil
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (const rr of [R * 0.66, R * 0.36]) {
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawMote(ctx, m, time) {
  const pulse = 1 + Math.sin(m.phase) * 0.18;
  ctx.save();
  ctx.shadowColor = '#ffd968';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffe9a3';
  ctx.beginPath(); ctx.arc(m.x, m.y, C.moteRadius * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff7dd';
  ctx.beginPath(); ctx.arc(m.x - 2, m.y - 2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawSentinel(ctx, s, time) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(time * s.spin);
  ctx.shadowColor = '#ff5d47';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#8e2432';
  ctx.beginPath();
  const spikes = 8;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const a2 = a + Math.PI / spikes;
    ctx.lineTo(Math.cos(a) * (C.sentinelRadius + 6), Math.sin(a) * (C.sentinelRadius + 6));
    ctx.lineTo(Math.cos(a2) * C.sentinelRadius * 0.62, Math.sin(a2) * C.sentinelRadius * 0.62);
  }
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffb199';
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, world) {
  const P = world.player;
  for (const t of P.trail) {
    ctx.fillStyle = `rgba(140,240,200,${Math.max(0, t.life) * 1.1})`;
    ctx.beginPath(); ctx.arc(t.x, t.y, 7, 0, Math.PI * 2); ctx.fill();
  }
  const blink = P.invuln > 0 && Math.floor(world.time * 14) % 2 === 0;
  ctx.save();
  if (!blink) {
    ctx.shadowColor = '#7dffce';
    ctx.shadowBlur = 20;
    const g = ctx.createRadialGradient(P.x - 4, P.y - 5, 2, P.x, P.y, C.playerRadius + 3);
    g.addColorStop(0, '#eafff5');
    g.addColorStop(0.55, '#8cf5c3');
    g.addColorStop(1, '#2fae74');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(P.x, P.y, C.playerRadius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#123b28';
    const ex = P.faceX * 3, ey = P.faceY * 3;
    ctx.beginPath(); ctx.arc(P.x + ex - 4, P.y + ey - 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(P.x + ex + 4, P.y + ey - 1, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (P.dashCd <= 0 && world.state === 'playing') {
    ctx.strokeStyle = 'rgba(125,255,206,0.35)';
    ctx.beginPath(); ctx.arc(P.x, P.y, C.playerRadius + 5, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.colour;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx, world) {
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 1.6);
    ctx.fillStyle = f.colour;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, world) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f3eaff';
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText(String(world.score), 22, 38);
  ctx.font = '500 12px system-ui, sans-serif';
  ctx.fillStyle = '#b7a6d9';
  ctx.fillText(`GOAL ${C.targetScore}`, 22, 56);

  // progress to Bloom
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(22, 64, 170, 6);
  ctx.fillStyle = '#ffd968';
  ctx.fillRect(22, 64, 170 * Math.min(1, world.score / C.targetScore), 6);

  if (world.combo > 1) {
    ctx.fillStyle = '#ffd968';
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText(`COMBO ×${world.combo}`, 22, 94);
  }

  // hearts
  for (let i = 0; i < C.startHearts; i++) {
    ctx.fillStyle = i < world.hearts ? '#ff5d73' : 'rgba(255,255,255,0.15)';
    const x = C.width - 30 - i * 26, y = 30;
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.bezierCurveTo(x - 9, y - 6, x + 9, y - 6, x, y + 5);
    ctx.bezierCurveTo(x + 9, y + 4, x - 9, y + 4, x, y + 5);
    ctx.fill();
  }

  // clock bar
  const w = 220;
  const frac = Math.max(0, world.clock / (C.startTime + 20));
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(C.width - w - 22, 52, w, 7);
  ctx.fillStyle = world.clock < 12 ? '#ff5d73' : '#8cf5c3';
  ctx.fillRect(C.width - w - 22, 52, w * frac, 7);
  ctx.fillStyle = '#b7a6d9';
  ctx.font = '500 12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(world.clock)}s`, C.width - 22, 76);
  ctx.textAlign = 'left';
}

function panel(ctx, w, h) {
  const x = (C.width - w) / 2, y = (C.height - h) / 2;
  ctx.fillStyle = 'rgba(7,4,15,0.72)';
  ctx.fillRect(0, 0, C.width, C.height);
  ctx.fillStyle = 'rgba(32,20,56,0.95)';
  ctx.strokeStyle = 'rgba(255,217,104,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.stroke();
  return { x, y };
}

function drawMenu(ctx, world) {
  const { x, y } = panel(ctx, 520, 330);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd968';
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText('VOID GARDEN', C.width / 2, y + 72);
  ctx.fillStyle = '#e9defc';
  ctx.font = '500 16px system-ui, sans-serif';
  ctx.fillText('The garden is dark. You are its last light.', C.width / 2, y + 104);
  ctx.font = '400 14px system-ui, sans-serif';
  ctx.fillStyle = '#c4b2e8';
  const lines = [
    'Gather light motes to score — each one feeds the clock.',
    'Thorn sentinels hunt you. Touch one and lose a heart…',
    '…unless you DASH through it and shatter it for bonus points.',
    `Reach ${C.targetScore} points before time runs out to make it Bloom.`,
  ];
  lines.forEach((l, i) => ctx.fillText(l, C.width / 2, y + 142 + i * 22));
  ctx.fillStyle = '#8cf5c3';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText('Move: WASD / arrows    Dash: SPACE / click    Pause: P', C.width / 2, y + 248);
  ctx.fillStyle = '#ffd968';
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText('Click or press ENTER to begin', C.width / 2, y + 292);
  ctx.textAlign = 'left';
}

function drawPause(ctx) {
  panel(ctx, 300, 150);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f3eaff';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('Paused', C.width / 2, C.height / 2 - 8);
  ctx.font = '400 14px system-ui, sans-serif';
  ctx.fillStyle = '#c4b2e8';
  ctx.fillText('Press P to keep playing', C.width / 2, C.height / 2 + 24);
  ctx.textAlign = 'left';
}

function drawEnd(ctx, world, won) {
  const { y } = panel(ctx, 460, 300);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd968' : '#ff8fa0';
  ctx.font = '800 36px system-ui, sans-serif';
  ctx.fillText(won ? 'THE GARDEN BLOOMS' : 'THE LIGHT FADES', C.width / 2, y + 70);
  ctx.fillStyle = '#e9defc';
  ctx.font = '500 16px system-ui, sans-serif';
  ctx.fillText(
    won ? 'You fed the dark with light, and it flowered.'
        : 'The sentinels keep the garden now. Try again.',
    C.width / 2, y + 104);
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText(`Score  ${world.score}`, C.width / 2, y + 152);
  ctx.font = '400 14px system-ui, sans-serif';
  ctx.fillStyle = '#c4b2e8';
  ctx.fillText(`Motes gathered ${world.gathered}   ·   Sentinels shattered ${world.shattered}`,
    C.width / 2, y + 182);
  ctx.fillStyle = '#ffd968';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillText('Click or press ENTER to play again', C.width / 2, y + 248);
  ctx.textAlign = 'left';
}
