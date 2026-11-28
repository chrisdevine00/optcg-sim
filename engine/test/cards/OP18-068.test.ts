/** OP18-068 Senor Pink. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, none, payDon, pick, play, V } from './helpers.ts';
import { candidates, koByEffect } from './helpers-a10g1.ts';
import { canAttack } from './helpers-op16g1.ts';
import { mine } from './helpers-op18-g3.ts';

const ID = 'OP18-068';
const COST8 = 'OP14-101'; // {Giant} cost 8, 10000

describe('OP18-068 Senor Pink', () => {
  describe("[Once Per Turn] if this Character would be K.O.'d, you may DON!! −1 instead", () => {
    const start = () => mine({ characters: [ID, V.c2], costArea: { active: 3, rested: 0 } }, {});

    it('returns 1 DON!! to the DON!! deck and the Character stays', () => {
      const g = start();
      koByEffect(g, 'p1', ID);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      payDon(g);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ID);
      expect(g.zone('p1', 'trash')).toHaveLength(0);
      expect(don(g, 'p1').deck).toBe(8);
    });

    it("declining lets it be K.O.'d and keeps the DON!!", () => {
      const g = start();
      koByEffect(g, 'p1', ID);
      decline(g);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c2]);
      expect(don(g, 'p1').deck).toBe(7);
    });

    it('Once Per Turn: a second K.O. in the same turn is not replaced', () => {
      const g = start();
      koByEffect(g, 'p1', ID);
      accept(g);
      payDon(g);
      koByEffect(g, 'p1', ID);
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c2]);
    });

    it('without a DON!! on the field it cannot be paid: the K.O. happens', () => {
      const g = mine({ characters: [ID], costArea: { active: 0, rested: 0 } }, {});
      koByEffect(g, 'p1', ID);
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });

    it('does not protect another Character', () => {
      const g = start();
      koByEffect(g, 'p1', V.c2);
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    });
  });

  describe('[On Play] DON!! −1: up to 1 Character with a cost of 7 or less cannot be rested', () => {
    const start = () =>
      mine(
        { hand: [ID], costArea: { active: 10, rested: 0 } },
        { characters: [V.c7, COST8, V.c3] },
      );
    const attackable = (g: ReturnType<typeof start>, card: string) => {
      g.act({ type: 'endTurn' });
      return canAttack(g, g.find('p2', 'characters', card), g.leader('p1'));
    };

    it("the chosen Character cannot attack (it cannot be rested) until the end of your opponent's next End Phase", () => {
      const g = start();
      play(g, ID);
      accept(g);
      payDon(g);
      expect(candidates(g).sort()).toEqual(
        [g.find('p2', 'characters', V.c7), g.find('p2', 'characters', V.c3)].sort(),
      );
      pick(g, [g.find('p2', 'characters', V.c7)]);
      expect(attackable(g, V.c7)).toBe(false);
      expect(canAttack(g, g.find('p2', 'characters', V.c3), g.leader('p1'))).toBe(true);
      expect(canAttack(g, g.find('p2', 'characters', COST8), g.leader('p1'))).toBe(true);
    });

    it('"up to 1": may choose nothing', () => {
      const g = start();
      play(g, ID);
      accept(g);
      payDon(g);
      none(g);
      expect(attackable(g, V.c7)).toBe(true);
    });

    it('declining the DON!! −1 restricts nothing', () => {
      const g = start();
      play(g, ID);
      decline(g);
      expect(don(g, 'p1').deck).toBe(0);
      expect(attackable(g, V.c7)).toBe(true);
    });
  });
});
