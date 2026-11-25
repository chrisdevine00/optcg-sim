/**
 * OP10-060 Barrier-Barrier Pistol (Event, Blue, cost 5, {Dressrosa}/{Barto Club}).
 *
 * Card text: "[Main] Place up to 1 of your opponent's Characters with 6000 power or less at the
 * bottom of the owner's deck.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 10-1-5 ([Trigger]), CR 1-3-6 (power is the current power).
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

const ID = 'OP10-060';

function main(p2: string[] = [SC10.c4, SC10.c5], own: string[] = [SC10.c2]) {
  const g = mine(LD10.neutral, { hand: [ID], characters: own }, { characters: p2 });
  playId(g, ID);
  return g;
}

describe('OP10-060 Barrier-Barrier Pistol [Main]: place up to 1 opposing Character with 6000 power or less at the bottom of its deck', () => {
  it("moves a 6000-power Character (boundary) to the bottom of its owner's deck, not the trash", () => {
    const g = main();
    need(g, 'choose', 'p1');
    const before = deck(g, 'p2').length;
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c5]);
    expect(deck(g, 'p2')).toHaveLength(before + 1);
    expect(deck(g, 'p2')[before]).toBe(SC10.c4);
    expect(trash(g, 'p2')).toEqual([]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ID]);
  });

  it('a 7000-power Character is not a candidate', () => {
    const g = main();
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c4)]);
  });

  it('offers only opposing Characters: my own Character and the opposing Leader are excluded', () => {
    const g = main([SC10.c3], [SC10.c2]);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c3)]);
  });

  it('"up to 1": may choose nothing; at most one is moved when two qualify', () => {
    const g = main([SC10.c3, SC10.c4]);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    const h = main([SC10.c3, SC10.c4]);
    pickInst(h, [h.find('p2', 'characters', SC10.c3)]);
    expect(h.zone('p2', 'characters')).toHaveLength(1);
  });

  it("the placed card goes to the OWNER's deck (the opponent's), not mine", () => {
    const g = main([SC10.c3]);
    const mine0 = deck(g, 'p1').length;
    pickInst(g, [g.find('p2', 'characters', SC10.c3)]);
    expect(deck(g, 'p1')).toHaveLength(mine0);
    expect(deck(g, 'p2').at(-1)).toBe(SC10.c3);
  });

  it('with nothing eligible (only a 7000-power Character) nothing happens', () => {
    const g = main([SC10.c5]);
    if (mayDone(g)) {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(atMain(g)).toBe(true);
  });

  it('power is read as it is now: a 7000 Character given -4000 by an effect (3000) qualifies', () => {
    // OP10-020 (Gum-Gum UFO, -4000) first: 7000 -> 3000, then this Event may move it.
    const g = mine(
      LD10.neutral,
      { hand: ['OP10-020', ID], life: [BLUE, BLUE, BLUE, BLUE] },
      { characters: [SC10.c5] },
    );
    playUfo(g);
    playId(g, ID);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c5)]);
  });

  it('cost 5: not playable with 4 active DON!!', () => {
    const g = mine(LD10.neutral, { hand: [ID], costArea: { active: 4, rested: 0 } });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});

function playUfo(g: ReturnType<typeof main>) {
  playId(g, 'OP10-020');
  need(g, 'choose', 'p1');
  pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
  // Four Life: the "if you have 2 or less Life" sentence is not applied.
  expect(atMain(g)).toBe(true);
}

describe("OP10-060 [Trigger]: activate this card's [Main] effect", () => {
  function trig(p2: string[] = [SC10.c4, SC10.c5]) {
    const g = theirs(LD10.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: p2 });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('places a 6000-power opposing Character at the bottom of its deck; a 7000 one is not offered', () => {
    const g = trig();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c4)]);
    const before = deck(g, 'p2').length;
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(deck(g, 'p2')).toHaveLength(before + 1);
    expect(deck(g, 'p2').at(-1)).toBe(SC10.c4);
    expect(trash(g)).toEqual([ID]);
  });

  it('declining the [Trigger]: the Event goes to my hand and nothing moves', () => {
    const g = trig();
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('"up to 1": may choose nothing', () => {
    const g = trig();
    activateTrigger(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });
});
