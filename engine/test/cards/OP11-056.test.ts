/** OP11-056 Brook. */
import { describe, expect, it } from 'vitest';
import { none, pick, play, V } from './helpers.ts';
import { canPick, cardsOf, costMod, mk } from './helpers-op11g2.ts';

const ID = 'OP11-056';
const start = (p2: string[], p1: string[] = []) =>
  mk({ hand: [ID], characters: p1 }, { characters: p2 });

describe('OP11-056 Brook', () => {
  it("[On Play]: places up to 1 Character with a base cost of 1 at the bottom of its owner's deck", () => {
    const g = start([V.c1, V.c2]);
    const before = cardsOf(g, 'p2', 'deck').length;
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // base cost 2
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c2]);
    const deck = cardsOf(g, 'p2', 'deck');
    expect(deck).toHaveLength(before + 1);
    expect(deck.at(-1)).toBe(V.c1);
  });

  it('your own base-cost-1 Character may be placed too (at the bottom of your deck)', () => {
    const g = start([], [V.c1]);
    const before = cardsOf(g, 'p1', 'deck').length;
    play(g, ID);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(before + 1);
    expect(cardsOf(g, 'p1', 'deck').at(-1)).toBe(V.c1);
  });

  it('"base cost": a cost-2 Character lowered to 1 is not eligible; a cost-1 Character raised to 2 is', () => {
    const g = start([V.c2, V.c1]);
    costMod(g, g.find('p2', 'characters', V.c2), -1);
    costMod(g, g.find('p2', 'characters', V.c1), 1);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('"up to 1": may place nothing', () => {
    const g = start([V.c1]);
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('[Blocker]: printed', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c7] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});
