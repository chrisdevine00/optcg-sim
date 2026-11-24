/**
 * OP12-013 Hatchan (Character, Red, cost 1, 2000, Counter +1000, {Fish-Man} {Former Arlong
 * Pirates}).
 *
 * Card text: "[Activate: Main] You may rest this Character and reveal 2 Events from your hand: Give up
 * to 2 rested DON!! cards to your Leader or 1 of your Characters."
 *
 * Rules: resting this Character is part of the cost, so it needs to be active; revealed cards stay
 * in the hand; "give up to 2 rested DON!!" takes rested DON!! of the cost area and "up to" lets the
 * player give fewer (M4b-4, ST01-011 Q&A); each given DON!! is +1000 power on the owner's turn
 * (CR 6-5-5-2); active DON!! are not given. A given DON!!'s own state (M6b-Q32) is not asserted:
 * only cost-area totals, the given count and the power.
 */
import { describe, expect, it } from 'vitest';
import {
  activateReveal2,
  chr,
  donOf,
  giveDonFlow,
  kind,
  LD12,
  mine,
  need,
  offeredCardIds,
  offeredOn,
  revealedByEffects,
  S12,
  settleEmpty,
  sorted,
  startActivate,
  revealCost,
  toMyNextMain,
} from './kit-op12a.ts';

const HAT = 'OP12-013';
const E = S12.event;

function board(
  rested: number,
  hand: string[] = [E, E],
  chars: (string | { card: string; rested?: boolean })[] = [],
  active = 3,
) {
  return mine(LD12.luffy, {
    hand,
    characters: [HAT, ...chars],
    costArea: { active, rested },
  });
}

describe('OP12-013 Hatchan: rest this, reveal 2 Events: give up to 2 rested DON!!', () => {
  it('printed values: cost 1, 2000, Counter +1000', () => {
    const g = board(0);
    const c = g.card(chr(g, 'p1', HAT));
    expect([c.cost, c.power, c.counter]).toEqual([1, 2000, 1000]);
  });

  it('pays rest + reveal, then gives 2 rested DON!! to the Leader: +2000 on my turn, Events stay in hand', () => {
    const g = board(2);
    activateReveal2(g, chr(g, 'p1', HAT));
    expect(g.card(chr(g, 'p1', HAT)).rested).toBe(true);
    expect(revealedByEffects(g)).toEqual([E, E]);
    giveDonFlow(g, 2, g.leader('p1'));
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(sorted(g, 'p1', 'hand')).toEqual([E, E]);
  });

  it('can give them to one Character instead', () => {
    const g = board(2, [E, E], [S12.sai]);
    activateReveal2(g, chr(g, 'p1', HAT));
    giveDonFlow(g, 2, chr(g, 'p1', S12.sai));
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the targets are the Leader and own Characters only (Hatchan itself included), not opponent cards', () => {
    const g = mine(
      LD12.luffy,
      { hand: [E, E], characters: [HAT, S12.sai], costArea: { active: 3, rested: 2 } },
      { characters: [S12.sunny] },
    );
    activateReveal2(g, chr(g, 'p1', HAT));
    // the count question is answered first (a mode choice), then the target
    need(g, 'choose', 'p1');
    const seen: (string | null)[] = [];
    for (let i = 0; i < 2 && kind(g) === 'choose'; i++) {
      if (
        g
          .legal()
          .some((a) => a.type === 'pick' && typeof a.choice === 'object' && 'option' in a.choice)
      ) {
        g.act({ type: 'pick', choice: { option: '2' } });
      } else {
        seen.push(...offeredCardIds(g));
        break;
      }
    }
    expect(seen).toEqual([HAT, LD12.luffy, S12.sai].sort());
  });

  it('"up to 2": giving only 1 leaves the other DON!! rested in the cost area', () => {
    const g = board(2);
    activateReveal2(g, chr(g, 'p1', HAT));
    giveDonFlow(g, 1, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('with only 1 rested DON!! at most 1 is given', () => {
    const g = board(1);
    activateReveal2(g, chr(g, 'p1', HAT));
    giveDonFlow(g, 1, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, given: 1 });
  });

  it('must not: with no rested DON!! nothing is given and no active DON!! is moved', () => {
    const g = board(0);
    if (offeredOn(g, chr(g, 'p1', HAT)).length > 0) {
      startActivate(g, chr(g, 'p1', HAT));
      revealCost(g, 2);
      settleEmpty(g);
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('not offered when Hatchan is already rested (resting is part of the cost)', () => {
    const g = board(2, [E, E], []);
    const g2 = mine(LD12.luffy, {
      hand: [E, E],
      characters: [{ card: HAT, rested: true }],
      costArea: { active: 3, rested: 2 },
    });
    expect(offeredOn(g, chr(g, 'p1', HAT))).toHaveLength(1);
    expect(offeredOn(g2, chr(g2, 'p1', HAT))).toEqual([]);
  });

  it('needs 2 Events: not offered with one Event or none', () => {
    const one = board(2, [E, S12.sunny, S12.sai]);
    expect(offeredOn(one, chr(one, 'p1', HAT))).toEqual([]);
    const none2 = board(2, [S12.sunny, S12.sai]);
    expect(offeredOn(none2, chr(none2, 'p1', HAT))).toEqual([]);
  });

  it('must not: the given DON!! return at my next Refresh Phase and Hatchan wakes up', () => {
    const g = board(2);
    activateReveal2(g, chr(g, 'p1', HAT));
    giveDonFlow(g, 2, g.leader('p1'));
    toMyNextMain(g);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(g.card(chr(g, 'p1', HAT)).rested).toBe(false);
  });
});
