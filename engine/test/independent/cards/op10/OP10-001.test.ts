/**
 * OP10-001 Smoker (Leader, Green/Red, 5000, 4 Life, {Navy}/{Punk Hazard}).
 *
 * Card text: "[Opponent's Turn] All of your {Navy} or {Punk Hazard} type Characters gain +1000
 * power. [Activate: Main] [Once Per Turn] If you have a Character with 7000 power or more, set up
 * to 2 of your DON!! cards as active."
 *
 * Rules: a static [Opponent's Turn] effect applies only on the opponent's turn and only to the
 * Characters (not the Leader). The "If" has no colon, so it is an effect condition: the ability is
 * always offered, spends its Once Per Turn, and does nothing when the check fails (DECISIONS
 * 2026-11-24, colon-less If). "Set up to N DON!! as active" asks a count, most first (DECISIONS
 * OP-14 R2). Power counts DON!! given on my own turn (RL-13).
 */
import { describe, expect, it } from 'vitest';
import {
  askedCount,
  at,
  attack,
  don,
  kind,
  mine,
  need,
  noDefence,
  offeredAbilities,
  pickCount,
  theirs,
  useAbility,
  V10,
  VAN,
  type Chars,
} from './kit-op10a.ts';

const SMOKER = 'OP10-001';

/** My turn: Smoker, `rested` of 10 DON!! rested, my Characters as given. */
function board(chars: Chars, rested = 3) {
  return mine(SMOKER, { costArea: { active: 10 - rested, rested }, characters: chars });
}

describe("OP10-001 Smoker: [Opponent's Turn] +1000 to {Navy} / {Punk Hazard} Characters", () => {
  it('printed values: Leader 5000 power, 4 Life', () => {
    const g = board([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(4);
  });

  it("on the opponent's turn a {Navy} Character gains +1000", () => {
    const g = theirs(SMOKER, { characters: [V10.tashigiNavy] });
    expect(g.power(at(g, 'p1', 'characters', V10.tashigiNavy))).toBe(8000);
  });

  it("on the opponent's turn a {Punk Hazard} Character gains +1000", () => {
    const g = theirs(SMOKER, { characters: [V10.mochaPh4] });
    expect(g.power(at(g, 'p1', 'characters', V10.mochaPh4))).toBe(7000);
  });

  it('a Character of both types gains +1000 once, not +2000', () => {
    const g = theirs(SMOKER, { characters: [V10.vergoBlue] });
    expect(g.power(at(g, 'p1', 'characters', V10.vergoBlue))).toBe(8000);
  });

  it('applies to every matching Character at once and skips the others and the Leader', () => {
    const g = theirs(SMOKER, {
      characters: [V10.tashigiNavy, V10.namiPh, VAN.marco, VAN.hajrudin],
    });
    expect(g.power(at(g, 'p1', 'characters', V10.tashigiNavy))).toBe(8000);
    expect(g.power(at(g, 'p1', 'characters', V10.namiPh))).toBe(8000);
    expect(g.power(at(g, 'p1', 'characters', VAN.marco))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', VAN.hajrudin))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('not on my own turn: the same Characters have their printed power', () => {
    const g = board([V10.tashigiNavy, V10.namiPh]);
    expect(g.power(at(g, 'p1', 'characters', V10.tashigiNavy))).toBe(7000);
    expect(g.power(at(g, 'p1', 'characters', V10.namiPh))).toBe(7000);
  });

  it("the bonus decides a battle on the opponent's turn: a 7000 attacker loses to a rested 7000 {Punk Hazard} Character", () => {
    const g = theirs(
      SMOKER,
      { characters: [{ card: V10.namiPh, rested: true }] },
      { characters: [VAN.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', VAN.kingdew), at(g, 'p1', 'characters', V10.namiPh));
    noDefence(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V10.namiPh]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([VAN.kingdew]);
  });
});

describe('OP10-001 Smoker: [Activate: Main] [Once Per Turn] with a 7000-power Character, set up to 2 DON!! active', () => {
  it('7000 is enough: sets 2 rested DON!! active (a count is asked, most first)', () => {
    const g = board([V10.tashigiNavy]);
    useAbility(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(askedCount(g)).toBe(true);
    pickCount(g, 2);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(kind(g)).toBe('main');
  });

  it('boundary: 6000 power is not enough; the ability is still used up, nothing is set active', () => {
    const g = board([VAN.hajrudin]);
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
    useAbility(g, g.leader('p1'));
    expect(kind(g)).toBe('main');
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(0);
  });

  it('a 6000 Character with 1 DON!! given has 7000 power on my turn and qualifies', () => {
    const g = mine(SMOKER, {
      costArea: { active: 6, rested: 3 },
      characters: [{ card: VAN.hajrudin, don: 1 }],
    });
    expect(g.power(at(g, 'p1', 'characters', VAN.hajrudin))).toBe(7000);
    useAbility(g, g.leader('p1'));
    pickCount(g, 2);
    expect(don(g)).toMatchObject({ active: 8, rested: 1, given: 1 });
  });

  it('"up to 2": may set just 1', () => {
    const g = board([V10.tashigiNavy]);
    useAbility(g, g.leader('p1'));
    pickCount(g, 1);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('"up to 2": may set none, and the Once Per Turn is spent anyway', () => {
    const g = board([V10.tashigiNavy]);
    useAbility(g, g.leader('p1'));
    pickCount(g, 0);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(0);
  });

  it('with only 1 rested DON!! at most 1 is set active', () => {
    const g = board([V10.tashigiNavy], 1);
    useAbility(g, g.leader('p1'));
    if (askedCount(g)) pickCount(g, 1);
    expect(don(g)).toMatchObject({ active: 10, rested: 0 });
    expect(kind(g)).toBe('main');
  });

  it('Once Per Turn: after a use no second activation is offered', () => {
    const g = board([V10.tashigiNavy]);
    useAbility(g, g.leader('p1'));
    pickCount(g, 2);
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(0);
  });

  it('only my own Characters count: an opposing 7000 Character does not enable it', () => {
    const g = mine(
      SMOKER,
      { costArea: { active: 7, rested: 3 }, characters: [VAN.marco] },
      { characters: [VAN.kingdew] },
    );
    useAbility(g, g.leader('p1'));
    expect(kind(g)).toBe('main');
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it("the +1000 of the [Opponent's Turn] effect is not on my turn, so a 6000 {Navy} Character does not qualify", () => {
    const g = board([VAN.hajrudin, V10.doberman]);
    useAbility(g, g.leader('p1'));
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });
});
