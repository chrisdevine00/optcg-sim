/** ST24-002 Kid & Killer. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  expectDecision,
  hand,
  ids,
  mk,
  none,
  option,
  p2Attacks,
  pick,
  pickable,
  play,
  PLAIN_BLUE,
  settle,
  SN3,
  SN5,
  trash,
  V,
} from './helpers-lfc.ts';

const ID = 'ST24-002';

describe('ST24-002 Kid & Killer', () => {
  describe('[On Play]', () => {
    const start = (deck: string[]) => {
      const g = mk({ hand: [ID], deck: [...deck, V.c1, V.c1, V.c1, V.c1, V.c1, V.c1] });
      play(g, ID);
      return g;
    };

    it('looks at 5, adds up to 1 {Supernovas} card to hand, the rest go to the bottom of the deck', () => {
      const g = start([V.c2, SN3, V.c3, SN5, V.c4]);
      expectDecision(g, 'choose', 'p1');
      // Both {Supernovas} cards are offered; the vanillas are not.
      expect(pickable(g).sort()).toEqual(
        [g.find('p1', 'deck', SN3), g.find('p1', 'deck', SN5)].sort(),
      );
      pick(g, [g.find('p1', 'deck', SN5)]);
      settle(g);
      expect(hand(g, 'p1')).toEqual([SN5]);
      const deck = ids(g, 'p1', 'deck');
      expect(deck.slice(-4).sort()).toEqual([V.c2, SN3, V.c3, V.c4].sort());
    });

    it('boundary: only the top 5 are looked at (a {Supernovas} card in 6th place is not offered)', () => {
      const g = start([V.c2, V.c3, V.c4, V.c5, V.c6, SN3]);
      // Nothing to take among the 5: the pick is asked at max 0.
      expect(dec(g)?.kind).toBe('choose');
      expect(pickable(g)).toEqual([]);
      none(g);
      settle(g);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('"up to 1": may take nothing; the whole 5 go to the bottom', () => {
      const g = start([SN3, V.c2, V.c3, V.c4, V.c5]);
      none(g);
      settle(g);
      expect(hand(g, 'p1')).toEqual([]);
      expect(ids(g, 'p1', 'deck').slice(-5).sort()).toEqual([SN3, V.c2, V.c3, V.c4, V.c5].sort());
    });
  });

  describe("[On Your Opponent's Attack] you may trash this Character: set up to 1 DON!! as active", () => {
    const attacked = (costArea: { active: number; rested: number }) =>
      p2Attacks({ leader: PLAIN_BLUE, characters: [ID], costArea }, V.c4);

    it('accepting trashes it and sets 1 rested DON!! active', () => {
      const g = attacked({ active: 2, rested: 3 });
      expectDecision(g, 'optional', 'p1');
      accept(g);
      option(g, '1');
      expect(ids(g, 'p1', 'characters')).toEqual([]);
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    });

    it('"up to 1": the DON!! count may be 0, and declining keeps the Character', () => {
      const g = attacked({ active: 2, rested: 3 });
      accept(g);
      option(g, '0');
      expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
      const h = attacked({ active: 2, rested: 3 });
      decline(h);
      expect(ids(h, 'p1', 'characters')).toEqual([ID]);
      expect(don(h, 'p1')).toMatchObject({ active: 2, rested: 3 });
    });

    it('with no rested DON!! the cost is still payable and nothing is set active', () => {
      const g = attacked({ active: 5, rested: 0 });
      accept(g);
      expect(ids(g, 'p1', 'characters')).toEqual([]);
      expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0 });
    });
  });
});
