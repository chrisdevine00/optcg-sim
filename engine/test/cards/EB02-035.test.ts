/** EB02-035 Sanji & Pudding. */
import { describe, expect, it } from 'vitest';
import { addMost, BLUE, dec, don, game, hand, PLAIN_BLUE, PLAIN_PURPLE, play } from './helpers.ts';
import { plantRun, returnNow } from './helpers-w5c1.ts';

const ID = 'EB02-035';
/** Your turn, Sanji & Pudding and a vanilla on the field, `active` DON!! (donDeck takes the rest). */
const turn = (active = 4) =>
  game(
    { leader: PLAIN_PURPLE, characters: [ID, BLUE], costArea: { active, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('EB02-035 Sanji & Pudding', () => {
  describe('[Your Turn] [Once Per Turn] when 2 or more DON!! are returned: add up to 1 DON!! and set it as active', () => {
    it('2 returned at once on your turn: 1 DON!! is added, active', () => {
      const g = turn();
      returnNow(g, BLUE, 2);
      addMost(g);
      // 4 on the field - 2 + 1 added; the deck had 6, +2 returned, -1 added.
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
      expect(dec(g)?.kind).toBe('main');
    });

    it('boundary: 1 returned does not fire it, 3 does', () => {
      const one = turn();
      returnNow(one, BLUE, 1);
      expect(dec(one)?.kind).toBe('main');
      expect(don(one, 'p1')).toMatchObject({ active: 3, deck: 7 });

      const three = turn();
      returnNow(three, BLUE, 3);
      addMost(three);
      expect(don(three, 'p1')).toMatchObject({ active: 2, deck: 8 });
    });

    it('two separate returns of 1 do not add up to 2', () => {
      const g = turn();
      returnNow(g, BLUE, 1);
      returnNow(g, BLUE, 1);
      expect(dec(g)?.kind).toBe('main');
      expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
    });

    it('once per turn: a second return of 2 adds nothing', () => {
      const g = turn();
      returnNow(g, BLUE, 2);
      addMost(g);
      returnNow(g, BLUE, 2);
      expect(dec(g)?.kind).toBe('main');
      expect(don(g, 'p1')).toMatchObject({ active: 1, deck: 9 });
    });

    it("not on the opponent's turn", () => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [ID], costArea: { active: 4, rested: 0 } },
        { leader: PLAIN_BLUE, characters: [BLUE] },
        { turn: 4, activePlayer: 'p2' },
      );
      plantRun(g, 'p2', BLUE, [{ do: { returnDon: { n: 2, player: 'opponent' } } }]);
      // p1 chooses which 2 DON!! to return (all of them are active: nothing to choose between).
      while (dec(g)?.kind === 'choose') g.act(g.legal().find((a) => a.type === 'pick')!);
      expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
    });
  });

  describe("[On Play] if your DON!! on the field is equal to or less than your opponent's: draw 1", () => {
    const cast = (mine: number, theirs: { active: number; rested: number }) => {
      const g = game(
        { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: mine, rested: 0 } },
        { leader: PLAIN_BLUE, costArea: theirs },
      );
      play(g, ID);
      return g;
    };

    it('equal counts draw (the DON!! that paid the cost are still on the field)', () => {
      const g = cast(6, { active: 3, rested: 3 });
      expect(hand(g, 'p1')).toHaveLength(1);
    });

    it('fewer than the opponent draws', () => {
      const g = cast(6, { active: 7, rested: 0 });
      expect(hand(g, 'p1')).toHaveLength(1);
    });

    it('one more than the opponent: no draw', () => {
      const g = cast(6, { active: 5, rested: 0 });
      expect(hand(g, 'p1')).toHaveLength(0);
      expect(dec(g)?.kind).toBe('main');
    });

    it('DON!! given to a card count on the field: 5 + 1 given is 6 against 5', () => {
      const g = game(
        {
          leader: { card: PLAIN_PURPLE, don: 1 },
          hand: [ID],
          costArea: { active: 5, rested: 0 },
        },
        { leader: PLAIN_BLUE, costArea: { active: 5, rested: 0 } },
      );
      play(g, ID);
      expect(hand(g, 'p1')).toHaveLength(0);
    });
  });
});
