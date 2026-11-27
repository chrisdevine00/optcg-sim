/**
 * M9-R11 / M9-R12: the drills ship against `docs/research/meta-lists.json` (the live file the weekly meta
 * PR rewrites) while every other test reads the pinned copy (`PINNED_META`). This test reads the live file
 * too: the module graph is loaded a second time with the live lists in place of the pinned ones, and
 * - the mulligan bank built from them still has at least 20 items, both classes, two or more per sourced
 *   guide (the committed bank is generated on the pinned lists and carries its own, so its hands do not
 *   move, but a live list that broke the generator would be seen here);
 * - every committed lethal item has the same header, headline and answer text under the live prior as
 *   under the pinned one (the answer text is re-solved at run time, so a prior that drifted far enough to
 *   change a bound would show a different answer than the one CI checked).
 * If the weekly PR makes this fail, refresh `ai/test/fixtures/meta-lists.pinned.json` and regenerate the banks
 * (`npm run drills:bank -- <drill>`).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { PINNED_META } from '../../vitest.config.ts';
import { MIN_BANK, bankFor, type LethalItem } from '../src/search/drills/index.ts';
import { judgeLethal } from '../src/search/drills/lethal.ts';
import { cardMap } from './support.ts';

vi.setConfig({ testTimeout: 600_000 });

const cards = cardMap();
const live = JSON.parse(
  readFileSync(new URL('../../docs/research/meta-lists.json', import.meta.url), 'utf8'),
);

/** The drills' modules, loaded fresh with `lists` as the meta file. */
async function withLists(lists: unknown) {
  vi.resetModules();
  vi.doMock(PINNED_META.replacement, () => ({ default: lists }));
  // The engine is a fresh instance too: load the effect scripts into it, as the setup file does.
  await import('../../test-setup/scripts.ts');
  const mulligan = await import('../src/search/drills/mulligan.ts');
  const lethal = await import('../src/search/drills/lethal.ts');
  return { mulligan, lethal };
}

describe('the live meta lists (M9-R11, R12)', () => {
  it('the mulligan bank built from them has the size and spread the done criteria ask for', async () => {
    const { mulligan } = await withLists(live);
    const sets = mulligan.metaListSets();
    expect(sets.length).toBeGreaterThanOrEqual(12);
    const bank = mulligan.mulliganBank(sets, cards);
    expect(bank.length).toBeGreaterThanOrEqual(MIN_BANK);
    expect(new Set(bank.map((i) => i.id.split('-').at(-1)))).toEqual(new Set(['keep', 'redraw']));
    const { sourced } = mulligan.mulliganCoverage(sets, cards);
    for (const id of sourced)
      expect(bank.filter((i) => i.archetypeId === id).length, id).toBeGreaterThanOrEqual(2);
  });

  it('the lists the load takes are really the live file (the check has teeth)', async () => {
    const fake = JSON.parse(JSON.stringify(live));
    fake.archetypes = fake.archetypes.slice(0, 1);
    const { mulligan } = await withLists(fake);
    expect(mulligan.metaListSets()).toHaveLength(1);
  });

  it('every committed lethal item answers the same under the live prior as under the pinned one', async () => {
    const items = bankFor('lethal').items as LethalItem[];
    const pinned = await withLists(JSON.parse(readFileSync(PINNED_META.replacement, 'utf8')));
    const liveMods = await withLists(live);
    for (const item of items) {
      for (const sub of [{ kind: 'no-lethal' } as const, { kind: 'played', won: true } as const]) {
        const a = pinned.lethal.judgeLethal(item, sub, cards);
        const b = liveMods.lethal.judgeLethal(item, sub, cards);
        expect(
          { h: b.headline, header: b.header, ex: b.explanation },
          `${item.id} ${sub.kind}`,
        ).toEqual({ h: a.headline, header: a.header, ex: a.explanation });
      }
    }
    // The statically imported judge (pinned through the alias) is the pinned one.
    expect(typeof judgeLethal).toBe('function');
  });
});
