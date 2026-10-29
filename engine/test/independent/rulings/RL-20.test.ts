/**
 * RL-20 Double Attack: Trigger step, fixed damage, 1 Life.
 * rulings.md RL-20 (CR 7-1-4-1-1-1..7-1-4-1-1-3, 10-1-2-1; QA-GR Double Attack rows).
 *
 * Attacker: OP13-118 Monkey.D.Luffy (Green, 7000, [Double Attack]), on the field from the start so
 * its [On Play] never runs; p1 Leader ST02-001 (Green). Defender Leader ST04-001 (5000).
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { attack, decision, FILL, fill, K, L, noDefence, result } from '../helpers.ts';

function g0(p2Life: string[]) {
  return scenario({
    p1: {
      leader: L.greenKid,
      characters: [K.doubleLuffy],
      life: fill(FILL.green, 5),
      deck: fill(FILL.green, 10),
    },
    p2: { leader: L.purpleKaido, life: p2Life, deck: fill(FILL.purple, 10) },
  });
}

describe('RL-20: Double Attack', () => {
  it('RL-20 (a) QA-GR: against 1 Life, Double Attack takes it; result is null and the battle ends normally', () => {
    const g = g0([FILL.purple]);
    attack(g, g.find('p1', 'characters', K.doubleLuffy), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(0);
    expect(result(g)).toBeNull();
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
  });

  it('RL-20 (c): against 0 Life, Double Attack wins at once', () => {
    const g = g0([]);
    attack(g, g.find('p1', 'characters', K.doubleLuffy), g.leader('p2'));
    noDefence(g);
    expect(result(g)).toMatchObject({ winner: 'p1' });
  });

  it('RL-20: with 2 or more Life, both points move a Life card to hand', () => {
    const g = g0(fill(FILL.purple, 2));
    attack(g, g.find('p1', 'characters', K.doubleLuffy), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(0);
    expect(g.zone('p2', 'hand')).toHaveLength(2);
    expect(result(g)).toBeNull();
  });

  it.todo(
    'RL-20 (b) QA-OP03 OP03-118: a [Trigger] from the first point resolves before the second point, which takes the Life card it added (needs M4 effects)',
  );
  it.todo(
    'RL-20 (QA-GR): damage stays 2 if the attacker leaves or loses Double Attack during the first [Trigger] (needs M4 effects)',
  );
  it.todo(
    'RL-20 (QA-ST06 ST06-004): Double Attack lost before the Damage Step → 1 damage (needs M4 effects)',
  );
  it.todo(
    'RL-20 (QA-OP03 OP03-043): "when you deal damage" activates once per attack, not per point (needs M4 effects)',
  );
});
