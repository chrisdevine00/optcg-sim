/** OP13-058 Phoenix Pyreapple. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, endCounter, none, pick, play, takeDamage } from './helpers.ts';
import {
  canPick,
  cardsOf,
  counterStep,
  expectDecision,
  mk,
  useCounter,
  V,
} from './helpers-op13g2.ts';
import { boost } from './helpers-op15g1.ts';

const ID = 'OP13-058';

// The Event costs 1 and the cost rests 1 more.
const start = (p2Chars: string[] = [V.c1, V.c2]) =>
  mk(
    { hand: [ID], characters: [V.c1], costArea: { active: 2, rested: 0 } },
    { characters: p2Chars },
  );

describe('OP13-058 Phoenix Pyreapple', () => {
  it("[Main]: resting 1 DON!!, places up to 1 opposing Character with 3000 power or less at the bottom of its owner's deck (boundary 3000)", () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true); // 3000
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // 4000
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // own Character
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c2]);
    const deck = cardsOf(g, 'p2', 'deck');
    expect(deck).toHaveLength(11);
    expect(deck[deck.length - 1]).toBe(V.c1);
  });

  it('"up to 1": may place none', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('declining the optional cost does nothing and keeps the DON!!', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
    expect(cardsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('uses current power: a Character boosted above 3000 is not a candidate', () => {
    const g = start([V.c1]);
    boost(g, g.find('p2', 'characters', V.c1), 1000);
    play(g, ID);
    accept(g);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(4000);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('[Counter]: your Leader gains +3000 power during this battle only', () => {
    const g = counterStep({ leader: 'ST03-001', hand: [ID], costArea: { active: 1, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
