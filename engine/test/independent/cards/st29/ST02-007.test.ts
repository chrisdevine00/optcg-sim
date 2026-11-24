/**
 * ST02-007 Jewelry Bonney (Character, Green, cost 1, 1000, Counter +1000, {Bonney Pirates}/{Supernovas}).
 *
 * Card text: "[Activate: Main] (1) (You may rest the specified number of DON!! cards in your cost area.)
 * You may rest this Character: Look at 5 cards from the top of your deck; reveal up to 1 {Supernovas}
 * type card and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: the activation cost is 1 active DON!! rested plus resting THIS Character, so it needs an
 * active Bonney and 1 active DON!! (CR 8-3-1); a Character may use an [Activate: Main] the turn it is
 * played; only the top 5 are looked at; "up to 1" lets the player take nothing; only {Supernovas}
 * cards qualify; the rest go to the bottom.
 */
import { describe, expect, it } from 'vitest';
import {
  C29,
  deck,
  don,
  fill,
  hand,
  ids29,
  inst,
  isMain,
  L29,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  settleOrders,
  useAbility,
} from './kit-st29a.ts';

const ID = 'ST02-007';
const SN1 = C29.zoroSn; // OP02-043 Roronoa Zoro: {FILM}/{Straw Hat Crew}/{Supernovas}
const SN2 = 'OP01-039'; // Killer: {Kid Pirates}/{Supernovas}, Green cost 2

/** p1's Main Phase with Bonney (active unless told) and this deck (top first, padded with Mohji). */
function board(top: string[], o: { active?: number; rested?: boolean; fresh?: boolean } = {}) {
  return mine(L29.croc, {
    characters: [{ card: ID, rested: o.rested ?? false, playedThisTurn: o.fresh ?? false }],
    deck: [...top, ...fill(C29.c1, 15 - top.length)],
    costArea: { active: o.active ?? 3, rested: 0 },
  });
}

describe('ST02-007 Jewelry Bonney [Activate: Main] (1) rest this Character: look at 5, take up to 1 {Supernovas}', () => {
  it('printed values: cost 1, 1000 power, Counter +1000', () => {
    const g = board([]);
    const b = inst(g, 'p1', 'characters', ID);
    expect(g.card(b).cost).toBe(1);
    expect(g.power(b)).toBe(1000);
    expect(g.card(b).counter).toBe(1000);
  });

  it('paying rests 1 DON!! and Bonney herself, then offers only the {Supernovas} cards among the top 5', () => {
    const g = board([C29.c2, SN1, C29.red1, SN2, C29.c3, SN1]);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    expect(g.card(inst(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SN1, SN2].sort());
  });

  it('only the top 5 are looked at: a {Supernovas} card in 6th place is never offered', () => {
    const g = board([C29.c2, C29.c3, C29.c4, C29.c5, C29.red1, SN1]);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    if (!isMain(g, 'p1')) {
      expect(offeredIds(g)).toEqual([]);
      none(g);
      settleOrders(g);
    }
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SN1);
  });

  it('taking one adds exactly that card to my hand; the other 4 go to the bottom and the 6th card becomes the top', () => {
    const g = board([C29.c2, SN1, C29.red1, SN2, C29.c3, C29.c4]);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    pickInst(g, [inst(g, 'p1', 'deck', SN2)]);
    settleOrders(g);
    expect(hand(g)).toEqual([SN2]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(C29.c4);
    expect(deck(g).slice(-4).sort()).toEqual([C29.c2, SN1, C29.red1, C29.c3].sort());
  });

  it('"up to 1": taking nothing puts all 5 at the bottom', () => {
    const g = board([SN1, SN2, C29.c3, C29.c4, C29.c5, C29.c6]);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(C29.c6);
    expect(deck(g).slice(-5).sort()).toEqual([SN1, SN2, C29.c3, C29.c4, C29.c5].sort());
  });

  it('it needs 1 active DON!!: with none the ability cannot be used', () => {
    const g = board([SN1], { active: 0 });
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toEqual([]);
    expect(isMain(g, 'p1')).toBe(true);
  });

  it('it needs an ACTIVE Bonney: a rested one cannot pay "rest this Character"', () => {
    const g = board([SN1], { rested: true });
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('it can be used the turn she is played (no summoning sickness for an Activate: Main)', () => {
    const g = board([SN1], { fresh: true });
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toHaveLength(1);
  });

  it('after one use she is rested, so it cannot be used again this turn even with DON!! left', () => {
    const g = board([SN1, C29.c2], { active: 3 });
    useAbility(g, inst(g, 'p1', 'characters', ID));
    pickInst(g, [inst(g, 'p1', 'deck', SN1)]);
    settleOrders(g);
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toEqual([]);
    expect(ids29(g, 'p1', 'characters')).toEqual([ID]);
  });
});
