/**
 * OP12-042 Alvida (Character, Blue, cost 4, 5000, Counter +1000, {Cross Guild}).
 *
 * Card text: "If you have 2 or more Characters with a base cost of 5 or more, this Character gains +1
 * cost. [On Play] Place up to 1 of your opponent's Characters with a base cost of 1 or less at the
 * bottom of the owner's deck."
 *
 * Rules: "base cost" is the printed cost, before effects (CR 4-9); "up to 1" may be none (CR
 * 8-4-4-1); a card placed at the bottom goes to the owner's deck (the opponent's). The cost
 * condition counts my Characters only, each with a printed cost of 5 or more; Alvida (printed 4)
 * never counts for herself.
 */
import { describe, expect, it } from 'vitest';
import {
  cast,
  chars,
  costOf,
  deck,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  opponentKOs,
  SB,
  theirs,
} from './kit-op12b.ts';

const ALVIDA = 'OP12-042';
/** ST06-008 Hina: black {Navy} Character, cost 3. [On Play] Give up to 1 of your opponent's Characters -4 cost during this turn. */
const HINA_MINUS4 = 'ST06-008';

describe('OP12-042 Alvida: +1 cost with 2+ base-cost-5 Characters; [On Play] bottom-deck a base cost 1 or less Character', () => {
  it('[On Play] places the opponent Character with base cost 1 at the bottom of their deck', () => {
    const g = mine(LB.croc, { hand: [ALVIDA] }, { characters: [SB.mohji, SB.sai] });
    cast(g, ALVIDA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.mohji]);
    pickInst(g, [g.find('p2', 'characters', SB.mohji)]);
    expect(chars(g, 'p2')).toEqual([SB.sai]);
    const d = deck(g, 'p2');
    expect(d).toHaveLength(16);
    expect(d[d.length - 1]).toBe(SB.mohji);
    expect(chars(g)).toEqual([ALVIDA]);
  });

  it('boundary: a base cost 2 Character is not offered (cost 1 is the limit)', () => {
    const g = mine(LB.croc, { hand: [ALVIDA] }, { characters: [SB.sai, SB.marco] });
    cast(g, ALVIDA);
    // Nothing qualifies: either no prompt or an empty pick; nothing of theirs may leave.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([SB.marco, SB.sai].sort());
    expect(deck(g, 'p2')).toHaveLength(15);
  });

  it('reads the BASE cost: a base cost 2 Character reduced to cost 0 this turn is still not offered', () => {
    const g = mine(LB.croc, { hand: [HINA_MINUS4, ALVIDA] }, { characters: [SB.sai] });
    cast(g, HINA_MINUS4);
    pickInst(g, [g.find('p2', 'characters', SB.sai)]);
    expect(costOf(g, g.find('p2', 'characters', SB.sai))).toBeLessThanOrEqual(0);
    cast(g, ALVIDA);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([SB.sai]);
  });

  it('"up to 1": the player may choose nothing; both Characters stay', () => {
    const g = mine(LB.croc, { hand: [ALVIDA] }, { characters: [SB.mohji, SB.alvida] });
    cast(g, ALVIDA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.alvida, SB.mohji].sort());
    none(g);
    expect(chars(g, 'p2')).toEqual([SB.alvida, SB.mohji].sort());
    expect(deck(g, 'p2')).toHaveLength(15);
  });

  it("only the opponent's Characters are offered, never mine (my own base cost 1 Character stays)", () => {
    const g = mine(
      LB.croc,
      { hand: [ALVIDA], characters: [SB.mohji] },
      { characters: [SB.alvida] },
    );
    cast(g, ALVIDA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.alvida]);
    pickInst(g, [g.find('p2', 'characters', SB.alvida)]);
    expect(chars(g)).toEqual([ALVIDA, SB.mohji].sort());
  });

  it('with 2 Characters of base cost 5 or more on my field, Alvida has cost 5', () => {
    const g = mine(LB.croc, { characters: [ALVIDA, SB.kingdew, SB.thatch] });
    expect(costOf(g, g.find('p1', 'characters', ALVIDA))).toBe(5);
  });

  it('boundary: 1 Character of base cost 5 or more gives no bonus (cost 4); 2 cost-4 Characters give none either', () => {
    const one = mine(LB.croc, { characters: [ALVIDA, SB.kingdew, SB.hajrudin] });
    expect(costOf(one, one.find('p1', 'characters', ALVIDA))).toBe(4);
    const four = mine(LB.croc, { characters: [ALVIDA, SB.hajrudin, SB.hajrudin] });
    expect(costOf(four, four.find('p1', 'characters', ALVIDA))).toBe(4);
  });

  it('3 qualifying Characters still give only +1 (cost 5, not 6)', () => {
    const g = mine(LB.croc, { characters: [ALVIDA, SB.kingdew, SB.thatch, SB.oars] });
    expect(costOf(g, g.find('p1', 'characters', ALVIDA))).toBe(5);
  });

  it("the bonus follows the board: when a qualifying Character is K.O.'d, the cost drops back to 4", () => {
    const g = theirs(LB.croc, { characters: [ALVIDA, SB.ain, SB.kingdew] }, { hand: ['OP09-077'] });
    const alv = g.find('p1', 'characters', ALVIDA);
    expect(costOf(g, alv)).toBe(5);
    opponentKOs(g, g.find('p1', 'characters', SB.ain));
    expect(chars(g)).toEqual([ALVIDA, SB.kingdew].sort());
    expect(costOf(g, alv)).toBe(4);
  });

  it('Alvida does not count for herself: two Alvidas (printed cost 4) and a cost-5 Character give no bonus', () => {
    const solo = mine(LB.croc, { characters: [ALVIDA, SB.kingdew, ALVIDA] });
    expect(costOf(solo, solo.find('p1', 'characters', ALVIDA, 0))).toBe(4);
    expect(costOf(solo, solo.find('p1', 'characters', ALVIDA, 1))).toBe(4);
  });

  it('the opponent\'s Characters of base cost 5+ do not count ("you have")', () => {
    const g = mine(LB.croc, { characters: [ALVIDA] }, { characters: [SB.kingdew, SB.thatch] });
    expect(costOf(g, g.find('p1', 'characters', ALVIDA))).toBe(4);
  });
});
