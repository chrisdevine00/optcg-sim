/**
 * ST15-002 Edward.Newgate (Character, cost 7, 8000, no Counter, {The Four Emperors}/{Whitebeard Pirates}).
 *
 * Card text: "[On Play] Give up to 1 rested DON!! card to your Leader or 1 of your Characters.
 * [Activate: Main] You may rest this Character: K.O. up to 1 of your opponent's Characters with
 * 5000 power or less."
 *
 * Rules: DON!! given to a card stays attached and gives +1000 power during its owner's turn; only a
 * rested DON!! can be given by this effect. "Up to 1" may be answered with nothing (CR 8-4-4-1).
 * Resting this Character is the cost (CR 8-3); a rested Character cannot pay it. Power is the
 * current power (modifiers count); DON!! given to the opponent's Characters give no power on my turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  choices,
  chr,
  donStr,
  gammaKnife,
  leadPow,
  LDP,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  playRaw,
  settleEmpty,
  SP,
  sorted,
  useAbility,
  atMainOf,
  giveTo,
  kind,
} from './kit-prb02sta.ts';

const NEW = 'ST15-002';

function playIt(mineChars: string[] = [], p2chars: string[] = []) {
  const g = mine(LDP.neutral, { hand: [NEW], characters: mineChars }, { characters: p2chars });
  playRaw(g, NEW);
  return g;
}

function onBoard(p2chars: (string | { card: string; rested?: boolean; don?: number })[] = []) {
  return mine(LDP.neutral, { characters: [NEW] }, { characters: p2chars });
}

describe('ST15-002 Edward.Newgate: [On Play] give 1 rested DON!!; [Activate: Main] rest: K.O. 5000 or less', () => {
  it('printed values: cost 7, 8000 power, no Counter', () => {
    const g = onBoard();
    const c = g.card(at(g, 'p1', 'characters', NEW));
    expect(c.cost).toBe(7);
    expect(c.power).toBe(8000);
    expect(c.counter).toBeNull();
  });

  it("[On Play] offers exactly the Leader and the controller's own Characters (itself included), never the opponent's", () => {
    const g = playIt([SP.c3p5], [SP.c4p6]);
    need(g, 'choose', 'p1');
    const expected = [
      g.leader('p1'),
      at(g, 'p1', 'characters', NEW),
      at(g, 'p1', 'characters', SP.c3p5),
    ].sort();
    expect([...choices(g)].sort()).toEqual(expected);
  });

  it('[On Play] to the Leader: one rested DON!! moves from the cost area to the Leader (+1000)', () => {
    const g = playIt();
    expect(donStr(g)).toBe('3/7/0');
    giveTo(g, g.leader('p1'));
    expect(atMainOf(g)).toBe(true);
    expect(donStr(g)).toBe('3/6/1');
    expect(leadPow(g)).toBe(6000);
  });

  it('[On Play] to a Character: that Character gets +1000 and the Leader does not', () => {
    const g = playIt([SP.c3p5]);
    giveTo(g, at(g, 'p1', 'characters', SP.c3p5));
    expect(donStr(g)).toBe('3/6/1');
    expect(g.power(at(g, 'p1', 'characters', SP.c3p5))).toBe(6000);
    expect(leadPow(g)).toBe(5000);
  });

  it('[On Play] to itself: Newgate has 9000 power with the DON!! given', () => {
    const g = playIt();
    giveTo(g, at(g, 'p1', 'characters', NEW));
    expect(g.power(at(g, 'p1', 'characters', NEW))).toBe(9000);
  });

  it('"up to 1": choosing nothing gives no DON!! and nothing else is asked', () => {
    const g = playIt();
    need(g, 'choose', 'p1');
    none(g);
    expect(atMainOf(g)).toBe(true);
    expect(donStr(g)).toBe('3/7/0');
  });

  it('[On Play] gives only 1 DON!!, not one per target', () => {
    const g = playIt([SP.c3p5]);
    giveTo(g, g.leader('p1'));
    expect(atMainOf(g)).toBe(true);
    expect(donStr(g)).toBe('3/6/1');
  });

  it('[Activate: Main] rests Newgate as the cost and K.O.s a 5000-power Character, not a 6000-power one', () => {
    const g = onBoard([SP.c3p5, SP.c4p6]);
    useAbility(g, at(g, 'p1', 'characters', NEW));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c3p5]);
    pickInst(g, [chr(g, 'p2', SP.c3p5)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c4p6]);
    expect(sorted(g, 'p2', 'trash')).toEqual([SP.c3p5]);
    expect(g.card(at(g, 'p1', 'characters', NEW)).rested).toBe(true);
  });

  it('[Activate: Main] with 6000-power Characters only: nothing can be K.O.d and Newgate is rested anyway', () => {
    const g = onBoard([SP.c4p6]);
    useAbility(g, at(g, 'p1', 'characters', NEW));
    settleEmpty(g);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c4p6]);
    expect(g.card(at(g, 'p1', 'characters', NEW)).rested).toBe(true);
  });

  it('[Activate: Main] is not offered while Newgate is rested (the cost cannot be paid)', () => {
    const g = onBoard([SP.c3p5]);
    useAbility(g, at(g, 'p1', 'characters', NEW));
    need(g, 'choose', 'p1');
    none(g);
    expect(atMainOf(g)).toBe(true);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', NEW))).toEqual([]);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c3p5]);
  });

  it('[Activate: Main] with Newgate placed rested from the start is not offered', () => {
    const g = mine(
      LDP.neutral,
      { characters: [{ card: NEW, rested: true }] },
      { characters: [SP.c3p5] },
    );
    expect(offeredAbilities(g, at(g, 'p1', 'characters', NEW))).toEqual([]);
  });

  it('"up to 1": choosing nothing K.O.s nothing but the cost stays paid', () => {
    const g = onBoard([SP.c1p3]);
    useAbility(g, at(g, 'p1', 'characters', NEW));
    need(g, 'choose', 'p1');
    none(g);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p3]);
    expect(g.card(at(g, 'p1', 'characters', NEW)).rested).toBe(true);
  });

  it('[Activate: Main] can be used on the turn Newgate was played (resting is not an attack)', () => {
    const g = mine(
      LDP.neutral,
      { characters: [{ card: NEW, playedThisTurn: true }] },
      { characters: [SP.c2p4] },
    );
    expect(offeredAbilities(g, at(g, 'p1', 'characters', NEW))).toHaveLength(1);
  });

  it("only Characters are targets: the opponent's Leader and the controller's own Characters are never offered", () => {
    const g = mine(LDP.neutral, { characters: [NEW, SP.c1p3] }, { characters: [SP.c2p4] });
    useAbility(g, at(g, 'p1', 'characters', NEW));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c2p4]);
  });

  it("DON!! given to the opponent's Character gives no power on my turn: a 5000-power Character with 2 DON!! is still K.O.able", () => {
    const g = onBoard([{ card: SP.c3p5, don: 2 }]);
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(5000);
    useAbility(g, at(g, 'p1', 'characters', NEW));
    expect(offeredIds(g)).toEqual([SP.c3p5]);
  });

  it('power is the current power: a 7000-power Character at -5000 is K.O.able, a 6000-power one without a modifier is not', () => {
    const g = mine(
      LDP.neutral,
      { hand: [SP.gammaKnife], characters: [NEW] },
      { characters: [SP.c5p7, SP.c4p6] },
    );
    gammaKnife(g, chr(g, 'p2', SP.c5p7));
    expect(g.power(chr(g, 'p2', SP.c5p7))).toBe(2000);
    useAbility(g, at(g, 'p1', 'characters', NEW));
    expect(offeredIds(g)).toEqual([SP.c5p7]);
  });

  it('the K.O. list holds exactly the Characters with 5000 power or less (3000, 4000, 5000), not the 6000 one', () => {
    const g = onBoard([SP.c1p3, SP.c2p4, SP.c3p5, SP.c4p6]);
    useAbility(g, at(g, 'p1', 'characters', NEW));
    expect(offeredIds(g)).toEqual([SP.c1p3, SP.c2p4, SP.c3p5].sort());
    expect(kind(g)).toBe('choose');
  });
});
