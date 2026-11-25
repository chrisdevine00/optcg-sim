/** Test support: every generated card, and the meta decks, read from disk. */
import { readdirSync, readFileSync } from 'node:fs';
import type { Card, SetFile } from '@optcg/cards';
import { NOT_IMPLEMENTED } from '@optcg/ai';
import type { CardLookup, DeckSpec, SearchView } from '@optcg/engine';

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

/**
 * Test doubles for the coach's M7 requests (`CoachPort.hint`, `score`, `threat`): each answers at
 * once with the typed "not implemented" the worker's stubs give, and records what it was asked.
 * Assign its methods into an in-process port: `hint = stubs.hint` and so on.
 */
export function coachStubs() {
  const asked: { kind: 'hint' | 'score' | 'threat'; view: SearchView }[] = [];
  let n = 1000;
  const answer = (kind: 'hint' | 'score' | 'threat', view: SearchView) => {
    asked.push({ kind, view });
    return { id: n++, result: Promise.resolve({ result: NOT_IMPLEMENTED, ms: 0 }) };
  };
  return {
    asked,
    hint: (view: SearchView, _o: { budgetMs: number }) => answer('hint', view),
    score: (view: SearchView, _o: { budgetMs: number }) => answer('score', view),
    threat: (view: SearchView, _o: { capMs: number }) => answer('threat', view),
  };
}

export function metaDecks(): DeckSpec[] {
  const file = JSON.parse(
    readFileSync(new URL('../../ai/test/fixtures/meta-lists.pinned.json', import.meta.url), 'utf8'),
  ) as MetaFile;
  return file.archetypes.flatMap((a) =>
    a.lists.map((l) => ({
      leader: l.leader,
      main: l.main.flatMap((c) => Array.from({ length: c.count }, () => c.id)),
    })),
  );
}
