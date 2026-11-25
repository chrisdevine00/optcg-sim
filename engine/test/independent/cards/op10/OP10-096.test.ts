/**
 * OP10-096 There's No Longer Any Need for the Seven Warlords of the Sea!!! (Event, Black, cost 4,
 * {Navy}).
 *
 * Card text: "[Main] K.O. up to 1 of your opponent's {The Seven Warlords of the Sea} type Characters
 * with a cost of 8 or less.
 * [Trigger] K.O. up to 1 of your opponent's {The Seven Warlords of the Sea} type Characters with a
 * cost of 4 or less."
 *
 * Rules: CR 8-4-4-1 ("up to"), a type filter matches a card whose types include the type, CR 10-1-5
 * ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  declineTrigger,
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

const ID = 'OP10-096';

function main(p2: string[], own: string[] = []) {
  const g = mine(LD10.neutral, { hand: [ID], characters: own }, { characters: p2 });
  playId(g, ID);
  return g;
}

describe('OP10-096 [Main]: K.O. up to 1 opposing {The Seven Warlords of the Sea} Character with a cost of 8 or less', () => {
  it('K.O.s a cost-8 {Warlords} Character (boundary: 8 qualifies)', () => {
    const g = main([SC10.wl8, SC10.wl4]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.wl8)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.wl4]);
    expect(trash(g, 'p2')).toEqual([SC10.wl8]);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g)).toBe(true);
  });

  it('a cost-9 {Warlords} Character is not a candidate', () => {
    const g = main([SC10.wl9, SC10.wl6]);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.wl6)]);
  });

  it('a Character without the {Warlords} type is not a candidate however cheap', () => {
    const g = main([SC10.c2, SC10.wl3]);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.wl3)]);
  });

  it('a card whose types merely include {Warlords} qualifies (Moria is {Warlords}/{Thriller Bark Pirates})', () => {
    const g = main([SC10.wl4]);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.wl4)]);
  });

  it('only opposing Characters: my own {Warlords} Character is not offered', () => {
    const g = main([SC10.wl2], [SC10.wl3]);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.wl2)]);
  });

  it('"up to 1": may choose nothing; at most one is K.O.d when two qualify', () => {
    const g = main([SC10.wl2, SC10.wl3]);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    const h = main([SC10.wl2, SC10.wl3]);
    pickInst(h, [h.find('p2', 'characters', SC10.wl2)]);
    expect(h.zone('p2', 'characters')).toHaveLength(1);
  });

  it('with no {Warlords} Character on the opposing field nothing can be K.O.d', () => {
    const g = main([SC10.c4]);
    if (mayDone(g)) {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(atMain(g)).toBe(true);
  });

  it('cost 4: not playable with 3 active DON!!', () => {
    const g = mine(LD10.neutral, { hand: [ID], costArea: { active: 3, rested: 0 } });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});

describe('OP10-096 [Trigger]: K.O. up to 1 opposing {The Seven Warlords of the Sea} Character with a cost of 4 or less', () => {
  function trig(p2: string[]) {
    const g = theirs(LD10.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: p2 });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('K.O.s a cost-4 {Warlords} Character (boundary); a cost-6 one and a non-{Warlords} one are not offered', () => {
    const g = trig([SC10.wl4, SC10.wl6, SC10.c3]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.wl4)]);
    pickInst(g, [g.find('p2', 'characters', SC10.wl4)]);
    expect(trash(g, 'p2')).toEqual([SC10.wl4]);
    expect(trash(g)).toEqual([ID]);
  });

  it('the Main limit of 8 does not apply here: a cost-6 {Warlords} Character is out of reach', () => {
    const g = trig([SC10.wl6]);
    activateTrigger(g);
    if (mayDone(g)) {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('"up to 1": may choose nothing; declining the [Trigger] adds the Event to my hand', () => {
    const g = trig([SC10.wl3]);
    activateTrigger(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    const h = trig([SC10.wl3]);
    declineTrigger(h);
    expect(hand(h)).toContain(ID);
    expect(h.zone('p2', 'characters')).toHaveLength(1);
  });
});
