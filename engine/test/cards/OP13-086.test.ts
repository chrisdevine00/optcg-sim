/** OP13-086 Saint Shalria. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import {
  CELESTIAL,
  idsOf,
  mine,
  pickableCards,
  pickCard,
  SHALRIA,
  settle,
} from './helpers-op13g3.ts';

const ID = SHALRIA;

describe('OP13-086 Saint Shalria', () => {
  const start = (deck: string[], hand: string[] = []) => mine({ hand: [ID, ...hand], deck }, {}, 2);

  it('[On Play] look at 3, reveal up to 1 "Celestial Dragons" card other than [Saint Shalria] to hand, trash the rest, then trash 1 card from your hand', () => {
    const g = start([V.c1, CELESTIAL, ID, V.c2, V.c3], [V.c4]);
    play(g, ID);
    // [Saint Shalria] herself and the vanilla are not candidates.
    expect(pickableCards(g)).toEqual([CELESTIAL]);
    pickCard(g, CELESTIAL);
    // The rest of the 3 are trashed, then 1 card of the hand (the taken one included) is trashed.
    expect(trash(g, 'p1').sort()).toEqual([V.c1, ID].sort());
    expect(hand(g, 'p1').sort()).toEqual([V.c4, CELESTIAL].sort());
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, ID, V.c4].sort());
    expect(hand(g, 'p1')).toEqual([CELESTIAL]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c2, V.c3]);
  });

  it('the hand trash is mandatory: exactly 1, and the card just taken is a legal choice', () => {
    const g = start([CELESTIAL, V.c1, V.c2, V.c3], []);
    play(g, ID);
    pickCard(g, CELESTIAL);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    pick(g, [g.find('p1', 'hand', CELESTIAL)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([CELESTIAL, V.c1, V.c2].sort());
  });

  it('"up to 1": may take nothing; all 3 are trashed and 1 card is still trashed from the hand', () => {
    const g = start([CELESTIAL, V.c1, V.c2, V.c3], [V.c4]);
    play(g, ID);
    none(g);
    expect(trash(g, 'p1').sort()).toEqual([CELESTIAL, V.c1, V.c2].sort());
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(trash(g, 'p1')).toHaveLength(4);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('only the top 3 are looked at: a Celestial Dragons card fourth from the top is not offered', () => {
    const g = start([V.c1, V.c2, V.c3, CELESTIAL], [V.c4]);
    play(g, ID);
    expect(pickableCards(g)).toEqual([]);
    settle(g);
    expect(idsOf(g, 'p1', 'deck')).toEqual([CELESTIAL]);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3, V.c4].sort());
  });

  it('with an empty hand after the look there is nothing to trash and the turn goes on', () => {
    const g = start([V.c1, V.c2, V.c3, V.c4]);
    play(g, ID);
    settle(g);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toHaveLength(3);
  });
});
