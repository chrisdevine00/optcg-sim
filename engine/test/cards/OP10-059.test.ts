/** OP10-059 Fo...llow...Me...and...I...Will...Gui...de...You. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { canPick, cardsOf, DR2, DR3, settle, start, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-059';
// Top 5: DR2, V.c1, DR3, V.c2, V.c4; the 6th card (V.c3) is not looked at.
const DECK = [DR2, V.c1, DR3, V.c2, V.c4, V.c3];

const run = (deck = DECK) => {
  const g = start({ hand: [ID], deck });
  play(g, ID);
  return g;
};

describe('OP10-059 Fo...llow...Me...and...I...Will...Gui...de...You', () => {
  it('[Main]: look at 5, add 1 {Dressrosa} Character to the hand, the rest to the bottom of the deck', () => {
    const g = run();
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', DR3)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([DR3]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(5);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c3); // the sixth card was not looked at
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('"up to 1": only one card can be taken, or none (the 5 go to the bottom)', () => {
    const g = run();
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(6);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c3);
  });

  it('a {Dressrosa} card past the fifth is not offered; with none in the top 5 the choice is asked at max 0', () => {
    const g = run([V.c1, V.c2, V.c4, V.c5, V.c6, DR2]);
    expect(dec(g)).toMatchObject({ kind: 'choose', max: 0 });
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it("[Trigger]: activate this card's [Main] effect", () => {
    const g = trigGame(ID, { deck: DECK });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', DR2)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([DR2]);
  });
});
