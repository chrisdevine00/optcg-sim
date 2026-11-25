/** OP09-066 Jean Bart. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canPick, ids, mk } from './helpers-a09g2.ts';

const ID = 'OP09-066';
/** Jean Bart costs 4: with `n` active DON!! p1 has `n` DON!! on the field after playing him. */
const start = (mine: number, theirs: number, given = 0) =>
  mk(
    { hand: [ID], costArea: { active: mine, rested: 0 } },
    {
      leader: given ? ({ card: PLAIN_BLUE, don: given } as never) : PLAIN_BLUE,
      characters: [V.c3, V.c4],
      costArea: { active: theirs, rested: 0 },
    },
  );

describe('OP09-066 Jean Bart', () => {
  it('[On Play] with more DON!! on the opponent field: K.O.s an opposing Character with cost 3 or less', () => {
    const g = start(6, 7);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // boundary: cost 3
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('boundary: equal DON!! counts do nothing (strictly more; your rested DON!! count)', () => {
    const g = start(6, 6); // 2 active + 4 rested after paying 4: still 6 on the field
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
  });

  it('fewer DON!! on the opponent field does nothing', () => {
    const g = start(6, 5);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
  });

  it('DON!! given to the opponent Leader counts as DON!! on their field', () => {
    const g = start(6, 4, 3); // 4 in the cost area + 3 given = 7 > 6
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start(6, 7);
    play(g, ID);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
  });
});
