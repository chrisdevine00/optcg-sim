/**
 * RL-17 Attack targets: rested Characters only; attacking again.
 * rulings.md RL-17 (CR 7-1, 7-1-1-1, 7-1-1-2, 6-5-2).
 *
 * Position: p1's turn 3. p2 has an active OP01-103 Scratchmen Apoo (A) and a rested OP02-080
 * Dobon (R), both vanilla.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { attack, attackTargets, canAttack, FILL, fill, L, noDefence, V, why } from '../helpers.ts';

function g0() {
  return scenario({
    p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
    p2: {
      leader: L.purpleKaido,
      characters: [V.apoo, { card: V.dobon, rested: true }],
      life: fill(FILL.purple, 5),
      deck: fill(FILL.purple, 10),
    },
  });
}

describe('RL-17: attack targets', () => {
  it('RL-17: the Leader may attack the opponent’s Leader or the rested Character only', () => {
    const g = g0();
    const r = g.find('p2', 'characters', V.dobon);
    expect(attackTargets(g, g.leader('p1'))).toEqual([g.leader('p2'), r].sort());
  });

  it('RL-17: whyNot for attacking an active Character cites CR 7-1-1-2', () => {
    const g = g0();
    const a = g.find('p2', 'characters', V.apoo);
    const reason = why(g, 'p1', { type: 'attack', attacker: g.leader('p1'), target: a });
    expect(reason).not.toBeNull();
    expect(reason?.rule).toContain('7-1-1-2');
  });

  it('RL-17: an attacker is rested by its attack, so it cannot attack again without being set active', () => {
    const g = g0();
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(canAttack(g, g.leader('p1'), g.leader('p2'))).toBe(false);
  });

  it.todo(
    'RL-17 (QA-ST01–04 ST02-001, ST02-009): a Leader or Character set active again by an effect may attack again (needs M4 effects)',
  );
  it.todo(
    'RL-17 (QA-OP11 OP11-119, OP11-010): permission to attack active Characters keeps other restrictions (needs M4 effects)',
  );
  it.todo(
    'RL-17 (QA-GR "cannot be rested"): a card that cannot be rested cannot attack (needs M4 effects)',
  );
});
