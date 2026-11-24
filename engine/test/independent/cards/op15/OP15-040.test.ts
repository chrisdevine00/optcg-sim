/**
 * OP15-040 Viola (Character, Blue, cost 1, 2000, Counter +2000, {Donquixote Pirates}/{Dressrosa}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Dressrosa} type card
 * and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4-2 ("up to"), CR 11-2-1 (the revealed card), "type card": an Event with the type
 * qualifies as well as a Character.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chooseCards,
  describeLookAdd,
  don,
  hand,
  hasEvent,
  LD15,
  mine,
  need,
  offeredIds,
  playRaw,
  S15,
  settleOrders,
} from './kit-op15a.ts';

const VIOLA = 'OP15-040';

describeLookAdd({
  id: VIOLA,
  title: 'Viola',
  n: 3,
  leader: LD15.luffy,
  match: [S15.bellamy, S15.gilly],
  miss: BLUE,
  beyond: S15.koalaVan,
});

describe('OP15-040 Viola: cost, body and the reveal', () => {
  const top = () => [S15.bellamy, BLUE, BLUE, ...Array.from({ length: 8 }, () => BLUE)];

  it('costs exactly 1 DON!!, stays on the field with 2000 power, and the chosen card goes to hand', () => {
    const g = mine(LD15.luffy, { hand: [VIOLA], deck: top() });
    playRaw(g, VIOLA);
    chooseCards(g, [S15.bellamy]);
    settleOrders(g);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    expect(g.power(at(g, 'p1', 'characters', VIOLA))).toBe(2000);
    expect(hand(g)).toEqual([S15.bellamy]);
  });

  it('the added card is revealed, the two others are not', () => {
    const g = mine(LD15.luffy, { hand: [VIOLA], deck: top() });
    playRaw(g, VIOLA);
    chooseCards(g, [S15.bellamy]);
    settleOrders(g);
    expect(hasEvent(g, 'CardRevealed', { card: S15.bellamy })).toBe(true);
    expect(
      g.events.filter((e) => e.type === 'CardRevealed' && e.card === BLUE && e.reason !== 'play'),
    ).toHaveLength(0);
  });

  it('boundary: a {Dressrosa} card in the 3rd position is offered; one in the 4th is not', () => {
    const g = mine(LD15.luffy, {
      hand: [VIOLA],
      deck: [BLUE, BLUE, S15.gilly, S15.bellamy, ...Array.from({ length: 8 }, () => BLUE)],
    });
    playRaw(g, VIOLA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S15.gilly]);
  });
});

describe('OP15-040 Viola: what counts as a {Dressrosa} type card', () => {
  it('a {Dressrosa} Event (OP15-019 Barrier Bulls) and a {Dressrosa} Character are both offered; other cards are not', () => {
    const g = mine(LD15.luffy, {
      hand: [VIOLA],
      deck: ['OP15-019', S15.bellamy, S15.event, ...Array.from({ length: 8 }, () => BLUE)],
    });
    playRaw(g, VIOLA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(['OP15-019', S15.bellamy].sort());
    chooseCards(g, ['OP15-019']);
    settleOrders(g);
    expect(hand(g)).toEqual(['OP15-019']);
  });
});
