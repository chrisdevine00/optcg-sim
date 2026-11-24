/**
 * OP12-105 Trafalgar Lammy (Character, Yellow, cost 1, 0 power, Counter +2000, {Flevance}).
 *
 * Card text: "[Your Turn] [On Play] Up to 1 of your [Trafalgar Law] cards gains +2000 power during this
 * turn."
 *
 * Rules: "[Trafalgar Law] cards" are my cards on the field named Trafalgar Law, Leader included (the text
 * says "cards", not "Characters"), CR 4-8-1 ("up to" allows 0), CR 6-6-1-3 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  hand,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SC3,
  SCN,
} from './kit-op12c.ts';

const ID = 'OP12-105';
/** OP01-002 Trafalgar Law: Green/Red Leader, 5000, {Heart Pirates}/{Supernovas}. [Activate: Main] only. */
const LAW_LEADER = 'OP01-002';

function played(
  mineChars: string[],
  leader: string = 'ST09-001',
  oppChars: string[] = [],
  handExtra: string[] = [],
) {
  const g = mine(
    leader,
    { hand: [ID, ...handExtra], characters: mineChars },
    { characters: oppChars },
  );
  playRaw(g, ID);
  return g;
}

describe('OP12-105 Trafalgar Lammy: [Your Turn] [On Play] up to 1 [Trafalgar Law] gains +2000 this turn', () => {
  it('candidates: my [Trafalgar Law] cards only (not Lammy, not other names)', () => {
    const g = played([SC3.law5, SCN.c4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC3.law5]);
  });

  it('the chosen Law gains +2000 (7000 -> 9000) and nothing else changes', () => {
    const g = played([SC3.law5, SCN.c4]);
    pickCards(g, [SC3.law5]);
    expect(g.power(at(g, 'p1', 'characters', SC3.law5))).toBe(9000);
    expect(g.power(at(g, 'p1', 'characters', SCN.c4))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(0);
    expect(atMain(g)).toBe(true);
  });

  it('my [Trafalgar Law] Leader is a candidate too (the text says "cards")', () => {
    const g = played([SCN.c4], LAW_LEADER);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(LAW_LEADER);
    pickCards(g, [LAW_LEADER]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = played([SC3.law5]);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(at(g, 'p1', 'characters', SC3.law5))).toBe(7000);
  });

  it('with two Laws only one gets the boost', () => {
    const g = played([SC3.law5, 'OP12-106']);
    need(g, 'choose', 'p1');
    pickCards(g, ['OP12-106']);
    expect(g.power(at(g, 'p1', 'characters', 'OP12-106'))).toBe(9000);
    expect(g.power(at(g, 'p1', 'characters', SC3.law5))).toBe(7000);
  });

  it("the opponent's [Trafalgar Law] is not a candidate", () => {
    const g = played([SC3.law5], 'ST09-001', [SC3.law5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC3.law5]);
    pickCards(g, [SC3.law5]);
    expect(g.power(at(g, 'p2', 'characters', SC3.law5))).toBe(7000);
  });

  it('a Law in my hand is not a candidate (field cards only)', () => {
    const g = played([], 'ST09-001', [], [SC3.law5]);
    if (g.decider === 'p1' && offeredIds(g).length === 0 && !atMain(g)) none(g);
    expect(hand(g)).toEqual([SC3.law5]);
    expect(atMain(g)).toBe(true);
  });

  it('the boost ends with the turn', () => {
    const g = played([SC3.law5]);
    pickCards(g, [SC3.law5]);
    expect(g.power(at(g, 'p1', 'characters', SC3.law5))).toBe(9000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p1', 'characters', SC3.law5))).toBe(7000);
  });

  it('with no [Trafalgar Law] on my field the effect finds nothing and I am back in the Main Phase', () => {
    const g = played([SCN.c4]);
    if (!atMain(g)) {
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
  });
});
