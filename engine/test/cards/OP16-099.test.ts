/** OP16-099 I've Come Here... To Cut Those Chains!!! */
import { describe, expect, it } from 'vitest';
import {
  accept,
  dec,
  decline,
  don,
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { names, WANO_BLACK, WANO_GREEN_1 } from './helpers-op16g4.ts';

const ID = 'OP16-099';

const start = (deck: string[], active = 7, trash: string[] = []) =>
  game(
    { leader: PLAIN_BLUE, hand: [ID], deck, trash, costArea: { active, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe("OP16-099 I've Come Here... To Cut Those Chains!!!", () => {
  describe('[Main]', () => {
    it('rest 6 DON!!: trashes 5 from the top of the deck, then plays a {Land of Wano} Character (cost 6 or less) from the trash', () => {
      const g = start([V.c1, WANO_GREEN_1, V.c2, V.c3, V.c4, V.c5, V.c6]);
      play(g, ID);
      accept(g);
      expect(don(g, 'p1').active).toBe(0);
      expect(names(g, 'p1', 'deck')).toEqual([V.c5, V.c6]);
      // The milled Wano card is chosen after the mill.
      pick(g, [g.find('p1', 'trash', WANO_GREEN_1)]);
      expect(names(g, 'p1', 'characters')).toEqual([WANO_GREEN_1]);
      expect(names(g, 'p1', 'trash')).toHaveLength(5); // Event + 5 milled - 1 played
    });

    it('declining the cost mills nothing and plays nothing', () => {
      const g = start([V.c1, WANO_GREEN_1, V.c2, V.c3, V.c4, V.c5], 7, [WANO_GREEN_1]);
      play(g, ID);
      decline(g);
      expect(names(g, 'p1', 'deck')).toHaveLength(6);
      expect(names(g, 'p1', 'characters')).toEqual([]);
    });

    it('cannot be paid with only 5 DON!! left after playing it', () => {
      const g = start([V.c1, V.c2, V.c3, V.c4, V.c5, V.c6], 6);
      play(g, ID);
      expectDecision(g, 'optional', 'p1');
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
      expect(names(g, 'p1', 'deck')).toHaveLength(6);
    });

    it('must not play a cost 8 {Land of Wano} Character or a non-Wano Character; "up to 1" may play none', () => {
      const g = start([V.c1, V.c2, V.c3, V.c4, V.c5, V.c6], 7, [WANO_BLACK]);
      play(g, ID);
      accept(g);
      // Trash holds Sanji (cost 8) and 5 milled cards, none of which are Wano with cost 6 or less
      // except V.c6-type cards: milled V.c1..c5 are not {Land of Wano}.
      expect(
        g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p1', 'trash', WANO_BLACK)),
      ).toBe(false);
      if (g.legal().some((a) => a.type === 'pick')) none(g);
      expect(names(g, 'p1', 'characters')).toEqual([]);
    });

    it('milling the whole deck (fewer than 5 cards) ends the game at once (RL-26, wave 1 reading)', () => {
      const g = start([V.c1, V.c2], 7, [WANO_GREEN_1]);
      play(g, ID);
      accept(g);
      expect(dec(g)).toBeNull();
      expect(names(g, 'p1', 'deck')).toHaveLength(0);
    });
  });

  describe('[Counter]', () => {
    it('your Leader gains +3000 power during this battle', () => {
      const g = counterStep(
        { leader: PLAIN_BLUE, hand: [ID], costArea: { active: 1, rested: 0 } },
        {},
      );
      expect(g.power(g.leader('p1'))).toBe(5000);
      useCounter(g, ID);
      expect(g.power(g.leader('p1'))).toBe(8000);
    });
  });
});
