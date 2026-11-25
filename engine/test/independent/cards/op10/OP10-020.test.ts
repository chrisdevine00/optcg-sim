/**
 * OP10-020 Gum-Gum UFO (Event, Red, cost 2, {Straw Hat Crew}/{Punk Hazard}).
 *
 * Card text: "[Main] Give up to 1 of your opponent's Characters -4000 power during this turn. Then,
 * if you have 2 or less Life cards, up to 1 of your Leader or Character cards gains +1000 power
 * during this turn.
 * [Trigger] K.O. up to 1 of your opponent's Characters with 3000 power or less."
 *
 * Rules: RL-09 ("during this turn"), CR 8-4-4-1 ("up to"), CR 10-1-5 ([Trigger]), RD 122 (a "Then"
 * after a failed "if" does not resolve; here the "if" is on the second sentence only).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  declineTrigger,
  fill,
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

const ID = 'OP10-020';

function main(o: { life?: number; own?: string[]; p2?: string[] } = {}) {
  const g = mine(
    LD10.neutral,
    {
      hand: [ID],
      life: fill(BLUE, o.life ?? 4),
      characters: o.own ?? [SC10.c3],
    },
    { characters: o.p2 ?? [SC10.c5, SC10.c6] },
  );
  playId(g, ID);
  return g;
}

describe('OP10-020 Gum-Gum UFO [Main]: -4000 to an opposing Character, then +1000 with 2 or less Life', () => {
  it('gives the chosen opposing Character -4000 (7000 becomes 3000); with 3+ Life nothing else is asked', () => {
    const g = main({ life: 3 });
    need(g, 'choose', 'p1');
    const c5 = g.find('p2', 'characters', SC10.c5);
    pickInst(g, [c5]);
    expect(g.power(c5)).toBe(3000);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([ID]);
  });

  it('offers only the opposing Characters (not the Leader, not my own)', () => {
    const g = main({ life: 3 });
    expect(offeredInst(g)).toEqual(
      g
        .zone('p2', 'characters')
        .map((c) => c.instance)
        .sort(),
    );
  });

  it('with exactly 2 Life the second sentence applies: a +1000 pick over my Leader and Characters', () => {
    const g = main({ life: 2 });
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.leader('p1'), g.find('p1', 'characters', SC10.c3)].sort());
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(atMain(g)).toBe(true);
  });

  it('boundary: 3 Life gives no +1000 pick, 1 Life and 0 Life still do', () => {
    const three = main({ life: 3 });
    pickInst(three, [three.find('p2', 'characters', SC10.c5)]);
    expect(atMain(three)).toBe(true);
    for (const life of [1, 0]) {
      const g = main({ life });
      pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
      need(g, 'choose', 'p1');
    }
  });

  it('the +1000 may go to a Character and "up to 1" may choose nothing', () => {
    const g = main({ life: 2 });
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    const c3 = g.find('p1', 'characters', SC10.c3);
    pickInst(g, [c3]);
    expect(g.power(c3)).toBe(6000);
    const h = main({ life: 2 });
    pickInst(h, [h.find('p2', 'characters', SC10.c5)]);
    expect(mayDone(h)).toBe(true);
    none(h);
    expect(h.power(h.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the -4000 may be skipped (nobody loses power)', () => {
    const g = main({ life: 3 });
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.power(g.find('p2', 'characters', SC10.c5))).toBe(7000);
    expect(g.power(g.find('p2', 'characters', SC10.c6))).toBe(8000);
  });

  it('RL-09: both power changes last the whole turn and are gone on the next turn', () => {
    const g = main({ life: 2 });
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', SC10.c5))).toBe(7000);
    act(g, { type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no opposing Character on the field the Event still resolves (the pick, if asked, has no candidate)', () => {
    const g = main({ life: 3, p2: [] });
    if (mayDone(g)) none(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ID]);
  });
});

describe('OP10-020 Gum-Gum UFO [Trigger]: K.O. up to 1 opposing Character with 3000 power or less', () => {
  function start(p2: string[] = [SC10.c1, SC10.c2]) {
    const g = theirs(LD10.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: p2 });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('K.O.s a 3000-power Character; a 4000-power Character is not a candidate', () => {
    const g = start();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c1)]);
    pickInst(g, [g.find('p2', 'characters', SC10.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c2]);
    expect(trash(g, 'p2')).toEqual([SC10.c1]);
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = start();
    activateTrigger(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('the Main effect does not run from the [Trigger]: no power change, no Life check', () => {
    const g = start([SC10.c1]);
    activateTrigger(g);
    pickInst(g, [g.find('p2', 'characters', SC10.c1)]);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the [Trigger] adds the Event to my hand and K.O.s nothing', () => {
    const g = start();
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });
});
