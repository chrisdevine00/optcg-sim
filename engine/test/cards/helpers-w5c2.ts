/**
 * Constants and helpers for the wave 5 group 2 card tests (OP10-033, OP11-005, 066, 071, 073, 074,
 * 079, 081, 092, OP13-002, OP14-003, PRB02-018). Every card named below is a vanilla, or an
 * unscripted card whose text is inert where the test puts it.
 */
import type { InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import { expect } from 'vitest';
import type { TestGame } from '../fixtures/index.ts';
import {
  dec,
  expectDecision,
  game,
  option,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  times,
  V,
} from './helpers.ts';

export { activate, canPick, offeredAb, pickable } from './helpers-w3s.ts';
export { counterGame } from './helpers-op14g4.ts';
export { canHit, finishBattle, p2Attacks } from './helpers-w4sb.ts';
import { RED_LEADER } from './helpers-op15g1.ts';

export { RED_LEADER };

/** {Big Mom Pirates} Leader (Yellow, 5000): its [DON!! x1] [When Attacking] is inert in these positions. */
export const BM_LEADER = 'OP03-099';
/** A Purple Leader that is not {Big Mom Pirates} (the text is an unused [Activate: Main]). */
export const NOT_BM_LEADER = PLAIN_PURPLE;
/** {ODYSSEY} Character, Green, cost 4 / 5000, no text. */
export const ODYSSEY = 'OP09-038';
/** A Character with no {ODYSSEY} type, cost 1. */
export const NOT_ODYSSEY = V.c1;
/** Events with a base cost of 2, 3 and 4 (unscripted). */
export const EVENT_2 = 'ST02-017';
export const EVENT_3 = 'ST08-015';
/** {SWORD} Characters: [X.Drake] cost 6 / 7000 (no text), [Koby] P-092 cost 7 (text only on the opponent's turn). */
export const SWORD6 = 'OP11-017';
export const SWORD7 = 'P-092';
/** [Helmeppo] {Navy}{SWORD} cost 3 (EB04-047, its [Activate: Main] is unused) and a {Navy} non-{SWORD} vanilla, cost 1. */
export const HELMEPPO_SWORD = 'EB04-047';
export const NAVY_ONLY = 'OP02-097';
/** Cost-2 [Sabo], [Portgas.D.Ace] and [Monkey.D.Luffy] (Yellow, unused [Activate: Main]); a cost-3 [Monkey.D.Luffy] vanilla. */
export const SABO2 = 'ST13-007';
export const ACE2 = 'ST13-010';
export const LUFFY2 = 'ST13-014';
export const LUFFY3 = 'ST08-011';

/** The nth `card` of p1's characters. */
export const mine = (g: TestGame, card: string, nth = 0): InstanceId =>
  g.find('p1', 'characters', card, nth);

/**
 * p1's Main Phase with `p1` and `p2` merged over a plain pair of Leaders; p2's deck top is `top`
 * (then nine Purple vanillas).
 */
export function revealGame(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  top: string = V.c3,
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(
    { leader: BM_LEADER, costArea: { active: 3, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, deck: [top, ...times(9, PURPLE)], ...p2 },
    extra,
  );
}

/** Answer the "choose a cost" question: 0 to 10 are offered (raw decision), then name `n`. */
export function nameCost(g: TestGame, n: number): void {
  const d = expectDecision(g, 'choose', 'p1');
  expect(d.options?.map((o) => o.id)).toEqual(Array.from({ length: 11 }, (_, i) => String(i)));
  option(g, String(n));
}

/** The instance ids that are offered as picks right now (raw legal actions). */
export const offeredPicks = (g: TestGame): string[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

/** True when the game is back at a Main Phase decision (nothing more was asked). */
export const atMain = (g: TestGame): boolean => dec(g)?.kind === 'main';

/**
 * p2 (turn 4, deck top `top`) attacks p1's Leader with a 7000 Character and p1 activates the
 * [Counter] of `card` (in hand, 4 active DON!!): stops at that card's first question.
 */
export function counterAttack(
  card: string,
  top: string = V.c3,
  p1: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    {
      leader: RED_LEADER,
      hand: [card],
      costArea: { active: 4, rested: 0 },
      life: times(3, PURPLE),
      ...p1,
    },
    { leader: PLAIN_BLUE, characters: [V.c5], deck: [top, ...times(9, PURPLE)] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
  if (dec(g)?.kind === 'block') g.act({ type: 'block', blocker: null });
  g.act({ type: 'activate', card: g.find('p1', 'hand', card), ability: 'counter' });
  return g;
}

/** p2's 7000 Character attacks p1's Leader; p1's top Life card is `top` and the [Trigger] is asked. */
export function triggerGame(top: string, p1: Partial<PlayerSpec> = {}): TestGame {
  const g = game(
    { leader: RED_LEADER, life: [top, PURPLE, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (dec(g)?.kind === 'block') g.act({ type: 'block', blocker: null });
  if (dec(g)?.kind === 'counter') g.act({ type: 'endCounter' });
  expectDecision(g, 'trigger', 'p1');
  return g;
}

/** Change `card`'s cost by `amount` for this turn (a stand-in for an effect that did it). */
export function lowerCost(g: TestGame, who: PlayerId, card: string, amount: number): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'cost',
      target: g.find(who, 'characters', card),
      amount,
      duration: { kind: 'thisTurn', turn: 3 },
      controller: who === 'p1' ? 'p2' : 'p1',
    },
  }).state;
}
