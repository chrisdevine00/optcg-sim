/** PRB02-003 Lucky.Roux. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  expectDecision,
  hand,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { cardsIn, mk } from './helpers-prbst.ts';

const ID = 'PRB02-003';
const EVENT = 'OP03-056'; // an Event with no power

describe('PRB02-003 Lucky.Roux', () => {
  const start = (handCards: string[]) => mk({ hand: [ID, ...handCards] });

  it('has [Blocker] (printed)', () => {
    const g = start([]);
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play]: trash a Character with 6000 power or more from your hand: draw 2 cards', () => {
    const g = start([V.c4, BLUE]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(trash(g, 'p1')).toEqual([V.c4]);
    expect(hand(g, 'p1')).toHaveLength(3); // BLUE + two drawn
  });

  it('boundary: 5000 power is not enough, so accepting pays nothing and draws nothing; 6000 is', () => {
    const g = start([V.c3, BLUE]);
    play(g, ID);
    // The prompt does not depend on the hand's contents (no hidden-zone gate), but it cannot be paid.
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([]);
    const h = start([V.c4]);
    play(h, ID);
    accept(h);
    pick(h, [h.find('p1', 'hand', V.c4)]);
    expect(trash(h, 'p1')).toEqual([V.c4]);
  });

  it('only Character cards count: an Event is not a candidate', () => {
    const g = start([EVENT, V.c5]);
    play(g, ID);
    accept(g);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(1); // V.c5 (7000) only
    pick(g, [g.find('p1', 'hand', V.c5)]);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([V.c5]);
  });

  it('"you may": declining trashes and draws nothing', () => {
    const g = start([V.c4, BLUE]);
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});
