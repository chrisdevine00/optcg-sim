/**
 * OP16-015 Monkey.D.Luffy (Character, Red, cost 4, 6000, no Counter, {Straw Hat Crew}/{Impel Down},
 * Strike).
 *
 * Card text: "If your Leader's card name includes "Ace" and you have 6 or more DON!! cards on your field,
 * give this card in your hand -2 cost.
 * [On Your Opponent's Attack] You may trash 1 Character card with 8000 power from your hand: Your
 * Leader and this Character's base power becomes 7000 during this turn."
 *
 * Rules: CR 8-1-3-3 (permanent effect in hand), DON!! on the field = cost area + given (CR 6-5-5),
 * CR 10-2-16 ([On Your Opponent's Attack]), base power (CR 4-9-2; several settings: the higher wins,
 * RL-33), "during this turn" ends in the End Phase (RL-09).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  canPlayCard,
  canUse,
  costOf,
  endTurn,
  fill,
  hand,
  mine,
  need,
  no,
  noDefence,
  OL,
  OV,
  payHand,
  RED,
  BLUE,
  side,
  theirTurn,
  trash,
  unusable,
  yes,
  pw,
  atMain,
} from './kit-op16a.ts';

const LUFFY = 'OP16-015';
const ACE_ENB = 'ST22-001'; // Ace & Newgate: a Leader whose name includes "Ace"

function inHand(o: { leader?: string; active?: number; rested?: number; given?: number }) {
  const given = o.given ?? 0;
  const g = mine(o.leader ?? OL.ace, {
    hand: [LUFFY],
    characters: given ? [{ card: OV.sai4, don: given }] : [],
    costArea: { active: o.active ?? 6, rested: o.rested ?? 0 },
  });
  return { g, cost: costOf(g, g.find('p1', 'hand', LUFFY)) };
}

/** p2's turn: p2's Leader (5000) attacks p1's Leader. p1 has Luffy on the field. */
function attacked(o: { hand?: string[]; p2atk?: string } = {}) {
  const g = theirTurn(
    side(OL.ace, BLUE, { characters: [LUFFY], hand: o.hand ?? [OV.thatch], life: fill(BLUE, 4) }),
    side(OL.luffy, RED, { characters: o.p2atk ? [o.p2atk] : [] }),
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  return g;
}

describe('OP16-015 Monkey.D.Luffy: -2 cost in hand', () => {
  it('Leader "Portgas.D.Ace" with 6 DON!! on the field: cost 2', () => {
    expect(inHand({ active: 6 }).cost).toBe(2);
  });

  it('boundary: 5 DON!! on the field is not enough (cost 4)', () => {
    expect(inHand({ active: 5 }).cost).toBe(4);
  });

  it('more than 6 DON!! is still just -2', () => {
    expect(inHand({ active: 10 }).cost).toBe(2);
  });

  it('rested DON!! count as "on your field": 3 active + 3 rested = 6', () => {
    expect(inHand({ active: 3, rested: 3 }).cost).toBe(2);
  });

  it('DON!! given to a Character count: 4 in the cost area + 2 given = 6', () => {
    expect(inHand({ active: 4, rested: 0, given: 2 }).cost).toBe(2);
  });

  it('a Leader whose name has no "Ace" does not reduce it, even with 10 DON!!', () => {
    expect(inHand({ leader: OL.luffy, active: 10 }).cost).toBe(4);
  });

  it('"includes": a Leader named "Ace & Newgate" reduces it', () => {
    expect(inHand({ leader: ACE_ENB, active: 6 }).cost).toBe(2);
  });

  it('with the reduction it can be played with 2 active DON!! (and 4 more rested on the field)', () => {
    const g = mine(OL.ace, { hand: [LUFFY], costArea: { active: 2, rested: 4 } });
    expect(canPlayCard(g, g.find('p1', 'hand', LUFFY))).toBe(true);
    const plain = mine(OL.luffy, { hand: [LUFFY], costArea: { active: 2, rested: 4 } });
    expect(canPlayCard(plain, plain.find('p1', 'hand', LUFFY))).toBe(false);
  });

  it('on the field the card has its printed cost of 4', () => {
    const g = mine(OL.ace, { characters: [LUFFY], costArea: { active: 10, rested: 0 } });
    expect(costOf(g, at(g, 'p1', 'characters', LUFFY))).toBe(4);
  });
});

describe('OP16-015 Monkey.D.Luffy: [On Your Opponent\'s Attack] trash an 8000 Character: base power 7000', () => {
  it('is offered when the opponent attacks; paying sets the Leader and Luffy to base 7000', () => {
    const g = attacked();
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [OV.thatch]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(pw(g, 'p1', LUFFY)).toBe(7000);
    expect(trash(g)).toEqual([OV.thatch]);
  });

  it('the 7000 Leader beats the attacking 5000 Leader: no damage', () => {
    const g = attacked();
    yes(g);
    payHand(g, [OV.thatch]);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('declining: the Leader stays 5000 and the same attack connects', () => {
    const g = attacked();
    no(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(pw(g, 'p1', LUFFY)).toBe(6000);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });

  it('only a Character card with exactly 8000 power pays: 7000 and 9000 cannot', () => {
    const g = attacked({ hand: [OV.kingdew5, OV.oars9] });
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([OV.kingdew5, OV.oars9].sort());
  });

  it('an empty hand cannot pay', () => {
    const g = attacked({ hand: [] });
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"during this turn": the base power stays 7000 after the battle, until the turn ends', () => {
    const g = attacked();
    yes(g);
    payHand(g, [OV.thatch]);
    noDefence(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(pw(g, 'p1', LUFFY)).toBe(7000);
  });

  it('it is gone on my next turn: Leader 5000, Luffy 6000', () => {
    const g = attacked();
    yes(g);
    payHand(g, [OV.thatch]);
    noDefence(g);
    endTurn(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(pw(g, 'p1', LUFFY)).toBe(6000);
  });

  it('not once per turn: it is offered again on the second attack of the same turn', () => {
    const g = theirTurn(
      side(OL.ace, BLUE, { characters: [LUFFY], hand: [OV.thatch, OV.ramba], life: fill(BLUE, 4) }),
      side(OL.luffy, RED, { characters: [OV.hajrudin6] }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    yes(g);
    payHand(g, [OV.thatch]);
    noDefence(g);
    attack(g, g.find('p2', 'characters', OV.hajrudin6), g.leader('p1'));
    expect(canUse(g)).toBe(true);
  });

  it('works whatever the attack targets: attacking a rested Character of mine also offers it', () => {
    const g = theirTurn(
      side(OL.ace, BLUE, {
        characters: [LUFFY, { card: OV.sai4, rested: true }],
        hand: [OV.thatch],
      }),
      side(OL.luffy, RED, {}),
    );
    attack(g, g.leader('p2'), at(g, 'p1', 'characters', OV.sai4));
    expect(canUse(g)).toBe(true);
  });
});
