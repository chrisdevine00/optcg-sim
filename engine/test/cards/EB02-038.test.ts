/** EB02-038 Magellan. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play } from './helpers.ts';
import { BLUE, canPick, IMPEL1, IMPEL2, IMPEL3, IMPEL4, ids, mk, V } from './helpers-aeb2g2.ts';

const ID = 'EB02-038';
const start = (handCards: string[]) => {
  const g = mk({ hand: [ID, ...handCards] });
  play(g, ID);
  return g;
};

describe('EB02-038 Magellan', () => {
  it('[On Play] plays an {Impel Down} Character with cost 2 or less from the hand', () => {
    const g = start([IMPEL1, BLUE]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', IMPEL1))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', BLUE))).toBe(false);
    pick(g, [g.find('p1', 'hand', IMPEL1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, IMPEL1]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('cost boundary: cost 2 is playable, cost 3 and cost 4 are not', () => {
    const g = start([IMPEL3, IMPEL2, IMPEL4]);
    expect(canPick(g, g.find('p1', 'hand', IMPEL2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', IMPEL3))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', IMPEL4))).toBe(false);
    pick(g, [g.find('p1', 'hand', IMPEL2)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, IMPEL2]);
  });

  it('a cost 2 Character of another type is not offered', () => {
    const g = start([V.c2]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play nothing', () => {
    const g = start([IMPEL1]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([IMPEL1]);
  });

  it('hidden-gate: the pick is asked at max 0 even when the hand holds no match (nothing leaks)', () => {
    const g = start([BLUE]);
    const d = dec(g);
    expect(d?.kind).toBe('choose');
    expect(d?.player).toBe('p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(true);
    g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
  });
});
