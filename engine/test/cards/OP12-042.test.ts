/** OP12-042 Alvida. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { ids, mine } from './helpers-op12g2.ts';

const ID = 'OP12-042';

describe('OP12-042 Alvida', () => {
  const cost = (chars: string[]) => {
    const g = mine({ characters: [ID, ...chars] });
    return g.card(g.find('p1', 'characters', ID)).cost;
  };

  it('with 2 Characters of base cost 5 or more she gains +1 cost (4 becomes 5)', () => {
    expect(cost([V.c5, V.c6])).toBe(5);
    expect(cost([V.c7, V.c5])).toBe(5);
  });

  it('boundary: 1 such Character, or 2 of base cost 4, give no bonus', () => {
    expect(cost([V.c5])).toBe(4);
    expect(cost([V.c5, V.c4])).toBe(4);
    expect(cost([V.c4, V.c4, V.c3])).toBe(4);
  });

  it('she never counts toward her own condition (base cost 4)', () => {
    expect(cost([V.c5])).toBe(4); // Alvida at cost 4 plus 1 qualifying Character
    expect(cost([])).toBe(4);
  });

  it("[On Play] places up to 1 of the opponent's Characters with a base cost of 1 or less at the bottom of its owner's deck", () => {
    const g = mine({ hand: [ID] }, { characters: [V.c1, V.c2] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Only the cost 1 Character is a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c2]);
    expect(ids(g, 'p2', 'deck').at(-1)).toBe(V.c1);
  });

  it('[On Play] "up to 1": may place nothing; with no candidate the Character stays put', () => {
    const g = mine({ hand: [ID] }, { characters: [V.c1] });
    play(g, ID);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1]);
    const h = mine({ hand: [ID] }, { characters: [V.c2] });
    play(h, ID);
    expect(ids(h, 'p2', 'characters')).toEqual([V.c2]);
  });
});
