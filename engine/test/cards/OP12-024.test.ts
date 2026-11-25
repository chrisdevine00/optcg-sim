/** OP12-024 Gyukimaru. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import { koBy, mine, offered, OTHER_LEADER, plantOpponentEffect, theirs } from './helpers-lfa.ts';
import { raiseCost } from './helpers-lfc.ts';

const ID = 'OP12-024';

describe('OP12-024 Gyukimaru', () => {
  describe("if this Character is active, cannot be K.O.'d by your opponent's effects", () => {
    const koIt = (rested: boolean, by: 'p1' | 'p2' = 'p2') => {
      const g = theirs(
        OTHER_LEADER,
        { characters: [{ card: ID, rested }] },
        { leader: PLAIN_BLUE },
      );
      koBy(g, 'p1', ID, by);
      return g.zone('p1', 'characters').length;
    };

    it('active: an opposing effect cannot K.O. him', () => {
      expect(koIt(false)).toBe(1);
    });

    it("rested: he can be K.O.'d (the condition needs him active)", () => {
      expect(koIt(true)).toBe(0);
    });

    it("active but by your own effect: he can be K.O.'d", () => {
      expect(koIt(false, 'p1')).toBe(0);
    });

    it('a real planted opposing K.O. effect is stopped too', () => {
      const g = theirs(OTHER_LEADER, { characters: [ID] }, { leader: PLAIN_BLUE });
      plantOpponentEffect(g, {
        ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
      });
      expect(g.zone('p1', 'characters')).toHaveLength(1);
    });
  });

  describe('[When Attacking] with a total of 3 or more given DON!!, rest up to 1 Character with base cost 6 or less', () => {
    /** p1 attacks the opponent's Leader with Gyukimaru having `own` DON!! and the Leader `leaderDon`. */
    const attack = (own: number, leaderDon: number, p2: string[] = [V.c6, V.c7, V.c3]) => {
      const g = mine(
        { card: OTHER_LEADER, don: leaderDon },
        { characters: [{ card: ID, don: own }] },
        { characters: p2 },
        5,
      );
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      return g;
    };
    const restedOf = (g: ReturnType<typeof attack>, card: string) =>
      g.card(g.find('p2', 'characters', card)).rested;

    it('3 DON!! on Gyukimaru: base cost 6 and 3 can be chosen, base cost 7 cannot', () => {
      const g = attack(3, 0);
      expectDecision(g, 'choose', 'p1');
      expect(offered(g).sort()).toEqual(
        [g.find('p2', 'characters', V.c6), g.find('p2', 'characters', V.c3)].sort(),
      );
      pick(g, [g.find('p2', 'characters', V.c6)]);
      expect(restedOf(g, V.c6)).toBe(true);
      expect(restedOf(g, V.c7)).toBe(false);
    });

    it('the total counts your Leader and your other Characters: 1 on the Leader and 2 on him is 3', () => {
      const g = attack(2, 1);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(restedOf(g, V.c3)).toBe(true);
    });

    it('boundary: a total of 2 given DON!! does nothing (the ability fires, nothing is asked)', () => {
      const g = attack(1, 1);
      expectDecision(g, 'block', 'p2');
      expect(restedOf(g, V.c6)).toBe(false);
    });

    it('"up to 1": it can be declined', () => {
      const g = attack(3, 0);
      none(g);
      expect(restedOf(g, V.c6)).toBe(false);
      expect(dec(g)?.kind).toBe('block');
    });

    it('LF-R3: the BASE cost is read, not the current one (a raised 6 is in, a lowered 7 is out)', () => {
      const g = mine(
        OTHER_LEADER,
        { characters: [{ card: ID, don: 3 }] },
        { characters: [V.c6, V.c7] },
        5,
      );
      raiseCost(g, g.find('p2', 'characters', V.c6), 2); // current 8, base 6
      raiseCost(g, g.find('p2', 'characters', V.c7), -2); // current 5, base 7
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      expect(offered(g)).toEqual([g.find('p2', 'characters', V.c6)]);
    });

    it('only opposing Characters: your own are not offered', () => {
      const g = mine(
        OTHER_LEADER,
        { characters: [{ card: ID, don: 3 }, V.c1] },
        { characters: [V.c6] },
        5,
      );
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      expect(offered(g)).toEqual([g.find('p2', 'characters', V.c6)]);
    });
  });
});
