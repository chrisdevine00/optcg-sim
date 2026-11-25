/** M8 WP0: the in-memory store round-trips, and the PlayRoute save seam fires once per finished vs-AI game. */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { chooseAction } from '@optcg/ai';
import type { PlayerView, SearchView } from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import { GameSaver } from '../src/play/save-game.ts';
import { sourceOf } from '../src/play/PlayRoute.tsx';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { MemoryStore, StoreQuotaError, type StoredGame } from '../src/store/index.ts';
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

function ctlFor(mode: 'ai' | 'hotseat') {
  const { mode: _m, ...spec } = SCENARIOS.lethalDemo!;
  return new GameController(cardMap(), { scenario: spec }, { ...config, mode });
}

function stored(id: string, endedAt: number, ctl: GameController): StoredGame {
  const record = ctl.session.exportRecord();
  return {
    id,
    record,
    meta: {
      result: 'lost',
      me: 'p1',
      myLeader: 'A',
      opponentLeader: 'B',
      tier: 'rookie',
      deckName: 'D',
      turns: 9,
      endedAt,
      tags: [],
      versions: record.versions,
    },
  };
}

describe('MemoryStore', () => {
  it('round-trips games, reviews, the resume slot and key-value stores', async () => {
    const ctl = ctlFor('ai');
    const s = new MemoryStore();
    await s.saveGame(stored('a', 1, ctl));
    await s.saveGame(stored('b', 2, ctl));
    expect((await s.listGames()).map((g) => g.id)).toEqual(['b', 'a']);
    expect((await s.getGame('a'))?.record.actions).toEqual(ctl.session.exportRecord().actions);
    const review = {
      gameId: 'a',
      analysisVersion: 1,
      engineVersion: '0',
      status: 'complete' as const,
      results: {},
      markers: [],
      practised: { 'missed-lethal:9:0': 'solved' as const },
    };
    await s.saveReview(review);
    expect(await s.getReview('a')).toEqual(review);
    await s.timing.set('run1', { x: 1 });
    await s.progress.set('lethal', [1, 2]);
    await s.setCurrent({
      record: ctl.session.exportRecord(),
      savedAt: 3,
      myLeader: 'A',
      opponentLeader: 'B',
      turn: 9,
    });
    expect((await s.getCurrent())?.turn).toBe(9);

    const bundle = await s.exportAll('test');
    expect(bundle).toMatchObject({ schema: 'optcg-sim/export/1', build: 'test' });
    const t = new MemoryStore();
    expect(await t.importAll(bundle, 'replace')).toMatchObject({ added: 2 });
    expect((await t.listGames()).map((g) => g.id)).toEqual(['b', 'a']);
    expect(await t.getReview('a')).toEqual(review);
    expect(await t.timing.get('run1')).toEqual({ x: 1 });
    expect(await t.importAll(bundle, 'keep-both')).toMatchObject({ keptBoth: 2 });
    expect(await t.listGames()).toHaveLength(4);

    await t.deleteGame('a');
    expect(await t.getReview('a')).toBeUndefined();
    await t.deleteAll();
    expect(await t.listGames()).toEqual([]);
    ctl.dispose();
  });

  it('refuses a save past its limit with a StoreQuotaError and deletes nothing', async () => {
    const ctl = ctlFor('ai');
    const s = new MemoryStore(1);
    await s.saveGame(stored('a', 1, ctl));
    await expect(s.saveGame(stored('b', 2, ctl))).rejects.toBeInstanceOf(StoreQuotaError);
    expect((await s.listGames()).map((g) => g.id)).toEqual(['a']);
    ctl.dispose();
  });
});

describe('the save seam', () => {
  const run = async (mode: 'ai' | 'hotseat', finish: boolean) => {
    const store = new MemoryStore();
    const saver = new GameSaver(
      () => store,
      () => 1000,
    );
    const ctl = ctlFor(mode);
    ctl.start();
    await sleep(60);
    await saver.observe(ctl, sourceOf(ctl));
    if (finish) {
      const r = ctl.session.apply('p1', { type: 'concede', player: 'p1' });
      expect(r.ok).toBe(true);
      await sleep(60);
      expect(ctl.view().result).toMatchObject({ winner: 'p2' });
    }
    const first = await saver.observe(ctl, sourceOf(ctl, 'My deck'));
    const again = await saver.observe(ctl, sourceOf(ctl));
    const games = await store.listGames();
    ctl.dispose();
    return { first, again, games, store };
  };

  it('saves a finished game against the AI exactly once', async () => {
    const { first, again, games, store } = await run('ai', true);
    expect(first).not.toBeNull();
    expect(again).toBeNull();
    expect(games).toHaveLength(1);
    expect(games[0]!.meta).toMatchObject({
      result: 'lost',
      me: 'p1',
      tier: 'rookie',
      deckName: 'My deck',
      tags: [],
    });
    expect((await store.getGame(games[0]!.id))?.record.actions.length).toBeGreaterThan(0);
  });

  it('never saves an unfinished game', async () => {
    expect((await run('ai', false)).games).toEqual([]);
  });

  it('never saves a hotseat game, finished or not', async () => {
    expect((await run('hotseat', false)).games).toEqual([]);
    expect((await run('hotseat', true)).games).toEqual([]);
  });
});
