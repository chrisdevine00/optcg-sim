/**
 * OP14-089 Ryuma (Character, Black, cost 3, 5000, no Counter, {Land of Wano}/{Thriller Bark Pirates}).
 *
 * Card text: "[On K.O.] Draw 2 cards and trash 2 cards from your hand.
 * [Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or less from
 * your trash rested."
 *
 * Rules: CR 10-2-17 ([On K.O.] resolves from the trash), CR 3-7-6-1 (a Character trashed for room is
 * not K.O.'d), CR 10-1-5 ([Trigger]), CR 8-4 (an exact "trash 2" is not "up to").
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canFinish,
  chars,
  deckTop,
  describeTbTrigger,
  hand,
  kind,
  LD14,
  mine,
  need,
  offeredIds,
  opponentKOs,
  pickCards,
  pickInst,
  playId,
  reachablePickSets,
  SC14,
  theirs,
  theyKo,
  trash,
} from './kit-op14d.ts';

const ID = 'OP14-089';

function koed(o: { hand?: string[]; deck?: string[] } = {}) {
  const g = theirs(
    LD14.neutral,
    {
      characters: [{ card: ID, rested: true }],
      hand: o.hand ?? [SC14.c2, SC14.c4],
      deck: o.deck ?? deckTop([SC14.c1, SC14.c5]),
    },
    {},
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe('OP14-089 Ryuma: [On K.O.] draw 2, then trash 2 cards from your hand', () => {
  it('K.O.d by battle: draws exactly 2, then trashes the 2 cards I pick from the enlarged hand', () => {
    const g = koed();
    need(g, 'choose', 'p1');
    // The hand is now 4 cards: the 2 held and the 2 drawn.
    pickCards(g, [SC14.c2, SC14.c1]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC14.c4, SC14.c5].sort());
    expect(trash(g)).toEqual([ID, SC14.c2, SC14.c1].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('the drawing comes first: the freshly drawn cards are candidates for the trash', () => {
    const g = koed();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(expect.arrayContaining([SC14.c1]));
  });

  it('with an empty hand: draws 2 and must trash both', () => {
    const g = koed({ hand: [] });
    if (kind(g) === 'choose') pickCards(g, [SC14.c1, SC14.c5]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, SC14.c1, SC14.c5].sort());
  });

  it('exact 2, not "up to": no way to trash fewer, every reachable selection has 2 cards', () => {
    const g = koed();
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    for (const s of reachablePickSets(g)) expect(s.split('+').filter(Boolean)).toHaveLength(2);
  });

  it('a hand card and a drawn card can both be chosen, and nothing else leaves the hand', () => {
    const g = koed({ hand: [SC14.c2, SC14.c4, SC14.c6] });
    pickCards(g, [SC14.c4, SC14.c5]);
    expect(hand(g)).toEqual([SC14.c2, SC14.c6, SC14.c1].sort());
  });

  it("K.O.d by an opponent's effect: the same [On K.O.] resolves", () => {
    const g = theirs(
      LD14.neutral,
      { characters: [ID], hand: [SC14.c2], deck: deckTop([SC14.c1, SC14.c5]) },
      { hand: ['OP09-077'] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickCards(g, [SC14.c2, SC14.c1]);
    expect(hand(g)).toEqual([SC14.c5]);
    expect(chars(g)).toEqual([]);
  });

  it('must not fire for a Character trashed to make room (CR 3-7-6-1): no draw, no trash', () => {
    const g = mine(LD14.neutral, {
      characters: [ID, SC14.c2, SC14.c2, SC14.c2, SC14.c2],
      hand: [SC14.c4],
      deck: deckTop([SC14.c1, SC14.c5]),
    });
    playId(g, SC14.c4);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', ID)]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(12);
  });
});

describeTbTrigger(ID);
