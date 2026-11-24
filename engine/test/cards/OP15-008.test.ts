/** OP15-008 Krieg (Character). */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, V, addMost, don, expectDecision, option, pick, play } from './helpers.ts';
import { activate, offeredAb } from './helpers-w3s.ts';
import { choices, mk } from './helpers-w4sa.ts';

const ID = 'OP15-008';

describe('OP15-008 Krieg', () => {
  describe('[On Play] give up to 3 rested DON!! to 1 Character, then Rush', () => {
    const start = (restedDon = 4, chars: unknown[] = [BLUE, PURPLE]) =>
      mk(
        { hand: [ID] },
        { characters: chars as never, costArea: { active: 0, rested: restedDon } },
      );
    const canAttack = (g: ReturnType<typeof start>) =>
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ID));

    it('asks a count (most first) then a Character, gives that many, and grants Rush', () => {
      const g = start();
      play(g, ID);
      const d = expectDecision(g, 'choose', 'p1');
      expect(d.options!.map((o) => o.id)).toEqual(['3', '2', '1', '0']);
      option(g, '3');
      pick(g, [g.find('p2', 'characters', BLUE)]);
      expect(g.card(g.find('p2', 'characters', BLUE)).don).toBe(3);
      expect(don(g, 'p2')).toMatchObject({ rested: 1, given: 3 });
      expect(canAttack(g)).toBe(true);
    });

    it('with only 2 rested DON!! the count tops out at 2', () => {
      const g = start(2);
      play(g, ID);
      expect(expectDecision(g, 'choose').options!.map((o) => o.id)).toEqual(['2', '1', '0']);
      addMost(g, 0);
      option(g, '2');
      pick(g, [g.find('p2', 'characters', PURPLE)]);
      expect(don(g, 'p2')).toMatchObject({ rested: 0, given: 2 });
    });

    it('a count of 0 gives nothing, and Rush is still granted (Then, not "if you do")', () => {
      const g = start();
      play(g, ID);
      option(g, '0');
      expect(don(g, 'p2')).toMatchObject({ rested: 4, given: 0 });
      expect(canAttack(g)).toBe(true);
    });

    it('with no rested DON!! nothing is asked or given, and Rush is granted', () => {
      const g = start(0);
      play(g, ID);
      expect(g.card(g.find('p2', 'characters', BLUE)).don).toBe(0);
      expect(canAttack(g)).toBe(true);
    });

    it('without it the Character has no Rush (a played Character cannot attack): the grant is the only source', () => {
      const g = mk({ hand: ['OP03-023'] }, { characters: [BLUE] });
      play(g, 'OP03-023');
      expect(
        g
          .legal()
          .some(
            (a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', 'OP03-023'),
          ),
      ).toBe(false);
    });
  });

  describe('[Activate: Main] [Once Per Turn] -1000 for every DON!! given to that Character', () => {
    // Opponent Characters: 2 DON!!, 1 DON!!, none.
    const chars = [{ card: BLUE, don: 2 }, { card: V.c2, don: 1 }, PURPLE];
    const power = (g: ReturnType<typeof mk>, c: string) => g.power(g.find('p2', 'characters', c));

    it('played this turn: each opposing Character gets -1000 per DON!! given to it', () => {
      const g = mk({ hand: [ID] }, { characters: chars as never });
      play(g, ID);
      activate(g, g.find('p1', 'characters', ID), 'shrink');
      expect([power(g, BLUE), power(g, V.c2), power(g, PURPLE)]).toEqual([1000, 3000, 3000]);
    });

    it('it is Once Per Turn', () => {
      const g = mk({ hand: [ID] }, { characters: chars as never });
      play(g, ID);
      activate(g, g.find('p1', 'characters', ID), 'shrink');
      expect(offeredAb(g, g.find('p1', 'characters', ID), 'shrink')).toBe(false);
    });

    it('not played this turn: nothing happens (the If is an effect condition)', () => {
      const g = mk({ characters: [ID] }, { characters: chars as never });
      activate(g, g.find('p1', 'characters', ID), 'shrink');
      expect([power(g, BLUE), power(g, V.c2), power(g, PURPLE)]).toEqual([3000, 4000, 3000]);
      expect(offeredAb(g, g.find('p1', 'characters', ID), 'shrink')).toBe(false);
    });

    it('the On Play DON!! count into the Activate (3 given, then -3000)', () => {
      const g = mk(
        { hand: [ID] },
        { characters: [BLUE] as never, costArea: { active: 0, rested: 3 } },
      );
      play(g, ID);
      option(g, '3');
      expect(choices(g)).toEqual([]);
      activate(g, g.find('p1', 'characters', ID), 'shrink');
      expect(power(g, BLUE)).toBe(0);
    });
  });
});
