/** EB04-016 Bird Neptunian. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, option, pick } from './helpers.ts';
import { COST10, COST8 } from './helpers-luffyace.ts';
import {
  activateAb,
  at,
  attack,
  canActivate,
  canPick,
  finishBattle,
  isRested,
  MINK1,
  mk,
  NEP_A,
  NEP_B,
  RED_LEADER,
  V,
} from './helpers-eb04g1.ts';

const ID = 'EB04-016';

describe('EB04-016 Bird Neptunian', () => {
  const start = (restedDon = 3, chars: string[] = [ID]) =>
    mk({ leader: RED_LEADER, characters: chars, costArea: { active: 2, rested: restedDon } });

  it('[Activate: Main]: sets up to 1 of your DON!! as active (a rested one becomes active)', () => {
    const g = start();
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    // "Up to 1": a count is asked when several are rested (most first).
    expectDecision(g, 'choose', 'p1');
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('"up to 1": none may be chosen', () => {
    const g = start();
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toEqual(['1', '0']);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });

  it('then you cannot set DON!! as active with Character effects this turn: a second use (no Once Per Turn) sets nothing', () => {
    const g = start();
    const id = at(g, 'p1', 'characters', ID);
    activateAb(g, id, 'activate');
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    // It has no Once Per Turn, but this Character is now rested (the ability has no rest cost),
    // so it can be activated again and does nothing.
    expect(canActivate(g, id, 'activate')).toBe(true);
    activateAb(g, id, 'activate');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it("the lock covers another Character's effect too (a second [Bird Neptunian])", () => {
    const g = start(3, [ID, ID]);
    activateAb(g, at(g, 'p1', 'characters', ID, 0), 'activate');
    option(g, '1');
    activateAb(g, at(g, 'p1', 'characters', ID, 1), 'activate');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('with no rested DON!! the activation does nothing but still locks (no prompt)', () => {
    const g = start(0);
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
  });

  it('[When Attacking] with 3 {Neptunian} Characters (itself included): rests a Character of cost 8 or less (10 is out)', () => {
    const g = mk(
      { leader: RED_LEADER, characters: [ID, NEP_A, NEP_B] },
      { characters: [COST8, COST10, V.c3] },
    );
    attack(g, at(g, 'p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, at(g, 'p2', 'characters', COST8))).toBe(true); // cost 8: boundary
    expect(canPick(g, at(g, 'p2', 'characters', COST10))).toBe(false);
    pick(g, [at(g, 'p2', 'characters', COST8)]);
    expect(isRested(g, at(g, 'p2', 'characters', COST8))).toBe(true);
    finishBattle(g);
  });

  it('with only 2 {Neptunian} Characters nothing is rested (no prompt)', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID, NEP_A, MINK1] }, { characters: [V.c3] });
    attack(g, at(g, 'p1', 'characters', ID));
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    finishBattle(g);
    expect(isRested(g, at(g, 'p2', 'characters', V.c3))).toBe(false);
  });

  it('"up to 1": the rest may be skipped', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID, NEP_A, NEP_B] }, { characters: [V.c3] });
    attack(g, at(g, 'p1', 'characters', ID));
    none(g);
    expect(isRested(g, at(g, 'p2', 'characters', V.c3))).toBe(false);
    finishBattle(g);
  });
});
