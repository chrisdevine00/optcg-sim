/** ST34-005 Baron Tamago & Pekoms. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, payDon, pick, V } from './helpers.ts';
import { attackLeader, idsOf, NAVY_LEADER, offers, P2000_A, P2000_B } from './helpers-stg2.ts';

const ID = 'ST34-005';
const start = (opp: string[], active = 2) =>
  attackLeader({ leader: NAVY_LEADER, characters: [ID], costArea: { active, rested: 0 } }, ID, {
    characters: opp,
  });

describe('ST34-005 Baron Tamago & Pekoms', () => {
  it('[When Attacking] DON!! -1: K.O. a Character with 2000 base power (boundary)', () => {
    const g = start([P2000_A, V.c1]);
    accept(g);
    payDon(g);
    expect(offers(g)).toEqual([g.find('p2', 'characters', P2000_A)]);
    pick(g, [g.find('p2', 'characters', P2000_A)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([P2000_A]);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 0, deck: 9 });
    expectDecision(g, 'block', 'p2');
  });

  it('a Character with 3000 base power is not a candidate: the DON!! is paid and nothing is K.O.d', () => {
    const g = start([V.c1]);
    accept(g);
    payDon(g);
    expectDecision(g, 'block', 'p2'); // no candidate: the effect has nothing to ask
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start([P2000_A, P2000_B]);
    accept(g);
    payDon(g);
    g.act({ type: 'done' });
    expect(idsOf(g, 'p2', 'characters')).toEqual([P2000_A, P2000_B]);
  });

  it('the cost may be declined: no DON!! is returned and nothing is K.O.d', () => {
    const g = start([P2000_A]);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
    expect(idsOf(g, 'p2', 'characters')).toEqual([P2000_A]);
  });

  it('with no DON!! on the field the cost cannot be paid', () => {
    const g = start([P2000_A], 0);
    expectDecision(g, 'block', 'p2'); // the ability is not offered at all
    expect(idsOf(g, 'p2', 'characters')).toEqual([P2000_A]);
  });
});
