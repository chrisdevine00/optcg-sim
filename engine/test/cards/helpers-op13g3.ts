/**
 * Helpers and constants for the OP-13 group 3 card tests (OP13-059 to OP13-087). Every constant is a
 * vanilla, or a card whose text is inert where the test puts it (a hand, a trash, a target).
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec, game, PLAIN_BLUE, V } from './helpers.ts';

export { canPick, pickable } from './helpers-w3s.ts';
export { atMain, canAccept, canActivate, canAttack, offers } from './helpers-op16g1.ts';
export { canBlockWith, idsOf, koedInBattle, plant } from './helpers-op15g2.ts';
export { plantOpponentEffect } from './helpers-rgl-penel.ts';
export { counterStep, useCounter } from './helpers-luffyace.ts';

/** OP13-003 Gol.D.Roger Leader ({Roger Pirates}, named [Gol.D.Roger]); its rules text is unscripted, inert here. */
export const ROGER_LEADER = 'OP13-003';
/** OP13-079 Imu Leader (named [Imu]); unscripted, inert here. */
export const IMU_LEADER = 'OP13-079';
/** ST01-001 Luffy Leader ({Straw Hat Crew}): neither a Roger Pirates nor a Revolutionary Army Leader. */
export const OTHER_LEADER = 'ST01-001';
/** OP02-049 Emporio.Ivankov Leader ({Revolutionary Army}); only an [End of Your Turn] (inert here). */
export const ARMY_LEADER = 'OP02-049';
export { PLAIN_BLUE };

/** EB01-041 Crocus: {Former Roger Pirates} vanilla, cost 6, 8000 power (a type including "Roger Pirates"). */
export const RP = 'EB01-041';
/** OP09-005 Silvers Rayleigh: {Roger Pirates}, cost 5 / 6000 (its [Blocker] is inert on a field). */
export const RP5 = 'OP09-005';
/** OP13-065 Shanks (scenery): {Roger Pirates}, cost 1 / 2000; named [Shanks]. */
export const SHANKS = 'OP13-065';
/** A {Homies} 3000-power vanilla (cost 2, Rabiyan) and a 5000-power one (cost 3, Kingbaum). */
export const HOMIES3 = 'OP04-113';
export const HOMIES5 = 'OP03-100';
/** Stages: cost 1 (Corrida Coliseum), cost 3 (Galley-La Company), cost 6 (The Ark Noah). Inert in a trash. */
export const STAGE1 = 'OP04-096';
export const STAGE3 = 'OP03-075';
export const STAGE6 = 'OP06-041';
/** Characters with a cost of 8 and a base power of 10000 (for "cost of 5 or less" style bounds), cost 9. */
export const COST8 = 'OP14-101';
/** {Five Elders} 5000-power Characters: Nusjuro OP13-080, Ju Peter OP13-084, Warcury OP13-089, Saturn OP13-083, Mars OP13-091. */
export const NUSJURO = 'OP13-080';
export const JU_PETER = 'OP13-084';
export const WARCURY = 'OP13-089';
export const SATURN = 'OP13-083';
export const MARS = 'OP13-091';
/** OP13-082 Five Elders (12000, cost 10). */
export const FIVE_ELDERS = 'OP13-082';
/** {Celestial Dragons} cards: Saint Jalmac (vanilla, OP13-085), Saint Mjosgard (OP05-089, text inert in a deck). */
export const CELESTIAL = 'OP13-085';
export const SHALRIA = 'OP13-086';

/** `n` copies of a card. */
export const rep = (n: number, card: CardId): CardId[] => Array.from({ length: n }, () => card);

/** p1's turn: `p1` over a non-Roger Leader, p2 a plain Blue Leader. */
export function mine(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  active = 6,
  rested = 0,
): TestGame {
  return game(
    { leader: OTHER_LEADER, costArea: { active, rested }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
  );
}

/** A Leader placement with `n` DON!! given to it. */
export const withDon = (leader: CardId, n = 1) => ({ card: leader, don: n });

/** Settle every follow-up decision of a play (declines, none, canonical order) until a `main` decision. */
export function settle(g: TestGame): void {
  for (let i = 0; i < 40; i++) {
    const d = dec(g);
    if (!d || d.kind === 'main') return;
    if (d.kind === 'optional') g.act({ type: 'optional', accept: false });
    else if (d.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    else if (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
    else g.act(g.legal()[0]!);
  }
  throw new Error('settle: still deciding');
}

/** The card ids that can be picked right now (a look at the deck top, a trash pick). */
export const pickableCards = (g: TestGame): CardId[] =>
  g
    .legal()
    .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []))
    .map((id) => g.card(id).card);

/** Pick the first pickable instance of card id `card`. */
export function pickCard(g: TestGame, card: CardId): void {
  const a = g
    .legal()
    .find(
      (x) => x.type === 'pick' && typeof x.choice === 'string' && g.card(x.choice).card === card,
    );
  if (!a) throw new Error(`${card} is not pickable`);
  g.act(a);
}

/** K.O. `card` of `who` now as an effect of `by`. */
export function koBy(g: TestGame, who: 'p1' | 'p2', card: string, by: 'p1' | 'p2', nth = 0): void {
  g.state = applyOp(g.state, { op: 'ko', card: g.find(who, 'characters', card, nth), by }).state;
}

export type { InstanceId };
export { V };
