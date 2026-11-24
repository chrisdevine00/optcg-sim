/** OP16-105 Gecko Moria. */
import { describe, expect, it } from 'vitest';
import { none, pick, PURPLE, V } from './helpers.ts';
import { ABSALOM, HOGBACK, names, PERONA, PERONA_5 } from './helpers-op16g4.ts';
import { damageWith } from './triggers.ts';

const ID = 'OP16-105';
const TRASH = [ABSALOM, HOGBACK, PERONA, PERONA_5, V.c1];
// damageWith gives p1 Life [ID, PURPLE]: 1 Life card is left once the Moria card is taken.

describe('OP16-105 Gecko Moria', () => {
  it('[Trigger] with 1 or less Life: plays [Absalom], [Dr. Hogback] and [Perona] (cost 4 or less) from the trash', () => {
    const g = damageWith(ID, { leader: 'ST03-001', trash: TRASH });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'trash', ABSALOM)]);
    pick(g, [g.find('p1', 'trash', HOGBACK)]);
    // The cost 5 [Perona] is not a candidate for the third step.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', PERONA)]);
    expect(names(g, 'p1', 'characters').sort()).toEqual([ABSALOM, HOGBACK, PERONA].sort());
    expect(names(g, 'p1', 'trash')).toContain(PERONA_5);
  });

  it('each "up to 1" may be declined independently', () => {
    const g = damageWith(ID, { leader: 'ST03-001', trash: TRASH });
    g.act({ type: 'trigger', activate: true });
    none(g);
    pick(g, [g.find('p1', 'trash', HOGBACK)]);
    none(g);
    expect(names(g, 'p1', 'characters')).toEqual([HOGBACK]);
  });

  it('must not fire with 2 Life cards left after the damage', () => {
    const g = damageWith(ID, { leader: 'ST03-001', life: [ID, PURPLE, PURPLE], trash: TRASH });
    g.act({ type: 'trigger', activate: true });
    expect(names(g, 'p1', 'characters')).toEqual([]);
  });

  it('with none of the three in the trash nothing is played', () => {
    const g = damageWith(ID, { leader: 'ST03-001', trash: [PERONA_5, V.c1] });
    g.act({ type: 'trigger', activate: true });
    expect(names(g, 'p1', 'characters')).toEqual([]);
  });
});
