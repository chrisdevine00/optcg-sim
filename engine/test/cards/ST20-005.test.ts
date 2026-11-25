/** ST20-005 Charlotte Linlin. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  dec,
  expectDecision,
  hand,
  option,
  pick,
  play,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { mk } from './helpers-st1821.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'ST20-005';

/** p1 plays Linlin (cost 6), paying the cost with V.c1; p2 then owes the choice. */
const start = (oppHand: string[], oppLife: string[] = [PURPLE, PURPLE, PURPLE]): TestGame => {
  const g = mk({ hand: [ID, V.c1] }, { hand: oppHand, life: oppLife });
  play(g, ID);
  accept(g);
  pick(g, [g.find('p1', 'hand', V.c1)]);
  return g;
};

describe('ST20-005 Charlotte Linlin', () => {
  it('[On Play]: after the trash cost, your opponent chooses between the two modes', () => {
    const g = start([V.c2, V.c3]);
    const d = expectDecision(g, 'choose', 'p2');
    expect(d.purpose).toBe('mode');
    expect(d.options).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('mode 1: the opponent trashes 2 cards from their own hand (their choice)', () => {
    const g = start([V.c2, V.c3, V.c4]);
    option(g, '0');
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', V.c2), g.find('p2', 'hand', V.c4)]);
    expect(hand(g, 'p2')).toEqual([V.c3]);
    expect(trash(g, 'p2').sort()).toEqual([V.c2, V.c4].sort());
    expect(g.life('p2')).toBe(3);
  });

  it("mode 2: trashes the top card of the opponent's Life (not damage: no [Trigger], not to the hand)", () => {
    const g = start([V.c2, V.c3], [BLUE, PURPLE, PURPLE]);
    option(g, '1');
    expect(g.life('p2')).toBe(2);
    expect(trash(g, 'p2')).toEqual([BLUE]);
    expect(hand(g, 'p2')).toEqual([V.c2, V.c3]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('with fewer than 2 cards in hand the opponent may still choose mode 1 and trashes what they have', () => {
    const g = start([V.c2]);
    option(g, '0');
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p2', 'hand', V.c2)]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([V.c2]);
  });

  it('declining the optional cost: nothing is trashed and no choice is asked; with no Life, mode 2 does nothing', () => {
    const g = mk({ hand: [ID, V.c1] }, { hand: [V.c2] });
    play(g, ID);
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p1')).toEqual([]);
    const h = start([V.c2], []);
    option(h, '1');
    expect(h.life('p2')).toBe(0);
    expect(hand(h, 'p2')).toEqual([V.c2]);
  });
});
