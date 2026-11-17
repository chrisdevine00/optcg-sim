/**
 * OP12-018 Color of the Supreme King Haki (Event, Red, cost 0; Former Roger Pirates).
 *
 * Card text (cards/data):
 *   "[Counter] Up to 1 of your Characters or [Silvers Rayleigh] gains +2000 power during this
 *    battle. Then, you may rest 1 of your DON!! cards. If you do, give your opponent's Leader and
 *    all of their Characters −1000 power during this turn."
 *
 * Reading: the boost target is one of your Characters, or a card named exactly [Silvers Rayleigh]
 * (CR 2-1-2), which can be the Leader: a Leader with another name is not a target. The rest is an
 * optional cost of the second effect (CR 8-3-1-4), and "if you do" ties the −1000 to it (CR 4-10-1);
 * "up to 1" allows no target (CR 8-4-4-1) and "then" still goes on (CR 4-10-2). The −1000 is "during
 * this turn", the boost "during this battle" (CR 7-1-5-3, 6-6-1-3).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  CH,
  counterEvent,
  donOf,
  endTurn,
  EV,
  eventCounterTargets,
  F,
  LB,
  passBlock,
  side,
  sortedIds,
  takeDamage,
  theirTurn,
} from './kit-b.ts';

/** OP09-005 Silvers Rayleigh: Red, cost 5, 6000, [Blocker], Roger Pirates. */
const RAYLEIGH_CHAR = 'OP09-005';

function defending(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  leader: string = LB.rayleigh,
) {
  const g = theirTurn(
    side(leader, F.red, {
      hand: [EV.haki],
      costArea: { active: 2, rested: 0 },
      characters: [CH.robin],
      ...p1,
    }),
    side(LB.opp, F.red, { characters: [CH.kingdew, CH.marco], ...p2 }),
  );
  act(g, {
    type: 'attack',
    attacker: g.find('p2', 'characters', CH.kingdew),
    target: g.leader('p1'),
  });
  passBlock(g);
  return g;
}

describe('OP12-018 [Counter]: +2000 to a Character or [Silvers Rayleigh] during this battle', () => {
  it('happy path: boosting the [Silvers Rayleigh] Leader (5000 → 7000) with the DON!! rest too: attacker 7000 → 6000, no damage', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[g.leader('p1')]], use: [true] });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(6000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });

  it('costs 0: the Event is used with all DON!! active (and 1 is rested only by the optional rest)', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[g.leader('p1')]], use: [false] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.haki]);
  });

  it('target: with a Rayleigh Leader the candidates are the Leader and Characters', () => {
    const g = defending({ characters: [CH.robin, RAYLEIGH_CHAR] });
    const t = eventCounterTargets(g, g.find('p1', 'hand', EV.haki)).sort();
    expect(t).toEqual(
      [
        g.leader('p1'),
        g.find('p1', 'characters', CH.robin),
        g.find('p1', 'characters', RAYLEIGH_CHAR),
      ].sort(),
    );
  });

  it('CR 2-1-2: a Leader that is not [Silvers Rayleigh] is not a target; Characters are', () => {
    const g = defending({}, {}, LB.redShc);
    const t = eventCounterTargets(g, g.find('p1', 'hand', EV.haki));
    expect(t).not.toContain(g.leader('p1'));
    expect(t).toContain(g.find('p1', 'characters', CH.robin));
  });

  it('the boost is only "during this battle": gone after it', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[g.leader('p1')]], use: [false] });
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('control: boosted to 7000 alone (no DON!! rest) a 7000 attacker still wins the tie', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[g.leader('p1')]], use: [false] });
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
  });
});

describe('OP12-018: then you may rest 1 DON!!. If you do, the opponent’s Leader and all Characters get −1000 during this turn', () => {
  it('accepting: rests 1 DON!!; the opponent’s Leader (4000) and every Character (Kingdew 6000, Marco 4000) lose 1000', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[g.leader('p1')]], use: [true] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
    expect(g.power(g.leader('p2'))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(6000);
    expect(g.power(g.find('p2', 'characters', CH.marco))).toBe(4000);
  });

  it('with the −1000 the 7000 Leader beats the 6000 attacker: no damage', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[g.leader('p1')]], use: [true] });
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });

  it('declining the rest: no −1000 and 2 DON!! stay active', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[g.leader('p1')]], use: [false] });
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
  });

  it('no active DON!! (all rested): the rest cannot be paid, so no −1000', () => {
    const g = defending({ costArea: { active: 0, rested: 2 } });
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[g.leader('p1')]], use: [true] });
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', CH.marco))).toBe(5000);
  });

  it('"during this turn": the −1000 lasts after the battle through the turn and is gone in the next one', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[g.leader('p1')]], use: [true] });
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.power(g.find('p2', 'characters', CH.marco))).toBe(4000);
    endTurn(g);
    expect(g.power(g.find('p2', 'characters', CH.marco))).toBe(5000);
  });

  it('CR 8-4-4-1 / 4-10-2: "up to 1" may pick no target; the DON!! rest and the −1000 are still available', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), { picks: [[]], use: [true] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.leader('p2'))).toBe(4000);
  });

  it('only the opponent is affected: your own Leader and Characters get no −1000', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.haki), {
      picks: [[g.find('p1', 'characters', CH.robin)]],
      use: [true],
    });
    expect(g.power(g.find('p1', 'characters', CH.robin))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
