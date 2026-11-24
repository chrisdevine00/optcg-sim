/**
 * OP16-001 Portgas.D.Ace (Leader, Red, 5000, 5 Life, {Whitebeard Pirates}, Special).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Up to 1 of your [Monkey.D.Luffy] Characters or up to 1 of
 * your Characters with a type including "Whitebeard Pirates", with 8000 power or more, gains [Rush]
 * during this turn."
 *
 * Rules: CR 10-1-1 ([Rush]), CR 3-7-4 (a Character played this turn cannot attack), "during this
 * turn" ends in the End Phase (RL-09), [Once Per Turn] (CR 10-2-13). M6b-Q16 (one target in total,
 * the power condition applying to both) has no answer on file: only the readings on which every
 * reading agrees are asserted here.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canHit,
  kw,
  LD,
  mayChooseNone,
  need,
  none,
  OL,
  OV,
  offeredAbilities,
  offeredIds,
  pickInst,
  RED,
  side,
  useAbility,
  myTurn,
  endTurn,
  act,
} from './kit-op16a.ts';

const ACE = OL.ace;
const LUFFY10 = 'P-061'; // Green, cost 8, 10000, {FILM}/{Straw Hat Crew}, vanilla, named Monkey.D.Luffy

function board(chars: (string | { card: string; playedThisTurn?: boolean; rested?: boolean })[]) {
  return myTurn(
    side(ACE, RED, { characters: chars }),
    side(LD.luffy, RED, { characters: [OV.hajrudin6] }),
  );
}

describe('OP16-001 Portgas.D.Ace: [Activate: Main] [Once Per Turn] give [Rush]', () => {
  it('offers its [Activate: Main] in the Main Phase', () => {
    const g = board([OV.thatch]);
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
  });

  it('a {Whitebeard Pirates} Character with exactly 8000 power is a candidate and gains [Rush]', () => {
    const g = board([OV.thatch]);
    const thatch = at(g, 'p1', 'characters', OV.thatch);
    expect(kw(g, thatch)).not.toContain('Rush');
    useAbility(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([OV.thatch]);
    pickInst(g, [thatch]);
    expect(kw(g, thatch)).toContain('Rush');
    expect(atMain(g)).toBe(true);
  });

  it('boundary: a {Whitebeard Pirates} Character with 7000 power is not a candidate', () => {
    const g = board([OV.kingdew5, OV.thatch]);
    useAbility(g, g.leader('p1'));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.thatch]);
  });

  it('boundary: a {Whitebeard Pirates} Character with more than 8000 power (9000) qualifies', () => {
    const g = board([OV.kingdew5, 'OP02-020']);
    useAbility(g, g.leader('p1'));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual(['OP02-020']);
  });

  it('"a type including": {Whitebeard Pirates Allies} with 8000 power qualifies', () => {
    const g = board([OV.ramba]);
    useAbility(g, g.leader('p1'));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.ramba]);
  });

  it('a Character with 8000+ power and no Whitebeard type (and not Luffy) is not a candidate', () => {
    const g = board([OV.franky8, OV.accino10, OV.thatch]);
    useAbility(g, g.leader('p1'));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.thatch]);
  });

  it('a [Monkey.D.Luffy] Character with 10000 power is a candidate (either reading of the power condition)', () => {
    const g = board([LUFFY10, OV.franky8]);
    useAbility(g, g.leader('p1'));
    need(g, 'choose');
    expect(offeredIds(g)).toContain(LUFFY10);
    expect(offeredIds(g)).not.toContain(OV.franky8);
    pickInst(g, [at(g, 'p1', 'characters', LUFFY10)]);
    expect(kw(g, at(g, 'p1', 'characters', LUFFY10))).toContain('Rush');
  });

  it('only one Character gains [Rush] (one target in total)', () => {
    const g = board([OV.thatch, OV.ramba]);
    const [a, b] = [at(g, 'p1', 'characters', OV.thatch), at(g, 'p1', 'characters', OV.ramba)];
    useAbility(g, g.leader('p1'));
    need(g, 'choose');
    pickInst(g, [a]);
    expect(kw(g, a)).toContain('Rush');
    expect(kw(g, b)).not.toContain('Rush');
  });

  it('"up to 1": may choose nothing; nobody gains [Rush] and the once-per-turn use is spent', () => {
    const g = board([OV.thatch]);
    useAbility(g, g.leader('p1'));
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(kw(g, at(g, 'p1', 'characters', OV.thatch))).not.toContain('Rush');
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('with no qualifying Character the activation has no target to choose', () => {
    const g = board([OV.hajrudin6]);
    useAbility(g, g.leader('p1'));
    expect(atMain(g)).toBe(true);
    expect(kw(g, at(g, 'p1', 'characters', OV.hajrudin6))).not.toContain('Rush');
  });

  it('[Once Per Turn]: after one use it is not offered again the same turn', () => {
    const g = board([OV.thatch, OV.ramba]);
    useAbility(g, g.leader('p1'));
    pickInst(g, [at(g, 'p1', 'characters', OV.thatch)]);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('[Rush] lets a Character played this turn attack a Character (the rested opposing one) at once', () => {
    const g = myTurn(
      side(ACE, RED, { characters: [{ card: OV.thatch, playedThisTurn: true }] }),
      side(LD.luffy, RED, { characters: [{ card: OV.hajrudin6, rested: true }] }),
    );
    const thatch = at(g, 'p1', 'characters', OV.thatch);
    const target = at(g, 'p2', 'characters', OV.hajrudin6);
    expect(canHit(g, thatch, target)).toBe(false);
    expect(canHit(g, thatch, g.leader('p2'))).toBe(false);
    useAbility(g, g.leader('p1'));
    pickInst(g, [thatch]);
    expect(canHit(g, thatch, target)).toBe(true);
    expect(canHit(g, thatch, g.leader('p2'))).toBe(true);
  });

  it('"during this turn": [Rush] is gone on the next turn', () => {
    const g = board([OV.thatch]);
    const thatch = at(g, 'p1', 'characters', OV.thatch);
    useAbility(g, g.leader('p1'));
    pickInst(g, [thatch]);
    endTurn(g);
    expect(kw(g, thatch)).not.toContain('Rush');
    act(g, { type: 'endTurn' });
    expect(kw(g, at(g, 'p1', 'characters', OV.thatch))).not.toContain('Rush');
  });

  it('the Once Per Turn limit resets: usable again on my next turn', () => {
    const g = board([OV.thatch]);
    useAbility(g, g.leader('p1'));
    pickInst(g, [at(g, 'p1', 'characters', OV.thatch)]);
    endTurn(g);
    act(g, { type: 'endTurn' });
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
  });

  it("must not: it never targets the opponent's Characters", () => {
    const g = myTurn(
      side(ACE, RED, { characters: [OV.thatch] }),
      side(LD.luffy, RED, { characters: [OV.ramba] }),
    );
    useAbility(g, g.leader('p1'));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.thatch]);
  });
});
