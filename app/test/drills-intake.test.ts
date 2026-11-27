/**
 * Items from the player's own games (M9 WP4): a stored review's flags become drill items once and are
 * cached in the `progress` KvStore; a deleted game takes its items with it and says so.
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { bankFor } from '@optcg/ai/drills';
import type { BoardItem, CounterItem, ReviewFlag } from '@optcg/ai';
import {
  droppedNote,
  flagBank,
  FLAG_ITEMS_KEY,
  practisableFlags,
  type IntakeDeps,
  type IntakeStore,
} from '../src/drills/intake.ts';
import { minimal } from '../../ai/src/explanation.ts';

const flag = (
  id: string,
  kind: ReviewFlag['kind'],
  practice?: ReviewFlag['practice'],
): ReviewFlag =>
  ({
    id,
    kind,
    turn: 9,
    player: 'p1',
    restoreIndex: 3,
    decisionIndex: 4,
    severity: 'moderate',
    certainty: 'any-hand',
    explanation: minimal('c', 'x'),
    did: [],
    ...(practice ? { practice } : {}),
  }) as ReviewFlag;

function fakeStore(games: Record<string, ReviewFlag[]>, kv = new Map<string, unknown>()) {
  const store: IntakeStore = {
    listGames: async () => Object.keys(games).map((id) => ({ id, meta: {} as never })),
    getGame: async (id) => ({ id, record: {} as never, meta: {} as never }),
    getReview: async (id) => ({
      gameId: id,
      analysisVersion: 1,
      engineVersion: 'x',
      status: 'complete',
      results: { r: { itemId: 'r', turn: 9, flags: games[id]!, notes: [] } },
      markers: [],
      practised: {},
    }),
    progress: {
      get: async (k) => kv.get(k),
      set: async (k, v) => void kv.set(k, v),
      delete: async (k) => void kv.delete(k),
      keys: async () => [...kv.keys()],
    },
  };
  return { store, kv };
}

const counter = bankFor('counter').items[0] as CounterItem;

const deps = (calls: string[]): IntakeDeps => ({
  loadCards: async () => new Map<string, Card>(),
  cardIdsOf: () => [],
  request: async (_r, f) => {
    calls.push(f.id);
    return { item: { ...counter, id: 'from-worker' } as BoardItem };
  },
  mulliganItem: () => null,
});

describe('flag intake', () => {
  const practice = { judge: 'survive-turn' as const, turn: 9 };

  it('keeps flags with a practice judge (and mulligans), asks the worker once per flag, and caches', async () => {
    const calls: string[] = [];
    const { store, kv } = fakeStore({
      g1: [flag('given-away:9:4', 'given-away', practice), flag('target:9:5', 'target')],
      g2: [flag('should-counter:7:2', 'should-counter', practice)],
    });
    expect(practisableFlags(await store.getReview('g1')).map((f) => f.id)).toEqual([
      'given-away:9:4',
    ]);
    const a = await flagBank(store, deps(calls));
    expect(a.items).toHaveLength(2);
    expect(a.dropped).toBe(0);
    // The item carries its game and flag, the detector's judge, and the flag's own explanation.
    expect(a.items[0]!.item.source).toEqual({
      kind: 'flag',
      gameId: 'g1',
      flagId: 'given-away:9:4',
      turn: 9,
    });
    expect(a.items[0]!.judge).toBe('survive-turn');
    expect(a.items[0]!.explanation?.claim).toBe('x');
    expect(calls).toHaveLength(2);
    expect(kv.has(FLAG_ITEMS_KEY)).toBe(true);
    // A later session needs no worker.
    const b = await flagBank(store, deps(calls));
    expect(b.items).toHaveLength(2);
    expect(calls).toHaveLength(2);
  });

  it('drops the items of a deleted game and counts them', async () => {
    const calls: string[] = [];
    const first = fakeStore({
      g1: [flag('a:1:1', 'given-away', practice)],
      g2: [flag('b:1:1', 'given-away', practice)],
      g3: [flag('c:1:1', 'given-away', practice)],
    });
    await flagBank(first.store, deps(calls));
    // Two of the three games are deleted: the cache still holds their items.
    const second = fakeStore({ g1: [flag('a:1:1', 'given-away', practice)] }, first.kv);
    const out = await flagBank(second.store, deps(calls));
    expect(out.items).toHaveLength(1);
    expect(out.dropped).toBe(2);
    expect(droppedNote(out.dropped)).toBe('2 puzzles came from games you deleted.');
    expect(droppedNote(1)).toBe('1 puzzle came from games you deleted.');
    expect(droppedNote(0)).toBeNull();
    // They are forgotten: the next session does not count them again.
    expect((await flagBank(second.store, deps(calls))).dropped).toBe(0);
  });

  it('a flag the worker cannot build is not cached, so a later builder is asked again', async () => {
    let asked = 0;
    const { store } = fakeStore({ g1: [flag('a:1:1', 'given-away', practice)] });
    const none: IntakeDeps = {
      ...deps([]),
      request: async () => {
        asked++;
        return { item: null, reason: 'not built yet' };
      },
    };
    await flagBank(store, none);
    await flagBank(store, none);
    expect(asked).toBe(2);
  });
});
