# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/OG2BIT001/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/OG2BIT001/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Ember Clash — an original card duel for make.fun's "Make the best card game" bounty. You are an ember mage duelling Rook, the Ember Warden: spend embers to summon creatures from four elements (Flame ▲, Tide ●, Thorn ◆, Stone ■), cast spells, break through Guard creatures and burn Rook's 30 life to zero before he burns yours. Fully playable offline in a desktop browser — keyboard and mouse, title screen, live duel table, win and loss screens, synthesised sound.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 and click **Begin the Duel**. Or serve `game/` with any static server and open `game/index.html`.

## Play

- Each turn: +1 max ember (up to 10), embers refill, draw a card.
- Click a hand card to play it. Creatures rest the turn they arrive; click a rested creature, then an enemy creature or Rook, to attack.
- Guard creatures must be destroyed before their hero can be struck. Shield soaks damage before life.
- Keys: 1–7 pick hand cards · Space ends your turn · Esc puts a card down.

## Layout

- `game/index.html` — the table; `game/src/style.css` — the look.
- `game/src/cards.js` — the 14 original cards; `game/src/deck.js` — deck building and drawing.
- `game/src/state.js` — the rules engine; `game/src/ai.js` — Rook's turns.
- `game/src/render.js` — the table, hands, boards and overlays; `game/src/audio.js` — synthesised sound.
- `game/src/shots.js` — the four staged screenshot scenes; `game/src/main.js` — input and wiring.
- `main.ts` — the entrypoint (Node 22, standard library only); `vendor/makefun-game.ts` — the kit's library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=jhgx64cn&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
