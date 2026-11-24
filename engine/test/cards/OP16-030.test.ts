/** OP16-030 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { GREEN1, GREEN4, GREEN5, GREEN6, offers, RED_LEADER } from './helpers-op16g1.ts';

const ID = 'OP16-030';

describe('OP16-030 Trafalgar Law', () => {
  describe('[On Play]', () => {
    const start = () =>
      game(
        { leader: RED_LEADER, hand: [ID], costArea: { active: 8, rested: 0 } },
        {
          leader: PLAIN_BLUE,
          characters: [
            { card: V.c1, rested: true },
            { card: V.c2, rested: true },
            V.c3, // active: not a candidate
          ],
        },
      );

    it("up to 1 of your opponent's rested Characters will not become active in your opponent's next Refresh Phase", () => {
      const g = start();
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
      expect(offers(g, g.find('p2', 'characters', V.c1))).toBe(true);
      expect(offers(g, g.find('p2', 'characters', V.c3))).toBe(false);
      const held = g.find('p2', 'characters', V.c1);
      pick(g, [held]);
      g.act({ type: 'endTurn' }); // the opponent's Refresh Phase
      expect(g.card(held).rested).toBe(true);
      expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
    });

    it('it lasts for one Refresh Phase only', () => {
      const g = start();
      play(g, ID);
      const held = g.find('p2', 'characters', V.c1);
      pick(g, [held]);
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      expect(g.card(held).rested).toBe(false);
    });

    it('"up to 1": it may choose nothing, and every rested Character refreshes', () => {
      const g = start();
      play(g, ID);
      none(g);
      g.act({ type: 'endTurn' });
      expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
    });
  });

  describe('[End of Your Turn]', () => {
    const start = () =>
      game(
        {
          leader: RED_LEADER,
          characters: [
            { card: ID, rested: true }, // green but cost 8
            { card: GREEN1, rested: true },
            { card: GREEN4, rested: true },
            { card: GREEN5, rested: true },
            { card: GREEN6, rested: true }, // cost 6: not set
          ],
        },
        { leader: PLAIN_BLUE, characters: [{ card: GREEN1, rested: true }] },
      );

    it('sets all of your green Characters with a cost of 5 or less as active (5 is inclusive, 6 is not)', () => {
      const g = start();
      g.act({ type: 'endTurn' });
      for (const c of [GREEN1, GREEN4, GREEN5])
        expect(g.card(g.find('p1', 'characters', c)).rested).toBe(false);
      expect(g.card(g.find('p1', 'characters', GREEN6)).rested).toBe(true);
      expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    });

    it('a Character that is not green stays rested, whatever its cost', () => {
      const g = game(
        {
          leader: RED_LEADER,
          characters: [
            ID,
            { card: V.c3, rested: true }, // Purple, cost 3
            { card: GREEN1, rested: true },
          ],
        },
        { leader: PLAIN_BLUE },
      );
      g.act({ type: 'endTurn' });
      expect(g.card(g.find('p1', 'characters', V.c3)).rested).toBe(true);
      expect(g.card(g.find('p1', 'characters', GREEN1)).rested).toBe(false);
    });
  });
});
