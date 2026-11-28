/** OP18-071 Trebol. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-a10g1.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { BUFFALO, mine, SUGAR_L, theirs } from './helpers-op18-g3.ts';

const ID = 'OP18-071';

describe('OP18-071 Trebol', () => {
  describe("replacement: your opponent's effect would remove your {Donquixote Pirates} Character", () => {
    const start = (chars: string[]) =>
      theirs({ characters: chars, costArea: { active: 3, rested: 0 } }, {});
    const koDp = (g: ReturnType<typeof start>, filter: object = { type: 'Donquixote Pirates' }) =>
      plantOpponentEffect(g, { ko: { from: 'characters', owner: 'opponent', filter } });

    it('you may DON!! −1 instead: the Character stays', () => {
      const g = start([ID, BUFFALO]);
      koDp(g, { name: 'Buffalo' });
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([BUFFALO, ID].sort());
      expect(don(g, 'p1').deck).toBe(8);
    });

    it('it covers Trebol himself', () => {
      const g = start([ID]);
      koDp(g);
      accept(g);
      expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('declining lets the K.O. happen and keeps the DON!!', () => {
      const g = start([ID, BUFFALO]);
      koDp(g, { name: 'Buffalo' });
      decline(g);
      expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
      expect(don(g, 'p1').deck).toBe(7);
    });

    it('Once Per Turn: the second removal in the turn is not replaced', () => {
      const g = start([ID, BUFFALO]);
      koDp(g, { name: 'Buffalo' });
      accept(g);
      koDp(g, { name: 'Buffalo' });
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('a Character that is not {Donquixote Pirates} is not covered', () => {
      const g = start([ID, V.c1]);
      koDp(g, { not: { type: 'Donquixote Pirates' } });
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    });
  });

  describe("[Opponent's Turn] if your Leader is [Sugar]: [Blocker] and +2000 power", () => {
    const canBlock = (g: ReturnType<typeof theirs>) => {
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c5),
        target: g.leader('p1'),
      });
      return g
        .legal()
        .some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID));
    };

    it("on your opponent's turn with a [Sugar] Leader: 8000 power and it can block", () => {
      const g = theirs({ leader: SUGAR_L, characters: [ID] }, { characters: [V.c5] });
      expect(g.power(g.find('p1', 'characters', ID))).toBe(8000);
      expect(canBlock(g)).toBe(true);
    });

    it('with another Leader: 6000 power and no [Blocker]', () => {
      const g = theirs({ characters: [ID] }, { characters: [V.c5] });
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
      expect(canBlock(g)).toBe(false);
    });

    it('on your own turn nothing applies', () => {
      const g = mine({ leader: SUGAR_L, characters: [ID] }, {});
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    });
  });
});
