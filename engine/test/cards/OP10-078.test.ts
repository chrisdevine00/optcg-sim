/** OP10-078 I Do Not Forgive Those Who Laugh at My Family!!! */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { canPick, cardsOf, counterGame, DP2, DP4, finish, settle, start } from './helpers-a10g4.ts';

const ID = 'OP10-078';
// Top 3: V.c1, DP2, ID (excluded by name); DP4 is the 4th card (not looked at).
const DECK = [V.c1, DP2, ID, DP4, V.c3];

const run = (deck = DECK) => {
  const g = start({ hand: [ID], deck });
  play(g, ID);
  return g;
};

describe('OP10-078 I Do Not Forgive Those Who Laugh at My Family!!!', () => {
  it('[Main]: look at 3, add 1 {Donquixote Pirates} card other than this one, the rest to the bottom', () => {
    const g = run();
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    expect(canPick(g, g.find('p1', 'deck', DP2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false); // the same name is excluded
    expect(canPick(g, g.find('p1', 'deck', DP4))).toBe(false); // the 4th card is not looked at
    pick(g, [g.find('p1', 'deck', DP2)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([DP2]);
    expect(cardsOf(g, 'p1', 'deck').slice(0, 2)).toEqual([DP4, V.c3]); // unlooked cards stay on top
    expect(cardsOf(g, 'p1', 'deck').slice(2).sort()).toEqual([V.c1, ID].sort());
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('"up to 1": may take nothing; with no eligible card the choice is asked at max 0', () => {
    const g = run();
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(5);
    const h = run([V.c1, V.c2, ID, DP2]);
    expect(dec(h)).toMatchObject({ kind: 'choose', max: 0 });
    none(h);
    settle(h);
    expect(hand(h, 'p1')).toEqual([]);
  });

  it('a card of another type is not offered', () => {
    const g = run([V.c1, V.c2, V.c4, DP2]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });

  it('[Counter]: the same effect can be used as a [Counter] (Main/Counter)', () => {
    const g = counterGame(ID, { deck: DECK }, {}, true, V.c7, 'main');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', DP2)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([DP2]);
    endCounter(g);
    finish(g);
    expect(g.life('p1')).toBe(2); // the Event adds no power
  });
});
