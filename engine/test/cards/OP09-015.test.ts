/** OP09-015 Lucky.Roux. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import {
  boost,
  canBlockWith,
  canPick,
  ids,
  koByEffect,
  koedInBattle,
  mk,
  p2Attacks,
  RHP_LEADER,
  shrink,
} from './helpers-a09g1.ts';

const ID = 'OP09-015';
const koed = (leader: string, p2chars: string[]) => {
  const g = mk({ leader, characters: [ID] }, { characters: p2chars });
  koByEffect(g, 'p1', ID);
  return g;
};

describe('OP09-015 Lucky.Roux', () => {
  it("[On K.O.]: with a {Red-Haired Pirates} Leader, K.O.s up to 1 of your opponent's Characters with base power 6000 or less", () => {
    const g = koed(RHP_LEADER, [V.c4, V.c5]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c4]);
  });

  it('works for a K.O. in battle as well', () => {
    const g = koedInBattle(ID, { leader: RHP_LEADER }, { characters: [V.c3] });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7]);
  });

  it('must not fire with a Leader that does not have the type (the ability resolves, nothing happens)', () => {
    const g = koed('ST01-001', [V.c4]);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('reads BASE power: a 7000 Character lowered to 6000 is still not a candidate, a 6000 one raised to 9000 still is', () => {
    const h = mk({ leader: RHP_LEADER, characters: [ID] }, { characters: [V.c4, V.c5] });
    shrink(h, h.find('p2', 'characters', V.c5), 1000);
    boost(h, h.find('p2', 'characters', V.c4), 3000);
    koByEffect(h, 'p1', ID);
    expect(canPick(h, h.find('p2', 'characters', V.c5))).toBe(false);
    expect(canPick(h, h.find('p2', 'characters', V.c4))).toBe(true);
  });

  it('"up to 1": may K.O. nobody; only Characters can be chosen', () => {
    const g = koed(RHP_LEADER, [V.c4]);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('has [Blocker]', () => {
    const g = p2Attacks({ leader: RHP_LEADER, characters: [ID] }, V.c4, [V.c4]);
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
