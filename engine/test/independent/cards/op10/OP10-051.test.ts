/**
 * OP10-051 Hack (Character, Blue, cost 4, 5000, Counter +1000, {Fish-Man}/{Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "[DON!! x1] [When Attacking] Look at 3 cards from the top of your deck; reveal up to 1
 * "Revolutionary Army" type Character card and add it to your hand. Then, place the rest at the bottom
 * of your deck in any order."
 *
 * Rules: [DON!! x1] needs 1 DON!! given to this Character (CR 10-2-...), a type in quotation marks
 * matches by inclusion (CR 2-4-3-1), a Character card is not a Stage or Event, CR 11-2-1 (revealed
 * cards), "up to 1" may be 0 (CR 8-1-2), the unchosen cards go to the bottom.
 * Scenery (vanilla): OP05-012 Hack (RA, cost 3), OP09-113 Morley (RA), OP12-083 Inazuma (RA),
 * OP01-023 Marco (not RA), OP05-021 Revolutionary Army HQ ({Revolutionary Army} Stage).
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence } from '../../helpers.ts';
import {
  BLUE,
  C10,
  deck,
  expectMain,
  hand,
  hasEvent,
  inst,
  L10,
  minus,
  mine,
  need,
  none,
  offeredNow,
  pickCards,
  settleOrders,
  tail,
} from './kit-op10b.ts';

const HACK = 'OP10-051';
const HQ = 'OP05-021';
const RA1 = C10.hack3;
const RA2 = C10.morley4;
const RA3 = C10.inazuma5;
const MISS = C10.marco;

const rest = () => Array.from({ length: 8 }, () => BLUE);

function board(top: string[], don = 1) {
  return mine(L10.luffy, {
    characters: [{ card: HACK, don }],
    costArea: { active: 5, rested: 0 },
    deck: [...top, RA3, ...rest()],
  });
}
const swing = (g: ReturnType<typeof board>) =>
  attack(g, inst(g, 'p1', 'characters', HACK), g.leader('p2'));
const finishLook = (g: ReturnType<typeof board>) => settleOrders(g);

describe('OP10-051 Hack: [DON!! x1] [When Attacking] look at 3, add up to 1 {Revolutionary Army} Character, rest to the bottom', () => {
  it('offers exactly the {Revolutionary Army} Characters among the top 3; the pick goes to hand, the other two to the bottom', () => {
    const top = [RA1, MISS, RA2];
    const g = board(top);
    const total = deck(g).length;
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([RA1, RA2].sort());
    pickCards(g, [RA2]);
    finishLook(g);
    expect(hand(g)).toEqual([RA2]);
    expect(deck(g)).toHaveLength(total - 1);
    expect(deck(g)[0]).toBe(RA3);
    expect(tail(deck(g), 2)).toEqual(minus(top, [RA2]).sort());
  });

  it('only the top 3 are looked at: a {Revolutionary Army} Character in position 4 is not offered', () => {
    const g = board([MISS, MISS, MISS]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([]);
    none(g);
    finishLook(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(RA3);
  });

  it('a {Revolutionary Army} Stage is not a Character card: it is not offered', () => {
    const g = board([HQ, RA1, MISS]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([RA1]);
  });

  it('a Character of another type (Marco) is not offered', () => {
    const g = board([MISS, MISS, RA1]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([RA1]);
  });

  it('"up to 1": may add nothing; all 3 looked-at cards go to the bottom', () => {
    const top = [RA1, RA2, MISS];
    const g = board(top);
    swing(g);
    need(g, 'choose', 'p1');
    none(g);
    finishLook(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(RA3);
    expect(tail(deck(g), 3)).toEqual([...top].sort());
  });

  it('adds at most 1 card even when 2 or 3 qualify', () => {
    const g = board([RA1, RA2, RA3]);
    swing(g);
    need(g, 'choose', 'p1');
    pickCards(g, [RA1]);
    finishLook(g);
    expect(hand(g)).toEqual([RA1]);
    expect(tail(deck(g), 2)).toEqual([RA2, RA3].sort());
  });

  it('the chosen card is revealed (CR 11-2-1); the others are not', () => {
    const g = board([RA1, MISS, MISS]);
    swing(g);
    pickCards(g, [RA1]);
    finishLook(g);
    expect(hasEvent(g, 'CardRevealed', { card: RA1 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MISS })).toBe(false);
  });

  it('[DON!! x1]: without a DON!! given to Hack the attack looks at nothing', () => {
    const g = board([RA1, RA2, MISS], 0);
    const before = deck(g);
    swing(g);
    noDefence(g);
    expectMain(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toEqual(before);
  });

  it('with 2 DON!! given it still looks at only 3 cards and adds at most 1', () => {
    const g = board([RA1, RA2, MISS], 2);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([RA1, RA2].sort());
    pickCards(g, [RA2]);
    finishLook(g);
    expect(hand(g)).toEqual([RA2]);
    expect(deck(g)[0]).toBe(RA3);
  });

  it('the cards taken leave the top: the next draw is the card that was in position 4', () => {
    const g = board([RA1, MISS, MISS]);
    swing(g);
    pickCards(g, [RA1]);
    finishLook(g);
    expect(deck(g)[0]).toBe(RA3);
  });
});
