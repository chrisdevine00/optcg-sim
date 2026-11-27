/**
 * board.md §5.2 AI turn pacing at 1×, on a controlled clock (docs/runbooks/testing.md).
 *
 * The Playwright specs app/e2e/pirate.spec.ts and warlord.spec.ts used to assert these bounds in
 * wall-clock milliseconds on a shared runner, and failed with "turn 6: waiting on the worker" when
 * the runner was slow. What §5.2 asks of the *board* is a function of the controller's own holds
 * (`wait`, `aiDwell`): a typical turn (at most 6 moves) fits 8 s of board pacing, a heavy one is
 * bounded because the dwell compresses once the turn has run 6 s. That is deterministic, so it is
 * measured here: the real `GameController` plays real AI turns (the Pirate and the Warlord, the
 * worker's code run in process on iteration budgets, so every machine chooses the same line) under
 * fake timers, and `aiTurns` reports virtual milliseconds. The worker answers at once in virtual
 * time, so `thinkMs` is 0; the worker's own speed is bounded by what it is asked to do, in
 * ai/test/budget.test.ts ("honours its budget": rollouts, not milliseconds), and its real
 * milliseconds are measured in the nightly (app/e2e/warlord.spec.ts with E2E_FULL=1).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '@optcg/cards';
import { AiSession, type GameInfo } from '@optcg/ai';
import type { Action, PlayerView, SearchView } from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { DECKS } from '../src/play/setup/decks.ts';
import { cardMap, metaDecks } from './support.ts';

/** The AI's own code, run in process; every answer arrives at once. */
class InProcessAi implements AiPort {
  private readonly session: AiSession;
  private readonly cards = new Map<string, Card>();
  private n = 1;
  readonly decisions: { rollouts: number }[] = [];
  constructor(
    cards: Card[],
    game: GameInfo,
    budgets: ConstructorParameters<typeof AiSession>[0]['budgets'],
    /** Virtual ms each decision takes to come back (a slow worker); 0 answers at once. */
    private readonly delay = 0,
  ) {
    for (const c of cards) this.cards.set(c.id, c);
    this.session = new AiSession({
      tier: game.tier,
      ownDeck: game.ownDeck,
      cards: this.cards,
      leader: game.leader,
      opponentLeader: game.opponentLeader,
      budgets,
    });
  }
  planTurn(view: SearchView, seed: number) {
    this.session.planTurn(view, seed);
    return { id: this.n++, result: Promise.resolve() };
  }
  decide(view: PlayerView | SearchView, _tier: string, seed: number) {
    const d = this.session.decide(view, seed);
    this.decisions.push({ rollouts: d.stats.rollouts });
    const answer = { ...d, ms: 0 };
    const result =
      this.delay > 0
        ? new Promise<typeof answer>((resolve) => setTimeout(() => resolve(answer), this.delay))
        : Promise.resolve(answer);
    return { id: this.n++, result };
  }
  /** Public card data for every card the AI can now identify (the worker's `reveal`). */
  reveal(cards: Iterable<Card>) {
    for (const c of cards) this.cards.set(c.id, c);
  }
  cancel() {}
  reset() {}
  terminate() {}
}

interface Turn {
  turn: number;
  ms: number;
  moves: number;
  thinkMs: number;
}

type Budgets = ConstructorParameters<typeof AiSession>[0]['budgets'];

/**
 * Plays plainly (keep the hand, end every turn at once, take every hit) until `turns` AI turns at
 * 1× are measured, advancing the fake clock in 50 ms steps. `game` is the late-game scenario (the
 * human ends turn 7 and the AI's turn 8 is the heavy one) or the app's default game from turn 1
 * (seed 31, the human first, as the e2e specs play it). Returns the controller's own measurements.
 */
async function measure(
  tier: 'pirate' | 'warlord',
  game: 'late' | 'early',
  turns: number,
  budgets: Budgets,
  /** Virtual ms each worker decision takes (M5a-20); 0 answers at once. */
  delay = 0,
): Promise<Turn[]> {
  const kaido = metaDecks().find((d) => d.leader === 'OP17-058')!;
  const mine = DECKS[0]!;
  const { mode: _m, ...late } = SCENARIOS.late!;
  const ctl = new GameController(
    cardMap(),
    game === 'late'
      ? { scenario: late }
      : { setup: { seed: 31, decks: { p1: mine.spec, p2: kaido }, chooser: 'p1' } },
    {
      mode: 'ai',
      human: 'p1',
      names: { p1: 'You', p2: 'Kaido' },
      tier,
      autoSkip: true,
      alwaysSkip: false,
      speed: 1,
      aiCardIds: [kaido.leader, ...kaido.main],
      aiDeck: kaido.main,
      myDeck: mine.spec.main,
      aiPort: (cards, info) => new InProcessAi(cards, info, budgets, delay),
    },
  );
  ctl.start();
  for (let i = 0; i < 6000 && ctl.aiTurns.length < turns; i++) {
    await vi.advanceTimersByTimeAsync(50);
    const v = ctl.view();
    if (v.result) break;
    if (v.decision?.player !== 'p1') continue;
    const a = ctl.actions();
    const plain =
      (v.decision.kind === 'main' ? a.find((x) => x.type === 'endTurn') : undefined) ??
      a.find((x) => x.type === 'chooseFirst' && x.goFirst) ??
      a.find((x) => x.type === 'mulligan' && !x.redraw) ??
      a.find((x) => x.type === 'block' && x.blocker === null) ??
      a.find((x) => x.type === 'endCounter') ??
      a.find((x) => x.type === 'trigger' && !x.activate) ??
      a.find((x) => x.type === 'optional' && !x.accept) ??
      a.find((x) => x.type !== 'concede');
    if (plain) ctl.act(plain as Action);
  }
  const out = ctl.aiTurns.filter((t) => t.speed === 1).map((t) => ({ ...t }));
  ctl.dispose();
  return out;
}

const TYPICAL_MOVES = 6;
/**
 * The heavy late turn (13 moves) plays in 9.16 s of virtual time with the dwell compressing past
 * 6 s; with every hold at 400 ms the same line takes 10.28 s. The bound sits between them, so it
 * fails if the compression stops working (the e2e's 10.6 s had to allow a second of real
 * rendering overhead and so could not tell the two apart; benchmarks.md, Pacing).
 */
const HEAVY_MS = 9700;
/** 8 s for a typical turn (the old e2e bound), `heavyMs` for a heavy one. */
function checkTurns(turns: Turn[], heavyMs: number) {
  for (const t of turns) {
    const limit = t.moves <= TYPICAL_MOVES ? 8000 : heavyMs;
    expect(
      t.ms - t.thinkMs,
      `turn ${t.turn}: animation and holds (${t.moves} moves)`,
    ).toBeLessThanOrEqual(limit);
    expect(t.ms, `turn ${t.turn}: the whole turn (${t.moves} moves)`).toBeLessThanOrEqual(limit);
  }
}

describe('AI turn pacing at 1× on a controlled clock (board.md §5.2, flows F21)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('the late-game turn (a heavy one) keeps within 9.7 s of board time because the dwell compresses', async () => {
    // The human ends turn 7 at once; the Pirate's turn 8 is the heavy turn of the late scenario.
    const turns = await measure('pirate', 'late', 1, 'iterations');
    expect(turns).toHaveLength(1);
    expect(turns[0]!.moves, 'the late turn is a heavy one').toBeGreaterThan(TYPICAL_MOVES);
    expect(turns[0]!.thinkMs, 'the worker answers at once on the virtual clock').toBe(0);
    checkTurns(turns, HEAVY_MS);
    // The board takes real time to play out: not a measurement of nothing.
    expect(turns[0]!.ms).toBeGreaterThan(4000);
  }, 240_000);

  it('the wait on the worker is thinking time, not board time, also where the controller peeks at the next move (M5a-20)', async () => {
    // A DON!! group peeks at the AI's next move before it decides how long to dwell, and that move
    // was requested while the DON!! travelled in: with a slow worker the peek waits. That wait used
    // to fall into board time (`ms - thinkMs`), so a slow worker made the same line look longer on
    // the board and compressed its dwell. Same game, same line, a worker 900 virtual ms slower:
    // the board's time is the same; the wait shows in `thinkMs`.
    const fast = await measure('pirate', 'late', 1, 'iterations', 0);
    const slow = await measure('pirate', 'late', 1, 'iterations', 900);
    expect(slow[0]!.moves, 'the same line').toBe(fast[0]!.moves);
    expect(slow[0]!.thinkMs, 'the slow worker was waited on').toBeGreaterThan(
      fast[0]!.thinkMs + 900,
    );
    const board = (t: Turn) => t.ms - t.thinkMs;
    expect(
      Math.abs(board(slow[0]!) - board(fast[0]!)),
      `board time ${board(slow[0]!)} ms with a slow worker, ${board(fast[0]!)} ms with a fast one`,
    ).toBeLessThanOrEqual(100);
    expect(board(slow[0]!)).toBeLessThanOrEqual(HEAVY_MS);
  }, 240_000);

  it('Warlord turns: a typical one fits 8 s, a heavy one is bounded', async () => {
    // The shipped Warlord iteration budgets cost minutes in process; the pacing is the board's
    // holds, which depend on the line (its moves), so a smaller Warlord search is enough here.
    const small = {
      turn: { iterations: 300 },
      defence: { iterations: 40 },
      lethal: { nodes: 6000 },
    };
    const turns = await measure('warlord', 'early', 3, small);
    expect(turns.length).toBeGreaterThanOrEqual(1);
    checkTurns(turns, HEAVY_MS);
  }, 240_000);
});
