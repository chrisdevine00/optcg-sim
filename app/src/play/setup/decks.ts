/**
 * The 12 meta archetypes' sourced lists (docs/research/meta-lists.json) as playable decks, and the
 * card data a game needs, loaded per set on demand.
 */
import type { Card, Color } from '@optcg/cards';
import { setCodeOf } from '@optcg/cards';
import { loadSet } from '@optcg/cards/browser';
import type { DeckSpec } from '@optcg/engine';
import { SCRIPTED } from '../../cards/scripts.ts';
import meta from '../../../../docs/research/meta-lists.json';

export interface DeckOption {
  id: string;
  archetype: string;
  leader: string;
  name: string;
  colors: Color[];
  /** "6th · ChinoizeCup #122 Tuesday · 2026-10-13" */
  source: string;
  url: string;
  spec: DeckSpec;
}

interface MetaList {
  event: string;
  date: string;
  placing: string;
  url: string;
  leader: string;
  main: { id: string; count: number }[];
}
interface MetaArchetype {
  id: string;
  leaderId: string;
  name: string;
  colors: Color[];
  lists: MetaList[];
}

export const ARCHETYPES = (meta as unknown as { archetypes: MetaArchetype[] }).archetypes;

export const DECKS: DeckOption[] = ARCHETYPES.flatMap((a) =>
  a.lists.map((l, i) => ({
    id: `${a.id}#${i + 1}`,
    archetype: a.id,
    leader: a.leaderId,
    name: a.name,
    colors: a.colors,
    source: `${l.placing} · ${l.event.replace(/^\[[^\]]*\]\s*/, '')} · ${l.date}`,
    url: l.url,
    spec: {
      leader: l.leader,
      main: l.main.flatMap((c) => Array.from({ length: c.count }, () => c.id)),
    },
  })),
);

export const deckById = (id: string) => DECKS.find((d) => d.id === id);

/** How many different card numbers in a deck (Leader included) have an effect script (M4a). */
export function scriptedCount(d: DeckOption): { scripted: number; total: number } {
  const ids = new Set([d.spec.leader, ...d.spec.main]);
  return { scripted: [...ids].filter((id) => SCRIPTED.has(id)).length, total: ids.size };
}

/**
 * Plain-language automation status of one seat's deck (review M4a-15): counted by different card
 * numbers, never claiming more than the scripts do. Cards without a script still play for their
 * stats and verified keywords; some have no effect text at all.
 */
export function automationLine(d: DeckOption, seat: string): string {
  const { scripted, total } = scriptedCount(d);
  if (scripted === total)
    return `${seat} (${d.name}): all ${total} different cards are scripted; their effects happen in play.`;
  if (scripted === 0)
    return `${seat} (${d.name}): no card effects are scripted yet; cards play for their power, cost, Counter and verified keywords only.`;
  return `${seat} (${d.name}): ${scripted} of ${total} different cards are scripted; the others play for their power, cost, Counter and verified keywords only.`;
}
/** A deck by leader id (URL parameters accept `OP17-039`), the first list. */
export const deckByLeader = (leader: string) => DECKS.find((d) => d.leader === leader);

/** Every card in these decks, loaded from their sets. */
export async function loadCards(ids: Iterable<string>): Promise<Map<string, Card>> {
  const wanted = new Set(ids);
  const sets = new Set([...wanted].map(setCodeOf));
  const files = await Promise.all([...sets].map((s) => loadSet(s)));
  const out = new Map<string, Card>();
  for (const f of files) for (const c of f.cards) if (wanted.has(c.id)) out.set(c.id, c);
  return out;
}
