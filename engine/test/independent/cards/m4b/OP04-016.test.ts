/**
 * OP04-016 Bad Manners Kick Course (Event, Red, cost 0; Alabasta / Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Character cards gains
 *    +3000 power during this battle.
 *    [Trigger] Give up to 1 of your opponent's Leader or Character cards −3000 power during this turn."
 *
 * Rules: an Event is used from the hand in the Counter Step (CR 7-1-3-1-2); the Event itself has
 * left the hand when its cost is paid (CR 8-3-1-?, the played card is in the trash/being resolved),
 * so it cannot be the card trashed; a "may" cost may be skipped and then the effect does nothing
 * (CR 8-3-1-4); "during this battle" ends with the battle (CR 7-1-5-3); "during this turn" ends in
 * the End Phase of the turn it was given in (CR 6-6-1-3).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  canCounter,
  endTurn,
  passBlock,
  takeDamage,
  side,
  CH,
  choiceCards,
  counterEvent,
  EV,
  F,
  hitAndTrigger,
  LB,
  sortedIds,
  theirTurn,
  drive,
  choose,
  eventCounterTargets,
} from './kit-b.ts';

function defending(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  const g = theirTurn(
    side(LB.redShc, F.red, { hand: [EV.kick, CH.sunny], ...p1 }),
    side(LB.opp, F.red, { characters: [CH.kingdew], ...p2 }),
  );
  act(g, {
    type: 'attack',
    attacker: g.find('p2', 'characters', CH.kingdew),
    target: g.leader('p1'),
  });
  passBlock(g);
  return g;
}

describe('OP04-016 [Counter]: you may trash 1 card from your hand: +3000 during this battle', () => {
  it('happy path: trash the other card; the Leader is 8000 and stops a 7000 attacker; the Event and the card are in the trash', () => {
    const g = defending();
    const fodder = g.find('p1', 'hand', CH.sunny);
    counterEvent(g, g.find('p1', 'hand', EV.kick), { cost: [fodder], picks: [[g.leader('p1')]] });
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.sunny, EV.kick].sort());
    expect(sortedIds(g, 'p1', 'hand')).toEqual([]);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });

  it('control: without the Event the 7000 attacker beats the 5000 Leader', () => {
    const g = defending();
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
  });

  it('"during this battle": the +3000 is gone when the battle ends', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.kick), {
      cost: [g.find('p1', 'hand', CH.sunny)],
      picks: [[g.leader('p1')]],
    });
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-4: declining the trash cost does nothing: no boost, the card stays in hand', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.kick), { use: [false] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([CH.sunny]);
  });

  it('with no other card in hand the cost cannot be paid: whatever happens, there is no boost', () => {
    const g = defending({ hand: [EV.kick] });
    const kick = g.find('p1', 'hand', EV.kick);
    if (canCounter(g, kick)) counterEvent(g, kick, { picks: [[g.leader('p1')]] });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the Event cannot be the card it trashes: with one other card, that one must be trashed', () => {
    const g = defending({ hand: [EV.kick, CH.robin] });
    counterEvent(g, g.find('p1', 'hand', EV.kick), { picks: [[g.leader('p1')]] });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.robin, EV.kick].sort());
  });

  it('any card of the hand may be trashed: with two others the player chooses which', () => {
    const g = defending({ hand: [EV.kick, CH.robin, CH.sunny] });
    counterEvent(g, g.find('p1', 'hand', EV.kick), {
      cost: [g.find('p1', 'hand', CH.robin)],
      picks: [[g.leader('p1')]],
    });
    expect(sortedIds(g, 'p1', 'hand')).toEqual([CH.sunny]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.robin, EV.kick].sort());
  });

  it('target: your Leader or your Characters (a Character not under attack may be boosted); never the opponent’s cards', () => {
    const g = defending({ characters: [{ card: CH.marco, rested: true }] });
    const targets = eventCounterTargets(g, g.find('p1', 'hand', EV.kick));
    expect(targets.sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', CH.marco)].sort());
  });

  it('boosting a rested Character under attack saves it from a 7000 attacker (5000 → 8000)', () => {
    const g = theirTurn(
      side(LB.redShc, F.red, {
        hand: [EV.kick, CH.sunny],
        characters: [{ card: CH.marco, rested: true }],
      }),
      side(LB.opp, F.red, { characters: [CH.kingdew] }),
    );
    const marco = g.find('p1', 'characters', CH.marco);
    act(g, { type: 'attack', attacker: g.find('p2', 'characters', CH.kingdew), target: marco });
    passBlock(g);
    counterEvent(g, g.find('p1', 'hand', EV.kick), {
      cost: [g.find('p1', 'hand', CH.sunny)],
      picks: [[marco]],
    });
    expect(g.power(marco)).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CH.marco]);
  });
});

describe('OP04-016 [Trigger]: give up to 1 of your opponent’s Leader or Characters −3000 during this turn', () => {
  function triggerGame() {
    return theirTurn(
      side(LB.redShc, F.red, { life: [EV.kick, F.red, F.red, F.red] }),
      side(LB.opp, F.red, { characters: [CH.kingdew, CH.marco] }),
    );
  }

  it('happy path: the revealed Life card gives the opponent’s Character −3000 (7000 → 4000)', () => {
    const g = triggerGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    act(g, { type: 'attack', attacker: kingdew, target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', { picks: [[kingdew]] });
    expect(g.power(kingdew)).toBe(4000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.kick]);
  });

  it('candidates: the opponent’s Leader and Characters only', () => {
    const g = triggerGame();
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    expect(choiceCards(g)).toEqual([LB.opp, CH.kingdew, CH.marco].sort());
  });

  it('the Leader can be chosen: the opponent’s Leader is 2000', () => {
    const g = triggerGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    act(g, { type: 'attack', attacker: kingdew, target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    choose(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(2000);
  });

  it('"during this turn": the −3000 lasts through the opponent’s turn and is gone on mine', () => {
    const g = triggerGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    act(g, { type: 'attack', attacker: kingdew, target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', { picks: [[kingdew]] });
    expect(g.power(kingdew)).toBe(4000);
    endTurn(g);
    expect(g.power(kingdew)).toBe(7000);
  });

  it('declining the [Trigger] adds the card to hand and changes no power', () => {
    const g = triggerGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    hitAndTrigger(g, kingdew, g.leader('p1'), false);
    expect(g.power(kingdew)).toBe(7000);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([EV.kick]);
  });

  it('"up to 1": choosing nothing leaves every power unchanged', () => {
    const g = triggerGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    act(g, { type: 'attack', attacker: kingdew, target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', { picks: [[]] });
    expect(g.power(kingdew)).toBe(7000);
  });
});
