/**
 * M11 Track C drills: `?leader=<Leader id>` is the player's own Leader. The run reads it as that
 * Leader's archetype and every drill's committed bank then yields only items where it is the
 * player's Leader, at least six per drill for each of the two practised Leaders.
 */
import { describe, expect, it } from 'vitest';
import { queryOf } from '../src/drills/DrillRun.tsx';
import { filterEntries } from '../src/drills/session.ts';
import { archetypeIdOf } from '../src/meta/model.ts';
import type { DrillItem } from '../src/drills/types.ts';
import counter from '../src/drills/banks/counter.json';
import don from '../src/drills/banks/don.json';
import lethal from '../src/drills/banks/lethal.json';
import mulligan from '../src/drills/banks/mulligan.json';

const banks = { mulligan, lethal, counter, don } as unknown as Record<
  string,
  { items: DrillItem[] }
>;

describe('?leader= filters every drill to the player Leader', () => {
  it('is the Leader archetype in the query, and an explicit archetype wins', () => {
    expect(queryOf('?leader=OP18-021').archetype).toBe('OP18-021-franky');
    expect(queryOf('?leader=OP18-021&archetype=OP17-039-rocks').archetype).toBe('OP17-039-rocks');
    expect(queryOf('?source=bank').archetype).toBeUndefined();
  });

  for (const leader of ['OP18-021', 'EB02-010'])
    for (const [drill, bank] of Object.entries(banks))
      it(`${drill}: only items with ${leader} as mine, at least six`, () => {
        const q = queryOf(`?leader=${leader}`);
        const got = filterEntries(
          bank.items.map((item) => ({ item })),
          q,
          archetypeIdOf,
        );
        expect(got.length).toBeGreaterThanOrEqual(6);
        for (const e of got) expect(e.item.mine).toBe(leader);
      });
});
