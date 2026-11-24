/** EB04-006 Moda. */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { expectDecision, game, hand, none, pick, play, PLAIN_BLUE, PURPLE } from './helpers.ts';
import { cardsOf, finishOrder, RED_LEADER } from './helpers-eb04g1.ts';

const ID = 'EB04-006';
const KINGDOM = 'EB04-010'; // the Stage named [Lulucia Kingdom] (type {Lulucia Kingdom})
const MODA_OLD = 'OP07-014'; // another [Moda], type {Lulucia Kingdom}, not named [Lulucia Kingdom]

const deck = [PURPLE, MODA_OLD, KINGDOM, PURPLE, PURPLE, PURPLE, PURPLE, KINGDOM, PURPLE];
const start = (d = deck) =>
  game(
    { leader: RED_LEADER, hand: [ID], deck: d, costArea: { active: 1, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('EB04-006 Moda', () => {
  it('[On Play]: looks at exactly 7; only a card NAMED [Lulucia Kingdom] is offered (a {Lulucia Kingdom} type card and the 8th card are not)', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    const v = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v.looking).toHaveLength(7);
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(1);
    expect(offered[0]).toMatchObject({ choice: g.find('p1', 'deck', KINGDOM, 0) });
  });

  it('takes it to the hand (revealed) and the other 6 go to the bottom in an order the owner picks', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'deck', KINGDOM, 0)]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(KINGDOM);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([KINGDOM]);
    const rest = cardsOf(g, 'p1', 'deck');
    expect(rest).toHaveLength(deck.length - 1);
    // The 2 cards that were not looked at come first; the looked-at ones follow.
    expect(rest.slice(0, 2)).toEqual([KINGDOM, PURPLE]);
  });

  it('may take nothing even with a match ("up to 1"): all 7 go to the bottom', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length);
    expect(cardsOf(g, 'p1', 'deck').slice(0, 2)).toEqual([KINGDOM, PURPLE]);
  });

  it('a match only at position 8 is out of reach; with no match in the 7 nothing can be picked', () => {
    const g = start([PURPLE, MODA_OLD, PURPLE, PURPLE, PURPLE, PURPLE, PURPLE, KINGDOM, PURPLE]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
