/**
 * ST22-002 Izo (Character, Blue, cost 1, 0 power, Counter +1000, {Land of Wano}/{Whitebeard Pirates}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 card with a type
 * including "Whitebeard Pirates" other than [Izo] and add it to your hand. Then, place the rest at
 * the bottom of your deck in any order.
 * [On Your Opponent's Attack] You may trash this Character: Draw 1 card and place 1 card from your
 * hand at the bottom of your deck."
 *
 * Rules: CR 11-2 (reveal), 8-3-1-4 (optional cost), 7-1-1-4 (an attack whose target leaves the field).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  canFinish,
  choices,
  chars,
  deck,
  declineTrigger,
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
  pickCards,
  playRaw,
  reachablePickSets,
  settleOrders,
  SL,
  tail,
  theirs,
  trash,
  yes,
} from './kit-lfb.ts';

const ID = 'ST22-002';
const MISS = SL.miss;
const PAD = Array.from({ length: 10 }, () => MISS);

/** p1 plays Izo with `top` as the top of the deck; stops at the first prompt. */
function play(top: string[], handExtra: string[] = []) {
  const g = mine(LB.neutral, { hand: [ID, ...handExtra], deck: [...top, ...PAD] });
  playRaw(g, ID);
  return g;
}

function done(g: ReturnType<typeof play>) {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
}

describe('ST22-002 Izo: [On Play] look at 5, add up to 1 Whitebeard Pirates other than Izo', () => {
  it('offers the matching cards of the top 5 only; the pick goes to hand, the rest to the bottom', () => {
    const g = play([SL.wb4, MISS, SL.wb5, SL.c2, SL.c4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SL.wb4, SL.wb5].sort());
    pickCards(g, [SL.wb5]);
    done(g);
    expect(hand(g)).toEqual([SL.wb5]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(MISS);
    expect(tail(deck(g), 4)).toEqual([SL.wb4, MISS, SL.c2, SL.c4].sort());
  });

  it('[Izo] itself is not a legal pick, even when it is among the cards looked at', () => {
    const g = play([ID, SL.wb4, MISS, MISS, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SL.wb4]);
  });

  it('with only another [Izo] among the top 5, nothing can be added and all 5 go to the bottom', () => {
    const g = play([ID, MISS, MISS, MISS, MISS]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(0);
    expect(canFinish(g)).toBe(true);
    none(g);
    done(g);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([ID, MISS, MISS, MISS, MISS].sort());
  });

  it('"type including": Former and Allies types qualify, a non-matching type does not', () => {
    const g = play([SL.former3, SL.allies6, SL.rhp4, MISS, SL.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SL.former3, SL.allies6].sort());
  });

  it('"up to 1": choosing nothing is allowed and all 5 looked-at cards go to the bottom', () => {
    const g = play([SL.wb4, SL.wb5, MISS, SL.c2, SL.c4]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    done(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(MISS);
    expect(tail(deck(g), 5)).toEqual([SL.wb4, SL.wb5, MISS, SL.c2, SL.c4].sort());
  });

  it('at most one card is added even when two qualify', () => {
    const g = play([SL.wb4, SL.wb5, MISS, SL.c2, SL.c4]);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('only the top 5 are looked at: a match in position 6 is not offered', () => {
    const g = play([MISS, MISS, MISS, MISS, MISS, SL.wb4]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(0);
    none(g);
    done(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SL.wb4);
  });

  it('the chosen card is revealed (CR 11-2-1) and the others are not', () => {
    const g = play([SL.wb4, MISS, SL.c2, SL.c4, SL.c1]);
    pickCards(g, [SL.wb4]);
    done(g);
    expect(hasEvent(g, 'CardRevealed', { card: SL.wb4 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SL.c2 })).toBe(false);
  });

  it('the effect happens on play only: Izo in hand does nothing', () => {
    const g = mine(LB.neutral, { hand: [ID], deck: [SL.wb4, ...PAD] });
    expect(atMain(g)).toBe(true);
    expect(deck(g)[0]).toBe(SL.wb4);
    expect(hand(g)).toEqual([ID]);
  });
});

describe("ST22-002 Izo: [On Your Opponent's Attack] you may trash this Character: draw 1, place 1 from hand at the bottom", () => {
  const defend = (o: { hand?: string[]; deckTop?: string[] } = {}) => {
    const g = theirs(LB.neutral, {
      characters: [ID],
      hand: o.hand ?? [SL.c2],
      deck: [...(o.deckTop ?? [SL.c4, SL.wb4]), ...PAD],
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    return g;
  };

  it('asks p1 when the opponent attacks; yes trashes Izo, draws 1 and places a chosen hand card at the bottom', () => {
    const g = defend();
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([SL.c2, SL.c4].sort());
    need(g, 'choose', 'p1');
    pickCards(g, [SL.c2]);
    expect(hand(g)).toEqual([SL.c4]);
    expect(deck(g).at(-1)).toBe(SL.c2);
    expect(deck(g)).toHaveLength(12);
    expect(chars(g)).toEqual([]);
  });

  it('the card placed may be the one just drawn', () => {
    const g = defend();
    yes(g, 'p1');
    pickCards(g, [SL.c4]);
    expect(hand(g)).toEqual([SL.c2]);
    expect(deck(g).at(-1)).toBe(SL.c4);
  });

  it('declining: Izo stays, nothing is drawn or placed, and the attack goes on to the Block Step', () => {
    const g = defend();
    no(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([SL.c2]);
    expect(trash(g)).toEqual([]);
  });

  it('with an empty hand the drawn card is the only card and must be placed at the bottom', () => {
    const g = defend({ hand: [] });
    yes(g, 'p1');
    if (kind(g) === 'choose') pickCards(g, [SL.c4]);
    expect(hand(g)).toEqual([]);
    expect(deck(g).at(-1)).toBe(SL.c4);
  });

  it('it also triggers when the opponent attacks a rested Izo, which is trashed as a cost', () => {
    const g = theirs(LB.neutral, {
      characters: [{ card: ID, rested: true }],
      hand: [SL.c2],
      deck: [SL.c4, ...PAD],
    });
    attack(g, g.leader('p2'), at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    pickCards(g, [SL.c2]);
    expect(trash(g)).toEqual([ID]);
    // The attack target left the field: the battle ends, p1 loses no Life.
    expect(g.life('p1')).toBe(4);
  });

  it('after the trash and draw, p1 still gets to place a card before the attack continues', () => {
    const g = defend();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickCards(g, [SL.c2]);
    expect(['block', 'counter']).toContain(kind(g));
    passBlock(g);
    expect(kind(g)).toBe('counter');
    act(g, { type: 'endCounter' });
    declineTrigger(g);
    expect(g.life('p1')).toBe(3);
  });

  it("is not used when I attack: it triggers on the opponent's attacks only", () => {
    const g = mine(LB.neutral, { characters: [ID] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(kind(g)).not.toBe('optional');
  });
});
