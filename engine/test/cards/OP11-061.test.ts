/** OP11-061 Gum-Gum Jet Culverin. */
import { describe, expect, it } from 'vitest';
import { none, pick, play, V } from './helpers.ts';
import { canPick, cardsOf, costMod, mk } from './helpers-op11g2.ts';

const ID = 'OP11-061';
const start = (p2: string[], p1: string[] = []) =>
  mk({ hand: [ID], characters: p1 }, { characters: p2 });

describe('OP11-061 Gum-Gum Jet Culverin', () => {
  it("[Main]: places up to 1 opposing Character with a base cost of 4 or less at the bottom of its owner's deck", () => {
    const g = start([V.c4, V.c5]);
    const deckBefore = cardsOf(g, 'p2', 'deck');
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // base cost 4 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c5]);
    const deck = cardsOf(g, 'p2', 'deck');
    expect(deck).toHaveLength(deckBefore.length + 1);
    expect(deck.at(-1)).toBe(V.c4);
  });

  it('the [Main] reads the base cost: a cost-5 Character lowered to 3 is not eligible; one raised to 6 (base 4) is', () => {
    const g = start([V.c5, V.c4]);
    costMod(g, g.find('p2', 'characters', V.c5), -2);
    costMod(g, g.find('p2', 'characters', V.c4), 2);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
  });

  it('the [Main] only reaches your opponent\'s Characters, and "up to 1" may pick none', () => {
    const g = start([V.c1], [V.c2]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c1]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([V.c2]);
  });

  it("[Trigger]: places up to 1 Character with cost 1 or less (either player's) at the bottom of its owner's deck", () => {
    const g = mk(
      { life: [ID, V.c1, V.c1], characters: [V.c1, V.c2] },
      { characters: [V.c7, V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    const mine = cardsOf(g, 'p1', 'deck');
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false); // cost 2
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([V.c2]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(mine.length + 1);
    expect(cardsOf(g, 'p1', 'deck').at(-1)).toBe(V.c1);
  });
});
