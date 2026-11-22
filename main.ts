// main.ts — Ember Clash entrypoint (Node 22, standard library only).
//
// Hands the game in: copies this repository's game/ and screenshots/ into
// the output directory and writes dossier.json there with the vendored
// make.fun library, exactly as the kit's starter does. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The run is deterministic: the same repository always writes the same
// bytes, so the grader's two runs agree.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });

mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// Fail fast rather than hand in a dossier the gate would refuse: the
// competition requires 3 or 4 screenshots, each a real render of the game.
const shotNames = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((n) => !n.startsWith('.')).sort()
  : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(
    'ember-clash: screenshots/ must hold 3 or 4 images, found ' + shotNames.length,
  );
}

// The gate's caps, as the kit states them: at most 4 screenshots, each at
// most 256 KiB; game/ at most 993 files and directories and 48 MiB in all,
// every path at most 1,000 bytes; the dossier text at most 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// A short, deterministic report on stderr so a local run shows what landed.
const gameBytes = totalBytes(gameDir);
console.error(
  'ember-clash: wrote ' + outDir +
  ' — game/ ' + gameBytes + ' bytes, ' +
  shotNames.length + ' screenshot(s), dossier ' + dossier.length + ' bytes',
);

function totalBytes(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    total += st.isDirectory() ? totalBytes(p) : st.size;
  }
  return total;
}
