/**
 * OP15-080 Oars (Character, Black, cost 4, 0 power, Counter +1000, {Giant}/{Thriller Bark Pirates}).
 *
 * Card text: "If you have [Gecko Moria] with 10000 power or more on your field and there are no other [Oars]
 * cards, this Character gains +7000 power.
 * [On K.O.] You may place 3 cards from your trash at the bottom of your deck in any order: Play this
 * Character card from your trash."
 *
 * Rules: CR 8-3-3 (condition, checked continuously), CR 6-5-5-2 (given DON!! add +1000 on my turn only), CR
 * 10-2-17 / RD 110 ([On K.O.] resolves after the card is in the trash), CR 8-3-1-3 / 8-3-1-4 (a "may" cost,
 * unpayable costs), CR 3-1-7 (the owner orders cards placed together), CR 3-7 (playing from the trash).
 * Not tested: another [Oars] on the opponent's field, since "no other [Oars] cards" does not say whose.
 * Scenery: OP02-054 Gecko Moria (Blue, cost 4, 6000, vanilla) as the [Gecko Moria].
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  accept,
  at,
  atMain,
  BLUE,
  deck,
  inst,
  kind,
  LD15,
  mine,
  mustBeUnpayable,
  need,
  no,
  offered,
  outcomes,
  payHand,
  RED,
  SC15,
  SCN,
  settleOrders,
  side,
  tail,
  theirTurn,
  trash,
  yes,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const OARS = 'OP15-080';
const MORIA = SC15.moria;

function withMoria(moriaDon: number, extra: (string | { card: string })[] = []): TestGame {
  return mine(LD15.moria, {
    characters: [OARS, { card: MORIA, don: moriaDon }, ...extra],
    costArea: { active: 10 - moriaDon, rested: 0 },
  });
}
const oars = (g: TestGame, n = 0) => at(g, 'p1', 'characters', OARS, n);

/** p2 K.O.s p1's rested Oars (0 power) with a 3000 Character; p1's trash holds `trashCards`. */
function koed(trashCards: string[]): TestGame {
  const g = theirTurn(
    side(LD15.moria, BLUE, {
      characters: [{ card: OARS, rested: true }],
      trash: trashCards,
      deck: Array.from({ length: 8 }, () => SCN.c1),
    }),
    side(LD15.neutral, RED, { characters: [SCN.c1] }),
  );
  attack(g, inst(g, 'p2', 'characters', SCN.c1), inst(g, 'p1', 'characters', OARS));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('OP15-080 Oars: +7000 with a 10000+ [Gecko Moria] and no other [Oars]; [On K.O.] place 3 trash cards at the deck bottom: play it from trash', () => {
  it('[Gecko Moria] with exactly 10000 power (6000 + 4 DON!!): Oars gains +7000', () => {
    const g = withMoria(4);
    expect(g.power(at(g, 'p1', 'characters', MORIA))).toBe(10000);
    expect(g.power(oars(g))).toBe(7000);
  });

  it('[Gecko Moria] with 9000 power (boundary): no bonus, Oars has 0', () => {
    const g = withMoria(3);
    expect(g.power(at(g, 'p1', 'characters', MORIA))).toBe(9000);
    expect(g.power(oars(g))).toBe(0);
  });

  it('with more than 10000 power the bonus is still +7000', () => {
    const g = withMoria(5);
    expect(g.power(oars(g))).toBe(7000);
  });

  it('without a [Gecko Moria] Oars has 0 power', () => {
    const g = mine(LD15.moria, { characters: [OARS, SCN.c8] });
    expect(g.power(oars(g))).toBe(0);
  });

  it('another [Oars] on my field removes the bonus from both', () => {
    const g = withMoria(4, [OARS]);
    expect(g.power(oars(g, 0))).toBe(0);
    expect(g.power(oars(g, 1))).toBe(0);
  });

  it('the opponent’s [Gecko Moria] does not count, even with 10000 power', () => {
    const g = mine(LD15.moria, { characters: [OARS] }, { characters: [{ card: MORIA, don: 4 }] });
    expect(g.power(oars(g))).toBe(0);
  });

  it('[On K.O.]: place 3 trash cards at my deck bottom and Oars is played from the trash', () => {
    const g = koed([SCN.c2, SCN.c3, SCN.c4]);
    need(g, 'optional', 'p1');
    accept(g);
    payHand(g, [SCN.c2, SCN.c3, SCN.c4]);
    settleOrders(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([OARS]);
    expect(trash(g)).toEqual([]);
    const d = deck(g);
    expect(d).toHaveLength(11);
    expect(tail(d, 3)).toEqual([SCN.c2, SCN.c3, SCN.c4].sort());
    expect(g.card(oars(g)).rested).toBe(false);
  });

  it('"may": declining leaves Oars and the 3 cards in the trash', () => {
    const g = koed([SCN.c2, SCN.c3, SCN.c4]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([OARS, SCN.c2, SCN.c3, SCN.c4].sort());
    expect(deck(g)).toHaveLength(8);
  });

  it('CR 8-3-1-3: with fewer than 3 cards in the trash the cost cannot be paid and Oars stays in the trash', () => {
    const g = koed([SCN.c2]);
    if (kind(g) === 'optional') mustBeUnpayable(g, 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([OARS, SCN.c2].sort());
  });

  it('exactly 3 cards are placed, not more, when the trash holds more', () => {
    const g = koed([SCN.c2, SCN.c3, SCN.c4, SCN.c5, SCN.c6]);
    need(g, 'optional', 'p1');
    accept(g);
    payHand(g, [SCN.c2, SCN.c3, SCN.c4]);
    settleOrders(g, 'p1');
    expect(trash(g)).toEqual([SCN.c5, SCN.c6].sort());
    expect(deck(g)).toHaveLength(11);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([OARS]);
  });

  it('"in any order": the owner can reach both orders of two of the placed cards', () => {
    const g = koed([SCN.c2, SCN.c3, SCN.c4]);
    need(g, 'optional', 'p1');
    accept(g);
    payHand(g, [SCN.c2, SCN.c3, SCN.c4]);
    const orders = outcomes(g, 'p1', (game) => deck(game).slice(-3).join('>'));
    expect(orders.has([SCN.c2, SCN.c3, SCN.c4].join('>'))).toBe(true);
    expect(orders.has([SCN.c4, SCN.c3, SCN.c2].join('>'))).toBe(true);
  });

  it('must not: Oars in the trash stays there until the cost is paid (no play without paying)', () => {
    const g = koed([SCN.c2, SCN.c3, SCN.c4]);
    need(g, 'optional', 'p1');
    expect(offered(g, 'p1')).toBe(true);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});

void yes;
