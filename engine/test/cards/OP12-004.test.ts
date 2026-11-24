/** OP12-004 Kouzuki Oden. */
import { describe, expect, it } from 'vitest';
import { pick, V } from './helpers.ts';
import { activateAb, at, canActivate, EVENTS, mk } from './helpers-op12g1.ts';

const ID = 'OP12-004';

describe('OP12-004 Kouzuki Oden', () => {
  const start = (hand: string[] = [...EVENTS, V.c1]) => mk({ characters: [ID], hand });
  const use = (g: ReturnType<typeof start>) => {
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', EVENTS[0]), g.find('p1', 'hand', EVENTS[1])]);
  };

  it('[Activate: Main]: reveal 2 Events: this Character gains +2000 power during this turn', () => {
    const g = start();
    const oden = at(g, 'p1', 'characters', ID);
    expect(g.power(oden)).toBe(3000);
    use(g);
    expect(g.power(oden)).toBe(5000);
    // The Events were only revealed.
    expect(g.zone('p1', 'hand')).toHaveLength(3);
  });

  it('the boost ends with the turn', () => {
    const g = start();
    use(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(3000);
  });

  it('[Once Per Turn]: not offered a second time', () => {
    const g = start();
    use(g);
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('with fewer than 2 Events in hand it is not offered; Characters in hand do not count', () => {
    const g = start([EVENTS[0], V.c1, V.c2]);
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('usable the turn it was played (no rest in the cost)', () => {
    const g = mk({ hand: [ID, ...EVENTS] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'activate')).toBe(true);
  });
});
