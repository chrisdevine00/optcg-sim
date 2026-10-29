/**
 * Public knowledge the AI may use (ADR 0005, ARCHITECTURE §4.3): printed card data, effect scripts
 * (a card's text is public), and the archetype prior built from the sourced tournament lists in
 * `docs/research/meta-lists.json`. Nothing here reads a game.
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import meta from '../../docs/research/meta-lists.json';

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
    if ((a as { when?: unknown }).when === 'counter') walk((a as { effect?: unknown }).effect);
  return best;
}

/** A card's defensive value from hand: its printed Counter, or its [Counter] Event's +power. */
export function counterValueOf(card: Card | undefined): number {
  if (!card) return 0;
  if (card.category === 'Event') return eventCounterOf(card.id);
  return card.counter ?? 0;
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
}

/**
 * The archetype prior for a Leader (ARCHITECTURE §4.3): its sourced lists, weighted by recency (the
 * newest list 3, then 2, then 1; ties keep their order). Null for a Leader with no sourced list.
 */
export function priorFor(leaderId: string): Prior | null {
  const a = ARCHETYPES.find((x) => x.leaderId === leaderId);
  if (!a || a.lists.length === 0) return null;
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

/** Every card id in a prior. */
export function priorCardIds(leaderId: string): string[] {
  const p = priorFor(leaderId);
  if (!p) return [];
  return [...new Set(p.lists.flatMap((l) => l.cards.map((c) => c.id)))].sort();
}

/**
 * The biggest defensive value any card in an archetype's lists has (public: the guide lists them).
 * Explanations say "its deck's biggest counter is +4000" from this, never from a hidden hand.
 */
export function biggestCounter(leaderId: string, cards: ReadonlyMap<string, Card>): number {
  let best = 0;
  for (const id of priorCardIds(leaderId)) best = Math.max(best, counterValueOf(cards.get(id)));
  return best;
}

/** The average defensive value per card of an archetype (for the heuristic's unknown hands). */
export function averageCounter(leaderId: string, cards: ReadonlyMap<string, Card>): number {
  const p = priorFor(leaderId);
  if (!p) return 1000;
  let sum = 0;
  let n = 0;
  for (const l of p.lists)
    for (const c of l.cards) {
      sum += counterValueOf(cards.get(c.id)) * c.count * l.weight;
      n += c.count * l.weight;
    }
  return n ? sum / n : 1000;
}
