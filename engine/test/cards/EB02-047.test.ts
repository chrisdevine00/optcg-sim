/** EB02-047 Blueno. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick } from './helpers.ts';
import {
  activate,
  BLACK_PLAIN4,
  BLUENO_OTHER,
  canActivate,
  canPick,
  CP2,
  CP4,
  CP5,
  CP6,
  ids,
  mk,
  V,
} from './helpers-aeb2g2.ts';

const ID = 'EB02-047';
const start = (p1: Parameters<typeof mk>[0] = {}) =>
  mk({ characters: [ID], hand: [V.c1], trash: [CP5, CP6, CP2], ...p1 });
const go = (g: ReturnType<typeof start>) => {
  activate(g, g.find('p1', 'characters', ID), 'activate');
  expectDecision(g, 'choose', 'p1');
};

describe('EB02-047 Blueno', () => {
  it('[Activate: Main] trashes 1 hand card and itself, then plays a {CP} Character with cost 5 or less from the trash', () => {
    const g = start();
    go(g);
    pick(g, [g.find('p1', 'hand', V.c1)]); // the cost
    expectDecision(g, 'choose', 'p1');
    // Offered: cost 5 (boundary) and cost 2; cost 6 is not.
    expect(canPick(g, g.find('p1', 'trash', CP5))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', CP2))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', CP6))).toBe(false);
    pick(g, [g.find('p1', 'trash', CP5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([CP5]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([ID, V.c1, CP6, CP2].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the card trashed from the hand as the cost can be the Character played from the trash', () => {
    const g = start({ hand: [CP4], trash: [] });
    go(g);
    pick(g, [g.find('p1', 'hand', CP4)]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'trash', CP4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([CP4]);
  });

  it('another [Blueno] and a Character without {CP} in its type are not offered ("other than [Blueno]")', () => {
    const g = start({ trash: [BLUENO_OTHER, BLACK_PLAIN4, CP2] });
    go(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(canPick(g, g.find('p1', 'trash', BLUENO_OTHER))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', BLACK_PLAIN4))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', CP2))).toBe(true);
    // This Blueno is in the trash too (trashed by the cost) and is not offered either.
    expect(canPick(g, g.find('p1', 'trash', ID))).toBe(false);
  });

  it('"up to 1": may play nothing; the cost is paid anyway', () => {
    const g = start();
    go(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toContain(ID);
  });

  it('must not be activated with an empty hand (the cost cannot be paid)', () => {
    const g = start({ hand: [] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});
