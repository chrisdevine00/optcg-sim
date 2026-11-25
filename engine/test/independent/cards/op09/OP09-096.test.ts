/**
 * OP09-096 My Era...Begins!! (Event, Black, cost 1, {Blackbeard Pirates}).
 *
 * Card text: "[Main] Look at 3 cards from the top of your deck; reveal up to 1 "Blackbeard Pirates" type
 * card other than [My Era...Begins!!] and add it to your hand. Then, trash the rest.
 * [Trigger] Activate this card's [Main] effect."
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  deck,
  describeLook,
  hand,
  hitLeader,
  L9,
  mine,
  need,
  offeredIds,
  pickCards,
  playId,
  theirs,
  trash,
  winner,
} from './kit-op09d.ts';

const ID = 'OP09-096';

describeLook({
  id: ID,
  n: 3,
  main: 'p1',
  rest: 'trash',
  start: (top) => {
    const g = mine(L9.bb, { hand: [ID], deck: top });
    playId(g, ID);
    return g;
  },
  match: [C9.bb4, C9.bb5],
  multi: 'OP10-082',
  excluded: ID,
  miss: C9.c2,
});

describe('OP09-096 My Era...Begins!!: [Main] details', () => {
  const begin = (top: string[], leader: string = L9.bb) => {
    const g = mine(leader, { hand: [ID], deck: [...top, ...Array(10).fill(BLUE)] });
    playId(g, ID);
    return g;
  };

  it('any category of {Blackbeard Pirates} card qualifies: the Event Black Vortex (OP09-097) and the Stage Fullalead (OP09-099)', () => {
    const g = begin(['OP09-097', 'OP09-099', C9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(['OP09-097', 'OP09-099'].sort());
  });

  it('adding nothing trashes all 3 looked-at cards (the rest is trashed, not bottomed)', () => {
    const g = begin([C9.bb4, C9.c2, C9.c3]);
    need(g, 'choose', 'p1');
    g.act({ type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([C9.bb4, C9.c2, C9.c3, ID].sort());
    expect(deck(g)).toHaveLength(10);
    expect(hand(g)).toEqual([]);
  });

  it('a deck of exactly 3: looking at all of it and trashing the rest empties the deck, and the player loses at once (CR 9-2-1-2)', () => {
    const g = mine(L9.bb, { hand: [ID], deck: [C9.bb4, C9.c2, C9.c3] });
    playId(g, ID);
    pickCards(g, [C9.bb4]);
    expect(deck(g)).toHaveLength(0);
    expect(hand(g)).toEqual([C9.bb4]);
    expect(winner(g)).toBe('p2');
  });

  it('a deck of 4: one card stays, the game goes on', () => {
    const g = mine(L9.bb, { hand: [ID], deck: [C9.bb4, C9.c2, C9.c3, C9.c4] });
    playId(g, ID);
    pickCards(g, [C9.bb4]);
    expect(deck(g)).toEqual([C9.c4]);
    expect(winner(g)).toBeNull();
    expect(atMain(g)).toBe(true);
  });

  it('the Leader needs no type', () => {
    const g = begin([C9.bb4, C9.c2, C9.c3], L9.neutral);
    pickCards(g, [C9.bb4]);
    expect(hand(g)).toEqual([C9.bb4]);
    expect(trash(g)).toEqual([C9.c2, C9.c3, ID].sort());
  });
});

describe("OP09-096 [Trigger] activate this card's [Main] effect", () => {
  function hit(top: string[]) {
    const g = theirs(L9.bb, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [...top, ...Array(10).fill(BLUE)],
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('activating looks at 3, adds the chosen {Blackbeard Pirates} card and trashes the other two', () => {
    const g = hit([C9.c2, C9.bb5, C9.c3]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.bb5]);
    pickCards(g, [C9.bb5]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([C9.bb5]);
    expect(trash(g)).toEqual([C9.c2, C9.c3, ID].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('a copy of itself in the looked-at cards is not offered', () => {
    const g = hit([ID, C9.bb4, C9.c2]);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([C9.bb4]);
  });

  it('declining the [Trigger] adds the Event to my hand; the deck is untouched', () => {
    const g = hit([C9.bb4, C9.c2, C9.c3]);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(13);
    expect(trash(g)).toEqual([]);
  });
});
