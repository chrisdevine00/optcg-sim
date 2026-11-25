/** OP10-007 Ceaser Soldier. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, EVENT, ids, mk, PH } from './helpers-a10g1.ts';

const ID = 'OP10-007';

describe('OP10-007 Ceaser Soldier', () => {
  it('[On Play]: plays a {Punk Hazard} Character with a cost of 2 or less from your hand', () => {
    const g = mk({ hand: [ID, PH.c2] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', PH.c2)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, PH.c2]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('boundary: cost 2 is allowed, cost 3 is not', () => {
    const g = mk({ hand: [ID, PH.c2, PH.c3] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', PH.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', PH.c3))).toBe(false);
  });

  it('must not play a non-{Punk Hazard} Character or an Event', () => {
    const g = mk({ hand: [ID, V.c1, EVENT] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play nothing, and plays only 1 of two candidates', () => {
    const g = mk({ hand: [ID, PH.c2] });
    play(g, ID);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([PH.c2]);

    const h = mk({ hand: [ID, PH.c2, PH.c2] });
    play(h, ID);
    pick(h, [h.find('p1', 'hand', PH.c2)]);
    expect(ids(h, 'p1', 'characters')).toEqual([ID, PH.c2]);
    expect(hand(h, 'p1')).toEqual([PH.c2]);
  });
});
