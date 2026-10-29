/** Real tournament lists from docs/research/meta-lists.json, as engine deck specs. */
import { readFileSync } from 'node:fs';
import type { DeckSpec } from '../../src/index.ts';

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
      readFileSync(new URL('../../../docs/research/meta-lists.json', import.meta.url), 'utf8'),
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
