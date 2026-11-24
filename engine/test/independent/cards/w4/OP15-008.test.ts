/**
 * OP15-008 Krieg (Character, Red, cost 8, 9000, {Krieg Pirates}/{East Blue}).
 *
 * Card text: "[On Play] Give up to 3 of your opponent's rested DON!! cards to 1 of your opponent's
 * Characters. Then, this Character gains [Rush] during this turn.
 * [Activate: Main] [Once Per Turn] If this Character was played on this turn, give all of your
 * opponent's Characters -1000 power during this turn for every DON!! card given to that Character."
 *
 * Open question M6b-Q55: "that Character" may be each target (per target) or the one Character the
 * [On Play] gave DON!! to. Every activation test below has ONE opposing Character, where the two
 * readings agree. Not asserted: whether [Rush] is still gained when no DON!! was given (the "Then"
 * after an unperformed "up to" is not settled).
 * Rules: CR 6-5-5-2 (given DON!! add power on their owner's turn only), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  canHit,
  chr,
  donW,
  giveDonFlow,
  givenTo,
  maxCount,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  toMyNextMain,
  useAbility,
  W4,
} from './kit-w4a.ts';

const KRIEG = 'OP15-008';

function board(p2: Parameters<typeof mine>[2], extra: Parameters<typeof mine>[1] = {}) {
  return mine('ST01-001', { hand: [KRIEG], ...extra }, p2);
}

describe('OP15-008 Krieg: [On Play] give up to 3 rested DON!! to 1 opposing Character', () => {
  it('printed values: cost 8, 9000 power, costs 8 DON!!', () => {
    const g = board({ characters: [W4.marco], costArea: { active: 0, rested: 4 } });
    expect(g.card(at(g, 'p1', 'hand', KRIEG)).cost).toBe(8);
    playRaw(g, KRIEG);
    expect(g.power(chr(g, 'p1', KRIEG))).toBe(9000);
    expect(donW(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
  });

  it('asks a count (most first, up to 3), then the target, and gives that many rested DON!!', () => {
    const g = board({ characters: [W4.marco, W4.kingdew], costArea: { active: 0, rested: 5 } });
    playRaw(g, KRIEG);
    expect(giveDonFlow(g, 3, chr(g, 'p2', W4.kingdew))).toBe(2);
    expect(givenTo(g, chr(g, 'p2', W4.kingdew))).toBe(3);
    expect(givenTo(g, chr(g, 'p2', W4.marco))).toBe(0);
    expect(donW(g, 'p2')).toMatchObject({ rested: 2, given: 3 });
  });

  it('boundary: with only 2 rested DON!! at most 2 can be given', () => {
    const g = board({ characters: [W4.marco], costArea: { active: 0, rested: 2 } });
    playRaw(g, KRIEG);
    need(g, 'choose', 'p1');
    expect(maxCount(g)).toBe(2);
  });

  it('only RESTED DON!! can be given: with 2 active and 1 rested, only 1 moves and the active stay', () => {
    const g = board({ characters: [W4.marco], costArea: { active: 2, rested: 1 } });
    playRaw(g, KRIEG);
    giveDonFlow(g, 1, chr(g, 'p2', W4.marco));
    expect(givenTo(g, chr(g, 'p2', W4.marco))).toBe(1);
    expect(donW(g, 'p2')).toMatchObject({ active: 2, rested: 0, given: 1 });
  });

  it('"up to 3": giving fewer (1 of 4 rested) is allowed, and giving none moves nothing', () => {
    const one = board({ characters: [W4.marco], costArea: { active: 0, rested: 4 } });
    playRaw(one, KRIEG);
    giveDonFlow(one, 1, chr(one, 'p2', W4.marco));
    expect(donW(one, 'p2')).toMatchObject({ rested: 3, given: 1 });
    const zero = board({ characters: [W4.marco], costArea: { active: 0, rested: 4 } });
    playRaw(zero, KRIEG);
    need(zero, 'choose', 'p1');
    g_pickZero(zero);
    expect(donW(zero, 'p2')).toMatchObject({ rested: 4, given: 0 });
  });

  it('given DON!! add no power on my turn: the target keeps its power', () => {
    const g = board({ characters: [W4.marco], costArea: { active: 0, rested: 3 } });
    playRaw(g, KRIEG);
    giveDonFlow(g, 3, chr(g, 'p2', W4.marco));
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(5000);
  });

  it("only Characters can receive them: the opponent's Leader gets none", () => {
    const g = board({
      leader: { card: W4.luffy },
      characters: [W4.marco],
      costArea: { active: 0, rested: 3 },
    });
    playRaw(g, KRIEG);
    // The only Character may be picked by the engine; either way the DON!! go to it.
    need(g, 'choose', 'p1');
    g.act({ type: 'pick', choice: { option: '1' } });
    if (g.decider === 'p1' && g.legal().some((a) => a.type === 'pick')) {
      expect(offeredIds(g)).toEqual([W4.marco]);
      pickInst(g, [chr(g, 'p2', W4.marco)]);
    }
    expect(givenTo(g, chr(g, 'p2', W4.marco))).toBe(1);
    expect(givenTo(g, g.leader('p2'))).toBe(0);
  });

  it('gains [Rush] this turn: it can attack the turn it is played', () => {
    const g = board({ characters: [W4.marco], costArea: { active: 0, rested: 3 } });
    playRaw(g, KRIEG);
    giveDonFlow(g, 3, chr(g, 'p2', W4.marco));
    expect(g.card(chr(g, 'p1', KRIEG)).keywords).toContain('Rush');
    expect(canHit(g, chr(g, 'p1', KRIEG), g.leader('p2'))).toBe(true);
    attack(g, chr(g, 'p1', KRIEG), g.leader('p2'));
    passBlock(g);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('control: a Krieg placed on the field this turn without its [On Play] has no Rush', () => {
    const g = mine('ST01-001', { characters: [{ card: KRIEG, playedThisTurn: true }] }, {});
    expect(canHit(g, chr(g, 'p1', KRIEG), g.leader('p2'))).toBe(false);
  });
});

describe('OP15-008 Krieg: [Activate: Main] -1000 for every DON!! given to that Character', () => {
  /** Plays Krieg giving `n` DON!! to the only opposing Character (Kingdew 7000), optionally with `pre` DON!! already there. */
  function played(n: number, pre = 0) {
    const g = board({
      characters: [{ card: W4.kingdew, don: pre }],
      costArea: { active: 0, rested: 4 },
    });
    playRaw(g, KRIEG);
    giveDonFlow(g, n, chr(g, 'p2', W4.kingdew));
    return g;
  }

  it('after giving 3 the Character gets -3000 for this turn', () => {
    const g = played(3);
    useAbility(g, chr(g, 'p1', KRIEG));
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(4000);
  });

  it('scales with the DON!! given: 1 gives -1000', () => {
    const g = played(1);
    useAbility(g, chr(g, 'p1', KRIEG));
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(6000);
  });

  it('counts every DON!! the Character holds, earlier ones included (1 already there + 2 given = -3000)', () => {
    const g = played(2, 1);
    expect(givenTo(g, chr(g, 'p2', W4.kingdew))).toBe(3);
    useAbility(g, chr(g, 'p1', KRIEG));
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(4000);
  });

  it('with 0 DON!! given the activation reduces nothing', () => {
    const g = board({ characters: [W4.kingdew], costArea: { active: 0, rested: 4 } });
    playRaw(g, KRIEG);
    need(g, 'choose', 'p1');
    g_pickZero(g);
    if (offeredAbilities(g, chr(g, 'p1', KRIEG)).length) useAbility(g, chr(g, 'p1', KRIEG));
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });

  it('is once per turn', () => {
    const g = played(2);
    useAbility(g, chr(g, 'p1', KRIEG));
    expect(offeredAbilities(g, chr(g, 'p1', KRIEG))).toEqual([]);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(5000);
  });

  it('only if played this turn: a Krieg placed on the field earlier does nothing', () => {
    const g = mine(
      'ST01-001',
      { characters: [KRIEG] },
      { characters: [{ card: W4.kingdew, don: 3 }] },
    );
    if (offeredAbilities(g, chr(g, 'p1', KRIEG)).length) useAbility(g, chr(g, 'p1', KRIEG));
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });

  it('the reduction lasts this turn only', () => {
    const g = played(3);
    useAbility(g, chr(g, 'p1', KRIEG));
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(4000);
    toMyNextMain(g);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });

  it('the activation spends no DON!! and asks nothing further', () => {
    const g = played(2);
    const before = donW(g, 'p1');
    useAbility(g, chr(g, 'p1', KRIEG));
    expect(atMain(g, 'p1')).toBe(true);
    expect(donW(g, 'p1')).toEqual(before);
  });
});

/** End a pending count question or target pick with nothing (count 0, or `done`). */
function g_pickZero(g: ReturnType<typeof mine>): void {
  const d = need(g, 'choose', 'p1');
  if (d.purpose === 'mode') g.act({ type: 'pick', choice: { option: '0' } });
  else g.act({ type: 'done' });
  // A count of 0 may still be followed by the target pick; end it as well.
  const next = g.legal().some((a) => a.type === 'done') ? 'done' : null;
  if (next && need(g, 'choose', 'p1').purpose === 'target') g.act({ type: 'done' });
}
