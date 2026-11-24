/**
 * OP11-004 Kujyaku (Character, Red, cost 1, 0 power, Counter +1000, {Navy}/{SWORD}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 "Navy" type card
 * other than "Kujyaku" and add it to your hand. Then, place the rest at the bottom of your deck in
 * any order. [Activate: Main] You may trash this Character: Up to 1 of your Characters gains +1000
 * power during this turn."
 *
 * Rules: "other than [Kujyaku]" excludes every card NAMED Kujyaku (CR 2-1-2 names), whatever its
 * number. "Navy type card" is any category (Character, Event, ...). Revealing is public (CR 11-2-1).
 * A trashed cost is paid before the effect; an [Activate: Main] has no summoning restriction.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chr,
  deck,
  endTurn,
  fill,
  hand,
  hasEvent,
  ids,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  pickInst,
  playRaw,
  settleOrders,
  tail,
  trash,
  useAbility,
} from './kit-op11a.ts';

const KUJ = 'OP11-004';
/** EB03-041 Kujyaku: Navy/SWORD, a different card with the same name. */
const KUJ_OTHER = 'EB03-041';
/** OP11-018 Honesty Impact: a Navy/SWORD Event. */
const NAVY_EVENT = 'OP11-018';

function start(top: string[], opts: { chars?: string[] } = {}) {
  const g = mine(L11.luffy, {
    hand: [KUJ],
    characters: opts.chars ?? [],
    deck: [...top, ...fill(BLUE, 10)],
  });
  playRaw(g, KUJ);
  return g;
}

const FIVE = [N11.navy3, N11.marco, KUJ_OTHER, NAVY_EVENT, N11.fish3];

describe('OP11-004 Kujyaku: [On Play] look at 5, add up to 1 {Navy} other than Kujyaku', () => {
  it('printed values: cost 1, 0 power, Counter +1000', () => {
    const g = mine(L11.luffy, { hand: [KUJ] });
    const k = at(g, 'p1', 'hand', KUJ);
    expect(g.card(k).cost).toBe(1);
    expect(g.power(k)).toBe(0);
    expect(g.card(k).counter).toBe(1000);
  });

  it('offers the Navy cards of the top 5, Events included, never a card named Kujyaku or a non-Navy card', () => {
    const g = start(FIVE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.navy3, NAVY_EVENT].sort());
  });

  it('the chosen card is revealed and added to hand; the other four go to the bottom of the deck', () => {
    const g = start(FIVE);
    pickCards(g, [N11.navy3]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([N11.navy3]);
    expect(deck(g)).toHaveLength(14);
    expect(tail(deck(g), 4)).toEqual([N11.marco, KUJ_OTHER, NAVY_EVENT, N11.fish3].sort());
    expect(hasEvent(g, 'CardRevealed', { card: N11.navy3 })).toBe(true);
  });

  it('a Navy Event can be the card added', () => {
    const g = start(FIVE);
    pickCards(g, [NAVY_EVENT]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([NAVY_EVENT]);
  });

  it('"up to 1": may add nothing; all five go to the bottom', () => {
    const g = start(FIVE);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([...FIVE].sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('a Navy card in position 6 is not looked at', () => {
    const g = start([N11.marco, N11.marco, N11.marco, N11.marco, N11.marco, N11.navy3]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(N11.navy3);
  });

  it('adds at most one card even though two qualify', () => {
    const g = start(FIVE);
    pickCards(g, [N11.navy3]);
    // After the one pick the engine must not still be offering the other Navy card as a pick.
    if (kind(g) === 'choose') expect(offeredIds(g)).not.toContain(NAVY_EVENT);
    settleOrders(g, 'p1');
    expect(hand(g)).toHaveLength(1);
  });
});

describe('OP11-004 Kujyaku: [Activate: Main] trash this Character, a Character gains +1000', () => {
  function board(chars: string[] = [N11.marco]) {
    return mine(L11.luffy, { characters: [KUJ, ...chars] });
  }

  it('trashes Kujyaku as the cost and gives the chosen Character +1000 power', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', KUJ));
    if (kind(g) === 'optional') g.act({ type: 'optional', accept: true, player: 'p1' });
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', N11.marco)]);
    expect(ids(g, 'p1', 'characters')).toEqual([N11.marco]);
    expect(trash(g)).toEqual([KUJ]);
    expect(g.power(chr(g, 'p1', N11.marco))).toBe(6000);
  });

  it('offers my Characters only, not the Leader, an opposing Character, or the trashed Kujyaku', () => {
    const g = mine(L11.luffy, { characters: [KUJ, N11.marco] }, { characters: [N11.sai] });
    useAbility(g, at(g, 'p1', 'characters', KUJ));
    if (kind(g) === 'optional') g.act({ type: 'optional', accept: true, player: 'p1' });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.marco]);
  });

  it('the +1000 lasts this turn only', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', KUJ));
    if (kind(g) === 'optional') g.act({ type: 'optional', accept: true, player: 'p1' });
    pickInst(g, [chr(g, 'p1', N11.marco)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p1', N11.marco))).toBe(5000);
  });

  it('can be used the turn it is played (no summoning restriction on [Activate: Main])', () => {
    const g = mine(L11.luffy, { characters: [{ card: KUJ, playedThisTurn: true }, N11.marco] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', KUJ))).toHaveLength(1);
  });

  it('"up to 1": the Character may be trashed with no one boosted', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', KUJ));
    if (kind(g) === 'optional') g.act({ type: 'optional', accept: true, player: 'p1' });
    need(g, 'choose', 'p1');
    none(g);
    expect(trash(g)).toEqual([KUJ]);
    expect(g.power(chr(g, 'p1', N11.marco))).toBe(5000);
  });
});
