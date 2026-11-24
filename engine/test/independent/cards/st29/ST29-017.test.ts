/**
 * ST29-017 Iai Death Lion Song (Event, Yellow, cost 2, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +4000 power during this
 * battle. Then, if you have 2 or less Life cards, K.O. up to 1 of your opponent's Characters with a
 * cost of 3 or less.
 * [Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: [Counter] (CR 10-2-4) costs its printed DON!!; "during this battle" ends with the battle;
 * the "if" is checked on my own Life count at resolution ("2 or less" includes 2); "up to 1" lets the
 * player pick nothing; the Trigger draws first, then trashes exactly 1 (the drawn cards qualify).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  C29,
  canCounterNow,
  canFinish,
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

const ID = 'ST29-017';

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

describe('ST29-017 Iai Death Lion Song [Counter]: +4000 this battle; with 2 or less Life also K.O. a cost 3 or less Character', () => {
  it('printed values: Event, cost 2, usable as a Counter', () => {
    const g = defend(4);
    const e = inst(g, 'p1', 'hand', ID);
    expect(g.card(e).cost).toBe(2);
    expect(canCounterNow(g, e)).toBe(true);
  });

  it('with 3 Life: my Leader gets +4000 (9000) for the battle, nothing is K.O.d, the DON!! cost 2 is paid', () => {
    const g = defend(3, 3, [], [C29.c1]);
    counterEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(kind(g)).toBe('counter');
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(don(g)).toMatchObject({ active: 1, rested: 2 });
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toEqual([ID]);
  });

  it('the +4000 ends with the battle', () => {
    const g = defend(3);
    counterEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    expect(isMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with exactly 2 Life: then K.O. up to 1 opposing Character with cost 3 or less; costs 4+ are not offered', () => {
    const g = defend(2, 3, [], [C29.c1, C29.c3, C29.c4]);
    counterEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c1, C29.c3].sort());
    pickInst(g, [inst(g, 'p2', 'characters', C29.c3)]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1, C29.c4].sort());
    expect(ids29(g, 'p2', 'trash')).toEqual([C29.c3]);
  });

  it('with 1 Life and with 0 Life the K.O. half also applies', () => {
    for (const life of [1, 0]) {
      const g = defend(life, 3, [], [C29.c2]);
      counterEvent(g, ID);
      pickInst(g, [g.leader('p1')]);
      need(g, 'choose', 'p1');
      pickInst(g, [inst(g, 'p2', 'characters', C29.c2)]);
      expect(ids29(g, 'p2', 'characters')).toEqual([]);
    }
  });

  it('with 3 Life the K.O. half is skipped even though a cost 1 Character is there', () => {
    const g = defend(3, 3, [], [C29.c1]);
    counterEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    expect(kind(g)).toBe('counter');
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
  });

  it('"up to 1" for the K.O.: choosing nothing keeps the Character; the boost stays', () => {
    const g = defend(2, 3, [], [C29.c1]);
    counterEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    none(g);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the +4000 may go to one of my Characters; my own Characters are never K.O. targets', () => {
    const g = defend(2, 3, [C29.c1], [C29.c2]);
    counterEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', C29.c1)]);
    expect(g.power(inst(g, 'p1', 'characters', C29.c1))).toBe(7000);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c2]);
  });

  it('it cannot be used as a Counter with only 1 active DON!! (cost 2)', () => {
    const g = defend(4, 1);
    expect(canCounterNow(g, inst(g, 'p1', 'hand', ID))).toBe(false);
  });
});

describe('ST29-017 Iai Death Lion Song [Trigger] Draw 2 cards and trash 1 card from your hand', () => {
  const hit = (handCards: string[] = []) => {
    const g = theirs(
      L29.croc,
      {
        life: [ID, ...fill(C29.c1, 3)],
        deck: [C29.c4, C29.c5, ...fill(C29.c1, 13)],
        hand: handCards,
      },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  };

  it('activating draws 2, then trashes exactly 1 (the drawn cards may be chosen); the Event goes to the trash', () => {
    const g = hit([C29.c2]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c2, C29.c4, C29.c5].sort());
    expect(canFinish(g)).toBe(false);
    pickInst(g, [inst(g, 'p1', 'hand', C29.c4)]);
    expect(hand(g)).toEqual([C29.c2, C29.c5].sort());
    expect(trash(g).sort()).toEqual([ID, C29.c4].sort());
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('with an empty hand: draws 2 and trashes 1, so 1 card remains', () => {
    const g = hit([]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', C29.c5)]);
    expect(hand(g)).toEqual([C29.c4]);
  });

  it('declining adds the Event to my hand and draws nothing', () => {
    const g = hit([C29.c2]);
    declineTrigger(g);
    expect(hand(g)).toEqual([C29.c2, ID].sort());
    expect(trash(g)).toEqual([]);
  });
});
