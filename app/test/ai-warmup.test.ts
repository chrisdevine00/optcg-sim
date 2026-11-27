/**
 * M10 WP3: the AI's worker is warmed while Setup is open and the game takes it (docs/runbooks/
 * testing.md: a requirement stated in milliseconds, the Warlord's wait, is tested here as a
 * mechanism, with a fake port and fake timers; the milliseconds are `perf-frames.spec.ts` scenario e
 * and the nightly).
 *
 * What is proved: Setup's warm-up posts `init`, then one plan of one iteration, then `reset`, and
 * never a `decide`; the game started with the same decks reuses that worker (one worker, no second
 * `init`) and one for other decks rebuilds (the warm one is terminated); an unused warm worker ends
 * after 20 s on the fake timer; Rookie, hotseat, scenario links and an invalid deck warm nothing; the
 * coach's client never takes it; and the player's own main deck never reaches the worker
 * (differential: the posted messages are the same for two different player decks).
 *
 * Reverts, each failing its test: delete the `useAiWarmUp` call in Setup.tsx (the Playwright half,
 * app/e2e/ai-warmup.spec.ts, fails: no worker before Start); drop `adoptWarm: true` in the
 * controller (the reuse test fails in the e2e: two workers) or `aiWarm.take` (the reuse test here);
 * remove the idle timer in `release` (the 20 s test); add the player's main deck to `cards` in
 * `warmSpecFor` (the differential).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '@optcg/cards';
import type { AiRequest, GameInfo } from '@optcg/ai';
import {
  AiClient,
  aiWarm,
  setAiWorkerFactory,
  WARM_IDLE_MS,
  type WorkerPort,
} from '../src/play/game/ai-client.ts';
import { warmPosition } from '../src/play/game/warm-position.ts';
import { warmSpecFor, type WarmInputs } from '../src/play/setup/useAiWarmUp.ts';
import { priorCardIds } from '@optcg/ai';
import { DECKS, deckById } from '../src/play/setup/decks.ts';
import { cardMap } from './support.ts';

class FakePort implements WorkerPort {
  readonly sent: AiRequest[] = [];
  terminated = false;
  onmessage: WorkerPort['onmessage'] = null;
  onerror: WorkerPort['onerror'] = null;
  postMessage(m: AiRequest): void {
    this.sent.push(m);
  }
  terminate(): void {
    this.terminated = true;
  }
  types(): string[] {
    return this.sent.map((m) => m.type);
  }
}

let ports: FakePort[] = [];
beforeEach(() => {
  ports = [];
  vi.useFakeTimers();
  setAiWorkerFactory(() => {
    const p = new FakePort();
    ports.push(p);
    return p;
  });
});
afterEach(() => {
  aiWarm.cancel();
  setAiWorkerFactory(null);
  vi.useRealTimers();
});

const all = cardMap();
const warlordDeck = DECKS.find((d) => d.leader === 'OP17-058')!;
const rocks = DECKS.find((d) => d.leader === 'OP17-039')!;

const inputs = (o: Partial<WarmInputs> = {}): WarmInputs => ({
  opponent: 'warlord',
  myDeck: rocks.id,
  theirDeck: warlordDeck.id,
  cards: all,
  ready: true,
  off: false,
  ...o,
});
/** What Setup warms for these inputs (the card loader is the test's own table). */
const spec = async (o: Partial<WarmInputs> = {}) =>
  (await warmSpecFor(
    inputs(o),
    async (ids) => new Map(ids.flatMap((id) => (all.has(id) ? [[id, all.get(id)!]] : []))),
  ))!;

describe('Setup warms the AI worker before Start', () => {
  it('posts init, then one plan of one iteration, then reset; no decide', async () => {
    aiWarm.warm(await spec());
    expect(ports).toHaveLength(1);
    expect(ports[0]!.types()).toEqual(['init', 'planTurn', 'reset']);
    const plan = ports[0]!.sent[1] as Extract<AiRequest, { type: 'planTurn' }>;
    expect(plan.budget).toEqual({ iterations: 1 });
    expect(plan.view.decision?.kind).toBe('main');
    expect(plan.view.player).toBe('p2');
  });

  it('the same game again keeps the one worker (Setup re-renders)', async () => {
    aiWarm.warm(await spec());
    aiWarm.warm(await spec());
    expect(ports).toHaveLength(1);
    expect(ports[0]!.terminated).toBe(false);
  });

  it('Rookie, hotseat, a scenario or autostart link, an unready deck: nothing is warmed', async () => {
    for (const o of [
      { opponent: 'rookie' as const },
      { opponent: 'hotseat' as const },
      { off: true },
      { ready: false },
    ])
      expect(await warmSpecFor(inputs(o))).toBeNull();
    // And a Rookie spec handed straight to the warm-up (the client's own guard) posts nothing.
    const s = await spec();
    aiWarm.warm({ ...s, game: { ...s.game, tier: 'rookie' } });
    expect(ports).toHaveLength(0);
  });

  it('switching to Rookie ends the warm worker', async () => {
    aiWarm.warm(await spec());
    const s = await spec();
    aiWarm.warm({ ...s, game: { ...s.game, tier: 'rookie' } });
    expect(ports[0]!.terminated).toBe(true);
    expect(aiWarm.active).toBe(false);
  });
});

describe('the game takes the warm worker', () => {
  const clientFor = async (o: Partial<WarmInputs> = {}) => {
    const s = await spec(o);
    return { s, ai: new AiClient(s.cards, s.game, { adoptWarm: true }) };
  };

  it('unchanged decks and tier: one worker, no second init, nothing re-posted', async () => {
    const s = await spec();
    aiWarm.warm(s);
    const before = ports[0]!.sent.length;
    const ai = new AiClient(s.cards, s.game, { adoptWarm: true });
    expect(ports).toHaveLength(1);
    expect(ports[0]!.sent).toHaveLength(before);
    expect(ports[0]!.types().filter((t) => t === 'init')).toHaveLength(1);
    // The client works through the adopted worker.
    ai.reset();
    expect(ports[0]!.types().at(-1)).toBe('reset');
    ai.terminate();
    expect(ports[0]!.terminated).toBe(true);
  });

  it('changed decks rebuild: the warm worker is terminated and a fresh one starts', async () => {
    aiWarm.warm(await spec());
    const other = DECKS.find((d) => d.leader !== warlordDeck.leader && d.leader !== rocks.leader)!;
    await clientFor({ theirDeck: other.id });
    expect(ports).toHaveLength(2);
    expect(ports[0]!.terminated).toBe(true);
    expect(ports[1]!.types()[0]).toBe('init');
  });

  it('a changed tier rebuilds too', async () => {
    aiWarm.warm(await spec());
    await clientFor({ opponent: 'emperor' });
    expect(ports).toHaveLength(2);
    expect(ports[0]!.terminated).toBe(true);
  });

  it('the coach’s client never takes the game’s worker', async () => {
    const s = await spec();
    aiWarm.warm(s);
    new AiClient(s.cards, s.game);
    expect(ports).toHaveLength(2);
    expect(ports[0]!.terminated).toBe(false);
    expect(aiWarm.active).toBe(true);
  });

  it('with nothing warm, the client spawns its own', async () => {
    await clientFor();
    expect(ports).toHaveLength(1);
    expect(ports[0]!.types()).toEqual(['init']);
  });
});

describe('an unused warm worker ends after 20 s (the injected timer)', () => {
  it('Setup unmounts without a game: terminated at 20,000 ms, not before', async () => {
    aiWarm.warm(await spec());
    aiWarm.release();
    vi.advanceTimersByTime(WARM_IDLE_MS - 1);
    expect(ports[0]!.terminated).toBe(false);
    vi.advanceTimersByTime(1);
    expect(ports[0]!.terminated).toBe(true);
    expect(aiWarm.active).toBe(false);
  });

  it('a game that starts first takes it, and the timer no longer ends it', async () => {
    const s = await spec();
    aiWarm.warm(s);
    aiWarm.release();
    vi.advanceTimersByTime(WARM_IDLE_MS - 1000);
    const ai = new AiClient(s.cards, s.game, { adoptWarm: true });
    vi.advanceTimersByTime(60_000);
    expect(ports).toHaveLength(1);
    expect(ports[0]!.terminated).toBe(false);
    ai.terminate();
  });

  it('Setup coming back (the same decks) cancels the pending end', async () => {
    aiWarm.warm(await spec());
    aiWarm.release();
    vi.advanceTimersByTime(WARM_IDLE_MS / 2);
    aiWarm.warm(await spec());
    vi.advanceTimersByTime(WARM_IDLE_MS * 2);
    expect(ports[0]!.terminated).toBe(false);
  });
});

describe('the player’s own deck never reaches the worker', () => {
  const prior = new Set(priorCardIds(rocks.spec.leader));
  const theirs = new Set([warlordDeck.spec.leader, ...warlordDeck.spec.main]);
  /** Cards that are in no public set the worker may hold: not the AI's list, not the prior. */
  const outside = [...all.keys()].filter(
    (id) => !theirs.has(id) && !prior.has(id) && id !== rocks.spec.leader,
  );
  const playerDeck = (offset: number) => ({
    spec: {
      leader: rocks.spec.leader,
      main: Array.from({ length: 50 }, (_, i) => outside[offset + Math.floor(i / 4)]!),
    },
  });
  const decks = (id: string) =>
    id === 'a' ? playerDeck(0) : id === 'b' ? playerDeck(20) : deckById(id);

  /** The messages a warm-up posts, as the worker would receive them (plan view included). */
  const posted = async (myDeck: string) => {
    const s = (await warmSpecFor(
      inputs({ myDeck }),
      async (ids) => new Map(ids.flatMap((id) => (all.has(id) ? [[id, all.get(id)!]] : []))),
      decks,
    ))!;
    aiWarm.warm(s);
    const out = JSON.stringify(ports.at(-1)!.sent);
    aiWarm.cancel();
    return out;
  };

  it('two player decks with the same Leader and disjoint main decks post identical messages', async () => {
    // The Leader is public (the worker gets the prior for it); the main deck is hidden in the game
    // and must not be inferable from anything posted before Start (the any-hand invariant).
    expect(playerDeck(0).spec.main).not.toEqual(playerDeck(20).spec.main);
    expect(await posted('a')).toBe(await posted('b'));
  });

  it('none of the player’s cards outside the public prior is in the init message', async () => {
    const s = (await warmSpecFor(
      inputs({ myDeck: 'a' }),
      async (ids) => new Map(ids.flatMap((id) => (all.has(id) ? [[id, all.get(id)!]] : []))),
      decks,
    ))!;
    const sent = new Set(s.cards.map((c) => c.id));
    expect([...new Set(playerDeck(0).spec.main)].filter((id) => sent.has(id))).toEqual([]);
  });

  it('the warm position is the AI’s deck against itself', () => {
    const view = warmPosition(all, warlordDeck.spec);
    expect(view).not.toBeNull();
    const leaders = [view!.zones.p1.leader[0]?.card, view!.zones.p2.leader[0]?.card];
    expect(leaders).toEqual([warlordDeck.spec.leader, warlordDeck.spec.leader]);
  });
});

describe('a Card map the worker needs is the game’s', () => {
  it('the warm init cards equal what the controller would send for the same game', async () => {
    const { aiInitCards } = await import('../src/play/game/controller.ts');
    const { priorCardIds } = await import('@optcg/ai');
    const s = await spec();
    const ids = [warlordDeck.spec.leader, ...warlordDeck.spec.main];
    const expected: Card[] = aiInitCards(
      new Map(
        [...all].filter(
          ([id]) =>
            ids.includes(id) ||
            priorCardIds(rocks.spec.leader).includes(id) ||
            id === rocks.spec.leader,
        ),
      ),
      ids,
      rocks.spec.leader,
    );
    expect(s.cards.map((c) => c.id).sort()).toEqual(expected.map((c) => c.id).sort());
    const g: GameInfo = s.game;
    expect(g.ownDeck).toEqual(warlordDeck.spec.main);
    expect(g.opponentLeader).toBe(rocks.spec.leader);
    expect(g.tier).toBe('warlord');
  });
});
