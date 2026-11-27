/** Demos about effects: once per turn. */
import type { RuleDemo } from '../types.ts';
import { K, many, me, myLeader, second, step, theyAttack } from './kit.ts';

const ST07_BEAM = 'OP07-076'; // Event, 2 cost: [Counter] DON!! −1: +2000 power during this battle, rest a Character

export const EFFECT_DEMOS: RuleDemo[] = [
  {
    id: 'once-per-turn',
    title: '[Once Per Turn] means once',
    rules: ['item/126', '10-2-13-1'],
    lesson: 'L27',
    scenario: {
      ...second,
      seed: 541,
      turn: 4,
      activePlayer: 'p1',
      p1: {
        leader: { card: K.LUFFY_L, don: 1 },
        life: many(K.VEGAPUNK, 5),
        characters: [K.STUSSY],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 1, rested: 2 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    before: [{ kind: 'legal', pattern: { type: 'activate', card: myLeader }, legal: true }],
    line: [step('Use your Leader’s ability', { type: 'activate', card: myLeader })],
    expect: [{ kind: 'legal', pattern: { type: 'activate', card: myLeader }, legal: false }],
    say: [
      'Your Leader’s ability says [Once Per Turn], so it can be used once in a turn however many DON!! you have. After it resolves, the board offers it no more.',
      'The count starts again on your next turn, and an opponent’s turn has its own count.',
    ],
    goal: 'Use your Leader’s ability once, then check it is gone for this turn.',
  },
  {
    id: 'don-minus',
    title: 'DON!! −X sends DON!! back to the deck',
    rules: ['item/86'],
    rulings: ['RL-24', 'RL-52'],
    lesson: 'L03',
    scenario: {
      ...second,
      seed: 542,
      turn: 5,
      activePlayer: 'p2',
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [ST07_BEAM],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 4, rested: 0 },
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
      step('Play Slow-Slow Beam Sword as a Counter', { type: 'activate', card: me(ST07_BEAM) }),
      step('Choose to pay DON!! −1', { type: 'optional', accept: true }),
      step('Return a rested DON!! to the DON!! deck', { type: 'pick', don: 'costRested' }),
      step('Give your Leader +2000 power', { type: 'pick', choice: myLeader }),
    ],
    expect: [
      { kind: 'life', side: 'me', count: 5 },
      { kind: 'zone', side: 'me', zone: 'don', count: 3 },
      { kind: 'zone', side: 'me', zone: 'donDeck', count: 7 },
    ],
    say: [
      '“DON!! −1” is a cost with a different meaning: you return one DON!! from your field to your DON!! deck, instead of resting it. Slow-Slow Beam Sword’s own cost of 1 is paid as well, by resting a DON!!.',
      'Returned DON!! come back through your DON!! Phase, so the price is lost mana now and later.',
    ],
    goal: 'Play Slow-Slow Beam Sword as a Counter and return a DON!! to pay for it.',
  },
];
