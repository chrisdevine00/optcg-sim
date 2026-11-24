/**
 * OP15-104 Conis (Character, Yellow, cost 1, 0 power, Counter +2000, {Sky Island}).
 *
 * Card text:
 *   "[On Play] If you have less Life cards than your opponent, draw 2 cards and trash 2 cards from your hand.
 *    [Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules relied on: RD 122 (a failed condition gates the whole effect), "draw then trash" are one effect
 * ("and"), the player chooses what to trash from the whole hand (drawn cards included), CR 10-1-5
 * ([Trigger] resolves instead of adding the card to hand).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  anyOrder,
  atMain,
  BLUE,
  deck,
  deckTop,
  hand,
  hitLeader,
  kind,
  LD15,
  mine,
  need,
  pickAny,
  playIt,
  SC15,
  theirs,
  trash,
} from './kit-op15c.ts';

const CONIS = 'OP15-104';
const D1 = SC15.red4;
const D2 = SC15.red5;

const life = (n: number) => Array.from({ length: n }, () => BLUE);

function play(myLife: number, oppLife: number, handCards: string[] = [SC15.red2, SC15.red3]) {
  const g = mine(
    LD15.neutral,
    { hand: [CONIS, ...handCards], life: life(myLife), deck: deckTop([D1, D2]) },
    { life: life(oppLife) },
  );
  playIt(g, CONIS);
  return g;
}

describe('OP15-104 Conis [On Play]', () => {
  it('fewer Life than the opponent (3 vs 4): draws 2, then trashes 2 cards of my choice from the whole hand', () => {
    const g = play(3, 4);
    need(g, 'choose', 'p1');
    pickAny(g, [SC15.red2, D1]);
    anyOrder(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SC15.red2, D1].sort());
    expect(hand(g)).toEqual([SC15.red3, D2].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('boundary: equal Life (4 vs 4): the condition fails, nothing is drawn or trashed', () => {
    const g = play(4, 4);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC15.red2, SC15.red3].sort());
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
  });

  it('more Life than the opponent (5 vs 4): nothing happens', () => {
    const g = play(5, 4);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toHaveLength(2);
    expect(trash(g)).toEqual([]);
  });

  it('0 Life against 1: the condition holds', () => {
    const g = play(0, 1);
    need(g, 'choose', 'p1');
    pickAny(g, [SC15.red2, SC15.red3]);
    anyOrder(g);
    expect(hand(g)).toEqual([D1, D2].sort());
    expect(trash(g)).toHaveLength(2);
  });

  it('the drawn cards may be the ones trashed', () => {
    const g = play(3, 4);
    pickAny(g, [D1, D2]);
    anyOrder(g);
    expect(hand(g)).toEqual([SC15.red2, SC15.red3].sort());
    expect(trash(g)).toEqual([D1, D2].sort());
  });

  it('with an otherwise empty hand: draws 2 and both are trashed', () => {
    const g = play(3, 4, []);
    if (kind(g) === 'choose') pickAny(g, [D1, D2]);
    anyOrder(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([D1, D2].sort());
  });

  it('it is not optional: no yes/no prompt precedes the draw', () => {
    const g = play(3, 4);
    expect(kind(g)).toBe('choose');
  });
});

describe('OP15-104 Conis [Trigger]', () => {
  const hit = (myLife: number, oppLife: number) => {
    const g = theirs(
      LD15.neutral,
      {
        life: [CONIS, ...life(myLife - 1)],
        hand: [SC15.red3],
        deck: deckTop([D1, D2]),
      },
      { life: life(oppLife) },
    );
    hitLeader(g);
    return g;
  };

  it('draws 2 cards and trashes 1 card from hand, whatever the Life totals (more Life than the opponent)', () => {
    const g = hit(5, 3);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickAny(g, [D1]);
    anyOrder(g);
    expect(hand(g).sort()).toEqual([SC15.red3, D2].sort());
    expect(trash(g).sort()).toEqual([CONIS, D1].sort());
  });

  it('the card to trash may be one that was already in hand', () => {
    const g = hit(5, 3);
    activateTrigger(g);
    pickAny(g, [SC15.red3]);
    anyOrder(g);
    expect(hand(g)).toEqual([D1, D2].sort());
  });

  it('exactly 1 card is trashed (hand goes 1 + 2 - 1 = 2)', () => {
    const g = hit(2, 4);
    activateTrigger(g);
    pickAny(g, [D2]);
    anyOrder(g);
    expect(hand(g)).toHaveLength(2);
    expect(deck(g)).toHaveLength(10);
  });
});
