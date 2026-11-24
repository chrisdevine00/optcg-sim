/** OP12-070 Sanji. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, dec, don, expectDecision, V } from './helpers.ts';
import { EVENT, ids, mine, opp, plantOpponentEffect, rep } from './helpers-op12g2.ts';
import { pick } from './helpers.ts';

const ID = 'OP12-070';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

describe('OP12-070 Sanji', () => {
  describe('+1000 power for every 5 Events in your trash', () => {
    const power = (events: number, others = 0) => {
      const g = mine({ characters: [ID], trash: [...rep(events, EVENT), ...rep(others, V.c1)] });
      return g.card(g.find('p1', 'characters', ID)).power;
    };

    it('steps at 5, 10 and 15 Events (base 5000)', () => {
      expect(power(0)).toBe(5000);
      expect(power(5)).toBe(6000);
      expect(power(10)).toBe(7000);
      expect(power(15)).toBe(8000);
    });

    it('boundary: 4, 9 and 14 Events give nothing more, and other cards are not counted', () => {
      expect(power(4)).toBe(5000);
      expect(power(9)).toBe(6000);
      expect(power(14)).toBe(7000);
      expect(power(4, 12)).toBe(5000);
    });
  });

  describe("replacement: if removed by your opponent's effect, you may return 1 DON!! card from your field to your DON!! deck instead", () => {
    const byOpponent = (active = 2, rested = 0) => {
      const g = mine({ characters: [ID] }, {}, opp, active, rested);
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', ID)]);
      return g;
    };

    it('returning 1 DON!! keeps Sanji on the field', () => {
      const g = byOpponent();
      expectDecision(g, 'optional', 'p1');
      accept(g);
      // The DON!! to return may be asked for; take whatever is offered.
      while (dec(g)?.kind === 'choose') g.act(g.legal().find((a) => a.type === 'pick')!);
      expect(ids(g, 'p1', 'characters')).toEqual([ID]);
      expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 0 });
    });

    it('declining lets the K.O. happen and keeps the DON!!', () => {
      const g = byOpponent();
      decline(g);
      expect(ids(g, 'p1', 'characters')).toEqual([]);
      expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
    });

    it('a rested DON!! may be the one returned', () => {
      const g = byOpponent(0, 1);
      accept(g);
      while (dec(g)?.kind === 'choose') g.act(g.legal().find((a) => a.type === 'pick')!);
      expect(ids(g, 'p1', 'characters')).toEqual([ID]);
      expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0 });
    });

    it('with no DON!! on the field the replacement is not offered', () => {
      const g = byOpponent(0, 0);
      expect(dec(g)?.kind).not.toBe('optional');
      expect(ids(g, 'p1', 'characters')).toEqual([]);
    });

    it("must not apply to your own effects, and is not tied to the opponent's turn", () => {
      const own = mine({ characters: [ID] }, {}, opp);
      own.state = applyOp(own.state, {
        op: 'ko',
        card: own.find('p1', 'characters', ID),
        by: 'p1',
      }).state;
      expect(ids(own, 'p1', 'characters')).toEqual([]);

      // An effect of the opponent on your own turn is replaced too (no [Opponent's Turn] tag).
      const g = mine({ characters: [ID] });
      g.state = applyOp(g.state, {
        op: 'ko',
        card: g.find('p1', 'characters', ID),
        by: 'p2',
      }).state;
      expectDecision(g, 'optional', 'p1');
    });
  });
});
