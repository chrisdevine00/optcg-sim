/**
 * OP10-115 Let's Meet Again in the New World (Event, Yellow, cost 2, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +4000 power during this
 * battle. Then, if you have 0 Life cards, draw 1 card.
 * [Trigger] K.O. up to 1 of your opponent's Characters with a cost equal to or less than the
 * number of your opponent's Life cards."
 *
 * Rules: RL-08 ("during this battle"), CR 8-4-4-1 ("up to"), CR 10-1-5 ([Trigger]; the Life card
 * with the [Trigger] has already left the Life area when it resolves), the number of Life cards is
 * read when the effect resolves.
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
  LD10,
  mayDone,
  need,
  none,
  offeredInst,
  pickInst,
  RED,
  SC10,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-115';
const TOP = SC10.c7;

function counter(life: number) {
  const g = defend({
    hand: [ID],
    active: 2,
    life: fill(BLUE, life),
    chars: [SC10.c3],
    p2chars: [SC10.c5],
    deck: [TOP, BLUE, BLUE, BLUE],
  });
  activateCounter(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP10-115 [Counter]: +4000 this battle; with 0 Life cards, draw 1', () => {
  it('0 Life: +4000 on my Leader (9000) survives a 5000 attack that would otherwise defeat me, and 1 card is drawn', () => {
    const g = counter(0);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g)).toEqual([TOP]);
    passCounter(g);
    expect(g.life('p1')).toBe(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boundary: 1 Life card is not "0 Life cards": no draw', () => {
    const g = counter(1);
    pickInst(g, [g.leader('p1')]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(TOP);
  });

  it('with 4 Life the boost still applies and nothing is drawn', () => {
    const g = counter(4);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g)).toEqual([]);
  });

  it('the +4000 may go to one of my Characters instead of the Leader', () => {
    const g = counter(2);
    const c3 = g.find('p1', 'characters', SC10.c3);
    expect(offeredInst(g)).toEqual([g.leader('p1'), c3].sort());
    pickInst(g, [c3]);
    expect(g.power(c3)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only my own Leader and Characters are candidates', () => {
    const g = counter(2);
    expect(offeredInst(g)).not.toContain(g.leader('p2'));
    expect(offeredInst(g)).not.toContain(g.find('p2', 'characters', SC10.c5));
  });

  it('"up to 1": the boost may be skipped; the draw check is separate (0 Life still draws exactly 1 or none)', () => {
    const g = counter(0);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g).length).toBeLessThanOrEqual(1);
  });

  it('draws exactly 1 card, not more', () => {
    const g = counter(0);
    pickInst(g, [g.leader('p1')]);
    expect(deck(g)).toHaveLength(3);
  });

  it('the boost ends with the battle', () => {
    const g = counter(3);
    pickInst(g, [g.leader('p1')]);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(3);
  });

  it('cost 2: with 1 active DON!! it cannot be used as a Counter', () => {
    const g = defend({ hand: [ID], active: 1, p2chars: [SC10.c5] });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
    act(g, { type: 'endCounter' });
  });
});

describe("OP10-115 [Trigger]: K.O. up to 1 opposing Character with a cost equal to or less than the number of the opponent's Life cards", () => {
  function trig(p2life: number, p2chars: string[]) {
    const g = theirs(
      LD10.neutral,
      { life: [ID, BLUE, BLUE, BLUE] },
      { life: fill(RED, p2life), characters: p2chars },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('with 4 opposing Life cards: a cost-4 Character is K.O.d, a cost-5 Character is not offered', () => {
    const g = trig(4, [SC10.c4, SC10.c5]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c4)]);
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c5]);
    expect(trash(g, 'p2')).toEqual([SC10.c4]);
    expect(trash(g)).toEqual([ID]);
  });

  it("the limit follows the opponent's Life: with 2 Life a cost-2 Character qualifies, a cost-3 one does not", () => {
    const g = trig(2, [SC10.c2, SC10.c3]);
    activateTrigger(g);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c2)]);
  });

  it("it is the OPPONENT's Life that counts, not mine (I have 3 left after the hit)", () => {
    const g = trig(5, [SC10.c5, SC10.c6]);
    activateTrigger(g);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c5)]);
  });

  it('"up to 1": may choose nothing; at most one is K.O.d', () => {
    const g = trig(5, [SC10.c3, SC10.c4]);
    activateTrigger(g);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    const h = trig(5, [SC10.c3, SC10.c4]);
    activateTrigger(h);
    pickInst(h, [h.find('p2', 'characters', SC10.c3)]);
    expect(h.zone('p2', 'characters')).toHaveLength(1);
  });

  it('with 0 Life the opponent has none of their Characters in reach (cost 1 and up): nothing is offered', () => {
    const g = trig(0, [SC10.c1]);
    activateTrigger(g);
    if (mayDone(g)) {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('declining the [Trigger]: the Event goes to my hand and nothing is K.O.d; no card is drawn by the Counter text', () => {
    const g = trig(4, [SC10.c3]);
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
