/**
 * OP12-085 Karasu (Character, Black, cost 5, 6000, Counter +1000, {Revolutionary Army}).
 *
 * Card text: "If your Leader has the "Revolutionary Army" type, this Character gains +3 cost.
 * [When Attacking] If your Leader has the "Revolutionary Army" type and your opponent has 5 or more
 * cards in their hand, your opponent trashes 1 card from their hand."
 *
 * Rules: CR 8-3-2 ([When Attacking] fires on the attack declaration, whatever is attacked), the
 * opponent's hand trash is chosen by the opponent (the card's owner of the hand), CR 4-9 (cost
 * modifiers; the printed cost is unchanged).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  decision,
  hand,
  LDR,
  mine,
  need,
  offeredIds,
  passBlock,
  pickCards,
  SCN,
  trash,
} from './kit-op12c.ts';

const ID = 'OP12-085';
const HAND5 = [SCN.c1, SCN.c2, SCN.c3, SCN.c4, SCN.c5];

function board(leader: string, oppHand: string[], oppChars: string[] = []) {
  return mine(leader, { characters: [ID] }, { hand: oppHand, characters: oppChars });
}

describe('OP12-085 Karasu: +3 cost with a Revolutionary Army Leader', () => {
  it('Revolutionary Army Leader: cost 8', () => {
    const g = board(LDR.ra, []);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
  });

  it('a multi-type Leader that includes the type (Koala) also gives +3', () => {
    const g = board(LDR.koala, []);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
  });

  it('other Leader: printed cost 5, and the power is never changed', () => {
    const g = board(LDR.luffy, []);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(5);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
  });

  it('the +3 is for this Character only: other Characters keep their cost', () => {
    const g = mine(LDR.ra, { characters: [ID, SCN.c4] }, {});
    expect(g.card(at(g, 'p1', 'characters', SCN.c4)).cost).toBe(4);
  });
});

describe('OP12-085 Karasu: [When Attacking] opponent with 5+ cards in hand trashes 1', () => {
  it('boundary: 5 cards in hand: the opponent chooses 1 of them and trashes it', () => {
    const g = board(LDR.ra, HAND5);
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c3]);
    expect(trash(g, 'p2')).toEqual([SCN.c3]);
    expect(hand(g, 'p2')).toEqual([SCN.c1, SCN.c2, SCN.c4, SCN.c5].sort());
    expect(decision(g)?.kind).toBe('block');
  });

  it('boundary: 4 cards in hand: nothing is trashed and nothing is asked', () => {
    const g = board(LDR.ra, HAND5.slice(0, 4));
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    expect(decision(g)?.kind).toBe('block');
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('with 7 cards still exactly 1 card is trashed', () => {
    const g = board(LDR.ra, [...HAND5, SCN.c6, SCN.c7]);
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c7]);
    expect(trash(g, 'p2')).toEqual([SCN.c7]);
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(decision(g)?.kind).toBe('block');
  });

  it("the opponent's whole hand is the candidate set and the opponent decides (not me)", () => {
    const g = board(LDR.ra, HAND5);
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    need(g, 'choose', 'p2');
    expect(offeredIds(g)).toEqual([...HAND5].sort());
  });

  it('without a Revolutionary Army Leader the hand is not touched', () => {
    const g = board(LDR.luffy, HAND5);
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    expect(decision(g)?.kind).toBe('block');
    expect(hand(g, 'p2')).toHaveLength(5);
  });

  it('it fires when attacking a Character too', () => {
    const g = board(LDR.ra, HAND5, [{ card: SCN.c3, rested: true } as never]);
    attack(g, at(g, 'p1', 'characters', ID), at(g, 'p2', 'characters', SCN.c3));
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c1]);
    expect(trash(g, 'p2')).toEqual([SCN.c1]);
    passBlock(g);
  });

  it('my own hand is never touched', () => {
    const g = mine(LDR.ra, { characters: [ID], hand: [SCN.c2] }, { hand: HAND5 });
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c1]);
    expect(hand(g, 'p1')).toEqual([SCN.c2]);
    expect(trash(g, 'p1')).toEqual([]);
  });
});
