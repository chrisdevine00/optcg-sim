/**
 * EB05-023 Osome (Character, Blue, cost 1, 0, Counter +2000, {Land of Wano}, Wisdom).
 *
 * Card text: "[On Play] You may trash 2 Events from your hand: Draw 3 cards."
 *
 * Rules: CR 8-3-1-3/-4 (costs: optional, all-or-nothing), CR 10-2-14 (Trash), CR 4-5-3 (draw X).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  accept,
  BLUE,
  choose,
  decline,
  deck,
  EC,
  EL,
  EV,
  hand,
  inHand,
  mine,
  offered,
  payWith,
  playCard,
  reachablePickSets,
  settleYes,
  skipUnusable,
  trash,
  VAN,
} from './kit-eb05a.ts';

const OSOME = 'EB05-023';

function played(inHandCards: string[]) {
  const g = mine(EL.croc, { hand: [OSOME, ...inHandCards], deck: fill(BLUE, 12) });
  playCard(g, OSOME);
  return g;
}

describe('EB05-023 Osome: [On Play] you may trash 2 Events from hand: draw 3', () => {
  it('trashing 2 Events draws 3 cards', () => {
    const g = played([EV.redA, EV.redB]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [inHand(g, EV.redA), inHand(g, EV.redB)]);
    settleYes(g, 'p1');
    expect(trash(g)).toEqual([EV.redA, EV.redB].sort());
    expect(hand(g)).toEqual([BLUE, BLUE, BLUE]);
    expect(deck(g)).toHaveLength(9);
  });

  it('draws exactly 3', () => {
    const g = played([EV.redA, EV.redB]);
    accept(g);
    payWith(g, [inHand(g, EV.redA), inHand(g, EV.redB)]);
    settleYes(g, 'p1');
    expect(hand(g)).toHaveLength(3);
  });

  it('CR 8-3-1-4: declining the cost trashes nothing and draws nothing; Osome is still played', () => {
    const g = played([EV.redA, EV.redB]);
    decline(g);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([EV.redA, EV.redB].sort());
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([OSOME]);
  });

  it('CR 8-3-1-3: with only 1 Event in hand the cost cannot be paid: nothing is trashed or drawn', () => {
    const g = played([EV.redA, VAN.mohji]);
    skipUnusable(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
  });

  it('only Events can be trashed for the cost (Characters are not offered)', () => {
    const g = played([EV.redA, EV.redB, EC.mocha, VAN.mohji]);
    accept(g);
    const cards = new Set([...reachablePickSets(g)].flatMap((s) => s.split('+')).filter(Boolean));
    expect([...cards].sort()).toEqual([EV.redA, EV.redB].sort());
  });

  it('with 3 Events in hand exactly 2 are trashed (the player picks), the third stays', () => {
    const g = played([EV.redA, EV.redB, EV.redC]);
    accept(g);
    choose(g, [inHand(g, EV.redA), inHand(g, EV.redC)]);
    settleYes(g, 'p1');
    expect(trash(g)).toEqual([EV.redA, EV.redC].sort());
    expect(hand(g)).toContain(EV.redB);
    expect(hand(g)).toHaveLength(4);
  });

  it('a differently coloured Event counts as an Event for the cost', () => {
    const g = played([EV.redA, EV.yellow]);
    accept(g);
    payWith(g, [inHand(g, EV.redA), inHand(g, EV.yellow)]);
    settleYes(g, 'p1');
    expect(trash(g)).toEqual([EV.redA, EV.yellow].sort());
    expect(hand(g)).toHaveLength(3);
  });

  it('with no Event in hand the effect is simply not used', () => {
    const g = played([VAN.mohji]);
    skipUnusable(g, 'p1');
    expect(deck(g)).toHaveLength(12);
    expect(trash(g)).toEqual([]);
  });
});
