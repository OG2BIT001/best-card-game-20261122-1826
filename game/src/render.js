// render.js — draws the whole table from the game state into the DOM: the
// heroes and their life, the ember pips, both boards, both hands, the log and
// the title / win / loss overlays. Cards are DOM elements so they stay crisp
// at thumbnail size; CSS transitions do the sliding, flipping and snapping.

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}

function emberPips(current, max) {
  const wrap = el('div', 'pips');
  for (let i = 0; i < MAX_EMBERS; i++) {
    const p = el('span', 'pip' + (i < current ? ' lit' : '') + (i < max ? '' : ' locked'));
    wrap.appendChild(p);
  }
  return wrap;
}

function lifeBar(side) {
  const wrap = el('div', 'lifebar');
  const fill = el('div', 'lifefill');
  fill.style.width = Math.max(0, (side.life / side.maxLife) * 100) + '%';
  if (side.life <= 10) fill.classList.add('low');
  wrap.appendChild(fill);
  const label = el('span', 'lifetext', side.life + ' / ' + side.maxLife + ' life');
  if (side.shield > 0) label.textContent += '  ·  🛡 ' + side.shield + ' shield';
  wrap.appendChild(label);
  return wrap;
}

function cardElement(card, opts) {
  const def = cardDef(card.defId);
  const elm = elementOf(def);
  const c = el('div', 'card el-' + def.element);
  c.dataset.uid = card.uid;
  c.dataset.defId = def.id;
  const cost = el('div', 'cost', String(def.cost));
  cost.title = 'Ember cost';
  c.appendChild(cost);
  const art = el('div', 'art');
  art.style.background = 'radial-gradient(circle at 50% 35%, ' + elm.glow + ', ' + elm.color + ' 55%, ' + elm.dark + ')';
  const rune = el('div', 'rune', elm.rune);
  art.appendChild(rune);
  const kind = el('div', 'kind', def.kind === 'creature' ? 'CREATURE' : 'SPELL');
  art.appendChild(kind);
  c.appendChild(art);
  const name = el('div', 'name', def.name);
  c.appendChild(name);
  const text = el('div', 'ctext', def.text);
  c.appendChild(text);
  if (def.kind === 'creature') {
    const stats = el('div', 'cstats');
    const atk = card.attack !== undefined ? card.attack : def.attack;
    const hp = card.health !== undefined ? card.health : def.health;
    stats.appendChild(el('span', 'atk', '⚔ ' + atk));
    stats.appendChild(el('span', 'hp', '♥ ' + hp));
    c.appendChild(stats);
    if (card.canAttack === false) c.classList.add('drowsy');
    if (hp <= 2) c.classList.add('hurt');
  } else {
    const stats = el('div', 'cstats');
    stats.appendChild(el('span', 'spelltag', '✦ SPELL'));
    c.appendChild(stats);
  }
  if (opts) {
    if (opts.playable) c.classList.add('playable');
    if (opts.selected) c.classList.add('selected');
    if (opts.targetable) c.classList.add('targetable');
  }
  return c;
}

function boardCreatureElement(creature, opts) {
  const c = cardElement(creature, opts);
  c.classList.add('on-board');
  if (creature.guard) {
    const g = el('div', 'guardtag', 'GUARD');
    c.appendChild(g);
  }
  return c;
}

function renderHeroPanel(state, side, mount, isPlayer) {
  mount.innerHTML = '';
  const who = isPlayer ? 'You — Ember Mage' : 'Rook, Ember Warden';
  const hero = el('div', 'hero' + (isPlayer ? ' you' : ' foe'));
  const avatar = el('div', 'avatar', isPlayer ? '🧙' : '🦉');
  hero.appendChild(avatar);
  const info = el('div', 'heroinfo');
  info.appendChild(el('div', 'heroname', who));
  info.appendChild(lifeBar(state[side]));
  const embers = el('div', 'emberrow');
  embers.appendChild(el('span', 'emberlabel', 'Embers ' + state[side].embers + '/' + state[side].maxEmbers));
  embers.appendChild(emberPips(state[side].embers, state[side].maxEmbers));
  info.appendChild(embers);
  const deck = el('div', 'deckinfo', 'Deck: ' + state[side].deck.length + ' cards');
  info.appendChild(deck);
  hero.appendChild(info);
  mount.appendChild(hero);
  return hero;
}

function renderHand(state, side, mount, interactive) {
  mount.innerHTML = '';
  const hand = state[side].hand;
  hand.forEach((card, i) => {
    const def = cardDef(card.defId);
    const opts = {};
    if (interactive) {
      opts.playable = canAfford(state, side, def) && state.phase === 'play' && state.activeSide === 'player' && !state.aiThinking;
      opts.selected = state.selection && state.selection.kind === 'hand' && state.selection.uid === card.uid;
    }
    const c = cardElement(card, opts);
    const fan = (i - (hand.length - 1) / 2) * 4;
    c.style.setProperty('--fan', fan + 'deg');
    mount.appendChild(c);
  });
  // Face-down backs for the foe's hand: the count is visible, the cards are not.
  if (!interactive) {
    mount.innerHTML = '';
    for (let i = 0; i < hand.length; i++) {
      mount.appendChild(el('div', 'cardback'));
    }
  }
}

function renderBoard(state, side, mount, interactive) {
  mount.innerHTML = '';
  const board = state[side].board;
  if (board.length === 0) {
    mount.appendChild(el('div', 'boardempty', side === 'player' ? 'Your creatures gather here.' : 'Rook has no creatures yet.'));
    return;
  }
  board.forEach((creature) => {
    const opts = {};
    if (interactive) {
      opts.playable = creature.canAttack && state.phase === 'play' && state.activeSide === 'player' && !state.aiThinking;
      opts.selected = state.selection && state.selection.kind === 'board' && state.selection.uid === creature.uid;
      opts.targetable = state.selection && state.selection.kind === 'hand' &&
        cardDef(findInHand(state, 'player', state.selection.uid).defId).damage > 0;
    } else if (state.selection && state.selection.kind === 'hand') {
      const sel = findInHand(state, 'player', state.selection.uid);
      if (sel && cardDef(sel.defId).damage) opts.targetable = true;
    } else if (state.selection && state.selection.kind === 'board') {
      opts.targetable = true;
    }
    mount.appendChild(boardCreatureElement(creature, opts));
  });
}

function renderLog(state) {
  const log = document.getElementById('gamelog');
  log.innerHTML = '';
  state.log.forEach((line) => log.appendChild(el('div', 'logline', line)));
}

function renderScore(state) {
  const s = state.stats;
  document.getElementById('score').textContent =
    'Turn ' + state.turn + '  ·  Damage dealt ' + s.damageDealt +
    '  ·  Cards played ' + s.cardsPlayed + '  ·  Duels won ' + s.wins;
  const turn = document.getElementById('turnbanner');
  turn.textContent = state.aiThinking ? 'Rook is thinking…' :
    state.phase === 'play' ? (state.activeSide === 'player' ? 'Your turn — play a card or attack' : 'Rook’s turn') :
    state.phase === 'won' ? 'Victory!' : state.phase === 'lost' ? 'Defeat' : '';
  turn.classList.toggle('thinking', !!state.aiThinking);
}

function renderOverlays(state) {
  const title = document.getElementById('titlescreen');
  const end = document.getElementById('endscreen');
  title.classList.toggle('hidden', state.phase !== 'title');
  end.classList.toggle('hidden', state.phase !== 'won' && state.phase !== 'lost');
  if (state.phase === 'won' || state.phase === 'lost') {
    const won = state.phase === 'won';
    document.getElementById('endtitle').textContent = won ? 'VICTORY' : 'DEFEAT';
    document.getElementById('endtitle').className = won ? 'win' : 'lose';
    document.getElementById('endsub').textContent = won
      ? 'Rook bows to your embers. The duel is yours.'
      : 'Rook claims this duel. Shuffle up and try again.';
    document.getElementById('endstats').textContent =
      'Turns: ' + state.turn + '  ·  Damage dealt: ' + state.stats.damageDealt +
      '  ·  Cards played: ' + state.stats.cardsPlayed + '  ·  Duels won: ' + state.stats.wins;
  }
}

function renderAll(state) {
  renderHeroPanel(state, 'foe', document.getElementById('foehero'), false);
  renderHeroPanel(state, 'player', document.getElementById('playerhero'), true);
  renderHand(state, 'foe', document.getElementById('foehand'), false);
  renderHand(state, 'player', document.getElementById('playerhand'), true);
  renderBoard(state, 'foe', document.getElementById('foeboard'), false);
  renderBoard(state, 'player', document.getElementById('playerboard'), true);
  renderLog(state);
  renderScore(state);
  renderOverlays(state);
  const endTurn = document.getElementById('endturn');
  endTurn.disabled = state.phase !== 'play' || state.activeSide !== 'player' || state.aiThinking;
  const foeHero = document.getElementById('foehero');
  const sel = state.selection;
  foeHero.classList.toggle('targetable', !!sel &&
    ((sel.kind === 'board' && !hasGuard(state, 'foe')) ||
     (sel.kind === 'hand' && findInHand(state, 'player', sel.uid) &&
      cardDef(findInHand(state, 'player', sel.uid).defId).damage > 0)));
}

function floatText(targetEl, text, cls) {
  const f = el('div', 'floattext ' + (cls || ''), text);
  targetEl.appendChild(f);
  setTimeout(() => f.remove(), 1100);
}
