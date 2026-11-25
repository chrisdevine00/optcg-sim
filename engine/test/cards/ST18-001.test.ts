/** ST18-001 Uso-Hachi. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { isRested, mk, offered } from './helpers-st1821.ts';

const ID = 'ST18-001';

/** p1 holds Uso-Hachi (cost 3) with `active` DON!! in the cost area; p2 has a cost 5 and a cost 6 Character. */
const start = (active: number, p1Extra = {}) =>
  mk(
    { hand: [ID], costArea: { active, rested: 0 }, ...p1Extra },
    { characters: [V.c5, V.c6, V.c2] },
  );

describe('ST18-001 Uso-Hachi', () => {
  it('[On Play] with 8 DON!! on the field: rests up to 1 Character with a cost of 5 or less', () => {
    const g = start(8);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Cost 6 is never offered; cost 5 (the boundary) and cost 2 are.
    expect(offered(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c5), g.find('p2', 'characters', V.c2)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(isRested(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(isRested(g, g.find('p2', 'characters', V.c2))).toBe(false);
    expect(isRested(g, g.find('p2', 'characters', V.c6))).toBe(false);
  });

  it('boundary: 7 DON!! on the field does nothing (the ability fires, no prompt)', () => {
    const g = start(7);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });

  it('DON!! given to a card count toward the 8 (cost area 6 + 2 given to the Leader)', () => {
    const g = start(6, { leader: { card: 'ST01-001', don: 2 } });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(isRested(g, g.find('p2', 'characters', V.c2))).toBe(true);
  });

  it('"up to 1": the pick may be declined', () => {
    const g = start(8);
    play(g, ID);
    none(g);
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });

  it('with no Character of cost 5 or less nothing is asked (only the cost 6 Character is there)', () => {
    const g = mk({ hand: [ID], costArea: { active: 8, rested: 0 } }, { characters: [V.c6] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(isRested(g, g.find('p2', 'characters', V.c6))).toBe(false);
  });
});
