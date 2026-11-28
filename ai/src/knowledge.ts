/**
 * Public knowledge the AI may use (ADR 0005, ARCHITECTURE §4.3): printed card data, effect scripts
 * (a card's text is public), and the archetype prior built from the sourced tournament lists in
 * `docs/research/meta-lists.json`. Nothing here reads a game.
 */
import { COLORS, SCRIPTS, type Card, type CardCategory, type Color } from '@optcg/cards';
import meta from '../../docs/research/meta-lists.json';
import frequencyJson from '../../cards/data/play-frequency.json';

/** A script's `when` that names the [Counter] timing, alone or in a list. */
export const hasCounterTiming = (when: unknown): boolean =>
  when === 'counter' || (Array.isArray(when) && when.includes('counter'));

/** The +power an Event's [Counter] gives (CR 10-2-9), read from its script; 0 if none. */
export function eventCounterOf(cardId: string): number {
  const script = SCRIPTS[cardId];
  if (!script) return 0;
  let best = 0;
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const power = o.power as { amount?: number } | undefined;
      if (power && typeof power.amount === 'number' && power.amount > best) best = power.amount;
      Object.values(o).forEach(walk);
    }
  };
  for (const a of script.abilities)
    if (hasCounterTiming((a as { when?: unknown }).when)) walk((a as { effect?: unknown }).effect);
  return best;
}

/** A Counter value a Leader's permanent effect gives cards in its owner's hand (OP18-021 Franky). */
export interface CounterGrant {
  categories: CardCategory[];
  value: number;
}

/**
 * The Counter values a Leader gives to cards in its owner's hand, read from its script (public:
 * a Leader is face up and its text is printed), never listed by id. A grant counts when it is a
 * permanent effect with no condition whose target is `from: 'hand', owner: 'you'` and whose
 * filter is a category list alone: the shape of OP18-021 ("All Stage cards in your hand have a
 * +3000 Counter"). A narrower filter or a condition is left out, so an estimate only errs low.
 */
export function leaderCounterGrants(leaderId: string | undefined): CounterGrant[] {
  const script = leaderId ? SCRIPTS[leaderId] : undefined;
  if (!script) return [];
  const out: CounterGrant[] = [];
  for (const ab of script.abilities as unknown as Record<string, unknown>[]) {
    if (ab.kind !== 'permanent' || (ab.zone ?? 'field') !== 'field') continue;
    if (Array.isArray(ab.conditions) && ab.conditions.length > 0) continue;
    for (const ap of (ab.apply as Record<string, unknown>[] | undefined) ?? []) {
      const g = ap.counter as
        | {
            target?: { from?: unknown; owner?: unknown; filter?: { category?: CardCategory[] } };
            value?: number;
            onlyIfNone?: boolean;
          }
        | undefined;
      if (!g || typeof g.value !== 'number' || g.onlyIfNone) continue;
      const t = g.target;
      const f = t?.filter;
      if (t?.from !== 'hand' || t.owner !== 'you' || !f || !Array.isArray(f.category)) continue;
      if (Object.keys(f).length !== 1) continue;
      out.push({ categories: f.category, value: g.value });
    }
  }
  return out;
}

/**
 * A card's defensive value from hand: its printed Counter, or its [Counter] Event's +power, or the
 * larger value its owner's Leader gives it (`leaderId`; only the highest applies, CR 2-10-4).
 */
export function counterValueOf(card: Card | undefined, leaderId?: string): number {
  if (!card) return 0;
  if (card.category === 'Event') return eventCounterOf(card.id);
  let best = card.counter ?? 0;
  if (leaderId)
    for (const g of leaderCounterGrants(leaderId))
      if (g.categories.includes(card.category) && g.value > best) best = g.value;
  return best;
}

interface MetaList {
  date: string;
  leader: string;
  main: { id: string; count: number }[];
}
interface MetaArchetype {
  id: string;
  leaderId: string;
  name: string;
  lists: MetaList[];
}

const ARCHETYPES = (meta as unknown as { archetypes: MetaArchetype[] }).archetypes;

/** One sourced list of an archetype prior, with its recency weight. */
export interface PriorList {
  date: string;
  weight: number;
  cards: { id: string; count: number }[];
}

export interface Prior {
  leaderId: string;
  archetypeId: string;
  lists: PriorList[];
  /**
   * A synthetic prior (a Leader with no sourced list; see `syntheticPrior`). Its `lists` are
   * plausible 50-card guesses for determinization; `pool` is every card the Leader could run.
   */
  synthetic?: true;
  /** Synthetic only: every Standard-legal, colour-fitting, non-Leader card played in the window. */
  pool?: string[];
}

interface FrequencyRow {
  id: string;
  decks: number;
  copies: number;
  colors?: Color[];
  category?: CardCategory;
  standard?: string;
  limit?: number;
}
const FREQUENCY = frequencyJson as unknown as {
  asOf: string;
  cards: FrequencyRow[];
  leaderColors?: Record<string, Color[]>;
};

/**
 * The prior for a Leader nobody has a sourced list for (ARCHITECTURE §4.3): the legal cards of the
 * Leader's colours, weighted by how often the meta plays them (`cards/data/play-frequency.json`).
 * A card fits when every one of its colours is one of the Leader's (CR 5-1-2-2); banned and
 * rotated cards are out.
 *
 * - `pool` is every such card: the lethal detector's "any hand" bound reads it, so a hidden card may
 *   be any of them and the biggest Counter is the biggest of the pool. A wider pool only raises the
 *   bound, so the detector is more conservative, never less.
 * - `lists` are three 50-card guesses for determinization, built from the most-played cards at the
 *   copies the meta runs them (one to four, a restricted card at its limit). The second and third
 *   defer every third and every second card of the ranking to the end, so the guesses differ.
 *
 * A Leader the table does not know (a set newer than the table) is treated as having every colour:
 * a wide pool, conservative for the detector.
 */
function syntheticPrior(leaderId: string): Prior {
  const colors = FREQUENCY.leaderColors?.[leaderId] ?? [...COLORS];
  const fits = FREQUENCY.cards
    .filter(
      (r) =>
        r.category !== 'Leader' &&
        (r.standard === 'legal' || r.standard === 'restricted') &&
        (r.colors ?? []).every((c) => colors.includes(c)),
    )
    .sort((a, b) => b.decks - a.decks || b.copies - a.copies || (a.id < b.id ? -1 : 1));
  const cap = (r: FrequencyRow) => r.limit ?? 4;
  const typical = (r: FrequencyRow) =>
    Math.min(cap(r), Math.max(1, Math.round(r.copies / Math.max(1, r.decks))));
  const build = (every: number): { id: string; count: number }[] => {
    const out: { id: string; count: number }[] = [];
    let n = 0;
    const take = (r: FrequencyRow) => {
      const k = Math.min(typical(r), 50 - n);
      if (k > 0) {
        out.push({ id: r.id, count: k });
        n += k;
      }
    };
    const deferred = (i: number) => every > 0 && i % every === every - 1;
    fits.forEach((r, i) => {
      if (!deferred(i)) take(r);
    });
    fits.forEach((r, i) => {
      if (deferred(i)) take(r);
    });
    // Still short of 50 (a narrow colour pool): more copies of the played cards, up to their limit.
    for (const c of out) {
      const r = fits.find((x) => x.id === c.id)!;
      const k = Math.min(cap(r) - c.count, 50 - n);
      if (k > 0) {
        c.count += k;
        n += k;
      }
    }
    return out;
  };
  return {
    leaderId,
    archetypeId: `synthetic-${leaderId}`,
    synthetic: true,
    pool: fits.map((r) => r.id).sort(),
    lists: [0, 3, 2].map((every, i) => ({
      date: FREQUENCY.asOf,
      weight: 3 - i,
      cards: build(every),
    })),
  };
}

const SYNTHETIC = new Map<string, Prior>();

/**
 * The prior for a Leader (ARCHITECTURE §4.3): its sourced lists, weighted by recency (the newest
 * list 3, then 2, then 1; ties keep their order), else a synthetic prior from play frequency.
 * Never null.
 */
export function priorFor(leaderId: string): Prior {
  const a = ARCHETYPES.find((x) => x.leaderId === leaderId);
  if (!a || a.lists.length === 0) {
    let p = SYNTHETIC.get(leaderId);
    if (!p) SYNTHETIC.set(leaderId, (p = syntheticPrior(leaderId)));
    return p;
  }
  const sorted = [...a.lists].sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0));
  return {
    leaderId,
    archetypeId: a.id,
    lists: sorted.map((l, i) => ({
      date: l.date,
      weight: Math.max(1, sorted.length - i),
      cards: l.main.map((c) => ({ ...c })),
    })),
  };
}

const listCardIds = (p: Prior): string[] => [
  ...new Set(p.lists.flatMap((l) => l.cards.map((c) => c.id))),
];

/**
 * Every card id a hidden card of this Leader's deck may be: the sourced lists' cards, or a
 * synthetic prior's whole pool. The app loads these and the lethal bound reads them.
 */
export function priorCardIds(leaderId: string): string[] {
  const p = priorFor(leaderId);
  return (p.pool ? [...p.pool] : listCardIds(p)).sort();
}

/**
 * The biggest defensive value any card in an archetype's lists has (public: the guide lists them).
 * Explanations say "its deck's biggest counter is +4000" from this, never from a hidden hand.
 */
export function biggestCounter(leaderId: string, cards: ReadonlyMap<string, Card>): number {
  let best = 0;
  // The lists, not a synthetic pool: "its deck's biggest counter" speaks of a typical list.
  for (const id of listCardIds(priorFor(leaderId)))
    best = Math.max(best, counterValueOf(cards.get(id), leaderId));
  return best;
}

/** The average defensive value per card of an archetype (for the heuristic's unknown hands). */
export function averageCounter(leaderId: string, cards: ReadonlyMap<string, Card>): number {
  const p = priorFor(leaderId);
  let sum = 0;
  let n = 0;
  for (const l of p.lists)
    for (const c of l.cards) {
      sum += counterValueOf(cards.get(c.id), leaderId) * c.count * l.weight;
      n += c.count * l.weight;
    }
  return n ? sum / n : 1000;
}
