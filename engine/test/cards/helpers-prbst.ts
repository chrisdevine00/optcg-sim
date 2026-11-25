/**
 * Constants and helpers for the PRB-02 and ST-15 to ST-17 card tests. Every card named below is a
 * vanilla, or an unscripted card whose text is inert in these positions.
 */
import type { InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import { applyOp, withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec, game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

export { activate, offeredAb, canPick, pickable } from './helpers-w3s.ts';
export { finishBattle, canHit } from './helpers-w4sb.ts';
export { ids, settle } from './helpers-op14g4.ts';
export { trigGame } from './helpers-op11g1.ts';

/** Unscripted Leaders (5000 power) by {type}: no effects in these positions. */
export const NAVY_LEADER = 'OP02-002'; // Red/Black, {Navy}
export const BIGMOM_LEADER = 'OP03-077'; // Yellow/Black, {The Four Emperors}{Big Mom Pirates}
export const BIGMOM_MONO = 'OP03-099'; // Yellow, {Big Mom Pirates}
export const TBP_LEADER = 'OP06-021'; // Green/Black, {Thriller Bark Pirates}
export const BLACKBEARD_LEADER = 'OP09-081'; // {Blackbeard Pirates}{The Four Emperors}
export const WHITEBEARD_LEADER = 'OP02-001'; // Red, {Whitebeard Pirates}
export const FILM_LEADER = 'OP06-001'; // Purple/Red, {FILM}
export const WARLORD_MULTI = 'OP01-062'; // Blue/Purple, {Baroque Works}{The Seven Warlords of the Sea}
/** ST03-001 Crocodile: Blue, {Baroque Works}{The Seven Warlords of the Sea}, text inert. */
export const WARLORD_LEADER = PLAIN_BLUE;
/** A single-colour Leader of none of the types above: ST04-001 Kaido (Purple). */
export const PLAIN_PURPLE_LEADER = PLAIN_PURPLE;
export { PLAIN_BLUE };

/** Vanilla Characters. */
export const WARLORD6 = 'OP02-054'; // {Warlords}{Thriller Bark} cost 4 / 6000
export const WARLORD8 = 'OP02-055'; // {Warlords} cost 6 / 8000
export const BM_C4 = 'OP03-106'; // {Big Mom Pirates} cost 4 / 6000
export const BM_C7 = 'EB01-055'; // {Big Mom Pirates} cost 7 / 9000
export const BM_C2 = 'OP03-103'; // {Big Mom Pirates} cost 2 / 4000
export const BM8 = 'OP04-107'; // {Big Mom Pirates} cost 6 / 8000
export const BM7 = 'OP11-068'; // {Big Mom Pirates} cost 6 / 7000
export const BB4 = 'OP09-082'; // {Blackbeard Pirates} cost 4 / 6000
export const FILM3 = 'OP02-028'; // {FILM}{Straw Hat Crew} cost 3 / 5000
export const FILM5 = 'OP02-039'; // {FILM}{Straw Hat Crew} cost 5 / 7000
export const SHC4 = 'ST01-010'; // {Straw Hat Crew} cost 4 (Red)
export const NAVY3 = 'OP02-097'; // {Navy} cost 1 / 3000
export { V };

/** p1's turn 3, ten active DON!!, the Navy Leader unless given. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(
    { leader: PLAIN_PURPLE_LEADER, costArea: { active: 10, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
    extra,
  );
}

/** Give `target` `n` power (negative lowers) for this turn, as an effect of `controller`. */
export function buff(
  g: TestGame,
  target: InstanceId,
  n: number,
  controller: PlayerId = 'p1',
  turn = 3,
): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: { kind: 'power', target, amount: n, duration: { kind: 'thisTurn', turn }, controller },
  }).state;
}

/**
 * Give p2's `card` (a Character; p2's turn) a planted [Activate: Main] `p` running `action`, and
 * activate it: it stands for "your opponent's Character's effect".
 */
export function plantCharEffect(g: TestGame, card: string, action: Record<string, unknown>): void {
  g.state = withAbilities(g.state, card, [
    {
      id: 'p',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: action }],
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: g.find('p2', 'characters', card), ability: 'p' });
}

/** The same from p2's Leader (a Leader's effect, not a Character's). */
export function plantLeaderEffect(g: TestGame, action: Record<string, unknown>): void {
  g.state = withAbilities(g.state, PLAIN_BLUE, [
    {
      id: 'p',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: action }],
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: g.leader('p2'), ability: 'p' });
}

/** Answer every pending `order` decision in the canonical order. */
export function orderAll(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

/** The instance ids of the cards of a zone, in order. */
export const cardsIn = (
  g: TestGame,
  p: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): string[] => g.zone(p, zone).map((c) => c.card);
