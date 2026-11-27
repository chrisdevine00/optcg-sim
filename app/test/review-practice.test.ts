/**
 * Practice for the remaining flag kinds (M9 WP7), end to end over planted games:
 *
 * - a DON!! flag and a target flag restored in place from the record, judged by the controller
 *   (`don-ledger` solved by a line that spends down to `unusedMin`, failed by End turn at once;
 *   `target-best` solved by the better target, failed by the chosen one, the bar being an ENGINE
 *   instance id);
 * - the review worker's `puzzle` message behind the drill intake (`flagBank`): a finished, reviewed
 *   game yields "From your game, turn N" items, whose judge bar is in the item's own ids, and the
 *   item board judges them the same way;
 * - a stored review without `practice` falls back by kind; a target flag says to analyse again.
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { chooseAction, type ReviewFlag, type ReviewRecord } from '@optcg/ai';
import { ReviewJob } from '@optcg/ai/review';
import type { Action, PlayerView, RecordWithSnapshots, SearchView } from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import { flagBank, type IntakeStore } from '../src/drills/intake.ts';
import { materialise } from '../src/drills/materialise.ts';
import * as drillAi from '../src/drills/ai.ts';
import { prefixOf } from '../src/play/review/analyse.ts';
import { practiceOf, REANALYSE_COPY } from '../src/play/review/model.ts';
import { cardIdsOf, restoreConfig } from '../src/play/review/restore.ts';
import type { SessionRecord } from '../src/session/index.ts';
import { detect as detectTarget } from '../../ai/src/search/review/target.ts';
import { contextOf, itemAt } from '../../ai/test/support/review-plant.ts';
import { e08Record } from '../../ai/test/support/review-target-positions.ts';
import { e06Record } from '../../ai/test/review/wp2-positions.ts';
import { contextOf as ctxOf, indexOf, run } from '../../ai/test/review/wp2-support.ts';
import { cardMap } from './support.ts';

/** A planted record as a review reads it: who sat where, no auto actions, no rewinds. */
const review = (r: RecordWithSnapshots): ReviewRecord & RecordWithSnapshots =>
  ({ seats: { p1: 'human', p2: 'ai' }, auto: [], rewinds: [], ...r }) as unknown as ReviewRecord &
    RecordWithSnapshots;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cards = cardMap();

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

/** The record's own position, restored in place the way ReviewFlow's `board` does. */
function inPlace(record: ReviewRecord, flag: ReviewFlag, expect?: ReviewFlag['practice']) {
  const session = record as unknown as SessionRecord;
  const prefix = prefixOf(session, flag.restoreIndex);
  const p = expect ?? flag.practice!;
  const ctl = new GameController(cardMap(), prefix.start, {
    ...restoreConfig(session, { me: 'p1', tier: 'rookie' }, cardMap()),
    speed: 4 as const,
    aiPort: () => new RookiePort(),
    restore: {
      record: prefix,
      puzzle: { turn: p.turn, judge: p.judge, ...(p.expect ? { expect: p.expect } : {}) },
    },
  });
  ctl.start();
  return ctl;
}

/** The card the view shows under a handle (actions of a controller hold view handles). */
function viewCard(ctl: GameController, handle: string) {
  const z = ctl.view().zones;
  for (const p of ['p1', 'p2'] as const)
    for (const name of ['leader', 'characters', 'hand'] as const) {
      const c = z[p][name].find((x) => x.handle === handle);
      if (c) return { ...c, zone: name };
    }
  return undefined;
}

/** The first own-Leader attack on their Leader (`leader`) or on one of their Characters. */
function pickAttack(ctl: GameController, leader: boolean): Action {
  const atks = ctl.actions().filter((a) => a.type === 'attack') as Extract<
    Action,
    { type: 'attack' }
  >[];
  const want = atks.find(
    (a) =>
      viewCard(ctl, a.attacker)?.zone === 'leader' &&
      (viewCard(ctl, a.target)?.zone === 'leader') === leader,
  );
  if (!want) throw new Error('no such attack');
  return want;
}

/** Wait until the player owes a decision (the board paces its own animations). */
async function settle(ctl: GameController): Promise<void> {
  for (let i = 0; i < 60 && !ctl.myDecision(); i++) await sleep(10);
}

const find = (ctl: GameController, pred: (a: Action) => boolean): Action => {
  const a = ctl.actions().find(pred);
  if (!a)
    throw new Error(
      'no such action ' +
        ctl
          .actions()
          .map((x) => x.type)
          .join(','),
    );
  return a;
};

describe('target-best: the bar is an engine instance id', () => {
  const rec = e08Record();
  const flag = detectTarget(itemAt('target', 7, 0), contextOf(rec))!.flags[0]!;

  const attackOn = (ctl: GameController, leader: boolean): Action => pickAttack(ctl, leader);

  it('is solved by the better target (the Newgate the review names)', async () => {
    const ctl = inPlace(rec, flag);
    await sleep(30);
    expect(ctl.puzzleState()).toBe('open');
    expect(ctl.act(attackOn(ctl, false))).toBe(true);
    expect(ctl.puzzleState()).toBe('solved');
    ctl.dispose();
  });

  it('is failed by the target the player chose (their Leader)', async () => {
    const ctl = inPlace(rec, flag);
    await sleep(30);
    expect(ctl.act(attackOn(ctl, true))).toBe(true);
    expect(ctl.puzzleState()).toBe('failed');
    ctl.dispose();
  });

  it('a view handle in `expect.target` could never be matched (why the id is stored)', async () => {
    const ctl = inPlace(rec, flag, {
      judge: 'target-best',
      turn: 7,
      expect: { target: ctl0Handle() },
    });
    await sleep(30);
    expect(ctl.act(attackOn(ctl, false))).toBe(true);
    expect(ctl.puzzleState()).toBe('failed');
    ctl.dispose();
  });

  function ctl0Handle(): string {
    const c = inPlace(rec, flag);
    const h = c.view().zones.p2.characters[0]!.handle;
    c.dispose();
    return h;
  }
});

describe('don-ledger: solved by spending down to unusedMin', () => {
  const rec = review(e06Record());
  const ctx = ctxOf(rec);
  const flag = run(
    'don-unused',
    ctx,
    indexOf(rec, (a) => a.type === 'endTurn'),
  )!.flags[0]!;

  it('the flag is restored at the first Main, and a line that spends the DON!! solves it', async () => {
    expect(practiceOf(flag, true, 'stale')).toMatchObject({ ok: true, judge: 'don-ledger' });
    const ctl = inPlace(rec, flag);
    await sleep(30);
    expect(ctl.puzzleState()).toBe('open');
    // Charlotte Linlin (5) and 3 DON!! on the Leader: the 8 DON!! are all spent.
    const lin = find(
      ctl,
      (a) => a.type === 'playCard' && viewCard(ctl, a.card)?.card === 'OP17-049',
    );
    expect(ctl.act(lin)).toBe(true);
    for (let i = 0; i < 3; i++) {
      await settle(ctl);
      expect(ctl.act(find(ctl, (a) => a.type === 'giveDon'))).toBe(true);
    }
    await settle(ctl);
    expect(ctl.act(find(ctl, (a) => a.type === 'endTurn'))).toBe(true);
    for (let i = 0; i < 40 && ctl.puzzleState() === 'open'; i++) await sleep(10);
    expect(ctl.puzzleState()).toBe('solved');
    ctl.dispose();
  });

  it('is failed by End turn at once', async () => {
    const ctl = inPlace(rec, flag);
    await sleep(30);
    expect(ctl.act(find(ctl, (a) => a.type === 'endTurn'))).toBe(true);
    for (let i = 0; i < 40 && ctl.puzzleState() === 'open'; i++) await sleep(10);
    expect(ctl.puzzleState()).toBe('failed');
    ctl.dispose();
  });
});

describe('a stored review without `practice`', () => {
  it('falls back by kind: DON!! and mulligan practise, target says to analyse again', () => {
    const bare = (kind: ReviewFlag['kind']) => ({ kind, turn: 4 }) as ReviewFlag;
    expect(practiceOf(bare('mulligan'), true, 's')).toMatchObject({ ok: true, judge: 'mulligan' });
    expect(practiceOf(bare('don-unused'), true, 's')).toMatchObject({ judge: 'don-ledger' });
    expect(practiceOf(bare('target'), true, 's')).toEqual({ ok: false, reason: REANALYSE_COPY });
  });
});

describe('the worker’s `puzzle` message behind the drill intake', () => {
  // A reviewed game's flags, as the stored review holds them.
  const target = e08Record();
  const targetFlag = detectTarget(itemAt('target', 7, 0), contextOf(target))!.flags[0]!;
  const don = review(e06Record());
  const donFlag = run(
    'don-unused',
    ctxOf(don),
    indexOf(don, (a) => a.type === 'endTurn'),
  )!.flags[0]!;

  const games: Record<string, { record: ReviewRecord; flags: ReviewFlag[] }> = {
    g8: { record: target, flags: [targetFlag] },
    g6: { record: don, flags: [donFlag] },
  };
  const kv = new Map<string, unknown>();
  const store: IntakeStore = {
    listGames: async () => Object.keys(games).map((id) => ({ id, meta: {} as never })),
    getGame: async (id) => ({ id, record: games[id]!.record as never, meta: {} as never }),
    getReview: async (id) => ({
      gameId: id,
      analysisVersion: 1,
      engineVersion: 'x',
      status: 'complete',
      results: { r: { itemId: 'r', turn: 1, flags: games[id]!.flags, notes: [] } },
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
  const asked: string[] = [];
  const request = (record: ReviewRecord, flag: ReviewFlag, cs: Card[], gameId?: string) =>
    new Promise<{ item: never; reason?: string }>((resolve) => {
      asked.push(flag.id);
      new ReviewJob((m) => {
        if (m.type === 'puzzle')
          resolve({ item: m.item as never, ...(m.reason ? { reason: m.reason } : {}) });
      }).handle({ type: 'puzzle', flagId: flag.id, record, cards: cs, flag, gameId: gameId ?? '' });
    });

  it('a finished, reviewed game yields "From your game, turn N" items, once, cached', async () => {
    const out = await flagBank(store, {
      loadCards: async (ids) => new Map(ids.map((id) => [id, cards.get(id)!] as const)),
      cardIdsOf: (r) => cardIdsOf(r as unknown as SessionRecord),
      request: request as never,
      mulliganItem: () => null,
    });
    expect(out.items.map((e) => e.item.source)).toEqual(
      expect.arrayContaining([
        { kind: 'flag', gameId: 'g8', flagId: targetFlag.id, turn: 7 },
        { kind: 'flag', gameId: 'g6', flagId: donFlag.id, turn: 8 },
      ]),
    );
    expect(out.items).toHaveLength(2);
    const t = out.items.find(
      (e) => e.item.source.kind === 'flag' && e.item.source.gameId === 'g8',
    )!;
    const d = out.items.find(
      (e) => e.item.source.kind === 'flag' && e.item.source.gameId === 'g6',
    )!;
    // WP2's mapping: a target flag is a lethal-drill board judged by target-best; DON!! is the don drill.
    expect([t.item.drill, t.judge]).toEqual(['lethal', 'target-best']);
    expect([d.item.drill, d.judge]).toEqual(['don', 'don-ledger']);
    expect(d.expect).toEqual({ unusedMin: donFlag.practice!.expect!.unusedMin });
    // A second session needs no worker.
    const n = asked.length;
    await flagBank(store, {
      loadCards: async () => new Map(),
      cardIdsOf: () => [],
      request: request as never,
      mulliganItem: () => null,
    });
    expect(asked).toHaveLength(n);
  });

  it('the item board judges a target in the item’s own ids: the better target solves, the other fails', async () => {
    kv.clear();
    const out = await flagBank(store, {
      loadCards: async (ids) => new Map(ids.map((id) => [id, cards.get(id)!] as const)),
      cardIdsOf: (r) => cardIdsOf(r as unknown as SessionRecord),
      request: request as never,
      mulliganItem: () => null,
    });
    const entry = out.items.find((e) => e.judge === 'target-best')!;
    // The bar was rewritten into the rebuilt scenario's ids; the record's id is not the item's.
    expect(entry.expect!.target).toBeTruthy();
    for (const better of [true, false]) {
      const m = materialise(drillAi, entry, cards, { aiPort: () => new RookiePort() });
      m.ctl.start();
      await sleep(30);
      const pick = pickAttack(m.ctl, !better);
      expect(m.ctl.act(pick)).toBe(true);
      expect(m.ctl.puzzleState()).toBe(better ? 'solved' : 'failed');
      m.ctl.dispose();
    }
  });
});
