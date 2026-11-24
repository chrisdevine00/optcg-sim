/**
 * OP14-016 X.Drake (Character, cost 5, 7000, no Counter, {Drake Pirates}/{Navy}/{Supernovas}).
 *
 * Card text (verified; the upstream feed dropped a minus sign, see cards/overrides/OP14-016.json):
 * "[Opponent's Turn] [Once Per Turn] If your {Supernovas} type Character would be removed from the
 * field by your opponent's effect, you may give your Leader -2000 power during this turn instead.
 * [DON!! x1] [When Attacking] Give up to 1 of your opponent's Characters -2000 power during this turn."
 *
 * Rules: a replacement effect (CR 8-1-3-4) is optional when worded "may"; if declined the event
 * happens as written; it covers removals by the opponent's EFFECT only, so a battle K.O. is not
 * replaced. [Once Per Turn] limits the replacement to one use per turn (CR 8-1-3-2). A K.O. that is
 * replaced did not happen: no [On K.O.]. Being removed by "K.O." is removal from the field.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  chr,
  endTurn,
  kind,
  LD14,
  mine,
  need,
  no,
  none,
  offeredIds,
  opponentKOs,
  passBlock,
  passCounter,
  pickInst,
  S14,
  swing,
  theirs,
  trash,
  yes,
  playRaw,
} from './kit-op14a.ts';

const DRAKE = 'OP14-016';
const LIGHTNING = 'OP09-077';
const HAWK = 'OP14-010';

/** p2's turn; p1 has Drake and these Characters; p2 holds `hand`. */
function defend(mychars: string[], hand: string[] = [LIGHTNING], p2chars: string[] = [S14.dadan]) {
  return theirs(LD14.croc, { characters: [DRAKE, ...mychars] }, { hand, characters: p2chars });
}

describe("OP14-016 X.Drake: [Opponent's Turn] [Once Per Turn] replacement for a {Supernovas} Character", () => {
  it('printed values: cost 5, 7000, no Counter; Leader 5000', () => {
    const g = defend([]);
    const d = at(g, 'p1', 'characters', DRAKE);
    expect(g.card(d).cost).toBe(5);
    expect(g.power(d)).toBe(7000);
    expect(g.card(d).counter).toBeNull();
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('K.O. of a {Supernovas} Character by an opposing effect: accepting gives my Leader -2000 and it stays', () => {
    const g = defend([S14.killer2]);
    opponentKOs(g, chr(g, 'p1', S14.killer2));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([DRAKE, S14.killer2].sort());
    expect(trash(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it('declining applies the K.O. as written and leaves my Leader at 5000', () => {
    const g = defend([S14.killer2]);
    opponentKOs(g, chr(g, 'p1', S14.killer2));
    no(g, 'p1');
    expect(chars(g)).toEqual([DRAKE]);
    expect(trash(g)).toEqual([S14.killer2]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character without the {Supernovas} type is not covered: nothing is asked and it is K.O.d', () => {
    const g = defend([S14.marco]);
    opponentKOs(g, chr(g, 'p1', S14.marco));
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([DRAKE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('X.Drake himself is a {Supernovas} Character and can be saved (Kingdom Come K.O.s any Character)', () => {
    const g = defend([], [S14.kingdomCome]);
    playRaw(g, S14.kingdomCome);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', DRAKE)]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([DRAKE]);
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it('[Once Per Turn]: the second {Supernovas} Character K.O.d the same turn is not saved', () => {
    const g = defend([S14.killer2, S14.killer2], [LIGHTNING, LIGHTNING]);
    opponentKOs(g, g.find('p1', 'characters', S14.killer2, 0));
    yes(g, 'p1');
    opponentKOs(g, g.find('p1', 'characters', S14.killer2, 1));
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([DRAKE, S14.killer2].sort());
    expect(trash(g)).toEqual([S14.killer2]);
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it('a K.O. in battle is not removal by an effect: no replacement is offered', () => {
    const g = theirs(
      LD14.croc,
      { characters: [DRAKE, { card: S14.killer2, rested: true }] },
      { characters: [S14.marco] },
    );
    attack(g, at(g, 'p2', 'characters', S14.marco), chr(g, 'p1', S14.killer2));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([S14.killer2]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a saved Character is not K.O.d, so its own [On K.O.] does not fire (Basil Hawkins)', () => {
    const g = defend([HAWK]);
    opponentKOs(g, chr(g, 'p1', HAWK));
    yes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([DRAKE, HAWK].sort());
  });

  it("the Leader's -2000 lasts this turn only: it is back to 5000 on my turn", () => {
    const g = defend([S14.killer2]);
    opponentKOs(g, chr(g, 'p1', S14.killer2));
    yes(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(3000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

function attackingBoard(don: number, p2chars: string[] = [S14.marco, S14.sai]) {
  return mine(
    LD14.luffy,
    { costArea: { active: 10 - don, rested: 0 }, characters: [{ card: DRAKE, don }] },
    { characters: p2chars },
  );
}

describe('OP14-016 X.Drake: [DON!! x1] [When Attacking] -2000 power to up to 1 opposing Character', () => {
  it('with 1 DON!! given: gives the chosen opposing Character -2000 power', () => {
    const g = attackingBoard(1);
    swing(g, DRAKE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.marco, S14.sai].sort());
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(3000);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
  });

  it('without a DON!! given the effect does not work: nothing is asked', () => {
    const g = attackingBoard(0);
    swing(g, DRAKE);
    expect(kind(g)).toBe('block');
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = attackingBoard(1);
    swing(g, DRAKE);
    none(g);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
  });
});
