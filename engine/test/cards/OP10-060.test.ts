/** OP10-060 Barrier-Barrier Pistol. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, trash, V } from './helpers.ts';
import { canPick, cardsOf, start, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-060';

const main = (oppChars: string[], oppDeck = [V.c1, V.c2]) =>
  start({ hand: [ID], characters: [V.c3] }, { characters: oppChars, deck: oppDeck });

describe('OP10-060 Barrier-Barrier Pistol', () => {
  it("[Main]: place an opponent's Character with 6000 power or less at the bottom of its owner's deck (boundary)", () => {
    const g = main([V.c4, V.c5]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // 6000
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // 7000
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false); // your own
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(cardsOf(g, 'p2', 'deck')).toEqual([V.c1, V.c2, V.c4]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('reads current power: a Character raised above 6000 is not eligible, one lowered is', () => {
    const g = main([V.c3, V.c5]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
  });

  it('"up to 1": may place nothing; with no eligible Character nothing is asked', () => {
    const g = main([V.c4]);
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c4]);
    const h = main([V.c5, V.c6]);
    play(h, ID);
    expect(dec(h)?.kind).not.toBe('choose');
    expect(cardsOf(h, 'p2', 'deck')).toEqual([V.c1, V.c2]);
  });

  it("[Trigger]: activate this card's [Main] effect", () => {
    const g = trigGame(ID, {}, [V.c4]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7]);
    expect(cardsOf(g, 'p2', 'deck').at(-1)).toBe(V.c4);
  });
});
