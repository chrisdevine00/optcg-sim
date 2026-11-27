/**
 * The harder hand (M9 WP2). A puzzle that starts from a recorded game must not show the opponent's
 * real hidden cards (hard rule 3): the hand it gets is the strongest defence the public prior allows,
 * so a public proof ("you win against any hand their deck could hold") also holds against it, and a
 * player is never graded against a lucky or unlucky draw. Everything here reads the public prior
 * (`priorFor`) and printed card data; no game is read.
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import { counterValueOf, hasCounterTiming, priorFor } from '../../knowledge.ts';

/**
 * A vanilla Character with no [Trigger] and no effect, standing in for a face-down Life card the
 * puzzle may not copy. (Mocha, 3 cost, 5000, Counter +1000: a hit that puts it in their hand adds
 * at most its printed +1000, which the public model's worst-case card already covers.)
 */
export const INERT_LIFE = 'OP01-081';

/** What an Event's [Counter] adds besides power: it rests a Character or draws. */
function counterExtras(id: string): boolean {
  const script = SCRIPTS[id];
  if (!script) return false;
  return script.abilities.some(
    (a) =>
      hasCounterTiming((a as { when?: unknown }).when) &&
      /"(rest|draw)":/.test(JSON.stringify((a as { effect?: unknown }).effect)),
  );
}

/** Half a thousand: enough to break a tie in favour of a card that does more than add power. */
const EXTRAS_BONUS = 500;

/** The defence value of one copy of a card in hand: its Counter, plus a bonus for an Event that rests or draws. */
export function defenceValue(card: Card | undefined): number {
  if (!card) return 0;
  const v = counterValueOf(card);
  return card.category === 'Event' && v > 0 && counterExtras(card.id) ? v + EXTRAS_BONUS : v;
}

export interface HarderHandOptions {
  /** A card pool to pick from instead of the prior's lists (tests use a toy list). */
  pool?: { id: string; count: number }[];
}

/**
 * The `n` cards, from the lists the archetype is sourced from, that give the defender the most:
 * ranked by `defenceValue`, ties by card id, each card at most as many times as a sourced list runs
 * it. Deterministic (no rng). Fewer than `n` come back only when the pool has fewer cards.
 */
export function harderHand(
  leader: string,
  n: number,
  cards: ReadonlyMap<string, Card>,
  opts: HarderHandOptions = {},
): string[] {
  const copies = new Map<string, number>();
  if (opts.pool)
    for (const c of opts.pool) copies.set(c.id, Math.max(copies.get(c.id) ?? 0, c.count));
  else
    for (const l of priorFor(leader).lists)
      for (const c of l.cards) copies.set(c.id, Math.max(copies.get(c.id) ?? 0, c.count));
  const ranked = [...copies.keys()]
    .map((id) => ({ id, v: defenceValue(cards.get(id)) }))
    .sort((a, b) => b.v - a.v || (a.id < b.id ? -1 : 1));
  const out: string[] = [];
  for (const r of ranked)
    for (let i = 0; i < copies.get(r.id)! && out.length < n; i++) out.push(r.id);
  return out.slice(0, n);
}
