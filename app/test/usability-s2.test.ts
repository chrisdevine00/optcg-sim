/**
 * The S2 usability scenarios (usability-plan.md §5.3, docs/design/usability/S2-kit.md) show what
 * their task cards say they show:
 * - `ub-hint-1`: the hint returns a non-empty line that replays through the engine, starts by
 *   playing Yamato, and gives its reasons as numbers on the board;
 * - `ub-why-1`: after the AI's first move (Yamato) "Why?" has an explanation that cites its guide;
 *   the game then waits for your Main Phase;
 * - `ub-blunder-1`: the lethal is proven against any hand, and with the blunder warning on, End turn
 *   is held with `missed-lethal` while playing Yamato (which keeps the lethal) is not.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Card } from '@optcg/cards';
import {
  AiSession,
  lethal,
  NOT_IMPLEMENTED,
  scoreDecision,
  warningsOf,
  type GameInfo,
  type ScoreTable,
} from '@optcg/ai';
import {
  actionFromView,
  createFromScenario,
  projectForSearch,
  reduce,
  type Action,
  type GameState,
  type PlayerView,
  type ScenarioSpec,
  type SearchView,
} from '@optcg/engine';
import { hint } from '../../ai/src/search/hint-line.ts';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import type { CoachPort } from '../src/play/game/ai-client.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { USABILITY_SCENARIOS } from '../src/play/setup/usability-scenarios.ts';
import { cardMap, coachStubs, lookup, metaDecks } from './support.ts';

vi.setConfig({ testTimeout: 120_000 });

const S2 = ['ub-hint-1', 'ub-why-1', 'ub-blunder-1'] as const;
const KAIDO = 'OP17-058';
const ROCKS = 'OP17-039';
const YAMATO = 'OP17-074';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const listOf = (leader: string) => metaDecks().find((d) => d.leader === leader)!.main;

const spec = (name: string): Omit<ScenarioSpec, 'cards'> => {
  const { mode: _m, ...rest } = structuredClone(USABILITY_SCENARIOS[name]!);
  return rest;
};
const build = (name: string): GameState =>
  createFromScenario({ ...spec(name), cards: lookup }).state;
const strip = ({ intentId: _i, ...a }: Action) => JSON.stringify(a);

describe('S2 usability scenarios', () => {
  it('are registered (the loader finds them) and build', () => {
    for (const name of S2) {
      expect(SCENARIOS[name], name).toBeDefined();
      expect(() => build(name), name).not.toThrow();
    }
  });
});

describe('ub-hint-1: the hint returns a clear line', () => {
  const state = build('ub-hint-1');
  const view = projectForSearch(state, 'p1');
  const game = { ownDeck: listOf(KAIDO), leader: KAIDO, opponentLeader: ROCKS };
  const r = hint(view, { cards: cardMap(), budget: { iterations: 4000 }, game });

  it('is your Main Phase with Yamato and Basil Hawkins in hand', () => {
    expect(view.decision?.kind).toBe('main');
    expect(view.decision?.player).toBe('p1');
    expect(view.zones.p1.hand.map((c) => c.card).sort()).toEqual(['OP17-073', YAMATO]);
  });

  it('returns a non-empty line: play Yamato first, end the turn last', () => {
    expect(r.line.length).toBeGreaterThanOrEqual(3);
    expect(r.line[0]).toMatchObject({ kind: 'play', card: YAMATO });
    expect(r.line.at(-1)!.kind).toBe('endTurn');
    expect(r.explanation.claim.length).toBeGreaterThan(10);
    expect(r.explanation.claim).toContain('Yamato');
    expect(r.incomplete).toBe(false);
    expect(r.certainty).toBe('any-hand');
  });

  it('gives its reasons as numbers on the board, with no hedging and no hidden card named', () => {
    const text = [r.explanation.outcome, ...r.explanation.evidence.map((e) => e.text)].join(' ');
    expect(text).toMatch(/6000 . 5000 \+ 1000 = 2000/);
    expect(text).toMatch(/4 Life/);
    expect(text).not.toMatch(/likely|probably|perhaps/i);
    // Their hand holds Edward.Newgate; a hint never names a card from a hidden zone.
    expect(text).not.toContain('Edward');
  });

  it('replays: the first step is legal in the engine, each action in turn', () => {
    expect(r.viewActions.length).toBeGreaterThan(0);
    let s = state;
    const pending = [...r.viewActions];
    while (pending.length > 0) {
      const v = projectForSearch(s, 'p1');
      expect(v.decision?.player).toBe('p1');
      // A run of picks is an unordered set: take whichever the legal list offers.
      const window =
        pending[0]!.type === 'pick' ? pending.filter((a) => a.type === 'pick') : [pending[0]!];
      const k = window.findIndex((a) => v.actions.some((x) => strip(x) === strip(a)));
      expect(k, `none of ${JSON.stringify(window)} is legal`).toBeGreaterThanOrEqual(0);
      const a = window[k]!;
      pending.splice(pending.indexOf(a), 1);
      s = reduce(s, actionFromView(s, 'p1', a)).state;
    }
    expect(s).not.toBe(state);
  });

  it('is the same answer when asked again (one position, one answer)', () => {
    const again = hint(view, { cards: cardMap(), budget: { iterations: 4000 }, game });
    expect(again.line.map((m) => m.text)).toEqual(r.line.map((m) => m.text));
  });

  it('with the app’s wall-clock budget still returns a line starting with Yamato', () => {
    const live = hint(view, { cards: cardMap(), budget: { ms: 2000 }, game });
    expect(live.line.length).toBeGreaterThan(0);
    expect(live.line[0]).toMatchObject({ kind: 'play', card: YAMATO });
  });
});

/** The Pirate AI run in process (the worker's code), so a game can be played without a worker. */
class InProcessAi implements AiPort {
  private readonly session: AiSession;
  private n = 1;
  constructor(cards: Card[], game: GameInfo) {
    this.session = new AiSession({
      tier: game.tier,
      ownDeck: game.ownDeck,
      cards: new Map(cards.map((c) => [c.id, c] as const)),
      leader: game.leader,
      opponentLeader: game.opponentLeader,
      budgets: 'iterations',
    });
  }
  planTurn(view: SearchView, seed: number) {
    this.session.planTurn(view, seed);
    return { id: this.n++, result: Promise.resolve() };
  }
  decide(view: PlayerView | SearchView, _tier: string, seed: number) {
    const d = this.session.decide(view, seed);
    return { id: this.n++, result: Promise.resolve({ ...d, ms: 0 }) };
  }
  reveal() {}
  cancel() {}
  reset() {}
  terminate() {}
}

describe('ub-why-1: "Why?" has an explanation after the AI’s move', () => {
  it('the AI plays Yamato first, Why cites its guide, and the game waits for your Main Phase', async () => {
    const deck = listOf(KAIDO);
    const ctl = new GameController(
      cardMap(),
      { scenario: spec('ub-why-1') },
      {
        mode: 'ai',
        human: 'p1',
        names: { p1: 'You', p2: 'Kaido' },
        tier: 'pirate',
        autoSkip: true,
        alwaysSkip: true,
        speed: 4,
        aiCardIds: [KAIDO, ...deck],
        aiDeck: deck,
        aiPort: (cards: Card[], game: GameInfo) => new InProcessAi(cards, game),
      },
    );
    ctl.start();
    for (let i = 0; i < 200; i++) {
      await sleep(20);
      const v = ctl.view();
      if (v.result || v.decision?.player === 'p1') break;
    }
    expect(ctl.view().decision?.player).toBe('p1');
    expect(ctl.view().decision?.kind).toBe('main');
    const moves = ctl
      .logLines()
      .filter(
        (l) => l.kind === 'move' && ctl.session.exportRecord().actions[l.index]?.player === 'p2',
      );
    expect(moves.length).toBeGreaterThanOrEqual(2);
    expect(moves.some((l) => /^End of turn/.test(l.text))).toBe(true);
    // The first line is the Yamato play, and it has a Why with the guide's reason.
    expect(moves[0]!.text).toMatch(/^Play Yamato/);
    const why = ctl.whyAt(moves[0]!.index)!;
    expect(why).not.toBeNull();
    expect(why.claim).toContain('Yamato');
    expect(why.evidence.map((e) => e.text).join(' ')).toMatch(
      /Its guide: a DON!!-adding Character/,
    );
    expect(why.outcome.length).toBeGreaterThan(0);
    // The Why button and `W` open the last AI move's explanation: it ended its turn with a card
    // in hand and 3 DON!! up, and says so.
    expect(ctl.lastWhy()).not.toBeNull();
    const last = ctl.whyAt(ctl.lastWhy()!)!;
    expect(last.claim).toBe('It ended its turn.');
    expect(last.evidence.map((e) => e.text).join(' ')).toMatch(
      /kept 3 DON!! active and 1 card in hand/,
    );
    // Every AI move with a choice carries one: nothing the participant asks about is empty.
    for (const l of moves) expect(ctl.whyAt(l.index)?.claim.length ?? 0, l.text).toBeGreaterThan(0);
    ctl.dispose();
  });
});

describe('ub-blunder-1: ending the turn misses a proven lethal', () => {
  const state = build('ub-blunder-1');
  const view = projectForSearch(state, 'p1');
  const cards = cardMap();
  const endTurn = view.actions.find((a) => a.type === 'endTurn')!;

  it('the lethal is proven against any hand', () => {
    const r = lethal({ mode: 'public', view }, cards, { nodes: 300_000 });
    expect(r.status).toBe('proven');
    expect(r.certainty).toBe('any-hand');
  });

  it('missed-lethal fires for endTurn, with the claim and a legal better move', () => {
    const t = scoreDecision(view, {
      cards,
      game: { ownDeck: listOf(KAIDO), leader: KAIDO, opponentLeader: ROCKS },
      budget: { iterations: 20 },
      lethalCap: { nodes: 150_000 },
    });
    const w = warningsOf(t, endTurn);
    expect(w[0]!.kind).toBe('missed-lethal');
    expect(w[0]!.explanation.claim).toBe('You have lethal this turn, and this move gives it up.');
    expect(w[0]!.explanation.certainty).toBe('any-hand');
    expect(w[0]!.better).not.toBeNull();
    expect(view.actions.some((a) => strip(a) === strip(w[0]!.better!))).toBe(true);
    // Playing Yamato keeps the lethal (one hit from Kaido), so it is not a blunder.
    const yamato = view.actions.find(
      (a) =>
        a.type === 'playCard' &&
        view.zones.p1.hand.find((c) => c.handle === a.card)?.card === YAMATO,
    )!;
    expect(warningsOf(t, yamato)).toEqual([]);
  });

  it('with Settings → Blunder warning on, the controller holds End turn and shows the note', async () => {
    const scored: SearchView[] = [];
    const stubs = coachStubs();
    const port: CoachPort = {
      hint: stubs.hint,
      threat: stubs.threat,
      score(v: SearchView) {
        scored.push(v);
        const table: ScoreTable | typeof NOT_IMPLEMENTED = scoreDecision(v, {
          cards,
          budget: { iterations: 20 },
          lethalCap: { nodes: 150_000 },
        });
        return { id: scored.length, result: Promise.resolve({ result: table, ms: 0 }) };
      },
      lethal: () => ({ id: 0, result: new Promise<never>(() => undefined) }),
      reveal() {},
      cancel() {},
      terminate() {},
    };
    const ctl = new GameController(
      cards,
      { scenario: spec('ub-blunder-1') },
      {
        mode: 'ai',
        human: 'p1',
        names: { p1: 'You', p2: 'Rocks' },
        tier: 'pirate',
        autoSkip: true,
        alwaysSkip: false,
        speed: 4,
        aiCardIds: [ROCKS],
        aiDeck: [],
        aiPort: () => ({
          planTurn: () => ({ id: 0, result: Promise.resolve() }),
          decide: () => ({ id: 0, result: new Promise(() => undefined) }),
          reveal() {},
          cancel() {},
          reset() {},
          terminate() {},
        }),
        coachPort: () => port,
      },
    );
    ctl.start();
    ctl.coach.setProfile({ blunder: true });
    await sleep(100);
    expect(scored.length).toBeGreaterThan(0);
    const before = ctl.session.actionCount;
    const end = ctl.session.view('p1').actions.find((a) => a.type === 'endTurn') as Action;
    expect(ctl.act(end)).toBe(false);
    expect(ctl.session.actionCount).toBe(before);
    expect(ctl.blunder.note?.warning.kind).toBe('missed-lethal');
    ctl.dispose();
  });
});
