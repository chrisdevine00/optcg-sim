/**
 * OP16-090 Tony Tony.Chopper (Character, Black, cost 3, 4000, Counter +1000, {Animal}/{Land of Wano}/{Straw Hat Crew}).
 *
 * Card text: "[On Play] Draw 2 cards and trash 2 cards from your hand. Then, K.O. up to 1 of your
 * opponent's Characters with a cost of 1 or less."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 1-3-6-2 (cost reads as 0 at the lowest).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  cardIds,
  choices,
  deck,
  deckOf,
  hand,
  kind,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  p1main,
  pickCards,
  playIt,
  reachablePickSets,
  SC16,
  SCN,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-090';
const X = SC16.wano3;
const Y = SC16.wano5;

function start(opp: (string | { card: string; rested?: boolean })[], mine: string[] = [X, Y]) {
  const g = p1main(
    LD16.wano,
    { hand: [ID, ...mine], deck: deckOf([SC16.wano1, SC16.wano6]) },
    { characters: opp },
  );
  playIt(g, ID);
  return g;
}

describe('OP16-090 Tony Tony.Chopper: [On Play] draw 2, trash 2, then K.O. an opposing Character with cost 1 or less', () => {
  it('draws 2, trashes the 2 chosen cards, then K.O.s the chosen cost-1 Character', () => {
    const g = start([SCN.c1, SCN.c4]);
    need(g, 'choose', 'p1');
    pickCards(g, [X, Y]);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c1]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC16.wano1, SC16.wano6].sort());
    expect(trash(g)).toEqual([X, Y].sort());
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c4]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SCN.c1]);
  });

  it('boundary: cost 1 is offered, cost 2 is not', () => {
    const g = start([SCN.c1, SCN.c2]);
    pickCards(g, [X, Y]);
    expect(offeredIds(g)).toEqual([SCN.c1]);
  });

  it('a rested Character is a candidate too', () => {
    const g = start([{ card: SCN.c1, rested: true }]);
    pickCards(g, [X, Y]);
    expect(offeredIds(g)).toEqual([SCN.c1]);
  });

  it('"up to 1": the K.O. may be skipped; the draw and trash still happen', () => {
    const g = start([SCN.c1]);
    pickCards(g, [X, Y]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c1]);
    expect(hand(g)).toHaveLength(2);
  });

  it('K.O.s at most one even with two cost-1 Characters', () => {
    const g = start([SCN.c1, SCN.c1]);
    pickCards(g, [X, Y]);
    pickCards(g, [SCN.c1]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c1]);
  });

  it('the trash step is exactly 2 cards of the four in hand (drawn cards included)', () => {
    const g = start([SCN.c1]);
    expect(mayChooseNone(g)).toBe(false);
    const sets = [...reachablePickSets(g, 2)].map((k) => k.split('+'));
    expect([...new Set(sets.flat())].sort()).toEqual([X, Y, SC16.wano1, SC16.wano6].sort());
    for (const s of sets) expect(s).toHaveLength(2);
    act(g, { type: 'pick', choice: choices(g)[0]! });
    expect(mayChooseNone(g)).toBe(false);
  });

  it("only the opponent's Characters are candidates: my own cost-1 Character is not offered", () => {
    const g = p1main(
      LD16.wano,
      { hand: [ID, X, Y], characters: [SCN.c1], deck: deckOf([SC16.wano1, SC16.wano6]) },
      { characters: [SCN.c1] },
    );
    playIt(g, ID);
    pickCards(g, [X, Y]);
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', SCN.c1)]);
  });

  it('no cost-1 Character on the opposing field: the effect ends after draw and trash', () => {
    const g = start([SCN.c4]);
    pickCards(g, [X, Y]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c4]);
  });

  it('the deck loses exactly 2 cards', () => {
    const g = start([SCN.c1]);
    pickCards(g, [X, Y]);
    none(g);
    expect(deck(g)).toHaveLength(10);
  });
});
