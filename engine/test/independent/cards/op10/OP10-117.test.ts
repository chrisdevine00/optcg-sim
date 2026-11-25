/**
 * OP10-117 ROOM (Event, Yellow, cost 1, {Heart Pirates}/{Supernovas}).
 *
 * Card text: "[Counter] If you have 1 or less Life cards, up to 1 of your Leader or Character cards
 * gains +3000 power during this battle. Then, set up to 1 of your Characters with a cost of 5 or
 * less as active.
 * [Trigger] Draw 1 card."
 *
 * Rules: RL-08 ("during this battle"), CR 8-4-4-1 ("up to"), RD 122 / M4b-5 (a "Then" after a
 * failed "If" does not resolve: with 2 or more Life nothing at all happens), a colon-less "If" is
 * an effect condition (the Event is still used), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { act, passCounter } from '../../helpers.ts';
import {
  activateCounter,
  activateTrigger,
  BLUE,
  canCounterNow,
  declineTrigger,
  defend,
  deck,
  fill,
  hand,
  hitLeader,
  kind,
  LD10,
  mayDone,
  need,
  none,
  offeredInst,
  pickInst,
  SC10,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-117';
const R = (card: string) => ({ card, rested: true });

function counter(life: number, chars = [R(SC10.c5), R(SC10.c6)]) {
  const g = defend({
    hand: [ID],
    active: 1,
    life: fill(BLUE, life),
    chars,
    p2chars: [SC10.c5],
  });
  activateCounter(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP10-117 ROOM [Counter]: with 1 or less Life, +3000 this battle, then set up to 1 Character (cost 5 or less) as active', () => {
  it('1 Life: +3000 on my Leader (8000), then a rested cost-5 Character is set active', () => {
    const g = counter(1);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', SC10.c5)]);
    expect(g.card(g.find('p1', 'characters', SC10.c5)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', SC10.c6)).rested).toBe(true);
    passCounter(g);
    expect(g.life('p1')).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('0 Life also satisfies "1 or less"', () => {
    const g = counter(0);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('boundary: 2 Life: the "If" fails, so neither the boost nor the set-active happens and no prompt is asked', () => {
    const g = counter(2);
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.find('p1', 'characters', SC10.c5)).rested).toBe(true);
    expect(trash(g)).toEqual([ID]);
  });

  it('with 2 Life the Event is spent and the 5000 attack connects', () => {
    const g = counter(2);
    passCounter(g);
    expect(g.life('p1')).toBe(1);
  });

  it('the set-active pick offers only my Characters with cost 5 or less: a cost-6 Character is excluded', () => {
    const g = counter(1);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p1', 'characters', SC10.c5)]);
  });

  it("the boost pick offers my Leader and Characters, never the opponent's", () => {
    const g = counter(1);
    expect(offeredInst(g)).toEqual(
      [
        g.leader('p1'),
        g.find('p1', 'characters', SC10.c5),
        g.find('p1', 'characters', SC10.c6),
      ].sort(),
    );
  });

  it('"up to 1": the boost and the set-active may each be skipped', () => {
    const g = counter(1);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    if (mayDone(g)) {
      none(g);
      expect(g.card(g.find('p1', 'characters', SC10.c5)).rested).toBe(true);
    }
  });

  it('the set-active does not depend on which card got the boost: boosting a Character and activating another', () => {
    const g = counter(1, [R(SC10.c3), R(SC10.c4)]);
    pickInst(g, [g.find('p1', 'characters', SC10.c3)]);
    expect(g.power(g.find('p1', 'characters', SC10.c3))).toBe(8000);
    pickInst(g, [g.find('p1', 'characters', SC10.c4)]);
    expect(g.card(g.find('p1', 'characters', SC10.c4)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', SC10.c3)).rested).toBe(true);
  });

  it('only 1 Character is set active even when two qualify', () => {
    const g = counter(1, [R(SC10.c3), R(SC10.c4)]);
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [g.find('p1', 'characters', SC10.c3)]);
    expect(g.card(g.find('p1', 'characters', SC10.c4)).rested).toBe(true);
  });

  it('cost 1: with 0 active DON!! it cannot be used as a Counter', () => {
    const g = defend({ hand: [ID], active: 0, p2chars: [SC10.c5] });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
    act(g, { type: 'endCounter' });
  });
});

describe('OP10-117 ROOM [Trigger]: draw 1 card', () => {
  function trig() {
    const g = theirs(LD10.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [SC10.c7, BLUE, BLUE, BLUE],
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('draws exactly 1 card, and the Event is trashed', () => {
    const g = trig();
    activateTrigger(g);
    expect(hand(g)).toEqual([SC10.c7]);
    expect(deck(g)).toHaveLength(3);
    expect(trash(g)).toEqual([ID]);
  });

  it('declining the [Trigger]: the Event goes to my hand and nothing is drawn', () => {
    const g = trig();
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(4);
  });

  it('the Counter text does not run from the [Trigger]: no power change, no set-active', () => {
    const g = trig();
    activateTrigger(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kind(g)).toBe('main');
  });
});
