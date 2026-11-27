/** Demos about keywords: [Rush], [Double Attack], [Banish]. */
import type { RuleDemo } from '../types.ts';
import { K, many, me, noDefence, second, step, theirLeader, theirTrigger } from './kit.ts';

const OP_SMOKER = 'OP10-030'; // 5 cost, 7000, [Banish]

export const KEYWORD_DEMOS: RuleDemo[] = [
  {
    id: 'rush',
    title: '[Rush] attacks the turn it is played',
    rules: ['10-1-1-1'],
    lesson: 'L07',
    scenario: {
      ...second,
      seed: 511,
      turn: 4,
      activePlayer: 'p1',
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        hand: [K.LUFFY],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 5, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.NEWGATE, 5),
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    line: [
      step('Play Monkey.D.Luffy from your hand', { type: 'playCard', card: me(K.LUFFY) }),
      step('Attack their Leader with him at once', {
        type: 'attack',
        attacker: me(K.LUFFY),
        target: theirLeader,
      }),
    ],
    expect: [{ kind: 'rested', of: me(K.LUFFY), rested: true }],
    say: [
      'A Character that is played cannot attack until your next turn, unless it has [Rush]. Monkey.D.Luffy has [Rush], so he attacks the turn he comes out.',
      'The attack is declared right after he is played, and he rests like any attacker.',
    ],
    goal: 'Play Luffy, then attack their Leader with him in the same turn.',
  },
  {
    id: 'double-attack',
    title: '[Double Attack] deals two damage',
    rules: ['10-1-2-1'],
    rulings: ['RL-20'],
    lesson: 'L07',
    scenario: {
      ...second,
      seed: 512,
      turn: 4,
      activePlayer: 'p1',
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        characters: [K.NEWGATE],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 4, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: many(K.VEGAPUNK, 2),
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    line: [
      step('Attack their Leader with Edward.Newgate', {
        type: 'attack',
        attacker: me(K.NEWGATE),
        target: theirLeader,
      }),
      ...noDefence,
      theirTrigger,
      theirTrigger,
    ],
    expect: [
      { kind: 'life', side: 'opp', count: 0 },
      { kind: 'result', winner: null },
    ],
    say: [
      'A [Double Attack] hit deals two damage instead of one, so both of their Life cards go to their hand, one after the other.',
      'They now have 0 Life but have not lost yet: a player loses when the Leader is hit while already at 0 Life.',
    ],
    goal: 'Attack with Newgate and watch two Life cards go.',
  },
  {
    id: 'banish',
    title: '[Banish] trashes the Life card',
    rules: ['10-1-3-1'],
    rulings: ['RL-21'],
    lesson: 'L07',
    scenario: {
      ...second,
      seed: 513,
      turn: 4,
      activePlayer: 'p1',
      p1: {
        leader: K.LUFFY_L,
        life: many(K.VEGAPUNK, 5),
        characters: [OP_SMOKER],
        deck: many(K.VEGAPUNK, 10),
        costArea: { active: 4, rested: 0 },
      },
      p2: {
        leader: K.ACE_L,
        life: [K.DAWN_WHIP, ...many(K.NEWGATE, 4)],
        deck: many(K.ELMY, 10),
        costArea: { active: 0, rested: 3 },
      },
    },
    line: [
      step('Attack their Leader with Smoker', {
        type: 'attack',
        attacker: me(OP_SMOKER),
        target: theirLeader,
      }),
      ...noDefence,
    ],
    expect: [
      { kind: 'life', side: 'opp', count: 4 },
      { kind: 'zone', side: 'opp', zone: 'trash', count: 1, card: K.DAWN_WHIP },
      { kind: 'zone', side: 'opp', zone: 'hand', count: 0 },
    ],
    say: [
      'Smoker has [Banish]: when he deals damage, the Life card is trashed instead of going to their hand, and its [Trigger] never gets a chance to activate.',
      'Their top Life card was Gum-Gum Dawn Whip, a Trigger card, and it was simply trashed.',
    ],
    goal: 'Hit their Leader with Smoker and see the Trigger card trashed unused.',
  },
];
