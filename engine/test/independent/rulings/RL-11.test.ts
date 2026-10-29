/**
 * RL-11 Durations that reach into the next turn.
 * rulings.md RL-11. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-11: Durations that reach into the next turn', () => {
  it.todo(
    "RL-11: OP17-043 Ganzui's base 6000 lasts until the opponent's End Phase step 6-6-1-2 (2) (needs M4 effects)",
  );
  it.todo(
    'RL-11 (QA-ST10 ST10-016, QA-OP09 OP09-093): "until the end of your (opponent\'s) next turn" (needs M4 effects)',
  );
});
