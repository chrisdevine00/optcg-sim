/**
 * The review pool and the L-slice contract on top of it (M8 WP1). Workers are in-process stand-ins
 * running the real `ReviewJob`, so the pool's dealing, progress sums, cancel and `deeper` are tested
 * without a browser; the real worker is exercised by the e2e (app/e2e/learning.spec.ts).
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { chooseAction, ReviewJob, type ReviewRequest, type ReviewResponse } from '@optcg/ai';
import type { PlayerView, SearchView } from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { reviewInline, startReview, startReviewStream } from '../src/play/review/analyse.ts';
import { poolSize, type WorkerLike } from '../src/play/review/pool.ts';
import { cardMap } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class RookiePort implements AiPort {
  private n = 1;
  planTurn() {
    return { id: this.n++, result: Promise.resolve() };
  }
  decide(view: PlayerView | SearchView, _t: string, seed: number) {
    const d = chooseAction(view, { tier: 'rookie', seed, cards: cardMap() });
    return { id: this.n++, result: Promise.resolve({ ...d, alternatives: [], ms: 0 }) };
  }
  reveal(_c: Iterable<Card>) {}
  cancel() {}
  reset() {}
  terminate() {}
}
const config = {
  mode: 'ai' as const,
  human: 'p1' as const,
  names: { p1: 'You', p2: 'Rocks' },
  tier: 'rookie' as const,
  autoSkip: true,
  alwaysSkip: false,
  speed: 4 as const,
  aiCardIds: ['OP17-039'],
  aiDeck: [] as string[],
  aiPort: () => new RookiePort(),
};

/** The planted lethalDemo game: the player concedes in their Main Phase with the win in hand. */
async function missed() {
  const { mode: _m, ...spec } = SCENARIOS.lethalDemo!;
  const ctl = new GameController(cardMap(), { scenario: spec }, config);
  ctl.start();
  await sleep(60);
  expect(ctl.act({ type: 'concede', player: 'p1' })).toBe(true);
  await sleep(60);
  return ctl;
}

/** A worker that runs the real job in this thread; its messages arrive on a later macrotask. */
function inProcess(log: { workers: Fake[] } = { workers: [] }): () => WorkerLike {
  return () => {
    const w = new Fake();
    log.workers.push(w);
    return w;
  };
}
class Fake implements WorkerLike {
  onmessage: WorkerLike['onmessage'] = null;
  onerror: WorkerLike['onerror'] = null;
  terminated = false;
  received: ReviewRequest[] = [];
  private readonly job = new ReviewJob((m) => this.send(m), {
    yieldFn: async () => void (await sleep(0)),
  });
  private send(m: ReviewResponse) {
    setTimeout(() => {
      if (!this.terminated) this.onmessage?.({ data: m });
    }, 0);
  }
  postMessage(m: ReviewRequest) {
    this.received.push(m);
    if (m.type === 'start') void this.job.start(m);
    else this.job.handle(m);
  }
  terminate() {
    this.terminated = true;
  }
  fail(message: string) {
    this.onerror?.({ message });
  }
}

describe('the pool', () => {
  it('is min(3, cores - 1) workers, at least one', () => {
    expect([8, 4, 3, 2, 1].map((n) => poolSize(n))).toEqual([3, 3, 2, 1, 1]);
    expect(poolSize(0)).toBe(1);
  });

  it('deals one plan to every worker as shards, and sums their progress', async () => {
    const ctl = await missed();
    const log = { workers: [] as Fake[] };
    const progress: { done: number; total: number }[] = [];
    const items: string[] = [];
    await new Promise<void>((resolve, reject) => {
      startReviewStream(
        {
          record: ctl.session.exportRecord(),
          cards: [...ctl.cards.values()],
          seats: ['p1'],
          nodes: 3000,
        },
        {
          onItems: (rs) => items.push(...rs.map((r) => r.itemId)),
          onProgress: (p) => progress.push(p),
          onDone: () => resolve(),
          onError: (m) => reject(new Error(m)),
        },
        inProcess(log),
        3,
      );
    });
    const shards = log.workers.map((w) => (w.received[0] as { shard: unknown }).shard);
    expect(shards).toEqual([
      { index: 0, count: 3 },
      { index: 1, count: 3 },
      { index: 2, count: 3 },
    ]);
    expect(progress.at(-1)!.done).toBe(progress.at(-1)!.total);
    expect(progress.at(-1)!.total).toBeGreaterThan(0);
    expect(new Set(items).size).toBe(items.length);
    expect(items).toContain('missed-lethal:9:0');
    ctl.dispose();
  });

  it("one worker or three, the flags are the same, and they are the in-thread review's", async () => {
    const ctl = await missed();
    const input = {
      record: ctl.session.exportRecord(),
      cards: [...ctl.cards.values()],
      seats: ['p1' as const],
      nodes: 3000,
    };
    const direct = reviewInline(input);
    expect(direct).toHaveLength(1);
    for (const size of [1, 3]) {
      const flags = await startReview(input, inProcess(), size).promise;
      expect(flags.map((f) => [f.kind, f.turn, f.actionIndex, f.severity, f.explanation])).toEqual(
        direct.map((f) => [f.kind, f.turn, f.actionIndex, f.severity, f.explanation]),
      );
      expect(flags[0]!.public.status).toBe('proven');
    }
    ctl.dispose();
  });

  it('a capped turn comes back as the L-slice "not fully checked" flag', async () => {
    const ctl = await missed();
    const flags = await startReview(
      {
        record: ctl.session.exportRecord(),
        cards: [...ctl.cards.values()],
        seats: ['p1'],
        nodes: 3,
      },
      inProcess(),
      2,
    ).promise;
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      kind: 'not-fully-checked',
      severity: 'marker',
      turn: 9,
      player: 'p1',
      actionIndex: 0,
    });
    ctl.dispose();
  });

  it('cancel ends every worker and nothing more is reported', async () => {
    const ctl = await missed();
    const log = { workers: [] as Fake[] };
    let after = 0;
    let cancelled = false;
    const run = startReviewStream(
      {
        record: ctl.session.exportRecord(),
        cards: [...ctl.cards.values()],
        seats: ['p1'],
        nodes: 3000,
      },
      {
        onItems: () => cancelled && after++,
        onProgress: () => cancelled && after++,
        onDone: () => cancelled && after++,
      },
      inProcess(log),
      3,
    );
    run.cancel();
    cancelled = true;
    await sleep(100);
    expect(log.workers.every((w) => w.terminated)).toBe(true);
    expect(log.workers.every((w) => w.received.some((m) => m.type === 'cancel'))).toBe(true);
    expect(after).toBe(0);
    ctl.dispose();
  });

  it('a worker that fails is one error, and the others are ended', async () => {
    const ctl = await missed();
    const log = { workers: [] as Fake[] };
    const errors: string[] = [];
    startReviewStream(
      {
        record: ctl.session.exportRecord(),
        cards: [...ctl.cards.values()],
        seats: ['p1'],
        nodes: 3000,
      },
      { onError: (m) => errors.push(m) },
      inProcess(log),
      3,
    );
    log.workers[1]!.fail('boom');
    log.workers[2]!.fail('boom again');
    await sleep(50);
    expect(errors).toEqual(['boom']);
    expect(log.workers.every((w) => w.terminated)).toBe(true);
    ctl.dispose();
  });

  it('deeper re-runs the marked turn on the worker that owns it, and done fires again', async () => {
    const ctl = await missed();
    const flagsSeen: string[][] = [];
    let dones = 0;
    const run = startReviewStream(
      {
        record: ctl.session.exportRecord(),
        cards: [...ctl.cards.values()],
        seats: ['p1'],
        nodes: 3,
      },
      {
        onItems: (rs) => flagsSeen.push(rs.flatMap((r) => r.flags.map((f) => f.id))),
        onDone: () => dones++,
      },
      inProcess(),
      3,
    );
    for (let i = 0; i < 100 && dones === 0; i++) await sleep(10);
    expect(dones).toBe(1);
    expect(flagsSeen.flat()).toEqual([]);
    run.deeper(['missed-lethal:9:0'], 50_000);
    for (let i = 0; i < 300 && dones < 2; i++) await sleep(10);
    expect(dones).toBe(2);
    expect(flagsSeen.flat()).toEqual(['missed-lethal:9:0']);
    run.cancel();
    ctl.dispose();
  });
});
