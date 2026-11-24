/** OP15-015 Higuma. */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, V, don, expectDecision, none, pick, play } from './helpers.ts';
import { choices, mk } from './helpers-w4sa.ts';

const ID = 'OP15-015';

describe('OP15-015 Higuma', () => {
  const start = (restedDon = 2, chars: unknown[] = [PURPLE, { card: BLUE, don: 1 }]) =>
    mk({ hand: [ID] }, { characters: chars as never, costArea: { active: 0, rested: restedDon } });

  it('gives a rested DON!! to a Character, then -1000 to a Character with a DON!! given (the one just given to counts)', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ rested: 1, given: 2 });
    // Both Characters now hold a DON!!: -1000 may go to either.
    expect(choices(g).sort()).toEqual(
      [g.find('p2', 'characters', PURPLE), g.find('p2', 'characters', BLUE)].sort(),
    );
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect(g.power(g.find('p2', 'characters', PURPLE))).toBe(2000);
    expect(g.power(g.find('p2', 'characters', BLUE))).toBe(3000);
  });

  it('"up to 1": declining the give still lets the -1000 be chosen among Characters already holding a DON!!', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
    expect(choices(g)).toEqual([g.find('p2', 'characters', BLUE)]);
    pick(g, [g.find('p2', 'characters', BLUE)]);
    expect(g.power(g.find('p2', 'characters', BLUE))).toBe(2000);
  });

  it('with no rested DON!! nothing is given, and the -1000 is still available (Then, not "if you do")', () => {
    const g = start(0);
    play(g, ID);
    expect(choices(g)).toEqual([g.find('p2', 'characters', BLUE)]);
    pick(g, [g.find('p2', 'characters', BLUE)]);
    expect(g.power(g.find('p2', 'characters', BLUE))).toBe(2000);
    expect(don(g, 'p2').given).toBe(1);
  });

  it('must not give the -1000 to a Character with no DON!! given', () => {
    const g = start(0, [PURPLE, V.c1]);
    play(g, ID);
    expect(g.power(g.find('p2', 'characters', PURPLE))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('the DON!! given return to the opponent’s cost area at their Refresh Phase', () => {
    const g = start(1, [PURPLE]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    none(g); // the -1000 (up to 1) is declined
    g.act({ type: 'endTurn' });
    // Refresh Phase (CR 6-2-3): the given DON!! return to their owner's cost area.
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(0);
    expect(g.power(g.find('p2', 'characters', PURPLE))).toBe(3000);
    expect(don(g, 'p2')).toMatchObject({ given: 0 });
  });
});
