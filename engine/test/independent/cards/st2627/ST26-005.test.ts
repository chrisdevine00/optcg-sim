/**
 * ST26-005 Monkey.D.Luffy (Character, Purple, cost 6, 7000, no Counter, {Straw Hat Crew}, Strike).
 *
 * Card text: "[On Play] / [When Attacking] DON!! -2 (You may return the specified number of DON!!
 * cards from your field to your DON!! deck.): If your Leader is multicolored and your opponent has
 * 5 or more DON!! cards on their field, your "Straw Hat Crew" type Leader's base power becomes 7000
 * until the end of your opponent's next End Phase."
 *
 * Rules: CR 4-9-2 ("base power" is the printed power; DON!! given still adds +1000 each on my turn),
 * "DON!! cards on their field" counts the cost area (active and rested) and DON!! given to cards.
 * The "If" comes after the cost colon: an effect condition, so the DON!! -2 is paid even when the
 * check fails (convention). The duration ends at the opponent's next End Phase, which is the End
 * Phase of the turn that follows this one.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  costOffered,
  decline,
  donOf,
  endTurn,
  fill,
  kind,
  mine,
  noDefence,
  offeredIds,
  playCard,
  pw,
  RED,
  SL,
  SS,
  toMyNextMain,
  useDonCost,
  waitingAtMain,
  need,
} from './kit-st2627a.ts';

const LUFFY = 'ST26-005';

type P2 = {
  characters?: (string | { card: string; don?: number })[];
  costArea?: { active: number; rested: number };
};

/** p1 has `leader` and Luffy in hand with 10 active DON!!; p2 has `p2DonActive` active DON!!. */
function inHand(leader: string, p2: P2 = { costArea: { active: 5, rested: 0 } }) {
  return mine(
    leader,
    { hand: [LUFFY], costArea: { active: 10, rested: 0 } },
    { deck: fill(RED, 10), ...p2 },
  );
}

function playAndPay(g: ReturnType<typeof inHand>) {
  playCard(g, LUFFY);
  useDonCost(g, 2);
}

describe('ST26-005 Monkey.D.Luffy: [On Play] leader base power becomes 7000', () => {
  it('multicolored {Straw Hat Crew} Leader, opponent with 5 DON!!: the Leader is 7000 (from 5000)', () => {
    const g = inHand(SL.multiShc);
    expect(g.power(g.leader('p1'))).toBe(5000);
    playAndPay(g);
    expect(waitingAtMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('"becomes": a 6000-base multicolored {Straw Hat Crew} Leader also becomes 7000', () => {
    const g = inHand(SL.multiShc6);
    expect(g.power(g.leader('p1'))).toBe(6000);
    playAndPay(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('boundary: 4 opposing DON!! is not enough; the cost is still paid (effect condition) and the Leader stays 5000', () => {
    const g = inHand(SL.multiShc, { costArea: { active: 4, rested: 0 } });
    playAndPay(g);
    expect(waitingAtMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(donOf(g, 'p1').deck).toBe(2);
  });

  it('boundary: opposing DON!! counts active, rested and given alike (2 active + 2 rested + 1 given = 5)', () => {
    const g = inHand(SL.multiShc, {
      characters: [{ card: SS.c1, don: 1 }],
      costArea: { active: 2, rested: 2 },
    });
    playAndPay(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('more than 5 opposing DON!! also works (10)', () => {
    const g = inHand(SL.multiShc, { costArea: { active: 5, rested: 5 } });
    playAndPay(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it("the condition counts the opponent's DON!!, not mine: I have 10, the opponent 0, no change", () => {
    const g = inHand(SL.multiShc, { costArea: { active: 0, rested: 0 } });
    playAndPay(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a one-colored {Straw Hat Crew} Leader fails "multicolored": no change', () => {
    const g = inHand(SL.monoShc);
    playAndPay(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a multicolored Leader that is not {Straw Hat Crew} (a {Blackbeard Pirates} Leader): nothing to change', () => {
    const g = inHand(SL.bbp);
    playAndPay(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining pays nothing and changes nothing', () => {
    const g = inHand(SL.multiShc);
    playCard(g, LUFFY);
    expect(costOffered(g)).toBe(true);
    decline(g);
    expect(waitingAtMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(donOf(g, 'p1').deck).toBe(0);
  });

  it('only the Leader changes: Luffy and my other Characters keep their own power', () => {
    const g = mine(
      SL.multiShc,
      { hand: [LUFFY], characters: [SS.franky], costArea: { active: 10, rested: 0 } },
      { costArea: { active: 5, rested: 0 } },
    );
    playAndPay(g);
    expect(pw(g, 'p1', LUFFY)).toBe(7000);
    expect(pw(g, 'p1', SS.franky)).toBe(6000);
  });

  it('it is the base power: a DON!! given to the Leader still adds +1000 on top (7000 + 1000)', () => {
    const g = inHand(SL.multiShc);
    act(g, { type: 'giveDon', target: g.leader('p1') });
    expect(g.power(g.leader('p1'))).toBe(6000);
    playAndPay(g);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it("duration: still 7000 through the opponent's turn, back to 5000 at my next Main Phase", () => {
    const g = inHand(SL.multiShc);
    playAndPay(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(7000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("the boost matters in battle: a 6000 attacker on the opponent's turn hits a 5000 Leader but not the 7000 one", () => {
    const p2 = { characters: [SS.c4], costArea: { active: 5, rested: 0 } };
    const boosted = inHand(SL.multiShc, p2);
    playAndPay(boosted);
    endTurn(boosted);
    attack(boosted, at(boosted, 'p2', 'characters', SS.c4), boosted.leader('p1'));
    noDefence(boosted);
    expect(boosted.life('p1')).toBe(4);

    const control = inHand(SL.multiShc, p2);
    playCard(control, LUFFY);
    decline(control);
    endTurn(control);
    attack(control, at(control, 'p2', 'characters', SS.c4), control.leader('p1'));
    noDefence(control);
    expect(control.life('p1')).toBe(3);
  });
});

describe('ST26-005 Monkey.D.Luffy: [When Attacking] leader base power becomes 7000', () => {
  function attacking(leader: string, p2: P2 = { costArea: { active: 5, rested: 0 } }) {
    return mine(
      leader,
      { characters: [LUFFY], costArea: { active: 10, rested: 0 } },
      { deck: fill(RED, 10), ...p2 },
    );
  }

  it('attacking with Luffy offers the DON!! -2 effect; paying sets the Leader to 7000', () => {
    const g = attacking(SL.multiShc);
    attack(g, at(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    expect(costOffered(g)).toBe(true);
    useDonCost(g, 2);
    expect(g.power(g.leader('p1'))).toBe(7000);
    noDefence(g);
  });

  it('declining the [When Attacking] cost: no change, the attack goes on', () => {
    const g = attacking(SL.multiShc);
    attack(g, at(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kind(g)).toBe('block');
  });

  it('with only 4 opposing DON!! the cost is paid and the Leader stays 5000', () => {
    const g = attacking(SL.multiShc, { costArea: { active: 4, rested: 0 } });
    attack(g, at(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    useDonCost(g, 2);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(donOf(g, 'p1').deck).toBe(2);
  });

  it('must not trigger when my Leader attacks instead of Luffy', () => {
    const g = attacking(SL.multiShc);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(offeredIds(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("lasts through the opponent's next turn when used while attacking", () => {
    const g = attacking(SL.multiShc);
    attack(g, at(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    useDonCost(g, 2);
    noDefence(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
    toMyNextMain(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
