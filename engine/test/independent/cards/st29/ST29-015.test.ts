/**
 * ST29-015 Raw Heat Strike (Event, Yellow, cost 1, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this battle.
 * Then, if you have 1 or less Life cards, give up to 1 of your opponent's Leader or Character cards
 * -2000 power during this turn.
 * [Trigger] Draw 1 card."
 *
 * Rules: [Counter] (CR 10-2-4) is used in the Counter Step and costs its printed DON!!; "during this
 * battle" ends with the battle (RL-08); "during this turn" lasts to the end of the turn; the "if" is
 * checked on my own Life count when the effect resolves; "up to 1" lets the player pick nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  C29,
  canCounterNow,
  counterEvent,
  declineTrigger,
  don,
  fill,
  hand,
  hitLeader,
  ids29,
  inst,
  isMain,
  kind,
  L29,
  need,
  none,
  offeredIds,
  p2AttacksLeader,
  passBlock,
  pickInst,
  theirs,
  trash,
} from './kit-st29a.ts';

const ID = 'ST29-015';

/** p2's Leader (5000) attacks my Leader; I have `life` Life; the Counter Step is pending for p1. */
function defend(life: number, active = 3, chars: string[] = [], p2chars: string[] = []) {
  const g = theirs(
    L29.croc,
    { hand: [ID], life: fill(C29.c1, life), costArea: { active, rested: 0 }, characters: chars },
    { characters: p2chars },
  );
  p2AttacksLeader(g);
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe('ST29-015 Raw Heat Strike [Counter]: +2000 this battle; with 1 or less Life also -2000 to an opposing card', () => {
  it('printed values: Event, cost 1; usable as a Counter in the Counter Step', () => {
    const g = defend(4);
    const e = inst(g, 'p1', 'hand', ID);
    expect(g.card(e).cost).toBe(1);
    expect(canCounterNow(g, e)).toBe(true);
  });

  it('with 4 Life: my Leader goes 5000 -> 7000 for the battle, the 5000 attack fails and nothing else happens', () => {
    const g = defend(4);
    counterEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(kind(g)).toBe('counter');
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
  });

  it("the +2000 ends with the battle: the Leader is 5000 again in the opponent's Main Phase", () => {
    const g = defend(4);
    counterEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    expect(isMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with exactly 1 Life: the opponent card chosen next gets -2000 this turn (Leader 5000 -> 3000), lasting past the battle', () => {
    const g = defend(1);
    counterEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(1);
    expect(isMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p2'))).toBe(3000);
  });

  it('with 0 Life the condition (1 or less) also holds', () => {
    const g = defend(0);
    counterEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
  });

  it('with 2 Life (one above the limit) the second half does not happen: no -2000 and no prompt', () => {
    const g = defend(2);
    counterEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('the -2000 target may be an opposing Character, and my own cards are never offered', () => {
    const g = defend(1, 3, [C29.c1], [C29.c3]);
    counterEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L29.luffy, C29.c3].sort());
    pickInst(g, [inst(g, 'p2', 'characters', C29.c3)]);
    expect(g.power(inst(g, 'p2', 'characters', C29.c3))).toBe(3000);
  });

  it('the +2000 may go to one of my Characters instead of the Leader (up to 1 Leader or Character)', () => {
    const g = defend(4, 3, [C29.c1]);
    counterEvent(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L29.croc, C29.c1].sort());
    pickInst(g, [inst(g, 'p1', 'characters', C29.c1)]);
    expect(g.power(inst(g, 'p1', 'characters', C29.c1))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the +2000 may be given to nobody', () => {
    const g = defend(4);
    counterEvent(g, ID);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(ids29(g, 'p1', 'hand')).toEqual([]);
  });

  it('it cannot be used as a Counter without the 1 DON!! it costs', () => {
    const g = defend(4, 0);
    expect(canCounterNow(g, inst(g, 'p1', 'hand', ID))).toBe(false);
  });
});

describe('ST29-015 Raw Heat Strike [Trigger] Draw 1 card', () => {
  const hit = () => {
    const g = theirs(L29.croc, { life: [ID, ...fill(C29.c1, 3)], deck: fill(C29.c4, 15) }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  };

  it('activating draws exactly 1 card; the Event itself goes to the trash', () => {
    const g = hit();
    activateTrigger(g);
    expect(hand(g)).toEqual([C29.c4]);
    expect(trash(g)).toEqual([ID]);
  });

  it('declining adds the Event to my hand and draws nothing', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
  });
});
