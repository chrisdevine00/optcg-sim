/**
 * The `public` mode's worst-case state (ARCHITECTURE §4.4). The requesting seat's view is all that
 * is read. Every card the view cannot show is replaced by a **placeholder card**, not guessed:
 *
 * - **The defender's hidden hand and face-down Life** become `WORST_COUNTER` Events whose one
 *   [Counter] ability is a choice the defender makes among every effect found in the cards of its
 *   archetype prior (`profile.ts`: +power, rest an attacker's Character, draw), costs dropped. Each
 *   hit moves a Life card to the defender's hand (CR 7-1-4-1-1-2), so the hand grows by one such
 *   card per hit. Real Counter play then runs through the engine.
 * - **Its deck**: the top few cards (as many as a deck holds copies of drawing cards) are the same
 *   placeholder, the rest `WORST_LIGHT` (no drawing mode). **Everything else hidden** (the attacker's
 *   own deck and face-down Life) becomes `BLANK`: no Counter, no effect.
 *
 * What this assumes (DECISIONS, 2026-11-05, "A1 corrected"):
 * 1. Each hidden defender card may be any [Counter] card of the prior, whichever is best for the
 *    defender when it is played, with DON!! and trash costs and boost filters ignored. A proof here
 *    holds against every hand the prior allows; a refutation may be pessimistic about a real hand.
 *    An effect the model cannot represent is a `gap`, and the proof then does not claim `any-hand`.
 * 2. Hidden cards in the defender's Life are never [Trigger] cards in the search. Triggers are
 *    handled outside it as a chance: `triggerRisk`.
 * 3. The attacker's own deck draws blanks (effects that draw are searched but find nothing).
 */
import type { Card } from '@optcg/cards';
import { determinize, type PlayerId, type SearchView } from '@optcg/engine';
import { priorCardIds, priorFor, type Prior } from '../../knowledge.ts';
import { counterProfile, defenceBound, handCostGaps, worstAbility } from './profile.ts';

export const WORST_COUNTER = '$WORST-COUNTER';
export const WORST_LIGHT = '$WORST-LIGHT';
export const BLANK = '$BLANK';

/** The assumed biggest Counter when the opponent's leader has no sourced list. */
export const FALLBACK_COUNTER = 4000;

function placeholder(
  id: string,
  name: string,
  category: 'Character' | 'Event',
  counter: number | null,
  traits?: { types: string[]; colors: string[] },
): Card {
  return {
    id,
    name,
    category,
    colors: traits?.colors ?? [],
    cost: 0,
    power: category === 'Event' ? null : 0,
    counter,
    life: null,
    attributes: [],
    types: traits?.types ?? [],
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
  /** Their [Counter] cards can rest one of the attacker's Characters (all at once with the power). */
  rests: boolean;
  /** Their [Counter] cards can draw (with the condition the card gives). */
  draws: boolean;
  /** [Counter] effects the placeholder cannot represent; a proof then cannot claim `any-hand`. */
  gaps: string[];
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
export function publicState(
  view: SearchView,
  cards: ReadonlyMap<string, Card>,
  model: 'full' | 'power-only' = 'full',
): PublicSetup {
  const me = view.player;
  const def = other(me);
  const leader = view.zones[def].leader[0]?.card ?? '';
  const prior = leader ? priorFor(leader) : null;
  // The most one hidden card adds, given the DON!! on their field (public): a Counter that costs
  // DON!! −N counts only if N are there.
  const dn = view.don[def];
  const maxPerCard = defenceBound(
    prior ? priorCardIds(leader) : [],
    cards,
    dn.active + dn.rested + dn.given,
    FALLBACK_COUNTER,
  ).perCard;
  const fullProfile = counterProfile(
    prior ? priorCardIds(leader) : [],
    cards,
    prior ? 0 : FALLBACK_COUNTER,
  );
  const profile: typeof fullProfile =
    model === 'full'
      ? fullProfile
      : {
          ...fullProfile,
          modes: fullProfile.modes.slice(0, 1),
          modesNoDraw: fullProfile.modes.slice(0, 1),
          rests: false,
          draws: false,
          drawIds: [],
          types: [],
          colors: [],
        };
  const full = placeholder(WORST_COUNTER, 'Unknown card', 'Event', null, profile);
  const light = placeholder(WORST_LIGHT, 'Unknown card', 'Event', null, profile);
  const blank = placeholder(BLANK, 'Unknown card', 'Character', null);
  // A deck holds at most this many copies of the cards that draw: only that many cards from the top
  // of the deck can be a drawing mode (the rest of a chain of draws is finite, as a real one is).
  const drawCopies = prior
    ? Math.max(
        ...prior.lists.map((l) =>
          l.cards.filter((c) => profile.drawIds.includes(c.id)).reduce((t, c) => t + c.count, 0),
        ),
      )
    : 0;
  const fill: Record<string, string> = {};
  let hiddenLife = 0;
  let hiddenHand = 0;
  for (const pos of Object.values(view.skeleton.hidden)) {
    const [owner, zone, idx] = pos.split('.') as [PlayerId, string, string];
    if (owner === def && (zone === 'hand' || zone === 'life')) {
      fill[pos] = WORST_COUNTER;
      if (zone === 'life') hiddenLife++;
      else hiddenHand++;
    } else if (owner === def && zone === 'deck')
      fill[pos] = Number(idx) < drawCopies ? WORST_COUNTER : WORST_LIGHT;
    else fill[pos] = BLANK;
  }
  const lookup = (id: string) =>
    id === WORST_COUNTER ? full : id === WORST_LIGHT ? light : id === BLANK ? blank : cards.get(id);
  const state = determinize(view, fill, lookup, 1);
  const z = view.zones[def];
  const boardIds = [...z.leader, ...z.characters, ...z.stage]
    .map((c) => c.card)
    .filter((c): c is string => !!c);
  // The placeholder Events' one [Counter] ability each: the defender picks the best mode, no cost.
  const defs = (state as unknown as { defs: Record<string, { abilities: unknown[] }> }).defs;
  for (const [id, modes] of [
    [WORST_COUNTER, profile.modes],
    [WORST_LIGHT, profile.modesNoDraw],
  ] as const)
    if (defs[id]) defs[id] = { ...defs[id], abilities: [worstAbility(modes as unknown[][])] };
  return {
    state,
    maxPerCard,
    noPrior: !prior,
    rests: profile.rests,
    draws: profile.draws,
    gaps: [...profile.gaps, ...(prior ? [] : ['no sourced list']), ...handCostGaps(boardIds)],
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
