/** OP15-050 Bobby Funk. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { KELLY, mine, OTHER_LEADER } from './helpers-op15g2.ts';

const ID = 'OP15-050';

describe('OP15-050 Bobby Funk', () => {
  const power = (chars: string[], opp: string[] = [], hand: string[] = []) => {
    const g = mine(OTHER_LEADER, { characters: chars, hand }, { characters: opp });
    return g.power(g.find('p1', 'characters', ID));
  };

  it('with [Kelly Funk] on your field this Character gains +3000 (base 3000)', () => {
    expect(power([ID, KELLY])).toBe(6000);
  });

  it('without [Kelly Funk] it stays at its printed 3000', () => {
    expect(power([ID, V.c1])).toBe(3000);
    expect(power([ID])).toBe(3000);
  });

  it('an opposing [Kelly Funk] does not count (you must have it)', () => {
    expect(power([ID], [KELLY])).toBe(3000);
  });

  it('a [Kelly Funk] in hand does not count', () => {
    expect(power([ID], [], [KELLY])).toBe(3000);
  });
});
