// main.js — wires the table together: starts a duel, handles clicks and
// keys, and hands the turn to Rook. Selection rules: click a hand card to
// pick it up (spells then ask for a target); click one of your ready
// creatures, then an enemy creature or Rook to attack. Clicking the same
// thing again puts it down. Keys 1-7 pick hand cards, Space ends the turn.

let game = null;

function newDuel(seed) {
  game = createGame(seed === undefined ? (Date.now() % 100000) : seed);
  game.phase = 'title';
  renderAll(game);
}

function startPlaying() {
  ensureAudio();
  game.phase = 'play';
  playSound('click');
  renderAll(game);
}

function clearSelection() {
  game.selection = null;
  renderAll(game);
}

function selectHandCard(uid) {
  const card = findInHand(game, 'player', uid);
  if (!card) return;
  const def = cardDef(card.defId);
  if (game.phase !== 'play' || game.activeSide !== 'player' || game.aiThinking) return;
  if (game.selection && game.selection.kind === 'hand' && game.selection.uid === uid) {
    clearSelection();
    return;
  }
  if (!canAfford(game, 'player', def)) {
    addLog(game, def.name + ' costs ' + def.cost + ' embers — you have ' + game.player.embers + '.');
    renderAll(game);
    return;
  }
  game.selection = { kind: 'hand', uid };
  playSound('click');
  renderAll(game);
}

function selectBoardCreature(uid) {
  const creature = findOnBoard(game, 'player', uid);
  if (!creature) return;
  if (game.phase !== 'play' || game.activeSide !== 'player' || game.aiThinking) return;
  if (game.selection && game.selection.kind === 'board' && game.selection.uid === uid) {
    clearSelection();
    return;
  }
  if (!creature.canAttack) {
    addLog(game, cardDef(creature.defId).name + ' is resting — it just arrived.');
    renderAll(game);
    return;
  }
  game.selection = { kind: 'board', uid };
  playSound('click');
  renderAll(game);
}

function resolveHandSelectionOn(target) {
  const uid = game.selection.uid;
  const card = findInHand(game, 'player', uid);
  if (!card) { clearSelection(); return; }
  const def = cardDef(card.defId);
  if (def.kind === 'creature') {
    const placed = playCreatureCard(game, 'player', uid);
    if (placed) playSound('play');
    clearSelection();
    afterPlayerAction();
    return;
  }
  // Spell: damage spells need a target, the rest resolve at once.
  if (def.damage && !target) {
    game.selection = { kind: 'hand', uid };
    renderAll(game);
    return;
  }
  const result = castSpellCard(game, 'player', uid, target);
  if (result === 'cast') playSound(def.heal || def.shield ? 'heal' : 'hit');
  clearSelection();
  afterPlayerAction();
}

function resolveBoardSelectionOn(target) {
  const uid = game.selection.uid;
  const ok = attackWithCreature(game, 'player', uid, target);
  if (ok) playSound('hit');
  clearSelection();
  afterPlayerAction();
}

function afterPlayerAction() {
  renderAll(game);
  if (isGameOver(game)) {
    playSound(game.phase === 'won' ? 'win' : 'lose');
    renderAll(game);
  }
}

function endPlayerTurn() {
  if (game.phase !== 'play' || game.activeSide !== 'player' || game.aiThinking) return;
  playSound('click');
  endTurn(game);
  renderAll(game);
  takeAiTurn(game, () => renderAll(game), () => {
    renderAll(game);
    if (isGameOver(game)) playSound(game.phase === 'won' ? 'win' : 'lose');
  });
}

function onTableClick(event) {
  if (!game || game.phase !== 'play' || game.activeSide !== 'player' || game.aiThinking) return;
  const cardEl = event.target.closest('.card');
  const heroEl = event.target.closest('.hero.foe');
  const sel = game.selection;
  // Clicking Rook: attack with a creature, or burn with a damage spell.
  if (heroEl) {
    if (!sel) return;
    if (sel.kind === 'board') {
      if (hasGuard(game, 'foe')) {
        addLog(game, 'Thorn Bramble guards Rook — destroy it first.');
        renderAll(game);
        return;
      }
      resolveBoardSelectionOn({ kind: 'hero' });
    } else if (sel.kind === 'hand') {
      const def = cardDef(findInHand(game, 'player', sel.uid).defId);
      if (def.damage) resolveHandSelectionOn({ kind: 'hero' });
    }
    return;
  }
  if (!cardEl) {
    if (sel) clearSelection();
    return;
  }
  const uid = Number(cardEl.dataset.uid);
  const inPlayerHand = !!findInHand(game, 'player', uid);
  const onPlayerBoard = !!findOnBoard(game, 'player', uid);
  const onFoeBoard = !!findOnBoard(game, 'foe', uid);
  if (inPlayerHand) { selectHandCard(uid); return; }
  if (onPlayerBoard) {
    if (sel && sel.kind === 'hand') {
      const def = cardDef(findInHand(game, 'player', sel.uid).defId);
      if (def.damage) { resolveHandSelectionOn({ kind: 'creature', uid }); return; }
    }
    selectBoardCreature(uid);
    return;
  }
  if (onFoeBoard) {
    if (!sel) return;
    if (sel.kind === 'board') { resolveBoardSelectionOn({ kind: 'creature', uid }); return; }
    if (sel.kind === 'hand') {
      const def = cardDef(findInHand(game, 'player', sel.uid).defId);
      if (def.damage) resolveHandSelectionOn({ kind: 'creature', uid });
    }
    return;
  }
}

function onKeyDown(event) {
  if (!game) return;
  if (game.phase === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    startPlaying();
    return;
  }
  if (game.phase !== 'play') return;
  if (event.key === ' ' || event.key === 'Enter') {
    if (game.activeSide === 'player' && !game.aiThinking) {
      event.preventDefault();
      endPlayerTurn();
    }
    return;
  }
  if (event.key === 'Escape') { clearSelection(); return; }
  const n = Number(event.key);
  if (n >= 1 && n <= 7 && game.activeSide === 'player' && !game.aiThinking) {
    const card = game.player.hand[n - 1];
    if (card) selectHandCard(card.uid);
  }
}

function initGame() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = shot ? 20261122 : undefined;
  newDuel(seed);
  if (shot) {
    document.body.classList.add('shot');
    stageShot(game, shot);
    // newDuel leaves the title up; only the title shot keeps it. The win
    // and loss shots already set their own phase inside stageShot.
    if (shot === 'play') game.phase = 'play';
    renderAll(game);
  }
  document.getElementById('table').addEventListener('click', onTableClick);
  document.getElementById('startbutton').addEventListener('click', startPlaying);
  document.getElementById('howbutton').addEventListener('click', () => {
    document.getElementById('howto').classList.toggle('hidden');
  });
  document.getElementById('endturn').addEventListener('click', endPlayerTurn);
  document.getElementById('againbutton').addEventListener('click', () => {
    playSound('click');
    const wins = game.stats.wins;
    newDuel();
    game.stats.wins = wins;
    startPlaying();
  });
  document.getElementById('mutebutton').addEventListener('click', (e) => {
    const m = toggleMute();
    e.target.textContent = m ? '🔇 Sound off' : '🔊 Sound on';
  });
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('pointerdown', ensureAudio, { once: true });
}

window.addEventListener('DOMContentLoaded', initGame);
