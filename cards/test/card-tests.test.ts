/** Per-push card test selection (M6b-0): changed cards' tests run; a shared change runs them all. */
import { describe, expect, it } from 'vitest';
import { cardOfTestFile, selectCardTests } from '../scripts/card-tests.ts';

const FILES = [
  'engine/test/cards/OP17-039.test.ts',
  'engine/test/cards/OP17-040.test.ts',
  'engine/test/cards/coverage.test.ts',
  'engine/test/cards/m4b/events.test.ts',
  'engine/test/independent/cards/OP17-039.test.ts',
  'engine/test/independent/cards/m4b/OP15-058-leader.test.ts',
  'engine/test/independent/cards/EB04-030.test.ts',
];

describe('card test selection', () => {
  it('names the card of a per-card test file only', () => {
    expect(cardOfTestFile('engine/test/cards/OP17-039.test.ts')).toBe('OP17-039');
    expect(cardOfTestFile('engine/test/independent/cards/m4b/OP15-058-leader.test.ts')).toBe(
      'OP15-058',
    );
    expect(cardOfTestFile('engine/test/cards/m4b/events.test.ts')).toBeNull();
    expect(cardOfTestFile('engine/test/rules/OP17-039.test.ts')).toBeNull();
  });

  it('a new script runs its own tests; the regenerated registry and reports do not widen the run', () => {
    const s = selectCardTests(
      [
        'cards/effects/OP-17/OP17-040.ts',
        'cards/effects/OP-17/index.ts',
        'cards/effects/registry.ts',
        'cards/data/coverage-report.json',
        'engine/test/cards/OP17-040.test.ts',
        'docs/STATUS.md',
      ],
      FILES,
    );
    expect(s.all).toBe(false);
    expect(s.cards).toEqual(['OP17-040']);
    expect(s.skip).toEqual([
      'engine/test/cards/OP17-039.test.ts',
      'engine/test/independent/cards/EB04-030.test.ts',
      'engine/test/independent/cards/OP17-039.test.ts',
      'engine/test/independent/cards/m4b/OP15-058-leader.test.ts',
    ]);
  });

  it('an independent test change runs that card; non-card test files are never skipped', () => {
    const s = selectCardTests(['engine/test/independent/cards/m4b/OP15-058-leader.test.ts'], FILES);
    expect(s.cards).toEqual(['OP15-058']);
    expect(s.skip).not.toContain('engine/test/cards/coverage.test.ts');
    expect(s.skip).not.toContain('engine/test/cards/m4b/events.test.ts');
  });

  it('engine, card data, the loader, shared kits or no base: everything runs', () => {
    for (const p of [
      'engine/src/effects/run.ts',
      'cards/src/dsl.ts',
      'cards/data/sets/OP-17.json',
      'cards/effects/index.ts',
      'engine/test/independent/cards/kit.ts',
      'engine/test/support/game.ts',
      'package-lock.json',
    ])
      expect(selectCardTests([p], FILES).all, p).toBe(true);
    expect(selectCardTests(null, FILES)).toMatchObject({ all: true, skip: [] });
    // Nothing card-related changed: no card's tests run, the rest of the suite still does.
    expect(selectCardTests(['docs/STATUS.md'], FILES).skip).toHaveLength(5);
  });
});
