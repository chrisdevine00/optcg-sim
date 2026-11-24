/**
 * OP16-034 Monkey.D.Luffy (Character, Green, cost 1, 0, Counter +1000, {Straw Hat Crew}/{Impel Down},
 * Strike).
 *
 * Card text: "[DON!! x1] [Your Turn] This Character gains +1000 power for each of your Characters with a
 * different card name.
 * [On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Impel Down} type card and add
 * it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-3-2-3 ([DON!! xX] is a state check), [Your Turn] is the controller's turn only, CR 8-4-4
 * ("look at", "up to"), CR 11-2-1 (reveal). M6b-Q9 (whether Luffy counts itself, and how two
 * Characters with the same other name count) has no answer on file, so the power tests assert only
 * DIFFERENCES that both readings agree on: one more differently named Character is +1000, two more
 * are +2000, a same-named copy and the opponent's Characters add nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  BLUE,
  choose,
  deck,
  fill,
  hand,
  mayChooseNone,
  mine,
  need,
  none,
  OL,
  OV,
  offeredIds,
  playCard,
  pw,
  reachablePickSets,
  revealedByEffects,
  settleOrders,
  tail,
  theirs,
} from './kit-op16a.ts';

const LUFFY = 'OP16-034';
const SALDEATH = 'OP11-064'; // {Impel Down}, vanilla
const BLUGORI = 'OP02-084'; // {Animal}/{Impel Down}, vanilla
const MISS = OV.thatch; // no Impel Down type
const BEYOND = BLUGORI;
const REST = [BEYOND, ...fill(BLUE, 8)];

function start(top: string[]) {
  const g = mine(OL.impel, { hand: [LUFFY], deck: [...top, ...REST] });
  playCard(g, LUFFY);
  return g;
}

describe('OP16-034 Monkey.D.Luffy: [On Play] look at 3, reveal up to 1 {Impel Down}', () => {
  it('offers exactly the {Impel Down} cards among the top 3', () => {
    const g = start([SALDEATH, MISS, BLUGORI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BLUGORI, SALDEATH].sort());
  });

  it('the chosen card is revealed and added to hand, the other two go to the bottom', () => {
    const g = start([SALDEATH, MISS, BLUGORI]);
    choose(g, [g.zone('p1', 'deck').find((c) => c.card === SALDEATH)!.instance]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(revealedByEffects(g)).toEqual([SALDEATH]);
    expect(hand(g)).toEqual([SALDEATH]);
    expect(deck(g)).toHaveLength(3 + REST.length - 1);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 2)).toEqual([MISS, BLUGORI].sort());
  });

  it('"up to 1": may add nothing; all 3 go to the bottom', () => {
    const g = start([SALDEATH, MISS, BLUGORI]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 3)).toEqual([SALDEATH, MISS, BLUGORI].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const sets = reachablePickSets(start([SALDEATH, MISS, BLUGORI]));
    expect(sets.has('')).toBe(true);
    expect(sets.has(SALDEATH)).toBe(true);
    expect(sets.has(BLUGORI)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 3 are looked at: an {Impel Down} card in 4th position is not offered', () => {
    const g = start([MISS, MISS, MISS]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BEYOND);
  });

  it('with no {Impel Down} card looked at, all 3 still go to the bottom and nothing is added', () => {
    const g = start([MISS, MISS, MISS]);
    none(g);
    settleOrders(g);
    expect(tail(deck(g), 3)).toEqual([MISS, MISS, MISS]);
  });
});

describe('OP16-034 Monkey.D.Luffy: [DON!! x1] [Your Turn] +1000 per differently named Character', () => {
  const OTHER_A = OV.sai4; // Sai
  const OTHER_B = OV.hajrudin6; // Hajrudin
  /** Luffy's power on p1's turn with `don` DON!! given and `chars` as the other Characters. */
  const power = (don: number, chars: string[], p2chars: string[] = []) => {
    const g = mine(
      OL.impel,
      {
        characters: [{ card: LUFFY, don }, ...chars],
        costArea: { active: 10 - don, rested: 0 },
      },
      { characters: p2chars },
    );
    return pw(g, 'p1', LUFFY);
  };

  it('without a given DON!! the bonus is off, whatever other Characters I have (power stays 0)', () => {
    expect(power(0, [])).toBe(0);
    expect(power(0, [OTHER_A, OTHER_B])).toBe(0);
  });

  it('with 1 given DON!! one more differently named Character is +1000', () => {
    expect(power(1, [OTHER_A])! - power(1, [])!).toBe(1000);
  });

  it('two more differently named Characters are +2000', () => {
    expect(power(1, [OTHER_A, OTHER_B])! - power(1, [])!).toBe(2000);
  });

  it('a second copy of [Monkey.D.Luffy] (same name) adds nothing', () => {
    expect(power(1, [LUFFY])! - power(1, [])!).toBe(0);
  });

  it("only my Characters count: the opponent's Characters add nothing", () => {
    expect(power(1, [], [OTHER_A, OTHER_B])! - power(1, [])!).toBe(0);
  });

  it("[Your Turn]: on the opponent's turn the bonus is off even with a given DON!!", () => {
    const g = theirs(OL.impel, {
      characters: [{ card: LUFFY, don: 1 }, OTHER_A, OTHER_B],
      costArea: { active: 9, rested: 0 },
    });
    expect(pw(g, 'p1', LUFFY)).toBe(0);
  });

  it('a Character in my hand or trash does not count', () => {
    const g = mine(OL.impel, {
      characters: [{ card: LUFFY, don: 1 }],
      hand: [OTHER_A],
      trash: [OTHER_B],
      costArea: { active: 9, rested: 0 },
    });
    expect(pw(g, 'p1', LUFFY)).toBe(power(1, []));
  });

  it("the bonus is Luffy's own: my other Characters do not gain power", () => {
    const g = mine(OL.impel, {
      characters: [{ card: LUFFY, don: 1 }, OTHER_A],
      costArea: { active: 9, rested: 0 },
    });
    expect(g.power(at(g, 'p1', 'characters', OTHER_A))).toBe(4000);
  });
});
