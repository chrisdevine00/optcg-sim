/**
 * OP17-017 Ga Ha Ha Ha!! (Event, Red, cost 1; The Four Emperors / Whitebeard Pirates).
 *
 * Card text (cards/data):
 *   "[Counter] Up to 1 of your Leader with a type including "Whitebeard Pirates" or up to 1 of your
 *    Characters with a type including "Whitebeard Pirates" gains +2000 power during this battle.
 *    Then, give up to 1 of your opponent's Leader or Characters −2000 power during this turn."
 *
 * Reading: "a type including X" matches any type whose name contains X, so "Whitebeard Pirates
 * Allies" (EB01-005 Doma) and "Former Whitebeard Pirates" (OP01-033 Izo) both qualify. One recipient
 * of the +2000 (Leader or Character). "Then" does not depend on the first part having a target
 * (CR 4-10-2, no preceding "if"), and "up to" allows none (CR 8-4-4-1). The −2000 is "during this
 * turn", the +2000 "during this battle".
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  CH,
  counterEvent,
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

/** OP02-001 Edward.Newgate: Red Leader, 6000, The Four Emperors / Whitebeard Pirates. */
const NEWGATE = 'OP02-001';
/** OP01-033 Izo: Green, cost 3, 3000, Former Whitebeard Pirates / Land of Wano. */
const IZO = 'OP01-033';

function defending(
  p1: Partial<PlayerSpec> = {},
  leader: string = NEWGATE,
  p2: Partial<PlayerSpec> = {},
) {
  const g = theirTurn(
    side(leader, F.red, {
      hand: [EV.gaha],
      costArea: { active: 1, rested: 0 },
      characters: [CH.doma, CH.robin],
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

describe('OP17-017 [Counter]: +2000 to a Whitebeard Pirates Leader or Character during this battle', () => {
  it('happy path: Newgate Leader 6000 → 8000 beats the 7000 attacker; the Event is trashed after paying 1', () => {
    const g = defending();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    counterEvent(g, g.find('p1', 'hand', EV.gaha), { picks: [[g.leader('p1')], [kingdew]] });
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.gaha]);
    expect(g.power(kingdew)).toBe(5000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });

  it('targets: the WBP Leader and the Characters with a type including "Whitebeard Pirates" (Doma, Izo); not Robin', () => {
    const g = defending({ characters: [CH.doma, CH.robin, IZO] });
    const t = eventCounterTargets(g, g.find('p1', 'hand', EV.gaha)).sort();
    expect(t).toEqual(
      [g.leader('p1'), g.find('p1', 'characters', CH.doma), g.find('p1', 'characters', IZO)].sort(),
    );
  });

  it('a Leader without Whitebeard Pirates (ST01-001) is not a target; Doma still is', () => {
    const g = defending({}, LB.redShc);
    const t = eventCounterTargets(g, g.find('p1', 'hand', EV.gaha));
    expect(t).not.toContain(g.leader('p1'));
    expect(t).toContain(g.find('p1', 'characters', CH.doma));
  });

  it('boosting an Allies Character: Doma 3000 → 5000', () => {
    const g = defending();
    const doma = g.find('p1', 'characters', CH.doma);
    counterEvent(g, g.find('p1', 'hand', EV.gaha), { picks: [[doma], []] });
    expect(g.power(doma)).toBe(5000);
  });

  it('"during this battle": the +2000 is gone after the battle', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.gaha), { picks: [[g.leader('p1')], []] });
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });
});

describe('OP17-017: then give up to 1 of the opponent’s Leader or Characters −2000 during this turn', () => {
  it('the opponent’s Leader can be chosen: 5000 → 3000', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.gaha), { picks: [[g.leader('p1')], [g.leader('p2')]] });
    expect(g.power(g.leader('p2'))).toBe(3000);
  });

  it('a Character can be chosen: Marco 5000 → 3000', () => {
    const g = defending();
    const marco = g.find('p2', 'characters', CH.marco);
    counterEvent(g, g.find('p1', 'hand', EV.gaha), { picks: [[g.leader('p1')], [marco]] });
    expect(g.power(marco)).toBe(3000);
  });

  it('"during this turn": the −2000 outlasts the battle and ends with the turn', () => {
    const g = defending();
    const marco = g.find('p2', 'characters', CH.marco);
    counterEvent(g, g.find('p1', 'hand', EV.gaha), { picks: [[g.leader('p1')], [marco]] });
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.power(marco)).toBe(3000);
    endTurn(g);
    expect(g.power(marco)).toBe(5000);
  });

  it('CR 4-10-2: with no Whitebeard Pirates card of yours to boost, the −2000 still applies', () => {
    const g = defending({ characters: [CH.robin] }, LB.redShc);
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    counterEvent(g, g.find('p1', 'hand', EV.gaha), { picks: [[kingdew]] });
    expect(g.power(kingdew)).toBe(5000);
  });

  it('"up to 1": choosing no opponent card is allowed', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.gaha), { picks: [[g.leader('p1')], []] });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('your own cards are not candidates for the −2000', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.gaha), { picks: [[g.leader('p1')], []] });
    expect(g.power(g.find('p1', 'characters', CH.robin))).toBe(5000);
  });
});
