/**
 * Constants and helpers for the EB-04 group 1 card tests. Every card named below is a vanilla, or an
 * unscripted card whose text is inert in these positions (unscripted cards have no effects).
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { BLUE, dec, game, PLAIN_BLUE, PURPLE, V } from './helpers.ts';

export { V, PLAIN_BLUE, BLUE, PURPLE };
export { canPick, pickable } from './helpers-w3s.ts';

/** Red Leader {Straw Hat Crew}: none of the types the EB-04 cards ask for. 5000 power. */
export const RED_LEADER = 'ST01-001';
/** Green Leader [Carrot], {Minks}; 5000 power; its [Activate: Main] is unscripted. */
export const MINKS_LEADER = 'OP08-021';
/** Black Leader [Smoker], {Navy}; 5000 power. */
export const NAVY_LEADER = 'OP02-093';
/** Green Leader [Kin'emon], {Land of Wano}. */
export const WANO_LEADER = 'OP02-025';
/** Green Leader [Hody Jones], {Fish-Man}. */
export const FISH_LEADER = 'OP06-020';
/** Red Leader [Silvers Rayleigh]. */
export const RAYLEIGH_LEADER = 'OP12-001';
/** Blue/Red Leader [Nefeltari Vivi] ({Alabasta}). */
export const VIVI_LEADER = 'OP04-001';

/** {Minks} Characters: cost 1 / 3000, cost 3 / 5000, cost 5 / 5000 (text unscripted), cost 6 / 7000. */
export const MINK1 = 'OP08-027';
export const MINK3 = 'ST07-014';
export const MINK5 = 'OP02-029';
export const MINK6 = 'OP12-032';
/** {Neptunian} vanillas (cost 6 each, 8000 / 7000 / 8000). */
export const NEP_A = 'OP11-026';
export const NEP_B = 'OP11-033';
export const NEP_C = 'OP13-010';
/** {Alabasta} Characters: cost 5 / 6000, cost 6 / 7000 (vanillas), cost 8 / 9000 (text unscripted). */
export const ALA5 = 'OP13-011';
export const ALA6 = 'OP14-030';
export const ALA8 = 'OP04-014';
/** {Fish-Man} vanilla (red, cost 3, 5000). */
export const FISH3 = 'OP03-007';
/** Green vanillas: cost 3 / 5000 {Land of Wano}, cost 5 / 7000, cost 6 / 8000, cost 7 / 8000. */
export const G3 = 'OP01-043';
export const G5 = 'EB01-018';
export const G6 = 'OP07-028';
export const G7 = 'OP17-035';
/** Red vanilla, cost 1, 3000. */
export const RED1 = 'EB01-005';
/** Characters with a [Trigger]: 5000 power (cost 4) and 6000 power (cost 5). */
export const TRIG5 = 'ST09-002';
export const TRIG6 = 'OP12-113';
/** A Character with no [Trigger], 5000 power. */
export const NOTRIG5 = 'OP03-007';
/** [Silvers Rayleigh] Character (red, cost 5, 6000). */
export const RAYLEIGH_C = 'OP09-005';

/** `n` active cost-area DON!!. */
export const donArea = (active: number, rested = 0) => ({ costArea: { active, rested } });

/** A position where p1 has 10 active DON!! and the Red Leader unless given. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(
    { leader: RED_LEADER, costArea: { active: 10, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
    extra,
  );
}

/** The same position on p2's turn (turn 4): p1's "[Opponent's Turn]" effects apply. */
export const oppTurn = { turn: 4, activePlayer: 'p2' } as const;

export const activateAb = (g: TestGame, card: InstanceId, ability: string): void => {
  g.act({ type: 'activate', card, ability });
};
export const canActivate = (g: TestGame, card: InstanceId, ability: string): boolean =>
  g.legal().some((a) => a.type === 'activate' && a.card === card && a.ability === ability);

export const isRested = (g: TestGame, id: InstanceId): boolean => g.card(id).rested === true;

/** Pick targets offered right now (card instances only). */
export const offered = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

/** Instance `nth` of `card` in a zone of `p`. */
export const at = (
  g: TestGame,
  p: 'p1' | 'p2',
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId => g.find(p, zone, card, nth);

export const cardsOf = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);

/** Answer every pending `order` decision with its first legal order. */
export function finishOrder(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

/** True when the deciding player may attack `target` with `attacker`. */
export const canAttack = (g: TestGame, attacker: InstanceId, target: InstanceId): boolean =>
  g.isLegal({ type: 'attack', attacker, target, player: g.decider });

/** Pass the block and counter steps if they are open, and decline every [Trigger]. */
export function finishBattle(g: TestGame): void {
  if (dec(g)?.kind === 'block') g.act({ type: 'block', blocker: null });
  if (dec(g)?.kind === 'counter') g.act({ type: 'endCounter' });
  while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
}

/** p1 attacks p2's Leader with `attacker` (stops at the first decision). */
export function attack(g: TestGame, attacker: InstanceId): void {
  g.act({ type: 'attack', attacker, target: g.leader('p2') });
}
