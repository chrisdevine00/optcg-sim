/** OP15-020 Fire Fist. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, play, V } from './helpers.ts';
import { BOBBY, mk } from './helpers-op15g1.ts';

const ID = 'OP15-020';
/** [Yorki] OP15-034: a 0 power Character. */
const ZERO = 'OP15-034';

describe('OP15-020 Fire Fist', () => {
  const start = (p2chars: string[], hand: string[] = [ID, V.c1, V.c2, V.c3]) =>
    mk({ hand }, { characters: p2chars });

  it('[Main]: Leader +3000 this turn and an opposing Character -8000, then trash 2 to K.O. a Character with 0 power or less', () => {
    const g = start([V.c1, V.c4]);
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(-5000);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    // the K.O. candidates are the Characters at 0 power or less: V.c4 is at 6000 and is not one
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c4]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(
      expect.arrayContaining([V.c1, V.c2, ID]),
    );
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([V.c3]);
  });

  it('boundary: a Character left at 1000 power is not a K.O. candidate, one at exactly 0 is', () => {
    const g = start([V.c7]); // 9000 - 8000 = 1000
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(1000);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expectDecision(g, 'main', 'p1'); // nothing at 0 or less: no choice offered
    expect(g.zone('p2', 'characters')).toHaveLength(1);

    const h = start([V.c6]); // 8000 - 8000 = 0
    play(h, ID);
    pick(h, [h.find('p2', 'characters', V.c6)]);
    expect(h.power(h.find('p2', 'characters', V.c6))).toBe(0);
    accept(h);
    pick(h, [h.find('p1', 'hand', V.c1), h.find('p1', 'hand', V.c2)]);
    pick(h, [h.find('p2', 'characters', V.c6)]);
    expect(h.zone('p2', 'characters')).toHaveLength(0);
  });

  it('a Character already at 0 power (not the one given -8000) can be the K.O. target', () => {
    const g = start([V.c4, ZERO]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]); // -2000, also at 0 or less
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    const choices = g.legal().filter((a) => a.type === 'pick');
    expect(choices).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', ZERO)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c4]);
  });

  it('"you may trash 2": declining trashes nothing and K.O.s nothing; the power changes stay', () => {
    const g = start([V.c1]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    decline(g);
    expect(g.zone('p1', 'hand')).toHaveLength(3);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('with fewer than 2 cards in hand nothing can be trashed, so no K.O. (the Leader and -8000 still apply)', () => {
    const g = start([V.c1], [ID, BOBBY]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });

  it('"up to 1": the -8000 may be given to nothing, then the K.O. is still available for a 0 power Character', () => {
    const g = start([ZERO]);
    play(g, ID);
    none(g);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    pick(g, [g.find('p2', 'characters', ZERO)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });
});
