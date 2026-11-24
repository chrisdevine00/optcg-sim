/**
 * OP16-013 McGuy (Character, Red, cost 6, 8000, no Counter, {Whitebeard Pirates Allies}, Slash).
 *
 * Card text: "[On K.O.] K.O. Up to 1 of your opponent's Characters with 8000 base power or less."
 *
 * Rules: CR 10-2-17 ([On K.O.] when the card is K.O.'d, by battle or effect), "up to 1" (CR 8-4-4-1),
 * "base power" ignores DON!! and effects (CR 4-9-2); a Character can only be attacked while rested
 * (CR 7-1-1-2).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  charIds,
  choices,
  kind,
  mayChooseNone,
  need,
  noDefence,
  none,
  OL,
  OV,
  offeredIds,
  pickInst,
  passBlock,
  passCounter,
  side,
  theirTurn,
  trash,
  RED,
  BLUE,
  myTurn,
} from './kit-op16a.ts';

const MCGUY = 'OP16-013';

/**
 * p2's turn: p2's `attacker` (with `don` DON!! given, 8000 or more current power) attacks p1's rested
 * McGuy; p1 does not block or counter. `p1chars` are p1's other Characters; `p2chars` p2's others.
 */
function koMcGuy(
  o: { attacker?: string; don?: number; p1chars?: string[]; p2chars?: string[] } = {},
) {
  const don = o.don ?? 0;
  const attacker = o.attacker ?? OV.accino10;
  const g = theirTurn(
    side(OL.luffy, BLUE, { characters: [{ card: MCGUY, rested: true }, ...(o.p1chars ?? [])] }),
    side(OL.luffy, RED, {
      characters: [{ card: attacker, don }, ...(o.p2chars ?? [])],
      costArea: { active: 10 - don, rested: 0 },
    }),
  );
  attack(g, at(g, 'p2', 'characters', attacker), at(g, 'p1', 'characters', MCGUY));
  noDefence(g);
  return g;
}

describe('OP16-013 McGuy: [On K.O.] K.O. up to 1 opposing Character with 8000 base power or less', () => {
  it('is K.O.d by a stronger attacker and then asks p1 to choose (no "you may" question first)', () => {
    const g = koMcGuy({ p2chars: [OV.thatch] });
    expect(trash(g, 'p1')).toEqual([MCGUY]);
    need(g, 'choose', 'p1');
  });

  it("K.O.s the chosen Character, which goes to the opponent's trash", () => {
    const g = koMcGuy({ p2chars: [OV.thatch] });
    pickInst(g, [at(g, 'p2', 'characters', OV.thatch)]);
    expect(charIds(g, 'p2')).toEqual([OV.accino10]);
    expect(trash(g, 'p2')).toEqual([OV.thatch]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('boundary: base power 8000 is a candidate, 9000 and 10000 are not', () => {
    const g = koMcGuy({ p2chars: [OV.thatch, OV.oars9] });
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.thatch]);
  });

  it('"or less": 6000 and 4000 base power Characters are candidates', () => {
    const g = koMcGuy({ p2chars: [OV.hajrudin6, OV.sai4, OV.accino10] });
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.hajrudin6, OV.sai4].sort());
  });

  it('"base power": an 8000-base Character with 1 DON!! given (9000 now) is still a candidate', () => {
    // Thatch attacks with 1 DON!! (9000 on its owner's turn) and beats McGuy; it is also the target.
    const g = koMcGuy({ attacker: OV.thatch, don: 1, p2chars: [OV.oars9] });
    expect(trash(g, 'p1')).toEqual([MCGUY]);
    need(g, 'choose');
    expect(g.power(at(g, 'p2', 'characters', OV.thatch))).toBe(9000);
    expect(offeredIds(g)).toEqual([OV.thatch]);
  });

  it('K.O.s only one Character even when several qualify', () => {
    const g = koMcGuy({ p2chars: [OV.thatch, OV.sai4] });
    pickInst(g, [at(g, 'p2', 'characters', OV.sai4)]);
    expect(charIds(g, 'p2')).toEqual([OV.accino10, OV.thatch].sort());
  });

  it('"up to 1": may choose nothing', () => {
    const g = koMcGuy({ p2chars: [OV.thatch] });
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(charIds(g, 'p2')).toEqual([OV.accino10, OV.thatch].sort());
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('only opposing Characters are candidates: neither the Leader nor my own Characters', () => {
    const g = koMcGuy({ p1chars: [OV.whiteyBay2], p2chars: [OV.sai4] });
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.sai4]);
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it("with no Character of 8000 base power or less on the opponent's side nothing happens", () => {
    const g = koMcGuy({});
    expect(kind(g)).toBe('main');
    expect(charIds(g, 'p2')).toEqual([OV.accino10]);
  });

  it('must not trigger when McGuy wins the battle and stays on the field', () => {
    const g = myTurn(
      side(OL.luffy, BLUE, { characters: [MCGUY] }),
      side(OL.luffy, RED, { characters: [{ card: OV.hajrudin6, rested: true }, OV.sai4] }),
    );
    attack(g, at(g, 'p1', 'characters', MCGUY), at(g, 'p2', 'characters', OV.hajrudin6));
    passBlock(g);
    passCounter(g);
    expect(charIds(g, 'p1')).toEqual([MCGUY]);
    expect(charIds(g, 'p2')).toEqual([OV.sai4]);
    expect(atMain(g, 'p1')).toBe(true);
  });
});
