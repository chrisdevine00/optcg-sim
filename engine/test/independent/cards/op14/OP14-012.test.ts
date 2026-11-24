/**
 * OP14-012 Bepo (Character, cost 2, 2000, Counter +1000, {Heart Pirates}/{Minks}).
 *
 * Card text: "[When Attacking] If this Character has 5000 power or more, give up to 2 rested DON!!
 * cards to your Leader or 1 of your Characters."
 *
 * Rules: giving DON!! (CR 6-5-5, RL-35): only my own Leader and Characters; each given DON!! is
 * +1000 power on my turn (RL-13). The cards given are rested DON!! from the cost area. "Up to 2"
 * may be 0, 1 or 2. The answer helper accepts a count question and a target question, in either
 * order (the order is not fixed by the text).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
  donOf,
  giveDonFlow,
  kind,
  LD14,
  mine,
  need,
  offeredIds,
  S14,
  swing,
} from './kit-op14a.ts';

const BEPO = 'OP14-012';

/** Bepo with `don` DON!! given; `rested` rested DON!! and the rest of the 10 active. */
function board(don: number, rested: number) {
  return mine(
    LD14.luffy,
    {
      costArea: { active: 10 - don - rested, rested },
      characters: [{ card: BEPO, don }, S14.marco],
    },
    { characters: [S14.sai] },
  );
}

describe('OP14-012 Bepo: [When Attacking] with 5000 power, give up to 2 rested DON!!', () => {
  it('printed values: cost 2, 2000, Counter +1000; 5000 with 3 DON!!', () => {
    const g = board(3, 2);
    const c = at(g, 'p1', 'characters', BEPO);
    expect(g.card(c).cost).toBe(2);
    expect(g.power(c)).toBe(5000);
    expect(g.card(c).counter).toBe(1000);
  });

  it('at exactly 5000: gives 2 rested DON!! to one Character (+2000 power)', () => {
    const g = board(3, 2);
    swing(g, BEPO);
    need(g, 'choose', 'p1');
    expect(giveDonFlow(g, 2, chr(g, 'p1', S14.marco))).toBeGreaterThan(0);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 0, given: 5 });
    expect(g.power(chr(g, 'p1', S14.marco))).toBe(7000);
    expect(kind(g)).toBe('block');
  });

  it('may give them to my Leader instead', () => {
    const g = board(3, 2);
    swing(g, BEPO);
    giveDonFlow(g, 2, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 0, given: 5 });
  });

  it('the single target may be Bepo itself', () => {
    const g = board(3, 2);
    swing(g, BEPO);
    giveDonFlow(g, 2, at(g, 'p1', 'characters', BEPO));
    expect(donOf(g, 'p1')).toMatchObject({ rested: 0, given: 5 });
    expect(g.power(at(g, 'p1', 'characters', BEPO))).toBe(7000);
  });

  it('both DON!! go to ONE target, not one each', () => {
    const g = board(3, 2);
    swing(g, BEPO);
    giveDonFlow(g, 2, chr(g, 'p1', S14.marco));
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', BEPO))).toBe(5000);
  });

  it('"up to 2": may give just 1 (the other stays rested in the cost area)', () => {
    const g = board(3, 2);
    swing(g, BEPO);
    giveDonFlow(g, 1, chr(g, 'p1', S14.marco));
    expect(donOf(g, 'p1')).toMatchObject({ rested: 1, given: 4 });
    expect(g.power(chr(g, 'p1', S14.marco))).toBe(6000);
  });

  it('"up to 2": with only 1 rested DON!! it gives that one', () => {
    const g = board(3, 1);
    swing(g, BEPO);
    giveDonFlow(g, 1, chr(g, 'p1', S14.marco));
    expect(donOf(g, 'p1')).toMatchObject({ rested: 0, given: 4 });
  });

  it('only rested DON!! are given: with none rested the active ones stay put', () => {
    const g = board(3, 0);
    swing(g, BEPO);
    // Whatever is asked, no DON!! can be given.
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      const pick = g.legal().find((a) => a.type === 'pick');
      if (pick) g.act(pick);
      else g.act({ type: 'done' });
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 7, rested: 0, given: 3 });
  });

  it('boundary: at 4000 power (2 DON!!) nothing is asked and nothing is given', () => {
    const g = board(2, 2);
    swing(g, BEPO);
    expect(kind(g)).toBe('block');
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 2 });
  });

  it("the target is never one of the opponent's cards", () => {
    const g = board(3, 2);
    swing(g, BEPO);
    need(g, 'choose', 'p1');
    // Count first or target first: reach the target question.
    if (g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object')) {
      g.act({ type: 'pick', choice: { option: '2' } });
    }
    expect(offeredIds(g).sort()).toEqual([BEPO, LD14.luffy, S14.marco].sort());
  });
});
