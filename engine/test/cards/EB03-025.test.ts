/** EB03-025 Hina. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { boost, canPick, cardsIn, mk } from './helpers-eb03g1.ts';

const ID = 'EB03-025';
// 6000 base: V.c4 (cost 4). 5000: V.c3. 7000: V.c5.
const start = () =>
  mk({ hand: [ID, V.c1], characters: [V.c4, V.c3] }, { characters: [V.c4, V.c5, V.c3] });

describe('EB03-025 Hina', () => {
  it('[On Play] trashing 1 card: returns a Character with 6000 base power to its owner hand', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]); // the cost
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(true); // either side
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true); // Hina herself is 6000
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // 7000
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // 5000
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c3, V.c5].sort());
    expect(hand(g, 'p2')).toEqual([V.c4]); // the owner's hand
    expect(hand(g, 'p1')).toEqual([]);
  });

  it("a Character of yours is returned to your hand, not the opponent's", () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p1', 'characters', V.c4)]);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('reads BASE power: a 5000 Character boosted to 6000 is not eligible', () => {
    const g = start();
    boost(g, g.find('p2', 'characters', V.c3), 1000);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(6000);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
  });

  it('declining the cost: nothing is trashed or returned', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([]);
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('"up to 1": the cost may be paid and nothing returned', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(3);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });
});
