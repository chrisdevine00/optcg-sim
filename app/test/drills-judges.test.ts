/**
 * The drill boards (M9 WP4): items from the committed banks restored on the real controller and judged
 * by its puzzle judges, including the two new ones (`don-ledger`, `target-best`). Each judge is shown
 * both ways with scripted play, and the revert check is named in the test: change the expectation the
 * judge compares with and the verdict flips.
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { bankFor, recordOfItem } from '@optcg/ai/drills';
import {
  chooseAction,
  type BoardItem,
  type CounterItem,
  type DonItem,
  type LethalItem,
} from '@optcg/ai';
import { isDeepStrictEqual } from 'node:util';
import {
  legalActions,
  queries,
  reduce,
  type Action,
  type PlayerView,
  type SearchView,
} from '@optcg/engine';
import { applyAll, plainReply, startOf } from '../../ai/src/search/drills/play.ts';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import { materialise, puzzleOf } from '../src/drills/materialise.ts';
import type { DrillEntry } from '../src/drills/session.ts';
import { cardMap } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The AI seat answers the way the banks' own replays do: no Block, no Counter (`plainReply`). */
class PlainPort implements AiPort {
  private n = 1;
  planTurn() {
    return { id: this.n++, result: Promise.resolve() };
  }
  decide(view: PlayerView | SearchView, _t: string, seed: number) {
    const d = chooseAction(view, { tier: 'rookie', seed, cards: cardMap() });
    const legal = (view as PlayerView).actions ?? [];
    const pick =
      legal.find((a) => a.type === 'block' && a.blocker === null) ??
      legal.find((a) => a.type === 'endCounter') ??
      legal.find((a) => a.type === 'trigger' && !a.activate) ??
      legal.find((a) => a.type === 'optional' && !a.accept) ??
      d.action;
    return {
      id: this.n++,
      result: Promise.resolve({ ...d, action: pick, alternatives: [], ms: 0 }),
    };
  }
  reveal(_c: Iterable<Card>) {}
  cancel() {}
  reset() {}
  terminate() {}
}

const ai = { recordOfItem };

/** Answers what the player still owes after Submit turn (an end-of-turn order) until the judge decides. */
async function settle(ctl: GameController) {
  for (let i = 0; i < 400 && ctl.puzzleState() === 'open'; i++) {
    if (ctl.myDecision() && ctl.view().decision?.kind !== 'main') {
      const a = ctl.actions()[0];
      if (a) ctl.act(a);
    }
    await sleep(10);
  }
}
const other = (p: 'p1' | 'p2') => (p === 'p1' ? 'p2' : 'p1');
const open = (entry: DrillEntry) => {
  const m = materialise(ai, entry, cardMap() as Map<string, Card>, {
    aiPort: () => new PlainPort(),
    speed: 4,
  });
  m.ctl.start();
  return m;
};

/**
 * Plays the player's own engine actions of a stored line on the controller. The controller takes view
 * actions (handles), so each engine action is found by position in the engine's legal list, which the
 * view lists in the same order; a mirror engine state follows the plain replies of the AI seat.
 */
async function playStored(
  entry: DrillEntry,
  m: ReturnType<typeof open>,
  actions: readonly Action[],
  stopAfter?: Action,
) {
  const item = entry.item as BoardItem;
  let eng = applyAll(startOf(item.scenario, cardMap()), item.prefix);
  for (const a of actions) {
    // Only the player's actions are played; the AI seat's plain replies are mirrored below.
    if (a.player !== m.ctl.me) continue;
    // The plan keeps attacking in case a Counter stops one; once the game is won there is nothing left.
    if (queries.result(eng)) return;
    for (let i = 0; i < 400 && !m.ctl.myDecision() && m.ctl.puzzleState() === 'open'; i++)
      await sleep(5);
    const i = legalActions(eng).findIndex((x) => isDeepStrictEqual(x, a));
    expect(i, JSON.stringify(a)).toBeGreaterThanOrEqual(0);
    expect(m.ctl.act(m.ctl.actions()[i]!), JSON.stringify(a)).toBe(true);
    eng = reduce(eng, a).state;
    for (let k = 0; k < 20; k++) {
      const r = plainReply(eng, other(m.ctl.me));
      if (!r) break;
      eng = reduce(eng, r).state;
    }
    if (a === stopAfter) return;
  }
}

describe('lethal items on the controller', () => {
  const lethalItems = bankFor('lethal').items as LethalItem[];
  const withLine = lethalItems.find((i) => i.answer.lethal)!;

  it('is solved by the stored line, and says Submit turn', async () => {
    const m = open({ item: withLine });
    expect(m.puzzle.submitLabel).toBe('Submit turn');
    expect(m.ctl.puzzleState()).toBe('open');
    const a = (withLine.answer as unknown as { actions: Action[] }).actions;
    await playStored({ item: withLine }, m, a as Action[]);
    await settle(m.ctl);
    expect(m.ctl.puzzleState()).toBe('solved');
    m.ctl.dispose();
  });

  it('fails when the turn is submitted with nothing played', async () => {
    const m = open({ item: withLine });
    await sleep(40);
    const end = m.ctl.actions().find((x) => x.type === 'endTurn')!;
    expect(m.ctl.act(end)).toBe(true);
    await settle(m.ctl);
    expect(m.ctl.puzzleState()).toBe('failed');
    m.ctl.dispose();
  });

  it('never shows the AI seat’s cards: the player’s view counts their hand, it does not name it', () => {
    const m = open({ item: withLine });
    const v = m.ctl.view();
    const opp = m.ctl.me === 'p1' ? 'p2' : 'p1';
    expect(v.zones[opp].hand.length).toBeGreaterThan(0);
    for (const c of v.zones[opp].hand) expect(c.card).toBeNull();
    for (const c of v.zones[opp].life) if (!c.faceUp) expect(c.card).toBeNull();
    m.ctl.dispose();
  });
});

describe('counter items on the controller', () => {
  const items = bankFor('counter').items as CounterItem[];

  it('takes the controller judge named by the item and the turn it stands in', () => {
    for (const item of items.slice(0, 6)) {
      const m = open({ item });
      expect(m.puzzle.judge).toBe(item.judge);
      expect(m.puzzle.turn).toBe(item.scenario.turn);
      m.ctl.dispose();
    }
  });

  it('no-counter-on-attack: ending the step with no Counter solves, a Counter fails', async () => {
    const item = items.find((i) => i.judge === 'no-counter-on-attack')!;
    const ok = open({ item });
    await sleep(40);
    expect(ok.ctl.act(ok.ctl.actions().find((x) => x.type === 'endCounter')!)).toBe(true);
    expect(ok.ctl.puzzleState()).toBe('solved');
    ok.ctl.dispose();
    const bad = open({ item });
    await sleep(40);
    const counter = bad.ctl.actions().find((x) => x.type === 'counter');
    expect(counter).toBeDefined();
    bad.ctl.act(counter!);
    expect(bad.ctl.puzzleState()).toBe('failed');
    bad.ctl.dispose();
  });
});

describe('don-ledger judge', () => {
  const items = (bankFor('don').items as DonItem[]).filter((i) => i.lines.length > 1);
  const item = items.find((i) => i.lines.some((l) => !i.best.includes(l.id)))!;

  it('takes the least unused DON!! of its lines as the bar', () => {
    const min = Math.min(...item.lines.map((l) => l.unused));
    expect(puzzleOf({ item }, item.scenario.turn).expect?.unusedMin).toBe(min);
  });

  it('is solved by a best line and failed by a worse one (revert check: raise unusedMin and the worse line solves)', async () => {
    const play = async (lineId: string, unusedMin?: number) => {
      const entry: DrillEntry = { item };
      const m = open(entry);
      if (unusedMin !== undefined)
        (m.ctl.puzzle as { expect: { unusedMin: number } }).expect.unusedMin = unusedMin;
      const line = item.lines.find((l) => l.id === lineId)!;
      await playStored(entry, m, line.actions);
      await settle(m.ctl);
      const s = m.ctl.puzzleState();
      m.ctl.dispose();
      return s;
    };
    expect(await play(item.best[0]!)).toBe('solved');
    const worse = item.lines.find((l) => !item.best.includes(l.id))!;
    expect(await play(worse.id)).toBe('failed');
    expect(await play(worse.id, worse.unused)).toBe('solved');
  });
});

describe('don-ledger judge: no slack (M9-R9)', () => {
  const all = (bankFor('don').items as DonItem[]).filter((i) => i.lines.length > 1);
  /** An item with a line exactly one DON!! worse than the best, and the best line's own. */
  const closeCall = all.find((i) =>
    i.lines.some((l) => l.unused === Math.min(...i.lines.map((x) => x.unused)) + 1),
  )!;

  it('a line that leaves one DON!! more unused than the best fails, and the best solves', async () => {
    expect(closeCall).toBeDefined();
    const min = Math.min(...closeCall.lines.map((l) => l.unused));
    const oneShort = closeCall.lines.find((l) => l.unused === min + 1)!;
    const play = async (actions: Action[]) => {
      const entry: DrillEntry = { item: closeCall };
      const m = open(entry);
      await playStored(entry, m, actions);
      await settle(m.ctl);
      const s = m.ctl.puzzleState();
      m.ctl.dispose();
      return s;
    };
    expect(await play(oneShort.actions)).toBe('failed');
    expect(await play(closeCall.lines.find((l) => l.unused === min)!.actions)).toBe('solved');
  });
});

describe('target-best judge', () => {
  const item = (bankFor('lethal').items as LethalItem[]).find(
    (i) => i.answer.lethal && i.answer.actions.some((a) => a.type === 'attack'),
  )!;
  const actions = (item.answer as { actions: { type: string; target?: string }[] }).actions;
  const firstAttack = actions.find((a) => a.type === 'attack')!;
  const up = (target: string): DrillEntry => ({
    item,
    judge: 'target-best',
    expect: { target },
  });
  const playUpTo = (m: ReturnType<typeof open>) =>
    playStored({ item }, m, actions as Action[], firstAttack as Action);

  it('is solved when the first attack hits the expected target', async () => {
    const m = open(up(firstAttack.target!));
    await sleep(40);
    expect(m.ctl.puzzleState()).toBe('open');
    await playUpTo(m);
    expect(m.ctl.puzzleState()).toBe('solved');
    m.ctl.dispose();
  });

  it('fails on any other target (revert check: the expectation is the only thing that differs)', async () => {
    const m = open(up('not-this-one'));
    await sleep(40);
    await playUpTo(m);
    expect(m.ctl.puzzleState()).toBe('failed');
    m.ctl.dispose();
  });

  it('fails when the turn ends without an attack', async () => {
    const m = open(up(firstAttack.target!));
    await sleep(40);
    m.ctl.act(m.ctl.actions().find((x) => x.type === 'endTurn')!);
    await settle(m.ctl);
    expect(m.ctl.puzzleState()).toBe('failed');
    m.ctl.dispose();
  });
});
