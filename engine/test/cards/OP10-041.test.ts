/** OP10-041 Radio Knife. */
import type { PlayerSpec } from '@optcg/engine';
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, trash, V } from './helpers.ts';
import { canPick, cardsOf, start, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-041';
const rested = (card: string) => ({ card, rested: true });
const isRested = (g: ReturnType<typeof start>, card: string) =>
  g.zone('p2', 'characters').find((c) => c.card === card)!.rested;

const main = (oppChars: NonNullable<PlayerSpec['characters']>) =>
  start({ hand: [ID] }, { characters: oppChars });

describe('OP10-041 Radio Knife', () => {
  it('[Main]: rest a Character with a cost of 6 or less (boundary), then K.O. a rested one with a cost of 5 or less', () => {
    const g = main([V.c6, V.c7, rested(V.c5)]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false); // cost 7
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(isRested(g, V.c6)).toBe(true);
    // The K.O. step: the Character just rested has cost 6, so it is out; the one already rested (5) is in.
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6, V.c7]);
    expect(trash(g, 'p2')).toEqual([V.c5]);
  });

  it("a Character rested by this effect can be K.O.'d at cost 5 or less (rest then K.O. the same card)", () => {
    const g = main([V.c5]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([]);
  });

  it('"Then" is not "if you do": with the rest declined a rested Character can still be K.O.\'d', () => {
    const g = main([V.c4, rested(V.c3)]);
    play(g, ID);
    none(g);
    expect(isRested(g, V.c4)).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // active
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('must not K.O. a rested Character with a cost of 6 (only 5 or less)', () => {
    const g = main([rested(V.c6)]);
    play(g, ID);
    none(g);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it("[Trigger]: rest up to 1 of your opponent's Characters with a cost of 4 or less (boundary)", () => {
    const g = trigGame(ID, {}, [V.c4, V.c5]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(isRested(g, V.c4)).toBe(true);
  });
});
