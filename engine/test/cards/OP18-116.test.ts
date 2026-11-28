/** OP18-116 Iron Body Empty Tree. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, expectDecision, hand, pick, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { CP_L, trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-116';
const counter = (handCards: string[] = [BLUE]) =>
  counterStep({ leader: CP_L, hand: [ID, ...handCards], characters: [V.c2] });

describe('OP18-116 Iron Body Empty Tree', () => {
  it('[Counter] trash 1 card from your hand: your Leader gains +3000 power during this battle', () => {
    const g = counter();
    const before = g.power(g.leader('p1'));
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(before! + 3000);
    expect(zoneOf(g, 'p1', 'trash').sort()).toEqual([BLUE, ID].sort());
  });

  it('may target a Character instead', () => {
    const g = counter();
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true);
    const before = g.power(g.find('p1', 'characters', V.c2));
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(before! + 3000);
  });

  it('"you may": declining trashes nothing and gives no power', () => {
    const g = counter();
    const before = g.power(g.leader('p1'));
    useCounter(g, ID);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(before);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expectDecision(g, 'counter', 'p1');
  });

  it('with no other card in hand the cost cannot be paid', () => {
    const g = counter([]);
    useCounter(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it("[Trigger] with a {CP} Leader: rests up to 1 of the opponent's Characters (any cost)", () => {
    const g = trig(ID, {}, [V.c6]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
  });

  it('[Trigger] without a {CP} Leader nothing happens', () => {
    const g = trig(ID, { leader: 'ST04-001' }, [V.c6]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
  });
});
