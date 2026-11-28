/** OP18-088 Saint Sommers. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, dec, none, pick, play, V } from './helpers.ts';
import { candidates, koByEffect } from './helpers-a10g1.ts';
import { mine } from './helpers-op18-g3.ts';

const ID = 'OP18-088';

describe('OP18-088 Saint Sommers', () => {
  describe("[Your Turn] [On Play] if you have 6 or more DON!! cards on your field, K.O. up to 1 of your opponent's Characters with a base cost of 4 or less", () => {
    it('with 10 DON!! (6 rested to pay for it): K.O. a Character with a base cost of 4 or less', () => {
      const g = mine(
        { hand: [ID], costArea: { active: 10, rested: 0 } },
        { characters: [V.c4, V.c5, V.c1] },
      );
      play(g, ID);
      expect(candidates(g).sort()).toEqual(
        [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c1)].sort(),
      );
      pick(g, [g.find('p2', 'characters', V.c4)]);
      expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c4]);
    });

    it('"up to 1": may K.O. nothing', () => {
      const g = mine({ hand: [ID], costArea: { active: 6, rested: 0 } }, { characters: [V.c4] });
      play(g, ID);
      none(g);
      expect(g.zone('p2', 'characters')).toHaveLength(1);
    });

    it('with 5 DON!! on the field it does nothing (played from the trash by its own [On K.O.])', () => {
      const g = mine(
        { characters: [ID], hand: [BLUE, V.c1], costArea: { active: 5, rested: 0 } },
        { characters: [V.c4] },
      );
      koByEffect(g, 'p1', ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', V.c1)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(dec(g)?.kind).toBe('main');
      expect(g.zone('p2', 'characters')).toHaveLength(1);
    });

    it('DON!! given to your cards count as on your field: 4 in the cost area + 2 given make 6', () => {
      const g = mine(
        {
          characters: [ID, { card: V.c1, don: 2 }],
          hand: [BLUE, V.c2],
          costArea: { active: 4, rested: 0 },
        },
        { characters: [V.c4] },
      );
      koByEffect(g, 'p1', ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', V.c2)]);
      expect(candidates(g)).toEqual([g.find('p2', 'characters', V.c4)]);
    });
  });

  describe('[On K.O.] you may trash 2 cards from your hand: play this Character card from your trash', () => {
    const koed = (handCards = [BLUE, V.c1, V.c2]) => {
      const g = mine({ characters: [ID], hand: handCards, costArea: { active: 3, rested: 0 } }, {});
      koByEffect(g, 'p1', ID);
      return g;
    };

    it('trashes 2 cards and plays itself from the trash', () => {
      const g = koed();
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', V.c1)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(
        g
          .zone('p1', 'trash')
          .map((c) => c.card)
          .sort(),
      ).toEqual([BLUE, V.c1].sort());
    });

    it('declining, or fewer than 2 cards in hand, leaves it in the trash', () => {
      const g = koed();
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      const g2 = koed([BLUE]);
      expect(g2.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    });
  });
});
