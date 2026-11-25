/** OP10-079 God Thread. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, none, option, pick, play, trash, V } from './helpers.ts';
import { canPick, cardsOf, start, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-079';

const main = (oppChars: string[]) =>
  start(
    { hand: [ID], characters: [V.c2], costArea: { active: 5, rested: 0 } },
    { characters: oppChars },
  );

describe('OP10-079 God Thread', () => {
  it('[Main]: K.O. a Character with a cost of 5 or less (boundary), then add 1 DON!! from the deck as active', () => {
    const g = main([V.c5, V.c6]);
    play(g, ID); // cost 5: 0 active left
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6]);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 5 });
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('"Then" is not "if you do": the DON!! is added even when nothing was K.O.\'d', () => {
    const g = main([V.c6]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('choose'); // only the DON!! count: nothing to K.O.
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 5 });
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('"up to 1": the K.O. may be declined and the DON!! count may be 0', () => {
    const g = main([V.c4]);
    play(g, ID);
    none(g);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('[Trigger]: add up to 1 DON!! from the DON!! deck and set it as active', () => {
    const g = trigGame(ID, { costArea: { active: 3, rested: 2 } });
    g.act({ type: 'trigger', activate: true });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 2 });
  });
});
