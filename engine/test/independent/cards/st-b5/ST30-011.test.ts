/**
 * ST30-011 Buggy (Character, Green, cost 2, 1000, Counter +1000, {Buggy Pirates}/{Impel Down}).
 *
 * Card text: "If your Character with 6000 base power would be removed from the field by your
 * opponent's effect, you may rest this Character instead. [Blocker]"
 *
 * Rules: an optional replacement (CR 8-1-3-4-1), "removed from the field" is any move off the
 * field (CR 4-11-2), the opponent's effects only (a battle K.O. is not an effect), an impossible
 * replacement cannot be applied (CR 8-1-3-4-5: Buggy already rested cannot be rested), exactly
 * 6000 base power (RL-49), a rested Character cannot block (RD 91).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  bounce,
  BOUNCE,
  hand,
  kind,
  kw,
  KO_SRC,
  mine,
  need,
  no,
  SL,
  squardKo,
  theirs,
  trash,
  yes,
} from './kit-stb5a.ts';

const ID = 'ST30-011';
const HAJ = 'OP01-018'; // Red, cost 4, 6000
const KING = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023'; // Red, 5000
const THATCH = 'OP02-007'; // Red, 8000

type Placed = string | { card: string; rested?: boolean };

function koed(victim: string, buggy: Placed = ID) {
  const g = theirs(
    SL.luffy,
    { characters: [buggy, victim] },
    { hand: [KO_SRC.squard], characters: [KO_SRC.accino] },
  );
  squardKo(g, g.find('p1', 'characters', victim));
  return g;
}
const buggyOf = (g: ReturnType<typeof koed>) =>
  g.zone('p1', 'characters').find((c) => c.card === ID);
const fieldIds = (g: ReturnType<typeof koed>) =>
  g
    .zone('p1', 'characters')
    .map((c) => c.card)
    .sort();

describe('ST30-011 Buggy: [Blocker]', () => {
  it('has [Blocker] and can block an attack', () => {
    const g = theirs(SL.luffy, { characters: [ID] }, { characters: [THATCH] });
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Blocker');
    attack(g, g.find('p2', 'characters', THATCH), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });
});

describe("ST30-011 Buggy: may rest itself instead of a 6000-base Character's removal by the opponent's effect", () => {
  it('accepting: the 6000-base Character stays, Buggy is rested', () => {
    const g = koed(HAJ);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(fieldIds(g)).toEqual([HAJ, ID].sort());
    expect(buggyOf(g)!.rested).toBe(true);
    expect(trash(g)).toEqual([]);
  });

  it('declining: the Character is K.O.d, Buggy stays active', () => {
    const g = koed(HAJ);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(fieldIds(g)).toEqual([ID]);
    expect(buggyOf(g)!.rested).toBe(false);
    expect(trash(g)).toEqual([HAJ]);
  });

  it('Buggy already rested: the replacement cannot be applied, no question, the Character is K.O.d', () => {
    const g = koed(HAJ, { card: ID, rested: true });
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([HAJ]);
    expect(fieldIds(g)).toEqual([ID]);
  });

  it('a Character with 7000 base power is not covered', () => {
    const g = koed(KING);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([KING]);
    expect(buggyOf(g)!.rested).toBe(false);
  });

  it('a Character with 5000 base power is not covered (exactly 6000)', () => {
    const g = koed(MARCO);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([MARCO]);
  });

  it('Buggy itself (1000 base) is not covered', () => {
    const g = theirs(
      SL.luffy,
      { characters: [ID, HAJ] },
      { hand: [KO_SRC.squard], characters: [KO_SRC.accino] },
    );
    squardKo(g, g.find('p1', 'characters', ID));
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([ID]);
  });

  it('a battle K.O. is not an effect: no replacement is offered', () => {
    const g = theirs(
      SL.luffy,
      { characters: [ID, { card: HAJ, rested: true }] },
      { characters: [THATCH] },
    );
    attack(g, g.find('p2', 'characters', THATCH), g.find('p1', 'characters', HAJ));
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([HAJ]);
    expect(buggyOf(g)!.rested).toBe(false);
  });

  it("a bounce by the opponent's effect is a removal too: accepting keeps the Character, Buggy rests", () => {
    const g = theirs(SL.luffy, { characters: [ID, HAJ] }, { hand: [BOUNCE] });
    bounce(g, g.find('p1', 'characters', HAJ));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(fieldIds(g)).toEqual([HAJ, ID].sort());
    expect(buggyOf(g)!.rested).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it("my own effect is not the opponent's: bouncing my own 6000-base Character gets no replacement", () => {
    const g = mine(SL.luffy, { characters: [ID, HAJ], hand: [BOUNCE] });
    bounce(g, g.find('p1', 'characters', HAJ));
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([HAJ]);
  });

  it('after the replacement the rested Buggy cannot block', () => {
    const g = koed(HAJ);
    yes(g, 'p1');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
  });

  it('control: declining leaves Buggy active, and it can block', () => {
    const g = koed(HAJ);
    no(g, 'p1');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });
});
