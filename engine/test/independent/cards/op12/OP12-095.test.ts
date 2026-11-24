/**
 * OP12-095 Lindbergh (Character, Black, cost 4, 5000, Counter +1000, {Minks}/{Revolutionary Army}).
 *
 * Card text: "If your Leader has the "Revolutionary Army" type, this Character gains +4 cost.
 * [On Play] Draw 1 card and trash 1 card from your hand."
 *
 * Rules: the [On Play] has no Leader condition. "Draw 1 card and trash 1 card" is in that order, so the
 * card just drawn may be the one trashed. The trash is exact (not "up to"). Drawing the last card of the
 * deck loses (CR 9-2-1-2).
 */
import { describe, expect, it } from 'vitest';
import { result } from '../../helpers.ts';
import {
  at,
  atMain,
  canFinish,
  chars,
  deck,
  hand,
  kind,
  LDR,
  mine,
  need,
  offeredIds,
  pickCards,
  playRaw,
  SCN,
  topDeck,
  trash,
} from './kit-op12c.ts';

const ID = 'OP12-095';

function played(leader: string, handCards: string[], deckCards = topDeck([SCN.c6, SCN.c7])) {
  const g = mine(leader, { hand: [ID, ...handCards], deck: deckCards });
  playRaw(g, ID);
  return g;
}

describe('OP12-095 Lindbergh: +4 cost with a Revolutionary Army Leader', () => {
  it('Revolutionary Army Leader: cost 8', () => {
    const g = mine(LDR.ra, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
  });

  it('other Leader: printed cost 4; power is always 5000', () => {
    const g = mine(LDR.luffy, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(4);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(5000);
  });
});

describe('OP12-095 Lindbergh: [On Play] draw 1 card and trash 1 card from your hand', () => {
  it('draws the top card first, then asks for exactly one card of the enlarged hand to trash', () => {
    const g = played(LDR.ra, [SCN.c2, SCN.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c2, SCN.c3, SCN.c6].sort());
    expect(canFinish(g)).toBe(false);
  });

  it('the chosen card is trashed; the others stay; the deck lost exactly one card', () => {
    const g = played(LDR.ra, [SCN.c2, SCN.c3]);
    pickCards(g, [SCN.c2]);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(hand(g)).toEqual([SCN.c3, SCN.c6].sort());
    expect(deck(g)[0]).toBe(SCN.c7);
    expect(deck(g)).toHaveLength(11);
    expect(atMain(g)).toBe(true);
  });

  it('the card just drawn may be the one trashed', () => {
    const g = played(LDR.ra, [SCN.c2, SCN.c3]);
    pickCards(g, [SCN.c6]);
    expect(trash(g)).toEqual([SCN.c6]);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
  });

  it('with no other card in hand: the drawn card is the only one and ends in the trash', () => {
    const g = played(LDR.ra, []);
    if (kind(g) === 'choose') pickCards(g, [SCN.c6]);
    expect(trash(g)).toEqual([SCN.c6]);
    expect(hand(g)).toEqual([]);
    expect(atMain(g)).toBe(true);
  });

  it('it has no Leader condition: with a non-RA Leader the draw and the trash still happen', () => {
    const g = played(LDR.luffy, [SCN.c2]);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c2]);
    expect(hand(g)).toEqual([SCN.c6]);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(chars(g)).toEqual([ID]);
  });

  it('the trash is exact: only one card is trashed even with a large hand', () => {
    const g = played(LDR.ra, [SCN.c1, SCN.c2, SCN.c3, SCN.c4, SCN.c5]);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c1]);
    expect(trash(g)).toHaveLength(1);
    expect(hand(g)).toHaveLength(5);
  });

  it('drawing the last card of the deck loses the game (CR 9-2-1-2)', () => {
    const g = played(LDR.ra, [SCN.c2], [SCN.c6]);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('the top-of-deck card drawn is not a card from the Life area or trash (deck count -1)', () => {
    const g = played(LDR.ra, [SCN.c2]);
    pickCards(g, [SCN.c2]);
    expect(deck(g)).toHaveLength(11);
    expect(g.life('p1')).toBe(4);
  });
});
