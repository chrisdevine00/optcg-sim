/** OP12-079 Luffy Is the Man Who Will Be King of the Pirates!!! */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play } from './helpers.ts';
import {
  cardsIn,
  finishOrder,
  mk,
  offered,
  OTHER_LEADER,
  RA2,
  RA5,
  SANJI_LEADER,
  V,
} from './helpers-op12g3.ts';

const ID = 'OP12-079';
const deck = [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, V.c7, RA2, RA5, V.c1];

describe('OP12-079 Luffy Is the Man Who Will Be King of the Pirates!!!', () => {
  it('[Main] with a [Sanji] Leader: looks at 3, adds up to 1 (any card) to the hand, the rest go to the bottom', () => {
    const g = mk({ leader: SANJI_LEADER, hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', V.c2)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    const d = cardsIn(g, 'p1', 'deck');
    expect(d).toHaveLength(9);
    expect(d.slice(0, 7)).toEqual([V.c4, V.c5, V.c6, V.c7, RA2, RA5, V.c1]);
    expect(d.slice(7).sort()).toEqual([V.c1, V.c3].sort());
  });

  it('the pick offers exactly the 3 looked-at cards', () => {
    const g = mk({ leader: SANJI_LEADER, hand: [ID], deck });
    play(g, ID);
    const o = offered(g);
    expect(o).toHaveLength(3);
    expect(o).not.toContain(g.find('p1', 'deck', V.c4));
  });

  it('"up to 1": may take nothing; all 3 go to the bottom', () => {
    const g = mk({ leader: SANJI_LEADER, hand: [ID], deck });
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(cardsIn(g, 'p1', 'deck')).toHaveLength(10);
    expect(cardsIn(g, 'p1', 'deck')[0]).toBe(V.c4);
  });

  it('must not fire with another Leader: no look, the Event is simply spent', () => {
    const g = mk({ leader: OTHER_LEADER, hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p1', 'deck')).toEqual(deck);
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
