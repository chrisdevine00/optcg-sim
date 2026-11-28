/** OP18-056 Mr.13 & Ms.Friday. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, game, hand, pick, play, trash } from './helpers.ts';
import { BW2, BW4, candidates, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-056';
const start = (chars: string[], theirHand: string[] = [V.c1, V.c2]) => {
  const g = game(
    { leader: PLAIN_PURPLE, hand: [ID], characters: chars, costArea: { active: 2, rested: 0 } },
    { leader: PLAIN_BLUE, hand: theirHand },
  );
  play(g, ID);
  return g;
};

describe('OP18-056 Mr.13 & Ms.Friday', () => {
  it('[DON!! x1] gains +1000 power', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, don: 1 }] },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000); // 3000 + 1000 DON!! + 1000
  });

  it('[On Play] place another {Baroque Works} Character at the bottom of your deck: the opponent trashes 1 card of their choice', () => {
    const g = start([BW2]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    // the one {Baroque Works} Character other than Mr.13 is the cost
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(BW2);
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', V.c2)]);
    expect(trash(g, 'p2')).toEqual([V.c2]);
    expect(hand(g, 'p2')).toEqual([V.c1]);
  });

  it('declining places nothing and the opponent keeps their hand', () => {
    const g = start([BW2]);
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BW2, ID]);
    expect(hand(g, 'p2')).toEqual([V.c1, V.c2]);
  });

  it('Mr.13 himself cannot be the cost, and a non-{Baroque Works} Character is not offered', () => {
    const g = start([V.c3, BW4, BW2]);
    accept(g);
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'characters', BW4), g.find('p1', 'characters', BW2)].sort(),
    );
    pick(g, [g.find('p1', 'characters', BW4)]);
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(BW4);
  });

  it('with no other {Baroque Works} Character the cost cannot be paid: nothing happens', () => {
    const g = start([V.c3]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3, ID]);
    expect(hand(g, 'p2')).toEqual([V.c1, V.c2]);
    expectDecision(g, 'main', 'p1');
  });
});
