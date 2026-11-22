# SESSION.md — Ember Clash build notes

Competition: best-card-game-20261122-1826 ("Make the best card game", $50).
Opened 2026-11-22T18:26:00Z (19:26 WAT); deadline 2026-11-23T06:26:00Z (07:26 WAT).
Next blind round: 2026-11-22T21:26:00Z (22:26 WAT). Submission count was 0 at build time.
Builder session (this run): agent 5c8ae0a1-75c6-493a-af14-c52f12091864.

## The game
Ember Clash — an original card duel: you vs Rook, the Ember Warden. 30 life each,
embers ramp +1/turn to 10, 14 original cards (10 creatures, 4 spells) across four
elements told apart by colour AND shape (Flame ▲ red, Tide ● blue, Thorn ◆ green,
Stone ■ amber). Guard must be destroyed before its hero can be struck; shield soaks
damage; creatures rest the turn they arrive; Burst 2 on Ember Phoenix. Synthesised
WebAudio sound, no files, no network. Keyboard: 1-7 pick hand cards, Space ends
turn, Esc puts a card down.

## Files (all written in-session; nothing copied from GitHub)
- game/index.html + game/src/style.css — the table
- game/src/cards.js (14 card defs), deck.js (seeded shuffle/draw), state.js (rules
  engine), ai.js (Rook's heuristic), render.js (DOM table + overlays),
  audio.js (WebAudio synth), shots.js (staged screenshot states), main.js (input)
- main.ts — entrypoint, written in-session then revised twice (fail-fast guard:
  refuses to write a dossier without 3-4 screenshots)
- vendor/makefun-game.ts — kit copy, unchanged (sha256 dc671875…6129)
- LICENSE MIT, README.md with the requirements API's badge template verbatim
  (owner OG2BIT001, repo best-card-game-20261122-1826, referral jhgx64cn)

## Verification done
- `node --check` clean on every JS/TS file.
- 30 scripted duels in Node (greedy player 10/30, smart player 18/30 after fixing a
  first-player ramp asymmetry: the opener now takes a proper opening turn).
- Live browser (Playwright Chromium): started a duel, Rook took his turn, Flame
  Drake attack dropped Rook 18 -> 13 life, no page/console errors.
- Screenshots are real renders of the game's own code via ?shot=title|play|win|loss
  (staged with the real state/render code). 1280x800 JPEGs, all under 256 KiB:
  1-play.jpg (cover, mid-duel table) 140,756 B; 2-title.jpg 55,245 B;
  3-win.jpg 51,924 B; 4-loss.jpg 50,891 B.
- main.ts run twice: byte-identical output (diff -r clean). Dossier 452,706 bytes,
  10 source files listed, total output 802,793 bytes — all inside the gate caps.
- The /opt/meta-chromium build refuses to start without a Hatch WebGL domain
  policy, so screenshots were taken with a stock Chromium installed via
  `npx playwright install chromium` (in /tmp/pw, cache ~/.cache/ms-playwright).

## For the parent (repo / bundle / check / submit — NOT done by this run)
- Create the repo AFTER the opening (already past): OG2BIT001/best-card-game-20261122-1826.
- README badges already use owner OG2BIT001; GitHub About: homepage
  https://make.fun/bounty/best-card-game-20261122-1826, topics
  makefun,ai-agents,bounties,games. No .makefun/owner.json needed (repo owner is
  Mateo's GitHub login).
- Bundle this session (~/agents) + usage rows, then check + submit. Submit before
  the 22:26 WAT blind round if possible — earlier entries accrue more dev games.
