/** OP16-074 Magellan. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, payDon, play, PLAIN_BLUE, PURPLE } from './helpers.ts';
import { IMPEL_LEADER, koBy } from './helpers-w3s.ts';

const ID = 'OP16-074';

describe('OP16-074 Magellan', () => {
  describe('[On Play]', () => {
    const start = (leader: string, p2: { active: number; rested: number; given?: number }) =>
      game(
        { leader, hand: [ID], costArea: { active: 8, rested: 0 } },
        {
          leader: PLAIN_BLUE,
          characters: [{ card: PURPLE, don: p2.given ?? 0 }],
          costArea: { active: p2.active, rested: p2.rested },
        },
      );

    it('with an {Impel Down} Leader the opponent returns 1 DON!! from their field to their DON!! deck; they choose which', () => {
      const g = start(IMPEL_LEADER, { active: 2, rested: 1 });
      const deck = don(g, 'p2').deck;
      play(g, ID);
      expectDecision(g, 'choose', 'p2'); // the DON!! are theirs
      payDon(g);
      const d = don(g, 'p2');
      expect(d.active + d.rested).toBe(2);
      expect(d.deck).toBe(deck + 1);
      expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 8 }); // only the 8 paid for Magellan
    });

    it('they choose between active and rested: either can go', () => {
      const g = start(IMPEL_LEADER, { active: 2, rested: 2 });
      play(g, ID);
      g.act({ type: 'pick', choice: { from: 'costRested' } });
      expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 1 });
    });

    it('a DON!! given to their Character is also "on their field"', () => {
      const g = start(IMPEL_LEADER, { active: 0, rested: 0, given: 1 });
      play(g, ID);
      expect(don(g, 'p2')).toMatchObject({ given: 0 });
    });

    it('without an {Impel Down} Leader nothing is returned', () => {
      const g = start(PLAIN_BLUE, { active: 2, rested: 1 });
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 1 });
    });

    it('with no DON!! on their field nothing happens', () => {
      const g = start(IMPEL_LEADER, { active: 0, rested: 0 });
      play(g, ID);
      expectDecision(g, 'main', 'p1');
    });
  });

  describe('[On K.O.]', () => {
    const koed = (active: number, rested: number) => {
      const g = game(
        { leader: PLAIN_BLUE, characters: [ID] },
        { leader: PLAIN_BLUE, costArea: { active, rested } },
      );
      koBy(g, 'p1', ID, 'p2');
      return g;
    };

    it('the opponent returns 4 DON!! from their field to their DON!! deck, whatever the Leader', () => {
      const g = koed(3, 3);
      const deck = don(g, 'p2').deck;
      expectDecision(g, 'choose', 'p2');
      payDon(g);
      const d = don(g, 'p2');
      expect(d.active + d.rested).toBe(2);
      expect(d.deck).toBe(deck + 4);
    });

    it('as many as they have when they have fewer than 4', () => {
      const g = koed(1, 1);
      payDon(g);
      expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 0 });
      expectDecision(g, 'main', 'p1');
    });

    it('exactly 4 (not 3, not 5)', () => {
      const g = koed(5, 0);
      payDon(g);
      expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 0 });
    });
  });
});
