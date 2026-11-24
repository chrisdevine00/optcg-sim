/**
 * OP14-036 Strive to Surpass me, Roronoa Zoro!!! (Event, Green, cost 1, {The Seven Warlords of the Sea}/{East Blue}).
 *
 * Card text: "[Counter] You may rest 1 of your cards: Up to 1 of your Leader or Character cards gains
 * +4000 power during this battle.
 * [Trigger] You may rest 1 of your cards: Rest up to 1 of your opponent's Characters with 7000 base
 * power or less."
 *
 * Rules: CR 8-3-1 (a cost is paid in full or not at all), CR 7-1-5-3 (battle durations), CR 4-8-1
 * ("up to" allows 0), RD 93 (Event [Counter]), M4b-1 (a "card" to rest includes DON!!).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  activateTrigger,
  BLUE,
  C14,
  canCounterWith,
  canFinish,
  choices,
  choose,
  declineTrigger,
  hand,
  hitLeader,
  inst,
  kind,
  L14,
  mustBeUnpayable,
  need,
  offeredNow,
  rested,
  restPick,
  settle,
  theirs,
  useCounter,
} from './kit-op14b.ts';

const EVT = 'OP14-036';

/** p2's Leader (5000) attacks p1's Leader; p1 reaches the Counter Step holding the Event. */
function counterStep(
  p1: Parameters<typeof theirs>[1],
  p2: Parameters<typeof theirs>[2] = {},
): TestGame {
  const g = theirs(L14.luffy, { hand: [EVT], ...p1 }, p2);
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}
const evt = (g: TestGame) => inst(g, 'p1', 'hand', EVT);

describe('OP14-036 Strive to Surpass me, Roronoa Zoro!!!: [Counter] rest 1 card: +4000; [Trigger] rest 1 card: rest a Character', () => {
  it('[Counter] paying with a Character: the Leader gets +4000 during the battle and the 5000 attack fails', () => {
    const g = counterStep({ costArea: { active: 1, rested: 0 }, characters: [C14.marco] });
    useCounter(g, evt(g), g.leader('p1'));
    restPick(g, inst(g, 'p1', 'characters', C14.marco));
    expect(rested(g, inst(g, 'p1', 'characters', C14.marco))).toBe(true);
    if (kind(g) === 'choose') choose(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });

  it('[Counter] the +4000 ends with the battle', () => {
    const g = counterStep({ costArea: { active: 1, rested: 0 }, characters: [C14.marco] });
    useCounter(g, evt(g), g.leader('p1'));
    restPick(g, inst(g, 'p1', 'characters', C14.marco));
    if (kind(g) === 'choose') choose(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter] a Character can receive the +4000 instead: a rested 5000 Character survives a 5000 attack', () => {
    const g = theirs(
      L14.luffy,
      {
        hand: [EVT],
        costArea: { active: 1, rested: 0 },
        characters: [{ card: C14.marco, rested: true }],
      },
      {},
    );
    attack(g, g.leader('p2'), inst(g, 'p1', 'characters', C14.marco));
    passBlock(g);
    useCounter(g, evt(g), inst(g, 'p1', 'characters', C14.marco));
    settle(g, { cost: g.leader('p1'), target: inst(g, 'p1', 'characters', C14.marco) });
    expect(g.power(inst(g, 'p1', 'characters', C14.marco))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([C14.marco]);
  });

  it('[Counter] the cost may be paid by a spare DON!! card (a DON!! card is one of "your cards")', () => {
    const g = counterStep({ costArea: { active: 2, rested: 0 } });
    useCounter(g, evt(g), g.leader('p1'));
    need(g, 'choose', 'p1');
    const d = g.legal().filter((a) => a.type === 'pick');
    expect(d.some((a) => typeof a.choice === 'object' && 'from' in a.choice)).toBe(true);
    act(g, { type: 'pick', choice: { from: 'costActive' } });
    if (kind(g) === 'choose') choose(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('[Counter] the targets are only your Leader and Characters, and "up to 1" can be nothing', () => {
    const g = counterStep(
      { costArea: { active: 1, rested: 0 }, characters: [C14.marco] },
      { characters: [C14.kingdew] },
    );
    useCounter(g, evt(g), g.leader('p1'));
    restPick(g, inst(g, 'p1', 'characters', C14.marco));
    need(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual(
      [g.leader('p1'), inst(g, 'p1', 'characters', C14.marco)].sort(),
    );
    expect(canFinish(g)).toBe(true);
  });

  it('[Counter] with nothing left to rest the cost cannot be paid: no +4000', () => {
    const g = theirs(
      { card: L14.luffy, rested: true } as unknown as string,
      { hand: [EVT], costArea: { active: 1, rested: 0 } },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    if (canCounterWith(g, evt(g))) {
      act(
        g,
        g
          .legal()
          .find((a) => (a.type === 'activate' || a.type === 'counter') && a.card === evt(g))!,
      );
      mustBeUnpayable(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger] rests an opposing Character: 7000 base power is allowed, 8000 is not offered', () => {
    const g = theirs(
      L14.luffy,
      { life: [EVT, BLUE, BLUE, BLUE], characters: [C14.marco] },
      { characters: [C14.kingdew, C14.thatch] },
    );
    hitLeader(g);
    activateTrigger(g);
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
    restPick(g, inst(g, 'p1', 'characters', C14.marco));
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.kingdew]);
    choose(g, [inst(g, 'p2', 'characters', C14.kingdew)]);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', C14.thatch))).toBe(false);
    expect(hand(g)).toEqual([]);
  });

  it('[Trigger] "up to 1": may rest nothing, and then nothing is rested', () => {
    const g = theirs(
      L14.luffy,
      { life: [EVT, BLUE, BLUE, BLUE], characters: [C14.marco] },
      { characters: [C14.kingdew] },
    );
    hitLeader(g);
    activateTrigger(g);
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
    restPick(g, inst(g, 'p1', 'characters', C14.marco));
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(false);
  });

  it('[Trigger] with every card of yours rested the cost cannot be paid: nothing is rested', () => {
    const g = theirs(
      { card: L14.luffy, rested: true } as unknown as string,
      { life: [EVT, BLUE, BLUE, BLUE] },
      { characters: [C14.kingdew] },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    if (g.legal().some((a) => a.type === 'trigger' && a.activate)) {
      activateTrigger(g);
      mustBeUnpayable(g);
    } else {
      declineTrigger(g);
    }
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(false);
  });

  it('[Trigger] declining to activate sends the card to hand and rests nothing', () => {
    const g = theirs(
      L14.luffy,
      { life: [EVT, BLUE, BLUE, BLUE], characters: [C14.marco] },
      { characters: [C14.kingdew] },
    );
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([EVT]);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(false);
  });
});
