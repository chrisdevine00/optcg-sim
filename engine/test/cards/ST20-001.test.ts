/** ST20-001 Charlotte Katakuri. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { BLUE, dec, expectDecision, pick } from './helpers.ts';
import { activateAb, canActivate, mk, offered } from './helpers-st1821.ts';

const ID = 'ST20-001';

const start = (life: (string | { card: string; faceUp: boolean })[] = [BLUE, BLUE, BLUE]) =>
  mk({ characters: [ID, BLUE], life, costArea: { active: 3, rested: 2 } });

describe('ST20-001 Charlotte Katakuri', () => {
  it('has [Blocker]', () => {
    const g = start();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[Activate: Main]: turns the top Life card face-up, then gives 1 rested DON!! to the Leader or a Character', () => {
    const g = start();
    const kat = g.find('p1', 'characters', ID);
    expect(canActivate(g, kat, 'activate')).toBe(true);
    activateAb(g, kat, 'activate');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life')[1]!.faceUp).toBe(false);
    expectDecision(g, 'choose', 'p1');
    // The Leader and the two Characters are candidates.
    expect(offered(g)).toHaveLength(3);
    pick(g, [g.find('p1', 'characters', BLUE)]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 1, given: 1 });
    expect(g.card(g.find('p1', 'characters', BLUE)).don).toBe(1);
    expect(g.life('p1')).toBe(3);
  });

  it('Once Per Turn', () => {
    const g = start();
    const kat = g.find('p1', 'characters', ID);
    activateAb(g, kat, 'activate');
    pick(g, [g.leader('p1')]);
    expect(canActivate(g, kat, 'activate')).toBe(false);
  });

  it('the top card already face-up cannot be turned face-up: not offered (M6b-Q59 reading)', () => {
    const g = start([{ card: BLUE, faceUp: true }, BLUE, BLUE]);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('with no Life cards the cost cannot be paid; with no rested DON!! the cost is paid and nothing is given', () => {
    const none = start([]);
    expect(canActivate(none, none.find('p1', 'characters', ID), 'activate')).toBe(false);
    const g = mk({ characters: [ID], life: [BLUE, BLUE], costArea: { active: 5, rested: 0 } });
    activateAb(g, g.find('p1', 'characters', ID), 'activate');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(dec(g)?.kind).toBe('main');
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 5, given: 0 });
    expect(g.card(g.leader('p1')).don).toBe(0);
  });
});
