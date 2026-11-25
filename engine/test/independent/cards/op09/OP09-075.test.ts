/**
 * OP09-075 Eustass"Captain"Kid (Character, Purple, cost 3, 5000, {Kid Pirates}, Special).
 *
 * Card text: "[On Play] You may add 1 card from the top of your Life cards to your hand: If your
 * Leader has the "Kid Pirates" type, add up to 1 DON!! card from your DON!! deck and set it as
 * active."
 *
 * Rules: the "If" comes after the colon, so it is an effect condition: the cost is paid first and
 * the check follows (DECISIONS 2026-11-24, colon-less "If"; here the "If" is after the colon).
 * "Add up to N DON!!" asks a count, most first. Life is public, so an unpayable cost is not offered
 * (or offered with accept illegal).
 */
import { describe, expect, it } from 'vitest';
import {
  asksDonCount,
  at,
  atMain,
  chr,
  deck,
  don,
  donCountOptions,
  hand,
  LD9,
  lifeCards,
  mine,
  mustBeUnpayable,
  need,
  no,
  playRaw,
  SC9,
  takeDon,
  yes,
} from './kit-op09c.ts';

const KID = 'OP09-075';

function board(
  leader: string = LD9.kid,
  o: { life?: string[]; costArea?: { active: number; rested: number }; donDeck?: number } = {},
) {
  return mine(leader, {
    hand: [KID],
    life: o.life ?? [SC9.c2, SC9.c3, SC9.c4, SC9.c5],
    costArea: o.costArea ?? { active: 7, rested: 0 },
    ...(o.donDeck === undefined ? {} : { donDeck: o.donDeck }),
  });
}

describe('OP09-075 Eustass"Captain"Kid: [On Play] top Life to hand: add up to 1 DON!! active (Kid Pirates Leader)', () => {
  it('printed values: Purple Character, cost 3, 5000 power', () => {
    const g = board();
    const c = g.card(at(g, 'p1', 'hand', KID));
    expect(c.cost).toBe(3);
    playRaw(g, KID);
    yes(g);
    expect(g.power(chr(g, 'p1', KID))).toBe(5000);
  });

  it('is a "you may": playing the card asks whether to pay the Life cost', () => {
    const g = board();
    playRaw(g, KID);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
  });

  it('accepting: the TOP Life card goes to my hand, then a DON!! is added active from the DON!! deck', () => {
    const g = board();
    const before = don(g);
    playRaw(g, KID);
    yes(g);
    expect(lifeCards(g)).toHaveLength(3);
    expect(g.zone('p1', 'life')[0]!.card).toBe(SC9.c3); // the old second card is the new top
    expect(hand(g)).toEqual([SC9.c2]);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(atMain(g)).toBe(true);
    // 3 DON!! paid for the Character (rested); 1 new DON!! enters active.
    expect(don(g)).toMatchObject({ active: before.active - 3 + 1, rested: 3 });
  });

  it('"up to 1": the count may be 0 (None): the Life card is still taken, no DON!! is added', () => {
    const g = board();
    playRaw(g, KID);
    yes(g);
    expect(asksDonCount(g)).toBe(true);
    expect(donCountOptions(g)).toContain('1');
    expect(donCountOptions(g)).toContain('0');
    expect(donCountOptions(g)).not.toContain('2');
    takeDon(g, 0);
    expect(hand(g)).toEqual([SC9.c2]);
    expect(lifeCards(g)).toHaveLength(3);
    expect(don(g)).toMatchObject({ active: 4, rested: 3 });
  });

  it('declining the cost: no Life card moves and no DON!! is added', () => {
    const g = board();
    playRaw(g, KID);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(lifeCards(g)).toHaveLength(4);
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 4, rested: 3 });
  });

  it('the added DON!! is ACTIVE (it can pay for another card at once)', () => {
    const g = board(LD9.kid, { costArea: { active: 3, rested: 0 }, donDeck: 7 });
    playRaw(g, KID);
    yes(g);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(don(g)).toMatchObject({ active: 1, rested: 3 });
  });

  it('boundary: with exactly 1 Life card the cost is payable and the DON!! is still added', () => {
    const g = board(LD9.kid, { life: [SC9.c2] });
    playRaw(g, KID);
    yes(g);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(lifeCards(g)).toHaveLength(0);
    expect(hand(g)).toEqual([SC9.c2]);
    expect(don(g).active).toBe(5);
    expect(g.life('p1')).toBe(0);
  });

  it('with 0 Life cards the cost cannot be paid: nothing is added', () => {
    const g = board(LD9.kid, { life: [] });
    playRaw(g, KID);
    mustBeUnpayable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 4, rested: 3 });
  });

  it('If my Leader is not {Kid Pirates}: the cost is paid (Life to hand) but no DON!! is added', () => {
    const g = board(LD9.luffy);
    playRaw(g, KID);
    yes(g);
    // A count question, if asked, must not be reachable: nothing may be added.
    expect(asksDonCount(g)).toBe(false);
    expect(atMain(g)).toBe(true);
    expect(lifeCards(g)).toHaveLength(3);
    expect(hand(g)).toEqual([SC9.c2]);
    expect(don(g)).toMatchObject({ active: 4, rested: 3 });
  });

  it('a second Leader with the {Kid Pirates} type (OP10-099) also enables the DON!! add', () => {
    const g = board('OP10-099');
    playRaw(g, KID);
    yes(g);
    expect(asksDonCount(g)).toBe(true);
    takeDon(g, 1);
    expect(don(g).active).toBe(5);
  });

  it('with an empty DON!! deck nothing is added; the Life cost is still paid', () => {
    const g = board(LD9.kid, { costArea: { active: 10, rested: 0 } });
    expect(don(g).deck).toBe(0);
    playRaw(g, KID);
    yes(g);
    expect(asksDonCount(g)).toBe(false);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC9.c2]);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it('must not touch the opponent: their Life, hand, DON!! and the DON!! deck count of mine drop by one only', () => {
    const g = board();
    const p2 = don(g, 'p2');
    const p2Life = g.life('p2');
    const deckBefore = don(g).deck;
    playRaw(g, KID);
    yes(g);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(don(g, 'p2')).toEqual(p2);
    expect(g.life('p2')).toBe(p2Life);
    expect(don(g).deck).toBe(deckBefore - 1);
    expect(deck(g)).toHaveLength(15);
  });
});
