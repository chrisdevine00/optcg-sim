/**
 * The 12 meta archetypes' sourced lists (docs/research/meta-lists.json) as playable decks, and the
 * card data a game needs, loaded per set on demand.
 */
import type { Card, Color } from '@optcg/cards';
import { coverage, setCodeOf } from '@optcg/cards';
import { loadSet } from '@optcg/cards/browser';
import type { DeckSpec } from '@optcg/engine';
import { SCRIPTED } from '../../cards/scripts.ts';
import meta from '../../../../docs/research/meta-lists.json';
import { savedDeck, savedDecks, type SavedDeck } from '../../decks/store.ts';

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

/** The archetype value of saved decks in Setup's pickers. */
export const SAVED = 'saved';

function savedOption(d: SavedDeck | undefined): DeckOption | undefined {
  if (!d?.leader) return undefined;
  return {
    id: d.id,
    archetype: SAVED,
    leader: d.leader,
    name: d.name,
    colors: [],
    source: `Your deck · ${d.main.length} cards · ${d.format === 'standard' ? 'Standard' : 'Extra Regulation'}`,
    url: '',
    spec: { leader: d.leader, main: d.main.slice() },
  };
}

/** Saved decks with a Leader, newest first (M6). */
export const savedOptions = (): DeckOption[] =>
  [...savedDecks()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .flatMap((d) => savedOption(d) ?? []);

/** A meta list (`OP17-039-rocks#1`) or a saved deck (`saved:...`). */
export const deckById = (id: string): DeckOption | undefined =>
  DECKS.find((d) => d.id === id) ??
  (id.startsWith('saved:') ? savedOption(savedDeck(id)) : undefined);

/** The format a deck is checked in: a saved deck's own, Standard for the meta lists. */
export const deckFormat = (id: string): 'standard' | 'extra' => savedDeck(id)?.format ?? 'standard';

export interface DeckCoverage {
  /** Different card numbers in the deck, Leader included. */
  total: number;
  /** Cards with an effect script. */
  scripted: number;
  /** Cards with no effect text, or only printed keywords: they play fully without a script. */
  noScriptNeeded: number;
  /** Cards whose effect does not happen in play (no script, text to automate, or unknown card). */
  notAutomated: number;
  /** `scripted + noScriptNeeded`. */
  fully: number;
}

/**
 * How fully each different card number in a deck plays (Leader included). Vanilla and keywords-only cards
 * need no script, so they count as fully playing; a card the data does not know counts as not automated.
 */
export function deckCoverage(d: DeckOption, cards: ReadonlyMap<string, Card>): DeckCoverage {
  const ids = [...new Set([d.spec.leader, ...d.spec.main])];
  const known = ids.flatMap((id) => cards.get(id) ?? []);
  const c = coverage(known, SCRIPTED);
  return {
    total: ids.length,
    scripted: c.scripted,
    noScriptNeeded: c.noScriptNeeded,
    notAutomated: ids.length - c.fully,
    fully: c.fully,
  };
}

/**
 * Plain-language automation status of one seat's deck (review M4a-15): counted by different card
 * numbers, never claiming more than the scripts do. A card with no effect text has nothing to
 * automate and is not called scripted; cards that do not fully play still play for their stats and
 * verified keywords.
 */
export function automationLine(
  d: DeckOption,
  seat: string,
  cards: ReadonlyMap<string, Card>,
): string {
  const { scripted, noScriptNeeded, notAutomated, fully, total } = deckCoverage(d, cards);
  const head = `${seat} (${d.name}): `;
  const split = `${scripted} with scripted effects, ${noScriptNeeded} with no effect to script`;
  if (notAutomated === 0)
    return noScriptNeeded === 0
      ? `${head}all ${total} different cards are scripted; their effects happen in play.`
      : `${head}all ${total} different cards play fully: ${split}.`;
  if (fully === 0)
    return `${head}no card effects are scripted yet; cards play for their power, cost, Counter and verified keywords only.`;
  return `${head}${fully} of ${total} different cards play fully (${split}); the other ${notAutomated} play for their power, cost, Counter and verified keywords only.`;
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
