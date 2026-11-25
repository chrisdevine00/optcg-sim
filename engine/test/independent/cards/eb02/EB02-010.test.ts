/**
 * EB02-010 Monkey.D.Luffy (Leader, 5000, 4 Life, {Straw Hat Crew}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] DON!! −2: If the only Characters on your field are
 * "Straw Hat Crew" type Characters, set up to 2 of your DON!! cards as active. Then, this Leader
 * gains +1000 power until the end of your opponent's next turn."
 *
 * Reading: the "If" stands after the cost colon, so it is an effect condition (a failed check still
 * pays the cost and spends Once Per Turn). "Then" after a failed "If" does not resolve (M4b-5).
 * "The only Characters ... are" with no Characters on the field is open (M6b-Q21); no test asserts
 * the outcome of that case, only what every reading shares.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  answerCount,
  countOptions,
  E2C,
  endTurn,
  kind,
  mine,
  need,
  offeredAbilities,
  payDonFrom,
  toMyNextMain,
  useAbility,
  donOf,
  leaderPower,
} from './kit-eb02a.ts';

const LUFFY = 'EB02-010';

/** p1 with the printed Leader, the given Characters and a DON!! spread. */
function pos(chars: string[], active = 3, rested = 4) {
  return mine(LUFFY, { characters: chars, costArea: { active, rested } });
}

/** Activate and pay DON!! −2 from rested DON!!, then answer a count if one is asked. */
function run(
  g: ReturnType<typeof pos>,
  count = 2,
  from: 'costActive' | 'costRested' = 'costRested',
) {
  useAbility(g, g.leader('p1'));
  payDonFrom(g, 2, from);
  if (kind(g) === 'choose') answerCount(g, count);
}

describe('EB02-010 Monkey.D.Luffy: [Activate: Main] DON!! −2: set up to 2 DON!! active, Leader +1000', () => {
  it('with only {Straw Hat Crew} Characters: pays 2 DON!!, sets 2 rested DON!! active, Leader gains +1000', () => {
    const g = pos([E2C.shc1, E2C.shc4]);
    expect(leaderPower(g, 'p1')).toBe(5000);
    const before = donOf(g, 'p1');
    expect([before.active, before.rested]).toEqual([3, 4]);
    run(g);
    const after = donOf(g, 'p1');
    // DON!! −2 returned two rested DON!! to the DON!! deck; two of the remaining rested ones are active.
    expect([after.active, after.rested]).toEqual([5, 0]);
    expect(leaderPower(g, 'p1')).toBe(6000);
    need(g, 'main', 'p1');
  });

  it('the cost is DON!! −2: two DON!! go back to the DON!! deck', () => {
    const g = pos([E2C.shc1]);
    const total = (x: ReturnType<typeof donOf>) => x.active + x.rested + x.given;
    const before = donOf(g, 'p1');
    run(g);
    const after = donOf(g, 'p1');
    expect(total(before) - total(after)).toBe(2);
    expect(after.deck - before.deck).toBe(2);
  });

  it('the condition is "only": one non-{Straw Hat Crew} Character fails it (cost paid, nothing set, no boost)', () => {
    const g = pos([E2C.shc1, E2C.mohji]);
    run(g);
    const after = donOf(g, 'p1');
    // Two rested DON!! returned; no DON!! was set active.
    expect([after.active, after.rested]).toEqual([3, 2]);
    expect(leaderPower(g, 'p1')).toBe(5000);
    need(g, 'main', 'p1');
  });

  it('a field of only non-{Straw Hat Crew} Characters fails the condition as well', () => {
    const g = pos([E2C.mohji, E2C.komachiyo]);
    run(g);
    expect(donOf(g, 'p1').rested).toBe(2);
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('the "If" is an effect condition: a failed check still spends Once Per Turn', () => {
    const g = pos([E2C.mohji]);
    run(g);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('Once Per Turn: after a successful use the ability is not offered again this turn', () => {
    const g = pos([E2C.shc1]);
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
    run(g);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('the boost lasts through the opponent’s next turn and ends with it', () => {
    const g = pos([E2C.shc1]);
    run(g);
    expect(leaderPower(g, 'p1')).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(leaderPower(g, 'p1')).toBe(6000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('is usable again on my next turn (Once Per Turn resets)', () => {
    const g = pos([E2C.shc1], 3, 4);
    run(g);
    toMyNextMain(g);
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
  });

  it('with fewer than 2 DON!! on the field the cost cannot be paid: the ability is not offered', () => {
    const g = pos([E2C.shc1], 1, 0);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('"up to 2": with only 1 rested DON!! left after paying from active DON!!, 1 is set active (never more than there are)', () => {
    const g = pos([E2C.shc1], 2, 1);
    useAbility(g, g.leader('p1'));
    payDonFrom(g, 2, 'costActive');
    if (kind(g) === 'choose') {
      expect(countOptions(g)).not.toContain('2');
      answerCount(g, 1);
    }
    const after = donOf(g, 'p1');
    expect([after.active, after.rested]).toEqual([1, 0]);
    expect(leaderPower(g, 'p1')).toBe(6000);
  });

  it('with no rested DON!! to set, the boost still applies (the "Then" follows a satisfied condition)', () => {
    const g = pos([E2C.shc1], 5, 0);
    useAbility(g, g.leader('p1'));
    payDonFrom(g, 2, 'costActive');
    if (kind(g) === 'choose') answerCount(g, 0);
    expect(leaderPower(g, 'p1')).toBe(6000);
  });
});
