/** Real tournament lists, pinned in ai/test/fixtures/meta-lists.pinned.json (from docs/research/meta-lists.json), as engine deck specs. */
import { readdirSync, readFileSync } from 'node:fs';
import { SCRIPTED_IDS, type Card } from '@optcg/cards';
import { deckIssues, nextInt, seedRng, type DeckSpec } from '../../src/index.ts';
import { cardMatchesDeckFilter, deckRulesOf } from '../../src/deck.ts';
import { cards } from '../fixtures/index.ts';

interface MetaList {
  leader: string;
  main: { id: string; count: number }[];
  event: string;
}
interface MetaFile {
  archetypes: { leaderId: string; name: string; lists: MetaList[] }[];
}

export interface NamedDeck extends DeckSpec {
  name: string;
}

let decks: NamedDeck[] | undefined;

export function metaDecks(): NamedDeck[] {
  if (!decks) {
    const file = JSON.parse(
      readFileSync(
        new URL('../../../ai/test/fixtures/meta-lists.pinned.json', import.meta.url),
        'utf8',
      ),
    ) as MetaFile;
    decks = file.archetypes.flatMap((a) =>
      a.lists.map((l, i) => ({
        name: `${a.name} ${a.leaderId} #${i + 1}`,
        leader: l.leader,
        main: l.main.flatMap((c) => Array.from({ length: c.count }, () => c.id)),
      })),
    );
  }
  return decks;
}

// ---- Random Standard decks ------------------------------------------------------------------

interface StandardPool {
  leaders: Card[];
  others: Card[];
}
let pool: StandardPool | undefined;

const playable = (c: Card): boolean =>
  c.legality.standard.status === 'legal' || c.legality.standard.status === 'restricted';

function standardPool(): StandardPool {
  if (!pool) {
    const dir = new URL('../../../cards/data/sets/', import.meta.url);
    const leaders: Card[] = [];
    const others: Card[] = [];
    for (const file of readdirSync(dir).sort()) {
      const set = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as { cards: Card[] };
      for (const c of set.cards) {
        if (!playable(c)) continue;
        (c.category === 'Leader' ? leaders : others).push(c);
      }
    }
    pool = { leaders, others };
  }
  return pool;
}

/** Scripted cards are drawn this many times as often as unscripted ones. */
const SCRIPTED_WEIGHT = 6;

/**
 * A seeded, deterministic, Standard-legal deck: a legal or restricted Leader and 50 Standard-legal
 * non-Leader cards in its colours, weighted toward scripted cards (unscripted and keyword-only
 * cards still appear). Respects 4 copies, restricted limits, `anyNumberInDeck`, the Leader's
 * `deckRestriction` and banned pairs; checked with `deckIssues(.., 'standard')`, retrying until
 * clean. `rng` is an engine RNG state, as from `seedRng`.
 */
export function randomStandardDeck(rng: number): { deck: NamedDeck; rng: number } {
  const { leaders, others } = standardPool();
  const lookup = cards();
  for (let attempt = 0; attempt < 200; attempt++) {
    let li: number;
    [li, rng] = nextInt(rng, leaders.length);
    const leader = leaders[li]!;
    const rules = deckRulesOf(leader.id);
    const cands = others.filter(
      (c) =>
        c.colors.every((x) => leader.colors.includes(x)) &&
        !rules.some((r) => 'deckRestriction' in r && cardMatchesDeckFilter(c, r.deckRestriction)) &&
        !(c.legality.standard.bannedWith ?? []).includes(leader.id) &&
        !(leader.legality.standard.bannedWith ?? []).includes(c.id),
    );
    if (cands.length < 13) continue;
    const weight = (c: Card): number => (SCRIPTED_IDS.has(c.id) ? SCRIPTED_WEIGHT : 1);
    const total = cands.reduce((s, c) => s + weight(c), 0);
    const counts = new Map<string, number>();
    const main: string[] = [];
    let tries = 0;
    while (main.length < 50 && tries++ < 5000) {
      let v: number;
      [v, rng] = nextInt(rng, total);
      let c = cands[0]!;
      for (const x of cands) {
        v -= weight(x);
        if (v < 0) {
          c = x;
          break;
        }
      }
      const std = c.legality.standard;
      const unlimited = deckRulesOf(c.id).some((r) => 'anyNumberInDeck' in r);
      const limit = unlimited ? 50 : std.status === 'restricted' ? Math.min(4, std.limit ?? 1) : 4;
      const have = counts.get(c.id) ?? 0;
      if (have >= limit) continue;
      if (have === 0) {
        const conflicts = (std.bannedWith ?? []).some((o) => counts.has(o));
        const reverse = [...counts.keys()].some((o) =>
          (lookup(o)?.legality.standard.bannedWith ?? []).includes(c.id),
        );
        if (conflicts || reverse) continue;
      }
      // Copies come in bunches of 1 to 4 so decks mix full playsets with singletons.
      let k: number;
      [k, rng] = nextInt(rng, 4);
      const add = Math.min(k + 1, limit - have, 50 - main.length);
      for (let i = 0; i < add; i++) main.push(c.id);
      counts.set(c.id, have + add);
    }
    if (main.length !== 50) continue;
    const deck = { leader: leader.id, main };
    if (deckIssues(deck, lookup, 'standard').some((i) => i.severity === 'error')) continue;
    return { deck: { ...deck, name: `standard ${leader.id}` }, rng };
  }
  throw new Error('randomStandardDeck: no legal deck found');
}

/** Both seats' decks for a seed, from the seed alone (stable across runs). */
export function standardDecksFor(seed: number): [NamedDeck, NamedDeck] {
  const a = randomStandardDeck(seedRng(seed ^ 0x51d3c0de));
  const b = randomStandardDeck(a.rng);
  return [a.deck, b.deck];
}
