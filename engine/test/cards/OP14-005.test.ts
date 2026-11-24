/** OP14-005 Killer. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { dec, expectDecision, pick, V } from './helpers.ts';
import { activate } from './helpers-w3s.ts';
import { mk } from './helpers-op14g1.ts';

const ID = 'OP14-005';

const start = (active: number, restedDon: number, chars: string[] = [ID, V.c1]) =>
  mk({ characters: chars, costArea: { active, rested: restedDon } });

describe('OP14-005 Killer', () => {
  it('[Activate: Main]: gives 1 rested DON!! to the Leader or a Character', () => {
    const g = start(3, 2);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(4000);
  });

  it('may target the Leader or Killer himself', () => {
    const g = start(3, 2);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    const targets = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : ''));
    expect(targets).toContain(g.leader('p1'));
    expect(targets).toContain(g.find('p1', 'characters', ID));
    expect(targets).toHaveLength(3);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('only a RESTED DON!! is given: none rested, nothing is given', () => {
    const g = start(5, 0);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 5, rested: 0, given: 0 });
    expect(dec(g)?.kind).toBe('main');
  });

  it('gives exactly 1 even with several rested (up to 1)', () => {
    const g = start(0, 4);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 3, given: 1 });
  });

  it('Once Per Turn: a second activation is not offered', () => {
    const g = start(0, 4);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.leader('p1')]);
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });
});
