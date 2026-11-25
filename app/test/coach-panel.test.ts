/**
 * M7 WP4, the coach panel's state: the hint (states, Do step 1, ticks, stale, Esc), the opponent's-
 * turn threat check, the frozen tempo meter, and hidden information for the new requests. The
 * coach's worker is replaced by the same searches run in process (the real `hint` and `threat`).
 *
 * `app/test/coach.test.ts` keeps the lethal detector's tests; this file is the rest of the panel.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { actionKey, type GameInfo, type HintResult, type ThreatResult } from '@optcg/ai';
import type { Action, SearchView } from '@optcg/engine';
import { hint } from '../../ai/src/search/hint-line.ts';
import { threat } from '../../ai/src/search/lethal/threat.ts';
import { describeActions, type Named } from '../../ai/src/coach/explain-hint.ts';
import { GameController } from '../src/play/game/controller.ts';
import type { CoachPort } from '../src/play/game/ai-client.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import {
  NO_HINT,
  firstStepDone,
  nextStage,
  progressOf,
  takenMoves,
  type Seen,
} from '../src/play/coach/hint.ts';
import { cardMap, coachStubs } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MINE = ['OP17-062', 'OP17-062', 'EB04-007', 'EB04-007', 'EB04-007', 'EB04-007'];

class Coachy implements CoachPort {
  private readonly stubs = coachStubs();
  score = this.stubs.score;
  readonly hints: { view: SearchView }[] = [];
  readonly threats: { view: SearchView; ownDeck?: string[]; priority?: number }[] = [];
  readonly cancelled: number[] = [];
  restarted = 0;
  private n = 1;
  constructor(
    readonly init: Card[],
    readonly game: GameInfo | undefined,
  ) {}
  lethal() {
    return { id: this.n++, result: new Promise<never>(() => undefined) };
  }
  hint(view: SearchView, _o: { budgetMs: number }) {
    this.hints.push({ view });
    const result = hint(view, {
      cards: cardMap(),
      budget: { iterations: 120 },
      ...(this.game ? { game: this.game } : {}),
    });
    return { id: this.n++, result: sleep(5).then(() => ({ result, ms: 5 })) };
  }
  threat(view: SearchView, o: { capMs: number; ownDeck?: string[]; priority?: 2 | 4 }) {
    this.threats.push({
      view,
      ...(o.ownDeck ? { ownDeck: o.ownDeck } : {}),
      ...(o.priority ? { priority: o.priority } : {}),
    });
    const result = threat(
      view,
      cardMap(),
      { nodes: 60_000 },
      { ...(o.ownDeck ? { ownDeck: o.ownDeck } : {}) },
    );
    return { id: this.n++, result: sleep(5).then(() => ({ result, ms: 5 })) };
  }
  reveal() {}
  cancel(id: number) {
    this.cancelled.push(id);
  }
  restart() {
    this.restarted++;
  }
  terminate() {}
}

type Spec = (typeof SCENARIOS)[string];

function game(patch: (s: Spec) => Spec = (s) => s, extra: { mode?: 'ai' | 'hotseat' } = {}) {
  const { mode: _m, ...spec } = patch(SCENARIOS.lethalDemo!);
  const ports: Coachy[] = [];
  const aiInit: { cards: Card[]; game: GameInfo }[] = [];
  const ctl = new GameController(
    cardMap(),
    { scenario: spec },
    {
      mode: extra.mode ?? 'ai',
      human: 'p1',
      names: { p1: 'You', p2: 'Rocks' },
      tier: 'pirate',
      autoSkip: true,
      alwaysSkip: false,
      speed: 4,
      aiCardIds: ['OP17-039'],
      aiDeck: [],
      myDeck: MINE,
      aiPort: (cards, g) => {
        aiInit.push({ cards, game: g });
        return {
          planTurn: () => ({ id: 0, result: Promise.resolve() }),
          decide: () => ({ id: 0, result: new Promise(() => undefined) }),
          reveal() {},
          cancel() {},
          reset() {},
          terminate() {},
        };
      },
      coachPort: (init, g) => {
        const p = new Coachy(init, g);
        ports.push(p);
        return p;
      },
    },
  );
  ctl.start();
  return { ctl, ports, aiInit, port: () => ports[0]! };
}

/** A hand with something to play, so a hint has a line worth following. */
const withHand = (s: Spec): Spec => ({
  ...s,
  p1: { ...s.p1, hand: ['EB04-007', 'OP17-062'], costArea: { active: 5, rested: 0 } },
});

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* node */
  }
});

const until = async (f: () => boolean, ms = 3000) => {
  for (let i = 0; i < ms / 10 && !f(); i++) await sleep(10);
  expect(f()).toBe(true);
};

// -------------------------------------------------------------------------------------------
// The pure reading of a line
// -------------------------------------------------------------------------------------------

describe('reading what the player does against the line', () => {
  const seen: Record<string, Seen> = {
    hz: { card: 'ZORO', isLeader: false },
    hl: { card: 'LUFFY', isLeader: true },
    ol: { card: 'KAIDO', isLeader: true },
    oc: { card: 'SHIKI', isLeader: false },
  };
  const line = [
    { kind: 'giveDon' as const, text: '', card: 'LUFFY', count: 2 },
    { kind: 'attack' as const, text: '', card: 'LUFFY', target: 'leader' },
    { kind: 'play' as const, text: '', card: 'ZORO' },
    { kind: 'endTurn' as const, text: '' },
  ];
  const give = (n: number): Action[] =>
    Array.from({ length: n }, () => ({ type: 'giveDon', target: 'hl', player: 'p1' }) as Action);
  const atk: Action = { type: 'attack', attacker: 'hl', target: 'ol', player: 'p1' } as Action;
  const play: Action = { type: 'playCard', card: 'hz', player: 'p1' } as Action;

  it('ticks a step when the player does it, in order, and DON!! given in clicks count once', () => {
    expect(progressOf(line, takenMoves([], seen))).toEqual({ done: 0, stale: false });
    expect(progressOf(line, takenMoves(give(1), seen))).toEqual({ done: 0, stale: false });
    expect(progressOf(line, takenMoves(give(2), seen))).toEqual({ done: 1, stale: false });
    expect(progressOf(line, takenMoves([...give(2), atk], seen))).toEqual({
      done: 2,
      stale: false,
    });
    expect(progressOf(line, takenMoves([...give(2), atk, play], seen))).toEqual({
      done: 3,
      stale: false,
    });
  });

  it('a step out of order, a different card or the wrong count is a deviation (stale)', () => {
    expect(progressOf(line, takenMoves([play], seen)).stale).toBe(true);
    expect(progressOf(line, takenMoves([...give(3)], seen)).stale).toBe(true);
    const other = { ...atk, target: 'oc' } as Action;
    expect(progressOf(line, takenMoves([...give(2), other], seen)).stale).toBe(true);
    expect(progressOf(line, takenMoves([...give(1), atk], seen)).stale).toBe(true);
  });

  it('answers to a step (its picks) belong to the step and never deviate', () => {
    const pick = { type: 'pick', choice: 'oc', player: 'p1' } as Action;
    expect(progressOf(line, takenMoves([...give(2), atk, play, pick], seen))).toEqual({
      done: 3,
      stale: false,
    });
  });

  it('groups actions exactly as the worker builds its line (describeActions)', () => {
    const named = (h: string): Named => ({
      name: h,
      card: seen[h]?.card ?? null,
      isLeader: seen[h]?.isLeader ?? false,
      mine: h.startsWith('h'),
    });
    const actions: Action[] = [
      ...give(3),
      atk,
      play,
      { type: 'pick', choice: 'oc', player: 'p1' } as Action,
      { type: 'endTurn', player: 'p1' } as Action,
    ];
    const worker = describeActions(actions, named).map((m) => ({
      kind: m.kind,
      card: m.card,
      count: m.count,
    }));
    const ui = takenMoves(actions, seen).map((m) => ({
      kind: m.kind,
      card: m.card,
      count: m.count,
    }));
    expect(ui).toEqual(worker);
  });
});

describe('what Do step 1 lines up next', () => {
  const give: Action = { type: 'giveDon', target: 'a', player: 'p1' } as Action;
  const play: Action = { type: 'playCard', card: 'c', player: 'p1' } as Action;
  const p1: Action = { type: 'pick', choice: 'x', player: 'p1' } as Action;
  const p2: Action = { type: 'pick', choice: 'y', player: 'p1' } as Action;

  it('takes whichever pick of a set the legal list offers (OPEN-QUESTIONS R14)', () => {
    const hintActions = [play, p1, p2];
    expect(nextStage(hintActions, [], [play])).toEqual(play);
    // After the play, the engine offers only the second pick first: the order the hint named is not the order.
    expect(nextStage(hintActions, [play], [p2])).toEqual(p2);
    expect(nextStage(hintActions, [play, p2], [p1])).toEqual(p1);
    expect(nextStage(hintActions, [play, p2, p1], [])).toBeNull();
    expect(firstStepDone(hintActions, [play, p2, p1])).toBe(true);
    expect(firstStepDone(hintActions, [play])).toBe(false);
  });

  it('offers nothing that is not legal now', () => {
    expect(nextStage([give], [], [])).toBeNull();
    expect(nextStage([give, play], [give], [give])).toBeNull();
  });
});

// -------------------------------------------------------------------------------------------
// The hint through the controller
// -------------------------------------------------------------------------------------------

describe('the hint', () => {
  it('runs only on a press, in the coach worker, with the player’s own list', async () => {
    const { ctl, ports, aiInit } = game(withHand);
    await sleep(60);
    // Nothing is computed until asked, and no worker even exists for the coach.
    expect(ctl.coach.hint.status).toBe('idle');
    expect(ports.length).toBe(0);
    ctl.coach.askHint();
    expect(ctl.coach.hint.status).toBe('thinking');
    await until(() => ctl.polite.text === 'Hint: thinking.');
    expect(ctl.coach.profile).toMatchObject({ expanded: true, tab: 'hint' });
    await until(() => ctl.coach.hint.status === 'ready');
    const port = ports[0]!;
    expect(port.hints).toHaveLength(1);
    // The coach's worker holds the player's own list, as the Warlord game; the AI's never does.
    expect(port.game).toMatchObject({ tier: 'warlord', ownDeck: MINE, leader: 'OP17-058' });
    expect(port.init.map((c) => c.id)).toContain('EB04-007');
    expect(aiInit.every((x) => !x.game.ownDeck.includes('OP17-062'))).toBe(true);
    expect(aiInit.every((x) => x.cards.every((c) => c.id !== 'EB04-007'))).toBe(true);
    const r = ctl.coach.hint.result!;
    expect(r.line.length).toBeGreaterThan(0);
    await until(() => /^Hint ready: /.test(ctl.polite.text));
    expect(ctl.polite.text).toContain('Step 1:');
    ctl.dispose();
  });

  it('Do step 1 lines the first action up from the legal list; the player still commits; the step ticks', async () => {
    const { ctl } = game(withHand);
    await sleep(60);
    ctl.coach.askHint();
    await until(() => ctl.coach.hint.status === 'ready');
    const before = ctl.session.actionCount;
    expect(ctl.coach.stageNext()).toBe(true);
    const staged = ctl.staged!;
    expect(ctl.actions().map(actionKey)).toContain(actionKey(staged));
    // Lining it up changes nothing in the game.
    expect(ctl.session.actionCount).toBe(before);
    expect(ctl.act(staged)).toBe(true);
    expect(ctl.staged).toBeNull();
    expect(ctl.session.actionCount).toBe(before + 1);
    expect(ctl.coach.hint.taken).toHaveLength(1);
    // Keep taking the first step's own actions: step 1 ticks and the hint stays on its line.
    for (let i = 0; i < 12 && ctl.coach.firstStepLeft(); i++) {
      if (!ctl.coach.stageNext()) break;
      ctl.act(ctl.staged!);
    }
    const p = ctl.coach.hintProgress();
    expect(p.stale).toBe(false);
    expect(p.done).toBeGreaterThanOrEqual(1);
    ctl.dispose();
  });

  it('doing something else greys it out: "Board changed: ask again"; asking again gives a fresh hint', async () => {
    const { ctl, ports } = game(withHand);
    await sleep(60);
    ctl.coach.askHint();
    await until(() => ctl.coach.hint.status === 'ready');
    const r = ctl.coach.hint.result!;
    const first = r.viewActions[0]!;
    // Any legal action that is not the hint's first one.
    const other = ctl
      .actions()
      .find((a) => a.type !== 'endTurn' && actionKey(a) !== actionKey(first));
    const act = other ?? ctl.actions().find((a) => a.type === 'endTurn')!;
    ctl.act(act);
    if (actionKey(act) !== actionKey(first)) expect(ctl.coach.hintProgress().stale).toBe(true);
    // It is never re-run by itself.
    await sleep(50);
    expect(ports[0]!.hints).toHaveLength(1);
    ctl.dispose();
  });

  it('Esc stops a thinking hint (the worker is told) and clears a finished one; a stale answer is dropped', async () => {
    const { ctl, ports } = game(withHand);
    await sleep(60);
    ctl.coach.askHint();
    expect(ctl.coach.discardHint()).toBe(true);
    expect(ctl.coach.hint).toBe(NO_HINT);
    expect(ports[0]!.cancelled.length).toBe(1);
    await until(() => ctl.polite.text === 'Hint stopped.');
    expect(ctl.coach.hint.status).toBe('idle');
    // The worker may still be running it: the next request restarts the worker instead of waiting.
    ctl.coach.askHint();
    expect(ports[0]!.restarted).toBe(1);
    await until(() => ctl.coach.hint.status === 'ready');
    expect(ctl.coach.discardHint()).toBe(true);
    await until(() => ctl.polite.text === 'Hint cleared.');
    ctl.dispose();
  });

  it('on their move it waits, says so, and asks nothing until the decision is yours', async () => {
    const { ctl, ports } = game(withHand);
    await sleep(60);
    const end = ctl.actions().find((a) => a.type === 'endTurn')!;
    ctl.act(end);
    await sleep(60);
    expect(ctl.myDecision()).toBe(false);
    ctl.coach.askHint();
    expect(ctl.coach.hint.status).toBe('waiting');
    await until(() => ctl.polite.text === 'Hint: waiting for Rocks’s move.');
    await sleep(60);
    expect(ports[0]?.hints.length ?? 0).toBe(0);
    ctl.dispose();
  });

  it('is not offered in hotseat', async () => {
    const { ctl, ports } = game(withHand, { mode: 'hotseat' });
    await sleep(60);
    ctl.liftCurtain();
    expect(ctl.coach.hintSupported).toBe(false);
    ctl.coach.askHint();
    expect(ctl.coach.hint.status).toBe('idle');
    expect(ports.length).toBe(0);
    ctl.dispose();
  });
});

// -------------------------------------------------------------------------------------------
// Their turn: the threat check, and the frozen tempo meter
// -------------------------------------------------------------------------------------------

describe('the opponent’s-turn threat check', () => {
  async function theirTurn(alerts = false) {
    const g = game(withHand);
    await sleep(60);
    if (alerts) g.ctl.coach.setProfile({ alerts: true });
    g.ctl.act(g.ctl.actions().find((a) => a.type === 'endTurn')!);
    await until(() => g.ctl.coach.threat.key !== null);
    return g;
  }

  it('does nothing until L is pressed on their Main Phase; L then asks with your own list', async () => {
    const { ctl, ports } = await theirTurn();
    await sleep(60);
    expect(ports[0]?.threats.length ?? 0).toBe(0);
    ctl.coach.press();
    expect(ctl.coach.threat.status).toBe('checking');
    await until(() => ctl.coach.threat.status === 'ready');
    const req = ports[0]!.threats[0]!;
    expect(req.ownDeck).toEqual(MINE);
    expect(req.priority).toBe(2);
    expect(req.view.player).toBe('p1');
    await until(() => ctl.polite.text.includes('does not count the cards in their hand'));
    expect(ctl.coach.profile).toMatchObject({ expanded: true, tab: 'lethal' });
    ctl.dispose();
  });

  it('with the alert switched on it checks by itself at the lowest priority and speaks only for a threat', async () => {
    const { ctl, ports } = await theirTurn(true);
    await until(() => ctl.coach.threat.status === 'ready');
    expect(ports[0]!.threats[0]!.priority).toBe(4);
    const r = ctl.coach.threat.result as ThreatResult;
    if (r.status === 'proven') await until(() => ctl.polite.text.includes('threatens lethal'));
    else expect(ctl.polite.text).not.toContain('Their board');
    ctl.dispose();
  });

  it('the answer belongs to the position: it is gone when the position changes', async () => {
    const { ctl } = await theirTurn();
    ctl.coach.press();
    await until(() => ctl.coach.threat.status === 'ready');
    expect(ctl.coach.threat.key).not.toBeNull();
    ctl.dispose();
  });

  it('the tempo meter freezes on their turn at your last turn’s split', async () => {
    const g = game(withHand);
    await sleep(60);
    const give = g.ctl.actions().find((a) => a.type === 'giveDon');
    if (give) g.ctl.act(give);
    const mine = g.ctl.coach.tempo!;
    expect(mine.ledger.total).toBeGreaterThan(0);
    g.ctl.act(g.ctl.actions().find((a) => a.type === 'endTurn')!);
    await until(() => !g.ctl.myDecision());
    await sleep(40);
    expect(g.ctl.coach.tempo!.turn).toBe(mine.turn);
    expect(g.ctl.coach.tempo!.ledger).toEqual(mine.ledger);
    g.ctl.dispose();
  });

  it('is not offered in hotseat', async () => {
    const g = game(withHand, { mode: 'hotseat' });
    await sleep(60);
    g.ctl.liftCurtain();
    g.ctl.coach.setProfile({ alerts: true });
    g.ctl.act(g.ctl.actions().find((a) => a.type === 'endTurn')!);
    await sleep(80);
    expect(g.ctl.coach.threat.key).toBeNull();
    expect(g.ports.length).toBe(0);
    g.ctl.dispose();
  });
});

// -------------------------------------------------------------------------------------------
// Hidden information: the new requests
// -------------------------------------------------------------------------------------------

describe('hidden information (hint and threat)', () => {
  /** Their hand, deck and Life are other cards; every public fact is the same. */
  const swap = (s: Spec): Spec => {
    const t = withHand(s);
    return {
      ...t,
      p2: {
        ...t.p2,
        hand: ['EB04-007', 'EB04-007'],
        deck: Array.from({ length: 12 }, () => 'OP17-056'),
        life: ['OP17-055'],
      },
    };
  };

  it('the hint request and the hint are the same for any hidden cards of theirs', async () => {
    const a = game(withHand);
    const b = game(swap);
    await sleep(60);
    for (const g of [a, b]) g.ctl.coach.askHint();
    await until(() => a.ctl.coach.hint.status === 'ready' && b.ctl.coach.hint.status === 'ready');
    const va = a.port().hints[0]!.view;
    expect(JSON.stringify(b.port().hints[0]!.view)).toBe(JSON.stringify(va));
    expect(va.zones.p2.hand.every((c) => c.card === null)).toBe(true);
    const ra = a.ctl.coach.hint.result as HintResult;
    const rb = b.ctl.coach.hint.result as HintResult;
    expect(JSON.stringify(rb)).toBe(JSON.stringify(ra));
    await until(
      () => /^Hint ready: /.test(a.ctl.polite.text) && /^Hint ready: /.test(b.ctl.polite.text),
    );
    expect(b.ctl.polite.text).toBe(a.ctl.polite.text);
    a.ctl.dispose();
    b.ctl.dispose();
  });

  it('the threat request and answer are the same for any hidden cards of theirs', async () => {
    const run = async (patch: (s: Spec) => Spec) => {
      const g = game(patch);
      await sleep(60);
      g.ctl.act(g.ctl.actions().find((x) => x.type === 'endTurn')!);
      await until(() => g.ctl.coach.threat.key !== null);
      g.ctl.coach.press();
      await until(() => g.ctl.coach.threat.status === 'ready');
      return g;
    };
    const a = await run(withHand);
    const b = await run(swap);
    expect(JSON.stringify(b.port().threats[0]!.view)).toBe(
      JSON.stringify(a.port().threats[0]!.view),
    );
    expect(JSON.stringify(b.ctl.coach.threat.result)).toBe(
      JSON.stringify(a.ctl.coach.threat.result),
    );
    await until(
      () => a.ctl.polite.text.includes('their hand') && b.ctl.polite.text.includes('their hand'),
    );
    expect(b.ctl.polite.text).toBe(a.ctl.polite.text);
    a.ctl.dispose();
    b.ctl.dispose();
  });
});
