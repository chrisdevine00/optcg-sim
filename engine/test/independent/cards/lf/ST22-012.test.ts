/**
 * ST22-012 Marco (Character, Blue, cost 4, 5000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "[Once Per Turn] If this Character would be K.O.'d by your opponent's effect, you may
 * trash 1 card from your hand instead.
 * [When Attacking] Reveal 1 card from the top of your deck. If that card's type includes
 * "Whitebeard Pirates", this Character gains +1000 power until the end of your opponent's next turn."
 *
 * Rules: CR 10-2 (replacement), battle K.O. is not an effect, RL-44 (the revealed card stays on top).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  chars,
  deck,
  hand,
  hasEvent,
  kind,
  LB,
  mine,
  need,
  no,
  oppBounce,
  oppKo,
  oppRemove,
  passBlock,
  passCounter,
  payHand,
  SL,
  theirs,
  toMyNextMain,
  trash,
  yes,
} from './kit-lfb.ts';

const ID = 'ST22-012';
const MISS = SL.miss;
const PAD = Array.from({ length: 10 }, () => MISS);
const LIGHTNING = 'OP09-077';

function attackWith(top: string[]) {
  const g = mine(
    LB.neutral,
    { characters: [ID], deck: [...top, ...PAD] },
    { life: [MISS, MISS, MISS, MISS] },
  );
  attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
  return g;
}

describe('ST22-012 Marco: [When Attacking] reveal the top card; if Whitebeard Pirates, +1000 power', () => {
  it('a hit: Marco gains +1000 power (5000 to 6000) and no prompt is asked', () => {
    const g = attackWith([SL.wb4, SL.c2]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
    expect(kind(g)).toBe('block');
  });

  it('a miss: no boost and the revealed card stays on top', () => {
    const g = attackWith([SL.c2, SL.wb4]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(5000);
    expect(deck(g)[0]).toBe(SL.c2);
  });

  it('"type including": Former and Allies types count; a Red-Haired type does not', () => {
    expect(g6(attackWith([SL.former3]))).toBe(6000);
    expect(g6(attackWith([SL.allies6]))).toBe(6000);
    expect(g6(attackWith([SL.rhp4]))).toBe(5000);
  });

  it('the top card is revealed on a hit and on a miss (CR 11-2-1)', () => {
    expect(hasEvent(attackWith([SL.wb4]), 'CardRevealed', { card: SL.wb4 })).toBe(true);
    expect(hasEvent(attackWith([SL.c2]), 'CardRevealed', { card: SL.c2 })).toBe(true);
  });

  it('the boost makes the difference: 6000 beats a 6000 blocker-less Leader attack target power', () => {
    const g = attackWith([SL.wb4]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(3);
  });

  it("the boost lasts through the opponent's next turn and is gone when my next turn begins", () => {
    const g = attackWith([SL.wb4]);
    passBlock(g);
    passCounter(g);
    const marco = at(g, 'p1', 'characters', ID);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(marco)).toBe(6000);
    act(g, { type: 'endTurn' });
    expect(g.power(marco)).toBe(5000);
  });

  it('it is a [When Attacking]: no reveal when Marco does not attack', () => {
    const g = mine(LB.neutral, { characters: [ID], deck: [SL.wb4, ...PAD] });
    expect(hasEvent(g, 'CardRevealed', { card: SL.wb4 })).toBe(false);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(5000);
  });
});

function g6(g: ReturnType<typeof attackWith>) {
  return g.power(at(g, 'p1', 'characters', ID));
}

describe("ST22-012 Marco: [Once Per Turn] replacement for K.O. by the opponent's effect", () => {
  const field = (hnd: string[] = [SL.c2, SL.c4]) =>
    theirs(
      LB.neutral,
      { characters: [ID], hand: hnd },
      { hand: ['OP10-019', LIGHTNING, 'OP14-048'] },
    );

  it('yes: trash 1 card from hand instead, and Marco stays on the field', () => {
    const g = field();
    oppKo(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHand(g, [SL.c4]);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([SL.c4]);
    expect(hand(g)).toEqual([SL.c2]);
  });

  it('declining: Marco is K.O.d and nothing is trashed from hand', () => {
    const g = field();
    oppKo(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toHaveLength(2);
  });

  it('with an empty hand the replacement cannot be paid and Marco is K.O.d', () => {
    const g = field([]);
    oppKo(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'optional') {
      expect(g.decider).toBe('p1');
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('exactly 1 card is trashed, and it is chosen from the whole hand', () => {
    const g = field([SL.c2, SL.c4, SL.miss]);
    oppKo(g, at(g, 'p1', 'characters', ID));
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    payHand(g, [SL.miss]);
    expect(trash(g)).toEqual([SL.miss]);
    expect(hand(g)).toEqual([SL.c2, SL.c4].sort());
  });

  it('[Once Per Turn]: used once, a second K.O. effect the same turn is not replaced', () => {
    const g = field();
    oppKo(g, at(g, 'p1', 'characters', ID));
    yes(g, 'p1');
    payHand(g, [SL.c4]);
    expect(chars(g)).toEqual([ID]);
    oppRemove(g, LIGHTNING, at(g, 'p1', 'characters', ID));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([SL.c4, ID].sort());
  });

  it('[Once Per Turn] is not spent by declining: the next K.O. effect is asked again', () => {
    const g = field();
    oppKo(g, at(g, 'p1', 'characters', ID));
    no(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('must not happen: only K.O. is replaced, not being returned to the hand', () => {
    const g = field();
    oppBounce(g, at(g, 'p1', 'characters', ID));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toContain(ID);
  });

  it('must not happen: a battle K.O. is not an effect, so no replacement is offered', () => {
    const g = theirs(
      LB.neutral,
      { characters: [{ card: ID, rested: true }], hand: [SL.c2] },
      { characters: [SL.big8] },
    );
    attack(g, g.find('p2', 'characters', SL.big8), at(g, 'p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SL.c2]);
    expect(toMyNextMain).toBeTypeOf('function');
  });
});
