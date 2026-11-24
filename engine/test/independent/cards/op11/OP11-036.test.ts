/**
 * OP11-036 Spotted Neptunian (Character, Green, cost 4, 5000, Counter +1000, {Neptunian}).
 *
 * Card text: "[On Play] If your Leader is "Shirahoshi", look at 5 cards from the top of your deck;
 * reveal up to 1 "Neptunian" type card or "Shirahoshi" and add it to your hand. Then, place the rest
 * at the bottom of your deck in any order."
 *
 * Rules: the "If" reads the Leader's NAME. "Neptunian type card" is by type, "Shirahoshi" by name,
 * in any category. Revealing is public (CR 11-2-1). "Up to 1" may add nothing. When the condition
 * fails the whole look does not happen (nothing is looked at, the deck is untouched).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  deck,
  fill,
  hand,
  hasEvent,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  settleOrders,
  tail,
} from './kit-op11a.ts';

const SPOTTED = 'OP11-036';
/** OP03-116 Shirahoshi: Yellow Character named Shirahoshi, {Merfolk}. */
const SHIRA_A = 'OP03-116';
/** OP11-030 Shirahoshi: Green Character named Shirahoshi, {Merfolk}/{Fish-Man Island}. */
const SHIRA_B = 'OP11-030';

function start(leader: string, top: string[]) {
  const g = mine(leader, { hand: [SPOTTED], deck: [...top, ...fill(BLUE, 10)] });
  playRaw(g, SPOTTED);
  return g;
}

const FIVE = [N11.nept6, SHIRA_A, N11.merfolk5, N11.fish3, SHIRA_B];

describe('OP11-036 Spotted Neptunian: [On Play] with a [Shirahoshi] Leader, look at 5 and add a Neptunian or Shirahoshi', () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = mine(L11.shirahoshi, { hand: [SPOTTED] });
    const s = at(g, 'p1', 'hand', SPOTTED);
    expect(g.card(s).cost).toBe(4);
    expect(g.power(s)).toBe(5000);
    expect(g.card(s).counter).toBe(1000);
  });

  it('offers Neptunian type cards and cards named Shirahoshi, not other Merfolk or Fish-Man Island cards', () => {
    const g = start(L11.shirahoshi, FIVE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.nept6, SHIRA_A, SHIRA_B].sort());
  });

  it('adds the chosen card (revealed) to hand; the other four go to the bottom of the deck', () => {
    const g = start(L11.shirahoshi, FIVE);
    pickCards(g, [SHIRA_A]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([SHIRA_A]);
    expect(deck(g)).toHaveLength(14);
    expect(tail(deck(g), 4)).toEqual([N11.nept6, N11.merfolk5, N11.fish3, SHIRA_B].sort());
    expect(hasEvent(g, 'CardRevealed', { card: SHIRA_A })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: N11.fish3 })).toBe(false);
  });

  it('a Neptunian type card can be the one added', () => {
    const g = start(L11.shirahoshi, FIVE);
    pickCards(g, [N11.nept6]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([N11.nept6]);
  });

  it('"up to 1": may add nothing; all five go to the bottom', () => {
    const g = start(L11.shirahoshi, FIVE);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([...FIVE].sort());
  });

  it('adds at most one card even though three qualify', () => {
    const g = start(L11.shirahoshi, FIVE);
    pickCards(g, [N11.nept6]);
    if (kind(g) === 'choose') expect(offeredIds(g)).not.toContain(SHIRA_B);
    settleOrders(g, 'p1');
    expect(hand(g)).toHaveLength(1);
  });

  it('a matching card in position 6 is not looked at', () => {
    const g = start(L11.shirahoshi, [
      N11.marco,
      N11.marco,
      N11.marco,
      N11.marco,
      N11.marco,
      N11.nept6,
    ]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(N11.nept6);
  });

  it('with any other Leader nothing is looked at: the deck and hand are untouched', () => {
    const g = start(L11.jinbe, FIVE);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g).slice(0, 5)).toEqual(FIVE);
  });

  it('a Character named Shirahoshi on my field does not satisfy the "If"', () => {
    const g = mine(L11.jinbe, {
      hand: [SPOTTED],
      characters: [SHIRA_A],
      deck: [...FIVE, ...fill(BLUE, 10)],
    });
    playRaw(g, SPOTTED);
    expect(kind(g)).toBe('main');
    expect(deck(g)).toHaveLength(15);
  });
});
