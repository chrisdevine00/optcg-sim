/** Demos about the board: the Character limit, the Stage limit, attack targets, effect wording. */
import type { RuleDemo } from '../types.ts';
import { K, many, me, noDefence, opp, second, step, theirLeader } from './kit.ts';

const ST_SUNNY = 'EB02-009'; // Stage, 2 cost: [Activate: Main] only
const ST_WINDMILL = 'OP13-022'; // Stage, 1 cost: [Activate: Main] only

const myTurn = {
  ...second,
  turn: 4,
  activePlayer: 'p1' as const,
};

export const BOARD_DEMOS: RuleDemo[] = [
  {
    id: 'full-character-area',
    title: 'A full Character area makes you trash one',
    rules: ['item/78'],
    rulings: ['RL-04'],
    lesson: 'L01',
    scenario: {
      ...myTurn,
      seed: 531,
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [K.BONNEY],
        characters: [K.USOPP, K.JINBE, K.STUSSY, K.SENTOMARU, K.CHOPPER],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 4, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    line: [
      step('Play Jewelry Bonney from your hand', { type: 'playCard', card: me(K.BONNEY) }),
      step('Trash Stussy to make room', { type: 'pick', choice: me(K.STUSSY) }),
    ],
    expect: [
      { kind: 'zone', side: 'me', zone: 'characters', count: 5 },
      { kind: 'zone', side: 'me', zone: 'characters', count: 1, card: K.BONNEY },
      { kind: 'zone', side: 'me', zone: 'trash', count: 1, card: K.STUSSY },
    ],
    say: [
      'You can have at most five Characters. Playing a sixth means you choose one of your own to trash, and the new one takes its place.',
      'The trashed Character is not K.O.’d, so effects that care about K.O. do not see it.',
    ],
    goal: 'Play Bonney into a full Character area and choose what to trash.',
  },
  {
    id: 'stage-replacement',
    title: 'A new Stage replaces the old one',
    rules: ['3-8-5-1', 'item/79'],
    rulings: ['RL-07'],
    lesson: 'L01',
    scenario: {
      ...myTurn,
      seed: 532,
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [ST_WINDMILL],
        stage: ST_SUNNY,
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 2, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    line: [step('Play Windmill Village', { type: 'playCard', card: me(ST_WINDMILL) })],
    expect: [
      { kind: 'zone', side: 'me', zone: 'stage', count: 1, card: ST_WINDMILL },
      { kind: 'zone', side: 'me', zone: 'trash', count: 1, card: ST_SUNNY },
    ],
    say: [
      'Each player has one Stage area. Playing a second Stage pays its cost, trashes the Stage already there and puts the new one in.',
      'The old Stage is simply trashed, with nothing carried over to the new one.',
    ],
    goal: 'Play a Stage while another one is in play.',
  },
  {
    id: 'rested-target',
    title: 'Only rested Characters can be attacked',
    rules: ['7-1-1-2'],
    rulings: ['RL-17'],
    lesson: 'L04',
    scenario: {
      ...myTurn,
      seed: 533,
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        characters: [K.CHOPPER],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 4, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        characters: [{ card: K.DECALVAN, rested: true }, K.ACE],
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    before: [
      {
        kind: 'legal',
        pattern: { type: 'attack', attacker: me(K.CHOPPER), target: opp(K.ACE) },
        legal: false,
      },
      {
        kind: 'legal',
        pattern: { type: 'attack', attacker: me(K.CHOPPER), target: opp(K.DECALVAN) },
        legal: true,
      },
    ],
    line: [
      step('Attack their rested Decalvan Brothers with Chopper', {
        type: 'attack',
        attacker: me(K.CHOPPER),
        target: opp(K.DECALVAN),
      }),
      ...noDefence,
    ],
    expect: [
      { kind: 'zone', side: 'opp', zone: 'characters', count: 1, card: K.ACE },
      { kind: 'zone', side: 'opp', zone: 'trash', count: 1, card: K.DECALVAN },
    ],
    say: [
      'You can attack their Leader, or one of their Characters that is rested. Their active Ace cannot be chosen at all.',
      'Chopper has 6000 against Decalvan’s 4000, so the rested Character is K.O.’d.',
    ],
    goal: 'Attack the rested Character; the active one is not on offer.',
  },
  {
    id: 'negative-power',
    title: 'Power can go below zero',
    rules: ['item/17', '1-3-6-1'],
    lesson: 'L25',
    scenario: {
      ...myTurn,
      seed: 534,
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [K.MOLE_PISTOL],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 4, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        characters: [K.VISTA],
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    line: [
      step('Play Gum-Gum Mole Pistol', { type: 'playCard', card: me(K.MOLE_PISTOL) }),
      step('Give Vista −5000 power', { type: 'pick', choice: opp(K.VISTA) }),
    ],
    expect: [
      { kind: 'power', of: opp(K.VISTA), value: -4000 },
      { kind: 'zone', side: 'opp', zone: 'characters', count: 1, card: K.VISTA },
    ],
    say: [
      'Vista has 1000 power, and −5000 takes it to −4000. Power may be negative, and a Character with negative power is not trashed because of it.',
      'It only matters in a battle, where it loses to anything, and when more modifiers are added to it.',
    ],
    goal: 'Give Vista −5000 power and read the result.',
  },
  {
    id: 'up-to-zero',
    title: '“Up to 1” can be none',
    rules: ['item/15', '1-3-5-1'],
    lesson: 'L25',
    scenario: {
      ...myTurn,
      seed: 535,
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [K.MOLE_PISTOL],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 4, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        characters: [K.VISTA],
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    line: [
      step('Play Gum-Gum Mole Pistol', { type: 'playCard', card: me(K.MOLE_PISTOL) }),
      step('Choose no target', { type: 'done' }),
    ],
    expect: [
      { kind: 'power', of: opp(K.VISTA), value: 1000 },
      { kind: 'zone', side: 'me', zone: 'trash', count: 1, card: K.MOLE_PISTOL },
    ],
    say: [
      'The card says “up to 1” Character, and “up to” includes 0. You may choose nobody, and the card is still played and trashed.',
      'Choosing fewer targets is sometimes right: a −5000 on a Character you cannot beat anyway is a wasted card.',
    ],
    goal: 'Play Mole Pistol and choose no target.',
  },
  {
    id: 'leader-not-character',
    title: 'A Leader is not a Character',
    rules: ['item/24', '2-2-4-1'],
    lesson: 'L26',
    scenario: {
      ...myTurn,
      seed: 536,
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [K.MOLE_PISTOL],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 4, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        characters: [K.VISTA],
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    line: [step('Play Gum-Gum Mole Pistol', { type: 'playCard', card: me(K.MOLE_PISTOL) })],
    expect: [
      {
        kind: 'legal',
        pattern: { type: 'pick', choice: opp(K.VISTA) },
        legal: true,
        afterStep: 1,
      },
      {
        kind: 'legal',
        pattern: { type: 'pick', choice: theirLeader },
        legal: false,
        afterStep: 1,
      },
    ],
    say: [
      'The card says “of your opponent’s Characters”. The list it offers holds Vista and nothing else, because a Leader is its own kind of card and is not a Character.',
      'Read the wording: “Leader or Character” means both, while “Character” means only the Characters.',
    ],
    goal: 'Play Mole Pistol and look at who can be chosen.',
  },
];
