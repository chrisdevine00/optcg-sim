/** OP17-017 Ga Ha Ha Ha!! */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, pick, V } from './helpers.ts';
import { counterStep, donArea, SHC, useCounter, WHITEBEARD } from './helpers-luffyace.ts';

const ID = 'OP17-017';
const NEWGATE = 'OP02-001'; // Leader, 6000, {The Four Emperors}{Whitebeard Pirates}
const ALLY = 'EB01-005'; // Doma, {Whitebeard Pirates Allies}: a type "including" Whitebeard Pirates

describe('OP17-017 Ga Ha Ha Ha!!', () => {
  const start = () =>
    counterStep(
      { leader: NEWGATE, hand: [ID], characters: [WHITEBEARD, ALLY, SHC.franky4], ...donArea(1) },
      { characters: [V.c2] },
      V.c5,
    );

  it('[Counter]: +2000 to a Leader or Character with a type including "Whitebeard Pirates" during this battle', () => {
    const g = start();
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Candidates: the Leader, the Whitebeard Character and the "Allies" one; not the Straw Hat one.
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered.sort()).toEqual(
      [
        g.leader('p1'),
        g.find('p1', 'characters', WHITEBEARD),
        g.find('p1', 'characters', ALLY),
      ].sort(),
    );
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.power(g.find('p1', 'characters', SHC.franky4))).toBe(6000);
  });

  it("[Counter]: then -2000 to up to 1 of your opponent's Leader or Characters during this turn", () => {
    const g = start();
    useCounter(g, ID);
    pick(g, [g.find('p1', 'characters', WHITEBEARD)]);
    expect(g.power(g.find('p1', 'characters', WHITEBEARD))).toBe(8000);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(1);
    // The opposing Leader and both Characters are candidates.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    const attacker = g.find('p2', 'characters', V.c5);
    pick(g, [attacker]);
    expect(g.power(attacker)).toBe(5000);
    expect(g.power(g.leader('p2'))).toBe(5000);
    // The attacker (now 5000) bounces off the Leader (6000); the -2000 lasts the whole turn.
    endCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(attacker)).toBe(5000);
  });

  it('[Counter]: "Then" is not an "if": with no card chosen for the boost the -2000 is still given', () => {
    const g = start();
    useCounter(g, ID);
    g.act({ type: 'done' });
    pick(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('[Counter]: the -2000 may be declined ("up to")', () => {
    const g = start();
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    g.act({ type: 'done' });
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});
