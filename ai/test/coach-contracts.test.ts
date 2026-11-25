/**
 * M7 WP0: the coach contracts. The worker's stubs answer every new request with a typed "not
 * implemented"; the priority order holds (the turn's own search, then a pressed hint or threat,
 * then score, then the background detector); action keys are stable.
 */
import { describe, expect, it } from 'vitest';
import type { Action, SearchView } from '@optcg/engine';
import type { AiRequest } from '../src/protocol.ts';
import { answerCoach, priorityOf, type Work } from '../src/coach/dispatch.ts';
import { insertByPriority } from '../src/search/lethal/request.ts';
import { actionKey, isNotImplemented, MAX_ALTERNATIVES } from '../src/coach/types.ts';

const view = {} as SearchView;

describe('the coach stubs', () => {
  const reqs: Extract<AiRequest, { type: 'hint' | 'score' | 'threat' }>[] = [
    { type: 'hint', id: 1, view, budgetMs: 800 },
    { type: 'score', id: 2, view, budgetMs: 300 },
    { type: 'threat', id: 3, view, capMs: 1500 },
  ];
  for (const r of reqs)
    it(`answers ${r.type} with the same id and a typed not-implemented`, () => {
      const a = answerCoach(r, 4);
      expect(a.type).toBe(r.type);
      expect(a).toMatchObject({ id: r.id, ms: 4 });
      expect(isNotImplemented('result' in a ? a.result : null)).toBe(true);
    });
  it('an alternative cap of two is part of the contract', () => {
    expect(MAX_ALTERNATIVES).toBe(2);
  });
});

describe('the priority map', () => {
  const w = (type: Work['type'], priority?: 2 | 3 | 4): Work => {
    switch (type) {
      case 'lethal':
        return { type, id: 0, mode: 'public', view, ...(priority ? { priority } : {}) };
      case 'planTurn':
        return { type, id: 0, view, seed: 1 };
      case 'decide':
        return { type, id: 0, view, tier: 'rookie', seed: 1, budgetMs: 1 };
      case 'hint':
        return { type, id: 0, view, budgetMs: 1 };
      case 'score':
        return { type, id: 0, view, budgetMs: 1 };
      case 'threat':
        return { type, id: 0, view, capMs: 1 };
    }
  };
  it('has the documented values', () => {
    expect(priorityOf(w('decide'))).toBe(1);
    expect(priorityOf(w('planTurn'))).toBe(1);
    expect(priorityOf(w('hint'))).toBe(2);
    expect(priorityOf(w('threat'))).toBe(2);
    expect(priorityOf(w('lethal'))).toBe(2);
    expect(priorityOf(w('score'))).toBe(3);
    expect(priorityOf(w('lethal', 4))).toBe(4);
  });
  it('queues by priority, first come first served within one', () => {
    const q: Work[] = [];
    const add = (id: number, x: Work) => insertByPriority(q, { ...x, id }, priorityOf);
    add(1, w('lethal', 4));
    add(2, w('score'));
    add(3, w('hint'));
    add(4, w('decide'));
    add(5, w('threat'));
    add(6, w('score'));
    add(7, w('planTurn'));
    expect(q.map((x) => x.id)).toEqual([4, 7, 3, 5, 2, 6, 1]);
  });
});

describe('actionKey', () => {
  it('ignores property order and tells actions apart', () => {
    const a = { type: 'playCard', card: 'c1' } as unknown as Action;
    const b = { card: 'c1', type: 'playCard' } as unknown as Action;
    const c = { type: 'playCard', card: 'c2' } as unknown as Action;
    expect(actionKey(a)).toBe(actionKey(b));
    expect(actionKey(a)).not.toBe(actionKey(c));
  });
});
