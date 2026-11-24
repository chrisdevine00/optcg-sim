/** OP15-102 Gan.Fall. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, none, pick, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import {
  donArea,
  fill,
  mine,
  names,
  offers,
  OTHER_LEADER,
  SI_NOLA,
  SI_SETO,
  SI_WYPER,
} from './helpers-op15g3.ts';

const ID = 'OP15-102';

describe('OP15-102 Gan.Fall', () => {
  describe('cost reduction in hand', () => {
    /** Printed cost 4: with 1 active DON!! he is only playable when the -3 applies. */
    const tryPlay = (chars: string[], active = 1) => {
      const g = mine({ leader: OTHER_LEADER, hand: [ID], characters: chars, ...donArea(active) });
      return g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', ID), player: 'p1' });
    };

    it('costs 3 less while you have a {Sky Island} Character with exactly 7000 power', () => {
      expect(tryPlay([SI_NOLA])).toBe(true);
    });

    it('the threshold is inclusive at 7000 and 6000 is not enough', () => {
      expect(tryPlay([SI_SETO])).toBe(false);
      expect(tryPlay([SI_WYPER])).toBe(true);
    });

    it('a Character with 7000 power that is not {Sky Island} does not count', () => {
      expect(tryPlay([V.c5])).toBe(false);
    });

    it('without the discount he still costs 4', () => {
      expect(tryPlay([], 3)).toBe(false);
      expect(tryPlay([], 4)).toBe(true);
    });

    it('the discount pays exactly 1 DON!! (4 - 3)', () => {
      const g = mine({ leader: OTHER_LEADER, hand: [ID], characters: [SI_NOLA], ...donArea(3) });
      play(g, ID);
      expect(don(g, 'p1').rested).toBe(1);
    });
  });

  describe('[On Play]', () => {
    const start = (oppChars: string[], oppLife: number) =>
      game(
        { leader: OTHER_LEADER, hand: [ID], ...donArea(4) },
        { leader: PLAIN_BLUE, characters: oppChars, life: fill(oppLife, PURPLE) },
      );

    it("rests up to 1 of your opponent's Characters with a cost equal to or less than their Life count", () => {
      const g = start([V.c3, V.c4], 3);
      play(g, ID);
      expect(offers(g, g.find('p2', 'characters', V.c4))).toBe(false);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
      expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
    });

    it('a cost equal to the Life count is allowed (2 Life, cost 2)', () => {
      const g = start([V.c2, V.c3], 2);
      play(g, ID);
      expect(offers(g, g.find('p2', 'characters', V.c2))).toBe(true);
      expect(offers(g, g.find('p2', 'characters', V.c3))).toBe(false);
      none(g);
    });

    it('with no opposing Life nothing can be chosen', () => {
      const g = start([V.c1], 0);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(names(g, 'p1', 'characters')).toEqual([ID]);
    });
  });
});
