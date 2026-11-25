/**
 * OP10-061 Special Long-Range Attack!! Bagworm (Event, Blue, cost 3, {Straw Hat Crew}/{Dressrosa}).
 *
 * Card text: "[Main] Draw 1 card. Then, return up to 1 of your opponent's Characters with a cost of
 * 2 or less to the owner's hand.
 * [Trigger] Return up to 1 Character with a cost of 2 or less to the owner's hand."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 10-1-5 ([Trigger]). The [Trigger] names no owner: it may return
 * either player's Character, to its owner's hand.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  LD10,
  mayDone,
  mine,
  need,
  none,
  offeredInst,
  pickInst,
  playId,
  SC10,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-061';
const TOP = SC10.c7;

function main(p2: string[] = [SC10.c2, SC10.c3], own: string[] = [SC10.c1]) {
  const g = mine(
    LD10.neutral,
    { hand: [ID], characters: own, deck: [TOP, BLUE, BLUE, BLUE] },
    { characters: p2 },
  );
  playId(g, ID);
  return g;
}

describe("OP10-061 Bagworm [Main]: draw 1, then return up to 1 opposing Character with a cost of 2 or less to its owner's hand", () => {
  it("draws the top card, then returns a cost-2 Character (boundary) to the opponent's hand", () => {
    const g = main();
    expect(hand(g)).toEqual([TOP]);
    need(g, 'choose', 'p1');
    const p2hand = hand(g, 'p2').length;
    pickInst(g, [g.find('p2', 'characters', SC10.c2)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c3]);
    expect(hand(g, 'p2')).toHaveLength(p2hand + 1);
    expect(hand(g, 'p2')).toContain(SC10.c2);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g)).toBe(true);
  });

  it('a cost-3 Character is not a candidate', () => {
    const g = main();
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c2)]);
  });

  it('only opposing Characters: my own cost-1 Character is not offered', () => {
    const g = main([SC10.c1], [SC10.c1]);
    const theirs1 = g.find('p2', 'characters', SC10.c1);
    expect(offeredInst(g)).toEqual([theirs1]);
  });

  it('the draw happens even when there is no target at all', () => {
    const g = main([SC10.c5]);
    if (mayDone(g)) none(g);
    expect(hand(g)).toEqual([TOP]);
    expect(deck(g)).toHaveLength(3);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": the return may be skipped after drawing', () => {
    const g = main();
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([TOP]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('draws exactly 1 card (not 2): the second card of my deck stays', () => {
    const g = main();
    none(g);
    expect(deck(g)[0]).toBe(BLUE);
    expect(hand(g)).toHaveLength(1);
  });

  it('at most 1 is returned when two Characters qualify', () => {
    const g = main([SC10.c1, SC10.c2]);
    pickInst(g, [g.find('p2', 'characters', SC10.c1)]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('cost 3: not playable with 2 active DON!!', () => {
    const g = mine(LD10.neutral, { hand: [ID], costArea: { active: 2, rested: 0 } });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});

describe("OP10-061 [Trigger]: return up to 1 Character with a cost of 2 or less to the owner's hand", () => {
  function trig(p2: string[], own: string[]) {
    const g = theirs(
      LD10.neutral,
      { life: [ID, BLUE, BLUE, BLUE], characters: own, deck: [TOP, BLUE, BLUE, BLUE] },
      { characters: p2 },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('may return an opposing Character or my own: both sides are candidates, cost 3 is not', () => {
    const g = trig([SC10.c2, SC10.c3], [SC10.c1, SC10.c4]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual(
      [g.find('p2', 'characters', SC10.c2), g.find('p1', 'characters', SC10.c1)].sort(),
    );
  });

  it("a Character of mine goes back to MY hand; an opposing one goes to its owner's hand", () => {
    const own = trig([SC10.c2], [SC10.c1]);
    activateTrigger(own);
    pickInst(own, [own.find('p1', 'characters', SC10.c1)]);
    expect(hand(own)).toContain(SC10.c1);
    expect(own.zone('p1', 'characters')).toHaveLength(0);
    const opp = trig([SC10.c2], [SC10.c1]);
    activateTrigger(opp);
    pickInst(opp, [opp.find('p2', 'characters', SC10.c2)]);
    expect(hand(opp, 'p2')).toContain(SC10.c2);
    expect(hand(opp)).not.toContain(SC10.c2);
  });

  it('does not draw (the draw is only in the [Main] effect)', () => {
    const g = trig([SC10.c2], [SC10.c1]);
    const before = deck(g).length;
    activateTrigger(g);
    pickInst(g, [g.find('p2', 'characters', SC10.c2)]);
    expect(deck(g)).toHaveLength(before);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 1": may choose nothing; declining the [Trigger] adds the Event to my hand', () => {
    const g = trig([SC10.c2], [SC10.c1]);
    activateTrigger(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    const h = trig([SC10.c2], [SC10.c1]);
    declineTrigger(h);
    expect(hand(h)).toContain(ID);
  });
});
