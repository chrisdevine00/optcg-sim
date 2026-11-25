/**
 * ST19-001 Smoker (Black Character, cost 6, 8000, no Counter, {Navy}).
 * "[On Play] You may trash 1 black "Navy" type card from your hand: Up to 2 of your opponent's
 * Characters with a cost of 4 or less cannot attack until the end of your opponent's next turn."
 * Rules: the cost needs a card that is both black and {Navy}; an optional cost paid from the hidden
 * hand is offered even when unpayable (accept illegal); the restriction lasts through the opponent's
 * next turn only and covers Characters, not the Leader.
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import {
  act,
  atMain,
  canAttackAnything,
  cost,
  hand,
  inst,
  LD,
  mine,
  need,
  none,
  offeredIds,
  offeredUnpayable,
  payHand,
  pickCards,
  playId,
  reachablePickSets,
  SC,
  trash,
  yes,
  no,
} from './kit-st1821a.ts';

const ID = 'ST19-001';
const PAY = SC.bnavy1; // black {Navy}
const OPP = [SC.c2, SC.c4, SC.c5, SC.c3];

function start(h: string[], opp: string[] = OPP) {
  return mine(LD.navy, { hand: [ID, ...h], ...cost(10) }, { characters: opp });
}

/** Play Smoker, pay with `PAY`, arrive at the target pick. */
function toTargets(h: string[] = [PAY], opp: string[] = OPP) {
  const g = start(h, opp);
  playId(g, ID);
  yes(g, 'p1');
  payHand(g, [PAY]);
  need(g, 'choose', 'p1');
  return g;
}

/** p1 ends the turn; returns p2's Main-Phase game with `ids` as the Characters to look at. */
function p2Turn(g: ReturnType<typeof start>) {
  act(g, { type: 'endTurn' });
  need(g, 'main', 'p2');
}

describe('ST19-001 Smoker: [On Play] trash a black {Navy} card: up to 2 Characters of cost 4 or less cannot attack', () => {
  it('only a black {Navy} card can pay: blue {Navy}, black non-{Navy} and other cards are not offered', () => {
    const g = start([PAY, SC.bnavy2, SC.navyBlue5, SC.bplain2, SC.c3]);
    playId(g, ID);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PAY, SC.bnavy2].sort());
  });

  it('trashing is the cost: exactly 1 card leaves the hand for the trash', () => {
    const g = toTargets([PAY, SC.bnavy2]);
    expect(trash(g)).toEqual([PAY]);
    expect(hand(g)).toEqual([SC.bnavy2]);
  });

  it('offers exactly the opposing Characters of cost 4 or less (cost 5 is excluded)', () => {
    const g = toTargets();
    expect(offeredIds(g)).toEqual([SC.c2, SC.c3, SC.c4].sort());
  });

  it('"up to 2": at most 2 targets even with 3 candidates, and picking fewer is allowed', () => {
    const sets = reachablePickSets(toTargets());
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('the chosen Characters cannot attack during the opponent next turn; an unchosen one and the Leader can', () => {
    const g = toTargets();
    pickCards(g, [SC.c2, SC.c4]);
    expect(atMain(g)).toBe(true);
    const barred: InstanceId[] = [
      inst(g, 'p2', 'characters', SC.c2),
      inst(g, 'p2', 'characters', SC.c4),
    ];
    const free = inst(g, 'p2', 'characters', SC.c3);
    p2Turn(g);
    for (const b of barred) expect(canAttackAnything(g, b)).toBe(false);
    expect(canAttackAnything(g, free)).toBe(true);
    expect(canAttackAnything(g, g.leader('p2'))).toBe(true);
  });

  it('the restriction ends at the end of that opponent turn: the Characters attack again the turn after', () => {
    const g = toTargets();
    pickCards(g, [SC.c2]);
    const barred = inst(g, 'p2', 'characters', SC.c2);
    p2Turn(g);
    expect(canAttackAnything(g, barred)).toBe(false);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, barred)).toBe(true);
  });

  it('with no black {Navy} card in hand the cost is offered but cannot be accepted (the hand is hidden)', () => {
    const g = start([SC.navyBlue5, SC.bplain2]);
    playId(g, ID);
    offeredUnpayable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC.navyBlue5, SC.bplain2].sort());
  });

  it('declining the optional cost: nothing is trashed and nobody is restricted', () => {
    const g = start([PAY]);
    playId(g, ID);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([PAY]);
    p2Turn(g);
    for (const c of g.zone('p2', 'characters')) expect(canAttackAnything(g, c.instance)).toBe(true);
  });

  it('"up to": choosing nobody after paying leaves everyone free to attack', () => {
    const g = toTargets();
    none(g);
    expect(trash(g)).toEqual([PAY]);
    p2Turn(g);
    for (const c of g.zone('p2', 'characters')) expect(canAttackAnything(g, c.instance)).toBe(true);
  });
});
