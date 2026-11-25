/** OP10-002 Caesar Clown (Leader). */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, hand, none, pick, V } from './helpers.ts';
import { canPick, ids, mk, PH } from './helpers-a10g1.ts';

const ID = 'OP10-002';
const start = (donGiven: number, chars: string[] = [PH.c3], p2chars: string[] = [V.c4]) =>
  mk(
    { leader: { card: ID, don: donGiven }, characters: chars, costArea: { active: 8, rested: 0 } },
    { characters: p2chars },
  );
const attack = (g: ReturnType<typeof start>) =>
  g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });

describe('OP10-002 Caesar Clown', () => {
  it('[DON!! x2] [When Attacking]: returns a {Punk Hazard} Character (cost 2 or more) to your hand: K.O.s a Character with 4000 power or less', () => {
    const g = start(2, [PH.c3], [V.c2]);
    attack(g);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    // The only eligible Character is returned at once (exactly 1 of 1): no pick is asked.
    expect(hand(g, 'p1')).toEqual([PH.c3]);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(ids(g, 'p2', 'characters')).toEqual([]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c2]);
  });

  it("the cost may be declined: nothing is returned or K.O.'d", () => {
    const g = start(2, [PH.c3], [V.c2]);
    attack(g);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([PH.c3]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c2]);
  });

  it('boundaries: K.O. target power 4000 yes / 5000 no; returned Character cost 2 yes / cost 1 or a non-{Punk Hazard} no', () => {
    const g = start(2, [PH.c2, PH.c3, V.c1, V.c3], [V.c2, V.c3]);
    attack(g);
    accept(g);
    expect(canPick(g, g.find('p1', 'characters', PH.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', PH.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'characters', PH.c2)]);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true); // 4000
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // 5000
  });

  it('"up to 1" K.O.: may choose nothing (the Character is still returned)', () => {
    const g = start(2, [PH.c3], [V.c2]);
    attack(g);
    accept(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([PH.c3]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c2]);
  });

  it('must not trigger with only 1 DON!! given', () => {
    const g = start(1, [PH.c3], [V.c2]);
    attack(g);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([PH.c3]);
  });

  it('is not offered when no {Punk Hazard} Character with a cost of 2 or more can be returned', () => {
    const g = start(2, [V.c3], [V.c2]);
    attack(g);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c2]);
  });
});
