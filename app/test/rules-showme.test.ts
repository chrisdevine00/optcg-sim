/**
 * M9 WP5: "Show me" on the board's own controller. Each demo is played through `ShowRunner` the way a
 * player would: only the actions the demo's current step allows are offered, the scripted opponent
 * answers, a refused action says "Not that one", and the run is finished when the last step is done.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMOS } from '../src/rules/demos/index.ts';
import { backPath, ShowRunner } from '../src/rules/ShowMe.tsx';
import { demoCardIds, demoCards } from '../src/rules/showme.ts';
import { cardMap } from './support.ts';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: new MemStorage() });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(cond: () => boolean, what: string, ms = 8000): Promise<void> {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(5);
  }
}

describe('Show me on the board', () => {
  it.each(DEMOS.map((d) => [d.id, d] as const))(
    '%s can be played to its end through the allowed actions',
    async (_id, demo) => {
      const runner = new ShowRunner(demo, demoCards(demo, cardMap()), 4);
      try {
        expect(runner.steps.length).toBeGreaterThan(0);
        for (let i = 0; i < runner.steps.length; i++) {
          await until(
            () => runner.ctl.myDecision() && runner.ctl.actions().length > 0,
            `${demo.id}: step ${i + 1} "${runner.steps[i]!.desc}"`,
          );
          expect(runner.done).toBe(i);
          const offered = runner.ctl.actions();
          // Only the step's action is on offer: the same one every time it is shown.
          expect(offered.length, `${demo.id} step ${i + 1}`).toBeGreaterThanOrEqual(1);
          expect(offered.length, `${demo.id} step ${i + 1}`).toBeLessThanOrEqual(2);
          expect(runner.ctl.act(offered[0]!), demo.id).toBe(true);
          await until(() => runner.done === i + 1, `${demo.id}: step ${i + 1} counted`);
        }
        expect(runner.finished).toBe(true);
        // Past the last step nothing is allowed, so the board offers nothing more.
        await sleep(20);
        expect(runner.ctl.actions()).toEqual([]);
      } finally {
        runner.dispose();
      }
    },
    20000,
  );

  it('refuses a move the demo does not teach, and says so', async () => {
    const demo = DEMOS.find((d) => d.id === 'battle-tie')!;
    const runner = new ShowRunner(demo, demoCards(demo, cardMap()), 4);
    try {
      await until(() => runner.ctl.view().decision?.kind === 'main', 'the Main decision');
      const v = runner.ctl.view();
      // End turn is legal in the engine; the demo does not allow it.
      const end = v.actions.find((a) => a.type === 'endTurn');
      expect(end).toBeDefined();
      expect(runner.ctl.actions().some((a) => a.type === 'endTurn')).toBe(false);
      expect(runner.ctl.act(end!)).toBe(false);
      expect(runner.notice).toContain('Not that one');
      expect(runner.notice).toContain(runner.steps[0]!.desc);
      expect(runner.done).toBe(0);
    } finally {
      runner.dispose();
    }
  });

  it('Run it again starts the demo over with a new board', async () => {
    const demo = DEMOS.find((d) => d.id === 'give-don')!;
    const runner = new ShowRunner(demo, demoCards(demo, cardMap()), 4);
    try {
      await until(
        () => runner.ctl.myDecision() && runner.ctl.actions().length > 0,
        'the first step',
      );
      runner.ctl.act(runner.ctl.actions()[0]!);
      await until(() => runner.finished, 'the end');
      const before = runner.attempt;
      runner.restart();
      expect(runner.attempt).toBe(before + 1);
      expect(runner.done).toBe(0);
      await until(
        () => runner.ctl.myDecision() && runner.ctl.actions().length > 0,
        'the first step again',
      );
    } finally {
      runner.dispose();
    }
  });

  it('loads only the cards a demo names', () => {
    const demo = DEMOS.find((d) => d.id === 'full-character-area')!;
    const ids = demoCardIds(demo);
    expect(ids).toContain('ST21-004');
    expect(demoCards(demo, cardMap()).size).toBe(ids.length);
  });

  it('"Back to the rule" returns to the page the player came from, else the demo’s own rule', () => {
    const demo = DEMOS.find((d) => d.id === 'don-your-turn-only')!;
    expect(backPath(demo, 'item/82')).toBe('/rules/item/82?from=show');
    expect(backPath(demo, null)).toBe('/rules/RL-13?from=show');
    // Anything that is not a rule id is ignored.
    expect(backPath(demo, 'https://example.com/x?y')).toBe('/rules/RL-13?from=show');
  });
});
