/** OP16-104 Catarina Devon. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import { BB_4, names, RED_1 } from './helpers-op16g4.ts';
import { damageWith } from './triggers.ts';

const ID = 'OP16-104';
const AVALO = 'OP16-102'; // {Blackbeard Pirates}, cost 1 ([On K.O.] only)

const attackWith = (opp: string[]) => {
  const g = game({ leader: PLAIN_BLUE, characters: [ID] }, { leader: PLAIN_BLUE, characters: opp });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('OP16-104 Catarina Devon', () => {
  describe('[When Attacking]', () => {
    it("base power becomes the selected opposing Character's power during this turn", () => {
      const g = attackWith([V.c7, V.c1]);
      pick(g, [g.find('p2', 'characters', V.c7)]);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(9000);
    });

    it('a lower selected power lowers it too ("becomes the same")', () => {
      const g = attackWith([V.c1]);
      pick(g, [g.find('p2', 'characters', V.c1)]);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
      const g2 = attackWith([RED_1]);
      pick(g2, [g2.find('p2', 'characters', RED_1)]);
      expect(g2.power(g2.find('p1', 'characters', ID))).toBe(3000);
    });

    it('"up to 1": selecting nothing leaves the power unchanged', () => {
      const g = attackWith([V.c7]);
      none(g);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
    });

    it('must not fire the selection with no opposing Character (no choice is asked)', () => {
      const g = attackWith([]);
      expectDecision(g, 'block', 'p2');
      expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
    });
  });

  describe('[Trigger]', () => {
    it('draws 1 and plays a {Blackbeard Pirates} Character with cost 1 from the trash', () => {
      const g = damageWith(ID, {
        leader: PLAIN_BLUE,
        trash: [AVALO, BB_4, V.c1],
        deck: [V.c2, V.c3],
      });
      g.act({ type: 'trigger', activate: true });
      expect(hand(g, 'p1')).toEqual([V.c2]);
      // Only the cost 1 Blackbeard Pirates Character is offered (not the cost 4 one, nor the other type).
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
      pick(g, [g.find('p1', 'trash', AVALO)]);
      expect(names(g, 'p1', 'characters')).toEqual([AVALO]);
    });
  });
});
