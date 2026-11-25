/** EB02-028 Portgas.D.Ace. */
import { describe, expect, it } from 'vitest';
import {
  ACE_LEADER,
  ANIMAL2,
  C1,
  C2,
  C3,
  C4,
  canPick,
  cardsOf,
  dec,
  expectDecision,
  finishOrder,
  hand,
  mk,
  none,
  pick,
  V,
} from './helpers-aeb2g1.ts';
import { play } from './helpers.ts';

const ID = 'EB02-028';
const EVENT2 = 'ST02-017'; // an Event with cost 2
const DECK = [C3, EVENT2, ANIMAL2, C1, C4, V.c5];
const start = (leader: string, handCards: string[] = [ID, C2, C3]) =>
  mk({ leader, hand: handCards, deck: DECK, costArea: { active: 5, rested: 0 } });

describe('EB02-028 Portgas.D.Ace', () => {
  it('with a Whitebeard Pirates Leader: looks at 5, adds a cost 2 Character, rest to the bottom, then plays a cost 2 Character from the hand rested', () => {
    const g = start(ACE_LEADER);
    play(g, ID);
    // From the 5 cards: only the cost-2 Character (not cost 3, not cost 1, not a cost-2 Event).
    expect(canPick(g, g.find('p1', 'deck', ANIMAL2))).toBe(true);
    for (const c of [C3, EVENT2, C1, C4]) expect(canPick(g, g.find('p1', 'deck', c))).toBe(false);
    pick(g, [g.find('p1', 'deck', ANIMAL2)]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(ANIMAL2);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([ANIMAL2, C2, C3].sort());
    // The play: cost exactly 2 in the hand (C2 and the added card), not the cost 3.
    expect(canPick(g, g.find('p1', 'hand', C2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', ANIMAL2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', C3))).toBe(false);
    pick(g, [g.find('p1', 'hand', C2)]);
    expect(g.card(g.find('p1', 'characters', C2)).rested).toBe(true);
    expect(hand(g, 'p1').sort()).toEqual([ANIMAL2, C3].sort());
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck[0]).toBe(V.c5);
    expect(deck).toHaveLength(5);
    expectDecision(g, 'main', 'p1');
  });

  it('the card just added may be the one played', () => {
    const g = start(ACE_LEADER, [ID, C3]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', ANIMAL2)]);
    finishOrder(g);
    pick(g, [g.find('p1', 'hand', ANIMAL2)]);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([ANIMAL2, ID].sort());
  });

  it('a Leader whose type does not include "Whitebeard Pirates": nothing happens', () => {
    const g = start('ST01-001');
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p1', 'deck')).toEqual(DECK);
    expect(hand(g, 'p1')).toEqual([C2, C3]);
  });

  it('"up to 1": may add nothing and play nothing; all 5 go to the bottom', () => {
    const g = start(ACE_LEADER);
    play(g, ID);
    none(g);
    finishOrder(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([C2, C3]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c5);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(DECK.length);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('with no cost 2 Character in the hand the play is asked at max 0', () => {
    const g = start(ACE_LEADER, [ID, C3]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(dec(g)?.kind).toBe('choose');
    expect(dec(g)?.max ?? 0).toBe(0);
  });
});
