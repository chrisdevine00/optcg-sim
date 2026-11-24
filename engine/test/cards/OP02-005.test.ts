/** OP02-005 Curly.Dadan. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times } from './helpers.ts';
import {
  canPick,
  cardsIn,
  finishOrder,
  GREEN_SN1,
  mk,
  pickable,
  RED1,
  RED2,
} from './helpers-st29old.ts';

const ID = 'OP02-005';
const RED_EVENT_1 = 'EB01-009'; // a red Event with a cost of 1 (not a Character)

describe('OP02-005 Curly.Dadan', () => {
  // Top 5: red Character cost 1, red cost 2, green cost 1, red Event cost 1, filler. 6th: another red cost 1.
  const deck = [BLUE, RED2, RED1, GREEN_SN1, RED_EVENT_1, RED1, ...times(4, BLUE)];
  const start = () => mk({ hand: [ID], deck });

  it('[On Play]: look at 5; reveal up to 1 red Character with a cost of 1 and add it to your hand', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(pickable(g)).toEqual([g.find('p1', 'deck', RED1, 0)]);
    pick(g, [g.find('p1', 'deck', RED1, 0)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([RED1]);
    const d = cardsIn(g, 'p1', 'deck');
    expect(d).toHaveLength(9);
    expect(d[0]).toBe(RED1); // the 6th card is now on top
  });

  it('must not offer a red cost 2 Character, a green cost 1 Character or a red Event', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', RED2))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', GREEN_SN1))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', RED_EVENT_1))).toBe(false);
  });

  it('boundary: only the top 5 are looked at (a matching card in 6th place is not offered)', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', RED1, 1))).toBe(false);
  });

  it('may add nothing; the 5 looked-at cards all go to the bottom', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsIn(g, 'p1', 'deck')).toHaveLength(10);
    expect(cardsIn(g, 'p1', 'deck')[0]).toBe(RED1); // the 6th card
  });

  it('with no matching card in the top 5 the choice is still asked and may be skipped', () => {
    const g = mk({
      hand: [ID],
      deck: [BLUE, RED2, GREEN_SN1, BLUE, BLUE, RED1, ...times(4, BLUE)],
    });
    play(g, ID);
    expect(pickable(g)).toEqual([]);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
