/** OP04-016 Bad Manners Kick Course. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  hand,
  pick,
  PURPLE,
  V,
} from './helpers.ts';
import { damageWith } from './triggers.ts';
import { cardsOf, counterStep, SHC, SHC_LEADER, useCounter } from './helpers-luffyace.ts';

const ID = 'OP04-016';

describe('OP04-016 Bad Manners Kick Course', () => {
  const start = (hand = [ID, BLUE]) =>
    counterStep({ leader: SHC_LEADER, hand, characters: [SHC.franky4] }, {}, V.c5);

  it('[Counter]: you may trash 1 card from your hand: your Leader gains +3000 power during this battle', () => {
    const g = start();
    useCounter(g, ID);
    accept(g);
    // The only other card in hand is trashed (a hidden pool, so the choice is asked).
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(cardsOf(g, 'p1', 'trash').sort()).toEqual([BLUE, ID].sort());
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(1);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 8000 stops the 7000 attacker
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter]: may go to a Character instead of the Leader', () => {
    const g = start();
    useCounter(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    const franky = g.find('p1', 'characters', SHC.franky4);
    pick(g, [franky]);
    expect(g.power(franky)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter]: declining the optional cost keeps both cards and gives no power', () => {
    const g = start();
    useCounter(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Counter]: with no other card in hand the cost cannot be paid', () => {
    const g = start([ID]);
    useCounter(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("[Trigger]: give up to 1 of your opponent's Leader or Character cards -3000 power during this turn", () => {
    const g = damageWith(ID, { deck: [PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    // The opposing Leader and the attacking Character are the candidates.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    const attacker = g.find('p2', 'characters', V.c7);
    const before = g.power(attacker)!;
    pick(g, [attacker]);
    expect(g.power(attacker)).toBe(before - 3000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});
