/** EB05-013 Shirley. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  decline,
  dec,
  don,
  endCounter,
  expectDecision,
  game,
  passBlock,
  payDon,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  takeDamage,
  V,
} from './helpers.ts';

const ID = 'EB05-013';
/** OP11-022 Shirahoshi Leader ({Merfolk}, 5000) and OP03-022 Arlong Leader ({Fish-Man}, 5000). */
const MERFOLK = 'OP11-022';
const FISHMAN = 'OP03-022';

/** p2 attacks p1's Leader with a 6000 Character (V.c4); p1's [On Your Opponent's Attack] is next. */
const attack = (p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] }, attackers = 1) => {
  const g = game(
    { characters: [ID], costArea: { active: 2, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, characters: Array.from({ length: attackers }, () => V.c4) },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
  return g;
};

describe('EB05-013 Shirley', () => {
  it("[On Your Opponent's Attack] [Once Per Turn]: rest 1 DON!!: your {Merfolk} Leader gains +2000 power during this battle", () => {
    const g = attack({ leader: MERFOLK });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    payDon(g);
    // No pick: the boost is mandatory (review EB05-R1).
    expect(don(g, 'p1').active).toBe(1);
    expect(don(g, 'p1').rested).toBe(1);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 7000 stops the 6000 attacker
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('works for a {Fish-Man} type Leader as well', () => {
    const g = attack({ leader: FISHMAN });
    accept(g);
    payDon(g);
    // No pick: the boost is mandatory (review EB05-R1).
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('declining the optional cost rests no DON!! and gives no power', () => {
    const g = attack({ leader: MERFOLK });
    decline(g);
    expect(don(g, 'p1').rested).toBe(0);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    endCounter(g);
    takeDamage(g);
    expect(g.life('p1')).toBe(2);
  });

  it('a Leader of neither type gains nothing', () => {
    const g = attack({ leader: PLAIN_PURPLE });
    // The type check is on the target, so the cost can still be paid; no Leader qualifies.
    accept(g);
    payDon(g);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('is Once Per Turn: it is not offered on the opponent’s second attack that turn', () => {
    const g = attack({ leader: MERFOLK, life: [V.c1, V.c1, V.c1, V.c1] }, 2);
    accept(g);
    payDon(g);
    // No pick: the boost is mandatory (review EB05-R1).
    passBlock(g);
    endCounter(g);
    const second = g.find('p2', 'characters', V.c4, 1);
    g.act({ type: 'attack', attacker: second, target: g.leader('p1') });
    expect(dec(g)?.kind).not.toBe('optional');
  });
});
