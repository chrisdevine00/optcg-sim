/** OP15-044 Koala. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { BLUE, hand, none, pick, times, V } from './helpers.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { DR, DR_EVENT, EB_EVENT, mk } from './helpers-op15g1.ts';

const ID = 'OP15-044';

describe('OP15-044 Koala', () => {
  const koKoala = (top: string[]) => {
    const g = mk({ characters: [ID], deck: [...top, ...times(6, BLUE)] });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    return g;
  };

  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On K.O.]: reveals up to 1 {Dressrosa} Event from the top 3 into your hand; the rest go to the bottom', () => {
    const g = koKoala([V.c1, DR_EVENT, DR.c2]);
    pick(g, [g.find('p1', 'deck', DR_EVENT)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([DR_EVENT]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(8);
    expect(deck.slice(6).sort()).toEqual([V.c1, DR.c2].sort());
  });

  it('a {Dressrosa} Character and a non-{Dressrosa} Event are not candidates', () => {
    const g = koKoala([DR.c2, EB_EVENT, DR_EVENT]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', DR_EVENT)]);
  });

  it('boundary: only the top 3 are looked at (an Event in 4th place is not offered)', () => {
    const g = koKoala([V.c1, V.c2, DR.c2, DR_EVENT]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('"up to 1": may take nothing', () => {
    const g = koKoala([DR_EVENT, V.c1, V.c2]);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(6)
        .map((c) => c.card)
        .sort(),
    ).toEqual([DR_EVENT, V.c1, V.c2].sort());
  });
});
