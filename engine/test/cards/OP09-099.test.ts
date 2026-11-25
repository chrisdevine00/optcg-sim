/** OP09-099 Fullalead (Stage, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BB4,
  BB5,
  BLUE,
  canPick,
  expectDecision,
  finishOrder,
  hand,
  idsOf,
  mk,
  none,
  offeredAb,
  OTHER_LEADER,
  pick,
  times,
  trash,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-099';
// Top 3: a Blackbeard Pirates Character, a card of another type, another Blackbeard Pirates Character.
const TOP3 = [BB4, V.c3, BB5];

describe('OP09-099 Fullalead: [Activate: Main]', () => {
  const start = (deck = [...TOP3, V.c4, ...times(5, BLUE)], handCards = [V.c1, V.c2]) =>
    mk({ leader: OTHER_LEADER, stage: ID, hand: handCards, deck });
  const stage = (g: ReturnType<typeof start>) => g.find('p1', 'stage', ID);

  it('trash 1 card from your hand and rest this Stage: reveal up to 1 Blackbeard Pirates card from the top 3 and add it to your hand; the rest to the bottom', () => {
    const g = start();
    activate(g, stage(g), 'activate');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]); // the cost
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', BB4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', BB5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c3))).toBe(false); // another type
    pick(g, [g.find('p1', 'deck', BB5)]);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([V.c2, BB5].sort());
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(g.card(stage(g)).rested).toBe(true);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck[0]).toBe(V.c4);
    expect(deck.slice(-2).sort()).toEqual([BB4, V.c3].sort());
  });

  it('"up to 1": may take nothing; the cost is still paid and all 3 go to the bottom', () => {
    const g = start();
    activate(g, stage(g), 'activate');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(idsOf(g, 'p1', 'deck').slice(-3).sort()).toEqual([...TOP3].sort());
  });

  it('boundary: the 4th card is not looked at', () => {
    const g = start([V.c3, V.c3, V.c3, BB4, ...times(4, BLUE)]);
    activate(g, stage(g), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'choose', 'p1'); // asked at max 0
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(BB4);
  });

  it('needs a card in hand to trash: not offered with an empty hand', () => {
    const g = start(undefined, []);
    expect(offeredAb(g, stage(g), 'activate')).toBe(false);
  });

  it('cannot be activated while it is rested', () => {
    const g = mk({ leader: OTHER_LEADER, stage: { card: ID, rested: true }, hand: [V.c1] });
    expect(offeredAb(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
  });
});
