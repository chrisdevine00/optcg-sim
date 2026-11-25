/** OP10-071 Donquixote Doflamingo. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  decline,
  dec,
  don,
  expectDecision,
  none,
  payDon,
  pick,
  play,
  V,
} from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { DP4, DP5, DP6, finishBattle, mk } from './helpers-a10g2.ts';

const ID = 'OP10-071';

describe('OP10-071 Donquixote Doflamingo', () => {
  describe('[On Play] DON!! -1: play up to 1 {Donquixote Pirates} Character with a cost of 5 or less from your hand', () => {
    const start = (handCards = [DP4, DP5, DP6, V.c3]) => mk({ hand: [ID, ...handCards] });

    it('plays the chosen Character for free and returns 1 DON!!', () => {
      const g = start();
      play(g, ID);
      accept(g);
      payDon(g);
      pick(g, [g.find('p1', 'hand', DP5)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, DP5]);
      expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 8, deck: 1 });
      expectDecision(g, 'main', 'p1');
    });

    it('boundary: cost 4 and 5 are candidates, cost 6 and a non-{Donquixote Pirates} Character are not', () => {
      const g = start();
      play(g, ID);
      accept(g);
      payDon(g);
      expect(canPick(g, g.find('p1', 'hand', DP4))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', DP5))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', DP6))).toBe(false);
      expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
    });

    it('"up to 1": may play nothing (the DON!! is still returned)', () => {
      const g = start();
      play(g, ID);
      accept(g);
      payDon(g);
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(1);
      expect(don(g, 'p1').deck).toBe(1);
    });

    it('"You may"-less cost is optional: declining returns no DON!! and plays nothing', () => {
      const g = start();
      play(g, ID);
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(1);
      expect(don(g, 'p1').deck).toBe(0);
    });
  });

  describe("[On Your Opponent's Attack] [Once Per Turn] rest 1 DON!!: add up to 1 DON!! and set it as active", () => {
    const start = (p1: Parameters<typeof mk>[0] = {}) => {
      const g = mk(
        { characters: [ID], costArea: { active: 4, rested: 0 }, ...p1 },
        { characters: [V.c7, V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
      return g;
    };

    it('rests 1 of your DON!!, then adds 1 DON!! from the DON!! deck as active', () => {
      const g = start();
      expectDecision(g, 'optional', 'p1');
      accept(g);
      payDon(g);
      addMost(g);
      expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1, deck: 5 });
    });

    it('"up to 1": may add none', () => {
      const g = start();
      accept(g);
      payDon(g);
      expectDecision(g, 'choose', 'p1');
      g.act({ type: 'pick', choice: { option: '0' } });
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, deck: 6 });
    });

    it('"You may": declining rests nothing and adds nothing', () => {
      const g = start();
      decline(g);
      expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 0, deck: 6 });
    });

    it('with an empty DON!! deck the DON!! is rested and nothing is added', () => {
      const g = start({ costArea: { active: 10, rested: 0 } });
      accept(g);
      payDon(g);
      expect(dec(g)?.kind).not.toBe('choose');
      expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1, deck: 0 });
    });

    it('[Once Per Turn]: a second attack the same turn does not offer it', () => {
      const g = start();
      accept(g);
      payDon(g);
      addMost(g);
      finishBattle(g);
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c7, 1),
        target: g.leader('p1'),
      });
      expect(dec(g)?.kind).not.toBe('optional');
    });

    it('must not fire on your own attack, or without an active DON!!', () => {
      const g = mk({ characters: [ID], costArea: { active: 4, rested: 0 } }, {});
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      expect(dec(g)?.kind).not.toBe('optional');
      const h = start({ costArea: { active: 0, rested: 3 } });
      expect(dec(h)?.kind).not.toBe('optional');
    });
  });
});
