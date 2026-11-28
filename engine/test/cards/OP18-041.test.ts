/** OP18-041 Ms. All Sunday (Leader). */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, pick, trash } from './helpers.ts';
import { BW2, BW2_WEAK, buff, koBy, PLAIN_BLUE, SUNDAY_L, V } from './helpers-op18-g2.ts';

const start = (chars: string[], theirHand: string[] = [V.c1, V.c2]) =>
  game({ leader: SUNDAY_L, characters: chars }, { leader: PLAIN_BLUE, hand: theirHand });

describe('OP18-041 Ms. All Sunday', () => {
  it("your {Baroque Works} Character with 3000 base power K.O.'d: draw 1, the opponent trashes 1 of their choice", () => {
    const g = start([BW2]);
    koBy(g, 'p1', BW2, 'p2');
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', V.c2)]);
    expect(trash(g, 'p2')).toEqual([V.c2]);
    expect(hand(g, 'p2')).toEqual([V.c1]);
  });

  it('under 3000 base power does nothing; a buff to 3000 does not count (base power)', () => {
    const g = start([BW2_WEAK]);
    koBy(g, 'p1', BW2_WEAK, 'p2');
    expect(hand(g, 'p1')).toEqual([]);
    expect(hand(g, 'p2')).toEqual([V.c1, V.c2]);

    const b = start([BW2_WEAK]);
    buff(b, b.find('p1', 'characters', BW2_WEAK), 2000);
    koBy(b, 'p1', BW2_WEAK, 'p2');
    expect(hand(b, 'p1')).toEqual([]);
  });

  it("a Character without a Baroque Works type does nothing, and neither does the opponent's", () => {
    const g = start([V.c4]);
    koBy(g, 'p1', V.c4, 'p2');
    expect(hand(g, 'p1')).toEqual([]);
    const o = game(
      { leader: SUNDAY_L },
      { leader: PLAIN_BLUE, characters: [BW2], hand: [V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    koBy(o, 'p2', BW2, 'p1');
    expect(hand(o, 'p1')).toEqual([]);
    expect(hand(o, 'p2')).toEqual([V.c1]);
  });

  it('is not once per turn: two K.O.s draw twice', () => {
    const g = start([BW2, BW2], [V.c1, V.c2, V.c3]);
    koBy(g, 'p1', BW2, 'p2');
    pick(g, [g.find('p2', 'hand', V.c1)]);
    koBy(g, 'p1', BW2, 'p2');
    pick(g, [g.find('p2', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(trash(g, 'p2')).toEqual([V.c2, V.c1]);
  });

  it('an opponent with no hand just lets you draw', () => {
    const g = start([BW2], []);
    koBy(g, 'p1', BW2, 'p2');
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(trash(g, 'p2')).toEqual([]);
  });
});
