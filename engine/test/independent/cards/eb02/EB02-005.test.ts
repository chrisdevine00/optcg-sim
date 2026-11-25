/**
 * EB02-005 Fake Straw Hat Crew (Character, Red, cost 2, 3000, no Counter, {Fake Straw Hat Crew}).
 *
 * Card text: "[Your Turn] This Character gains +2000 power.
 * [Opponent's Turn] Give this Character −2000 power."
 * (The minus sign is a verified override of an upstream defect.)
 *
 * Rules: rules-digest 82 (given DON!! add +1000 only on their owner's turn), CR 7-1-3 (a defender
 * is K.O.'d when the attacker's power is equal to or greater).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  E2C,
  E2L,
  endTurn,
  mine,
  need,
  noDefence,
  passBlock,
  passCounter,
  theirs,
} from './kit-eb02a.ts';

const FAKE = 'EB02-005';

describe('EB02-005 Fake Straw Hat Crew: +2000 on my turn, −2000 on the opponent’s turn', () => {
  it('on my turn it has 3000 + 2000', () => {
    const g = mine(E2L.shc, { characters: [FAKE] });
    expect(g.power(g.find('p1', 'characters', FAKE))).toBe(5000);
  });

  it('on the opponent’s turn it has 3000 − 2000', () => {
    const g = theirs(E2L.shc, { characters: [FAKE] });
    expect(g.power(g.find('p1', 'characters', FAKE))).toBe(1000);
  });

  it('the power changes when the turn passes (5000 in my Main Phase, 1000 in the opponent’s)', () => {
    const g = mine(E2L.shc, { characters: [FAKE] });
    const fake = g.find('p1', 'characters', FAKE);
    expect(g.power(fake)).toBe(5000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(fake)).toBe(1000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(fake)).toBe(5000);
  });

  it('a given DON!! adds +1000 on my turn only (6000 on my turn, 1000 on the opponent’s)', () => {
    const g = mine(E2L.shc, {
      characters: [{ card: FAKE, don: 1 }],
      costArea: { active: 9, rested: 0 },
    });
    const fake = g.find('p1', 'characters', FAKE);
    expect(g.power(fake)).toBe(6000);
    endTurn(g);
    expect(g.power(fake)).toBe(1000);
  });

  it('on my turn the 5000 power beats a 5000-power Leader in battle (it deals damage)', () => {
    const g = mine(E2L.shc, { characters: [FAKE] }, {});
    const lifeBefore = g.life('p2');
    attack(g, g.find('p1', 'characters', FAKE), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(lifeBefore - 1);
  });

  it('on the opponent’s turn it is K.O.’d by a 1000-power attacker (a 3000-power Character would survive)', () => {
    const g = theirs(
      E2L.shc,
      { characters: [{ card: FAKE, rested: true }] },
      { characters: [E2C.gaimon] },
    );
    const fake = g.find('p1', 'characters', FAKE);
    expect(g.power(fake)).toBe(1000);
    attack(g, g.find('p2', 'characters', E2C.gaimon), fake);
    passBlock(g);
    passCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(FAKE);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(FAKE);
  });

  it('when I attack a rested 5000-power Character the Fake ties at 5000 and K.O.s it (attacker wins ties)', () => {
    const g = mine(
      E2L.shc,
      { characters: [FAKE] },
      { characters: [{ card: E2C.marco, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', FAKE), g.find('p2', 'characters', E2C.marco));
    passBlock(g);
    passCounter(g);
    expect(g.zone('p2', 'characters').map((c) => c.card)).not.toContain(E2C.marco);
  });
});
