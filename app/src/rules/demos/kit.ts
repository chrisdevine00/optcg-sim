/**
 * The vocabulary the demos share: the cards they place (card ids only, never art), the scenario
 * defaults, and short builders for refs and steps. A demo is data; nothing here decides a rule.
 */
import type { ScenarioJson } from '@optcg/ai';
import type { ActionPattern, DemoStep, Ref } from '../types.ts';

/** Starter Deck ST-21 and ST-22 cards, and a few others every demo needs; each is scripted or has no effect. */
export const K = {
  LUFFY_L: 'ST21-001', // Leader 5000, 5 Life; [DON!! x1] [Activate: Main] [Once Per Turn] give 2 rested DON!!
  ACE_L: 'ST22-001', // Leader 5000, 5 Life
  USOPP: 'ST21-002', // 2 cost, 3000, Counter +2000, [DON!! x2] [Opponent's Turn] +2000
  BONNEY: 'ST21-004', // 1 cost, 3000, no Counter
  JINBE: 'ST21-005', // 2 cost, 4000, Counter +1000, no effect
  STUSSY: 'ST21-006', // 3 cost, 5000, Counter +1000, no effect
  SENTOMARU: 'ST21-007', // 2 cost, 2000, Counter +1000, [Blocker]
  CHOPPER: 'ST21-008', // 4 cost, 6000, Counter +1000, no effect
  ROBIN: 'ST21-010', // 3 cost, 4000, [DON!! x2] [When Attacking] K.O. a Character with 4000 power or less
  VEGAPUNK: 'ST21-013', // 1 cost, 3000, Counter +1000, no effect
  LUFFY: 'ST21-014', // 5 cost, 6000, [Rush]
  DAWN_WHIP: 'ST21-016', // Event; [Trigger] K.O. up to 1 of their Characters with 4000 power or less
  MOLE_PISTOL: 'ST21-017', // Event; [Main] −5000 power, then K.O. if you have a 6000 Character
  NEWGATE: 'ST22-003', // 9 cost, 10000, [Double Attack]
  ELMY: 'ST22-004', // 3 cost, 5000, Counter +1000, no effect
  DECALVAN: 'ST22-008', // 2 cost, 4000, Counter +1000, no effect
  VISTA: 'ST22-009', // 1 cost, 1000, [Blocker]
  ACE: 'ST22-010', // 5 cost, 6000, Counter +2000, no effect
} as const;

export const many = (id: string, n: number): string[] => Array.from({ length: n }, () => id);

type Spec = ScenarioJson;
/** The player (`p1`) goes second, so turn 4 is theirs and turn 5 is the opponent's. */
export const second = { firstPlayer: 'p2' as const };

export const me = (card: string): Ref => ({ card, side: 'me' });
export const opp = (card: string): Ref => ({ card, side: 'opp' });
export const myLeader: Ref = { leader: 'me' };
export const theirLeader: Ref = { leader: 'opp' };

/** A player's step: the pattern is theirs (`by` defaults to `me`). */
export const step = (desc: string, match: ActionPattern): DemoStep => ({ desc, match });
/** The scripted opponent's step. */
export const theirs = (desc: string, match: ActionPattern): DemoStep => ({
  desc,
  match: { ...match, by: 'opp' },
});

/** The opponent chooses nothing against an attack: no Blocker, no Counter. */
export const noDefence: DemoStep[] = [
  theirs('They do not block', { type: 'block', blocker: 'none' }),
  theirs('They play no Counter', { type: 'endCounter' }),
];

/** Their Life card is added to their hand (no [Trigger] to use). */
export const theirTrigger: DemoStep = theirs('They add the Life card to their hand', {
  type: 'trigger',
  activate: false,
});

/** The opponent's Leader attacks yours. */
export const theyAttack = (): DemoStep =>
  theirs('Their Leader attacks your Leader', {
    type: 'attack',
    attacker: theirLeader,
    target: myLeader,
  });

export type { Spec };
