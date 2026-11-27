/**
 * The mulligan rule, taken from the guide (strategy-concepts §9 [S9]; the guides' "keepable hand").
 * One function the Pirate AI's mulligan and the review's mulligan flag (M8 WP2) both call, so the
 * AI and the review never disagree about what the guide keeps. Pure: it reads the hand's printed
 * card data only.
 */
import type { Card } from '@optcg/cards';
import { counterValueOf } from '../knowledge.ts';
import type { MulliganRule } from '../playbook.ts';

export interface MulliganVerdict {
  /** The guide keeps this hand. */
  keep: boolean;
  /** Which pieces the hand holds, by piece name. */
  met: Record<string, boolean>;
  /** How many pieces it lacks. */
  missing: number;
  /** The hand cards that fill each piece (each card counts toward one piece only). */
  fills: Record<string, Card[]>;
}

/**
 * Keep when every piece is met; going second, `rule.secondShort` pieces may be missing, and the
 * pieces in `rule.requireGoingFirst` are required going first. Each card counts toward one piece
 * only, taken in the order the pieces are listed.
 */
export function mulliganVerdict(
  hand: readonly (Card | undefined)[],
  rule: MulliganRule,
  first: boolean,
): MulliganVerdict {
  const left = hand.filter((c): c is Card => !!c);
  const met: Record<string, boolean> = {};
  const fills: Record<string, Card[]> = {};
  for (const piece of rule.pieces) {
    let n = 0;
    fills[piece.name] = [];
    for (let i = 0; i < left.length && n < piece.min;) {
      const c = left[i]!;
      const fits = piece.cards ? piece.cards.includes(c.id) : counterValueOf(c) > 0;
      if (fits) {
        fills[piece.name]!.push(c);
        left.splice(i, 1);
        n++;
      } else i++;
    }
    met[piece.name] = n >= piece.min;
  }
  const missing = rule.pieces.filter((p) => !met[p.name]).length;
  let keep = missing <= (first ? 0 : rule.secondShort);
  if (rule.redrawIfAllCostAtLeast !== undefined) {
    // The guide's Mulligan line: redraw a hand of only expensive cards, or one with no early play going first.
    const floor = rule.redrawIfAllCostAtLeast;
    keep = !hand.every((c) => (c?.cost ?? 0) >= floor);
  }
  if (first && rule.requireGoingFirst.some((name) => !met[name])) keep = false;
  return { keep, met, missing, fills };
}

/** C(n, k) as a float; exact enough for deck sizes. */
function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/** The chance that `draw` cards from a `deck` holding `hits` wanted cards include at least one. */
export function chanceAtLeastOne(deck: number, hits: number, draw: number): number {
  if (hits <= 0 || deck <= 0) return 0;
  return 1 - choose(deck - hits, draw) / choose(deck, draw);
}

/**
 * The first game turn on which a seat can spend `cost` DON!!, by CR 6-4-1: the first player has
 * 1 DON!! on their first turn and 2 more each turn after; the second player 2, then 2 more. Turns
 * are the game's own count (the first player's are 1, 3, 5; the second player's 2, 4, 6).
 */
export function firstPlayableTurn(cost: number, first: boolean): number {
  if (first) return 2 * Math.max(1, Math.ceil((cost + 1) / 2)) - 1;
  return 2 * Math.max(1, Math.ceil(cost / 2));
}
