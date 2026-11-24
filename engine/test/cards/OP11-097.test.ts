/** OP11-097 After All These Years I'm Losing My Edge!!! (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  dec,
  endCounter,
  expectDecision,
  hand,
  none,
  pick,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { canPick, counterStep, NAVY_B3, NAVY_B4, rep, useCounter } from './helpers-op11g3.ts';

const ID = 'OP11-097';

describe("OP11-097 After All These Years I'm Losing My Edge!!!", () => {
  /** p1 defends with the Event in hand; `trash` is p1's trash before the Event is used. */
  const start = (trash: string[], chars: string[] = []) =>
    counterStep(
      {
        leader: PLAIN_BLUE,
        hand: [ID],
        characters: chars,
        trash,
        costArea: { active: 3, rested: 0 },
      },
      {},
      V.c3,
    );

  it('[Counter]: +1000 power to your Leader during this battle', () => {
    const g = start([]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    endCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(3); // 6000 stops the 5000 attacker
  });

  it('can target one of your Characters instead', () => {
    const g = start([], [V.c2]);
    useCounter(g, ID);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with 10 cards in the trash (the Event counts itself, 9 + 1): add up to 1 black Character with cost 3 or less from the trash', () => {
    const g = start([NAVY_B3, NAVY_B4, BLUE, ...rep(6, PURPLE)]);
    expect(g.zone('p1', 'trash')).toHaveLength(9);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', NAVY_B3))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', NAVY_B4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p1', 'trash', BLUE))).toBe(false); // not black
    pick(g, [g.find('p1', 'trash', NAVY_B3)]);
    expect(hand(g, 'p1')).toEqual([NAVY_B3]);
    expect(dec(g)?.kind).toBe('counter');
  });

  it('with only 9 cards in the trash after the Event resolves, nothing is added', () => {
    const g = start([NAVY_B3, ...rep(7, PURPLE)]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).toBe('counter');
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"up to 1": the black Character may be declined', () => {
    const g = start([NAVY_B3, ...rep(8, PURPLE)]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'trash')).toHaveLength(10);
  });

  it('the power part is "up to 1": with no target chosen the trash part still happens', () => {
    const g = start([NAVY_B3, ...rep(8, PURPLE)]);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    pick(g, [g.find('p1', 'trash', NAVY_B3)]);
    expect(hand(g, 'p1')).toEqual([NAVY_B3]);
  });
});
