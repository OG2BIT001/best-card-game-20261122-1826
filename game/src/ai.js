// ai.js — Rook, the Ember Warden, plays the opposing side. The logic is a
// readable heuristic, not a search: play the strongest affordable cards,
// spend damage spells where they matter, then attack — lethal first, good
// trades next, face when nothing better offers. Steps are paced with delays
// so the player can watch Rook think and act.

function aiChoosePlay(state) {
  const foe = state.foe;
  // Healing first when hurt, then the biggest creature affordable.
  const affordable = foe.hand
    .map((c) => ({ card: c, def: cardDef(c.defId) }))
    .filter((x) => x.def.cost <= foe.embers);
  const heal = affordable.find((x) => x.def.heal && foe.life <= 18);
  if (heal) return heal.card;
  const bastion = affordable.find((x) => x.def.shield && foe.life <= 14);
  if (bastion) return bastion.card;
  const creatures = affordable.filter((x) => x.def.kind === 'creature')
    .sort((a, b) => b.def.cost - a.def.cost);
  if (creatures.length > 0) return creatures[0].card;
  const snare = affordable.find((x) => x.def.id === 'thorn-snare');
  if (snare) return snare.card;
  const burst = affordable.find((x) => x.def.id === 'ember-burst');
  if (burst) return burst.card;
  return null;
}

function aiChooseSpellTarget(state, def) {
  // Ember Burst: finish the player when lethal, else hit their biggest threat.
  if (def.damage) {
    if (state.player.life <= def.damage) return { kind: 'hero' };
    const threats = state.player.board.slice().sort((a, b) => b.attack - a.attack);
    const killable = threats.find((c) => c.health <= def.damage);
    if (killable) return { kind: 'creature', uid: killable.uid };
    if (threats.length > 0 && threats[0].attack >= 4) return { kind: 'creature', uid: threats[0].uid };
    return { kind: 'hero' };
  }
  return null;
}

function aiChooseAttack(state, attacker) {
  const player = state.player;
  const foeBoard = state.foe.board;
  // Lethal: strike the hero when it ends the duel.
  if (!hasGuard(state, 'player') && player.life <= attacker.attack) {
    return { kind: 'hero' };
  }
  // A trade that kills an enemy creature without dying is worth taking.
  const targets = player.board.slice().sort((a, b) => b.attack - a.attack);
  for (const t of targets) {
    if (t.health <= attacker.attack && t.attack < attacker.health) {
      return { kind: 'creature', uid: t.uid };
    }
  }
  // Guard blocks the hero; clear it when we can kill it cheaply.
  const guard = player.board.find((c) => c.guard);
  if (guard && guard.health <= attacker.attack) {
    return { kind: 'creature', uid: guard.uid };
  }
  if (hasGuard(state, 'player')) {
    if (guard) return { kind: 'creature', uid: guard.uid };
    return null;
  }
  // Otherwise go face — pressure wins duels.
  return { kind: 'hero' };
}

// Plays Rook's whole turn in timed steps. onStep runs after every action so
// the table re-renders; onDone runs when Rook ends the turn.
function takeAiTurn(state, onStep, onDone) {
  state.aiThinking = true;
  const steps = [];
  // Plan the turn up front against a snapshot, then act step by step.
  let guard = 0;
  while (guard++ < 12) {
    const play = aiChoosePlay(state);
    if (!play) break;
    const def = cardDef(play.defId);
    if (def.kind === 'creature') {
      steps.push(() => playCreatureCard(state, 'foe', play.uid));
    } else if (def.damage) {
      const target = aiChooseSpellTarget(state, def);
      steps.push(() => castSpellCard(state, 'foe', play.uid, target));
    } else {
      steps.push(() => castSpellCard(state, 'foe', play.uid, null));
    }
    if (isGameOver(state)) break;
  }
  for (const attacker of state.foe.board.slice()) {
    if (!attacker.canAttack) continue;
    const target = aiChooseAttack(state, attacker);
    if (target) steps.push(() => attackWithCreature(state, 'foe', attacker.uid, target));
    if (isGameOver(state)) break;
  }
  let i = 0;
  function nextStep() {
    if (isGameOver(state)) { state.aiThinking = false; onStep(); onDone(); return; }
    if (i < steps.length) {
      steps[i]();
      i += 1;
      onStep();
      setTimeout(nextStep, 650);
    } else {
      state.aiThinking = false;
      endTurn(state);
      onStep();
      onDone();
    }
  }
  setTimeout(nextStep, 700);
}
