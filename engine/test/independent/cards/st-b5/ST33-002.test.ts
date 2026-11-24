/**
 * ST33-002 Sakazuki (Blue Character, cost 4, 5000, Counter +1000, Special, {Navy}).
 *
 * Card text: "[When Attacking] You may trash 1 card from your hand: If your opponent has 6 or more cards in
 * their hand, your opponent trashes 1 card from their hand.
 * [On K.O.] Play up to 1 {Navy} type Character card with a cost of 4 or less from your hand."
 *
 * Rules: RD 120 (an unpayable cost cannot be paid), CR 8-3-3 (a failed "if" resolves nothing, the cost
 * stays paid), CR 8-4-4-1 ("up to"), CR 8-1-3 ([On K.O.] is an auto effect of the K.O.ed card).
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  atMain,
  BLUE,
  cardIds,
  choices,
  decision,
  fill,
  hand,
  kind,
  LDB,
  mayPayHand,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  pickInst,
  RED,
  SB,
  T,
  theirs,
  trash,
  TY,
  unusable,
} from './kit-stb5b.ts';

const SAK = T.sakazuki;

/** p1's turn: Sakazuki attacks p2's Leader; the opponent holds `oppHand` cards. */
function attacking(oppHand: number, mine_: string[] = [SB.c1p3]) {
  const g = mine(
    LDB.strike,
    { characters: [SAK], hand: mine_, deck: fill(BLUE, 15) },
    { hand: [...fill(RED, oppHand - 1), SB.c4p6].slice(0, oppHand) },
  );
  attack(g, g.find('p1', 'characters', SAK), g.leader('p2'));
  return g;
}

describe('ST33-002 Sakazuki: [When Attacking] trash 1: opponent with 6+ cards trashes 1; [On K.O.] play a Navy cost 4 or less', () => {
  it('opponent with 6 cards in hand: after the cost, they trash exactly 1 of their cards (their choice)', () => {
    const g = attacking(6);
    mayPayHand(g, [SB.c1p3]);
    const d = need(g, 'choose', 'p2');
    expect(d.min).toBe(1);
    expect(d.max).toBe(1);
    expect(choices(g)).toHaveLength(6);
    pickInst(g, [g.find('p2', 'hand', SB.c4p6)]);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(trash(g, 'p2')).toEqual([SB.c4p6]);
    expect(trash(g, 'p1')).toEqual([SB.c1p3]);
  });

  it('threshold: with 5 cards in hand nothing is trashed, but the cost has been paid', () => {
    const g = attacking(5);
    mayPayHand(g, [SB.c1p3]);
    expect(decision(g)?.kind).not.toBe('choose');
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(trash(g, 'p2')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([SB.c1p3]);
  });

  it('with 7 cards only one is trashed', () => {
    const g = attacking(7);
    mayPayHand(g, [SB.c1p3]);
    pickInst(g, [g.find('p2', 'hand', SB.c4p6)]);
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(kind(g)).not.toBe('choose');
  });

  it('declining the "you may": nothing is trashed by either player', () => {
    const g = attacking(6);
    no(g);
    expect(hand(g, 'p1')).toEqual([SB.c1p3]);
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(kind(g)).toBe('block');
  });

  it('RD 120: with an empty hand the cost cannot be paid and the opponent trashes nothing', () => {
    const g = attacking(6, []);
    unusable(g, 'p1');
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(kind(g)).toBe('block');
  });

  it('the battle goes on after the effect: the attack still hits the Leader', () => {
    const g = attacking(6);
    mayPayHand(g, [SB.c1p3]);
    pickInst(g, [g.find('p2', 'hand', SB.c4p6)]);
    need(g, 'block', 'p2');
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(3);
  });

  it('[On K.O.]: when K.O.ed in battle, play a {Navy} cost 4 character from hand', () => {
    const g = theirs(LDB.strike, {
      characters: [{ card: SAK, rested: true }],
      hand: [TY.navy4, SB.c3p5],
    });
    attack(g, g.leader('p2'), g.find('p1', 'characters', SAK));
    passBlock(g);
    passCounter(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TY.navy4]);
    pickCards(g, [TY.navy4]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([TY.navy4]);
    expect(trash(g, 'p1')).toEqual([SAK]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('[On K.O.] cost boundary: a {Navy} cost 5 is not offered, a {Navy} cost 2 is', () => {
    const g = theirs(LDB.strike, {
      characters: [{ card: SAK, rested: true }],
      hand: [TY.blueNavy5, TY.navy2, TY.blueNavy4],
    });
    attack(g, g.leader('p2'), g.find('p1', 'characters', SAK));
    passBlock(g);
    passCounter(g);
    expect(offeredIds(g)).toEqual([TY.blueNavy4, TY.navy2].sort());
  });

  it('[On K.O.] "up to 1": the player may play nothing', () => {
    const g = theirs(LDB.strike, {
      characters: [{ card: SAK, rested: true }],
      hand: [TY.navy4],
    });
    attack(g, g.leader('p2'), g.find('p1', 'characters', SAK));
    passBlock(g);
    passCounter(g);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([TY.navy4]);
  });

  it('[On K.O.] with no {Navy} cost 4 or less in hand: nothing to choose, nothing played', () => {
    const g = theirs(LDB.strike, {
      characters: [{ card: SAK, rested: true }],
      hand: [SB.c3p5, TY.blueNavy5],
    });
    attack(g, g.leader('p2'), g.find('p1', 'characters', SAK));
    passBlock(g);
    passCounter(g);
    expect(choices(g)).toEqual([]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });
});
