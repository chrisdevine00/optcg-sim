/** OP13-099 The Empty Throne. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, don, none, pick, PLAIN_PURPLE, V } from './helpers.ts';
import { activate } from './helpers-w3s.ts';
import { canActivate, canPick, FE4, FE7, mine, names, rep, theirs } from './helpers-op13g4.ts';

const ID = 'OP13-099';

describe('OP13-099 The Empty Throne', () => {
  describe('[Your Turn] Leader power', () => {
    it('with 19 cards in trash the Leader gains +1000 on your turn', () => {
      const g = mine({ leader: PLAIN_PURPLE, stage: ID, trash: rep(19, V.c1) });
      expect(g.power(g.leader('p1'))).toBe(6000);
    });

    it('with 18 cards in trash it does not (threshold is exactly 19)', () => {
      const g = mine({ leader: PLAIN_PURPLE, stage: ID, trash: rep(18, V.c1) });
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it("on the opponent's turn it does not apply", () => {
      const g = theirs({ leader: PLAIN_PURPLE, stage: ID, trash: rep(19, V.c1) });
      expect(g.power(g.leader('p1'))).toBe(5000);
    });
  });

  describe('[Activate: Main]', () => {
    const run = (active: number, hand: string[], rested = 0) =>
      mine({ leader: PLAIN_PURPLE, stage: ID, hand }, {}, active, rested);

    it('rests itself and 3 DON!!: plays a black {Five Elders} Character with cost <= DON!! on the field', () => {
      const g = run(5, [FE4, FE7, V.c1]);
      activate(g, g.find('p1', 'stage', ID), 'activate');
      expect(canPick(g, g.find('p1', 'hand', FE4))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', FE7))).toBe(false);
      expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false);
      pick(g, [g.find('p1', 'hand', FE4)]);
      expect(names(g, 'p1', 'characters')).toEqual([FE4]);
      expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
      expect(don(g, 'p1').rested).toBe(3);
    });

    it('rested and given DON!! count too: 7 DON!! on the field allows a cost 7 Character', () => {
      const g = run(5, [FE7], 2);
      activate(g, g.find('p1', 'stage', ID), 'activate');
      pick(g, [g.find('p1', 'hand', FE7)]);
      expect(names(g, 'p1', 'characters')).toEqual([FE7]);
    });

    it('exactly equal cost is allowed (cost 4 with 4 DON!!)', () => {
      const g = run(4, [FE4]);
      activate(g, g.find('p1', 'stage', ID), 'activate');
      pick(g, [g.find('p1', 'hand', FE4)]);
      expect(names(g, 'p1', 'characters')).toEqual([FE4]);
    });

    it('"up to 1": may play nothing; the cost is still paid', () => {
      const g = run(5, [FE4]);
      activate(g, g.find('p1', 'stage', ID), 'activate');
      none(g);
      expect(names(g, 'p1', 'characters')).toEqual([]);
      expect(don(g, 'p1').rested).toBe(3);
    });

    it('not offered with only 2 active DON!!, or when the Stage is already rested', () => {
      const g = run(2, [FE4]);
      expect(canActivate(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
      const h = mine({ leader: PLAIN_PURPLE, stage: { card: ID, rested: true }, hand: [BLUE] });
      expect(canActivate(h, h.find('p1', 'stage', ID), 'activate')).toBe(false);
      void dec;
    });
  });
});
