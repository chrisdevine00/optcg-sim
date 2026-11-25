/** OP09-107 Nico Robin. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  canPick,
  dec,
  decline,
  expectDecision,
  handIds,
  hitWith,
  idsOf,
  mk,
  none,
  pick,
  play,
  rep,
  V,
  Y3,
  Y4,
} from './helpers-a09g3.ts';

const ID = 'OP09-107';

describe('OP09-107 Nico Robin', () => {
  const start = (theirLife: number) =>
    mk({ hand: [ID] }, { life: rep(theirLife, V.c1) }, undefined, 6);

  it('[On Play] with 3 or more opposing Life cards (boundary), trash up to 1 from the top of their Life', () => {
    const g = start(3);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(g.life('p2')).toBe(2);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c1]);
    expect(handIds(g, 'p2')).toEqual([]); // trashed, not added to the hand (no damage, no [Trigger])
  });

  it('"up to 1": may trash nothing', () => {
    const g = start(4);
    play(g, ID);
    if (dec(g)?.kind === 'optional') decline(g);
    else none(g);
    expect(g.life('p2')).toBe(4);
  });

  it('must not fire with 2 opposing Life cards', () => {
    const g = start(2);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.life('p2')).toBe(2);
  });

  it('must not trash from your own Life', () => {
    const g = mk({ hand: [ID], life: rep(3, V.c1) }, { life: rep(3, V.c1) }, undefined, 6);
    play(g, ID);
    accept(g);
    expect(g.life('p1')).toBe(3);
  });

  describe('[Trigger]', () => {
    it('plays up to 1 yellow Character with cost 3 or less from hand', () => {
      const g = hitWith(ID, 'ST08-001', { hand: [Y3, Y4, V.c2] });
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, g.find('p1', 'hand', Y3))).toBe(true); // yellow, cost 3: boundary
      expect(canPick(g, g.find('p1', 'hand', Y4))).toBe(false); // cost 4
      expect(canPick(g, g.find('p1', 'hand', V.c2))).toBe(false); // not yellow
      pick(g, [g.find('p1', 'hand', Y3)]);
      expect(idsOf(g, 'p1', 'characters')).toEqual([Y3]);
    });

    it('"up to 1": may play nothing', () => {
      const g = hitWith(ID, 'ST08-001', { hand: [Y3] });
      g.act({ type: 'trigger', activate: true });
      none(g);
      expect(idsOf(g, 'p1', 'characters')).toEqual([]);
      expect(handIds(g, 'p1')).toEqual([Y3]);
    });
  });
});
