/**
 * OP10-041 Radio Knife (Event, Green, cost 4, {Heart Pirates}/{Supernovas}/{Dressrosa}).
 *
 * Card text: "[Main] Rest up to 1 of your opponent's Characters with a cost of 6 or less. Then, K.O.
 * up to 1 of your opponent's rested Characters with a cost of 5 or less.
 * [Trigger] Rest up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 10-1-5 ([Trigger]). The K.O. looks at the board after the rest.
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

const ID = 'OP10-041';
const R = (card: string) => ({ card, rested: true });

function main(p2: (string | { card: string; rested?: boolean })[]) {
  const g = mine(LD10.neutral, { hand: [ID] }, { characters: p2 });
  playId(g, ID);
  return g;
}

describe('OP10-041 Radio Knife [Main]: rest up to 1 (cost 6 or less), then K.O. up to 1 rested (cost 5 or less)', () => {
  it('rests a cost-6 Character (boundary), which is then too expensive (6) to be K.O.d: nothing is offered for the K.O.', () => {
    const g = main([SC10.c6]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.c6)]);
    expect(g.card(g.find('p2', 'characters', SC10.c6)).rested).toBe(true);
    if (mayDone(g)) {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(atMain(g)).toBe(true);
  });

  it('a cost-7 Character is not a candidate for the rest', () => {
    const g = main([SC10.c7, SC10.c5]);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c5)]);
  });

  it('rests a cost-5 Character and may then K.O. that same Character (it is rested now): both effects in one use', () => {
    const g = main([SC10.c5]);
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([SC10.c5]);
    expect(trash(g)).toEqual([ID]);
  });

  it('the K.O. offers only rested Characters of cost 5 or less: an already rested cost-6 and an active cost-3 are excluded', () => {
    const g = main([R(SC10.c6), R(SC10.c4), SC10.c3, SC10.c5]);
    // Rest the active cost-5 Character; the rested cost-4 and the new cost-5 are the K.O. candidates.
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    expect(offeredInst(g)).toEqual(
      [g.find('p2', 'characters', SC10.c4), g.find('p2', 'characters', SC10.c5)].sort(),
    );
  });

  it('the rest may be skipped ("up to 1") yet an already rested Character can still be K.O.d', () => {
    const g = main([R(SC10.c4), SC10.c3]);
    expect(mayDone(g)).toBe(true);
    none(g);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c4)]);
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c3]);
    expect(g.card(g.find('p2', 'characters', SC10.c3)).rested).toBe(false);
  });

  it('the K.O. may be skipped ("up to 1"): the rested Character stays on the field', () => {
    const g = main([SC10.c4]);
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.card(g.find('p2', 'characters', SC10.c4)).rested).toBe(true);
  });

  it('at most one Character is rested and at most one K.O.d: with three targets two stay on the field', () => {
    const g = main([R(SC10.c3), R(SC10.c4), SC10.c5]);
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    pickInst(g, [g.find('p2', 'characters', SC10.c3)]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('must not K.O. an active Character: with only an active cost-3 Character and the rest skipped, nothing is offered', () => {
    const g = main([SC10.c3]);
    none(g);
    if (mayDone(g)) {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.card(g.find('p2', 'characters', SC10.c3)).rested).toBe(false);
  });

  it('no opposing Characters: the Event resolves with nothing to do', () => {
    const g = main([]);
    for (let i = 0; i < 2 && mayDone(g); i++) none(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ID]);
  });
});

describe('OP10-041 Radio Knife [Trigger]: rest up to 1 opposing Character with a cost of 4 or less', () => {
  function trig(p2: (string | { card: string; rested?: boolean })[] = [SC10.c4, SC10.c5]) {
    const g = theirs(LD10.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: p2 });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('rests a cost-4 Character; a cost-5 Character is not a candidate', () => {
    const g = trig();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c4)]);
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(g.card(g.find('p2', 'characters', SC10.c4)).rested).toBe(true);
    expect(trash(g)).toEqual([ID]);
  });

  it('only rests (no K.O. follows) and "up to 1" may choose nothing', () => {
    const g = trig([R(SC10.c3), SC10.c4]);
    activateTrigger(g);
    // Rested cost-3 Character is a legal "rest" candidate too (nothing happens to it); it is never K.O.d.
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('declining the [Trigger] adds the Event to my hand', () => {
    const g = trig();
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });
});
