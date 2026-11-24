/** OP16-118 Portgas.D.Ace. */
import { describe, expect, it } from 'vitest';
import { game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { BLACK_8000, koByBattle, LUFFY_C, names, OTHER_LEADER, WB_4 } from './helpers-op16g4.ts';

const ID = 'OP16-118';

describe('OP16-118 Portgas.D.Ace', () => {
  describe('hand Counter', () => {
    const counterOf = (field: string[], card: string) => {
      const g = game(
        { leader: PLAIN_BLUE, hand: [card], characters: field },
        { leader: PLAIN_BLUE },
      );
      return g.card(g.find('p1', 'hand', card)).counter ?? null;
    };

    it('the Counter of a Character card with 8000 power in hand becomes +2000 while Ace is on the field', () => {
      expect(counterOf([ID], BLACK_8000)).toBe(2000);
    });

    it('without Ace on the field the printed Counter (+1000) applies', () => {
      expect(counterOf([], BLACK_8000)).toBe(1000);
    });

    it('must not change a Character with other power (6000 or 9000)', () => {
      expect(counterOf([ID], WB_4)).toBe(1000);
      expect(counterOf([ID], V.c7)).toBe(1000);
    });
  });

  describe('[On Play] / [On K.O.]', () => {
    const deck = [V.c1, LUFFY_C, WB_4, V.c2, V.c3, V.c4];

    it('[On Play] looks at 5, adds a {Whitebeard Pirates} card to your hand, the rest go to the bottom', () => {
      const g = game(
        { leader: PLAIN_BLUE, hand: [ID], deck, costArea: { active: 5, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      play(g, ID);
      // Candidates among the top 5: [Monkey.D.Luffy] and the Whitebeard Pirates Character.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
      pick(g, [g.find('p1', 'deck', WB_4)]);
      finishOrder(g);
      expect(hand(g, 'p1')).toEqual([WB_4]);
      expect(names(g, 'p1', 'deck')[0]).toBe(V.c4); // the 6th card is now on top
    });

    it('takes only 1 card in total, either [Monkey.D.Luffy] or the type, and "up to 1" may take none', () => {
      const g = game(
        { leader: PLAIN_BLUE, hand: [ID], deck, costArea: { active: 5, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      play(g, ID);
      pick(g, [g.find('p1', 'deck', LUFFY_C)]);
      finishOrder(g);
      expect(hand(g, 'p1')).toEqual([LUFFY_C]);
      const g2 = game(
        { leader: PLAIN_BLUE, hand: [ID], deck, costArea: { active: 5, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      play(g2, ID);
      none(g2);
      finishOrder(g2);
      expect(hand(g2, 'p1')).toEqual([]);
    });

    it('must not take other cards: with no match in the top 5 nothing is added', () => {
      const g = game(
        {
          leader: PLAIN_BLUE,
          hand: [ID],
          deck: [V.c1, V.c2, V.c3, V.c4, V.c5, WB_4],
          costArea: { active: 5, rested: 0 },
        },
        { leader: PLAIN_BLUE },
      );
      play(g, ID);
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
      none(g);
      finishOrder(g);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('[On K.O.] does the same', () => {
      const g = koByBattle({ leader: OTHER_LEADER, deck }, ID);
      pick(g, [g.find('p1', 'deck', LUFFY_C)]);
      finishOrder(g);
      expect(hand(g, 'p1')).toEqual([LUFFY_C]);
    });
  });
});
