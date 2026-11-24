/**
 * EB05-025 Domino (Character, Blue, cost 2, 3000, Counter +1000, {Impel Down}, Wisdom).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Impel Down} type card
 * and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 * [Trigger] Activate this card's [On Play] effect."
 *
 * Rules: CR 8-4-4-1/-2 ("up to"), CR 11-2-1, CR 10-1-5 ([Trigger]; the card is then trashed, RD 102),
 * RD 105 (a [Trigger] "activate" only runs the named effect).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  chars,
  checkLook,
  choiceCards,
  declineTrigger,
  deck,
  describeLookAdd,
  EL,
  finishOrders,
  hand,
  hitLeader,
  kind,
  RED,
  tail,
  theirs,
  trash,
  VAN,
} from './kit-eb05a.ts';

const DOMINO = 'EB05-025';
/** OP02-053 Crocodile: Blue, cost 5, 7000, {Impel Down}/{Former Baroque Works}, vanilla. */
const CROC_ID = 'OP02-053';
/** OP02-084 Blugori: Purple, cost 1, 3000, {Animal}/{Impel Down}, vanilla. */
const BLUGORI = 'OP02-084';
/** OP11-064 Saldeath: Purple, cost 6, 8000, {Impel Down}, vanilla. */
const SALDEATH = 'OP11-064';

describeLookAdd({
  id: DOMINO,
  title: 'Domino',
  n: 3,
  leader: EL.croc,
  match: [CROC_ID, BLUGORI],
  miss: VAN.mohji,
  beyond: SALDEATH,
});

describe('EB05-025 Domino: [Trigger] activate this card’s [On Play] effect', () => {
  function hit(top: string[], p1Hand: string[] = []) {
    const g = theirs(
      EL.croc,
      { life: [DOMINO, RED, RED, RED], deck: [...top, SALDEATH, ...fill(BLUE, 10)], hand: p1Hand },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('activating the [Trigger] runs the look: candidates are the {Impel Down} cards of the top 3', () => {
    const g = hit([CROC_ID, VAN.mohji, BLUGORI]);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([BLUGORI, CROC_ID].sort());
    checkLook(g, { candidates: [BLUGORI, CROC_ID], pick: [BLUGORI] });
    finishOrders(g);
    expect(hand(g)).toEqual([BLUGORI]);
  });

  it('the rest of the 3 looked-at cards go to the bottom of the deck', () => {
    const g = hit([CROC_ID, VAN.mohji, BLUGORI]);
    activateTrigger(g);
    checkLook(g, { candidates: [BLUGORI, CROC_ID], pick: [CROC_ID] });
    finishOrders(g);
    expect(tail(deck(g), 2)).toEqual([VAN.mohji, BLUGORI].sort());
    expect(deck(g)[0]).toBe(SALDEATH);
  });

  it('"up to 1": nothing may be added', () => {
    const g = hit([CROC_ID, VAN.mohji, BLUGORI]);
    activateTrigger(g);
    checkLook(g, { candidates: [BLUGORI, CROC_ID], pick: [] });
    finishOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
  });

  it('Domino is not played by the [Trigger]: she ends in the trash, not on the field', () => {
    const g = hit([CROC_ID, VAN.mohji, BLUGORI]);
    activateTrigger(g);
    checkLook(g, { candidates: [BLUGORI, CROC_ID], pick: [] });
    finishOrders(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([DOMINO]);
  });

  it('not activating the [Trigger]: Domino goes to hand and no look happens', () => {
    const g = hit([CROC_ID, VAN.mohji, BLUGORI]);
    declineTrigger(g);
    expect(hand(g)).toEqual([DOMINO]);
    expect(deck(g)).toHaveLength(14);
    expect(kind(g)).toBe('main');
  });

  it('only the top 3 are looked at in the [Trigger] too', () => {
    const g = hit([VAN.mohji, VAN.mohji, VAN.mohji]);
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([]);
  });
});
