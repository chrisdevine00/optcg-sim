/** Test support: every generated card, and the meta decks, read from disk. */
import { readdirSync, readFileSync } from 'node:fs';
import type { Card, SetFile } from '@optcg/cards';
import type { CardLookup, DeckSpec } from '@optcg/engine';

let byId: Map<string, Card> | undefined;

export function cardMap(): Map<string, Card> {
  if (!byId) {
    byId = new Map();
    const dir = new URL('../../cards/data/sets/', import.meta.url);
    for (const file of readdirSync(dir)) {
      const set = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as SetFile;
      for (const card of set.cards) byId.set(card.id, card);
    }
  }
  return byId;
}

export const lookup: CardLookup = (id) => cardMap().get(id);

interface MetaFile {
  archetypes: {
    leaderId: string;
    lists: { leader: string; main: { id: string; count: number }[] }[];
  }[];
}

export function metaDecks(): DeckSpec[] {
  const file = JSON.parse(
    readFileSync(new URL('../../docs/research/meta-lists.json', import.meta.url), 'utf8'),
  ) as MetaFile;
  return file.archetypes.flatMap((a) =>
    a.lists.map((l) => ({
      leader: l.leader,
      main: l.main.flatMap((c) => Array.from({ length: c.count }, () => c.id)),
    })),
  );
}
