/**
 * OP12-074 Patty (Character, Purple, cost 3, 2000, Counter +2000, {East Blue}).
 *
 * Card text: "[On Play] You may trash 1 Event from your hand: If your Leader is [Sanji], add up to 1
 * DON!! card from your DON!! deck and set it as active."
 *
 * Rules: an optional cost (CR 8-3-1-4): exactly 1 Event card from the hand (a Character is not a
 * legal payment); with no Event in hand the cost cannot be paid. The "If" is inside the effect, so
 * the cost is paid even with a non-[Sanji] Leader and nothing is added then. "Add up to 1" asks a
 * count, and the added DON!! is active (E-Q11).
 */
import { describe, expect, it } from 'vitest';
import {
  asksDonCount,
  cast,
  don,
  hand,
  kind,
  LB,
  mine,
  need,
  no,
  offeredIds,
  payHand,
  SB,
  takeDon,
  trash,
  yes,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const PATTY = 'OP12-074';
const EV = SB.event;
/** OP12-059 Concasser: another Event card (different name). */
const EV2 = 'OP12-059';

function play(leader: string, h: string[], active = 5): TestGame {
  const g = mine(leader, { hand: [PATTY, ...h], costArea: { active, rested: 0 } });
  cast(g, PATTY);
  return g;
}

describe('OP12-074 Patty: [On Play] trash 1 Event: [Sanji] Leader adds 1 active DON!!', () => {
  it('[Sanji] Leader, trash an Event: 1 DON!! is added active', () => {
    const g = play(LB.sanji, [EV, SB.sai]);
    yes(g, 'p1');
    payHand(g, [EV]);
    expect(asksDonCount(g)).toBe(true);
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ deck: 4, active: 3, rested: 3 });
    expect(trash(g)).toEqual([EV]);
    expect(hand(g)).toEqual([SB.sai]);
  });

  it('the cost accepts only an Event: Characters in hand are not offered', () => {
    const g = play(LB.sanji, [EV, EV2, SB.sai, SB.marco]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EV2, EV].sort());
  });

  it('"you may": declining the cost trashes nothing and adds no DON!!', () => {
    const g = play(LB.sanji, [EV]);
    no(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([EV]);
    expect(don(g)).toMatchObject({ deck: 5, active: 2 });
  });

  it('unpayable cost: with only Characters in hand the effect cannot be used', () => {
    const g = play(LB.sanji, [SB.sai, SB.marco]);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
    }
    expect(trash(g)).toEqual([]);
    expect(don(g)).toMatchObject({ deck: 5, active: 2 });
  });

  it('unpayable cost: an empty hand cannot use it either', () => {
    const g = play(LB.sanji, []);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
    }
    expect(don(g)).toMatchObject({ deck: 5, active: 2 });
  });

  it('must not: a Leader that is not [Sanji] adds nothing (the Event is still the cost)', () => {
    const g = play(LB.croc, [EV]);
    yes(g, 'p1');
    payHand(g, [EV]);
    expect(asksDonCount(g)).toBe(false);
    expect(trash(g)).toEqual([EV]);
    expect(don(g)).toMatchObject({ deck: 5, active: 2 });
  });

  it('"up to 1": answering 0 adds no DON!! after the cost was paid', () => {
    const g = play(LB.sanji, [EV]);
    yes(g, 'p1');
    payHand(g, [EV]);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ deck: 5, active: 2 });
    expect(trash(g)).toEqual([EV]);
  });

  it('adds at most 1 DON!! and it comes from the DON!! deck: totals stay at 10', () => {
    const g = play(LB.sanji, [EV, EV2]);
    yes(g, 'p1');
    payHand(g, [EV]);
    takeDon(g, 1);
    const d = don(g);
    expect(d.deck + d.active + d.rested + d.given).toBe(10);
    expect(hand(g)).toEqual([EV2]);
  });

  it('with no DON!! left in the DON!! deck nothing is added (all 10 on the field)', () => {
    const g = play(LB.sanji, [EV], 10);
    yes(g, 'p1');
    payHand(g, [EV]);
    if (asksDonCount(g)) {
      expect(
        g
          .legal()
          .some(
            (a) =>
              a.type === 'pick' &&
              typeof a.choice === 'object' &&
              'option' in a.choice &&
              a.choice.option === '1',
          ),
      ).toBe(false);
      takeDon(g, 0);
    }
    expect(don(g).deck).toBe(0);
  });
});
