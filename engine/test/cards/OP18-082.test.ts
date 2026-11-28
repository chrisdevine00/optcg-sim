/** OP18-082 Catarina Devon. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, hand, pick, trash, V } from './helpers.ts';
import { koByEffect } from './helpers-a10g1.ts';
import { mine, TEACH_L } from './helpers-op18-g3.ts';

const ID = 'OP18-082';

describe('OP18-082 Catarina Devon', () => {
  describe("[When Attacking] base power becomes the same as your opponent's Leader's power during this turn", () => {
    const attack = (chars: (string | { card: string; don?: number })[]) => {
      const g = mine({ characters: chars }, {});
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      return g;
    };

    it("3000 becomes 5000 (the opponent's Leader power)", () => {
      const g = mine({ characters: [ID] }, {});
      expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
    });

    it('it is the base power: DON!! given to Catarina still add on top', () => {
      const g = attack([{ card: ID, don: 1 }]);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    });

    it('it lasts the whole turn', () => {
      const g = attack([ID]);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
    });
  });

  describe('[On K.O.] you may trash 1 card from your hand: if your Leader has the {Blackbeard Pirates} type, play this Character from your trash rested', () => {
    const koed = (leader: string, handCards = [BLUE, V.c2]) => {
      const g = mine({ leader, characters: [ID], hand: handCards }, {});
      koByEffect(g, 'p1', ID);
      return g;
    };

    it('plays it rested', () => {
      const g = koed(TEACH_L);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
      expect(trash(g, 'p1')).toEqual([BLUE]);
    });

    it('with another Leader the card is still trashed but nothing is played', () => {
      const g = koed('ST04-001');
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g, 'p1').sort()).toEqual([BLUE, ID].sort());
    });

    it('declining keeps the hand and leaves it in the trash', () => {
      const g = koed(TEACH_L);
      decline(g);
      expect(hand(g, 'p1')).toHaveLength(2);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });

    it('with no card in hand the cost cannot be paid', () => {
      const g = koed(TEACH_L, []);
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });
  });
});
