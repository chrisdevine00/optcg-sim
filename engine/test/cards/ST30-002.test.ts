/** ST30-002 Inazuma. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import {
  ACE6,
  ATMOS,
  donArea,
  offeredPicks,
  orderAll,
  P5000,
  P6000,
  P7000,
  SLASH_LEADER,
} from './helpers-stg1.ts';

const ID = 'ST30-002';

const start = (top: string[]) =>
  game(
    { leader: SLASH_LEADER, hand: [ID], deck: [...top, BLUE, BLUE, BLUE], ...donArea(1) },
    { leader: PLAIN_BLUE },
  );

describe('ST30-002 Inazuma', () => {
  it('[On Play]: looks at 5, reveals up to 1 Character with 6000 power into your hand, the rest go to the bottom', () => {
    const g = start([P5000, ATMOS, V.c1, V.c2, P7000]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', ATMOS)]);
    // "in any order" (STB5-R3): 4 cards go to the bottom, so the owner is asked the order
    expect(dec(g)?.kind).toBe('order');
    expect(dec(g)?.player).toBe('p1');
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([ATMOS]);
    expect(g.eventsOfType('CardRevealed').map((e) => e.card)).toContain(ATMOS);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(7);
    expect(deck.slice(0, 3)).toEqual([BLUE, BLUE, BLUE]);
    expect(deck.slice(3).sort()).toEqual([P5000, V.c1, V.c2, P7000].sort());
  });

  it('5000 and 7000 power Characters are not candidates, only exactly 6000', () => {
    const g = start([P5000, P7000, P6000, V.c1, V.c2]);
    play(g, ID);
    const choices = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(choices).toEqual([g.find('p1', 'deck', P6000)]);
    none(g);
  });

  it('"up to 1": taking none puts all 5 at the bottom', () => {
    const g = start([ATMOS, ACE6, V.c1, V.c2, V.c3]);
    play(g, ID);
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(BLUE);
  });

  it('only 1 card may be taken even with two candidates', () => {
    const g = start([ATMOS, ACE6, V.c1, V.c2, V.c3]);
    play(g, ID);
    // The choice closes after 1 pick (max 1): the second candidate is not offered afterwards.
    expect(dec(g)?.kind === 'choose' && dec(g)?.max).toBe(1);
    pick(g, [g.find('p1', 'deck', ATMOS)]);
    expect(offeredPicks(g)).not.toContain(g.find('p1', 'deck', ACE6));
    orderAll(g);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
  });

  it('the 6th card is not looked at, even a 6000 Character: it ends on top', () => {
    const g = start([V.c1, V.c2, V.c3, P7000, V.c1, ATMOS]);
    play(g, ID);
    if (dec(g)?.kind === 'choose') none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(ATMOS);
  });
});
