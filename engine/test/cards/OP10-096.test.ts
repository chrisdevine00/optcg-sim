/** OP10-096 There's No Longer Any Need for the Seven Warlords of the Sea!!! */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, trash, V } from './helpers.ts';
import { canPick, cardsOf, start, SW, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-096';

const main = (oppChars: string[]) =>
  start({ hand: [ID], characters: [SW.c2] }, { characters: oppChars });

describe("OP10-096 There's No Longer Any Need for the Seven Warlords of the Sea!!!", () => {
  it('[Main]: K.O. an opponent {The Seven Warlords of the Sea} Character with a cost of 8 or less', () => {
    const g = main([SW.c6, SW.c4, V.c3]);
    play(g, ID); // cost 4
    expect(canPick(g, g.find('p2', 'characters', SW.c6))).toBe(true); // cost 6
    expect(canPick(g, g.find('p2', 'characters', SW.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // another type
    expect(canPick(g, g.find('p1', 'characters', SW.c2))).toBe(false); // your own
    pick(g, [g.find('p2', 'characters', SW.c6)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([SW.c4, V.c3]);
    expect(trash(g, 'p2')).toEqual([SW.c6]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('must not K.O. a Character that is not {The Seven Warlords of the Sea}, whatever its cost', () => {
    const g = main([V.c2, V.c6]);
    play(g, ID);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c2, V.c6]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = main([SW.c4]);
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([SW.c4]);
  });

  it('[Trigger]: K.O. a {The Seven Warlords of the Sea} Character with a cost of 4 or less (boundary 4)', () => {
    const g = trigGame(ID, {}, [SW.c4, SW.c6, SW.c3]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', SW.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', SW.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', SW.c6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false); // the attacker: another type
    pick(g, [g.find('p2', 'characters', SW.c4)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7, SW.c6, SW.c3]);
  });
});
