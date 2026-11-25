/** OP09-051 Buggy. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mk } from './helpers-a09g2.ts';

const ID = 'OP09-051';
const FIVE_PLUS = [V.c5, V.c6, V.c7, V.c5];
const lastOf = (g: ReturnType<typeof mk>, p: 'p1' | 'p2') => {
  const d = g.zone(p, 'deck');
  return d[d.length - 1]!.card;
};

describe('OP09-051 Buggy', () => {
  it("[On Play]: places an opposing Character at the bottom of the owner's deck; with 5 Characters of cost 5+ he stays", () => {
    const g = mk({ hand: [ID], characters: FIVE_PLUS }, { characters: [V.c3, V.c1] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c5))).toBe(false); // only the opponent's
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1]);
    expect(lastOf(g, 'p2')).toBe(V.c3);
    expect(ids(g, 'p1', 'characters')).toEqual([...FIVE_PLUS, ID]); // Buggy counts himself (cost 10)
    expect(dec(g)?.kind).toBe('main');
  });

  it("with only 4 Characters of cost 5+ (himself included) he is placed at the bottom of his owner's deck", () => {
    const g = mk({ hand: [ID], characters: [V.c5, V.c6, V.c7] }, { characters: [V.c3] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c5, V.c6, V.c7]);
    expect(lastOf(g, 'p1')).toBe(ID);
    expect(lastOf(g, 'p2')).toBe(V.c3);
  });

  it('boundary: a cost 4 Character does not count toward the 5', () => {
    const g = mk({ hand: [ID], characters: [V.c5, V.c6, V.c7, V.c4] }, { characters: [V.c3] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p1', 'characters')).not.toContain(ID);
    expect(lastOf(g, 'p1')).toBe(ID);
  });

  it('"Then, if" is not "if you do": placing nothing (up to 1) still checks the count', () => {
    const g = mk({ hand: [ID], characters: [V.c5] }, { characters: [V.c3] });
    play(g, ID);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c5]);
    expect(lastOf(g, 'p1')).toBe(ID);
  });

  it('with no opposing Character the count is still checked', () => {
    const g = mk({ hand: [ID], characters: [V.c5] });
    play(g, ID);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c5]);
    expect(lastOf(g, 'p1')).toBe(ID);
    const h = mk({ hand: [ID], characters: FIVE_PLUS });
    play(h, ID);
    expect(ids(h, 'p1', 'characters')).toContain(ID);
  });

  it('an opposing Character of any cost can be placed', () => {
    const g = mk({ hand: [ID], characters: FIVE_PLUS }, { characters: [V.c7] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(true);
  });
});
