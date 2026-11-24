/**
 * OP17-034 Rockstar (Character, Green, cost 5, 6000, Counter +1000, {Red-Haired Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] If your opponent's Leader has 6000 power or more, set
 * up to 1 of your DON!! cards as active. Then, your {Red-Haired Pirates} type Leader's base power
 * becomes 6000 until the end of your opponent's next End Phase."
 *
 * Rules: CR 8-3-3 / 4-10-1 (text after a failed "if" does not resolve), CR 4-9-2 ("base"),
 * CR 10-2-13 ([Once Per Turn]), CR 6-6-1-2 ("until the end of the End Phase", RL-11), CR 6-5-5-2
 * (given DON!! add +1000 on its owner's turn).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  BLUE,
  don,
  fill,
  LD,
  mine,
  need,
  offeredAbilities,
  toMyNextMain,
  useAbility,
} from './kit-op17b.ts';

const ROCKSTAR = 'OP17-034';
const MAGELLAN = 'OP02-071'; // Purple, 6000, 5 Life. Its only effect needs DON!! returned on its own turn.
const ROGER = 'OP13-003'; // Purple/Red, 7000, 5 Life: its text does not change its power.
const VANILLA_5000 = 'ST01-001';

function setup(leader: string, opp: string, rested = 3, don_?: number) {
  return mine(
    don_ ? { card: leader, don: don_ } : leader,
    { characters: [ROCKSTAR], hand: fill(BLUE, 2), costArea: { active: 2, rested } },
    {},
    opp,
  );
}

describe('OP17-034 Rockstar: [Activate: Main] [Once Per Turn] if the opposing Leader has 6000+: set up 1 DON!!, Leader base 6000', () => {
  it('opposing Leader at 6000: sets up 1 DON!! and my {Red-Haired Pirates} Leader gets base power 6000', () => {
    const g = setup(LD.rhp, MAGELLAN);
    expect(g.power(g.leader('p1'))).toBe(5000);
    useAbility(g, at(g, 'p1', 'characters', ROCKSTAR));
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 3, rested: 2 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('boundary: opposing Leader at 5000 does nothing (no DON!! set up, power unchanged)', () => {
    const g = setup(LD.rhp, VANILLA_5000);
    const r = at(g, 'p1', 'characters', ROCKSTAR);
    if (offeredAbilities(g, r).length) useAbility(g, r);
    expect(don(g)).toMatchObject({ active: 2, rested: 3 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('opposing Leader above the threshold (7000) also satisfies "6000 or more"', () => {
    const g = setup(LD.rhp, ROGER);
    useAbility(g, at(g, 'p1', 'characters', ROCKSTAR));
    expect(don(g)).toMatchObject({ active: 3, rested: 2 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to 1": exactly one rested DON!! is set up, not all of them', () => {
    const g = setup(LD.rhp, MAGELLAN, 5);
    useAbility(g, at(g, 'p1', 'characters', ROCKSTAR));
    expect(don(g)).toMatchObject({ active: 3, rested: 4 });
  });

  it('"Then" is not gated on the DON!! being set up: with no rested DON!! the Leader still gets base 6000', () => {
    const g = setup(LD.rhp, MAGELLAN, 0);
    useAbility(g, at(g, 'p1', 'characters', ROCKSTAR));
    expect(don(g)).toMatchObject({ active: 2, rested: 0 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the Leader must be a {Red-Haired Pirates} type: another Leader keeps its power, the DON!! is still set up', () => {
    const g = setup(LD.neutral, MAGELLAN);
    useAbility(g, at(g, 'p1', 'characters', ROCKSTAR));
    expect(don(g)).toMatchObject({ active: 3, rested: 2 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"base" power: DON!! given to the Leader still add +1000 each on top of 6000', () => {
    const g = setup(LD.rhp, MAGELLAN, 3, 2);
    expect(g.power(g.leader('p1'))).toBe(7000);
    useAbility(g, at(g, 'p1', 'characters', ROCKSTAR));
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it("lasts until the end of the opponent's next End Phase: still 6000 during their turn, back to 5000 after", () => {
    const g = setup(LD.rhp, MAGELLAN);
    useAbility(g, at(g, 'p1', 'characters', ROCKSTAR));
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(6000);
    act(g, { type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: not offered again the same turn', () => {
    const g = setup(LD.rhp, MAGELLAN, 5);
    const r = at(g, 'p1', 'characters', ROCKSTAR);
    expect(offeredAbilities(g, r)).toHaveLength(1);
    useAbility(g, r);
    expect(offeredAbilities(g, r)).toHaveLength(0);
  });

  it('usable again on my next turn (a fresh use)', () => {
    const g = setup(LD.rhp, MAGELLAN, 5);
    const r = at(g, 'p1', 'characters', ROCKSTAR);
    useAbility(g, r);
    toMyNextMain(g);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ROCKSTAR))).toHaveLength(1);
  });

  it('RD 82: DON!! given to the opposing Leader add no power on my turn, so a 5000 Leader with 1 DON!! given is not "6000 or more"', () => {
    const h = mine(
      LD.rhp,
      { characters: [ROCKSTAR], hand: fill(BLUE, 2), costArea: { active: 2, rested: 3 } },
      { leader: { card: VANILLA_5000, don: 1 } },
      VANILLA_5000,
    );
    expect(h.power(h.leader('p2'))).toBe(5000);
    const r = at(h, 'p1', 'characters', ROCKSTAR);
    if (offeredAbilities(h, r).length) useAbility(h, r);
    expect(don(h)).toMatchObject({ active: 2, rested: 3 });
    expect(h.power(h.leader('p1'))).toBe(5000);
  });
});
