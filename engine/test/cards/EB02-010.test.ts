/** EB02-010 Monkey.D.Luffy (Leader). */
import { describe, expect, it } from 'vitest';
import { activate, C1, dec, don, mk, offeredAb, RA2, SHC } from './helpers-aeb2g1.ts';
import { option, payDon } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'EB02-010';
const A = 'set-active';
const start = (chars: string[], costArea = { active: 3, rested: 4 }) =>
  mk({ leader: ID, characters: chars, costArea });

/** Activate, pay the DON!! -2 (active first), answer the count if asked with `n`. */
function use(g: TestGame, n = 2): void {
  activate(g, g.leader('p1'), A);
  payDon(g);
  if (dec(g)?.kind === 'choose') option(g, String(n));
}

describe('EB02-010 Monkey.D.Luffy', () => {
  it("only {Straw Hat Crew} Characters: DON!! -2, set 2 DON!! active, Leader +1000 until the end of the opponent's next turn", () => {
    const g = start([SHC.sanji1, SHC.jinbe2]);
    use(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 5, active: 3, rested: 2 });
    expect(g.power(g.leader('p1'))).toBe(6000);
    g.act({ type: 'endTurn' }); // p2's turn: still +1000
    expect(g.power(g.leader('p1'))).toBe(6000);
    g.act({ type: 'endTurn' }); // p1's turn: gone
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character that is not {Straw Hat Crew}: the cost is paid, nothing is set active, no power, Once Per Turn is spent', () => {
    const g = start([SHC.sanji1, RA2]);
    use(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 5, active: 1, rested: 4 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(dec(g)?.kind).toBe('main');
    expect(offeredAb(g, g.leader('p1'), A)).toBe(false);
  });

  it('"the only Characters" is false with no Characters: the cost is paid and nothing happens', () => {
    const g = start([]);
    use(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 5, active: 1, rested: 4 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(dec(g)?.kind).toBe('main');
  });

  it('"up to 2": a count of 1 sets one DON!! active; the +1000 still follows ("Then")', () => {
    const g = start([SHC.sanji1]);
    use(g, 1);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to 2": a count of 0 sets none; with only active DON!! there is nothing to set', () => {
    const g = start([SHC.sanji1]);
    use(g, 0);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
    const h = start([SHC.sanji1], { active: 5, rested: 0 });
    use(h);
    expect(don(h, 'p1')).toMatchObject({ active: 3, rested: 0 });
    expect(h.power(h.leader('p1'))).toBe(6000);
  });

  it("cannot be activated with fewer than 2 DON!! on the field, and the opponent's Characters do not matter", () => {
    const g = start([SHC.sanji1], { active: 1, rested: 0 });
    expect(offeredAb(g, g.leader('p1'), A)).toBe(false);
    const h = mk(
      { leader: ID, characters: [SHC.sanji1], costArea: { active: 2, rested: 0 } },
      { characters: [C1] },
    );
    expect(offeredAb(h, h.leader('p1'), A)).toBe(true);
    use(h);
    expect(h.power(h.leader('p1'))).toBe(6000);
  });
});
