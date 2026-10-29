/**
 * Determinization (ARCHITECTURE §4.3, ADR 0005): guess every card the AI cannot see, consistently
 * with its view, and build full states from those guesses.
 *
 * - **Its own hidden cards** (deck order, face-down Life) come from its own decklist, minus every one
 *   of its cards it can see. The AI owns that list; it is not hidden from it.
 * - **The opponent's hidden cards** (hand, deck, face-down Life) come from the **archetype prior**:
 *   one of the sourced lists for the opponent's Leader, chosen by recency weight, minus the
 *   opponent's cards the AI has seen. Never the human's actual list.
 * - Cards the view says the AI knows (a looked-at deck top, a revealed card in hand) are not hidden
 *   in the skeleton, so they stay fixed in every sample.
 * - If a pool is short (an off-meta list, a scenario), it is padded from the same source; if it is
 *   long, a random subset is used. Each sample is a guess, never a claim.
 */
import type { Card } from '@optcg/cards';
import {
  determinize,
  nextInt,
  shuffle,
  type GameState,
  type PlayerId,
  type RngState,
  type SearchView,
} from '@optcg/engine';
import type { Prior } from '../knowledge.ts';

export interface SampleContext {
  /** The AI's own main deck (50 card ids). */
  ownDeck: readonly string[];
  /** The prior for the opponent's Leader, or null (then seen cards and the AI's own list pad it). */
  prior: Prior | null;
  /** Public card data (the engine rebuilds its definitions from it). */
  cards: ReadonlyMap<string, Card>;
}

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/** Every card of `owner` the viewer can identify in its view. */
function seenCards(view: SearchView, owner: PlayerId): string[] {
  const out: string[] = [];
  const z = view.zones[owner];
  for (const list of [z.leader, z.characters, z.stage, z.trash, z.hand, z.life, z.deck])
    for (const c of list) if (c.card) out.push(c.card);
  for (const [pos, card] of Object.entries(view.known))
    if (pos.startsWith(owner + '.')) out.push(card);
  if (owner === view.player) for (const c of view.looking) if (c.card) out.push(c.card);
  return out;
}

/** Remove one copy of each of `seen` from `pool` (a missing copy is ignored). */
function without(pool: string[], seen: readonly string[]): string[] {
  const out = pool.slice();
  for (const id of seen) {
    const i = out.indexOf(id);
    if (i >= 0) out.splice(i, 1);
  }
  return out;
}

/** Bring `pool` to exactly `n` cards: a random subset, or padded with draws from `pad`. */
function fit(
  pool: string[],
  n: number,
  pad: readonly string[],
  rng: RngState,
): [string[], RngState] {
  const [out, r0] = shuffle(pool, rng);
  let r = r0;
  if (out.length > n) return [out.slice(0, n), r];
  while (out.length < n && pad.length > 0) {
    let i: number;
    [i, r] = nextInt(r, pad.length);
    out.push(pad[i]!);
  }
  return [out, r];
}

function pickList(prior: Prior, rng: RngState): [string[], RngState] {
  const total = prior.lists.reduce((s, l) => s + l.weight, 0);
  const [v0, r] = nextInt(rng, total);
  let v = v0;
  for (const l of prior.lists) {
    v -= l.weight;
    if (v < 0) return [l.cards.flatMap((c) => Array.from({ length: c.count }, () => c.id)), r];
  }
  const l = prior.lists[0]!;
  return [l.cards.flatMap((c) => Array.from({ length: c.count }, () => c.id)), r];
}

/** One guess for every hidden card in `view`, keyed by the view's positional handles. */
export function sampleFill(
  view: SearchView,
  ctx: SampleContext,
  rng: RngState,
): [Record<string, string>, RngState] {
  let r = rng;
  const me = view.player;
  const opp = other(me);
  const slots: Record<PlayerId, string[]> = { p1: [], p2: [] };
  for (const pos of Object.values(view.skeleton.hidden))
    slots[pos.startsWith('p1.') ? 'p1' : 'p2'].push(pos);
  const fill: Record<string, string> = {};

  // The AI's own hidden cards: its list minus what it can see.
  const mineSeen = seenCards(view, me).filter((id) => id !== view.zones[me].leader[0]?.card);
  const minePool = without([...ctx.ownDeck], mineSeen);
  const [mine, r1] = fit(minePool, slots[me].length, ctx.ownDeck, r);
  r = r1;
  slots[me].forEach((pos, i) => (fill[pos] = mine[i] ?? ctx.ownDeck[0]!));

  // The opponent's: a list from the prior, minus what the AI has seen of theirs.
  const theirSeen = seenCards(view, opp).filter((id) => id !== view.zones[opp].leader[0]?.card);
  let list: string[];
  if (ctx.prior) [list, r] = pickList(ctx.prior, r);
  else list = theirSeen.length ? theirSeen.slice() : [...ctx.ownDeck];
  const theirPool = without(list, theirSeen);
  const [theirs, r2] = fit(theirPool, slots[opp].length, list, r);
  r = r2;
  slots[opp].forEach((pos, i) => (fill[pos] = theirs[i] ?? list[0]!));
  return [fill, r];
}

/** `k` determinized states for `view`, from one seed. */
export function determinizations(
  view: SearchView,
  ctx: SampleContext,
  k: number,
  seed: number,
): GameState[] {
  const out: GameState[] = [];
  let r: RngState = (seed >>> 0) ^ 0x9e3779b9;
  const lookup = (id: string) => ctx.cards.get(id);
  for (let i = 0; i < k; i++) {
    let fill: Record<string, string>;
    [fill, r] = sampleFill(view, ctx, r);
    let s: number;
    [s, r] = nextInt(r, 0x7fffffff);
    out.push(determinize(view, fill, lookup, s));
  }
  return out;
}
