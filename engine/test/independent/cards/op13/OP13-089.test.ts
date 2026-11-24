/**
 * OP13-089 St. Topman Warcury (Character, Black, cost 4, 5000, Counter +1000, {Celestial Dragons}/{Five Elders}).
 *
 * Card text: "If you have 7 or more cards in your trash, this Character cannot be removed from the
 * field by your opponent's effects and gains [Blocker]. [On K.O.] Draw 1 card."
 *
 * Rules: CR 8-1-3-3 (permanent effects), CR 10-2-1 (K.O. is an effect or a battle result), CR 10-2-17
 * ([On K.O.]), CR 4-5-3 (draw). Opposing removal comes from the earlier kits: OP09-077 (K.O. 6000 or
 * less), OP17-056 (return cost 6 or less), OP17-046 (bottom of the deck, cost 5 or less).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  BLUE,
  bounceAim,
  chars,
  deck,
  describeFiveEldersShield,
  hand,
  hitRested,
  koAim,
  LD13,
  need,
  pile,
  SC15,
  theirsWith,
  trash,
} from './kit-op13d.ts';

const ID = 'OP13-089';

describeFiveEldersShield({ id: ID, cost: 4 });

describe('OP13-089 St. Topman Warcury: [On K.O.] Draw 1 card', () => {
  const start = (trashN: number) =>
    theirsWith(
      LD13.black,
      { characters: [{ card: ID, rested: true }], trash: pile(trashN), hand: [SC15.red3] },
      {},
    );

  it('K.O.’d in battle: draws exactly 1 card without any question', () => {
    const g = start(0);
    const before = deck(g).length;
    hitRested(g, at(g, 'p1', 'characters', ID));
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC15.red3, BLUE].sort());
    expect(deck(g)).toHaveLength(before - 1);
    expect(trash(g)).toEqual([ID]);
  });

  it('K.O.’d by an opposing effect (6 cards in the trash): draws 1 card', () => {
    const g = start(6);
    koAim(g, at(g, 'p1', 'characters', ID));
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SC15.red3, BLUE].sort());
  });

  it('returned to the hand is not a K.O.: no draw', () => {
    const g = start(0);
    const before = deck(g).length;
    bounceAim(g, at(g, 'p1', 'characters', ID));
    expect(hand(g)).toEqual([SC15.red3, ID].sort());
    expect(deck(g)).toHaveLength(before);
  });

  it('with 7 cards in the trash a battle K.O. still draws (the shield is only against effects)', () => {
    const g = start(7);
    hitRested(g, at(g, 'p1', 'characters', ID));
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toHaveLength(2);
  });

  it('must not draw when it is not K.O.’d: protected at 7 cards, hand and deck are unchanged', () => {
    const g = start(7);
    const before = deck(g).length;
    koAim(g, at(g, 'p1', 'characters', ID));
    expect(hand(g)).toEqual([SC15.red3]);
    expect(deck(g)).toHaveLength(before);
    need(g, 'main', 'p2');
  });
});
