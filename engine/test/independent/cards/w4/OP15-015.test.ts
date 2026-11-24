/**
 * OP15-015 Higuma (Character, Red, cost 1, 1000, Counter +2000, {Mountain Bandits}/{East Blue}).
 *
 * Card text: "[On Play] Give up to 1 of your opponent's rested DON!! cards to 1 of your opponent's
 * Characters. Then, give -1000 power during this turn to up to 1 of your opponent's Characters
 * with a DON!! card given."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 6-5-5-2 (given DON!! add power on their owner's turn only, so
 * during my turn the opposing Characters' power is unchanged by them).
 * Not asserted: whether the second step is still offered when the first gave nothing (the "Then"
 * after an unperformed "up to"); those tests answer whatever is pending and check only the state.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  chr,
  decision,
  donW,
  givenTo,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  toMyNextMain,
  W4,
} from './kit-w4a.ts';

const HIGUMA = 'OP15-015';

function board(p2: Parameters<typeof mine>[2]) {
  return mine('ST01-001', { hand: [HIGUMA] }, p2);
}

describe('OP15-015 Higuma: [On Play] give 1 rested DON!!, then -1000 to a Character with DON!!', () => {
  it('printed values: cost 1, 1000 power, Counter +2000', () => {
    const g = board({ characters: [W4.marco], costArea: { active: 0, rested: 2 } });
    const c = g.card(at(g, 'p1', 'hand', HIGUMA));
    expect(c.cost).toBe(1);
    expect(c.counter).toBe(2000);
    playRaw(g, HIGUMA);
    expect(g.power(chr(g, 'p1', HIGUMA))).toBe(1000);
  });

  it('gives exactly 1 rested DON!! to the chosen Character and asks no count (a count of 1 is not a choice)', () => {
    const g = board({
      characters: [W4.marco, W4.kingdew],
      costArea: { active: 0, rested: 4 },
    });
    playRaw(g, HIGUMA);
    need(g, 'choose', 'p1');
    expect(decision(g)?.purpose).toBe('target');
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    expect(givenTo(g, chr(g, 'p2', W4.kingdew))).toBe(1);
    expect(donW(g, 'p2')).toMatchObject({ rested: 3, given: 1 });
  });

  it('the DON!! given adds no power on my turn', () => {
    const g = board({ characters: [W4.marco, W4.kingdew], costArea: { active: 0, rested: 2 } });
    playRaw(g, HIGUMA);
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });

  it('the second step: -1000 this turn on a Character that has a DON!! (the one just given)', () => {
    const g = board({ characters: [W4.marco, W4.kingdew], costArea: { active: 0, rested: 2 } });
    playRaw(g, HIGUMA);
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.kingdew]);
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(6000);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(5000);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('the second step can pick a Character that already had a DON!! given, not only the new one', () => {
    const g = board({
      characters: [{ card: W4.marco, don: 1 }, W4.kingdew],
      costArea: { active: 0, rested: 2 },
    });
    playRaw(g, HIGUMA);
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.kingdew, W4.marco].sort());
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(4000);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });

  it('boundary: a Character without a DON!! is not offered for the -1000', () => {
    const g = board({
      characters: [{ card: W4.marco, don: 1 }, W4.hajrudin, W4.kingdew],
      costArea: { active: 0, rested: 2 },
    });
    playRaw(g, HIGUMA);
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(W4.hajrudin);
  });

  it('"up to 1": the -1000 may be declined, and the DON!! stay given', () => {
    const g = board({ characters: [W4.marco], costArea: { active: 0, rested: 2 } });
    playRaw(g, HIGUMA);
    // The only Character may be picked by the engine; answer whatever the target pick is.
    if (need(g, 'choose', 'p1').purpose === 'target' && offeredIds(g).length) {
      pickInst(g, [chr(g, 'p2', W4.marco)]);
    }
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(5000);
    expect(givenTo(g, chr(g, 'p2', W4.marco))).toBe(1);
  });

  it('giving none (done) moves no DON!!', () => {
    const g = board({
      characters: [{ card: W4.marco, don: 1 }, W4.kingdew],
      costArea: { active: 0, rested: 2 },
    });
    playRaw(g, HIGUMA);
    need(g, 'choose', 'p1');
    none(g);
    expect(donW(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
    expect(givenTo(g, chr(g, 'p2', W4.kingdew))).toBe(0);
  });

  it('only rested DON!! are given: with 3 active and none rested nothing moves', () => {
    const g = board({
      characters: [{ card: W4.marco, don: 1 }, W4.kingdew],
      costArea: { active: 3, rested: 0 },
    });
    playRaw(g, HIGUMA);
    // Drain whatever is asked (the DON!! step may be skipped or offered empty).
    for (let i = 0; i < 3 && decision(g)?.kind === 'choose'; i++) {
      const d = decision(g)!;
      if (d.purpose === 'target' && offeredIds(g).length === 0) none(g);
      else break;
    }
    expect(donW(g, 'p2')).toMatchObject({ active: 3, rested: 0, given: 1 });
    expect(givenTo(g, chr(g, 'p2', W4.kingdew))).toBe(0);
  });

  it('the Leader is not a Character: it can neither receive the DON!! nor the -1000', () => {
    const g = mine(
      'ST01-001',
      { hand: [HIGUMA] },
      {
        leader: { card: W4.luffy, don: 1 },
        characters: [W4.marco],
        costArea: { active: 0, rested: 2 },
      },
    );
    playRaw(g, HIGUMA);
    if (need(g, 'choose', 'p1').purpose === 'target' && offeredIds(g).length) {
      pickInst(g, [chr(g, 'p2', W4.marco)]);
    }
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.marco]);
    expect(givenTo(g, g.leader('p2'))).toBe(1);
  });

  it('the -1000 ends with the turn', () => {
    const g = board({ characters: [W4.kingdew], costArea: { active: 0, rested: 2 } });
    playRaw(g, HIGUMA);
    if (need(g, 'choose', 'p1').purpose === 'target' && offeredIds(g).length) {
      pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    }
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(6000);
    toMyNextMain(g);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });
});
