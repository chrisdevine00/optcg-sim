/** OP18-061 Iceburg. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, pick, PLAIN_BLUE, play } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { cardsOf, finishOrder } from './helpers-luffyace.ts';
import { FF2, PLAIN_PURPLE, SHC3, STAGE2, STAGE6, W7 } from './helpers-op18.ts';

const ID = 'OP18-061';
const onPlay = (deck: string[]) => {
  const g = game(
    { leader: PLAIN_PURPLE, hand: [ID], deck, costArea: { active: 2, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
  play(g, ID);
  return g;
};

describe('OP18-061 Iceburg', () => {
  it('[On Play] looks at 5 and adds up to a total of 2 Stage or {Water Seven} cards', () => {
    const g = onPlay([STAGE6, SHC3, W7, FF2, BLUE, STAGE2]);
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'deck', STAGE6), g.find('p1', 'deck', W7), g.find('p1', 'deck', FF2)].sort(),
    );
    pick(g, [g.find('p1', 'deck', STAGE6), g.find('p1', 'deck', W7)]);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([STAGE6, W7].sort());
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(STAGE2); // the 6th card stays on top
  });

  it('at most 2 in total', () => {
    const g = onPlay([STAGE6, W7, FF2, STAGE2, BLUE]);
    pick(g, [g.find('p1', 'deck', STAGE6), g.find('p1', 'deck', W7)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('"up to": may add nothing; a {Straw Hat Crew} card alone does not qualify', () => {
    const g = onPlay([SHC3, BLUE, BLUE, BLUE, BLUE]);
    expect(candidates(g)).toEqual([]);
    if (g.legal().some((a) => a.type === 'done')) none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
