/** OP18-004 Karoo. */
import { describe, expect, it } from 'vitest';
import { withDon } from './helpers-op14g1.ts';
import { mk } from './helpers-op18-g1.ts';

const ID = 'OP18-004';
const kws = (n: number, leader?: string) => {
  const g = mk({ ...(leader ? { leader } : {}), characters: [withDon(ID, n)] });
  const id = g.find('p1', 'characters', ID);
  return { power: g.power(id), kw: g.card(id).keywords.filter((k) => k !== ('Blocker' as never)) };
};

describe('OP18-004 Karoo', () => {
  it('under 5000 power it has none of the three keywords', () => {
    expect(kws(0)).toEqual({ power: 4000, kw: [] });
  });

  it('at 5000 power it gains [Rush] only', () => {
    expect(kws(1)).toEqual({ power: 5000, kw: ['Rush'] });
  });

  it('at 6000 power it also gains [Banish]', () => {
    const r = kws(2);
    expect(r.power).toBe(6000);
    expect(r.kw.sort()).toEqual(['Banish', 'Rush']);
  });

  it('at 7000 power it also gains [Unblockable]', () => {
    const r = kws(3);
    expect(r.power).toBe(7000);
    expect(r.kw.sort()).toEqual(['Banish', 'Rush', 'Unblockable']);
  });

  it("other effects count: the Leader's +1000 (OP18-001) moves the tiers by one DON!!", () => {
    const r = kws(2, 'OP18-001');
    expect(r.power).toBe(7000);
    expect(r.kw.sort()).toEqual(['Banish', 'Rush', 'Unblockable']);
  });
});
