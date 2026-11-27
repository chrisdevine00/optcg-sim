/** Demos about a battle: the tie, Counters, the Block Step, a Life hit and its [Trigger]. */
import type { RuleDemo } from '../types.ts';
import { K, many, me, myLeader, noDefence, opp, second, step, theyAttack } from './kit.ts';

const ST05_ELTHOR = 'OP05-114'; // Event, 1 cost: [Counter] +2000 power during this battle (+2000 more against 2 or less Life)

export const BATTLE_DEMOS: RuleDemo[] = [
  {
    id: 'battle-tie',
    title: 'A tie goes to the attacker',
    rules: ['7-1-4-1'],
    lesson: 'L04',
    scenario: {
      ...second,
      seed: 501,
      turn: 4,
      activePlayer: 'p1',
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 4, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        characters: [{ card: K.ELMY, rested: true }],
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    line: [
      step('Attack their rested Elmy with your Leader', {
        type: 'attack',
        attacker: myLeader,
        target: opp(K.ELMY),
      }),
      ...noDefence,
    ],
    expect: [
      { kind: 'zone', side: 'opp', zone: 'characters', count: 0 },
      { kind: 'zone', side: 'opp', zone: 'trash', count: 1, card: K.ELMY },
      { kind: 'life', side: 'opp', count: 5 },
    ],
    say: [
      'Your Leader has 5000 power and their Elmy has 5000. In a battle the attacker wins when its power is equal to or higher than the defender’s, so the tie is yours.',
      'Elmy is K.O.’d and goes to their trash, and nothing was lost on your side.',
    ],
    goal: 'Attack Elmy with your Leader and see the equal powers decide for you.',
  },
  {
    id: 'counter-step',
    title: 'The Counter Step adds power for one battle',
    rules: ['7-1-3-1'],
    rulings: ['RL-08'],
    lesson: 'L05',
    scenario: {
      ...second,
      seed: 502,
      turn: 5,
      activePlayer: 'p2',
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [K.JINBE, K.BONNEY],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 0, rested: 4 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        deck: many(K.ELMY, 10),
        costArea: { active: 5, rested: 0 },
      },
    },
    line: [
      theyAttack(),
      step('Trash Jinbe from your hand as a Counter on your Leader', {
        type: 'counter',
        card: me(K.JINBE),
        target: myLeader,
      }),
    ],
    expect: [
      { kind: 'life', side: 'me', count: 5 },
      { kind: 'zone', side: 'me', zone: 'trash', count: 1, card: K.JINBE },
      { kind: 'zone', side: 'me', zone: 'hand', count: 1, card: K.BONNEY },
    ],
    say: [
      'Their Leader attacks with 5000 power against your 5000, which would be a hit. Trashing Jinbe from your hand adds his Counter value of +1000 to your Leader for this battle only, so 6000 beats 5000.',
      'The attack fails, you keep all your Life, and Jinbe is gone for good.',
    ],
    goal: 'Use Jinbe as a Counter so the attack on your Leader fails.',
  },
  {
    id: 'block-before-counter',
    title: 'Block first, Counter after',
    rules: ['7-1-2-1', '7-1-3-1'],
    rulings: ['RL-18'],
    lesson: 'L05',
    scenario: {
      ...second,
      seed: 503,
      turn: 5,
      activePlayer: 'p2',
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [K.ACE, K.JINBE, K.STUSSY],
        characters: [K.SENTOMARU],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 0, rested: 4 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        deck: many(K.ELMY, 10),
        costArea: { active: 5, rested: 0 },
      },
    },
    line: [
      theyAttack(),
      step('Block with Sentomaru', { type: 'block', blocker: me(K.SENTOMARU) }),
      step('Counter on Sentomaru with Ace', {
        type: 'counter',
        card: me(K.ACE),
        target: me(K.SENTOMARU),
      }),
      step('Counter on Sentomaru with Jinbe', {
        type: 'counter',
        card: me(K.JINBE),
        target: me(K.SENTOMARU),
      }),
      step('Counter on Sentomaru with Stussy', {
        type: 'counter',
        card: me(K.STUSSY),
        target: me(K.SENTOMARU),
      }),
    ],
    expect: [
      { kind: 'life', side: 'me', count: 5 },
      { kind: 'zone', side: 'me', zone: 'characters', count: 1, card: K.SENTOMARU },
      { kind: 'rested', of: me(K.SENTOMARU), rested: true },
    ],
    say: [
      'The Block Step comes before the Counter Step. Sentomaru blocks, which makes him the target, and only then do Counters count: his 2000 plus 2000, 1000 and 1000 is 6000 against their 5000.',
      'You cannot Counter first and block afterwards, because the Block Step does not come back.',
    ],
    goal: 'Block with Sentomaru, then Counter him until he survives.',
  },
  {
    id: 'life-trigger',
    title: 'A Life card with a Trigger',
    rules: ['10-1-5-1'],
    lesson: 'L06',
    scenario: {
      ...second,
      seed: 504,
      turn: 5,
      activePlayer: 'p2',
      p1: {
        leader: K.LUFFY_L,
        life: [K.DAWN_WHIP, ...many(K.VEGAPUNK, 4)],
        hand: [K.BONNEY, K.LUFFY],
        characters: [K.STUSSY],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 0, rested: 4 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        characters: [K.DECALVAN],
        deck: many(K.ELMY, 10),
        costArea: { active: 5, rested: 0 },
      },
    },
    line: [
      theyAttack(),
      step('Reveal the Life card and use its Trigger', { type: 'trigger', activate: true }),
      step('K.O. their Decalvan Brothers', { type: 'pick', choice: opp(K.DECALVAN) }),
    ],
    expect: [
      { kind: 'life', side: 'me', count: 4 },
      { kind: 'zone', side: 'opp', zone: 'characters', count: 0 },
      { kind: 'zone', side: 'me', zone: 'trash', count: 1, card: K.DAWN_WHIP },
    ],
    say: [
      'The hit takes the top card of your Life, and this one has a [Trigger]. Instead of adding it to your hand you may reveal it and use the Trigger, here a K.O. on a Character with 4000 power or less.',
      'The card is trashed after the effect, so you took the damage and still got something back.',
    ],
    goal: 'Take the hit, reveal Gum-Gum Dawn Whip and K.O. Decalvan Brothers.',
  },
  {
    id: 'trigger-declined',
    title: 'A Trigger is optional',
    rules: ['10-1-5-2'],
    lesson: 'L06',
    scenario: {
      ...second,
      seed: 505,
      turn: 5,
      activePlayer: 'p2',
      p1: {
        leader: K.LUFFY_L,
        life: [K.DAWN_WHIP, ...many(K.VEGAPUNK, 4)],
        hand: [K.BONNEY, K.LUFFY],
        characters: [K.STUSSY],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 0, rested: 4 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        characters: [K.DECALVAN],
        deck: many(K.ELMY, 10),
        costArea: { active: 5, rested: 0 },
      },
    },
    line: [
      theyAttack(),
      step('Add the Life card to your hand without using its Trigger', {
        type: 'trigger',
        activate: false,
      }),
    ],
    expect: [
      { kind: 'life', side: 'me', count: 4 },
      { kind: 'zone', side: 'me', zone: 'hand', count: 3 },
      { kind: 'zone', side: 'opp', zone: 'characters', count: 1, card: K.DECALVAN },
    ],
    say: [
      'Using a [Trigger] is a choice. If you decline, the Life card goes to your hand like any other, and nothing else happens.',
      'The card is yours to play later, so a Trigger you do not need is not wasted.',
    ],
    goal: 'Take the hit and add Gum-Gum Dawn Whip to your hand instead of using it.',
  },
  {
    id: 'event-counter',
    title: 'An Event can be a Counter',
    rules: ['7-1-3-1-2'],
    lesson: 'L05',
    scenario: {
      ...second,
      seed: 506,
      turn: 5,
      activePlayer: 'p2',
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [ST05_ELTHOR],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 1, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        deck: many(K.ELMY, 10),
        costArea: { active: 5, rested: 0 },
      },
    },
    line: [
      theyAttack(),
      step('Play El Thor as a Counter', { type: 'activate', card: me(ST05_ELTHOR) }),
      step('Give your Leader +2000 power', { type: 'pick', choice: myLeader }),
    ],
    expect: [
      { kind: 'life', side: 'me', count: 5 },
      { kind: 'zone', side: 'me', zone: 'trash', count: 1, card: ST05_ELTHOR },
    ],
    say: [
      'An Event with a [Counter] effect can be played in the Counter Step by paying its cost with active DON!!. El Thor costs 1 and gives +2000 power for this battle, so 7000 beats 5000.',
      'Unlike a Character Counter, it costs DON!!, so keep some active on their turn if you want it.',
    ],
    goal: 'Pay 1 DON!! and play El Thor as a Counter to stop the attack.',
  },
];
