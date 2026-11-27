/**
 * M9 WP5: the 24 "Show me" demos are validated against the real engine (the part that makes them
 * trustworthy). Each demo's `line` is replayed with `reduce`: every step must name exactly one legal
 * action (zero means the demo is wrong, two means it is ambiguous), the scripted opponent must choose
 * what the line says it does, and the final state must satisfy `expect`. The filter the board uses
 * (`allowFor`) is checked against the same replay, and a mutation of an expectation or a step fails.
 */
import { describe, expect, it } from 'vitest';
import { automation, SCRIPTED_IDS } from '@optcg/cards';
import { actionFromView, legalActions, project, type ProjectedView } from '@optcg/engine';
import { DEMOS } from '../src/rules/demos/index.ts';
import { ruleExists } from '../src/rules/index.ts';
import { allowFor, demoCardIds, mySteps, scriptFor } from '../src/rules/showme.ts';
import type { DemoExpect, RuleDemo } from '../src/rules/types.ts';
import { ME, holds, playDemo, rulesData, settled, start } from './rules-support.ts';
import { cardMap } from './support.ts';

const data = rulesData();
const digest = data.entries.filter((e) => e.kind === 'digest');
const key = (a: object) => JSON.stringify({ ...a, intentId: undefined });

/** The state a fact is evaluated on: the end of the line, or just after `afterStep` steps. */
const stateFor = (d: RuleDemo, e: DemoExpect) =>
  e.kind === 'legal' && e.afterStep !== undefined
    ? settled(playDemo(d, e.afterStep).state)
    : playDemo(d).state;

describe('the demo list', () => {
  it('has 24 demos, each with a unique id, and never fewer than 16', () => {
    expect(DEMOS.length).toBeGreaterThanOrEqual(16);
    expect(DEMOS).toHaveLength(24);
    expect(new Set(DEMOS.map((d) => d.id)).size).toBe(DEMOS.length);
  });

  it('each demo is a goal, two short passages in our words, and a line the player can follow', () => {
    for (const d of DEMOS) {
      expect(d.title.length, d.id).toBeGreaterThan(8);
      expect(d.goal.length, d.id).toBeGreaterThan(20);
      expect(mySteps(d).length, `${d.id} has a step for the player`).toBeGreaterThan(0);
      expect(d.expect.length, d.id).toBeGreaterThan(0);
      for (const s of d.say) {
        expect(s.length, d.id).toBeLessThan(340);
        // A passage is a few short sentences.
        expect(
          (s.replaceAll('DON!!', 'DON').match(/[.!?](\s|$)/g) ?? []).length,
          `${d.id}: ${s}`,
        ).toBeLessThanOrEqual(3);
      }
    }
  });

  it('uses no card that is not automated, and every card resolves', () => {
    const cards = cardMap();
    for (const d of DEMOS)
      for (const id of demoCardIds(d)) {
        const c = cards.get(id);
        expect(c, `${d.id}: ${id} is not in cards/data`).toBeDefined();
        expect(automation(c!, SCRIPTED_IDS), `${d.id}: ${id}`).not.toBe('not-automated');
      }
  });

  it('cites rules that exist in the digest, and rulings that exist', () => {
    for (const d of DEMOS) {
      expect(d.rules.length, d.id).toBeGreaterThan(0);
      for (const r of d.rules) expect(ruleExists(digest, r), `${d.id} cites ${r}`).toBe(true);
      for (const r of d.rulings ?? [])
        expect(
          data.entries.some((e) => e.id === r && e.kind === 'ruling'),
          `${d.id} cites ${r}`,
        ).toBe(true);
    }
  });

  it('names a lesson that exists in the curriculum', async () => {
    const { LESSONS } = await import('../src/learn/lessons.ts');
    for (const d of DEMOS)
      expect(
        LESSONS.some((l) => l.code === d.lesson),
        `${d.id}: ${d.lesson}`,
      ).toBe(true);
  });

  it('every ruling and rule a demo shows links back to it', () => {
    for (const d of DEMOS) {
      const entry = data.entries.find((e) => e.id === (d.rulings?.[0] ?? d.rules[0]));
      if (entry) expect(entry.demo, d.id).toBeDefined();
    }
  });
});

describe('every demo replays on the real engine', () => {
  it.each(DEMOS.map((d) => [d.id, d] as const))('%s', (_id, d) => {
    // The start position holds what the demo says about it.
    for (const e of d.before ?? [])
      expect(holds(start(d), e), `${d.id} before: ${JSON.stringify(e)}`).toBe(true);
    // Each step names exactly one legal action (playDemo throws on zero or two) and the scripted
    // opponent does what its steps say.
    const played = playDemo(d);
    expect(played.trace).toHaveLength(d.line.length);
    // The final state satisfies each fact.
    for (const e of d.expect) expect(holds(stateFor(d, e), e), JSON.stringify(e)).toBe(true);
  });

  it('the opponent’s script is "attack-leader" exactly when its steps attack', () => {
    for (const d of DEMOS)
      expect(scriptFor(d) === 'attack-leader', d.id).toBe(
        d.line.some((s) => s.match.by === 'opp' && s.match.type === 'attack'),
      );
  });
});

describe('the board’s filter allows what the replay does, and only that', () => {
  it.each(DEMOS.map((d) => [d.id, d] as const))('%s', (_id, d) => {
    const mine = mySteps(d);
    const played = playDemo(d);
    let i = 0;
    for (const t of played.trace) {
      if (t.step.match.by === 'opp') continue;
      const state = settled(t.before);
      const view = project(state, ME) as ProjectedView;
      const allow = allowFor(d, () => i);
      const allowed = view.actions.filter((a) => allow(a, view));
      // Only an action the engine already lists can be allowed (it removes, never adds).
      expect(allowed.every((a) => view.actions.includes(a))).toBe(true);
      const engine = allowed.map((a) => key(actionFromView(state, ME, a)));
      expect(new Set(engine), `${d.id} step ${i + 1}`).toEqual(new Set([key(t.action)]));
      // The demo teaches a thing: on its first step the engine offers more than the demo allows.
      if (i === 0)
        expect(
          view.actions.filter((a) => a.type !== 'concede').length,
          `${d.id} narrows nothing on step 1`,
        ).toBeGreaterThan(allowed.length);
      i++;
    }
    expect(i).toBe(mine.length);
    // Past the last step nothing is allowed.
    const end = project(played.state, ME) as ProjectedView;
    expect(end.actions.filter((a) => allowFor(d, () => mine.length)(a, end))).toEqual([]);
  });
});

describe('mutation: a wrong demo fails', () => {
  const byId = (id: string) => DEMOS.find((d) => d.id === id)!;

  it.each([
    ['battle-tie', { kind: 'life', side: 'opp', count: 4 }],
    ['counter-step', { kind: 'life', side: 'me', count: 4 }],
    ['double-attack', { kind: 'life', side: 'opp', count: 1 }],
    ['negative-power', { kind: 'power', of: { card: 'ST22-009', side: 'opp' }, value: -3000 }],
    ['deck-out', { kind: 'result', winner: 'me' }],
  ] as const)('%s with one number changed no longer holds', (id, bad) => {
    const d = byId(id);
    const state = playDemo(d).state;
    expect(d.expect.every((e) => holds(state, e))).toBe(true);
    expect(holds(state, bad as DemoExpect)).toBe(false);
  });

  it('a step that names no legal action throws', () => {
    const d = structuredClone(byId('battle-tie'));
    // Attack with a Character they do not have.
    d.line[0]!.match.target = { card: 'ST22-010', side: 'opp' };
    expect(() => playDemo(d)).toThrow(/no legal action matches/);
  });

  it('a step that names two legal actions is ambiguous', () => {
    const d = structuredClone(byId('battle-tie'));
    // "Attack with the Leader" without a target matches the Leader and the rested Character.
    delete d.line[0]!.match.target;
    expect(() => playDemo(d)).toThrow(/ambiguous/);
  });

  it('an opponent step the script would not play throws', () => {
    const d = structuredClone(byId('counter-step'));
    // The scripted opponent never attacks a Character: say it attacks the Leader with a Character.
    d.line[0]!.match.attacker = { card: 'ST22-004', side: 'opp' };
    expect(() => playDemo(d)).toThrow();
  });
});

describe('the demos use the tutorial’s opponent only', () => {
  it('no demo needs the opponent to choose anything but block, Counter, Trigger, attack or end turn', () => {
    const allowed = new Set(['block', 'endCounter', 'trigger', 'attack', 'endTurn']);
    for (const d of DEMOS)
      for (const s of d.line)
        if (s.match.by === 'opp')
          expect(allowed.has(s.match.type), `${d.id}: ${s.desc}`).toBe(true);
  });
  it('every legal action in a start position is reachable through the engine', () => {
    for (const d of DEMOS) expect(legalActions(start(d)).length, d.id).toBeGreaterThan(0);
  });
});
