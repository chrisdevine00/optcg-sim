/**
 * OP16-033 Morley (Character, Green, cost 4, 5000, Counter +1000, {Giant}/{Revolutionary Army},
 * Special, [Unblockable]).
 *
 * Card text: "If this Character would be K.O.'d, you may rest 2 of your cards instead.
 * [Unblockable] (This card cannot be blocked.)"
 *
 * Rules: CR 8-1-3-4 (replacement effects, optional with "may"; an impossible replacement cannot be
 * applied, RL-31), "cards" includes the Leader, Characters, Stage and DON!! (E-Q3 / M4b-1), only
 * ACTIVE cards can be rested, CR 10-1-6 ([Unblockable]). Scenery: OP09-077 Gum-Gum Lightning (the
 * opponent's K.O. effect, up to 1 Character with 6000 power or less).
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  at,
  attack,
  BLUE,
  blockers,
  charIds,
  choices,
  decider,
  decision,
  decline,
  don,
  donChoices,
  fill,
  kind,
  kw,
  mine,
  need,
  noDefence,
  OL,
  OV,
  offered,
  offeredIds,
  opponentKOs,
  payRest,
  RED,
  restedChar,
  SC2,
  side,
  theirs,
  theirTurn,
  trash,
  unusable,
  atMain,
} from './kit-op16a.ts';

const MORLEY = 'OP16-033';
const FRANKY_BLK = 'OP09-072'; // [Blocker], cost 4, 5000

/**
 * p2's turn: p2's 8000 Thatch attacks my rested Morley (5000), who would be K.O.'d. I have the cards
 * in `mine_`: Characters `chars` (active unless placed rested), `active` DON!! and the Leader.
 */
function koMorley(
  o: {
    chars?: (string | { card: string; rested?: boolean })[];
    leaderRested?: boolean;
    active?: number;
    rested?: number;
  } = {},
) {
  const g = theirTurn(
    side(OL.kid, BLUE, {
      leader: o.leaderRested ? { card: OL.kid, rested: true } : OL.kid,
      characters: [{ card: MORLEY, rested: true }, ...(o.chars ?? [])],
      costArea: { active: o.active ?? 0, rested: o.rested ?? 0 },
      life: fill(BLUE, 4),
    }),
    side(OL.luffy, RED, { characters: [OV.thatch] }),
  );
  attack(g, at(g, 'p2', 'characters', OV.thatch), at(g, 'p1', 'characters', MORLEY));
  noDefence(g);
  return g;
}

describe('OP16-033 Morley: [Unblockable]', () => {
  it('has [Unblockable] and cannot be blocked', () => {
    const g = mine(OL.kid, { characters: [MORLEY] }, { characters: [FRANKY_BLK] });
    expect(kw(g, at(g, 'p1', 'characters', MORLEY))).toContain('Unblockable');
    attack(g, at(g, 'p1', 'characters', MORLEY), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });
});

describe("OP16-033 Morley: replacement, rest 2 of my cards instead of being K.O.'d", () => {
  it("is offered to me when Morley would be K.O.'d in battle", () => {
    const g = koMorley({ active: 2 });
    expect(decider(g)).toBe('p1');
    expect(kind(g)).toBe('optional');
    expect(decision(g)?.purpose).toBe('replacement');
  });

  it("accepting: 2 of my cards are rested (here 2 DON!!) and Morley is not K.O.'d", () => {
    const g = koMorley({ active: 2 });
    accept(g);
    payRest(g, [], 2);
    expect(charIds(g, 'p1')).toEqual([MORLEY]);
    expect(trash(g)).toEqual([]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
    expect(g.eventsOfType('KO')).toHaveLength(0);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it("declining: Morley is K.O.'d and nothing is rested", () => {
    const g = koMorley({ active: 2 });
    decline(g);
    expect(charIds(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([MORLEY]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
  });

  it('the 2 cards may be any active Leader / Character / DON!!: the pick offers my active Leader, Character and a DON!! class', () => {
    const g = koMorley({ chars: [OV.sai4], active: 3 });
    accept(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(offeredIds(g)).toContain(OV.sai4);
    expect(donChoices(g)).toEqual([{ from: 'costActive' }]);
  });

  it('resting my active Leader and an active Character pays the cost', () => {
    const g = koMorley({ chars: [OV.sai4], active: 0 });
    accept(g);
    payRest(g, [g.leader('p1'), at(g, 'p1', 'characters', OV.sai4)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(restedChar(g, 'p1', OV.sai4)).toBe(true);
    expect(charIds(g, 'p1').sort()).toEqual([MORLEY, OV.sai4].sort());
  });

  it('only ACTIVE cards can be rested: rested DON!!, a rested Leader and rested Characters are not offered', () => {
    const g = koMorley({
      chars: [{ card: OV.sai4, rested: true }, OV.dadan2],
      leaderRested: true,
      active: 2,
      rested: 3,
    });
    accept(g);
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([OV.dadan2]);
    expect(donChoices(g)).toEqual([{ from: 'costActive' }]);
  });

  it("boundary: with only 1 active card in all (no replacement is possible) Morley is K.O.'d", () => {
    const g = koMorley({
      leaderRested: true,
      chars: [{ card: OV.sai4, rested: true }],
      active: 1,
      rested: 4,
    });
    expect(offered(g, 'p1')).toBe(false);
    unusable(g, 'p1');
    expect(charIds(g, 'p1').sort()).toEqual([OV.sai4]);
    expect(trash(g)).toEqual([MORLEY]);
  });

  it('boundary: exactly 2 active cards in all is enough (1 Character and 1 DON!!)', () => {
    const g = koMorley({
      leaderRested: true,
      chars: [OV.dadan2],
      active: 1,
      rested: 0,
    });
    accept(g);
    payRest(g, [at(g, 'p1', 'characters', OV.dadan2)], 1);
    expect(charIds(g, 'p1').sort()).toEqual([MORLEY, OV.dadan2].sort());
    expect(restedChar(g, 'p1', OV.dadan2)).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
  });

  it('it also replaces a K.O. by an opposing effect', () => {
    const g = theirs(
      OL.kid,
      { characters: [MORLEY], costArea: { active: 2, rested: 0 } },
      { hand: [SC2.lightning], characters: [OV.kingdew5] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', MORLEY));
    expect(decision(g)?.purpose).toBe('replacement');
    accept(g);
    expect(charIds(g, 'p1')).toEqual([MORLEY]);
  });

  it("must not: another of my Characters being K.O.'d is not replaced by Morley's effect", () => {
    const g = theirTurn(
      side(OL.kid, BLUE, {
        characters: [MORLEY, { card: OV.sai4, rested: true }],
        costArea: { active: 2, rested: 0 },
      }),
      side(OL.luffy, RED, { characters: [OV.thatch] }),
    );
    attack(g, at(g, 'p2', 'characters', OV.thatch), at(g, 'p1', 'characters', OV.sai4));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(trash(g)).toEqual([OV.sai4]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
  });
});
