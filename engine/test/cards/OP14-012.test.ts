/** OP14-012 Bepo. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { dec, expectDecision, option, pick, V } from './helpers.ts';
import { attack, boost, finishBattle, mk } from './helpers-op14g1.ts';

const ID = 'OP14-012';

/** Bepo with 3 DON!! given (5000) and `rested` rested DON!! in the cost area. */
const start = (restedDon: number, don = 3) =>
  mk({
    characters: [{ card: ID, don }, V.c1],
    costArea: { active: 0, rested: restedDon },
  });

describe('OP14-012 Bepo', () => {
  it('[When Attacking] with 5000 power: gives up to 2 rested DON!! (a count is asked) to one card', () => {
    const g = start(4);
    attack(g, g.find('p1', 'characters', ID));
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toEqual(['2', '1', '0']);
    option(g, '2');
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 2, given: 5 });
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(5000);
    finishBattle(g);
  });

  it('"up to 2": 1 or 0 may be given; the target may be the Leader', () => {
    const g = start(4);
    attack(g, g.find('p1', 'characters', ID));
    option(g, '1');
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 3, given: 4 });
    const h = start(4);
    attack(h, h.find('p1', 'characters', ID));
    option(h, '0');
    expect(queries.don(h.state, 'p1')).toMatchObject({ rested: 4, given: 3 });
  });

  it('with only 1 rested DON!! it is given (no count asked)', () => {
    const g = start(1);
    attack(g, g.find('p1', 'characters', ID));
    // No count is asked for a single DON!!: the target is chosen straight away.
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options).toBeUndefined();
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 0, given: 4 });
  });

  it('boundary: 4000 power does not fire; a boost to 5000 does', () => {
    const g = start(4, 2);
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).not.toBe('choose');
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 4, given: 2 });
    const h = start(4, 2);
    boost(h, h.find('p1', 'characters', ID), 1000);
    attack(h, h.find('p1', 'characters', ID));
    expectDecision(h, 'choose', 'p1');
  });

  it('active DON!! are never given (only rested ones)', () => {
    const g = mk({ characters: [{ card: ID, don: 3 }], costArea: { active: 4, rested: 0 } });
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).not.toBe('choose');
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 4, given: 3 });
  });
});
