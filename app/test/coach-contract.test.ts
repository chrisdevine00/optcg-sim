/**
 * The interruption contract (M7 done criterion, learning-ui §2.2): with every coach setting at its
 * default, a whole Rookie-vs-Rookie game through the controller produces zero coach focus requests,
 * zero coach-initiated expansions, zero assertive announcements from the coach, and zero hint,
 * score, threat or lethal requests. The variants switch one feature on and check the table's other
 * columns: tier-1 always-on (a badge and a polite line only), the blunder warning (only at a commit,
 * only politely). The watcher is itself tested: it catches a coach made to steal focus or expand.
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { rookie } from '@optcg/ai';
import type { Action, SearchView } from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import type { CoachPort } from '../src/play/game/ai-client.ts';
import { scoreDecision, lethal } from '@optcg/ai';
import { cardMap, coachStubs, metaDecks } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const counterOf = (id: string) => cardMap().get(id)?.counter ?? null;

/** The coach's worker as a double that counts every request and answers for real, in process. */
class CountingCoachPort implements CoachPort {
  private readonly stubs = coachStubs();
  readonly counts = { hint: 0, score: 0, threat: 0, lethal: 0 };
  private n = 1;
  hint = (v: SearchView, o: { budgetMs: number }) => {
    this.counts.hint++;
    return this.stubs.hint(v, o);
  };
  threat = (v: SearchView, o: { capMs: number }) => {
    this.counts.threat++;
    return this.stubs.threat(v, o);
  };
  score(view: SearchView) {
    this.counts.score++;
    const result = scoreDecision(view, {
      cards: cardMap(),
      budget: { iterations: 2 },
      lethalCap: { nodes: 4_000 },
    });
    return { id: this.n++, result: Promise.resolve({ result, ms: 0 }) };
  }
  lethal(view: SearchView) {
    this.counts.lethal++;
    const result = lethal({ mode: 'public', view }, cardMap(), { nodes: 4_000 });
    return { id: this.n++, result: Promise.resolve({ result, ms: 0 }) };
  }
  reveal() {}
  cancel() {}
  terminate() {}
}

/** The AI seat: Rookie, answering at once. */
const rookieSeat = (): AiPort => ({
  planTurn: () => ({ id: 0, result: Promise.resolve() }),
  decide: (view, _tier, seed) => ({
    id: 0,
    result: Promise.resolve({ ...rookie(view as never, { seed, counterOf }), ms: 0 }),
  }),
  reveal() {},
  cancel() {},
  reset() {},
  terminate() {},
});

/** Watches a controller for anything the coach does that the player did not ask for. */
function watch(ctl: GameController) {
  const violations: string[] = [];
  const spoken: { text: string; kind: string; source: string }[] = [];
  ctl.onAnnounce = (a) => spoken.push(a);
  const check = () => {
    const c = ctl.coach;
    if (c.focusSignal !== 0) violations.push('coach focus request');
    if (c.hintFocus !== 0) violations.push('hint focus request');
    if (c.profile.expanded) violations.push('coach expanded');
    if (c.wantTall) violations.push('coach asked for tall');
  };
  ctl.subscribe(check);
  return {
    check,
    spoken,
    violations,
    coachAssertive: () => spoken.filter((s) => s.source === 'coach' && s.kind === 'assertive'),
    coachSpoken: () => spoken.filter((s) => s.source === 'coach'),
  };
}

function newGame(
  port: CoachPort,
  profile: Parameters<GameController['coach']['setProfile']>[0] = {},
) {
  const decks = metaDecks();
  const mine = decks[0]!;
  const theirs = decks[5]!;
  const ctl = new GameController(
    cardMap(),
    { setup: { seed: 4242, decks: { p1: mine, p2: theirs }, chooser: 'p1' } },
    {
      mode: 'ai',
      human: 'p1',
      names: { p1: 'You', p2: 'Rookie' },
      tier: 'rookie',
      autoSkip: true,
      alwaysSkip: true,
      speed: 4,
      myDeck: mine.main,
      aiCardIds: [theirs.leader, ...theirs.main],
      aiDeck: theirs.main,
      aiPort: () => rookieSeat(),
      coachPort: (_init: Card[]) => port,
    },
  );
  if (Object.keys(profile).length) ctl.coach.setProfile(profile);
  return ctl;
}

/** Play the human seat with Rookie until the game ends (or `max` decisions). */
async function playOut(ctl: GameController, max = 2500, onHold?: () => void): Promise<number> {
  ctl.start();
  let moves = 0;
  for (let i = 0; i < 9000 && moves < max; i++) {
    if (ctl.view().result) break;
    if (ctl.myDecision()) {
      const v = ctl.session.view('p1');
      const a = rookie(v, { seed: moves, counterOf }).action as Action;
      const done = ctl.act(a);
      if (!done && ctl.blunder.note) {
        onHold?.();
        ctl.blunder.commitAnyway();
      }
      moves++;
      await sleep(0);
    } else await sleep(2);
  }
  return moves;
}

describe('the interruption contract (learning-ui §2.2)', () => {
  it('at every default, a full game has no coach focus, expansion, assertive line or request', async () => {
    const port = new CountingCoachPort();
    const ctl = newGame(port);
    const w = watch(ctl);
    expect(ctl.coach.profile).toMatchObject({
      expanded: false,
      alwaysOn: 0,
      blunder: false,
      alerts: false,
      donMath: false,
    });
    const moves = await playOut(ctl);
    w.check();
    expect(moves).toBeGreaterThan(20);
    expect(ctl.view().result).not.toBeNull();
    expect(w.violations).toEqual([]);
    expect(w.coachAssertive()).toEqual([]);
    expect(w.coachSpoken()).toEqual([]);
    expect(port.counts).toEqual({ hint: 0, score: 0, threat: 0, lethal: 0 });
    expect(ctl.commitGate).toBeUndefined();
    expect(ctl.blunder.requests).toBe(0);
    // Game announcements still happened (the watcher sees them), so the empty coach list is real.
    expect(w.spoken.length).toBeGreaterThan(0);
    ctl.dispose();
  }, 120_000);

  it('with tier 1 always on: lethal checks run, but nothing takes focus, opens or interrupts', async () => {
    const port = new CountingCoachPort();
    const ctl = newGame(port, { alwaysOn: 1 });
    const w = watch(ctl);
    await playOut(ctl, 120);
    w.check();
    expect(port.counts.lethal).toBeGreaterThan(0);
    expect(port.counts.hint + port.counts.score + port.counts.threat).toBe(0);
    expect(w.violations).toEqual([]);
    expect(w.coachAssertive()).toEqual([]);
    ctl.dispose();
  }, 120_000);

  it('with the blunder warning on: the coach speaks only at a commit it held, and only politely', async () => {
    const port = new CountingCoachPort();
    const ctl = newGame(port, { blunder: true });
    const w = watch(ctl);
    let holds = 0;
    await playOut(ctl, 120, () => holds++);
    w.check();
    expect(port.counts.score).toBeGreaterThan(0);
    expect(port.counts.hint + port.counts.threat + port.counts.lethal).toBe(0);
    expect(w.violations).toEqual([]);
    expect(w.coachAssertive()).toEqual([]);
    const said = w.coachSpoken();
    expect(said.every((s) => s.kind === 'polite' && /^Warning:/.test(s.text))).toBe(true);
    // One line per held commit, never more.
    expect(said.length).toBe(holds);
    ctl.dispose();
  }, 120_000);

  it('the watcher catches a coach that steals focus, opens itself or interrupts (a deliberate leak)', async () => {
    const port = new CountingCoachPort();
    const ctl = newGame(port);
    const w = watch(ctl);
    ctl.start();
    await sleep(40);
    // One deliberately bad coach: the panel opens, focus is requested, an assertive line is spoken.
    ctl.coach.setProfile({ expanded: true });
    ctl.coach.focusSignal++;
    ctl.alert('Coach: you could win right now.', 'coach');
    w.check();
    expect(w.violations).toEqual(expect.arrayContaining(['coach expanded', 'coach focus request']));
    expect(w.coachAssertive()).toHaveLength(1);
    ctl.dispose();
  });

  it('a press of H does ask for things: one hint request and focus on its result', async () => {
    const port = new CountingCoachPort();
    const ctl = newGame(port);
    ctl.start();
    await sleep(60);
    while (!ctl.myDecision()) await sleep(10);
    ctl.coach.askHint();
    expect(port.counts.hint).toBe(1);
    expect(ctl.coach.hintFocus).toBe(1);
    expect(ctl.coach.profile.expanded).toBe(true);
    ctl.dispose();
  });
});
