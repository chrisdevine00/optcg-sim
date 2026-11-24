/** EB03-021 Alvida. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, play, trash, V } from './helpers.ts';
import { boost, canPick, cardsIn, mk } from './helpers-eb03g1.ts';

const ID = 'EB03-021';
const bottomOf = (g: ReturnType<typeof mk>, p: 'p1' | 'p2') => g.zone(p, 'deck').at(-1)!.card;

// p2: a 4000-power cost 2, a 5000-power cost 3, a 3000-power cost 1, a 9000-power cost 7.
const start = () =>
  mk(
    { hand: [ID, V.c1, V.c5], characters: [V.c2, V.c4] },
    { characters: [V.c2, V.c3, V.c1, V.c7] },
  );

describe('EB03-021 Alvida', () => {
  it("[On Play] trashing 1 card: places an opponent's Character with 4000 base power or less and a Character with a base cost of 3 or less at the bottom of the owners' decks", () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]); // the cost
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true); // 4000 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // 5000
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false); // own Characters: not in the first pick
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(bottomOf(g, 'p2')).toBe(V.c2);
    expectDecision(g, 'choose', 'p1');
    // The second pick is any Character with a base cost of 3 or less, either side.
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // cost 3 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c1, V.c7].sort());
    expect(bottomOf(g, 'p2')).toBe(V.c3);
  });

  it('the second Character may be one of your own, which goes to your deck bottom', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(bottomOf(g, 'p1')).toBe(V.c2);
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(4);
  });

  it('declining the cost: nothing is trashed or placed', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([]);
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(4);
  });

  it('reads BASE power: a Character lowered to 3000 current power (5000 base) is not eligible for the first pick', () => {
    const g = start();
    boost(g, g.find('p2', 'characters', V.c3), -2000);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(3000);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
  });

  it('with no other card in hand the cost cannot be paid: only declining is legal', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c1] });
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    decline(g);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c1]);
  });
});
