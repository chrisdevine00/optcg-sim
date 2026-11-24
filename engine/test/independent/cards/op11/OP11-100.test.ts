/**
 * OP11-100 Otohime (Character, Yellow, cost 1, 0, Counter +2000, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[On Play] If your Leader is [Shirahoshi], you may turn 1 card from the top of your Life
 * cards face-down: Draw 1 card."
 *
 * Rules: CR 8-3-2 (If checked on resolution), CR 8-3-1-4 ("you may" cost), CR 1-3-2-1 (an action that
 * cannot be done cannot be taken: turning a face-down card face-down is impossible; official OP13-109
 * and OP15-114 Q&A rule the face-up mirror, M4b-3). So the cost needs a face-up top Life card.
 */
import { describe, expect, it } from 'vitest';
import {
  cnt,
  kind,
  LD11,
  lifeCards,
  lifeFaces,
  lifeUp,
  me,
  no,
  playRaw,
  SC11,
  unusable,
  up,
  yes,
  type LifeRow,
} from './kit-op11c.ts';

const ID = 'OP11-100';

function start(o: { leader?: string; life?: LifeRow } = {}) {
  const g = me(
    o.leader ?? LD11.shirahoshi,
    { hand: [ID], life: o.life ?? lifeUp(4), deck: [SC11.r1, SC11.r2, SC11.r3, SC11.r4, SC11.r5] },
    {},
  );
  playRaw(g, ID);
  return g;
}

describe('OP11-100 Otohime: with a [Shirahoshi] Leader, turn my top Life card face-down to draw 1', () => {
  it('printed effect: accept, the top Life card turns face-down and I draw 1 card', () => {
    const g = start();
    yes(g, 'p1');
    expect(lifeFaces(g)).toEqual([false, true, true, true]);
    expect(cnt(g, 'p1', 'hand')).toBe(1);
    expect(g.zone('p1', 'hand')[0]!.card).toBe(SC11.r1);
    expect(kind(g)).toBe('main');
  });

  it('only the top card is turned and no Life card leaves the Life area', () => {
    const g = start();
    yes(g, 'p1');
    expect(cnt(g, 'p1', 'life')).toBe(4);
  });

  it('"you may": declining turns nothing and draws nothing', () => {
    const g = start();
    no(g, 'p1');
    expect(lifeFaces(g)).toEqual([true, true, true, true]);
    expect(cnt(g, 'p1', 'hand')).toBe(0);
  });

  it('a Leader that is not [Shirahoshi]: the effect does not happen (no draw, Life unchanged)', () => {
    const g = start({ leader: LD11.plain });
    if (kind(g) === 'optional') {
      unusable(g, 'p1');
    }
    expect(kind(g)).toBe('main');
    expect(lifeFaces(g)).toEqual([true, true, true, true]);
    expect(cnt(g, 'p1', 'hand')).toBe(0);
  });

  it('unpayable: the top Life card is already face-down, so it cannot be turned face-down', () => {
    const g = start({ life: [SC11.r1, up(SC11.r2), up(SC11.r3)] });
    unusable(g, 'p1');
    expect(lifeFaces(g)).toEqual([false, true, true]);
    expect(cnt(g, 'p1', 'hand')).toBe(0);
  });

  it('unpayable: no Life cards at all', () => {
    const g = start({ life: [] });
    unusable(g, 'p1');
    expect(cnt(g, 'p1', 'hand')).toBe(0);
    expect(kind(g)).toBe('main');
  });

  it('only the TOP card matters: a face-down card below a face-up top does not stop the cost', () => {
    const g = start({ life: [up(SC11.r1), SC11.r2, SC11.r3] });
    yes(g, 'p1');
    expect(lifeFaces(g)).toEqual([false, false, false]);
    expect(cnt(g, 'p1', 'hand')).toBe(1);
  });

  it('draws exactly 1 card, from the top of my deck', () => {
    const g = start();
    yes(g, 'p1');
    expect(cnt(g, 'p1', 'hand')).toBe(1);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
  });

  it('turning the Life card face-down does not change which cards are in my Life', () => {
    const g = start({ life: [up(SC11.r1), up(SC11.r2)] });
    yes(g, 'p1');
    expect(lifeCards(g)).toEqual([SC11.r1, SC11.r2]);
  });
});
