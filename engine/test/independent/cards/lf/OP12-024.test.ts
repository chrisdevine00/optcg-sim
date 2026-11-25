/**
 * OP12-024 Gyukimaru (Character, Green, cost 4, 5000, Counter +1000, Slash, {Animal}/{Land of Wano}).
 *
 * Card text: "If this Character is active, this Character cannot be K.O.'d by your opponent's effects.
 * [When Attacking] If you have a total of 3 or more given DON!! cards, rest up to 1 of your
 * opponent's Characters with a base cost of 6 or less."
 *
 * Rules: the protection is valid only while Gyukimaru is active (CR 8-2-1-2) and only against K.O.
 * by effects (RL-14); "a total of 3 or more given DON!! cards" adds the DON!! given to my Leader and
 * Characters; the opponent's given DON!! are not mine; "base cost" is the printed cost (CR 4-9-2);
 * "up to 1" may choose nobody; a colon-less "If" is an effect condition (DECISIONS 2026-11-24).
 * Scenery: OP01-018 Hajrudin (cost 4), OP02-006 Kingdew (5), OP02-007 Thatch (6), OP02-020
 * LittleOars Jr. (7), OP01-023 Marco; EB01-059 Kingdom Come; ST01-001 Luffy as Leader.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  isRested,
  KINGDOM_COME,
  kind,
  LD_LF,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  opponentKingdomCome,
  pickInst,
  theirs,
  trash,
  VAN_LF,
} from './kit-lfa.ts';

const GYU = 'OP12-024';
const { hajrudin, kingdew, thatch, marco, mohji } = VAN_LF;
const OARS = 'OP02-020'; // LittleOars Jr.: Red, cost 7, 9000.
type Ch = string | { card: string; rested?: boolean; don?: number };

/** p1's turn: Gyukimaru has `gyuDon`, the Leader `leaderDon`, an extra Marco `marcoDon`; p2 has `theirs`. */
function swing(o: { gyuDon?: number; leaderDon?: number; marcoDon?: number; theirs?: Ch[] }) {
  const gyu = o.gyuDon ?? 0;
  const ld = o.leaderDon ?? 0;
  const mc = o.marcoDon ?? 0;
  const g = mine(
    ld ? { card: LD_LF.luffy, don: ld } : LD_LF.luffy,
    {
      characters: [{ card: GYU, don: gyu }, ...(mc ? [{ card: marco, don: mc }] : [])],
      costArea: { active: 10 - gyu - ld - mc, rested: 0 },
    },
    { characters: o.theirs ?? [hajrudin, kingdew, thatch, OARS] },
  );
  attack(g, at(g, 'p1', 'characters', GYU), g.leader('p2'));
  return g;
}

describe('OP12-024 Gyukimaru', () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = mine(LD_LF.luffy, { characters: [GYU] });
    const c = at(g, 'p1', 'characters', GYU);
    expect(g.card(c).cost).toBe(4);
    expect(g.power(c)).toBe(5000);
    expect(g.card(c).counter).toBe(1000);
  });

  it("active: an opponent's K.O. effect does not K.O. him", () => {
    const g = theirs(
      LD_LF.luffy,
      { characters: [GYU] },
      { hand: [KINGDOM_COME], life: [mohji, mohji, mohji, mohji] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', GYU));
    expect(chars(g)).toEqual([GYU]);
    expect(trash(g)).toEqual([]);
  });

  it('rested: the same K.O. effect K.O.s him', () => {
    const g = theirs(
      LD_LF.luffy,
      { characters: [{ card: GYU, rested: true }] },
      { hand: [KINGDOM_COME], life: [mohji, mohji, mohji, mohji] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', GYU));
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([GYU]);
  });

  it('only effects are stopped: a rested Gyukimaru also loses a battle', () => {
    const g = theirs(
      LD_LF.luffy,
      { characters: [{ card: GYU, rested: true }] },
      { characters: [thatch] },
    );
    attack(g, at(g, 'p2', 'characters', thatch), at(g, 'p1', 'characters', GYU));
    noDefence(g);
    expect(trash(g)).toEqual([GYU]);
  });

  it('[When Attacking] with 3 given DON!! on him: offers the opposing Characters with base cost 6 or less (7 is not offered)', () => {
    const g = swing({ gyuDon: 3 });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([hajrudin, kingdew, thatch].sort());
  });

  it('the chosen Character is rested', () => {
    const g = swing({ gyuDon: 3 });
    const t = at(g, 'p2', 'characters', kingdew);
    pickInst(g, [t]);
    expect(isRested(g, t)).toBe(true);
    expect(isRested(g, at(g, 'p2', 'characters', hajrudin))).toBe(false);
  });

  it('given DON!! are totalled over my Leader and Characters: 1 on him, 1 on the Leader, 1 on Marco', () => {
    const g = swing({ gyuDon: 1, leaderDon: 1, marcoDon: 1 });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([hajrudin, kingdew, thatch].sort());
  });

  it('boundary: a total of 2 given DON!! does not trigger it (no prompt)', () => {
    const g = swing({ gyuDon: 1, leaderDon: 1 });
    expect(kind(g)).not.toBe('choose');
    expect(isRested(g, at(g, 'p2', 'characters', hajrudin))).toBe(false);
  });

  it('a total above the bound (4) works too', () => {
    const g = swing({ gyuDon: 2, leaderDon: 2 });
    need(g, 'choose', 'p1');
  });

  it("the opponent's given DON!! are not mine: 2 of mine and 3 on their Character is not enough", () => {
    const g = swing({ gyuDon: 2, theirs: [{ card: hajrudin, don: 3 }] });
    expect(kind(g)).not.toBe('choose');
  });

  it('"up to 1": choosing nobody rests nobody', () => {
    const g = swing({ gyuDon: 3 });
    need(g, 'choose', 'p1');
    none(g);
    for (const c of [hajrudin, kingdew, thatch]) {
      expect(isRested(g, at(g, 'p2', 'characters', c))).toBe(false);
    }
  });
});
