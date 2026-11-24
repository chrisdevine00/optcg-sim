/** EB04-005 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { boost } from './helpers-op15g1.ts';
import { at, canAttack, mk, RED_LEADER, V } from './helpers-eb04g1.ts';

const ID = 'EB04-005';

describe('EB04-005 Trafalgar Law', () => {
  const can = (g: ReturnType<typeof mk>) =>
    canAttack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));

  it('cannot attack with 0 or 1 opposing Characters of 5000 base power or more', () => {
    expect(can(mk({ leader: RED_LEADER, characters: [ID] }))).toBe(false);
    expect(can(mk({ leader: RED_LEADER, characters: [ID] }, { characters: [V.c3] }))).toBe(false);
  });

  it('can attack with exactly 2 opposing Characters of 5000 base power (boundary), also with more', () => {
    expect(can(mk({ leader: RED_LEADER, characters: [ID] }, { characters: [V.c3, V.c3] }))).toBe(
      true,
    );
    expect(
      can(mk({ leader: RED_LEADER, characters: [ID] }, { characters: [V.c3, V.c5, V.c1] })),
    ).toBe(true);
  });

  it('4000 base power does not count (one below the threshold)', () => {
    expect(can(mk({ leader: RED_LEADER, characters: [ID] }, { characters: [V.c3, V.c2] }))).toBe(
      false,
    );
  });

  it('it is the BASE power: a 4000 boosted to 6000 does not count, and a 5000 lowered to 3000 still does', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID] }, { characters: [V.c2, V.c3, V.c3] });
    boost(g, at(g, 'p2', 'characters', V.c2), 2000);
    expect(can(g)).toBe(true); // two 5000-base Characters
    const h = mk({ leader: RED_LEADER, characters: [ID] }, { characters: [V.c2, V.c3] });
    boost(h, at(h, 'p2', 'characters', V.c2), 2000);
    expect(can(h)).toBe(false); // only one 5000-base Character
    const k = mk({ leader: RED_LEADER, characters: [ID] }, { characters: [V.c3, V.c3] });
    boost(k, at(k, 'p2', 'characters', V.c3, 0), -2000);
    expect(can(k)).toBe(true); // lowered power does not change the base
  });

  it('your own Characters and the opposing Leader do not count', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID, V.c5, V.c5] }, { characters: [V.c3] });
    expect(can(g)).toBe(false);
  });

  it('only Law is locked: another of your Characters attacks freely', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID, V.c5] });
    expect(canAttack(g, at(g, 'p1', 'characters', V.c5), g.leader('p2'))).toBe(true);
  });
});
