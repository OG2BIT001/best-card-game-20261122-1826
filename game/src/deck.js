// deck.js — builds a duel deck from the card definitions, shuffles it with a
// seeded random source, and draws cards into a hand. The seed keeps staged
// screenshot states reproducible; live games seed from the clock.

// Small deterministic generator (mulberry32) so a fixed seed replays exactly.
function makeRng(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDeck(seed) {
  const rng = makeRng(seed);
  const deck = [];
  for (const def of CARD_DEFS) {
    const copies = DECK_COUNTS[def.id] || 0;
    for (let i = 0; i < copies; i++) deck.push(def.id);
  }
  // Fisher-Yates shuffle with the seeded source.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }
  return deck;
}

function drawCards(deck, hand, count) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (deck.length === 0 || hand.length >= 10) break;
    const id = deck.shift();
    const card = { uid: nextCardUid(), defId: id, justPlayed: false };
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

let cardUidCounter = 1;
function nextCardUid() {
  return cardUidCounter++;
}

function resetCardUids() {
  cardUidCounter = 1;
}
