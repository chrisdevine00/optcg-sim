/** OP18-083 Saint Killingham (Black). */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, dec, hand, none, pick, play, V } from './helpers.ts';
import { candidates, koByEffect, plantOpponentEffect } from './helpers-a10g1.ts';
import { mine, theirs } from './helpers-op18-g3.ts';

const ID = 'OP18-083';
const SLEEP = 'OP18-093'; // [Sleeptids]

describe('OP18-083 Saint Killingham (Black)', () => {
  it('[Your Turn] [On Play] play up to 1 [Sleeptids] from your trash', () => {
    const g = mine({ hand: [ID], trash: [SLEEP, V.c1], costArea: { active: 5, rested: 0 } }, {});
    play(g, ID);
    expect(candidates(g)).toEqual([g.find('p1', 'trash', SLEEP)]);
    pick(g, [g.find('p1', 'trash', SLEEP)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, SLEEP].sort());
  });

  it('"up to 1": may play nothing; with no [Sleeptids] in the trash nothing is asked', () => {
    const g = mine({ hand: [ID], trash: [SLEEP], costArea: { active: 5, rested: 0 } }, {});
    play(g, ID);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    const g2 = mine({ hand: [ID], trash: [V.c1], costArea: { active: 5, rested: 0 } }, {});
    play(g2, ID);
    expect(g2.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  describe('[On K.O.] you may trash 2 cards from your hand: play this Character card from your trash', () => {
    it('plays itself from the trash', () => {
      const g = mine({ characters: [ID], hand: [BLUE, V.c1, V.c2] }, {});
      koByEffect(g, 'p1', ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', V.c1)]);
      // its own [Your Turn] [On Play] asks for a [Sleeptids] in the trash (none there)
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(
        g
          .zone('p1', 'trash')
          .map((c) => c.card)
          .sort(),
      ).toEqual([BLUE, V.c1].sort());
      expect(hand(g, 'p1')).toEqual([V.c2]);
    });

    it('declining leaves it in the trash and the hand untouched', () => {
      const g = mine({ characters: [ID], hand: [BLUE, V.c1] }, {});
      koByEffect(g, 'p1', ID);
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(hand(g, 'p1')).toHaveLength(2);
    });

    it('needs 2 cards in hand', () => {
      const g = mine({ characters: [ID], hand: [BLUE] }, {});
      koByEffect(g, 'p1', ID);
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    });

    it("on your opponent's turn it comes back but its [Your Turn] [On Play] does not fire", () => {
      const g = theirs({ characters: [ID], hand: [BLUE, V.c1], trash: [SLEEP] }, {});
      plantOpponentEffect(g, {
        ko: { from: 'characters', owner: 'opponent', filter: { name: 'Saint Killingham' } },
      });
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', V.c1)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(dec(g)?.kind).not.toBe('choose');
      expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(SLEEP);
    });
  });
});
