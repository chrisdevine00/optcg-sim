/** OP10-061 Special Long-Range Attack!! Bagworm. */
import { describe, expect, it } from 'vitest';
import { dec, hand, none, pick, play, V } from './helpers.ts';
import { canPick, cardsOf, start, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-061';

const main = (oppChars: string[]) =>
  start({ hand: [ID], characters: [V.c1], deck: [V.c4, V.c5] }, { characters: oppChars });

describe('OP10-061 Special Long-Range Attack!! Bagworm', () => {
  it("[Main]: draw 1, then return an opponent's Character with a cost of 2 or less to its owner's hand (boundary 2)", () => {
    const g = main([V.c2, V.c3]);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c4]); // drew first
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // cost 3
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // your own: not for the Main
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(cardsOf(g, 'p2', 'hand')).toContain(V.c2);
  });

  it('"Then" is not "if you do": the card is drawn even with no target, and the return may be declined', () => {
    const g = main([V.c3]);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(dec(g)?.kind).not.toBe('choose');
    const h = main([V.c1]);
    play(h, ID);
    none(h);
    expect(cardsOf(h, 'p2', 'characters')).toEqual([V.c1]);
    expect(hand(h, 'p1')).toEqual([V.c4]);
  });

  it("[Trigger]: return any Character with a cost of 2 or less to its owner's hand: yours or the opponent's", () => {
    const g = trigGame(ID, { characters: [V.c1, V.c3] }, [V.c2, V.c4]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false); // cost 3
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([V.c3]);
    expect(hand(g, 'p1')).toContain(V.c1);
  });

  it('[Trigger]: the owner of a returned opponent Character gets it in their hand', () => {
    const g = trigGame(ID, {}, [V.c2]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(cardsOf(g, 'p2', 'hand')).toContain(V.c2);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7]);
  });
});
