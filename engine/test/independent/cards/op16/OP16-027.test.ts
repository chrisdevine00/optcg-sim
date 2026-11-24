/**
 * OP16-027 Jinbe (Character, Green, cost 2, 2000, Counter +2000, {Fish-Man}/{The Sun Pirates}/{Impel
 * Down}, Strike).
 *
 * Card text: "[DON!! X1] This Character gains +2000 power."
 *
 * Rules: CR 8-3-2-3 ([DON!! xX] is a state check, X or more DON!! given, either turn, RL-13), CR
 * 6-5-5-2 (each given DON!! adds +1000 only during its owner's turn), CR 7-1-4 (an attacker wins a
 * battle when its power is equal or greater).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  BLUE,
  charIds,
  mine,
  noDefence,
  OL,
  OV,
  pw,
  RED,
  side,
  theirTurn,
  theirs,
  trash,
} from './kit-op16a.ts';

const JINBE = 'OP16-027';

describe('OP16-027 Jinbe: [DON!! x1] +2000 power', () => {
  it('without a given DON!! it is a plain 2000', () => {
    const g = mine(OL.luffy, { characters: [JINBE] });
    expect(pw(g, 'p1', JINBE)).toBe(2000);
  });

  it('with 1 given DON!! on my turn: 2000 + 1000 (the DON!!) + 2000 = 5000', () => {
    const g = mine(OL.luffy, {
      characters: [{ card: JINBE, don: 1 }],
      costArea: { active: 9, rested: 0 },
    });
    expect(pw(g, 'p1', JINBE)).toBe(5000);
  });

  it("with 1 given DON!! on the opponent's turn: the DON!! adds nothing but the effect still applies: 4000", () => {
    const g = theirs(OL.luffy, {
      characters: [{ card: JINBE, don: 1 }],
      costArea: { active: 9, rested: 0 },
    });
    expect(pw(g, 'p1', JINBE)).toBe(4000);
  });

  it('"x1" is a threshold, not per DON!!: 2 given DON!! on my turn is 2000 + 2000 + 2000 = 6000', () => {
    const g = mine(OL.luffy, {
      characters: [{ card: JINBE, don: 2 }],
      costArea: { active: 8, rested: 0 },
    });
    expect(pw(g, 'p1', JINBE)).toBe(6000);
  });

  it("2 given DON!! on the opponent's turn: 4000 (a single +2000)", () => {
    const g = theirs(OL.luffy, {
      characters: [{ card: JINBE, don: 2 }],
      costArea: { active: 8, rested: 0 },
    });
    expect(pw(g, 'p1', JINBE)).toBe(4000);
  });

  it('giving a DON!! during the Main Phase switches the bonus on at once', () => {
    const g = mine(OL.luffy, { characters: [JINBE] });
    expect(pw(g, 'p1', JINBE)).toBe(2000);
    act(g, { type: 'giveDon', target: at(g, 'p1', 'characters', JINBE) });
    expect(pw(g, 'p1', JINBE)).toBe(5000);
  });

  it('only this Character gains it: another Character with a DON!! does not, and a second Jinbe without DON!! does not', () => {
    const g = mine(OL.luffy, {
      characters: [{ card: JINBE, don: 1 }, JINBE, { card: OV.sai4, don: 1 }],
      costArea: { active: 8, rested: 0 },
    });
    expect(pw(g, 'p1', JINBE, 0)).toBe(5000);
    expect(pw(g, 'p1', JINBE, 1)).toBe(2000);
    expect(pw(g, 'p1', OV.sai4)).toBe(5000);
  });

  it("on the opponent's turn the bonus decides a battle: a 3000 attacker cannot K.O. a rested Jinbe with a given DON!! (4000)", () => {
    const g = theirTurn(
      side(OL.luffy, BLUE, { characters: [{ card: JINBE, don: 1, rested: true }] }),
      side(OL.luffy, RED, { characters: [OV.komachiyo3] }),
    );
    attack(g, at(g, 'p2', 'characters', OV.komachiyo3), at(g, 'p1', 'characters', JINBE));
    noDefence(g);
    expect(charIds(g, 'p1')).toEqual([JINBE]);
  });

  it('the same attack K.O.s a rested Jinbe without a given DON!! (2000 < 3000)', () => {
    const g = theirTurn(
      side(OL.luffy, BLUE, { characters: [{ card: JINBE, rested: true }] }),
      side(OL.luffy, RED, { characters: [OV.komachiyo3] }),
    );
    attack(g, at(g, 'p2', 'characters', OV.komachiyo3), at(g, 'p1', 'characters', JINBE));
    noDefence(g);
    expect(charIds(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([JINBE]);
  });
});
