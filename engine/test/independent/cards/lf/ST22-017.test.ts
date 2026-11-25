/**
 * ST22-017 Fire Fist (Event, Blue, cost 5, {Whitebeard Pirates}).
 *
 * Card text: "[Main] You may reveal 2 cards with a type including "Whitebeard Pirates" from your
 * hand: Draw 1 card. Then, place up to 1 Character with a cost of 5 or less at the bottom of the
 * owner's deck.
 * [Trigger] Return up to 1 Character with a cost of 3 or less to the owner's hand."
 *
 * Rules: CR 8-3-1-4 (optional cost), CR 11-2 (reveal), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  activateTrigger,
  canFinish,
  chars,
  choices,
  declineTrigger,
  deck,
  donOf,
  hand,
  hasEvent,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  payHand,
  pickInst,
  playRaw,
  reachablePickSets,
  SL,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-lfb.ts';

const ID = 'ST22-017';
const MISS = SL.miss;
const PAD = Array.from({ length: 10 }, () => MISS);

function play(o: { hand?: string[]; mine?: string[]; theirs?: string[]; top?: string[] } = {}) {
  const g = mine(
    LB.neutral,
    {
      hand: [ID, ...(o.hand ?? [SL.wb4, SL.wb5])],
      characters: o.mine ?? [SL.c4],
      deck: [...(o.top ?? [SL.c2]), ...PAD],
    },
    { characters: o.theirs ?? [SL.c1], deck: [...PAD] },
  );
  playRaw(g, ID);
  return g;
}

function paid(g: ReturnType<typeof play>) {
  yes(g, 'p1');
  payHand(g, [SL.wb4, SL.wb5]);
}

describe('ST22-017 Fire Fist: [Main] you may reveal 2 Whitebeard Pirates cards: draw 1, place a cost-5-or-less Character at the bottom', () => {
  it("pays 5 DON!!, reveals 2, draws 1, and places the chosen Character at the bottom of its owner's deck", () => {
    const g = play();
    paid(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', SL.c4)]);
    expect(atMain(g)).toBe(true);
    expect(donOf(g, 'p1').active).toBe(5);
    expect(hand(g)).toEqual([SL.wb4, SL.wb5, SL.c2].sort());
    expect(chars(g)).toEqual([]);
    expect(deck(g).at(-1)).toBe(SL.c4);
    expect(trash(g)).toEqual([ID]);
  });

  it("an opposing Character goes to the bottom of the opponent's deck", () => {
    const g = play();
    paid(g);
    const theirs1 = g.find('p2', 'characters', SL.c1);
    pickInst(g, [theirs1]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'deck').at(-1)!.card).toBe(SL.c1);
    expect(g.zone('p2', 'deck')).toHaveLength(11);
    expect(deck(g).at(-1)).toBe(PAD[0]);
  });

  it('the draw comes before the placement: the drawn card is the old top', () => {
    const g = play({ top: [SL.c2, SL.c4] });
    paid(g);
    expect(hand(g)).toContain(SL.c2);
    expect(deck(g)[0]).toBe(SL.c4);
  });

  it('cost boundary: a cost-5 Character is offered, a cost-6 Character is not (both players)', () => {
    const g = play({ mine: [SL.wb5, SL.wb6], theirs: [SL.c2, SL.big8] });
    paid(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SL.wb5, SL.c2].sort());
  });

  it('"up to 1": no Character need be placed; the draw still happened', () => {
    const g = play();
    paid(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([SL.c4]);
    expect(hand(g)).toEqual([SL.wb4, SL.wb5, SL.c2].sort());
  });

  it('with no Character of cost 5 or less the pick is empty and the draw still happens', () => {
    const g = play({ mine: [SL.wb6], theirs: [SL.big8] });
    paid(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toContain(SL.c2);
  });

  it('the cost reveals exactly 2 matching cards (Former and Allies qualify, others do not)', () => {
    const g = play({ hand: [SL.wb4, SL.former3, SL.allies6, MISS, SL.c2] });
    yes(g, 'p1');
    const ok = [SL.wb4, SL.former3, SL.allies6];
    const want = [
      [ok[0], ok[1]],
      [ok[0], ok[2]],
      [ok[1], ok[2]],
    ].map((p) => [...p].sort().join('+'));
    expect([...reachablePickSets(g, 2)].filter(Boolean).sort()).toEqual(want.sort());
  });

  it('with only 1 matching card the cost cannot be paid: nothing is drawn or placed', () => {
    const g = play({ hand: [SL.wb4, MISS] });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SL.wb4, MISS].sort());
    expect(chars(g)).toEqual([SL.c4]);
  });

  it('declining ("you may"): nothing is revealed, drawn or placed', () => {
    const g = play();
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SL.wb4, SL.wb5].sort());
    expect(chars(g)).toEqual([SL.c4]);
    expect(hasEvent(g, 'CardRevealed', { card: SL.wb4 })).toBe(false);
  });

  it('the revealed cards stay in hand and are revealed (CR 11-2-1)', () => {
    const g = play();
    paid(g);
    none(g);
    expect(hand(g)).toEqual([SL.wb4, SL.wb5, SL.c2].sort());
    expect(hasEvent(g, 'CardRevealed', { card: SL.wb4 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SL.wb5 })).toBe(true);
  });
});

describe("ST22-017 Fire Fist: [Trigger] return up to 1 Character with a cost of 3 or less to the owner's hand", () => {
  const hit = (o: { mine?: string[]; theirs?: string[] } = {}) => {
    const g = theirs(
      LB.neutral,
      { life: [ID, MISS, MISS, MISS], characters: o.mine ?? [SL.c2] },
      { characters: o.theirs ?? [SL.c1] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  };

  it("activating returns an opposing Character to its owner's hand; the Event is trashed", () => {
    const g = hit();
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SL.c1)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'hand').map((c) => c.card)).toContain(SL.c1);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it("my own Character may be returned instead (either player's Characters are candidates)", () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(2);
    pickInst(g, [at(g, 'p1', 'characters', SL.c2)]);
    expect(hand(g)).toEqual([SL.c2]);
  });

  it('cost boundary: cost 3 is offered, cost 4 is not', () => {
    const g = hit({ mine: [SL.former3, SL.c4], theirs: [SL.c1] });
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SL.former3, SL.c1].sort());
  });

  it('"up to 1": nothing need be returned', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([SL.c2]);
  });

  it('declining the Trigger adds the Event to the hand and returns nothing', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(chars(g)).toEqual([SL.c2]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('the Trigger is only the Trigger text: no card is drawn and no cost is asked', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(deck(g)).toHaveLength(15);
    expect(kind(g)).toBe('choose');
  });
});
