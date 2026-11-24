/** OP15-115 Impact Dial. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, PURPLE, V } from './helpers.ts';
import { donArea, mine, names, offers, OTHER_LEADER, trig } from './helpers-op15g3.ts';

const ID = 'OP15-115';

describe('OP15-115 Impact Dial', () => {
  describe('[Main]', () => {
    const start = (opp: string[], life = [PURPLE, V.c1, V.c2]) =>
      mine({ leader: OTHER_LEADER, hand: [ID], life, ...donArea(2) }, { characters: opp });

    it("K.O.s up to 1 of your opponent's Characters with cost 4 or less, then adds the top Life card to your hand", () => {
      const g = start([V.c4, V.c5]);
      play(g, ID);
      expect(offers(g, g.find('p2', 'characters', V.c5))).toBe(false); // cost 5 is out
      pick(g, [g.find('p2', 'characters', V.c4)]);
      expect(names(g, 'p2', 'characters')).toEqual([V.c5]);
      expect(names(g, 'p2', 'trash')).toEqual([V.c4]);
      expect(hand(g, 'p1')).toEqual([PURPLE]);
      expect(g.life('p1')).toBe(2);
    });

    it('"up to 1": with no K.O. chosen the Life card is still added ("Then" is not "If you do")', () => {
      const g = start([V.c4]);
      play(g, ID);
      none(g);
      expect(names(g, 'p2', 'characters')).toEqual([V.c4]);
      expect(hand(g, 'p1')).toEqual([PURPLE]);
      expect(g.life('p1')).toBe(2);
    });

    it('with no legal target the Life card is still added', () => {
      const g = start([V.c5]);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(hand(g, 'p1')).toEqual([PURPLE]);
    });

    it('adds exactly 1 Life card, and nothing with 0 Life', () => {
      const g = start([V.c1], []);
      play(g, ID);
      pick(g, [g.find('p2', 'characters', V.c1)]);
      expect(hand(g, 'p1')).toEqual([]);
      expect(g.life('p1')).toBe(0);
    });
  });

  describe('[Trigger]', () => {
    it('K.O.s up to 1 opposing Character with cost 4 or less and takes no Life card', () => {
      const g = trig(ID, { leader: OTHER_LEADER }, [V.c3, V.c5]);
      g.act({ type: 'trigger', activate: true });
      expect(offers(g, g.find('p2', 'characters', V.c5))).toBe(false);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(names(g, 'p2', 'characters')).toEqual([V.c7, V.c5]);
      expect(g.life('p1')).toBe(1);
      expect(hand(g, 'p1')).toEqual([]);
    });
  });
});
