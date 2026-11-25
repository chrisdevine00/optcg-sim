/** ST22-006 Jozu. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, pick, play, trash } from './helpers.ts';
import { choices, deckOf, mk, V, WB4, WB5 } from './helpers-lfb.ts';

const ID = 'ST22-006';

describe('ST22-006 Jozu', () => {
  const start = (top: string, handExtra: string[] = [V.c5]) =>
    mk({ hand: [ID, ...handExtra] as never, deck: [top, V.c1, V.c2, V.c3] as never });

  it('[On Play]: a revealed {Whitebeard Pirates} card: draw 2 cards and trash 1 card from your hand', () => {
    const g = start(WB4);
    play(g, ID);
    // Hand: V.c5, WB4 (drawn), V.c1: one is trashed.
    expectDecision(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', V.c5)]);
    expect(hand(g, 'p1')).toEqual([WB4, V.c1]);
    expect(trash(g, 'p1')).toEqual([V.c5]);
    expect(deckOf(g, 'p1')).toEqual([V.c2, V.c3]);
  });

  it('the trash is mandatory and may take a card just drawn, even the revealed one', () => {
    const g = start(WB5, []);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', WB5)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([WB5]);
  });

  it('must not fire: another type is only revealed; no draw, no trash', () => {
    const g = start(V.c4);
    play(g, ID);
    expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: V.c4 });
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([V.c5]);
    expect(trash(g, 'p1')).toEqual([]);
    expect(deckOf(g, 'p1')[0]).toBe(V.c4);
  });
});
