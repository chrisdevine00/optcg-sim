/** OP15-006 Cavendish. */
import { describe, expect, it } from 'vitest';
import { times } from './helpers.ts';
import { BOBBY, DR, EVENT, mk } from './helpers-op15g1.ts';

const ID = 'OP15-006';

describe('OP15-006 Cavendish', () => {
  const power = (trash: string[], p2trash: string[] = []) => {
    const g = mk({ characters: [ID], trash }, { trash: p2trash });
    return g.power(g.find('p1', 'characters', ID));
  };

  it('with 4 or more Events in your trash it gets +2000 power (4000 to 6000)', () => {
    expect(power(times(4, EVENT))).toBe(6000);
    expect(power(times(7, EVENT))).toBe(6000);
  });

  it('boundary: 3 Events is not enough', () => {
    expect(power(times(3, EVENT))).toBe(4000);
    expect(power([])).toBe(4000);
  });

  it('only Events count: other cards in the trash do not', () => {
    expect(power([...times(3, EVENT), DR.c2, BOBBY, DR.c3])).toBe(4000);
    expect(power([...times(4, EVENT), DR.c2])).toBe(6000);
  });

  it("the opponent's trash does not count", () => {
    expect(power([], times(5, EVENT))).toBe(4000);
    expect(power(times(2, EVENT), times(5, EVENT))).toBe(4000);
  });

  it('is a permanent effect: it applies on the opponent turn too', () => {
    const g = mk({ characters: [ID], trash: times(4, EVENT) }, {}, { turn: 4, activePlayer: 'p2' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });
});
