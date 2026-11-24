/** OP13-050 Boa Sandersonia. */
import { describe, expect, it } from 'vitest';
import { none, pick, play, PLAIN_BLUE } from './helpers.ts';
import {
  canPick,
  cardsOf,
  expectDecision,
  H3,
  H4,
  HANCOCK,
  HANCOCK_MONO,
  mk,
  V,
} from './helpers-op13g2.ts';

const ID = 'OP13-050';

const start = (leader: string, hand: string[] = [H3, H4, V.c1]) =>
  mk({ leader, hand: [ID, ...hand] });

describe('OP13-050 Boa Sandersonia', () => {
  it('[On Play]: with [Boa Hancock] as Leader, plays a [Boa Hancock] of cost 3 or less from hand (boundary 3)', () => {
    const g = start(HANCOCK);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', H3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', H4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false); // not [Boa Hancock]
    pick(g, [g.find('p1', 'hand', H3)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID, H3]);
  });

  it('any Leader named [Boa Hancock] works, not only the multicolored one', () => {
    const g = start(HANCOCK_MONO);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', H3)]);
    expect(cardsOf(g, 'p1', 'characters')).toContain(H3);
  });

  it('must not fire with another Leader', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play none', () => {
    const g = start(HANCOCK);
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(cardsOf(g, 'p1', 'hand')).toContain(H3);
  });

  it('plays it from hand only, with no cost paid', () => {
    const g = mk({ leader: HANCOCK, hand: [ID, H3], costArea: { active: 2, rested: 0 } });
    play(g, ID); // costs 2
    pick(g, [g.find('p1', 'hand', H3)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID, H3]);
  });
});
