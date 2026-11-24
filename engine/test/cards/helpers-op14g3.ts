/**
 * Helpers and constants for the OP-14 group 3 card tests (OP14-062 to OP14-086). Every constant is a
 * vanilla, or a card whose text is inert where the test puts it (a hand, a trash, a target).
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp, withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { expectDecision, game, PLAIN_BLUE, PURPLE, V } from './helpers.ts';

export { canPick, pickable } from './helpers-w3s.ts';
export { canActivate, canAttack, offers } from './helpers-op16g1.ts';
export { idsOf, koedInBattle, mine, oppAttack, plant } from './helpers-op15g2.ts';
export { koByBattle, names, trig } from './helpers-op16g4.ts';

/** OP05-022 Rosinante Leader ({Donquixote Pirates}/{Navy}); only a [Blocker] (inert here). */
export const DP_LEADER = 'OP05-022';
/** ST03-001 Crocodile Leader ({Baroque Works}); only an [Activate: Main] (inert here). */
export const BW_LEADER = 'ST03-001';
/** ST01-001 Luffy Leader ({Straw Hat Crew}); only an [Activate: Main]: neither Donquixote nor Baroque Works. */
export const OTHER_LEADER = 'ST01-001';
/** OP06-080 Gecko Moria Leader ({Thriller Bark Pirates}); its text only matters when it attacks. */
export const TBP_LEADER = 'OP06-080';
/** {Donquixote Pirates} vanillas: Bellamy cost 3 / 5000 and Vergo cost 5 / 7000. */
export const DP3 = 'OP05-035';
export const DP5 = 'OP01-065';
/** [Trebol] OP04-030, {Donquixote Pirates}, cost 6 (its [On Play] is inert in a hand). */
export const DP6 = 'OP04-030';
/** Portgas.D.Rouge: 0 base power, cost 1 (only a [Trigger]). */
export const ZERO_POWER = 'OP13-014';
/** {Baroque Works}: Mr.9 OP14-095 (cost 5, vanilla), Ms.Wednesday OP14-083 (cost 1), Mr.2 ST30-013 (cost 4, {Former Baroque Works}). */
export const BW5 = 'OP14-095';
export const BW1 = 'OP14-083';
export const BW1B = 'OP14-085';
export const BW4 = 'ST30-013';
/** {Thriller Bark Pirates} vanillas: Lola cost 4 / 6000; Oars cost 8 / 10000. */
export const TBP4 = 'OP06-094';
export const TBP8 = 'OP14-101';
export { PLAIN_BLUE, PURPLE, V };

/** `n` copies of a card. */
export const rep = (n: number, card: string): string[] => Array.from({ length: n }, () => card);

/** Pick the choose-one mode `n` (0-based, in script order). */
export function mode(g: TestGame, n: number): void {
  const d = expectDecision(g, 'choose', g.decider);
  g.act({ type: 'pick', choice: { option: d.options![n]!.id } });
}

/** Give `card` a planted effect (stand-in for a source of removal, rest or DON!! return) and run it. */
export function plantOn(g: TestGame, id: InstanceId, effect: Record<string, unknown>[]): void {
  const card = g.card(id).card;
  g.state = withAbilities(g.state, card, [
    { id: 'planted', kind: 'activate', when: 'activateMain', effect } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: id, ability: 'planted' });
}

/** K.O. `card` of `who` now as an effect of `by`. */
export function koNow(g: TestGame, who: 'p1' | 'p2', card: string, by: 'p1' | 'p2', nth = 0): void {
  g.state = applyOp(g.state, { op: 'ko', card: g.find(who, 'characters', card, nth), by }).state;
}

export type Spec = Partial<PlayerSpec> & { leader: PlayerSpec['leader'] };
export { game };
