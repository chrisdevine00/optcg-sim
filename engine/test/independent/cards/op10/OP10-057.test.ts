/**
 * OP10-057 Leo (Character, Blue, cost 1, 2000, Counter +1000, {Dressrosa}/{The Tontattas}).
 *
 * Card text: "[On Play] You may rest your Leader or 1 of your Stage cards: If your Leader is [Usopp], look
 * at 5 cards from the top of your deck; reveal up to 2 "Dressrosa" type cards other than [Leo] and add
 * them to your hand. Then, place the rest at the bottom of your deck in any order, and trash 1 card
 * from your hand."
 *
 * Rules: CR 8-3-1-4 ("you may" cost is paid by choice), the "If" after the colon is an effect
 * condition (the cost is paid whether or not it holds), "[Usopp]" is the exact name, a type in
 * quotation marks matches by inclusion (CR 2-4-3-1) on cards of any category, "up to 2" (CR 8-1-2),
 * CR 11-2-1 (revealed cards), "other than [Leo]" excludes every card named Leo, the trash is exact.
 * Scenery: OP10-042 Usopp (Leader, {Dressrosa}), OP04-096 Corrida Coliseum ({Dressrosa} Stage),
 * OP04-091 Leo (a second card named Leo), vanilla {Dressrosa} Characters, OP01-023 Marco (not Dressrosa).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  BLUE,
  C10,
  canFinish,
  deck,
  doneRaw,
  expectMain,
  hand,
  hasEvent,
  kind,
  L10,
  mine,
  minus,
  mustBeUnpayable,
  need,
  offeredNow,
  pickCards,
  pickRaw,
  playRaw,
  settleOrders,
  tail,
  trash,
  X10,
} from './kit-op10b.ts';

const LEO = 'OP10-057';
const LEO2 = 'OP04-091';
const STAGE = X10.coliseum;
const D1 = C10.gilly; // Dressrosa
const D2 = C10.viola; // Dressrosa
const D3 = C10.bellamyDr; // Dressrosa
const MISS = C10.marco;
const rest = () => Array.from({ length: 8 }, () => BLUE);

function start(
  top: string[],
  leader: string | { card: string; rested: boolean } = L10.usopp,
  spec = {},
) {
  return mine(leader, { hand: [LEO, C10.sai], deck: [...top, C10.thatch, ...rest()], ...spec });
}
const use = (g: TestGame) => {
  playRaw(g, LEO);
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: true });
};

describe('OP10-057 Leo: [On Play] rest my Leader or a Stage: with [Usopp] look at 5, add up to 2 {Dressrosa} cards other than [Leo], trash 1', () => {
  it('with [Usopp]: offers the {Dressrosa} cards among the top 5 except cards named Leo; the picks go to hand, the rest to the bottom, then 1 card is trashed', () => {
    const top = [D1, MISS, LEO2, D2, MISS];
    const g = start(top);
    const total = deck(g).length;
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([D1, D2].sort());
    pickCards(g, [D1, D2]);
    settleOrders(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.sai, D1, D2].sort());
    pickRaw(g, g.find('p1', 'hand', C10.sai));
    expectMain(g);
    expect(hand(g)).toEqual([D1, D2].sort());
    expect(trash(g)).toEqual([C10.sai]);
    expect(deck(g)).toHaveLength(total - 2);
    expect(deck(g)[0]).toBe(C10.thatch);
    expect(tail(deck(g), 3)).toEqual(minus(top, [D1, D2]).sort());
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('"other than [Leo]": a second card named Leo is not offered even though it is {Dressrosa}', () => {
    const g = start([LEO2, MISS, MISS, MISS, MISS]);
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([]);
  });

  it('a {Dressrosa} card of any category counts: a {Dressrosa} Stage is offered', () => {
    const g = start([STAGE, MISS, MISS, MISS, MISS]);
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([STAGE]);
  });

  it('"up to 2": a third card cannot be added', () => {
    const g = start([D1, D2, D3, MISS, MISS]);
    use(g);
    need(g, 'choose', 'p1');
    pickCards(g, [D1, D2]);
    // the pick is full; the third is no longer offered
    expect(kind(g) === 'choose' ? offeredNow(g) : []).not.toContain(D3);
    settleOrders(g);
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'hand', C10.sai));
    expect(hand(g)).toEqual([D1, D2].sort());
    expect(tail(deck(g), 3).sort()).toEqual([D3, MISS, MISS].sort());
  });

  it('"up to 2": may add just 1, or 0; with 0 added the hand card is still trashed', () => {
    const g = start([D1, D2, MISS, MISS, MISS]);
    use(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    doneRaw(g);
    settleOrders(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.sai]);
    pickRaw(g, g.find('p1', 'hand', C10.sai));
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([C10.sai]);
    expect(tail(deck(g), 5)).toEqual([D1, D2, MISS, MISS, MISS].sort());
  });

  it('the trash is exactly 1 card and cannot be skipped', () => {
    const g = start([D1, MISS, MISS, MISS, MISS]);
    use(g);
    pickCards(g, [D1]);
    settleOrders(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
  });

  it('only the top 5 are looked at: a {Dressrosa} card in position 6 is not offered', () => {
    const g = start([MISS, MISS, MISS, MISS, MISS]);
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([]);
  });

  it('the added cards are revealed (CR 11-2-1); the others are not', () => {
    const g = start([D1, MISS, MISS, MISS, MISS]);
    use(g);
    pickCards(g, [D1]);
    settleOrders(g);
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'hand', C10.sai));
    expect(hasEvent(g, 'CardRevealed', { card: D1 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MISS })).toBe(false);
  });

  it('with a Leader that is not [Usopp] the cost is still paid but nothing is looked at, added or trashed', () => {
    const g = start([D1, D2, MISS, MISS, MISS], L10.dressrosa);
    const before = deck(g);
    use(g);
    expectMain(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(deck(g)).toEqual(before);
    expect(hand(g)).toEqual([C10.sai]);
    expect(trash(g)).toEqual([]);
  });

  it('"you may": declining leaves the Leader active and looks at nothing', () => {
    const g = start([D1, MISS, MISS, MISS, MISS]);
    const before = deck(g);
    playRaw(g, LEO);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expectMain(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(deck(g)).toEqual(before);
  });

  it('a rested Leader and no Stage: the cost cannot be paid, nothing happens', () => {
    const g = start([D1, MISS, MISS, MISS, MISS], { card: L10.usopp, rested: true });
    playRaw(g, LEO);
    mustBeUnpayable(g, 'p1');
    expectMain(g);
    expect(hand(g)).toEqual([C10.sai]);
  });

  it('a Stage can be rested instead of the Leader (any Stage, here the {Dressrosa} one)', () => {
    const g = start([D1, MISS, MISS, MISS, MISS], L10.usopp, { stage: STAGE });
    playRaw(g, LEO);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    const d = need(g, 'choose', 'p1');
    if (d.purpose === 'cost') pickRaw(g, g.zone('p1', 'stage')[0]!.instance);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([D1]);
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });
});
