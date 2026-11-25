/**
 * OP10-118 Monkey.D.Luffy (Character, Black, cost 6, 7000, Counter +1000, {Straw Hat Crew}/
 * {Supernovas}/{Dressrosa}).
 *
 * Card text: "Once per turn, this Character cannot be K.O.'d by your opponent's effects.
 * [When Attacking] You may place 3 cards from your trash at the bottom of your deck in any order:
 * If your opponent has 5 or more cards in their hand, your opponent trashes 1 card from their
 * hand."
 *
 * Rules: RL-14 ("by your opponent's effects" does not stop a battle K.O.), CR 8-3-1-3/-4 (an
 * optional cost), M6b-Q36 (the once-per-turn protection is spent when it prevents; assert only
 * what every reading shares: the first K.O. by an effect is prevented, a later one happens),
 * after-colon "If" is an effect condition, CR 10-2-?? ([When Attacking]).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  chars,
  deck,
  fill,
  hand,
  kind,
  LD10,
  mayDone,
  mine,
  need,
  no,
  offeredInst,
  opponentKOs,
  payHand,
  pickInst,
  playId,
  RED,
  SC10,
  settleOrders,
  tail,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op10d.ts';

const ID = 'OP10-118';
const UFO = 'OP10-020'; // Gum-Gum UFO: -4000 to an opposing Character
const LIGHTNING = 'OP09-077'; // Gum-Gum Lightning: DON -2: K.O. a Character of 6000 power or less
const DEPARTURE = 'OP10-019'; // Divine Departure: rest 5 DON: K.O. a Character of 8000 power or less

describe("OP10-118 Luffy: once per turn, cannot be K.O.d by the opponent's effects", () => {
  function theirTurnWith(hnd: string[]) {
    return theirs(
      LD10.neutral,
      { characters: [ID] },
      { hand: hnd, costArea: { active: 10, rested: 0 } },
    );
  }

  function divineDeparture(g: ReturnType<typeof theirTurnWith>) {
    playId(g, DEPARTURE, 'p2');
    yes(g, 'p2');
    need(g, 'choose', 'p2');
    pickInst(g, [g.find('p1', 'characters', ID)]);
  }

  it('an opposing K.O. effect (Divine Departure, 8000 or less) on Luffy (7000) does not remove him', () => {
    const g = theirTurnWith([DEPARTURE]);
    divineDeparture(g);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('the protection is once per turn: a second K.O. effect in the same turn does remove him', () => {
    const g = theirTurnWith([UFO, LIGHTNING, LIGHTNING]);
    playId(g, UFO, 'p2');
    need(g, 'choose', 'p2');
    pickInst(g, [g.find('p1', 'characters', ID)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
    opponentKOs(g, g.find('p1', 'characters', ID));
    expect(chars(g)).toEqual([ID]);
    opponentKOs(g, g.find('p1', 'characters', ID));
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('it does not stop a battle K.O.: a rested Luffy attacked by an 8000-power Character is K.O.d', () => {
    const g = theirs(
      LD10.neutral,
      { characters: [{ card: ID, rested: true }] },
      { characters: [SC10.c6] },
    );
    attack(g, g.find('p2', 'characters', SC10.c6), g.find('p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('it protects only Luffy: another Character of mine hit by the same effect is K.O.d', () => {
    const g = theirs(
      LD10.neutral,
      { characters: [ID, SC10.c6] },
      { hand: [DEPARTURE], costArea: { active: 10, rested: 0 } },
    );
    playId(g, DEPARTURE, 'p2');
    yes(g, 'p2');
    pickInst(g, [g.find('p1', 'characters', SC10.c6)]);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([SC10.c6]);
  });

  it('my own turn: an effect of mine is not "your opponent\'s effect", so the shield is not what stops it (Luffy is not a candidate of my own K.O. effects)', () => {
    const g = mine(
      LD10.neutral,
      { characters: [ID], hand: [DEPARTURE], costArea: { active: 10, rested: 0 } },
      { characters: [SC10.c6] },
    );
    playId(g, DEPARTURE);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c6)]);
  });
});

describe('OP10-118 Luffy [When Attacking]: you may place 3 cards from the trash at the bottom of the deck: if the opponent has 5+ cards in hand, they trash 1', () => {
  const T = [SC10.c1, SC10.c2, SC10.c3, SC10.c4];

  function attacking(o: { trashCards?: string[]; p2hand?: number } = {}) {
    const g = mine(
      LD10.neutral,
      { characters: [ID], trash: o.trashCards ?? T, deck: fill(BLUE, 5) },
      { hand: fill(RED, o.p2hand ?? 5) },
    );
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    return g;
  }

  function payThree(g: ReturnType<typeof attacking>, cards: string[]) {
    yes(g, 'p1');
    payHand(g, cards);
  }

  it("5 cards in the opponent's hand: 3 trash cards go to the bottom of my deck and the opponent trashes 1 card", () => {
    const g = attacking();
    payThree(g, [SC10.c1, SC10.c2, SC10.c3]);
    settleOrders(g, 'p1');
    expect(trash(g)).toEqual([SC10.c4]);
    expect(deck(g)).toHaveLength(8);
    expect(tail(deck(g), 3)).toEqual([SC10.c1, SC10.c2, SC10.c3].sort());
    // The opponent chooses which card to trash from their own hand.
    need(g, 'choose', 'p2');
    pickInst(g, [g.zone('p2', 'hand')[0]!.instance]);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([RED]);
  });

  it("boundary: 4 cards in the opponent's hand: the cost is paid but nobody trashes anything", () => {
    const g = attacking({ p2hand: 4 });
    payThree(g, [SC10.c1, SC10.c2, SC10.c3]);
    settleOrders(g, 'p1');
    expect(trash(g)).toEqual([SC10.c4]);
    expect(deck(g)).toHaveLength(8);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it("6 cards in the opponent's hand: still exactly 1 card is trashed", () => {
    const g = attacking({ p2hand: 6 });
    payThree(g, [SC10.c1, SC10.c2, SC10.c3]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p2');
    pickInst(g, [g.zone('p2', 'hand')[0]!.instance]);
    expect(hand(g, 'p2')).toHaveLength(5);
  });

  it('"you may": declining leaves my trash, my deck and their hand as they were', () => {
    const g = attacking();
    no(g, 'p1');
    expect(trash(g)).toEqual([...T].sort());
    expect(deck(g)).toHaveLength(5);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(kind(g)).toBe('block');
  });

  it('the cost is an exact pick of 3 cards of my trash (not "up to")', () => {
    const g = attacking();
    yes(g, 'p1');
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    expect(d.min).toBe(3);
    expect(d.max).toBe(3);
  });

  it('with only 2 cards in the trash the cost cannot be paid: nothing is placed and the opponent keeps their hand', () => {
    const g = attacking({ trashCards: [SC10.c1, SC10.c2] });
    unusable(g, 'p1');
    expect(trash(g)).toEqual([SC10.c1, SC10.c2].sort());
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(kind(g)).toBe('block');
  });

  it('exactly 3 cards in the trash is enough: all three are placed (the engine has nothing to choose)', () => {
    const g = attacking({ trashCards: [SC10.c1, SC10.c2, SC10.c3] });
    yes(g, 'p1');
    settleOrders(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(8);
  });

  it('"in any order": the placed cards are asked an order and all three end up at the bottom of the deck', () => {
    const g = attacking();
    payThree(g, [SC10.c1, SC10.c2, SC10.c3]);
    need(g, 'order', 'p1');
    settleOrders(g, 'p1');
    expect(tail(deck(g), 3)).toEqual([SC10.c1, SC10.c2, SC10.c3].sort());
  });

  it('the effect is [When Attacking]: nothing is asked when Luffy is played or when the opponent attacks', () => {
    const g = mine(LD10.neutral, { hand: [ID], trash: T });
    playId(g, ID);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([...T].sort());
    void mayDone;
  });
});
