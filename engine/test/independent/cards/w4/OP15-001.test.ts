/**
 * OP15-001 Krieg (Leader, Green/Red, 5000, 4 Life, {Krieg Pirates}/{East Blue}).
 *
 * Card text: "[DON!! x1] [Opponent's Turn] If the only Characters on your field are {East Blue}
 * type Characters, give all of your opponent's Characters -2000 power.
 * [Activate: Main] [Once Per Turn] Rest up to 1 of your opponent's Characters that has 2 or more
 * DON!! cards given."
 *
 * Rules: CR 8-3-2-3 (a [DON!! xX] condition is a state check, more than X still works), RL-13
 * (DON!! given on your turn stay through the opponent's turn), CR 8-4-4-1 ("up to").
 * Not asserted (the text does not settle it): a field with no Characters at all ("the only
 * Characters ... are" is vacuously true or not); no test depends on it.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  chr,
  donW,
  givenTo,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  theirsW,
  toMyNextMain,
  useAbility,
  W4,
} from './kit-w4a.ts';

const KRIEG = 'OP15-001';

/** p2's turn: Krieg (with `don` DON!! given) and p1's Characters; p2 has Marco 5000 and Kingdew 7000. */
function defend(p1chars: string[], don = 1, p2chars: string[] = [W4.marco, W4.kingdew]) {
  return theirsW({ leader: { card: KRIEG, don }, characters: p1chars }, { characters: p2chars });
}

describe("OP15-001 Krieg: [DON!! x1] [Opponent's Turn] -2000 to all opposing Characters", () => {
  it('printed values: 5000 power, 4 Life, no DON!! given means no effect', () => {
    const g = defend([W4.alvida], 0);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(5000);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });

  it('with 1 DON!! on the Leader and only {East Blue} Characters, every opposing Character gets -2000', () => {
    const g = defend([W4.alvida, W4.genzo]);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(3000);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(5000);
  });

  it('one Character that is not {East Blue} switches the effect off', () => {
    const g = defend([W4.alvida, W4.komachiyo]);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(5000);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });

  it('a Character with {East Blue} among several types counts (Tashigi is {Navy}/{East Blue})', () => {
    const g = defend([W4.tashigi, W4.alvida]);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(3000);
  });

  it('a rested non-{East Blue} Character still counts as a Character on the field', () => {
    const g = defend([W4.alvida, { card: W4.komachiyo, rested: true } as never]);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(5000);
  });

  it('boundary: 1 DON!! is enough and more than 1 still works (CR 8-3-2-3)', () => {
    const one = defend([W4.alvida], 1);
    const three = defend([W4.alvida], 3);
    expect(one.power(chr(one, 'p2', W4.kingdew))).toBe(5000);
    expect(three.power(chr(three, 'p2', W4.kingdew))).toBe(5000);
  });

  it("only the opponent's Characters are reduced: not their Leader, not my Characters", () => {
    const g = defend([W4.alvida]);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(chr(g, 'p1', W4.alvida))).toBe(3000);
  });

  it("the effect is for the opponent's turn only: on my own turn nothing is reduced", () => {
    const g = mine(
      { card: KRIEG, don: 1 },
      { characters: [W4.alvida], costArea: { active: 9, rested: 0 } },
      { characters: [W4.marco, W4.kingdew] },
    );
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(5000);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });

  it('the reduction matters in battle: a 5000 Character attacking the 5000 Leader (now 3000) deals no damage', () => {
    const g = defend([W4.alvida]);
    attack(g, chr(g, 'p2', W4.marco), g.leader('p1'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('control: without the effect the same attack takes a Life card', () => {
    const g = defend([W4.komachiyo]);
    attack(g, chr(g, 'p2', W4.marco), g.leader('p1'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });
});

describe('OP15-001 Krieg: [Activate: Main] [Once Per Turn] rest a Character with 2+ DON!! given', () => {
  function board(p2chars: (string | { card: string; rested?: boolean; don?: number })[]) {
    return mine(KRIEG, {}, { characters: p2chars });
  }

  it('offers exactly the opposing Characters with 2 or more DON!! given (boundary 1 / 2 / 3)', () => {
    const g = board([
      { card: W4.alvida, don: 1 },
      { card: W4.marco, don: 2 },
      { card: W4.kingdew, don: 3 },
      { card: W4.hajrudin },
    ]);
    useAbility(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.kingdew, W4.marco].sort());
  });

  it('rests the chosen Character and leaves its DON!! given', () => {
    const g = board([
      { card: W4.marco, don: 2 },
      { card: W4.kingdew, don: 2 },
    ]);
    useAbility(g, g.leader('p1'));
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', W4.kingdew)).rested).toBe(false);
    expect(givenTo(g, chr(g, 'p2', W4.marco))).toBe(2);
  });

  it('"up to 1": rests only one even with two candidates, and may rest none', () => {
    const g = board([
      { card: W4.marco, don: 2 },
      { card: W4.kingdew, don: 2 },
    ]);
    useAbility(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', W4.kingdew)).rested).toBe(false);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it("the opponent's Leader is not a Character: not offered even with DON!! given", () => {
    const g = mine(
      KRIEG,
      {},
      { leader: { card: W4.luffy, don: 3 }, characters: [{ card: W4.marco, don: 2 }] },
    );
    useAbility(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.marco]);
  });

  it('with no Character holding 2 DON!! nothing is rested', () => {
    const g = board([{ card: W4.marco, don: 1 }, { card: W4.kingdew }]);
    if (offeredAbilities(g, g.leader('p1')).length) {
      useAbility(g, g.leader('p1'));
      if (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
    }
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', W4.kingdew)).rested).toBe(false);
  });

  it('once per turn: after using it the ability is not offered again, and is offered next turn', () => {
    const g = board([
      { card: W4.marco, don: 2 },
      { card: W4.kingdew, don: 2 },
    ]);
    useAbility(g, g.leader('p1'));
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, g.leader('p1')).length).toBe(1);
  });

  it('declining the pick still spends the use of the turn', () => {
    const g = board([{ card: W4.marco, don: 2 }]);
    useAbility(g, g.leader('p1'));
    none(g);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    expect(at(g, 'p1', 'leader', KRIEG)).toBe(g.leader('p1'));
  });

  it("uses no DON!! of mine and moves none of the opponent's", () => {
    const g = board([{ card: W4.marco, don: 2 }]);
    const before = donW(g, 'p2');
    useAbility(g, g.leader('p1'));
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(donW(g, 'p2')).toEqual(before);
    expect(donW(g, 'p1').active).toBe(10);
  });
});
