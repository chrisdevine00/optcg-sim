/**
 * OP15-091 Margarita (Character, Black, cost 1, 0 power, Counter +2000, {The Owner of Cindry's Shadow}).
 *
 * Card text: "[On Play] Place up to 1 card from your opponent's trash at the bottom of the owner's deck."
 *
 * Rules relied on: "up to" may choose nothing (CR 8-4-4-1), "bottom of the owner's deck", a card's
 * owner is the player who put it in their deck, own trash is not "your opponent's trash".
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  deck,
  hand,
  kind,
  LD15,
  mayChooseNone,
  mine,
  need,
  offeredIds,
  pickCards,
  playIt,
  reachablePickSets,
  RED,
  SC15,
  skipChoice,
  trash,
} from './kit-op15c.ts';

const MARG = 'OP15-091';
const OPP_TRASH = [SC15.red3, SC15.red4, SC15.red5];

function start(oppTrash: string[] = OPP_TRASH, myTrash: string[] = [SC15.shc1]) {
  const g = mine(LD15.neutral, { hand: [MARG], trash: myTrash }, { trash: oppTrash });
  playIt(g, MARG);
  return g;
}

describe('OP15-091 Margarita [On Play]', () => {
  it('offers only cards in the OPPONENT’s trash, not mine', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([...OPP_TRASH].sort());
  });

  it('places the chosen card at the BOTTOM of the opponent’s deck', () => {
    const g = start();
    pickCards(g, [SC15.red4]);
    expect(atMain(g)).toBe(true);
    const d = deck(g, 'p2');
    expect(d).toHaveLength(16);
    expect(d[d.length - 1]).toBe(SC15.red4);
    expect(d[0]).toBe(RED);
    expect(trash(g, 'p2')).toEqual([SC15.red3, SC15.red5].sort());
  });

  it('my own trash and deck are not touched', () => {
    const g = start();
    pickCards(g, [SC15.red3]);
    expect(trash(g)).toEqual([SC15.shc1]);
    expect(deck(g)).toHaveLength(15);
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": choosing nothing leaves both trashes and decks as they were', () => {
    const g = start();
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    expect(trash(g, 'p2')).toEqual([...OPP_TRASH].sort());
    expect(deck(g, 'p2')).toHaveLength(15);
    expect(atMain(g)).toBe(true);
  });

  it('places at most one card even when three are available', () => {
    const g = start();
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('with the opponent’s trash empty nothing happens and nothing hangs', () => {
    const g = start([]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      skipChoice(g);
    }
    expect(atMain(g)).toBe(true);
    expect(deck(g, 'p2')).toHaveLength(15);
    expect(trash(g)).toEqual([SC15.shc1]);
  });

  it('the opponent’s trash is the only source: a card only in my trash cannot be chosen', () => {
    const g = start([SC15.red3], [SC15.red7]);
    expect(offeredIds(g)).toEqual([SC15.red3]);
  });
});
