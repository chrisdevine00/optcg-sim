/** ST19-005 Monkey.D.Garp. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { NAVY_LEADER, activateAb, canActivate, mk, offered } from './helpers-st1821.ts';

const ID = 'ST19-005';

const start = (trash: string[] = [V.c2, V.c3]) =>
  mk({ leader: NAVY_LEADER, characters: [ID], trash }, { characters: [V.c3, V.c1] });

describe('ST19-005 Monkey.D.Garp', () => {
  it('has [Blocker]', () => {
    const g = start();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[Activate: Main]: places 1 trash card at the deck bottom; up to 1 opposing Character gets -1 cost this turn', () => {
    const g = start();
    const garp = g.find('p1', 'characters', ID);
    activateAb(g, garp, 'activate');
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(V.c2);
    expectDecision(g, 'choose', 'p1');
    // Only Characters (the opposing Leader is not a candidate).
    expect(offered(g)).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(2);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(1);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(3);
  });

  it('Once Per Turn', () => {
    const g = start();
    const garp = g.find('p1', 'characters', ID);
    activateAb(g, garp, 'activate');
    pick(g, [g.find('p1', 'trash', V.c2)]);
    none(g);
    expect(canActivate(g, garp, 'activate')).toBe(false);
  });

  it('with an empty trash the cost cannot be paid: not offered', () => {
    const g = start([]);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('"up to 1": may be declined, a cost-1 Character goes to 0 (not below)', () => {
    const g = start();
    activateAb(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'trash', V.c2)]);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(0);
    expect(dec(g)?.kind).toBe('main');
  });
});
