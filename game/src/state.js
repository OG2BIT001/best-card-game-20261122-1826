// state.js — the rules engine of Ember Clash. Pure game logic: no DOM here.
// A duel lasts until one hero's life reaches 0. Each turn a side gains one
// max ember (up to 10), refills its embers and draws a card. Creatures rest
// the turn they are played; Guard creatures must be destroyed before their
// hero can be struck; shield soaks damage before life does.

const MAX_LIFE = 30;
const MAX_EMBERS = 10;
const MAX_BOARD = 7;
const MAX_HAND = 10;

function makeSide(seed) {
  return {
    life: MAX_LIFE, maxLife: MAX_LIFE, shield: 0,
    embers: 0, maxEmbers: 0,
    deck: buildDeck(seed), hand: [], board: [],
  };
}

function createGame(seed) {
  resetCardUids();
  const state = {
    seed,
    turn: 0,
    phase: 'play', // 'title' | 'play' | 'won' | 'lost'
    activeSide: 'player',
    player: makeSide(seed),
    foe: makeSide(seed + 7919),
    log: [],
    selection: null, // { kind: 'board', uid } | { kind: 'hand', uid }
    aiThinking: false,
    stats: { damageDealt: 0, cardsPlayed: 0, turnsPlayed: 0, wins: 0 },
  };
  drawCards(state.player.deck, state.player.hand, 3);
  drawCards(state.foe.deck, state.foe.hand, 3);
  // The first player takes the opening turn the same way every turn starts:
  // +1 max ember, a refill and a draw — so both sides ramp symmetrically
  // and the opener's edge is one card, not a whole turn of ramp.
  startTurn(state, 'player');
  addLog(state, 'The duel begins. You hold the first turn.');
  return state;
}

function otherSide(side) {
  return side === 'player' ? 'foe' : 'player';
}

function addLog(state, text) {
  state.log.unshift(text);
  if (state.log.length > 8) state.log.length = 8;
}

function startTurn(state, side) {
  const s = state[side];
  if (s.maxEmbers < MAX_EMBERS) s.maxEmbers += 1;
  s.embers = s.maxEmbers;
  drawCards(s.deck, s.hand, 1);
  for (const c of s.board) c.canAttack = true;
  state.activeSide = side;
  if (side === 'player') {
    state.turn += 1;
    state.stats.turnsPlayed = state.turn;
  }
}

function canAfford(state, side, def) {
  return state[side].embers >= def.cost;
}

function hasGuard(state, side) {
  return state[side].board.some((c) => c.guard && c.health > 0);
}

function findInHand(state, side, uid) {
  return state[side].hand.find((c) => c.uid === uid);
}

function findOnBoard(state, side, uid) {
  return state[side].board.find((c) => c.uid === uid);
}

function removeFromHand(state, side, uid) {
  const hand = state[side].hand;
  const i = hand.findIndex((c) => c.uid === uid);
  if (i >= 0) hand.splice(i, 1);
}

// Plays a creature card from hand onto the side's board. Returns the new
// creature, or null when the play is illegal.
function playCreatureCard(state, side, uid) {
  const card = findInHand(state, side, uid);
  if (!card) return null;
  const def = cardDef(card.defId);
  if (def.kind !== 'creature') return null;
  if (!canAfford(state, side, def)) return null;
  if (state[side].board.length >= MAX_BOARD) return null;
  removeFromHand(state, side, uid);
  state[side].embers -= def.cost;
  const creature = {
    uid: nextCardUid(), defId: def.id, attack: def.attack, health: def.health,
    maxHealth: def.health, canAttack: false, guard: !!def.guard, burst: def.burst || 0,
  };
  state[side].board.push(creature);
  state.stats.cardsPlayed += side === 'player' ? 1 : 0;
  addLog(state, (side === 'player' ? 'You play ' : 'Rook plays ') + def.name + '.');
  return creature;
}

// Spells that need a target return 'needs-target'; the rest resolve at once.
// target: { kind: 'hero' } | { kind: 'creature', uid } | null.
function castSpellCard(state, side, uid, target) {
  const card = findInHand(state, side, uid);
  if (!card) return 'illegal';
  const def = cardDef(card.defId);
  if (def.kind !== 'spell') return 'illegal';
  if (!canAfford(state, side, def)) return 'illegal';
  if (def.damage && !target) return 'needs-target';
  removeFromHand(state, side, uid);
  state[side].embers -= def.cost;
  state.stats.cardsPlayed += side === 'player' ? 1 : 0;
  if (def.heal) {
    const s = state[side];
    s.life = Math.min(s.maxLife, s.life + def.heal);
    addLog(state, (side === 'player' ? 'You mend ' : 'Rook mends ') + def.heal + ' life with Healing Rain.');
  }
  if (def.shield) {
    state[side].shield += def.shield;
    addLog(state, (side === 'player' ? 'You raise ' : 'Rook raises ') + def.shield + ' shield.');
  }
  if (def.damage) {
    dealDamageToTarget(state, side, target, def.damage);
    addLog(state, def.name + ' strikes for ' + def.damage + '.');
  }
  if (def.draw) drawCards(state[side].deck, state[side].hand, def.draw);
  return 'cast';
}

function dealDamageToTarget(state, fromSide, target, amount) {
  const foeSide = otherSide(fromSide);
  if (target.kind === 'hero') {
    damageHero(state, foeSide, amount);
    if (fromSide === 'player') state.stats.damageDealt += amount;
  } else {
    const creature = findOnBoard(state, foeSide, target.uid);
    if (creature) damageCreature(state, foeSide, creature, amount);
  }
}

function damageHero(state, side, amount) {
  const s = state[side];
  let left = amount;
  if (s.shield > 0) {
    const soaked = Math.min(s.shield, left);
    s.shield -= soaked;
    left -= soaked;
  }
  s.life -= left;
  if (s.life < 0) s.life = 0;
  checkEnd(state);
}

function damageCreature(state, side, creature, amount) {
  creature.health -= amount;
  if (creature.health <= 0) destroyCreature(state, side, creature);
}

function destroyCreature(state, side, creature) {
  const board = state[side].board;
  const i = board.findIndex((c) => c.uid === creature.uid);
  if (i >= 0) board.splice(i, 1);
  addLog(state, cardDef(creature.defId).name + ' is destroyed.');
  if (creature.burst > 0) {
    const foeSide = otherSide(side);
    damageHero(state, foeSide, creature.burst);
    addLog(state, 'Ember Phoenix bursts for ' + creature.burst + '!');
  }
}

// A board creature strikes a target. Creature fights trade blows; striking a
// hero deals damage straight to it. Returns true when the attack happened.
function attackWithCreature(state, side, attackerUid, target) {
  const attacker = findOnBoard(state, side, attackerUid);
  if (!attacker || !attacker.canAttack) return false;
  const foeSide = otherSide(side);
  if (target.kind === 'hero') {
    if (hasGuard(state, foeSide)) return false;
    damageHero(state, foeSide, attacker.attack);
    if (side === 'player') state.stats.damageDealt += attacker.attack;
    addLog(state, cardDef(attacker.defId).name + ' strikes the hero for ' + attacker.attack + '.');
  } else {
    const defender = findOnBoard(state, foeSide, target.uid);
    if (!defender) return false;
    damageCreature(state, foeSide, defender, attacker.attack);
    damageCreature(state, side, attacker, defender.attack);
    addLog(state, cardDef(attacker.defId).name + ' trades with ' + cardDef(defender.defId).name + '.');
  }
  attacker.canAttack = false;
  return true;
}

function endTurn(state) {
  state.selection = null;
  const next = otherSide(state.activeSide);
  startTurn(state, next);
}

function checkEnd(state) {
  if (state.phase !== 'play') return;
  if (state.foe.life <= 0) {
    state.phase = 'won';
    state.stats.wins += 1;
    addLog(state, 'Rook is defeated. The embers are yours!');
  } else if (state.player.life <= 0) {
    state.phase = 'lost';
    addLog(state, 'Your embers fade. Rook claims the duel.');
  }
}

function isGameOver(state) {
  return state.phase === 'won' || state.phase === 'lost';
}
