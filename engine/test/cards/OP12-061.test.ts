/** OP12-061 Donquixote Rosinante (Leader). RL-41, QA-OP12 OP12-061, effect-dsl.md §6.6. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  payDon,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { battle, LAW1, LAW4, LAW5, MONET, ROSI } from './helpers-hancock-rosi.ts';

describe('OP12-061 Donquixote Rosinante', () => {
  describe('[Once Per Turn] a K.O. of [Trafalgar Law] is replaced by Life to hand', () => {
    /** p2 attacks a rested Law of p1's with a 9000 Character; p1 has `life` Life cards. */
    const koLaw = (
      life: string[],
      law = LAW5,
      extraChars: (string | { card: string; rested: boolean })[] = [],
    ) => {
      const g = game(
        { leader: ROSI, characters: [{ card: law, rested: true }, ...extraChars], life },
        { leader: PLAIN_BLUE, characters: [V.c7, V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
      battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', law));
      return g;
    };

    it('battle K.O.: accepting adds the top Life card to hand; Law stays; no [Trigger]', () => {
      const g = koLaw([MONET, PURPLE, PURPLE]);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([LAW5]);
      expect(g.life('p1')).toBe(2);
      expect(hand(g, 'p1')).toEqual([MONET]);
      expectDecision(g, 'main', 'p2');
      expect(g.eventsOfType('ReplacementApplied')).toHaveLength(1);
    });

    it('declining lets the K.O. happen and does not use up the Once Per Turn', () => {
      const g = koLaw([PURPLE, PURPLE, PURPLE]);
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.life('p1')).toBe(3);
    });

    it('is used once per turn: a second K.O. of Law the same turn goes through', () => {
      const g = koLaw([PURPLE, PURPLE, PURPLE], LAW5, [{ card: LAW5, rested: true }]);
      accept(g);
      expect(g.zone('p1', 'characters')).toHaveLength(2);
      battle(g, g.find('p2', 'characters', V.c7, 1), g.find('p1', 'characters', LAW5));
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.zone('p1', 'characters')).toHaveLength(1);
      expect(g.life('p1')).toBe(2);
    });

    it('QA-OP12 OP12-061: with 0 Life cards it cannot be used', () => {
      const g = koLaw([]);
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });

    it('protects EB04-038 Rosinante & Law (also named [Trafalgar Law])', () => {
      const g = koLaw([PURPLE, PURPLE], 'EB04-038');
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['EB04-038']);
    });

    it('does not protect other Characters', () => {
      const g = koLaw([PURPLE, PURPLE], V.c1);
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });
  });

  describe('[Activate: Main] DON!! −1: the next [Trafalgar Law] with a cost of 4 or more costs 2 less', () => {
    const start = () =>
      game(
        {
          leader: ROSI,
          hand: [LAW1, LAW4, LAW5, V.c4],
          costArea: { active: 9, rested: 0 },
        },
        { leader: PLAIN_BLUE },
      );
    const discount = (g: ReturnType<typeof start>) => {
      g.act({ type: 'activate', card: g.leader('p1'), ability: 'law-discount' });
      payDon(g);
    };

    it('applies to the next qualifying Law only', () => {
      const g = start();
      discount(g);
      expect(don(g, 'p1')).toMatchObject({ active: 8, deck: 2 });
      play(g, LAW4);
      decline(g); // ST10-010's own [On Play] DON!! −1 (scripted in M4b wave 2)
      expect(don(g, 'p1').active).toBe(6); // paid 2, not 4
      play(g, LAW5);
      expect(don(g, 'p1').active).toBe(1); // paid the full 5
    });

    it('is not used by a Law that costs 3 or less or by another card', () => {
      const g = start();
      discount(g);
      play(g, LAW1);
      expect(don(g, 'p1').active).toBe(7);
      play(g, V.c4);
      expect(don(g, 'p1').active).toBe(3);
      play(g, LAW5);
      expect(don(g, 'p1').active).toBe(0); // 3 left, paid 5 - 2 = 3
    });

    it('is once per turn', () => {
      const g = start();
      discount(g);
      expect(g.legal().some((a) => a.type === 'activate' && a.ability === 'law-discount')).toBe(
        false,
      );
    });

    it('does not carry over to the next turn', () => {
      const g = start();
      discount(g);
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      const before = don(g, 'p1').active;
      play(g, LAW4);
      expect(before - don(g, 'p1').active).toBe(4); // the full cost
    });
  });
});

void BLUE;
