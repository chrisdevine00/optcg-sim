/** OP12-018 Color of the Supreme King Haki. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, endCounter, expectDecision, pick, V } from './helpers.ts';
import { cardsOf, counterStep, donArea, SHC, SHC_LEADER, useCounter } from './helpers-luffyace.ts';

const ID = 'OP12-018';
const RAYLEIGH = 'OP12-001'; // Leader [Silvers Rayleigh]

/** The DON!! to rest are chosen by class (E-D4); with 2 active, which one is asked. */
const restOneDon = (g: ReturnType<typeof counterStep>) =>
  g.act({ type: 'pick', choice: { from: 'costActive' } });

describe('OP12-018 Color of the Supreme King Haki', () => {
  const start = (leader = RAYLEIGH, active = 2) =>
    counterStep(
      { leader, hand: [ID], characters: [SHC.franky4], ...donArea(active) },
      { characters: [V.c2] },
      V.c5,
    );

  it('[Counter]: up to 1 of your Characters or [Silvers Rayleigh] gains +2000 power during this battle', () => {
    const g = start();
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    // The Rayleigh Leader and the Character are candidates.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    decline(g);
    endCounter(g);
    // 7000 against 7000: the attacker wins ties, so the hit lands.
    expectDecision(g, 'trigger', 'p1');
  });

  it('[Counter]: a Leader that is not [Silvers Rayleigh] cannot be chosen; a Character can', () => {
    const g = start(SHC_LEADER);
    useCounter(g, ID);
    const franky = g.find('p1', 'characters', SHC.franky4);
    // Only one candidate and "up to 1": still asked, and the Leader is not offered.
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === g.leader('p1'))).toBe(false);
    pick(g, [franky]);
    expect(g.power(franky)).toBe(8000);
  });

  it("[Counter]: you may rest 1 DON!!. If you do, your opponent's Leader and all their Characters get -1000 power during this turn", () => {
    const g = start();
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    accept(g);
    restOneDon(g);
    expect(don(g, 'p1').rested).toBe(1);
    expect(g.power(g.leader('p2'))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(3000);
    // The -1000 is "during this turn", not just the battle: it outlasts the Counter Step.
    endCounter(g);
    expect(g.power(g.leader('p2'))).toBe(4000);
    // The attacker (now 6000) loses to the Leader (7000).
    expect(g.life('p1')).toBe(3);
  });

  it('[Counter]: declining the rest gives no -1000', () => {
    const g = start();
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    decline(g);
    expect(don(g, 'p1').rested).toBe(0);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('[Counter]: with no active DON!! "if you do" is false and nothing is asked', () => {
    const g = start(RAYLEIGH, 0);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expectDecision(g, 'counter', 'p1');
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Counter]: "Then" is not an "if": with no card chosen for the boost the DON!! may still be rested', () => {
    const g = start();
    useCounter(g, ID);
    g.act({ type: 'done' });
    accept(g);
    restOneDon(g);
    expect(g.power(g.leader('p2'))).toBe(4000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
