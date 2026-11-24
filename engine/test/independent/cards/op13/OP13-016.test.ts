/**
 * OP13-016 Monkey.D.Garp (Character, Red, cost 1, 2000, Counter +1000, {Navy}, Strike).
 *
 * Card text: "[On Play] If your Leader is [Sabo], [Portgas.D.Ace] or [Monkey.D.Luffy], look at 4 cards
 * from the top of your deck; reveal up to 1 card with a cost of 3 or more and add it to your hand.
 * Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: the Leader condition is by card name (CR 8-3-3 "if" checked on resolution); the look is
 * "up to 1" of any category with cost 3 or more; the rest go to the bottom in any order.
 * Scenery: ST01-001 / OP13-001 Luffy, OP13-002 Ace, OP13-004 Sabo Leaders; ST05-001 Shanks (none of
 * the three names); OP02-006 Kingdew (cost 5), OP02-007 Thatch (6), OP01-023 Marco (3), OP01-012 Sai
 * (2), OP01-010 Komachiyo (1), OP13-020 Meteor Fist (Event, cost 3).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  deck,
  describeLook13,
  hand,
  kind,
  L13,
  mine,
  need,
  offeredIds,
  pickCards,
  playRaw,
  settleOrders,
  V13,
} from './kit-op13a.ts';

const GARP = 'OP13-016';
const METEOR = 'OP13-020';

function startWith(leader: string, deckTopFirst: string[], chars: string[] = []) {
  const g = mine(leader, {
    hand: [GARP],
    deck: deckTopFirst,
    characters: chars,
    costArea: { active: 10, rested: 0 },
  });
  playRaw(g, GARP);
  return g;
}
const filler = (n: number, c: string = V13.mohji) => Array.from({ length: n }, () => c);

describe('OP13-016 Monkey.D.Garp: printed values', () => {
  it('cost 1, 2000, Counter +1000', () => {
    const g = mine(L13.luffy, { hand: [GARP] });
    const c = g.card(at(g, 'p1', 'hand', GARP));
    expect(c.cost).toBe(1);
    expect(c.counter).toBe(1000);
    playRaw(g, GARP);
    expect(g.power(at(g, 'p1', 'characters', GARP))).toBe(2000);
  });
});

describeLook13({
  id: 'OP13-016',
  n: 4,
  start: (d) => startWith(L13.luffy, d),
  match: [V13.kingdew, V13.thatch], // cost 5 and 6
  miss: V13.komachiyo, // cost 1
  edgeHit: V13.marco, // cost exactly 3
  edgeMiss: V13.sai, // cost 2
});

describe('OP13-016 Monkey.D.Garp: the Leader condition', () => {
  const top = [V13.kingdew, V13.komachiyo, V13.thatch, V13.komachiyo];
  const deckOf = () => [...top, ...filler(12)];

  it.each([
    ['[Monkey.D.Luffy] (ST01-001)', L13.luffy],
    ['[Monkey.D.Luffy] (OP13-001)', 'OP13-001'],
    ['[Portgas.D.Ace]', L13.ace],
    ['[Sabo]', L13.sabo],
  ])('with a %s Leader the look happens', (_name, leader) => {
    const g = startWith(leader, deckOf());
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.kingdew, V13.thatch].sort());
  });

  it('with another Leader (ST05-001 Shanks) nothing is asked, nothing is looked at, the deck is untouched', () => {
    const g = startWith(L13.shanks, deckOf());
    expect(kind(g)).toBe('main');
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toEqual(deckOf());
    expect(hand(g)).toEqual([]);
  });

  it('a [Monkey.D.Luffy] Character on the field does not satisfy "your Leader is"', () => {
    const g = startWith(L13.shanks, deckOf(), [V13.luffy, V13.ace]);
    expect(kind(g)).toBe('main');
    expect(deck(g)).toEqual(deckOf());
  });

  it("the opponent's Leader does not count: p2's Leader is [Monkey.D.Luffy] here, my Crocodile Leader does not qualify", () => {
    const g = startWith(L13.croc, deckOf());
    expect(kind(g)).toBe('main');
    expect(g.card(g.leader('p2')).card).toBe(L13.luffy);
    expect(hand(g)).toEqual([]);
  });

  it('an Event with cost 3 or more is a legal pick (any card, not only Characters)', () => {
    const g = startWith(L13.luffy, [METEOR, V13.komachiyo, V13.komachiyo, V13.sai, ...filler(12)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([METEOR]);
    pickCards(g, [METEOR]);
    settleOrders(g);
    expect(hand(g)).toEqual([METEOR]);
  });
});
