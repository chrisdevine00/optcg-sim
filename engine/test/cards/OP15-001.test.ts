/** OP15-001 Krieg (Leader). */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, V, expectDecision, none, pick } from './helpers.ts';
import { activate, offeredAb } from './helpers-w3s.ts';
import { choices, EB1, EB5, mk } from './helpers-w4sa.ts';

const ID = 'OP15-001';

describe('OP15-001 Krieg', () => {
  describe("[DON!! x1] [Opponent's Turn] -2000 to all opposing Characters", () => {
    // p2's turn 4: p2's Characters are the ones reduced.
    const start = (p1: object = {}, don = 1) =>
      mk(
        {
          leader: { card: ID, don },
          characters: [EB1, EB5],
          costArea: { active: 9, rested: 0 },
          ...p1,
        },
        { characters: [BLUE, V.c3] },
      );
    const turn = (g: ReturnType<typeof start>) => {
      g.act({ type: 'endTurn' });
      return g;
    };
    const powers = (g: ReturnType<typeof start>) =>
      [BLUE, V.c3].map((c) => g.power(g.find('p2', 'characters', c)));

    it('gives every opposing Character -2000 on the opponent’s turn', () => {
      const g = turn(start());
      expect(powers(g)).toEqual([1000, 3000]);
    });

    it('does nothing on your own turn', () => {
      expect(powers(start())).toEqual([3000, 5000]);
    });

    it('needs 1 DON!! given to the Leader', () => {
      expect(powers(turn(start({}, 0)))).toEqual([3000, 5000]);
    });

    it('is off while a Character that is not {East Blue} is on your field', () => {
      expect(powers(turn(start({ characters: [EB1, BLUE] })))).toEqual([3000, 5000]);
    });

    it('is off with no Characters at all (the only Characters are none)', () => {
      expect(powers(turn(start({ characters: [] })))).toEqual([3000, 5000]);
    });

    it('is on with a single {East Blue} Character', () => {
      expect(powers(turn(start({ characters: [EB1] })))).toEqual([1000, 3000]);
    });
  });

  describe('[Activate: Main] [Once Per Turn] rest a Character with 2 or more DON!! given', () => {
    const start = () =>
      mk(
        { leader: ID },
        {
          characters: [
            { card: BLUE, don: 2 },
            { card: PURPLE, don: 1 },
            V.c1,
            { card: V.c2, don: 3 },
          ],
        },
      );

    it('offers only Characters with 2 or more DON!! given (exact boundary 2)', () => {
      const g = start();
      activate(g, g.leader('p1'), 'rest');
      expectDecision(g, 'choose', 'p1');
      expect(choices(g).sort()).toEqual(
        [g.find('p2', 'characters', BLUE), g.find('p2', 'characters', V.c2)].sort(),
      );
    });

    it('rests the chosen Character, and is Once Per Turn', () => {
      const g = start();
      activate(g, g.leader('p1'), 'rest');
      pick(g, [g.find('p2', 'characters', BLUE)]);
      expect(g.card(g.find('p2', 'characters', BLUE)).rested).toBe(true);
      expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
      expect(offeredAb(g, g.leader('p1'), 'rest')).toBe(false);
    });

    it('"up to 1" allows resting nothing', () => {
      const g = start();
      activate(g, g.leader('p1'), 'rest');
      none(g);
      expect(g.card(g.find('p2', 'characters', BLUE)).rested).toBe(false);
    });

    it('with no such Character the pick is asked at max 0 and nothing rests', () => {
      const g = mk({ leader: ID }, { characters: [{ card: PURPLE, don: 1 }] });
      activate(g, g.leader('p1'), 'rest');
      expect(g.card(g.find('p2', 'characters', PURPLE)).rested).toBe(false);
    });
  });
});
