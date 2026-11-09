/**
 * The S1 usability scenarios (usability-plan.md §5.2) hold the positions their comments claim:
 * each builds, ub-lethal-1 is proven against any hand and needs the DON!! split, and ub-defend-1
 * needs +4000.
 */
import { describe, expect, it } from 'vitest';
import { lethal } from '@optcg/ai';
import { createFromScenario, projectForSearch, queries, type ScenarioSpec } from '@optcg/engine';
import { USABILITY_SCENARIOS } from '../src/play/setup/usability-scenarios.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cardMap, lookup } from './support.ts';

const build = (name: string, patch: (s: Omit<ScenarioSpec, 'cards'>) => void = () => {}) => {
  const { mode: _m, ...spec } = structuredClone(USABILITY_SCENARIOS[name]!);
  patch(spec);
  return createFromScenario({ ...spec, cards: lookup }).state;
};

describe('S1 usability scenarios', () => {
  it('are registered and build', () => {
    for (const name of Object.keys(USABILITY_SCENARIOS)) {
      expect(SCENARIOS[name]).toBeDefined();
      expect(() => build(name)).not.toThrow();
    }
  });

  it('ub-lethal-1: lethal is proven against any hand', () => {
    const s = build('ub-lethal-1');
    const r = lethal({ mode: 'public', view: projectForSearch(s, 'p1') }, cardMap(), {
      nodes: 300_000,
    });
    expect(r.status).toBe('proven');
    expect(r.certainty).toBe('any-hand');
  });

  it('ub-lethal-1: with one DON!! fewer it is not lethal (the split is the point)', () => {
    const s = build('ub-lethal-1', (spec) => {
      spec.p1.costArea = { active: 3, rested: 0 };
    });
    const r = lethal({ mode: 'public', view: projectForSearch(s, 'p1') }, cardMap(), {
      nodes: 300_000,
    });
    expect(r.status).not.toBe('proven');
  });

  it('ub-defend-1: the opponent is attacking-ready at 8000 against your 5000', () => {
    const s = build('ub-defend-1');
    expect(queries.turn(s).activePlayer).toBe('p2');
    expect(queries.zone(s, 'p2', 'leader')[0]!.power).toBe(8000);
    expect(queries.zone(s, 'p1', 'leader')[0]!.power).toBe(5000);
  });
});
