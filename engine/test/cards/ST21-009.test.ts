/** ST21-009 Nami. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { BLUE, dec, expectDecision, option, pick } from './helpers.ts';
import { activateAb, canActivate, mk, offered, SHC_5000 } from './helpers-st1821.ts';

const ID = 'ST21-009';

const start = (rested = 3) =>
  mk({ characters: [ID, SHC_5000, BLUE], costArea: { active: 3, rested } });

describe('ST21-009 Nami', () => {
  it('[Activate: Main]: gives up to 2 rested DON!! (count asked) to a {Straw Hat Crew} Leader or Character', () => {
    const g = start();
    const nami = g.find('p1', 'characters', ID);
    activateAb(g, nami, 'activate');
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toEqual(['2', '1', '0']);
    option(g, '2');
    // The {SHC} Leader, Nami and the {SHC} Character are candidates; the Blue non-{SHC} one is not.
    expect(offered(g).sort()).toEqual(
      [g.leader('p1'), nami, g.find('p1', 'characters', SHC_5000)].sort(),
    );
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 1, given: 2 });
    expect(g.card(g.leader('p1')).don).toBe(2);
  });

  it('a non-{Straw Hat Crew} Leader is not a target (only the {SHC} Characters remain)', () => {
    const g = mk({
      leader: 'ST03-001',
      characters: [ID, SHC_5000, BLUE],
      costArea: { active: 3, rested: 2 },
    });
    activateAb(g, g.find('p1', 'characters', ID), 'activate');
    option(g, '1');
    expect(offered(g)).toHaveLength(2);
    expect(offered(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 2": 1 or 0 may be given', () => {
    const g = start();
    activateAb(g, g.find('p1', 'characters', ID), 'activate');
    option(g, '1');
    pick(g, [g.find('p1', 'characters', SHC_5000)]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 2, given: 1 });
  });

  it('[Once Per Turn]', () => {
    const g = start();
    const nami = g.find('p1', 'characters', ID);
    activateAb(g, nami, 'activate');
    option(g, '0');
    expect(dec(g)?.kind).toBe('main');
    expect(canActivate(g, nami, 'activate')).toBe(false);
  });

  it('with no rested DON!! nothing is given (active DON!! are never given)', () => {
    const g = start(0);
    activateAb(g, g.find('p1', 'characters', ID), 'activate');
    expect(dec(g)?.kind).toBe('main');
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 3, given: 0 });
  });
});
