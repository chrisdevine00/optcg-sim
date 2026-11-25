/**
 * The blunder guard (M7 WP5, learning-ui §2.8) driven through the game controller, with the
 * coach's worker replaced by the same scorer run in process:
 * - off by default: no gate, no request, End turn commits;
 * - on: a held press shows the warning, "Commit anyway" commits, once per decision;
 * - the 300 ms rule: an answer inside it warns, a late one commits silently and shows nothing ever;
 * - mute by kind; the warning only ever uses the player's own view.
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { NOT_IMPLEMENTED, scoreDecision, type ScoreTable } from '@optcg/ai';
import type { Action, SearchView } from '@optcg/engine';
import { GameController } from '../src/play/game/controller.ts';
import type { CoachPort } from '../src/play/game/ai-client.ts';
import { BLUNDER_WAIT_MS } from '../src/play/coach/blunder.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cardMap, coachStubs } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A coach worker that scores in process after `delay` ms, or answers with `fixed`. */
class ScorePort implements CoachPort {
  private readonly stubs = coachStubs();
  hint = this.stubs.hint;
  threat = this.stubs.threat;
  readonly scored: SearchView[] = [];
  readonly cancelled: number[] = [];
  readonly others: string[] = [];
  private n = 1;
  constructor(
    private readonly delay = 0,
    private readonly fixed?: 'not-implemented',
  ) {}
  score(view: SearchView) {
    this.scored.push(view);
    const table: ScoreTable | typeof NOT_IMPLEMENTED =
      this.fixed === 'not-implemented'
        ? NOT_IMPLEMENTED
        : scoreDecision(view, {
            cards: cardMap(),
            budget: { iterations: 20 },
            lethalCap: { nodes: 150_000 },
          });
    return {
      id: this.n++,
      result: sleep(this.delay).then(() => ({ result: table, ms: this.delay })),
    };
  }
  lethal() {
    this.others.push('lethal');
    return { id: this.n++, result: new Promise<never>(() => undefined) };
  }
  reveal() {}
  cancel(id: number) {
    this.cancelled.push(id);
  }
  terminate() {}
}

function game(port: ScorePort, opts: { blunder?: boolean; hotseat?: boolean } = {}) {
  const { mode: _m, ...spec } = SCENARIOS.lethalDemo!;
  const ctl = new GameController(
    cardMap(),
    { scenario: spec },
    {
      mode: opts.hotseat ? 'hotseat' : 'ai',
      human: 'p1',
      names: { p1: 'You', p2: 'Rocks' },
      tier: 'rookie',
      autoSkip: true,
      alwaysSkip: false,
      speed: 4,
      aiCardIds: ['OP17-039'],
      aiDeck: [],
      aiPort: () => ({
        planTurn: () => ({ id: 0, result: Promise.resolve() }),
        decide: () => ({ id: 0, result: new Promise(() => undefined) }),
        reveal() {},
        cancel() {},
        reset() {},
        terminate() {},
      }),
      coachPort: (_init: Card[]) => port,
    },
  );
  ctl.start();
  if (opts.blunder) ctl.coach.setProfile({ blunder: true });
  return ctl;
}

const endTurn = (ctl: GameController) =>
  ctl.session.view('p1').actions.find((a) => a.type === 'endTurn') as Action;

describe('the blunder guard', () => {
  it('is off by default: no gate, no request, and End turn commits', async () => {
    const port = new ScorePort();
    const ctl = game(port);
    await sleep(60);
    expect(ctl.commitGate).toBeUndefined();
    expect(ctl.coach.profile.blunder).toBe(false);
    const before = ctl.session.actionCount;
    expect(ctl.act(endTurn(ctl))).toBe(true);
    expect(ctl.session.actionCount).toBeGreaterThan(before);
    expect(port.scored).toHaveLength(0);
    ctl.dispose();
  });

  it('holds a missed-lethal End turn with the claim and the better move; Commit anyway commits', async () => {
    const port = new ScorePort();
    const ctl = game(port, { blunder: true });
    await sleep(80);
    expect(port.scored).toHaveLength(1);
    const before = ctl.session.actionCount;
    expect(ctl.act(endTurn(ctl))).toBe(false);
    expect(ctl.session.actionCount).toBe(before);
    const note = ctl.blunder.note!;
    expect(note.action.type).toBe('endTurn');
    expect(note.warning.kind).toBe('missed-lethal');
    expect(note.warning.explanation.claim).toMatch(/lethal/i);
    expect(note.warning.better).not.toBeNull();
    expect(ctl.heldAction).toEqual(endTurn(ctl));
    ctl.blunder.commitAnyway();
    expect(ctl.blunder.note).toBeNull();
    expect(ctl.heldAction).toBeNull();
    expect(ctl.session.actionCount).toBeGreaterThan(before);
    ctl.dispose();
  });

  it('warns once per decision: a second press goes through', async () => {
    const port = new ScorePort();
    const ctl = game(port, { blunder: true });
    await sleep(80);
    const before = ctl.session.actionCount;
    expect(ctl.act(endTurn(ctl))).toBe(false);
    expect(ctl.blunder.note).not.toBeNull();
    // The same press again is "Commit anyway": no further check.
    expect(ctl.act(endTurn(ctl))).toBe(true);
    expect(ctl.session.actionCount).toBeGreaterThan(before);
    ctl.dispose();
  });

  it('"Use the better choice" plays the line’s first step instead', async () => {
    const port = new ScorePort();
    const ctl = game(port, { blunder: true });
    await sleep(80);
    expect(ctl.act(endTurn(ctl))).toBe(false);
    const better = ctl.blunder.note!.warning.better!;
    const before = ctl.session.actionCount;
    expect(ctl.blunder.useBetter()).toBe(true);
    expect(ctl.session.actionCount).toBeGreaterThan(before);
    expect(better.type).not.toBe('endTurn');
    expect(ctl.view().turn.activePlayer).toBe('p1');
    ctl.dispose();
  });

  it('a press inside 300 ms of a pending answer waits for it and warns', async () => {
    const port = new ScorePort(120);
    const ctl = game(port, { blunder: true });
    await sleep(10);
    const before = ctl.session.actionCount;
    expect(ctl.act(endTurn(ctl))).toBe(false);
    expect(ctl.blunder.note).toBeNull();
    await sleep(220);
    expect(ctl.blunder.note?.warning.kind).toBe('missed-lethal');
    expect(ctl.session.actionCount).toBe(before);
    ctl.dispose();
  });

  it('a late answer commits silently, and nothing is ever shown for that decision', async () => {
    const port = new ScorePort(BLUNDER_WAIT_MS + 500);
    const ctl = game(port, { blunder: true });
    await sleep(10);
    const before = ctl.session.actionCount;
    const spoken: string[] = [];
    ctl.onAnnounce = (a) => spoken.push(a.text);
    expect(ctl.act(endTurn(ctl))).toBe(false);
    await sleep(BLUNDER_WAIT_MS + 120);
    // The wait ran out: the press committed on its own, with no warning.
    expect(ctl.session.actionCount).toBeGreaterThan(before);
    expect(ctl.blunder.note).toBeNull();
    expect(ctl.blunder.lateAnswers).toBe(1);
    // The answer that arrives afterwards changes nothing.
    await sleep(500);
    expect(ctl.blunder.note).toBeNull();
    expect(ctl.heldAction).toBeNull();
    expect(spoken.filter((t) => /warning/i.test(t))).toEqual([]);
    ctl.dispose();
  });

  it('commits plainly when no analysis is available', async () => {
    const port = new ScorePort(0, 'not-implemented');
    const ctl = game(port, { blunder: true });
    await sleep(60);
    const before = ctl.session.actionCount;
    expect(ctl.act(endTurn(ctl))).toBe(true);
    expect(ctl.session.actionCount).toBeGreaterThan(before);
    expect(ctl.blunder.note).toBeNull();
    ctl.dispose();
  });

  it('a muted kind is never held, and "Don’t warn me about this" mutes it', async () => {
    const port = new ScorePort();
    const ctl = game(port, { blunder: true });
    await sleep(80);
    expect(ctl.act(endTurn(ctl))).toBe(false);
    ctl.blunder.muteKind();
    expect(ctl.coach.profile.muted).toEqual(['missed-lethal']);
    expect(ctl.blunder.note).toBeNull();
    expect(ctl.heldAction).toBeNull();
    // The muted kind no longer holds anything.
    const before = ctl.session.actionCount;
    expect(ctl.act(endTurn(ctl))).toBe(true);
    expect(ctl.session.actionCount).toBeGreaterThan(before);
    ctl.dispose();

    const other = new ScorePort();
    const c2 = game(other);
    // End turn here is also an unused-DON!! warning: both kinds muted.
    c2.coach.setProfile({ blunder: true, muted: ['missed-lethal', 'unused-don'] });
    await sleep(80);
    expect(c2.act(endTurn(c2))).toBe(true);
    c2.dispose();
  });

  it('is not offered in a two-player game', async () => {
    const port = new ScorePort();
    const ctl = game(port, { blunder: true, hotseat: true });
    await sleep(60);
    expect(ctl.commitGate).toBeUndefined();
    expect(port.scored).toHaveLength(0);
    ctl.dispose();
  });

  it('switching the warning off puts the gate away and drops a held note', async () => {
    const port = new ScorePort();
    const ctl = game(port, { blunder: true });
    await sleep(80);
    expect(ctl.act(endTurn(ctl))).toBe(false);
    ctl.coach.setProfile({ blunder: false });
    expect(ctl.commitGate).toBeUndefined();
    expect(ctl.blunder.note).toBeNull();
    expect(ctl.heldAction).toBeNull();
    ctl.dispose();
  });

  it('asks only with the player’s own view (the opponent’s hand is hidden in it)', async () => {
    const port = new ScorePort();
    const ctl = game(port, { blunder: true });
    await sleep(80);
    expect(port.scored.length).toBeGreaterThan(0);
    for (const v of port.scored) {
      expect(v.player).toBe('p1');
      expect(JSON.stringify(v)).toBe(JSON.stringify(ctl.session.searchView('p1')));
      expect(v.zones.p2.hand.every((c) => c.card === null)).toBe(true);
    }
    ctl.dispose();
  });
});
