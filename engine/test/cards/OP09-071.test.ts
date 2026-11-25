/** OP09-071 Nico Robin. */
import { describe, expect, it } from 'vitest';
import { dec, V } from './helpers.ts';
import { mk, p2Attacks } from './helpers-a09g2.ts';

const ID = 'OP09-071';
const LEADER = 'ST01-001';

describe('OP09-071 Nico Robin', () => {
  it('prints [Blocker]: she can block an attack on the Leader and becomes the target', () => {
    const g = p2Attacks({ leader: LEADER, characters: [ID] }, V.c3);
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).toBe('counter');
  });

  it('a rested Robin cannot block', () => {
    const g = p2Attacks({ leader: LEADER, characters: [{ card: ID, rested: true }] }, V.c3);
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(false);
  });

  it('has no other ability: no Activate is offered and playing her asks nothing', () => {
    const g = mk({ characters: [ID], hand: [ID] });
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(dec(g)?.kind).toBe('main');
  });

  it('is a cost 2, 2000 power Character with Counter 1000', () => {
    const g = mk({ hand: [ID] });
    const c = g.card(g.find('p1', 'hand', ID));
    expect([c.cost, c.power, c.counter]).toEqual([2, 2000, 1000]);
  });
});
