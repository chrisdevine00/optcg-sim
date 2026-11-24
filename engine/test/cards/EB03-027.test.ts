/** EB03-027 Marguerite. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { boost, canPick, cardsIn, mk } from './helpers-eb03g1.ts';

const ID = 'EB03-027';
// 7000 base: V.c5. 6000: V.c4. 8000: V.c6.
const start = () =>
  mk({ hand: [ID], characters: [V.c5, V.c3] }, { characters: [V.c5, V.c4, V.c6] });

describe('EB03-027 Marguerite', () => {
  it("[On Play]: returns a Character with 7000 base power to its owner's hand", () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c5))).toBe(true); // either side
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true); // Marguerite herself is 7000
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // 6000
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // 8000
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false); // 5000
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(hand(g, 'p2')).toEqual([V.c5]);
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c4, V.c6].sort());
  });

  it('one of yours goes to your hand', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'characters', V.c5)]);
    expect(hand(g, 'p1')).toEqual([V.c5]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('reads BASE power: a 6000 Character boosted to 7000 is not eligible; a 7000 lowered still is', () => {
    const g = start();
    boost(g, g.find('p2', 'characters', V.c4), 1000);
    boost(g, g.find('p2', 'characters', V.c5), -3000);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
  });

  it('"up to 1": may return nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(3);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with Marguerite as the only 7000 base Character she can return herself', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(hand(g, 'p1')).toEqual([ID]);
  });
});
