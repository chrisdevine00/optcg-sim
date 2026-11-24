/** OP15-104 Conis. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, pick, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { donArea, fill, names, OTHER_LEADER, trig } from './helpers-op15g3.ts';

const ID = 'OP15-104';

describe('OP15-104 Conis', () => {
  describe('[On Play]', () => {
    const start = (myLife: number, oppLife: number) =>
      game(
        {
          leader: OTHER_LEADER,
          hand: [ID, V.c2, V.c3],
          deck: [V.c4, V.c5, V.c6],
          life: fill(myLife, BLUE),
          ...donArea(1),
        },
        { leader: PLAIN_BLUE, life: fill(oppLife, PURPLE) },
      );

    it('with less Life than your opponent, draws 2 and trashes 2 from the hand', () => {
      const g = start(2, 3);
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c4)]);
      expect(hand(g, 'p1').sort()).toEqual([V.c3, V.c5].sort());
      expect(names(g, 'p1', 'trash').sort()).toEqual([V.c2, V.c4].sort());
      expect(g.zone('p1', 'deck')).toHaveLength(1);
    });

    it('with equal Life it does nothing (the comparison is strict)', () => {
      const g = start(3, 3);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(hand(g, 'p1')).toEqual([V.c2, V.c3]);
      expect(g.zone('p1', 'deck')).toHaveLength(3);
    });

    it('with more Life than your opponent it does nothing', () => {
      const g = start(3, 2);
      play(g, ID);
      expect(hand(g, 'p1')).toEqual([V.c2, V.c3]);
    });

    it('with 0 Life against 1 it still counts as less', () => {
      const g = start(0, 1);
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
    });
  });

  describe('[Trigger]', () => {
    it('draws 2 cards and trashes 1 card from the hand', () => {
      const g = trig(ID, { leader: OTHER_LEADER, deck: [V.c4, V.c5, V.c6] });
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c4)]);
      expect(hand(g, 'p1')).toEqual([V.c5]);
      expect(names(g, 'p1', 'trash').sort()).toEqual([V.c4, ID].sort());
    });
  });
});
