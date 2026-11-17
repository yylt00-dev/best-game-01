// VOID GARDEN — hand-in program for best-game-01 (Node 22, stdlib only).
// The game itself is the static site in game/ (open game/index.html in any
// desktop browser, fully offline). This program copies game/ and the
// screenshots/ folder into the output directory and writes dossier.json —
// the summary the judge reads — with the vendored make.fun library.
//
// Local run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play it:    node serve.ts   →  http://localhost:8080

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly on a broken hand-in instead of writing an empty dossier:
// the game folder must hold the playable site and at least one screenshot
// must exist, or there is nothing worth judging.
const gameDir = join(here, 'game');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('game/index.html is missing: nothing to hand in');
}
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f))
  : [];
if (shots.length === 0) {
  throw new Error('screenshots/ holds no PNG/JPEG: the entry needs real screenshots');
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// Caps from the competition gate: at most 4 screenshots of 256 KiB each,
// at most 993 game files / 48 MiB in total, no game path over 1000 bytes.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log('void-garden: handed in to', out);
