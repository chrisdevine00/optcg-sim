/**
 * OP18-074 Can You Please Sail on the Ship I Made?! (Event, Purple, cost 1, types Water Seven /
 * The Franky Family).
 *
 * Card text (cards/data):
 *   "[Counter] If you have a Stage with a cost of 5 or more, up to 1 of your Leader or Characters
 *    gains +4000 power during this battle.
 *    [Trigger] DON!! −1: Add up to 2 Stage cards from your trash to your hand."
 *
 * Rules: CR 7-1-3-1-2 (Event [Counter]); the "If" after the colon is an effect condition, so the
 * card's cost is paid even when it fails (CR 4-10-1); "up to" CR 8-4-4-1; RL-08 (during this
 * battle); CR 8-3-1 (a [Trigger] cost must be payable); CR 8-3-1-6 / RL-23.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, isLegal, passBlock, takeDamage } from '../../helpers.ts';
import {
  accept,
  canCounterWith,
  choiceCards,
  choose,
  chooseIfAsked,
  chooseNone,
  count,
  decider,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  VAN,
} from '../kit.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EV = 'OP18-074';
/** OP05-040 Birdcage: Stage, cost 5. OP06-041 The Ark Noah: Stage, cost 6. ST01-017 Thousand Sunny: Stage, cost 1. */
const STAGE5 = 'OP05-040';
const STAGE6 = 'OP06-041';
const STAGE1 = 'ST01-017';

function defending(p1: Partial<PlayerSpec> = {}): TestGame {
  return theirTurn(
    side(LEAD.shanks, PURPLE, {
      hand: [EV],
      stage: STAGE5,
      characters: [{ card: VAN.marco, rested: true }],
      costArea: { active: 3, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, { characters: [VAN.kingdew] }),
  );
}

/** p2's 7000 Character attacks p1's Leader (5000) and reaches the Counter Step. */
function toCounter(g: TestGame, target?: string): void {
  attack(g, g.find('p2', 'characters', VAN.kingdew), target ?? g.leader('p1'));
  passBlock(g);
}

function counterOn(g: TestGame, target: string): void {
  useCounter(g, g.find('p1', 'hand', EV), target);
  chooseIfAsked(g, [target]);
}

describe('OP18-074 [Counter]: with a Stage of cost 5 or more, +4000 to a Leader or Character this battle', () => {
  it('cost 5 (boundary): the Leader goes 5000 → 9000, beats the 7000 attacker, and the boost ends with the battle', () => {
    const g = defending();
    toCounter(g);
    counterOn(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('cost 6 (above the boundary) also satisfies "5 or more"', () => {
    const g = defending({ stage: STAGE6 });
    toCounter(g);
    counterOn(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('a Character can be the target: a rested 5000 Character goes to 9000 and survives a 7000 attack', () => {
    const g = defending();
    const marco = g.find('p1', 'characters', VAN.marco);
    toCounter(g, marco);
    counterOn(g, marco);
    expect(g.power(marco)).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([VAN.marco]);
  });

  it('a Stage with cost 1 does not satisfy the condition: the card is spent but nothing is boosted', () => {
    const g = defending({ stage: STAGE1 });
    toCounter(g);
    if (canCounterWith(g, g.find('p1', 'hand', EV))) {
      useCounter(g, g.find('p1', 'hand', EV), g.leader('p1'));
      chooseIfAsked(g, [g.leader('p1')]);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
  });

  it('with no Stage at all the condition fails and the Leader stays 5000', () => {
    const g = defending({ stage: undefined });
    toCounter(g);
    if (canCounterWith(g, g.find('p1', 'hand', EV))) {
      useCounter(g, g.find('p1', 'hand', EV), g.leader('p1'));
      chooseIfAsked(g, [g.leader('p1')]);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": choosing no target is allowed and nothing is boosted', () => {
    const g = defending();
    toCounter(g);
    useCounter(g, g.find('p1', 'hand', EV), g.leader('p1'));
    if (kind(g) === 'choose') chooseNone(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the Event is trashed after use and the opposing Characters are not offered as targets', () => {
    const g = defending();
    toCounter(g);
    useCounter(g, g.find('p1', 'hand', EV), g.leader('p1'));
    if (kind(g) === 'choose') {
      expect(choiceCards(g)).toEqual([VAN.marco, LEAD.shanks].sort());
      choose(g, [g.leader('p1')]);
    }
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV]);
  });

  it('it has no [Main] timing: it cannot be played in your own Main Phase', () => {
    const g = myTurn(
      side(LEAD.shanks, PURPLE, { hand: [EV], stage: STAGE5, costArea: { active: 3, rested: 0 } }),
      side(LEAD.luffy, RED),
    );
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', EV) })).toBe(false);
    expect(isLegal(g, { type: 'activate', card: g.find('p1', 'hand', EV), ability: 'x' })).toBe(
      false,
    );
  });
});

describe('OP18-074 [Trigger]: DON!! −1 → add up to 2 Stage cards from the trash to the hand', () => {
  /** Life top card is the Event; p2's Leader attack hits and the Trigger is offered. */
  function triggered(p1: Partial<PlayerSpec> = {}): TestGame {
    const g = theirTurn(
      side(LEAD.shanks, PURPLE, {
        life: [EV, PURPLE, PURPLE, PURPLE],
        trash: [STAGE5, VAN.sai, STAGE6],
        costArea: { active: 2, rested: 0 },
        ...p1,
      }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('happy path: activate, return 1 DON!!, take 2 Stages from the trash', () => {
    const g = triggered();
    expect(kind(g)).toBe('trigger');
    act(g, { type: 'trigger', activate: true });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 1, 'costActive');
    expect(choiceCards(g)).toEqual([STAGE5, STAGE6].sort());
    choose(g, [g.find('p1', 'trash', STAGE5), g.find('p1', 'trash', STAGE6)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([STAGE5, STAGE6].sort());
    expect(donOf(g, 'p1').deck).toBe(9);
    expect(g.life('p1')).toBe(3);
  });

  it('"up to 2": taking 1 Stage or none is allowed; the DON!! stays returned', () => {
    const g = triggered();
    act(g, { type: 'trigger', activate: true });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 1, 'costActive');
    choose(g, [g.find('p1', 'trash', STAGE6)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([STAGE6]);
    expect(sortedIds(g, 'p1', 'trash')).toContain(EV);
    expect(donOf(g, 'p1').deck).toBe(9);
  });

  it('not activating the Trigger: the Event goes to the hand, no DON!! returned, no Stage taken', () => {
    const g = triggered();
    act(g, { type: 'trigger', activate: false });
    expect(sortedIds(g, 'p1', 'hand')).toEqual([EV]);
    expect(donOf(g, 'p1').deck).toBe(8);
    expect(count(g, 'p1', 'trash')).toBe(3);
  });

  it('declining the optional DON!! −1 after activating returns nothing and takes nothing', () => {
    const g = triggered();
    act(g, { type: 'trigger', activate: true });
    if (offered(g, 'p1')) {
      decline(g);
      expect(donOf(g, 'p1').deck).toBe(8);
      expect(count(g, 'p1', 'hand')).toBe(0);
    } else {
      // Costs without "you may" are paid at once; then it must be a pick of DON!!, Stages or done.
      expect(decider(g)).toBe('p1');
    }
  });

  it('only Stage cards in your own trash are offered (not the Character)', () => {
    const g = triggered({ trash: [VAN.sai, STAGE1] });
    act(g, { type: 'trigger', activate: true });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 1, 'costActive');
    expect(choiceCards(g)).toEqual([STAGE1]);
  });
});
