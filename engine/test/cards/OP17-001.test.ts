/** OP17-001 Edward.Newgate (Leader). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  expectDecision,
  hand,
  passBlock,
  pick,
  trash,
  V,
} from './helpers.ts';
import { ATMOS, oppAttack } from './helpers-op17g1.ts';

const ID = 'OP17-001';
const attack = (handCards: string[] = [V.c1, V.c2]) =>
  oppAttack({ leader: ID, hand: handCards, characters: [ATMOS] });

describe('OP17-001 Edward.Newgate', () => {
  it("[On Your Opponent's Attack] trash 1 card: your Leader gains +4000 power during this battle", () => {
    const g = attack();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.leader('p1')]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    passBlock(g);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 beats the 6000 attacker
    expect(g.power(g.leader('p1'))).toBe(5000); // the boost ended with the battle
  });

  it('may give the +4000 to one of your Characters instead ("up to 1 of your Leader or Characters")', () => {
    const g = attack();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    const atmos = g.find('p1', 'characters', ATMOS);
    pick(g, [atmos]);
    expect(g.power(atmos)).toBe(10000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the cost trashes nothing and boosts nothing', () => {
    const g = attack();
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'block', 'p1');
  });

  it('is not offered with an empty hand (the cost cannot be paid)', () => {
    const g = attack([]);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it('is Once Per Turn: a second attack in the same turn offers nothing', () => {
    const g = oppAttack({ leader: ID, hand: [V.c1, V.c2, V.c3] }, { characters: [V.c4] });
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    endCounter(g);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c4, 1),
      target: g.leader('p1'),
    });
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});
