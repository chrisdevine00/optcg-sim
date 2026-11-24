/** OP15-043 Kelly Funk. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { BOBBY, DR, mk } from './helpers-op15g1.ts';

const ID = 'OP15-043';

describe('OP15-043 Kelly Funk', () => {
  it('[On Play]: plays up to 1 [Bobby Funk] from your hand (free)', () => {
    const g = mk({ hand: [ID, BOBBY, V.c1] });
    play(g, ID);
    pick(g, [g.find('p1', 'hand', BOBBY)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, BOBBY]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([V.c1]);
    expect(g.state && g.zone('p1', 'characters')).toHaveLength(2);
  });

  it('only 1 is played when two copies are in hand', () => {
    const g = mk({ hand: [ID, BOBBY, BOBBY] });
    play(g, ID);
    pick(g, [g.find('p1', 'hand', BOBBY)]);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([BOBBY]);
  });

  it('only a card named [Bobby Funk] is a candidate', () => {
    const g = mk({ hand: [ID, BOBBY, DR.c2, V.c1] });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
  });

  it('"up to 1": may play nothing', () => {
    const g = mk({ hand: [ID, BOBBY] });
    play(g, ID);
    none(g);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([BOBBY]);
  });

  it('must not fire from the deck or trash: only your hand', () => {
    const g = mk({ hand: [ID], deck: [BOBBY, V.c1], trash: [BOBBY] });
    play(g, ID);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
