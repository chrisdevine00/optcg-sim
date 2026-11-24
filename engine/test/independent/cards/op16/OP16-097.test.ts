/**
 * OP16-097 Yamato (Character, Black, cost 8, 8000, no Counter, {Land of Wano}).
 *
 * Card text: "[On Play] Add up to 1 {Land of Wano} type Character card with a cost of 6 or less from
 * your trash to your hand. Then, play up to 1 Character card with a cost of 2 or less from your hand."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 4-10-1 (effects resolve in order; the card just added is in hand
 * for the next step), CR 3-7-6 (five Character areas).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  chars,
  decision,
  deckOf,
  hand,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  p1main,
  pickCards,
  playIt,
  SC16,
  SCN,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-097';

function start(tr: string[], h: string[] = [], field: string[] = []) {
  const g = p1main(LD16.wano, {
    hand: [ID, ...h],
    trash: tr,
    characters: field,
    deck: deckOf([]),
  });
  playIt(g, ID);
  return g;
}

describe('OP16-097 Yamato: [On Play] add a {Land of Wano} Character (cost 6 or less) from the trash, then play a Character (cost 2 or less) from hand', () => {
  it('adds the chosen card to hand; then plays a cost-2 Character from hand', () => {
    const g = start([SC16.wano5, SC16.wano1], [SC16.momo2]);
    need(g, 'choose', 'p1');
    pickCards(g, [SC16.wano5]);
    need(g, 'choose', 'p1');
    pickCards(g, [SC16.momo2]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC16.wano5]);
    expect(chars(g)).toEqual([ID, SC16.momo2].sort());
    expect(trash(g)).toEqual([SC16.wano1]);
  });

  it('first step boundary: cost 6 is offered, cost 7 is not; non-{Land of Wano} Characters and {Land of Wano} Events are not', () => {
    const g = start([SC16.wano6, SC16.wano7, SCN.c3, 'OP16-099', SC16.wano1]);
    expect(offeredIds(g)).toEqual([SC16.wano1, SC16.wano6].sort());
  });

  it('second step boundary: cost 2 is playable, cost 3 is not, and an Event of cost 1 is not a Character', () => {
    const g = start([], [SC16.momo2, SC16.wano3, 'OP16-099', SCN.c1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC16.momo2, SCN.c1].sort());
  });

  it('the card just added to hand may be played at once if its cost is 2 or less', () => {
    const g = start([SC16.wano1, SC16.wano5]);
    pickCards(g, [SC16.wano1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC16.wano1]);
    pickCards(g, [SC16.wano1]);
    expect(chars(g)).toEqual([ID, SC16.wano1].sort());
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1" (add): may add nothing and still play from hand', () => {
    const g = start([SC16.wano5], [SC16.momo2]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    pickCards(g, [SC16.momo2]);
    expect(trash(g)).toEqual([SC16.wano5]);
    expect(chars(g)).toEqual([ID, SC16.momo2].sort());
  });

  it('"up to 1" (play): may play nothing; the added card stays in hand', () => {
    const g = start([SC16.wano5], [SC16.momo2]);
    pickCards(g, [SC16.wano5]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC16.momo2, SC16.wano5].sort());
    expect(chars(g)).toEqual([ID]);
  });

  it('adds at most one card and plays at most one', () => {
    const g = start([SC16.wano5, SC16.wano3], [SC16.momo2, SCN.c1]);
    pickCards(g, [SC16.wano5]);
    pickCards(g, [SC16.momo2]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toHaveLength(2);
    expect(hand(g)).toHaveLength(2);
    expect(trash(g)).toEqual([SC16.wano3]);
  });

  it('the Character played from hand is played without paying its cost', () => {
    const g = start([], [SC16.momo2]);
    pickCards(g, [SC16.momo2]);
    // Yamato cost 8 rested 8 of 10 DON!!; the 2 left are untouched by the effect play
    expect(g.card(g.find('p1', 'characters', SC16.momo2)).rested).toBe(false);
  });

  it('with four other Characters, the played one makes a sixth in total: the Character limit asks me to trash one', () => {
    const g = start([], [SC16.momo2], [SCN.c3, SCN.c4, SCN.c5, SCN.c6]);
    pickCards(g, [SC16.momo2]);
    expect(decision(g)?.purpose).toBe('characterLimit');
  });
});
