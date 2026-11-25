/**
 * OP10-079 God Thread (Event, Purple, cost 5, {Donquixote Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Main] K.O. up to 1 of your opponent's Characters with a cost 5 or less. Then, add up to
 * 1 DON!! card from your DON!! deck and set it as active.
 * [Trigger] Add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: CR 8-4-4-1 ("up to"), E-Q11 ("add up to N DON!!" asks a count), CR 6-4 / 5-2 (DON!! deck),
 * a DON!! added "as active" is untapped in the cost area, CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  asksDonCount,
  atMain,
  BLUE,
  declineTrigger,
  don,
  donCountOptions,
  hand,
  hitLeader,
  kind,
  LD10,
  mayDone,
  mine,
  need,
  none,
  offeredInst,
  pickInst,
  playId,
  SC10,
  takeDon,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-079';

function main(o: { active?: number; p2?: string[] } = {}) {
  const active = o.active ?? 5;
  const g = mine(
    LD10.neutral,
    {
      hand: [ID],
      costArea: { active, rested: 0 },
    },
    { characters: o.p2 ?? [SC10.c5, SC10.c6] },
  );
  playId(g, ID);
  return g;
}

describe('OP10-079 God Thread [Main]: K.O. up to 1 Character with cost 5 or less, then add up to 1 DON!! as active', () => {
  it('K.O.s a cost-5 Character (boundary) and then adds 1 DON!! from the DON!! deck, active', () => {
    const g = main();
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c6]);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(atMain(g)).toBe(true);
    // 5 cost: the Event rested all 5; the added DON!! is active, the DON!! deck is one smaller.
    expect(don(g, 'p1').active).toBe(1);
    expect(don(g, 'p1').rested).toBe(5);
    expect(trash(g, 'p2')).toEqual([SC10.c5]);
    expect(trash(g)).toEqual([ID]);
  });

  it('a cost-6 Character is not a candidate', () => {
    const g = main();
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c5)]);
  });

  it('only opposing Characters are offered (not the Leader)', () => {
    const g = main({ p2: [SC10.c3] });
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c3)]);
  });

  it('"up to 1": the K.O. may be skipped', () => {
    const g = main();
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('"add up to 1": the count may be 0 and then no DON!! is added', () => {
    const g = main();
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    if (asksDonCount(g)) {
      expect(donCountOptions(g)).toContain('0');
      expect(donCountOptions(g)).toContain('1');
      takeDon(g, 0);
    } else {
      throw new Error('Expected the DON!! count to be asked');
    }
    expect(don(g, 'p1').active).toBe(0);
    expect(don(g, 'p1').rested).toBe(5);
  });

  it('at most 1 DON!! is added: the count offered never exceeds 1', () => {
    const g = main();
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    expect(
      donCountOptions(g)
        .map(Number)
        .every((n) => n <= 1),
    ).toBe(true);
  });

  it('with an empty DON!! deck nothing can be added (cost area stays at 5, all rested)', () => {
    const g = main({ active: 10 });
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(10);
  });

  it('the DON!! is added even when the K.O. was skipped ("Then" does not depend on a K.O.)', () => {
    const g = main({ p2: [SC10.c6] });
    // Nothing is a candidate for the K.O. (cost 6). The DON!! step is unconditional text.
    if (mayDone(g)) none(g);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(don(g, 'p1').active).toBe(1);
  });
});

describe('OP10-079 God Thread [Trigger]: add up to 1 DON!! from the DON!! deck, active', () => {
  function trig() {
    const g = theirs(
      LD10.neutral,
      { life: [ID, BLUE, BLUE, BLUE], costArea: { active: 0, rested: 0 } },
      { characters: [SC10.c3] },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('adds 1 active DON!! and does not K.O. anything', () => {
    const g = trig();
    activateTrigger(g);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(don(g, 'p1').active).toBe(1);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(trash(g)).toEqual([ID]);
  });

  it('the count may be 0', () => {
    const g = trig();
    activateTrigger(g);
    if (asksDonCount(g)) takeDon(g, 0);
    expect(don(g, 'p1').active).toBe(0);
  });

  it('declining the [Trigger] adds the Event to my hand and no DON!!', () => {
    const g = trig();
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(don(g, 'p1').active).toBe(0);
  });
});
