import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SetFile } from '@optcg/cards';
import {
  allTypes,
  emptyFilters,
  filterCards,
  filtersFromQuery,
  filtersToQuery,
  matchRank,
  matches,
  setFromQuery,
} from '../src/cards/filters.ts';

const load = (code: string) =>
  (
    JSON.parse(
      readFileSync(new URL(`../../cards/data/sets/${code}.json`, import.meta.url), 'utf8'),
    ) as SetFile
  ).cards;
const cards = [...load('OP-17'), ...load('OP-01')];
const order = (s: string) => (s === 'OP-01' ? 0 : 1);
const run = (p: Partial<ReturnType<typeof emptyFilters>>) =>
  filterCards(cards, { ...emptyFilters('all'), ...p }, order);

describe('card browser filters', () => {
  it('searches name, card number and text', () => {
    expect(run({ query: 'Rocks.D.Xebec' }).map((c) => c.id)).toContain('OP17-039');
    expect(run({ query: 'op17-039' }).map((c) => c.id)).toEqual(['OP17-039']);
    expect(
      run({ query: 'rest this card to make it the new target' }).every((c) =>
        /\[Blocker\]/.test(c.effectText),
      ),
    ).toBe(true);
  });

  it('filters by set, colour, category, cost, type, keyword and legality', () => {
    expect(run({ set: 'OP-01' }).every((c) => c.set === 'OP-01')).toBe(true);
    const blueLeaders = run({ colors: ['Blue'], categories: ['Leader'] });
    expect(blueLeaders.length).toBeGreaterThan(0);
    expect(blueLeaders.every((c) => c.colors.includes('Blue') && c.category === 'Leader')).toBe(
      true,
    );
    expect(run({ cost: '10+' }).every((c) => (c.cost ?? 0) >= 10)).toBe(true);
    expect(run({ cost: '0' }).every((c) => c.cost === 0)).toBe(true);
    expect(run({ type: 'rocks pirates' }).every((c) => c.types.includes('Rocks Pirates'))).toBe(
      true,
    );
    expect(run({ keyword: 'Blocker' }).every((c) => c.effectText.includes('[Blocker]'))).toBe(true);
    expect(run({ keyword: 'Trigger' }).every((c) => c.triggerText !== null)).toBe(true);
    expect(run({ legality: 'rotated' }).every((c) => c.set === 'OP-01')).toBe(true);
    expect(run({ verifiedOnly: true }).every((c) => c.verified)).toBe(true);
  });

  it('sorts, keeping set and card-number order for ties', () => {
    const ids = run({}).map((c) => c.id);
    expect(ids[0]).toBe('OP01-001');
    const byPower = run({ sort: 'power', categories: ['Character'] });
    expect(byPower[0]!.power).toBeLessThanOrEqual(byPower.at(-1)!.power!);
    const desc = run({ sort: 'power', categories: ['Character'], descending: true });
    expect(desc[0]!.power).toBeGreaterThanOrEqual(desc.at(-1)!.power!);
    // Cost sorts put Leaders (no cost) last in both directions (M1-29).
    expect(run({ sort: 'cost' }).at(-1)!.category).toBe('Leader');
    expect(run({ sort: 'cost', descending: true }).at(-1)!.category).toBe('Leader');
  });

  it('ranks name matches above text mentions (M1-07)', () => {
    const nami = run({ query: 'Nami' });
    expect(nami[0]!.name).toBe('Nami');
    const ranks = run({ query: 'Rocks' }).map((c) => matchRank(c, 'Rocks'));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(ranks.at(-1)).toBeGreaterThan(ranks[0]!);
    // A whole word of the name ranks with a prefix, and Leaders and Characters lead (M1-35).
    expect(run({ query: 'zoro' })[0]!.name).toBe('Roronoa Zoro');
    const xebec = run({ query: 'xebec' });
    expect(xebec[0]!.name).toMatch(/Xebec/);
  });

  it('round-trips filters through the query string (M1-13)', () => {
    const f = {
      ...emptyFilters('OP-17'),
      query: 'luffy',
      colors: ['Red' as const],
      cost: '3' as const,
      verifiedOnly: true,
      sort: 'power' as const,
      descending: true,
    };
    const back = filtersFromQuery(filtersToQuery(f, 'OP-17'), 'OP-17');
    expect(back).toEqual({ ...f, setPicked: false });
    expect(filtersToQuery(emptyFilters('OP-17'), 'OP-17').toString()).toBe('');
  });

  it('recognises a card number in the query', () => {
    expect(setFromQuery('op01-016')).toBe('OP-01');
    expect(setFromQuery('ST21')).toBe('ST-21');
    expect(setFromQuery('P-088')).toBe('P');
    expect(setFromQuery('Nami')).toBeNull();
    expect(matches(cards[0]!, { ...emptyFilters('OP-99') })).toBe(false);
  });

  it('collects type suggestions', () => {
    expect(allTypes(cards)).toContain('Straw Hat Crew');
  });
});
