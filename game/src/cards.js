// cards.js — every card in Ember Clash: its name, element, cost and rules text.
// Elements are told apart by colour AND shape: Flame ▲ red, Tide ● blue,
// Thorn ◆ green, Stone ■ amber. Nothing here copies any existing card game:
// all names, creatures and numbers are original to this game.

const ELEMENTS = {
  flame: { name: 'Flame', rune: '▲', color: '#e2483d', dark: '#8f1d16', glow: '#ff7a5c' },
  tide: { name: 'Tide', rune: '●', color: '#2f7fd0', dark: '#123f6e', glow: '#6db7ff' },
  thorn: { name: 'Thorn', rune: '◆', color: '#3da35d', dark: '#14532b', glow: '#7ed491' },
  stone: { name: 'Stone', rune: '■', color: '#c98a2e', dark: '#6e4a12', glow: '#f0b45c' },
};

// kind: 'creature' fights on the table; 'spell' resolves at once and is gone.
// guard: the enemy must destroy this creature before striking its hero.
// burst: damage dealt to the enemy hero when this creature is destroyed.
const CARD_DEFS = [
  { id: 'cinder-imp', name: 'Cinder Imp', element: 'flame', kind: 'creature', cost: 1, attack: 2, health: 1, text: 'Quick spark, quick to fade.' },
  { id: 'tide-sprite', name: 'Tide Sprite', element: 'tide', kind: 'creature', cost: 1, attack: 1, health: 2, text: 'Slips between the waves.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', element: 'thorn', kind: 'creature', cost: 2, attack: 2, health: 3, text: 'Grows sharper every turn.' },
  { id: 'pebble-golem', name: 'Pebble Golem', element: 'stone', kind: 'creature', cost: 2, attack: 1, health: 4, text: 'Small rock. Big patience.' },
  { id: 'mist-wisp', name: 'Mist Wisp', element: 'tide', kind: 'creature', cost: 2, attack: 3, health: 1, text: 'Strikes from the fog.' },
  { id: 'thorn-bramble', name: 'Thorn Bramble', element: 'thorn', kind: 'creature', cost: 3, attack: 3, health: 4, guard: true, text: 'Guard: foes must cut through it first.' },
  { id: 'flame-drake', name: 'Flame Drake', element: 'flame', kind: 'creature', cost: 4, attack: 5, health: 4, text: 'Its wings are wildfire.' },
  { id: 'tide-serpent', name: 'Tide Serpent', element: 'tide', kind: 'creature', cost: 4, attack: 4, health: 5, text: 'The deep answers its call.' },
  { id: 'ember-phoenix', name: 'Ember Phoenix', element: 'flame', kind: 'creature', cost: 5, attack: 5, health: 5, burst: 2, text: 'Burst 2: on defeat, burns the foe for 2.' },
  { id: 'stone-colossus', name: 'Stone Colossus', element: 'stone', kind: 'creature', cost: 6, attack: 7, health: 7, text: 'The mountain learned to walk.' },
  { id: 'ember-burst', name: 'Ember Burst', element: 'flame', kind: 'spell', cost: 2, damage: 3, text: 'Deal 3 damage to any target.' },
  { id: 'healing-rain', name: 'Healing Rain', element: 'tide', kind: 'spell', cost: 3, heal: 6, text: 'Restore 6 life to your hero.' },
  { id: 'thorn-snare', name: 'Thorn Snare', element: 'thorn', kind: 'spell', cost: 2, damage: 2, draw: 1, text: 'Deal 2 damage, then draw a card.' },
  { id: 'stone-bastion', name: 'Stone Bastion', element: 'stone', kind: 'spell', cost: 2, shield: 6, text: 'Gain 6 shield. Shield soaks damage.' },
];

// How many copies of each design go into a 30-card duel deck.
const DECK_COUNTS = {
  'cinder-imp': 3, 'tide-sprite': 3, 'thorn-sprout': 3, 'pebble-golem': 2,
  'mist-wisp': 2, 'thorn-bramble': 2, 'flame-drake': 2, 'tide-serpent': 2,
  'ember-phoenix': 2, 'stone-colossus': 1, 'ember-burst': 3, 'healing-rain': 2,
  'thorn-snare': 2, 'stone-bastion': 1,
};

function cardDef(id) {
  return CARD_DEFS.find((c) => c.id === id);
}

function elementOf(card) {
  return ELEMENTS[card.element];
}
