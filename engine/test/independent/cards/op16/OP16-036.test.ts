/**
 * OP16-036 Mr.2.Bon.Kurei(Bentham) (Character, Green, cost 4, 1000, Counter +1000, {Impel Down}/
 * {Former Baroque Works}, Strike).
 *
 * Card text: "[On Play] Rest up to 1 of your opponent's Characters with a cost of 4 or less.
 * [When Attacking] This Character's base power becomes the same as your opponent's Leader during this
 * turn."
 *
 * Rules: "up to 1" (CR 8-4-4-1), CR 10-2-5 ([When Attacking]), base power set by an effect lasts
 * "during this turn" (RL-09, RL-33), given DON!! still add +1000 on my turn (CR 6-5-5-2). Only an
 * unmodified opposing Leader is used (M6b-Q29, base or current power, is not asked here).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  BLUE,
  choices,
  endTurn,
  fill,
  mayChooseNone,
  mine,
  need,
  noDefence,
  none,
  OL,
  OV,
  offeredIds,
  pickInst,
  playCard,
  pw,
  restedChar,
  side,
  myTurn,
  RED,
} from './kit-op16a.ts';

const BON = 'OP16-036';
const NEWGATE6 = 'OP02-001'; // Leader: Red, 6000, 6 Life, {The Four Emperors}/{Whitebeard Pirates}
const COST4 = OV.hajrudin6; // Red, cost 4, 6000
const COST5 = OV.kingdew5; // Red, cost 5, 7000
const COST2 = OV.sai4; // Red, cost 2, 4000

function play(p2chars: string[]) {
  const g = mine(OL.kid, { hand: [BON] }, { characters: p2chars });
  playCard(g, BON);
  return g;
}

describe('OP16-036 Mr.2.Bon.Kurei: [On Play] rest an opposing Character with cost 4 or less', () => {
  it('boundary: a cost 4 Character is offered, a cost 5 Character is not', () => {
    const g = play([COST4, COST5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST4]);
  });

  it('"or less": cost 2 is offered too', () => {
    const g = play([COST2, COST5]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([COST2]);
  });

  it('rests the chosen Character and no other', () => {
    const g = play([COST4, COST2]);
    pickInst(g, [at(g, 'p2', 'characters', COST4)]);
    expect(restedChar(g, 'p2', COST4)).toBe(true);
    expect(restedChar(g, 'p2', COST2)).toBe(false);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": may rest nothing', () => {
    const g = play([COST4]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(restedChar(g, 'p2', COST4)).toBe(false);
  });

  it('only Characters are candidates: not the Leader and not my own Characters', () => {
    const g = mine(OL.kid, { hand: [BON], characters: [COST2] }, { characters: [COST4] });
    playCard(g, BON);
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([COST4]);
  });

  it('with no opposing Character of cost 4 or less nothing is rested', () => {
    const g = play([COST5]);
    expect(atMain(g)).toBe(true);
    expect(restedChar(g, 'p2', COST5)).toBe(false);
  });
});

describe("OP16-036 Mr.2.Bon.Kurei: [When Attacking] base power becomes the opposing Leader's", () => {
  const swing = (o: { leader?: string; don?: number } = {}) => {
    const don = o.don ?? 0;
    const g = myTurn(
      side(OL.kid, BLUE, {
        characters: [{ card: BON, don }],
        costArea: { active: 10 - don, rested: 0 },
      }),
      side(o.leader ?? OL.luffy, RED, { life: fill(RED, 4) }),
    );
    return g;
  };

  it('before attacking it is its printed 1000', () => {
    const g = swing();
    expect(pw(g, 'p1', BON)).toBe(1000);
  });

  it('when it attacks a 5000 Leader its power becomes 5000', () => {
    const g = swing();
    attack(g, at(g, 'p1', 'characters', BON), g.leader('p2'));
    expect(pw(g, 'p1', BON)).toBe(5000);
  });

  it('it follows the actual Leader: against a 6000 Leader it becomes 6000', () => {
    const g = swing({ leader: NEWGATE6 });
    attack(g, at(g, 'p1', 'characters', BON), g.leader('p2'));
    expect(pw(g, 'p1', BON)).toBe(6000);
  });

  it('the new power wins the battle: a 5000 Bon ties a 5000 Leader (attacker wins) and deals damage', () => {
    const g = swing();
    attack(g, at(g, 'p1', 'characters', BON), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('against a 6000 Leader the 6000 power also connects', () => {
    const g = swing({ leader: NEWGATE6 });
    attack(g, at(g, 'p1', 'characters', BON), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('given DON!! still add +1000 each on top of the new base: 1 DON!! gives 6000 against a 5000 Leader', () => {
    const g = swing({ don: 1 });
    expect(pw(g, 'p1', BON)).toBe(2000);
    attack(g, at(g, 'p1', 'characters', BON), g.leader('p2'));
    expect(pw(g, 'p1', BON)).toBe(6000);
  });

  it('"during this turn": it is back to 1000 on the opponent\'s turn', () => {
    const g = swing();
    attack(g, at(g, 'p1', 'characters', BON), g.leader('p2'));
    noDefence(g);
    endTurn(g);
    expect(pw(g, 'p1', BON)).toBe(1000);
  });

  it("the opponent's Characters are unaffected and the power is Bon Kurei's only", () => {
    const g = myTurn(
      side(OL.kid, BLUE, { characters: [BON, COST2] }),
      side(OL.luffy, RED, { characters: [COST4], life: fill(RED, 4) }),
    );
    attack(g, at(g, 'p1', 'characters', BON), g.leader('p2'));
    expect(pw(g, 'p1', COST2)).toBe(4000);
    expect(pw(g, 'p2', COST4)).toBe(6000);
  });
});
