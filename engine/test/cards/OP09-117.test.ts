/** OP09-117 Dereshi! (Event, cost 3). */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  canPick,
  damageGame,
  dec,
  expectDecision,
  finishOrder,
  hand,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  times,
  TRIG2,
  TRIG3,
  TRIG4,
  trash,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-117';
/** An Event with a [Trigger] (OP09-116). */
const TRIG_EVENT = 'OP09-116';

describe('OP09-117 Dereshi!: [Main]', () => {
  // Top 5: three cards with a [Trigger], this card's name (it has a [Trigger]), a card without one.
  const top5 = [TRIG3, ID, TRIG2, V.c1, TRIG4];
  const start = (deck = [...top5, ...times(5, BLUE)]) => mk({ hand: [ID], deck });

  it('reveals up to 2 cards with a [Trigger] from the top 5 into your hand; the rest go to the bottom', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', TRIG3))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', TRIG2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', TRIG4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false); // no [Trigger]
    pick(g, [g.find('p1', 'deck', TRIG3), g.find('p1', 'deck', TRIG4)]);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([TRIG3, TRIG4].sort());
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck).toHaveLength(8);
    expect(deck.slice(5).sort()).toEqual([ID, TRIG2, V.c1].sort());
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('must not take a card named [Dereshi!] (another copy of itself)', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false);
  });

  it('at most 2 cards: after 2 the choice closes', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'deck', TRIG3), g.find('p1', 'deck', TRIG2)]);
    expect(dec(g)?.kind).toBe('order');
    finishOrder(g);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('"up to 2": may take just 1, or none', () => {
    const one = start();
    play(one, ID);
    pick(one, [one.find('p1', 'deck', TRIG2)]);
    finishOrder(one);
    expect(hand(one, 'p1')).toEqual([TRIG2]);
    const zero = start();
    play(zero, ID);
    none(zero);
    finishOrder(zero);
    expect(hand(zero, 'p1')).toEqual([]);
  });

  it('a card of any category with a [Trigger] counts: an Event', () => {
    const g = start([TRIG_EVENT, V.c1, V.c1, V.c1, V.c1, ...times(5, BLUE)]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', TRIG_EVENT))).toBe(true);
  });

  it('boundary: the 6th card is not looked at', () => {
    const g = start([V.c1, V.c1, V.c1, V.c1, V.c1, TRIG3, ...times(4, BLUE)]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1'); // asked at max 0 (a hidden top must not show "no match")
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(TRIG3);
  });
});

describe('OP09-117 Dereshi!: [Trigger]', () => {
  it('draws 1 card', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER, deck: [V.c2, V.c3] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });
});
