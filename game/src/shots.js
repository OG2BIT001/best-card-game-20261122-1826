// shots.js — stages the four screenshot scenes with the game's own state
// and rendering code, so each picture is a real game state, not a mock.
// ?shot=title shows the title screen; ?shot=play a mid-duel table;
// ?shot=win the victory screen; ?shot=loss the defeat screen.

function placeCreature(state, side, defId, canAttack) {
  const def = cardDef(defId);
  const creature = {
    uid: nextCardUid(), defId: def.id, attack: def.attack, health: def.health,
    maxHealth: def.health, canAttack: !!canAttack, guard: !!def.guard, burst: def.burst || 0,
  };
  state[side].board.push(creature);
  return creature;
}

function giveCard(state, side, defId) {
  const card = { uid: nextCardUid(), defId, justPlayed: false };
  state[side].hand.push(card);
  return card;
}

function stageMidDuel(state) {
  // Turn 6, both sides developed: the richest single view of the game.
  state.turn = 6;
  state.stats.turnsPlayed = 6;
  state.stats.damageDealt = 12;
  state.stats.cardsPlayed = 9;
  state.player.life = 24; state.foe.life = 18;
  state.player.shield = 2;
  state.player.maxEmbers = 6; state.player.embers = 4;
  state.foe.maxEmbers = 6; state.foe.embers = 3;
  state.player.deck.length = 18; state.foe.deck.length = 19;
  placeCreature(state, 'player', 'flame-drake', true);
  placeCreature(state, 'player', 'thorn-bramble', true);
  placeCreature(state, 'player', 'tide-sprite', true);
  placeCreature(state, 'player', 'cinder-imp', false);
  placeCreature(state, 'foe', 'tide-serpent', true);
  placeCreature(state, 'foe', 'pebble-golem', true);
  placeCreature(state, 'foe', 'mist-wisp', false);
  const drake = state.player.board[0];
  drake.health = 3; // battle-worn, so the numbers tell a story
  const serpent = state.foe.board[0];
  serpent.health = 4;
  state.player.hand.length = 0;
  giveCard(state, 'player', 'ember-burst');
  giveCard(state, 'player', 'healing-rain');
  giveCard(state, 'player', 'ember-phoenix');
  giveCard(state, 'player', 'thorn-snare');
  giveCard(state, 'player', 'stone-colossus');
  state.foe.hand.length = 0;
  for (let i = 0; i < 4; i++) giveCard(state, 'foe', 'cinder-imp');
  addLog(state, 'Flame Drake scorches Tide Serpent for 5.');
  addLog(state, 'Thorn Bramble holds the line.');
  addLog(state, 'Rook summons Mist Wisp from the fog.');
  addLog(state, 'Your turn — play a card or attack.');
}

function stageShot(state, shot) {
  if (shot === 'title') {
    state.phase = 'title';
    return state;
  }
  if (shot === 'play') {
    stageMidDuel(state);
    return state;
  }
  if (shot === 'win') {
    stageMidDuel(state);
    state.foe.life = 0;
    state.phase = 'won';
    state.stats.wins = 1;
    return state;
  }
  if (shot === 'loss') {
    stageMidDuel(state);
    state.player.life = 0;
    state.phase = 'lost';
    return state;
  }
  return state;
}
