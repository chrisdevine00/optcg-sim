/**
 * OP12-097 Captains Assembled (Event, Black, cost 1, {Revolutionary Army}).
 *
 * Card text: "[Main] Look at 3 cards from the top of your deck; reveal up to 1 "Revolutionary Army" type
 * card other than [Captains Assembled] and add it to your hand. Then, trash the rest.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 4-8-1 ("up to" allows 0), CR 11-2 (revealing), the rest is trashed, CR 10-1-5 ([Trigger]).
 * "Other than [Captains Assembled]" excludes every card with that name, including other copies.
 */
import { describe, expect, it } from 'vitest';
import { hasEvent } from '../kit.ts';
import { result } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  deck,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LDR,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SC3,
  SCN,
  theirs,
  topDeck,
  trash,
} from './kit-op12c.ts';

const EVENT = 'OP12-097';
/** An RA Character, an RA Event, another copy of this Event (RA, excluded by name). */
const TOP3 = [SC3.ra3, SC3.raEvent, EVENT];

function play(top: string[] = TOP3, leader: string = LDR.ra) {
  const g = mine(leader, { hand: [EVENT], deck: topDeck([...top, SCN.c6]) });
  playRaw(g, EVENT);
  return g;
}

describe('OP12-097 Captains Assembled: [Main] look at 3, add up to 1 RA card other than itself, trash the rest', () => {
  it('candidates: RA Characters and RA Events, but not another [Captains Assembled]', () => {
    const g = play();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC3.ra3, SC3.raEvent].sort());
  });

  it('the chosen card goes to hand; the other two are trashed (not put at the bottom)', () => {
    const g = play();
    pickCards(g, [SC3.raEvent]);
    expect(hand(g)).toEqual([SC3.raEvent]);
    expect(trash(g)).toEqual([SC3.ra3, EVENT, EVENT].sort());
    expect(deck(g)[0]).toBe(SCN.c6);
    expect(deck(g)).toHaveLength(11);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": adding nothing trashes all three', () => {
    const g = play();
    need(g, 'choose');
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SC3.ra3, SC3.raEvent, EVENT, EVENT].sort());
  });

  it('the added card is revealed (CR 11-2), the trashed ones are not', () => {
    const g = play();
    pickCards(g, [SC3.ra3]);
    expect(hasEvent(g, 'CardRevealed', { card: SC3.ra3 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SC3.raEvent })).toBe(false);
  });

  it('adds at most one card although two qualify', () => {
    const g = play();
    pickCards(g, [SC3.ra3]);
    expect(hand(g)).toHaveLength(1);
    expect(trash(g)).toHaveLength(3);
  });

  it('only the top 3 are looked at: an RA card in 4th place is not offered and not trashed', () => {
    const g = mine(LDR.ra, {
      hand: [EVENT],
      deck: topDeck([SCN.c3, SCN.c4, SCN.c5, SC3.ra5]),
    });
    playRaw(g, EVENT);
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(trash(g)).toEqual([SCN.c3, SCN.c4, SCN.c5, EVENT].sort());
    expect(deck(g)[0]).toBe(SC3.ra5);
  });

  it('it needs no Revolutionary Army Leader', () => {
    const g = play(TOP3, LDR.luffy);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC3.ra3, SC3.raEvent].sort());
  });

  it('with only 2 cards in the deck the 2 are looked at; trashing the rest empties the deck and loses', () => {
    const g = mine(LDR.ra, { hand: [EVENT], deck: [SC3.ra3, SCN.c3] });
    playRaw(g, EVENT);
    expect(offeredIds(g)).toEqual([SC3.ra3]);
    pickCards(g, [SC3.ra3]);
    expect(hand(g)).toEqual([SC3.ra3]);
    expect(trash(g)).toContain(SCN.c3);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });
});

describe('OP12-097 Captains Assembled: [Trigger] activate its [Main] effect', () => {
  function hit(top: string[] = [SC3.ra3, SCN.c4, SCN.c5]) {
    const g = theirs(
      LDR.ra,
      { life: [EVENT, SCN.c1, SCN.c1, SCN.c1], deck: topDeck([...top, SCN.c6]) },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('activating the Trigger runs the look: the RA card can be added', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC3.ra3]);
    pickCards(g, [SC3.ra3]);
    expect(hand(g)).toEqual([SC3.ra3]);
    expect(trash(g)).toEqual([SCN.c4, SCN.c5, EVENT].sort());
    expect(kind(g)).toBe('main');
  });

  it('declining the Trigger adds the Life card to my hand and looks at nothing', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT]);
    expect(deck(g)).toHaveLength(14);
    expect(trash(g)).toEqual([]);
  });
});
