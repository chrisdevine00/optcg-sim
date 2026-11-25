/** ST28-001 Ashura Doji. */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  dec,
  ids,
  mk,
  none,
  pick,
  play,
  PLAIN_BLUE,
  raiseCost,
  times,
  V,
  WANO_LEADER,
} from './helpers-lfc.ts';

const ID = 'ST28-001';

describe('ST28-001 Ashura Doji', () => {
  const start = (leader: string, p2chars: string[], oppLife = 3) =>
    mk({ leader, hand: [ID] }, { characters: p2chars, life: times(oppLife, V.c1) });

  it('[On Play] with a {Land of Wano} Leader and 3+ opposing Life: K.O.s a Character with a base cost of 5 or less', () => {
    const g = start(WANO_LEADER, [V.c5, V.c6, V.c2]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'characters').sort()).toEqual([V.c2, V.c6].sort());
    expect(ids(g, 'p2', 'trash')).toEqual([V.c5]);
  });

  it('boundary: 3 Life cards fires, 2 does not', () => {
    const three = start(WANO_LEADER, [V.c5], 3);
    play(three, ID);
    expect(dec(three)?.kind).toBe('choose');
    const two = start(WANO_LEADER, [V.c5], 2);
    play(two, ID);
    expect(dec(two)?.kind).toBe('main');
    expect(ids(two, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('must not fire without a {Land of Wano} Leader', () => {
    const g = start(PLAIN_BLUE, [V.c5]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('base cost, not current: a base cost 6 Character lowered to 5 is not a target; a base cost 5 one raised to 6 is', () => {
    const g = start(WANO_LEADER, [V.c6, V.c5]);
    raiseCost(g, g.find('p2', 'characters', V.c6), -1);
    raiseCost(g, g.find('p2', 'characters', V.c5), 1);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start(WANO_LEADER, [V.c5]);
    play(g, ID);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });
});
