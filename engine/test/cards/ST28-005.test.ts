/** ST28-005 Yamato. */
import { describe, expect, it } from 'vitest';
import {
  dec,
  hand,
  ids,
  mk,
  none,
  opp,
  pick,
  pickable,
  play,
  settle,
  V,
  WANO1,
  WANO2,
  WANO3,
} from './helpers-lfc.ts';

const ID = 'ST28-005';

describe('ST28-005 Yamato', () => {
  describe('[DON!! x2] [Your Turn] +3000 power', () => {
    const power = (don: number, extra: Parameters<typeof mk>[2] = {}) => {
      const g = mk(
        { characters: [{ card: ID, don }], costArea: { active: 8, rested: 0 } },
        {},
        extra,
      );
      return g.card(g.find('p1', 'characters', ID)).power;
    };

    it('with 2 DON!! given on your turn: 0 + 2000 (DON!!) + 3000', () => {
      expect(power(2)).toBe(5000);
    });

    it('boundary: with 1 DON!! only the DON!! bonus applies', () => {
      expect(power(1)).toBe(1000);
      expect(power(0)).toBe(0);
    });

    it("must not apply on the opponent's turn (DON!! give no power then either)", () => {
      expect(power(2, opp)).toBe(0);
    });
  });

  describe('[On Play]', () => {
    const start = (deck: string[]) => {
      const g = mk({ hand: [ID], deck: [...deck, V.c1, V.c1, V.c1, V.c1, V.c1, V.c1] });
      play(g, ID);
      return g;
    };

    it('takes a {Land of Wano} card with a cost of 2 or more (cost 2 and 3 yes, cost 1 and other types no); the rest go to the bottom', () => {
      const g = start([WANO1, V.c3, WANO2, WANO3, V.c4]);
      expect(pickable(g).sort()).toEqual(
        [g.find('p1', 'deck', WANO2), g.find('p1', 'deck', WANO3)].sort(),
      );
      pick(g, [g.find('p1', 'deck', WANO3)]);
      settle(g);
      expect(hand(g, 'p1')).toEqual([WANO3]);
      expect(ids(g, 'p1', 'deck').slice(-4).sort()).toEqual([WANO1, V.c3, WANO2, V.c4].sort());
    });

    it('boundary: only the top 5 are looked at; a card in 6th place is not offered', () => {
      // (V.c6 and V.c7 are {Land of Wano} themselves, so they are not used as filler.)
      const g = start([V.c2, V.c3, V.c4, V.c5, V.c1, WANO3]);
      expect(dec(g)?.kind).toBe('choose');
      expect(pickable(g)).toEqual([]);
      none(g);
      settle(g);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('"up to 1": may take nothing', () => {
      const g = start([WANO3, V.c2, V.c3, V.c4, V.c5]);
      none(g);
      settle(g);
      expect(hand(g, 'p1')).toEqual([]);
      expect(ids(g, 'p1', 'deck').slice(-5)).toContain(WANO3);
    });
  });
});
