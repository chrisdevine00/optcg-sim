/**
 * OP16-089 Dracule Mihawk (Character, Black, cost 6, 8000, no Counter, {The Seven Warlords of the Sea}).
 *
 * Card text: "[Rush: Character] (This card can attack Characters on the turn in which it is played.)
 * [On Play] Draw 2 cards and trash 2 cards from your hand. Then, give up to 1 of your opponent's
 * Characters −4 cost during this turn."
 *
 * Rules: CR 10-1-?? ([Rush: Character] attacks Characters only), CR 1-3-6-2 (a cost reads as 0 at
 * the lowest), CR 8-4-4-1 ("up to"), CR 6-6-1-3 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  reachablePickSets,
  BLUE,
  canHit,
  chars,
  deck,
  deckOf,
  hand,
  kind,
  LD16,
  need,
  none,
  offeredIds,
  p1main,
  pickCards,
  playIt,
  SC16,
  SCN,
  toMyNextMain,
  trash,
  mayChooseNone,
  choices,
} from './kit-op16c.ts';

const ID = 'OP16-089';
const X = SC16.wano3;
const Y = SC16.wano5;

function start(
  opp: (string | { card: string; rested?: boolean })[] = [SCN.c6],
  mine: string[] = [X, Y],
) {
  const g = p1main(
    LD16.wano,
    { hand: [ID, ...mine], deck: deckOf([SC16.wano1, SC16.wano6]) },
    { characters: opp },
  );
  playIt(g, ID);
  return g;
}

describe('OP16-089 Dracule Mihawk: [On Play] draw 2, trash 2, then an opposing Character -4 cost', () => {
  it('draws 2, trashes the 2 I choose from the enlarged hand, then lowers the chosen Character by 4 (6 -> 2)', () => {
    const g = start();
    need(g, 'choose', 'p1');
    pickCards(g, [X, SC16.wano1]); // one from hand, one just drawn
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c6]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([X, SC16.wano1].sort());
    expect(hand(g)).toEqual([Y, SC16.wano6].sort());
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).cost).toBe(2);
  });

  it('the trash step is exactly 2 cards: it cannot be finished with 1', () => {
    const g = start();
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(false);
    act(g, { type: 'pick', choice: choices(g)[0]! });
    expect(kind(g)).toBe('choose');
    expect(mayChooseNone(g)).toBe(false);
  });

  it('the trash step offers the whole hand including the two drawn cards', () => {
    const g = start();
    const sets = [...reachablePickSets(g, 2)].map((k) => k.split('+'));
    const seen = new Set(sets.flat());
    expect([...seen].sort()).toEqual([X, Y, SC16.wano1, SC16.wano6].sort());
    for (const s of sets) expect(s).toHaveLength(2);
  });

  it('a cost cannot go below 0: a cost-3 Character shows cost 0', () => {
    const g = start([SCN.c3]);
    pickCards(g, [X, Y]);
    pickCards(g, [SCN.c3]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).cost).toBe(0);
  });

  it('"up to 1": the cost reduction may be skipped, the draw and trash still happen', () => {
    const g = start();
    pickCards(g, [X, Y]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toHaveLength(2);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).cost).toBe(6);
  });

  it("only the opponent's Characters are candidates (not my Characters or either Leader)", () => {
    const g = p1main(
      LD16.wano,
      { hand: [ID, X, Y], characters: [SCN.c4], deck: deckOf([BLUE, BLUE]) },
      { characters: [SCN.c6] },
    );
    playIt(g, ID);
    pickCards(g, [X, Y]);
    expect(offeredIds(g)).toEqual([SCN.c6]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('the -4 cost lasts this turn only', () => {
    const g = start();
    pickCards(g, [X, Y]);
    pickCards(g, [SCN.c6]);
    toMyNextMain(g);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).cost).toBe(6);
  });

  it('[Rush: Character]: it can attack a rested opposing Character on the turn it is played, but not a Leader', () => {
    const g = start([{ card: SCN.c4, rested: true }]);
    pickCards(g, [X, Y]);
    none(g);
    expect(atMain(g)).toBe(true);
    const mihawk = at(g, 'p1', 'characters', ID);
    expect(g.card(mihawk).keywords).toContain('Rush: Character');
    expect(canHit(g, mihawk, at(g, 'p2', 'characters', SCN.c4))).toBe(true);
    expect(canHit(g, mihawk, g.leader('p2'))).toBe(false);
  });

  it('draws from the top: the deck loses exactly 2 cards and Mihawk stays on the field', () => {
    const g = start();
    pickCards(g, [X, Y]);
    none(g);
    expect(deck(g)).toHaveLength(10);
    expect(chars(g)).toEqual([ID]);
  });
});
