/**
 * OP12-054 Marshall.D.Teach (Character, Blue, cost 1, 2000, Counter +1000, {Blackbeard Pirates}/
 * {The Seven Warlords of the Sea}).
 *
 * Card text: "[On Play] If your Leader has the "The Seven Warlords of the Sea" type, return up to 1
 * Character with a cost of 1 or less other than this Character to the owner's hand."
 *
 * Rules: the condition reads my Leader's types when the [On Play] resolves; "a cost of 1 or less"
 * reads the current cost (CR 4-9); the target may be any player's Character other than Teach, and
 * it goes to its owner's hand; "up to 1" may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  cast,
  chars,
  choices,
  hand,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  SB,
} from './kit-op12b.ts';

const TEACH = 'OP12-054';
/** ST06-008 Hina: black {Navy} Character, cost 3. [On Play] Give up to 1 of your opponent's Characters -4 cost during this turn. */
const HINA_MINUS4 = 'ST06-008';

describe('OP12-054 Marshall.D.Teach: [On Play] with a Warlord Leader, return a cost 1 or less Character', () => {
  it("returns the opponent's cost 1 Character to its owner's hand", () => {
    const g = mine(LB.croc, { hand: [TEACH] }, { characters: [SB.mohji, SB.sai] });
    cast(g, TEACH);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.mohji]);
    pickInst(g, [g.find('p2', 'characters', SB.mohji)]);
    expect(chars(g, 'p2')).toEqual([SB.sai]);
    expect(hand(g, 'p2')).toEqual([SB.mohji]);
    expect(hand(g)).toEqual([]);
    expect(chars(g)).toEqual([TEACH]);
  });

  it('must not: without the Warlord type on my Leader nothing is returned and nothing is asked', () => {
    const g = mine(LB.luffy, { hand: [TEACH] }, { characters: [SB.mohji] });
    cast(g, TEACH);
    expect(kind(g)).toBe('main');
    expect(chars(g, 'p2')).toEqual([SB.mohji]);
  });

  it('a Leader with the type among others (Crocodile OP04-058, Baroque Works/Warlords) qualifies', () => {
    const g = mine(LB.crocPurple, { hand: [TEACH] }, { characters: [SB.mohji] });
    cast(g, TEACH);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.mohji]);
  });

  it('boundary: a cost 2 Character is not offered', () => {
    const g = mine(LB.croc, { hand: [TEACH] }, { characters: [SB.sai, SB.marco] });
    cast(g, TEACH);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([SB.marco, SB.sai].sort());
  });

  it('reads the current cost: a cost 2 Character reduced to 1 or less this turn is offered', () => {
    const g = mine(LB.croc, { hand: [HINA_MINUS4, TEACH] }, { characters: [SB.sai] });
    cast(g, HINA_MINUS4);
    pickInst(g, [g.find('p2', 'characters', SB.sai)]);
    cast(g, TEACH);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.sai]);
  });

  it('can return one of my own Characters too (it goes to my hand)', () => {
    const g = mine(LB.croc, { hand: [TEACH], characters: [SB.mohji] });
    cast(g, TEACH);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.mohji]);
    pickInst(g, [g.find('p1', 'characters', SB.mohji)]);
    expect(hand(g)).toEqual([SB.mohji]);
    expect(chars(g)).toEqual([TEACH]);
  });

  it('"other than this Character": Teach is never offered for himself, another copy is', () => {
    const g = mine(LB.croc, { hand: [TEACH], characters: [TEACH] });
    const before = g.find('p1', 'characters', TEACH);
    cast(g, TEACH);
    need(g, 'choose', 'p1');
    // Exactly one of the two copies (the one already on the field) may be chosen.
    expect(choices(g)).toEqual([before]);
    pickInst(g, [before]);
    expect(hand(g)).toEqual([TEACH]);
    expect(chars(g)).toEqual([TEACH]);
  });

  it('"up to 1": may choose nothing; everything stays', () => {
    const g = mine(LB.croc, { hand: [TEACH], characters: [SB.mohji] }, { characters: [SB.mohji] });
    cast(g, TEACH);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([SB.mohji]);
    expect(chars(g)).toEqual([TEACH, SB.mohji].sort());
  });

  it('returns at most one of several candidates', () => {
    const g = mine(
      LB.croc,
      { hand: [TEACH], characters: [SB.mohji] },
      { characters: [SB.mohji, SB.alvida] },
    );
    cast(g, TEACH);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SB.alvida)]);
    expect(chars(g, 'p2')).toEqual([SB.mohji]);
    expect(chars(g)).toEqual([TEACH, SB.mohji].sort());
    expect(hand(g, 'p2')).toEqual([SB.alvida]);
  });
});
