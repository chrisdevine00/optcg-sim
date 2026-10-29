/**
 * OP17-065 Queen (Character, Purple, cost 9, 10000, no Counter, [Banish], type Animal Kingdom Pirates).
 *
 * Card text (cards/data, override keywords ["Banish"]):
 *   "[Banish]
 *    [On Play] DON!! −1: Draw 1 card, and up to 2 of your opponent's Characters with a cost of 5 or
 *    less cannot attack until the end of your opponent's next End Phase."
 *
 * Rulings: RL-21 / CR 10-1-3-1 (Banish: the Life card is trashed, no [Trigger]); RL-11 ("until the
 * end of your opponent's next End Phase" covers the opponent's next turn and ends in its End Phase);
 * QA-GR (an [On Play] with a cost may be declined); CR 8-4-4-1 ("up to 2" allows 0, 1 or 2).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, decision, endTurn, passBlock } from '../helpers.ts';
import {
  accept,
  AKP,
  attackers,
  choiceCards,
  choose,
  count,
  decline,
  donOf,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  reachablePickSets,
  RED,
  side,
  sortedIds,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function playQueen(p2: Partial<PlayerSpec>, p1: Partial<PlayerSpec> = {}): TestGame {
  const g = myTurn(
    side(LEAD.kaido, PURPLE, { hand: [AKP.queen9], costArea: { active: 9, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED, p2),
  );
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.queen9) });
  return g;
}

describe('OP17-065 Queen: [Banish]', () => {
  it('the printed keyword is present', () => {
    const g = myTurn(side(LEAD.kaido, PURPLE, { characters: [AKP.queen9] }), side(LEAD.luffy, RED));
    expect(g.card(g.find('p1', 'characters', AKP.queen9)).keywords).toContain('Banish');
  });

  it('RL-21 / CR 10-1-3-1: Queen’s damage trashes the Life card and no [Trigger] is offered', () => {
    // p2's top Life card is OP07-076 Slow-Slow Beam Sword, which has a scripted [Trigger].
    const g = myTurn(
      side(LEAD.kaido, PURPLE, { characters: [AKP.queen9] }),
      side(LEAD.luffy, RED, { life: [AKP.slowSlow, RED, RED, RED] }),
    );
    attack(g, g.find('p1', 'characters', AKP.queen9), g.leader('p2'));
    passBlock(g);
    if (decision(g)?.kind === 'counter') act(g, { type: 'endCounter' });
    expect(decision(g)?.kind).not.toBe('trigger');
    expect(g.life('p2')).toBe(3);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([AKP.slowSlow]);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });
});

describe('OP17-065 Queen: [On Play] DON!! −1 → draw 1, up to 2 cost-5-or-less Characters cannot attack', () => {
  it('happy path: draw 1 and stop two Characters from attacking on the opponent’s next turn', () => {
    const g = playQueen({ characters: [VAN.marco, VAN.kingdew, VAN.thatch] });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costRested');
    expect(count(g, 'p1', 'hand')).toBe(1);
    expect(donOf(g, 'p1').deck).toBe(2);
    choose(g, [g.find('p2', 'characters', VAN.marco), g.find('p2', 'characters', VAN.kingdew)]);
    endTurn(g);
    const can = attackers(g);
    expect(can).not.toContain(g.find('p2', 'characters', VAN.marco));
    expect(can).not.toContain(g.find('p2', 'characters', VAN.kingdew));
    expect(can).toContain(g.find('p2', 'characters', VAN.thatch));
    expect(can).toContain(g.leader('p2'));
  });

  it('target restriction: only the opponent’s Characters with cost 5 or less are offered', () => {
    // Marco cost 3, Kingdew cost 5 (yes); Thatch cost 6 (no); p1's own Gordon (no).
    const g = playQueen(
      { characters: [VAN.marco, VAN.kingdew, VAN.thatch] },
      { characters: [VAN.gordon] },
    );
    accept(g);
    payDon(g, 1, 'costRested');
    expect(choiceCards(g)).toEqual([VAN.kingdew, VAN.marco].sort());
  });

  it('CR 8-4-4-1: "up to 2" can end with 0, 1 or 2 Characters', () => {
    const g = playQueen({ characters: [VAN.marco, VAN.kingdew] });
    accept(g);
    payDon(g, 1, 'costRested');
    expect(reachablePickSets(g)).toEqual(
      new Set(['', VAN.marco, VAN.kingdew, [VAN.kingdew, VAN.marco].sort().join('+')]),
    );
  });

  it('RL-11: the restriction lasts through the opponent’s next turn and is gone on the turn after', () => {
    const g = playQueen({ characters: [VAN.marco] });
    accept(g);
    payDon(g, 1, 'costRested');
    const marco = g.find('p2', 'characters', VAN.marco);
    choose(g, [marco]);
    endTurn(g); // p2's turn 4: Marco cannot attack
    expect(attackers(g)).not.toContain(marco);
    endTurn(g); // p1's turn 5
    endTurn(g); // p2's turn 6: the effect ended in turn 4's End Phase
    expect(attackers(g)).toContain(marco);
  });

  it('QA-GR: declining the DON!! −1 means no draw and no restriction', () => {
    const g = playQueen({ characters: [VAN.marco] });
    decline(g);
    expect(count(g, 'p1', 'hand')).toBe(0);
    expect(donOf(g, 'p1').deck).toBe(1);
    endTurn(g);
    expect(attackers(g)).toContain(g.find('p2', 'characters', VAN.marco));
  });

  it('with no opponent Characters, the draw still happens', () => {
    const g = playQueen({});
    accept(g);
    payDon(g, 1, 'costRested');
    expect(count(g, 'p1', 'hand')).toBe(1);
    expect(decision(g)?.kind).toBe('main');
  });
});
