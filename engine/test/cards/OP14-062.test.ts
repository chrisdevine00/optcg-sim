/** OP14-062 Gladius. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, don, none, payDon, pick } from './helpers.ts';
import { canPick, DP_LEADER, idsOf, koedInBattle, mode, ZERO_POWER } from './helpers-op14g3.ts';

const ID = 'OP14-062';
/** OP10-068 Diamante: 7000 base; OP05-035 Bellamy 5000; OP04-030 Trebol 6000 base. */
const P7000 = 'OP10-068';
const P6000 = 'OP04-030';

describe('OP14-062 Gladius', () => {
  const ko = (active: number, opp: string[]) =>
    koedInBattle(ID, { leader: DP_LEADER, costArea: { active, rested: 0 } }, { characters: opp });

  it('[On K.O.] DON!! -1: K.O. up to 1 opposing Character with a base power of 6000 or less', () => {
    const g = ko(2, [P6000]);
    accept(g);
    payDon(g);
    mode(g, 0);
    pick(g, [g.find('p2', 'characters', P6000)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([P6000]);
    expect(don(g, 'p1').deck).toBe(9);
  });

  it('or rest it (mode 2)', () => {
    const g = ko(2, [P6000]);
    accept(g);
    payDon(g);
    mode(g, 1);
    pick(g, [g.find('p2', 'characters', P6000)]);
    expect(g.card(g.find('p2', 'characters', P6000)).rested).toBe(true);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });

  it('base power 7000 is not a target; the boundary 6000 is', () => {
    const g = ko(2, [P7000, P6000]);
    accept(g);
    payDon(g);
    mode(g, 0);
    expect(canPick(g, g.find('p2', 'characters', P7000))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', P6000))).toBe(true);
  });

  it('a 0 base power Character is in range, and the K.O. may be declined (up to 1)', () => {
    const g = ko(2, [ZERO_POWER]);
    accept(g);
    payDon(g);
    mode(g, 0);
    expect(canPick(g, g.find('p2', 'characters', ZERO_POWER))).toBe(true);
    none(g);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });

  it('the DON!! -1 may be declined: nothing happens and no DON!! returns', () => {
    const g = ko(2, [P6000]);
    decline(g);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('with no DON!! on the field the cost cannot be paid and nothing is asked', () => {
    const g = ko(0, [P6000]);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });
});
