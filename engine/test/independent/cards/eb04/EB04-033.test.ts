/**
 * EB04-033 Groggy Monsters (Character, Purple, cost 5, 6000, Counter +1000, {Fish-Man}/{Giant}/{Foxy Pirates}).
 *
 * Card text: "[On Play] DON!! −1: If you have 3 or more {Foxy Pirates} type Characters, K.O. up to 1
 * of your opponent's Characters with 6000 base power or less."
 *
 * Rules: "DON!! −1" is a cost (return 1 DON!! from the field to the DON!! deck) the player may pay.
 * It is paid before the condition is checked. Groggy Monsters is itself a {Foxy Pirates} Character
 * on the field and counts. Only Characters count. "Base power" ignores effects.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chars,
  donTotal,
  fill,
  hand,
  LB,
  mine,
  need,
  none,
  offeredIds,
  payDonAny,
  pickRaw,
  playRaw,
  trash,
  yes,
  no,
  atMain,
  kind,
  donDeckN,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-033';
/** EB02-034 Komei: Purple, cost 4, 6000, {Navy}/{Foxy Pirates}. Vanilla. */
const KOMEI = 'EB02-034';
/** OP07-066 Tony Tony.Chopper: Purple, cost 2, power 0, {Animal}/{Foxy Pirates}. [Blocker]. */
const CHOPPER = 'OP07-066';
/** OP02-077 Solitaire: Purple, cost 3, 5000, vanilla, not a Foxy Pirate. */
const SOLITAIRE = 'OP02-077';
const SAI = 'OP01-012'; // Red, 4000
const HAJ = 'OP01-018'; // Red, 6000
const KINGDEW = 'OP02-006'; // Red, 7000

/** p1 (Foxy Pirates Leader) plays Groggy Monsters with `mates` already on the field. */
function play(mates: string[], foes: string[], cost = { active: 10, rested: 0 }): TestGame {
  const g = mine(
    LB.foxy,
    { hand: [ID], characters: mates, costArea: cost, deck: fill(SOLITAIRE, 10) },
    { characters: foes },
  );
  playRaw(g, ID);
  return g;
}

describe('EB04-033 Groggy Monsters: [On Play] DON!! -1: with 3+ {Foxy Pirates} Characters, K.O. up to 1 (6000 base or less)', () => {
  it('with itself and two other Foxy Pirates it K.O.s the chosen Character after paying DON!! -1', () => {
    const g = play([KOMEI, CHOPPER], [HAJ, KINGDEW]);
    const before = donTotal(g);
    yes(g);
    payDonAny(g, 1);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', HAJ));
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([KINGDEW]);
    expect(trash(g, 'p2')).toEqual([HAJ]);
    expect(donTotal(g)).toBe(before - 1);
  });

  it('boundary: a 6000-power Character is offered, a 7000 one is not', () => {
    const g = play([KOMEI, CHOPPER], [HAJ, KINGDEW, SAI]);
    yes(g);
    payDonAny(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, SAI].sort());
  });

  it('with only two Foxy Pirates (itself and one other) nobody is K.O.d', () => {
    const g = play([KOMEI], [SAI]);
    if (kind(g) === 'optional') {
      yes(g);
      payDonAny(g, 1);
    }
    if (kind(g) === 'choose') none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([SAI]);
  });

  it('a Character that is not a {Foxy Pirates} does not count towards the three', () => {
    const g = play([KOMEI, SOLITAIRE], [SAI]);
    if (kind(g) === 'optional') {
      yes(g);
      payDonAny(g, 1);
    }
    if (kind(g) === 'choose') none(g);
    expect(chars(g, 'p2')).toEqual([SAI]);
  });

  it("the opponent's {Foxy Pirates} Characters do not count", () => {
    const g = play([KOMEI], [KOMEI, CHOPPER]);
    if (kind(g) === 'optional') {
      yes(g);
      payDonAny(g, 1);
    }
    if (kind(g) === 'choose') none(g);
    expect(chars(g, 'p2')).toEqual([CHOPPER, KOMEI].sort());
  });

  it('"up to 1": may K.O. nobody', () => {
    const g = play([KOMEI, CHOPPER], [HAJ]);
    yes(g);
    payDonAny(g, 1);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([HAJ]);
  });

  it('declining the DON!! -1 cost: no K.O. and no DON!! returned', () => {
    const g = play([KOMEI, CHOPPER], [HAJ]);
    const before = donTotal(g);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([HAJ]);
    expect(donTotal(g)).toBe(before);
  });

  it('rested DON!! can pay the cost when every DON!! on the field is rested', () => {
    const g = play([KOMEI, CHOPPER], [HAJ], { active: 5, rested: 0 });
    expect(donTotal(g)).toBe(5);
    yes(g);
    payDonAny(g, 1);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', HAJ));
    expect(chars(g, 'p2')).toEqual([]);
    expect(donTotal(g)).toBe(4);
  });

  it('the cost returns the DON!! to the DON!! deck', () => {
    const g = play([KOMEI, CHOPPER], [HAJ]);
    const deckBefore = donDeckN(g);
    yes(g);
    payDonAny(g, 1);
    need(g, 'choose', 'p1');
    none(g);
    expect(donDeckN(g)).toBe(deckBefore + 1);
  });

  it('the played Character stays on the field and nothing in hand changes', () => {
    const g = play([KOMEI, CHOPPER], [HAJ]);
    yes(g);
    payDonAny(g, 1);
    none(g);
    expect(chars(g)).toEqual([CHOPPER, ID, KOMEI].sort());
    expect(hand(g)).toEqual([]);
    expect(at(g, 'p1', 'characters', ID)).toBeTruthy();
  });
});
