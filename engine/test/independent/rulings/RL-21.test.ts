/**
 * RL-21 Banish.
 * rulings.md RL-21 (CR 10-1-3-1, 7-1-4-1-1-3, 4-6-3-1; QA-GR; QA-OP06 OP06-002, OP06-083).
 *
 * Attacker: OP17-065 Queen (Purple, 10000, [Banish]) on the field from the start, so its [On Play]
 * never runs; p1 Leader ST04-001 (Purple). p2's top Life card OP01-104 Speed has
 * "[Trigger] Play this card."
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { attack, decision, FILL, fill, K, L, noDefence, TRIGGER_SPEED } from '../helpers.ts';

describe('RL-21: Banish', () => {
  it('RL-21: the Life card is trashed, no [Trigger] decision, hand unchanged', () => {
    const g = scenario({
      p1: {
        leader: L.purpleKaido,
        characters: [K.banishQueen],
        life: fill(FILL.purple, 5),
        deck: fill(FILL.purple, 10),
      },
      p2: {
        leader: L.purpleKaido,
        hand: [FILL.purple],
        life: [TRIGGER_SPEED, TRIGGER_SPEED, FILL.purple],
        deck: fill(FILL.purple, 10),
      },
    });
    attack(g, g.find('p1', 'characters', K.banishQueen), g.leader('p2'));
    noDefence(g);
    // No `trigger` decision: straight back to p1's Main Phase.
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
    expect(g.life('p2')).toBe(2);
    expect(g.zone('p2', 'hand').map((c) => c.card)).toEqual([FILL.purple]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([TRIGGER_SPEED]);
  });

  it.todo(
    'RL-21: Banish with a Double Attack modifier trashes two Life cards with no [Trigger] (needs M4 effects: OP09-062 Leader plus a Double Attack grant)',
  );
  it.todo(
    'RL-21 (QA-OP06 OP06-002): Inazuma countered below 7000 loses Banish; the hit is a normal Life-to-hand (needs M4 effects)',
  );
  it.todo('RL-21 (QA-EB03 EB03-055): Banish does not apply to effect damage (needs M4 effects)');
});
