/**
 * OP13-109 Jewelry Bonney (Character, Yellow, cost 5, 6000, Counter +1000, {Bonney Pirates}/{Supernovas}).
 *
 * Card text: "If this Character would be removed from the field by your opponent's effect, you may turn
 * 1 card from the top of your Life cards face-up instead. [Trigger] Draw 2 cards and trash 1 card
 * from your hand."
 *
 * Rules: CR 8-1-3-4 (optional replacement), CR 8-1-3-4-5 (an impossible replacement cannot be
 * applied), OPEN-QUESTIONS M4b-3 (closed: a top Life card that is already face-up cannot be turned,
 * official OP15-114 Q&A), CR 10-2-1 (a battle K.O. is not an effect), RD 101-102 ([Trigger]).
 * Opposing removal: OP09-077 (K.O.), OP17-056 (return to hand), OP17-046 (bottom of the deck).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  activateTrigger,
  at,
  atMain,
  BLUE,
  bottomAim,
  bounceAim,
  chars,
  decline,
  declineTrigger,
  hand,
  hitLeader,
  attack,
  passBlock,
  koAim,
  kind,
  LD13,
  lifeFaces,
  mine,
  need,
  offered,
  pickRaw,
  SC15,
  theirsWith,
  trash,
  unusable,
  act,
  payDon,
  maybeAccept,
} from './kit-op13d.ts';

const ID = 'OP13-109';

function start(
  o: {
    life?: (string | { card: string; faceUp?: boolean })[];
    chars?: (string | { card: string; rested?: boolean })[];
  } = {},
): TestGame {
  return theirsWith(
    LD13.yellow,
    {
      characters: o.chars ?? [ID, SC15.red3],
      life: o.life ?? [BLUE, BLUE, BLUE, BLUE],
      hand: [SC15.red2],
    },
    {},
  );
}

const me = (g: TestGame) => at(g, 'p1', 'characters', ID);

describe('OP13-109 Jewelry Bonney: if removed by the opponent’s effect, may turn the top Life card face-up instead', () => {
  it('K.O. effect: the replacement is offered; accepting turns only the top Life card face-up and she stays', () => {
    const g = start();
    koAim(g, me(g));
    need(g, 'optional', 'p1');
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(g.card(me(g)).zone).toBe('characters');
    expect(g.life('p1')).toBe(4);
    expect(lifeFaces(g)).toEqual([true, false, false, false]);
    expect(trash(g)).toEqual([]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"may": declining lets the K.O. happen and no Life card is turned', () => {
    const g = start();
    koAim(g, me(g));
    need(g, 'optional', 'p1');
    decline(g);
    expect(trash(g)).toEqual([ID]);
    expect(chars(g)).toEqual([SC15.red3]);
    expect(lifeFaces(g)).toEqual([false, false, false, false]);
  });

  it('return to the hand is a removal too: accepting keeps her on the field', () => {
    const g = start();
    bounceAim(g, me(g));
    need(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toEqual([ID, SC15.red3].sort());
    expect(hand(g)).toEqual([SC15.red2]);
    expect(lifeFaces(g)[0]).toBe(true);
  });

  it('placing at the bottom of the deck is a removal too', () => {
    const g = start();
    bottomAim(g, me(g));
    need(g, 'optional', 'p1');
    accept(g);
    expect(g.card(me(g)).zone).toBe('characters');
    expect(lifeFaces(g)[0]).toBe(true);
  });

  it('M4b-3: with the top Life card already face-up the cost cannot be paid and she is K.O.’d', () => {
    const g = start({ life: [{ card: BLUE, faceUp: true }, BLUE, BLUE, BLUE] });
    koAim(g, me(g));
    unusable(g, 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(lifeFaces(g)).toEqual([true, false, false, false]);
  });

  it('with no Life cards the replacement cannot be applied: she is K.O.’d', () => {
    const g = start({ life: [] });
    koAim(g, me(g));
    unusable(g, 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('a battle K.O. is not an effect: no question, she is K.O.’d', () => {
    const g = theirsWith(
      LD13.yellow,
      { characters: [{ card: ID, rested: true }], hand: [SC15.red2] },
      { characters: [SC15.red7] },
    );
    attack(g, at(g, 'p2', 'characters', SC15.red7), me(g));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([ID]);
    expect(lifeFaces(g)).toEqual([false, false, false, false]);
  });

  it('only she is covered: another of my Characters removed by an effect gets no question', () => {
    const g = start();
    koAim(g, at(g, 'p1', 'characters', SC15.red3));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([SC15.red3]);
    expect(chars(g)).toEqual([ID]);
  });

  it('my own effect is not "your opponent’s effect": returning her myself gives no question', () => {
    const g = mine(LD13.yellow, { characters: [ID], hand: [SC15.bounce], life: [BLUE, BLUE] }, {});
    act(g, { type: 'playCard', card: g.find('p1', 'hand', SC15.bounce) });
    maybeAccept(g, 'p1');
    payDon(g, 5);
    pickRaw(g, at(g, 'p1', 'characters', ID));
    expect(kind(g)).not.toBe('optional');
    expect(hand(g)).toEqual([ID]);
    expect(lifeFaces(g)).toEqual([false, false]);
  });

  it('[Trigger]: draws 2 cards, then trashes 1 card from the hand', () => {
    const g = theirsWith(LD13.yellow, { life: [ID, BLUE, BLUE, BLUE], hand: [SC15.red2] }, {});
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(3);
    pickRaw(g, at(g, 'p1', 'hand', SC15.red2));
    expect(hand(g)).toEqual([BLUE, BLUE]);
    expect(trash(g)).toEqual([ID, SC15.red2].sort());
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('[Trigger] declined: she goes to the hand and nothing is drawn', () => {
    const g = theirsWith(LD13.yellow, { life: [ID, BLUE, BLUE, BLUE], hand: [SC15.red2] }, {});
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, SC15.red2].sort());
  });
});
