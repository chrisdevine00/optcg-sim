/** OP18-084 Saint Gunko (Black). */
import { describe, expect, it } from 'vitest';
import { BLUE, don, hand, none, pick, play, trash, V } from './helpers.ts';
import { activate, candidates } from './helpers-a10g1.ts';
import { CD4, CERBERUS, mine, SHAMROCK } from './helpers-op18-g3.ts';

const ID = 'OP18-084';
const SK = 'OP18-083'; // {Holy Knights of God} cost 5
const BIG = 'OP18-065'; // {Holy Knights of God} cost 10

describe('OP18-084 Saint Gunko (Black)', () => {
  describe('[On Play] look at 4: reveal up to 1 {Holy Knights of God} card and add it to your hand; trash the rest', () => {
    const start = (top: string[]) =>
      mine({ hand: [ID], deck: [...top, ...Array<string>(10).fill(BLUE)] }, {});

    it('adds the card to the hand and trashes the other three', () => {
      const g = start([BLUE, CERBERUS, V.c1, V.c2]);
      play(g, ID);
      expect(candidates(g)).toEqual([g.zone('p1', 'deck')[1]!.instance]);
      pick(g, [g.zone('p1', 'deck')[1]!.instance]);
      expect(hand(g, 'p1')).toEqual([CERBERUS]);
      expect(trash(g, 'p1').sort()).toEqual([BLUE, V.c1, V.c2].sort());
      expect(g.zone('p1', 'deck')).toHaveLength(10 + 0);
    });

    it('"up to 1": may take none; then all 4 are trashed', () => {
      const g = start([BLUE, CERBERUS, V.c1, V.c2]);
      play(g, ID);
      none(g);
      expect(hand(g, 'p1')).toEqual([]);
      expect(trash(g, 'p1')).toHaveLength(4);
    });

    it('with no {Holy Knights of God} card among them all 4 are trashed', () => {
      const g = start([BLUE, V.c1, V.c2, V.c3]);
      play(g, ID);
      // the pick is asked at max 0 (nothing can be chosen, the opponent cannot tell what the deck held)
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
      none(g);
      expect(trash(g, 'p1')).toHaveLength(4);
    });
  });

  describe('[Activate: Main] rest 4 DON!!: play up to 1 {Holy Knights of God} Character with a cost of 6 or less from your trash', () => {
    const start = (active = 5) =>
      mine(
        {
          characters: [ID],
          trash: [CERBERUS, SK, BIG, SHAMROCK, CD4],
          costArea: { active, rested: 0 },
        },
        {},
      );

    it('plays the chosen card', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'activate');
      expect(candidates(g).sort()).toEqual(
        [g.find('p1', 'trash', CERBERUS), g.find('p1', 'trash', SK)].sort(),
      );
      pick(g, [g.find('p1', 'trash', CERBERUS)]);
      expect(
        g
          .zone('p1', 'characters')
          .map((c) => c.card)
          .sort(),
      ).toEqual([CERBERUS, ID].sort());
      expect(don(g, 'p1').rested).toBe(4);
    });

    it('a cost of 10 or 8, or another type, is not a candidate; "up to 1" allows none', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'activate');
      for (const c of [BIG, SHAMROCK, CD4])
        expect(candidates(g)).not.toContain(g.find('p1', 'trash', c));
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(1);
      expect(don(g, 'p1').rested).toBe(4);
    });

    it('needs 4 active DON!!', () => {
      const g = start(3);
      expect(
        g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
      ).toBe(false);
    });
  });
});
