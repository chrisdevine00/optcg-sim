/**
 * OP05-038 Charlestone (Event, Green, cost 2; Donquixote Pirates).
 *
 * Card text (cards/data):
 *   "[Counter] Up to 1 of your Leader or Character cards gains +4000 power during this battle.
 *    Then, you may trash 1 card from your hand. If you do, set up to 3 of your DON!! cards as active.
 *    [Trigger] Rest up to 1 of your opponent's Leader or Character cards with a cost of 3 or less."
 *
 * Rules: "you may trash ... If you do" - the DON!! are set active only when the trash happened
 * (CR 4-10-1); only rested DON!! can be set active; a Leader has no cost (CR 2-7-5 / digest 29), so
 * a "cost of 3 or less" restriction can only match Characters; a [Trigger] pays no printed cost.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  CH,
  choiceCards,
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

function defending(p1: Partial<PlayerSpec> = {}) {
  const g = theirTurn(
    side(LB.greenKid, F.green, {
      hand: [EV.charlestone, CH.sunny],
      costArea: { active: 2, rested: 3 },
      characters: [CH.alvida],
      ...p1,
    }),
    side(LB.opp, F.red, { characters: [CH.kingdew] }),
  );
  act(g, {
    type: 'attack',
    attacker: g.find('p2', 'characters', CH.kingdew),
    target: g.leader('p1'),
  });
  passBlock(g);
  return g;
}

describe('OP05-038 [Counter]: +4000 during this battle', () => {
  it('happy path: the Leader 5000 → 9000 beats the 7000 attacker; the boost is gone after the battle', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.charlestone), {
      picks: [[g.leader('p1')]],
      use: [false],
    });
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('targets: your Leader or Characters, not the opponent’s', () => {
    const g = defending();
    const t = eventCounterTargets(g, g.find('p1', 'hand', EV.charlestone)).sort();
    expect(t).toEqual([g.leader('p1'), g.find('p1', 'characters', CH.alvida)].sort());
  });

  it('a Character can be boosted: Alvida 3000 → 7000', () => {
    const g = defending();
    const alvida = g.find('p1', 'characters', CH.alvida);
    counterEvent(g, g.find('p1', 'hand', EV.charlestone), { picks: [[alvida]], use: [false] });
    expect(g.power(alvida)).toBe(7000);
  });
});

describe('OP05-038: then you may trash 1 card from your hand. If you do, set up to 3 DON!! as active', () => {
  it('happy path: trash the other card → 3 of the 5 rested DON!! become active (printed cost 2 already paid)', () => {
    const g = defending();
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
    counterEvent(g, g.find('p1', 'hand', EV.charlestone), {
      picks: [[g.leader('p1')]],
      use: [true],
      cost: [g.find('p1', 'hand', CH.sunny)],
    });
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.sunny, EV.charlestone].sort());
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('declining the trash: the boost still applies but no DON!! is set active', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.charlestone), {
      picks: [[g.leader('p1')]],
      use: [false],
    });
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    expect(sortedIds(g, 'p1', 'hand')).toEqual([CH.sunny]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('with no other card in hand nothing can be trashed, so no DON!! is set active', () => {
    const g = defending({ hand: [EV.charlestone] });
    counterEvent(g, g.find('p1', 'hand', EV.charlestone), {
      picks: [[g.leader('p1')]],
      use: [true],
    });
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('"up to 3": with only the 2 DON!! just rested for the printed cost, both become active', () => {
    const g = defending({ costArea: { active: 2, rested: 0 } });
    counterEvent(g, g.find('p1', 'hand', EV.charlestone), {
      picks: [[g.leader('p1')]],
      use: [true],
      cost: [g.find('p1', 'hand', CH.sunny)],
    });
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
  });
});

describe('OP05-038 [Trigger]: rest up to 1 of the opponent’s Leader or Characters with a cost of 3 or less', () => {
  function triggerGame() {
    const g = theirTurn(
      side(LB.greenKid, F.green, { life: [EV.charlestone, F.green, F.green, F.green] }),
      side(LB.opp, F.red, { characters: [CH.sunny, CH.marco, CH.hajrudin] }),
    );
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    return g;
  }

  it('candidates: Characters with cost 3 or less (Sunny 1, Marco 3); not Hajrudin (4); a Leader has no cost', () => {
    const g = triggerGame();
    expect(choiceCards(g)).toEqual([CH.sunny, CH.marco].sort());
  });

  it('happy path: Marco (cost 3, the boundary) is rested; the others stay active', () => {
    const g = triggerGame();
    const marco = g.find('p2', 'characters', CH.marco);
    act(g, { type: 'pick', choice: marco });
    if (g.legal().some((a) => a.type === 'done')) act(g, { type: 'done' });
    expect(g.card(marco).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.sunny)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', CH.hajrudin)).rested).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.charlestone]);
    endTurn(g);
  });
});
