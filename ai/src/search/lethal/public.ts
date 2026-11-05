/**
 * The `public` mode's worst-case state (ARCHITECTURE §4.4). The requesting seat's view is all that
 * is read. Every card the view cannot show is replaced by a **placeholder card**, not guessed:
 *
 * - **The defender's hidden hand and face-down Life** become `WORST_COUNTER` cards: Characters that
 *   cost nothing, have no effect and carry the biggest Counter in the defender's archetype prior
 *   (a Character's printed Counter or a [Counter] Event's +power, `biggestCounter`). Each hit
 *   moves a Life card to the defender's hand (CR 7-1-4-1-1-2), so the placeholder grows the hand by
 *   one worst-case card per hit. Real Counter play (CR 7-1-3, 10-2-9) then runs through the engine.
 * - **Everything else hidden** (decks, the attacker's own face-down Life) becomes `BLANK`: no
 *   Counter, no effect.
 *
 * What this assumes (written out in DECISIONS, 2026-11-05):
 * 1. Each hidden defender card is worth at most `maxPerCard` of defence, and that is its only use.
 *    It ignores a Counter Event's DON!! cost and any other effect, so a proof here is at least as
 *    strong as one against the real deck. A refutation here may be pessimistic about a real hand.
 * 2. Hidden cards in the defender's Life are never [Trigger] cards in the search. Triggers are
 *    handled outside it as a chance: `triggerRisk`.
 * 3. The attacker's own deck draws blanks (effects that draw are searched but find nothing).
 */
import type { Card } from '@optcg/cards';
import { determinize, type PlayerId, type SearchView } from '@optcg/engine';
import { biggestCounter, priorFor, type Prior } from '../../knowledge.ts';

export const WORST_COUNTER = '$WORST-COUNTER';
export const BLANK = '$BLANK';

/** The assumed biggest Counter when the opponent's leader has no sourced list. */
export const FALLBACK_COUNTER = 4000;

function placeholder(id: string, name: string, counter: number | null): Card {
  return {
    id,
    name,
    category: 'Character',
    colors: [],
    cost: 0,
    power: 0,
    counter,
    life: null,
    attributes: [],
    types: [],
    rarity: 'C',
    set: 'X',
    block: null,
    effectText: '',
    triggerText: null,
    keywords: [],
    verified: false,
    verifiedBy: [],
    textFixes: [],
    artworks: [],
    legality: { standard: 'legal', extra: 'legal' },
    sourceUrl: '',
    fetchedAt: '',
  } as unknown as Card;
}

export interface PublicSetup {
  /** The worst-case state for the engine. */
  state: ReturnType<typeof determinize>;
  /** Per-card defence assumed for every hidden defender card. */
  maxPerCard: number;
  /** True when the opponent's leader has no sourced list (so `maxPerCard` is the fallback). */
  noPrior: boolean;
  /** Face-down Life cards the defender holds that the view cannot identify. */
  hiddenLife: number;
  /** Hidden cards in the defender's hand. */
  hiddenHand: number;
}

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/**
 * Build the worst-case state from `view`. The attacker is the viewer; the defender is the other
 * seat. `cards` is public card data.
 */
export function publicState(view: SearchView, cards: ReadonlyMap<string, Card>): PublicSetup {
  const me = view.player;
  const def = other(me);
  const leader = view.zones[def].leader[0]?.card ?? '';
  const prior = leader ? priorFor(leader) : null;
  const maxPerCard = prior ? biggestCounter(leader, cards) : FALLBACK_COUNTER;
  const worst = placeholder(WORST_COUNTER, 'Unknown card', maxPerCard);
  const blank = placeholder(BLANK, 'Unknown card', null);
  const fill: Record<string, string> = {};
  let hiddenLife = 0;
  let hiddenHand = 0;
  for (const pos of Object.values(view.skeleton.hidden)) {
    const [owner, zone] = pos.split('.') as [PlayerId, string];
    if (owner === def && (zone === 'hand' || zone === 'life')) {
      fill[pos] = WORST_COUNTER;
      if (zone === 'life') hiddenLife++;
      else hiddenHand++;
    } else fill[pos] = BLANK;
  }
  const lookup = (id: string) =>
    id === WORST_COUNTER ? worst : id === BLANK ? blank : cards.get(id);
  return {
    state: determinize(view, fill, lookup, 1),
    maxPerCard,
    noPrior: !prior,
    hiddenLife,
    hiddenHand,
  };
}

/** The Trigger chance: how many [Trigger] cards the defender's deck runs, and the odds none is hit. */
export interface TriggerRisk {
  /** Face-down Life cards a winning line must take (all of them). */
  exposed: number;
  /** [Trigger] cards in the archetype's newest sourced list (0 if none, or no prior). */
  triggersInPrior: number;
  /** Chance that none of the exposed Life cards is a [Trigger], over the weighted lists. */
  probabilityNone: number;
}

/** Triggers in a list of cards (counts copies). */
function triggersIn(
  list: { id: string; count: number }[],
  cards: ReadonlyMap<string, Card>,
): number {
  let n = 0;
  for (const c of list) if (cards.get(c.id)?.triggerText) n += c.count;
  return n;
}

/** C(n,k) as a float; small arguments only. */
function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/**
 * Hidden Life [Trigger]s as a chance node (ARCHITECTURE §4.4): `exposed` Life cards are a random
 * subset of the 50-card list, so the chance none is a [Trigger] is C(50−T, k) / C(50, k), averaged
 * over the prior's lists by their recency weights.
 */
export function triggerRisk(
  exposed: number,
  prior: Prior | null,
  cards: ReadonlyMap<string, Card>,
): TriggerRisk {
  if (!prior || exposed === 0) return { exposed, triggersInPrior: 0, probabilityNone: 1 };
  let wsum = 0;
  let p = 0;
  for (const l of prior.lists) {
    const size = l.cards.reduce((t, c) => t + c.count, 0);
    const t = triggersIn(l.cards, cards);
    p += l.weight * (choose(size - t, exposed) / choose(size, exposed));
    wsum += l.weight;
  }
  return {
    exposed,
    triggersInPrior: triggersIn(prior.lists[0]!.cards, cards),
    probabilityNone: wsum ? p / wsum : 1,
  };
}
