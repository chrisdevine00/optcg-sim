/**
 * OP16-055 Mr.2.Bon.Kurei(Bentham) (Character, Blue, cost 2, 1000, no Counter, {Impel Down}/{Former Baroque Works}).
 *
 * Card text: "[On Play] Draw 1 card. [DON!! x1] [When Attacking] This Character's base power becomes the
 * same as your opponent's Leader's power during this turn."
 *
 * Rules: CR 8-3-2-3 ([DON!! x1] must hold when the effect activates), CR 4-9-2 (base power),
 * CR 6-5-5-2 (given DON!! add +1000 only on their owner's turn, so on my turn the opposing Leader
 * has no DON!! bonus), CR 6-6-1-3 ("during this turn"), CR 7-1-4-1 (attacker wins on >=).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  at,
  backAtMain,
  BLUE,
  deck,
  fill,
  hand,
  kind,
  LDR,
  mine,
  noDefence,
  put,
  SCN,
  toMyNextMain,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BENTHAM = 'OP16-055';
const placed = (don: number) => ({ card: BENTHAM, don });

function attacking(
  don: number,
  p2Leader: string | { card: string; don: number } = LDR.luffy,
  target: 'leader' | string = 'leader',
): TestGame {
  const g = mine(
    LDR.luffy,
    {
      characters: [placed(don)],
      costArea: { active: 10 - don, rested: 0 },
    },
    target === 'leader' ? {} : { characters: [{ card: target, rested: true }] },
    p2Leader as string,
  );
  attack(
    g,
    at(g, 'p1', 'characters', BENTHAM),
    target === 'leader' ? g.leader('p2') : at(g, 'p2', 'characters', target),
  );
  return g;
}
const power = (g: TestGame) => g.power(at(g, 'p1', 'characters', BENTHAM));

describe("OP16-055 Mr.2.Bon.Kurei(Bentham): [On Play] draw 1; [DON!! x1] [When Attacking] base power becomes the opponent's Leader's power", () => {
  it('[On Play]: draws 1 card (mandatory)', () => {
    const g = mine(LDR.luffy, { hand: [BENTHAM], deck: [SCN.c7, ...fill(BLUE, 9)] });
    put(g, BENTHAM);
    expect(backAtMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c7]);
    expect(deck(g)).toHaveLength(9);
  });

  it('with 1 DON!! given, attacking a 5000 Leader: base power 5000, plus the DON!!’s 1000 = 6000', () => {
    const g = attacking(1);
    expect(kind(g)).toBe('block');
    expect(power(g)).toBe(6000);
  });

  it('the opponent’s Leader power is read as it is: a 6000 Leader ({Impel Down} Magellan) gives base 6000 (7000 with the DON!!)', () => {
    const g = attacking(1, LDR.impel);
    expect(power(g)).toBe(7000);
  });

  it('on my turn the opposing Leader’s own given DON!! add nothing (RD 82): still base 5000', () => {
    const g = attacking(1, { card: LDR.luffy, don: 3 });
    expect(power(g)).toBe(6000);
  });

  it('boundary: without a DON!! given the effect does not activate: power stays 1000', () => {
    const g = attacking(0);
    expect(power(g)).toBe(1000);
  });

  it('the new power wins the battle: 6000 K.O.s a rested 6000 Character (the attacker wins ties)', () => {
    const g = attacking(1, LDR.luffy, SCN.c4);
    expect(power(g)).toBe(6000);
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([SCN.c4]);
  });

  it('and the Leader takes the hit: 6000 vs 5000 removes 1 Life', () => {
    const g = attacking(1);
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('"during this turn": on my next turn it is back to 1000 base', () => {
    const g = attacking(1);
    noDefence(g);
    toMyNextMain(g);
    expect(power(g)).toBe(1000);
  });

  it('only when Bentham attacks: another Character’s attack changes nothing', () => {
    const g = mine(LDR.luffy, {
      characters: [placed(1), SCN.c3],
      costArea: { active: 9, rested: 0 },
    });
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(power(g)).toBe(2000);
  });
});
