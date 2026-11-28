/**
 * Constants and set-ups for the OP18 group g1 card tests (OP18-001 to OP18-028). Cards below are
 * vanillas, or unscripted cards whose text is inert in these positions.
 */
import type { PlayerSpec } from '@optcg/engine';
import { game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

export { PLAIN_BLUE, PLAIN_PURPLE, V };
/** {Animal}{Alabasta} vanillas: [Karoo] cost 1 / 3000, [Karoo] cost 5 / 7000, Sea Cat cost 5 / 6000. */
export const AA1 = 'ST01-003';
export const AA5 = 'EB02-001';
export const AA5B = 'OP18-003';
/** {Alabasta} vanillas: [Nefeltari Vivi] cost 2 / 4000, [Nefeltari Cobra] cost 5 / 6000, [Sanji] {Alabasta}{Straw Hat Crew} cost 1 / 3000. */
export const ALA2 = 'ST01-009';
export const ALA5 = 'OP13-011';
export const ALA1 = 'OP04-007';
/** {Animal}{East Blue} vanilla (not {Alabasta}), cost 2 / 4000; {East Blue} vanilla cost 1 / 3000. */
export const ANIMAL2 = 'OP03-035';
export const EB1 = 'OP03-052';
/** [Nefeltari Vivi] {Alabasta} Leader (its effect is inert here) and an {East Blue} Leader. */
export const VIVI_L = 'OP04-001';
export const EB_L = 'OP03-040';
/** {Navy} Leader [Sakazuki] (only an [Activate: Main]). */
export const NAVY_L = 'ST06-001';
/** [Monkey.D.Luffy] Green {Straw Hat Crew} Leader (EB02-010), not this group's. */
export const LUFFY_L = 'EB02-010';

/** p1's turn 3 with `p1` and 5 active DON!!; p2 a plain Blue Leader. */
export function mk(
  p1: Partial<PlayerSpec> & { leader?: PlayerSpec['leader'] } = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(
    { leader: PLAIN_PURPLE, costArea: { active: 5, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
    extra,
  );
}

/**
 * p2's turn: p2's 9000 Character attacks p1's Leader, nobody blocks or counters, and p1's top Life
 * card is `top`: stops at p1's [Trigger] decision.
 */
export function trigGame(top: string, p1: Partial<PlayerSpec> = {}): TestGame {
  const g = game(
    { leader: PLAIN_PURPLE, life: [top, V.c1, V.c1], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  g.act({ type: 'block', blocker: null });
  g.act({ type: 'endCounter' });
  return g;
}
