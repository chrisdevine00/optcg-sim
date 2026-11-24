/**
 * OP16-003 Edward.Newgate (Character, Red, cost 8, 10000, no Counter, {The Four Emperors}/{Whitebeard
 * Pirates}, Special).
 *
 * Card text: "[Your Turn] Your Leader gains [Double Attack] and +2000 power.
 * [On Play] You may reveal 2 Character cards with 8000 power from your hand: Give up to 1 of your
 * opponent's Characters -6000 power during this turn."
 *
 * Rules: CR 10-1-4 ([Double Attack]: 2 damage), CR 8-3-1 (a cost needs all its cards), "during this
 * turn" ends at CR 6-6-1-3 (RL-09), [Your Turn] is a permanent effect of the controller's turn only.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  choices,
  describeEightKCost,
  endTurn,
  fill,
  hand,
  kw,
  mayChooseNone,
  mine,
  need,
  noDefence,
  none,
  offeredIds,
  OL,
  OV,
  payHand,
  pickInst,
  playCard,
  pw,
  RED,
  theirs,
  toMyNextMain,
  yes,
} from './kit-op16a.ts';

const NEWGATE = 'OP16-003';
const P2 = { characters: [OV.hajrudin6], deck: fill(RED, 10) };

function playIt(extra: string[], p2 = P2) {
  const g = mine(OL.luffy, { hand: [NEWGATE, ...extra], deck: fill(RED, 10) }, p2);
  playCard(g, NEWGATE);
  return g;
}

describeEightKCost({
  id: NEWGATE,
  verb: 'reveal',
  n: 2,
  start: (extra) => playIt(extra),
  afterPay: (g) => pickInst(g, [at(g, 'p2', 'characters', OV.hajrudin6)]),
  happened: (g) => pw(g, 'p2', OV.hajrudin6) === 0,
});

describe('OP16-003 Edward.Newgate: [On Play] -6000 power', () => {
  it('after paying, the choice is among the opponent\'s Characters only (not the Leader, not mine)', () => {
    const g = mine(
      OL.luffy,
      { hand: [NEWGATE, OV.thatch, OV.ramba], characters: [OV.sai4], deck: fill(RED, 10) },
      P2,
    );
    playCard(g, NEWGATE);
    yes(g);
    payHand(g, [OV.thatch, OV.ramba]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.hajrudin6]);
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('gives exactly -6000 (a 6000 Character goes to 0, an 8000 Character to 2000)', () => {
    const g = playIt([OV.thatch, OV.ramba], { characters: [OV.thatch], deck: fill(RED, 10) });
    yes(g);
    payHand(g, [OV.thatch, OV.ramba]);
    pickInst(g, [at(g, 'p2', 'characters', OV.thatch)]);
    expect(pw(g, 'p2', OV.thatch)).toBe(2000);
  });

  it('"up to 1": may choose nothing after paying; the reveals still happened', () => {
    const g = playIt([OV.thatch, OV.ramba]);
    yes(g);
    payHand(g, [OV.thatch, OV.ramba]);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(6000);
    expect(hand(g)).toEqual([OV.thatch, OV.ramba].sort());
  });

  it('only one Character is reduced when the opponent has two', () => {
    const g = playIt([OV.thatch, OV.ramba], {
      characters: [OV.hajrudin6, OV.kingdew5],
      deck: fill(RED, 10),
    });
    yes(g);
    payHand(g, [OV.thatch, OV.ramba]);
    pickInst(g, [at(g, 'p2', 'characters', OV.hajrudin6)]);
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(0);
    expect(pw(g, 'p2', OV.kingdew5)).toBe(7000);
  });

  it('"during this turn": the reduction is gone at the start of the opponent\'s turn', () => {
    const g = playIt([OV.thatch, OV.ramba]);
    yes(g);
    payHand(g, [OV.thatch, OV.ramba]);
    pickInst(g, [at(g, 'p2', 'characters', OV.hajrudin6)]);
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(0);
    endTurn(g);
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(6000);
  });
});

describe('OP16-003 Edward.Newgate: [Your Turn] Leader gains [Double Attack] and +2000', () => {
  it('on my turn my Leader is 7000 and has [Double Attack]; the Leader without Newgate is 5000 and has none', () => {
    const g = mine(OL.luffy, { characters: [NEWGATE] });
    const without = mine(OL.luffy, { characters: [OV.thatch] });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(kw(g, g.leader('p1'))).toContain('Double Attack');
    expect(without.power(without.leader('p1'))).toBe(5000);
    expect(kw(without, without.leader('p1'))).not.toContain('Double Attack');
  });

  it('on the opponent\'s turn the Leader is back to 5000 without [Double Attack]', () => {
    const g = theirs(OL.luffy, { characters: [NEWGATE] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kw(g, g.leader('p1'))).not.toContain('Double Attack');
  });

  it('only the Leader gains it: Newgate and my other Characters have no [Double Attack] and no bonus', () => {
    const g = mine(OL.luffy, { characters: [NEWGATE, OV.thatch] });
    expect(pw(g, 'p1', NEWGATE)).toBe(10000);
    expect(pw(g, 'p1', OV.thatch)).toBe(8000);
    expect(kw(g, at(g, 'p1', 'characters', OV.thatch))).not.toContain('Double Attack');
  });

  it('a connecting Leader attack deals 2 damage (Double Attack)', () => {
    const g = mine(OL.luffy, { characters: [NEWGATE] }, { life: fill(RED, 4) });
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
  });

  it('without Newgate the same Leader attack deals 1 damage', () => {
    const g = mine(OL.luffy, { characters: [OV.thatch] }, { life: fill(RED, 4) });
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('the +2000 decides a battle: 7000 Leader beats a 6000 Character that would beat 5000', () => {
    const g = mine(OL.luffy, { characters: [NEWGATE] }, { characters: [{ card: OV.hajrudin6 }] });
    expect(g.power(g.leader('p1'))).toBe(7000);
    const rested = mine(OL.luffy, { characters: [NEWGATE] }, { characters: [{ card: OV.hajrudin6, rested: true }] });
    attack(rested, rested.leader('p1'), at(rested, 'p2', 'characters', OV.hajrudin6));
    noDefence(rested);
    expect(rested.zone('p2', 'characters')).toHaveLength(0);
  });

  it('two Newgates: the Leader still has one +2000 per effect (stacking is each effect applying)', () => {
    const g = mine(OL.luffy, { characters: [NEWGATE, NEWGATE] });
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the bonus lasts through my next turn too: back on my next Main Phase the Leader is 7000', () => {
    const g = mine(OL.luffy, { characters: [NEWGATE] });
    toMyNextMain(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });
});

