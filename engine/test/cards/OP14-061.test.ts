/** OP14-061 Vergo. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, pick, V } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { DQ3, DQ_LEADER, mine } from './helpers-op14g2.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';

const ID = 'OP14-061';

describe('OP14-061 Vergo', () => {
  describe('[When Attacking] DON!! -1: -2000 power', () => {
    const start = (don = 3) =>
      mine(
        DQ_LEADER,
        { characters: [ID], costArea: { active: don, rested: 0 } },
        { characters: [V.c5, V.c2] },
      );
    const attack = (g: ReturnType<typeof start>) =>
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

    it('returns 1 DON!! and gives up to 1 opposing Character -2000 this turn', () => {
      const g = start();
      attack(g);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p2', 'characters', V.c5)]);
      expect(g.power(g.find('p2', 'characters', V.c5))).toBe(5000);
      expect(g.power(g.find('p2', 'characters', V.c2))).toBe(4000);
      expect(don(g, 'p1').active).toBe(2);
    });

    it('declining the cost gives no power and keeps the DON!!', () => {
      const g = start();
      attack(g);
      decline(g);
      expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
      expect(don(g, 'p1').active).toBe(3);
    });

    it('with no DON!! on the field the cost cannot be paid: nothing is offered', () => {
      const g = start(0);
      attack(g);
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    });
  });

  describe('replacement: opponent’s effect would remove your {Donquixote Pirates} Character', () => {
    const start = (chars: string[]) =>
      mine(
        DQ_LEADER,
        { characters: chars, costArea: { active: 3, rested: 0 } },
        {},
        { turn: 4, activePlayer: 'p2' },
      );
    const koAll = (g: ReturnType<typeof start>, filter: object = { type: 'Donquixote Pirates' }) =>
      plantOpponentEffect(g, { ko: { from: 'characters', owner: 'opponent', filter } });

    it('you may return 1 DON!! to the DON!! deck instead: the Character stays', () => {
      const g = start([ID, DQ3]);
      koAll(g, { name: 'Bellamy' });
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([DQ3, ID].sort());
      expect(g.zone('p1', 'trash')).toHaveLength(0);
      expect(don(g, 'p1').active).toBe(2);
    });

    it('declining lets the K.O. happen and keeps the DON!!', () => {
      const g = start([ID, DQ3]);
      koAll(g, { name: 'Bellamy' });
      decline(g);
      expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
      expect(don(g, 'p1').active).toBe(3);
    });

    it('Once Per Turn: the shield is offered once; a second removal the same turn is not', () => {
      const g = start([ID, DQ3]);
      koAll(g, { name: 'Bellamy' });
      accept(g);
      expect(cardsOf(g, 'p1', 'characters')).toHaveLength(2);
      koAll(g, { name: 'Bellamy' }); // the same turn, a second removal
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
      expect(don(g, 'p1').active).toBe(2); // only one DON!! was returned
    });

    it('a Character that is not {Donquixote Pirates} is not protected (nothing is offered)', () => {
      const g = start([ID, V.c1]);
      koAll(g, { name: 'Blugori' });
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('no DON!! on the field: the shield cannot be paid, the K.O. happens', () => {
      const g = mine(
        DQ_LEADER,
        { characters: [ID, DQ3], costArea: { active: 0, rested: 0 } },
        {},
        { turn: 4, activePlayer: 'p2' },
      );
      koAll(g, { name: 'Bellamy' });
      expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('your own effect is not replaced: only the opponent’s effect counts', () => {
      const g = mine(DQ_LEADER, { characters: [ID, DQ3, V.c1] }, {});
      // p1's own planted K.O. on its Bellamy.
      plantOwn(g);
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(cardsOf(g, 'p1', 'characters')).not.toContain(DQ3);
    });
  });
});

import { plantAndRun } from './helpers-op14g2.ts';
import type { TestGame } from '../fixtures/index.ts';

function plantOwn(g: TestGame): void {
  plantAndRun(g, 'OP02-084', 'p1', [
    { do: { ko: { from: 'characters', owner: 'you', filter: { name: 'Bellamy' } } } },
  ]);
}
