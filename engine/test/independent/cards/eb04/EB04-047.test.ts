/**
 * EB04-047 Helmeppo (Character, Black, cost 3, 3000, Counter +2000, {Navy}/{SWORD}).
 *
 * Card text: "[Activate: Main] You may trash this Character: Play up to 1 {SWORD} type Character card
 * with a cost of 3 or less other than [Helmeppo] from your hand or trash."
 *
 * Rules: the cost is trashing this Character. "Other than [Helmeppo]" excludes every card with that
 * name. The card comes from the hand or the trash and is played without paying, active. "Up to 1"
 * may be none; the pick over the hidden hand is asked even if nothing matches.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chars,
  fill,
  hand,
  isRestedInst,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickRaw,
  trash,
  useAbility,
  yes,
  atMain,
  donCost,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-047';
/** OP11-004 Kujyaku: Red, cost 1, 0 power, {Navy}/{SWORD}. */
const KUJYAKU1 = 'OP11-004';
/** OP11-013 Prince Grus: Red, cost 1, 2000, {Navy}/{SWORD}. */
const GRUS1 = 'OP11-013';
/** EB03-008 Hibari: Red, cost 3, 5000, {Navy}/{SWORD}. */
const HIBARI3 = 'EB03-008';
/** EB03-041 Kujyaku: Black, cost 4, 6000, {Navy}/{SWORD}. */
const KUJYAKU4 = 'EB03-041';
/** OP02-097 Komille: Black, cost 1, 3000, {Navy}, not {SWORD}. */
const KOMILLE = 'OP02-097';

function board(hnd: string[], trashed: string[] = []): TestGame {
  return mine(LB.navy, { characters: [ID], hand: hnd, trash: trashed, deck: fill(BLUE, 10) });
}

function start(g: TestGame): void {
  useAbility(g, at(g, 'p1', 'characters', ID));
  if (kind(g) === 'optional') yes(g);
}

describe('EB04-047 Helmeppo: [Activate: Main] trash this: play a {SWORD} Character (cost 3 or less, not Helmeppo) from hand or trash', () => {
  it('offers {SWORD} Characters of cost 3 or less from the hand and the trash only', () => {
    const g = board([KUJYAKU1, KUJYAKU4, KOMILLE], [GRUS1]);
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([GRUS1, KUJYAKU1].sort());
  });

  it('trashes Helmeppo and plays the chosen card from hand, active and free', () => {
    // [Prince Grus] (no [On Play]) so the played card asks nothing of its own.
    const g = board([GRUS1, KOMILLE]);
    const before = donCost(g);
    start(g);
    pickRaw(g, g.find('p1', 'hand', GRUS1));
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([GRUS1]);
    expect(trash(g)).toEqual([ID]);
    expect(isRestedInst(g, at(g, 'p1', 'characters', GRUS1))).toBe(false);
    expect(hand(g)).toEqual([KOMILLE]);
    expect(donCost(g)).toEqual(before);
  });

  it('plays the chosen card from the trash', () => {
    const g = board([KOMILLE], [GRUS1]);
    start(g);
    pickRaw(g, g.find('p1', 'trash', GRUS1));
    expect(chars(g)).toEqual([GRUS1]);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: cost 3 is playable, cost 4 is not', () => {
    const g = board([HIBARI3, KUJYAKU4]);
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HIBARI3]);
  });

  it('another card named [Helmeppo] is not offered even though it is a {SWORD} of cost 3', () => {
    const g = board([ID, GRUS1], [ID]);
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([GRUS1]);
  });

  it('"up to 1": may play nothing; Helmeppo is still trashed', () => {
    const g = board([KUJYAKU1]);
    start(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([KUJYAKU1]);
  });

  it('with nothing qualifying the pick is still asked (the hand is hidden), with no candidates', () => {
    const g = board([KOMILLE, KUJYAKU4]);
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(atMain(g)).toBe(true);
  });

  it('declining the "you may" cost keeps Helmeppo on the field', () => {
    const g = board([KUJYAKU1]);
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'optional') {
      no(g);
      expect(chars(g)).toEqual([ID]);
      expect(hand(g)).toEqual([KUJYAKU1]);
    } else {
      none(g);
    }
  });

  it('plays at most one card', () => {
    const g = board([KUJYAKU1, GRUS1]);
    start(g);
    pickRaw(g, g.find('p1', 'hand', KUJYAKU1));
    expect(chars(g)).toHaveLength(1);
    expect(hand(g)).toEqual([GRUS1]);
  });
});
