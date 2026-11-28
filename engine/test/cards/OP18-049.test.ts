/** OP18-049 Mr.2.Bon.Kurei(Bentham). */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play } from './helpers.ts';
import { cardsOf, finishOrder } from './helpers-luffyace.ts';
import { BW4, BW5, candidates, mine, V } from './helpers-op18-g2.ts';

const ID = 'OP18-049';
const start = (deck: string[]) => {
  const g = mine({ hand: [ID], deck, costArea: { active: 5, rested: 0 } });
  play(g, ID);
  return g;
};

describe('OP18-049 Mr.2.Bon.Kurei(Bentham)', () => {
  it('[On Play] adds a revealed {Baroque Works} card from the top 5, the rest to the bottom; then gives 1 rested DON!!', () => {
    const g = start([V.c1, BW4, V.c2, V.c3, V.c4, V.c5]);
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g)).toEqual([g.find('p1', 'deck', BW4)]);
    pick(g, [g.find('p1', 'deck', BW4)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([BW4]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c5); // the 6th card was not looked at
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('a {Baroque Works} card below the top 5 is not offered', () => {
    const g = start([V.c1, V.c2, V.c3, V.c4, V.c5, BW5]);
    expect(candidates(g)).toEqual([]);
  });

  it('"up to 1": may take nothing; the DON!! is still given', () => {
    const g = start([BW4, BLUE, BLUE, BLUE, BLUE]);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(1);
  });

  it('the DON!! can go to the Leader or to a Character, 1 only', () => {
    const g = start([BLUE, BLUE, BLUE, BLUE, BLUE]);
    none(g);
    finishOrder(g);
    expect(candidates(g).sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', ID)].sort());
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(0);
  });
});
