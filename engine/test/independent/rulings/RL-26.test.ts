/**
 * RL-26 Deck-out.
 * rulings.md RL-26 (CR 1-2-1-1-2, 1-3-2, 9-1-2, 9-2-1-2, 11-3-2; Rule Manual p.7).
 *
 * Without effects the deck can only empty in the Draw Phase. Leaders ST01-001 and ST04-001
 * ([Activate: Main] only); deck cards are vanilla fillers.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { decision, endTurn, FILL, fill, L, result } from '../helpers.ts';

describe('RL-26: deck-out', () => {
  it('RL-26: a player loses the moment their deck reaches 0, not when they next fail to draw', () => {
    const g = scenario({
      p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: [FILL.purple] },
    });
    endTurn(g);
    expect(g.zone('p2', 'deck')).toHaveLength(0);
    expect(result(g)).toMatchObject({ winner: 'p1' });
    // p2 never reaches its Main Phase.
    expect(decision(g)).toBeNull();
  });

  it.todo(
    'RL-26 (a) QA-ST01–04 ST03-005: Mihawk’s draw 2 with 1 card draws it and loses before the Block Step (needs M4 effects)',
  );
  it.todo(
    'RL-26 (b) QA-PROMO P-033: a cost that adds to the deck counts before the draw (needs M4 effects)',
  );
  it.todo('RL-26 (c) QA-OP01 OP01-016: looking at the deck does not empty it (needs M4 effects)');
  it.todo(
    'RL-26: OP03-040 Nami wins instead; OP15-022 Brook loses at end of turn; negated Leader → loses (needs M4 effects)',
  );
});
