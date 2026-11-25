/**
 * OP09-089 Stronger (Character, Black, cost 1, 0 power, Counter +2000, {Animal}/{Blackbeard
 * Pirates}, Wisdom).
 *
 * Card text: "[Activate: Main] You may trash 1 card from your hand and trash this Character: If your
 * Leader has the "Blackbeard Pirates" type, draw 1 card. Then, give up to 1 of your opponent's
 * Characters −2 cost during this turn."
 *
 * Rules: both trashes are the cost (paid before the "If", which is after the colon and so an effect
 * condition); a "Then" after a failed "If" does not resolve (M4b-5); trashing is not a K.O.
 * (CR 10-2-1-3). "Up to 1" may be 0. Costs are floored at 0 outside a calculation (CR 1-3-6-2).
 */
import { describe, expect, it } from 'vitest';
import {
  abil,
  actRaw,
  atMain,
  chr,
  deck,
  endTurn,
  hand,
  kind,
  LD9,
  mayEnd,
  mine,
  need,
  none,
  offeredIds,
  offeredInsts,
  payHand,
  pickInst,
  SC9,
  trash,
} from './kit-op09c.ts';

const STR = 'OP09-089';
const DECK = [SC9.c8, SC9.c7, SC9.c6, SC9.c5];

function board(
  leader: string = LD9.bbp,
  handCards: string[] = [SC9.c1],
  p2chars: string[] = [SC9.c4],
) {
  return mine(leader, { characters: [STR], hand: handCards, deck: DECK }, { characters: p2chars });
}

/** Activate and pay the hand cost with `pay`; leaves whatever comes next pending. */
function start(g: ReturnType<typeof board>, pay: string) {
  actRaw(g, chr(g, 'p1', STR));
  need(g, 'choose', 'p1');
  payHand(g, [pay]);
}

describe('OP09-089 Stronger: [Activate: Main] trash 1 from hand and this: draw 1, then -2 cost', () => {
  it('printed values: cost 1, 0 power, Counter +2000', () => {
    const g = board();
    const c = g.card(chr(g, 'p1', STR));
    expect(c.cost).toBe(1);
    expect(c.power).toBe(0);
    expect(c.counter).toBe(2000);
  });

  it('with a card in hand the ability is offered; paying trashes the chosen card AND Stronger', () => {
    const g = board(LD9.bbp, [SC9.c1, SC9.c2]);
    expect(abil(g, chr(g, 'p1', STR))).toHaveLength(1);
    start(g, SC9.c2);
    expect(trash(g)).toEqual([STR, SC9.c2].sort());
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('then draws 1 card from the top of my deck', () => {
    const g = board(LD9.bbp, [SC9.c1, SC9.c2]);
    start(g, SC9.c2);
    expect(hand(g)).toEqual([SC9.c1, SC9.c8].sort());
    expect(deck(g)).toHaveLength(DECK.length - 1);
    expect(deck(g)[0]).toBe(SC9.c7);
  });

  it("then offers the opponent's Characters for -2 cost, and applies exactly -2 to the chosen one", () => {
    const g = board(LD9.bbp, [SC9.c1], [SC9.c4, SC9.c3]);
    start(g, SC9.c1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC9.c3, SC9.c4].sort());
    pickInst(g, [chr(g, 'p2', SC9.c4)]);
    expect(atMain(g)).toBe(true);
    expect(g.card(chr(g, 'p2', SC9.c4)).cost).toBe(2);
    expect(g.card(chr(g, 'p2', SC9.c3)).cost).toBe(3);
  });

  it('the cost reduction floors at 0: a cost-1 Character reads 0', () => {
    const g = board(LD9.bbp, [SC9.c1], [SC9.c1]);
    start(g, SC9.c1);
    pickInst(g, [chr(g, 'p2', SC9.c1)]);
    expect(g.card(chr(g, 'p2', SC9.c1)).cost).toBe(0);
  });

  it('"up to 1": the target may be skipped; the card is still drawn', () => {
    const g = board();
    start(g, SC9.c1);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([SC9.c8]);
    expect(g.card(chr(g, 'p2', SC9.c4)).cost).toBe(4);
  });

  it("the reduction ends with the turn: the opponent's Character has its printed cost on their turn", () => {
    const g = board();
    start(g, SC9.c1);
    pickInst(g, [chr(g, 'p2', SC9.c4)]);
    expect(g.card(chr(g, 'p2', SC9.c4)).cost).toBe(2);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', SC9.c4)).cost).toBe(4);
  });

  it('a Leader without {Blackbeard Pirates}: the cost is paid but nothing is drawn and no cost is reduced', () => {
    const g = board(LD9.luffy);
    start(g, SC9.c1);
    // "Then" after a failed "If" does not resolve: no target is asked either (an empty pick may be shown).
    if (kind(g) === 'choose') {
      expect(offeredInsts(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([STR, SC9.c1].sort());
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length);
    expect(g.card(chr(g, 'p2', SC9.c4)).cost).toBe(4);
  });

  it('the hand cost needs a card: with an empty hand the ability is not offered and Stronger stays', () => {
    const g = board(LD9.bbp, []);
    expect(abil(g, chr(g, 'p1', STR))).toEqual([]);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('with exactly one card in hand it is that card that is trashed (the cost is forced), then I draw', () => {
    const g = board(LD9.bbp, [SC9.c2]);
    actRaw(g, chr(g, 'p1', STR));
    if (kind(g) === 'choose' && g.legal().some((a) => a.type === 'pick')) {
      const d = need(g, 'choose', 'p1');
      if (d.purpose === 'cost') payHand(g, [SC9.c2]);
    }
    expect(trash(g)).toEqual([STR, SC9.c2].sort());
    expect(hand(g)).toEqual([SC9.c8]);
  });

  it('is not usable again: the Character is gone after paying', () => {
    const g = board();
    start(g, SC9.c1);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it("must not draw from or reduce my own Characters: only the opponent's Characters are offered", () => {
    const g = mine(
      LD9.bbp,
      { characters: [STR, SC9.c5], hand: [SC9.c1], deck: DECK },
      { characters: [SC9.c4] },
    );
    start(g, SC9.c1);
    expect(offeredInsts(g)).not.toContain(chr(g, 'p1', SC9.c5));
    expect(offeredIds(g)).toEqual([SC9.c4]);
  });
});
