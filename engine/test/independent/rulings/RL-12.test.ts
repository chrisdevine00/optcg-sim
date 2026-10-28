/**
 * RL-12 Continuous effects outlive their source; the moved card loses them.
 * rulings.md RL-12. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-12: Continuous effects outlive their source; the moved card loses them', () => {
  it.todo(
    'RL-12: a resolved "+2000 during this turn" survives its source being bounced (needs M4 effects)',
  );
  it.todo(
    'RL-12 (CR 3-1-6): a Character returned to hand loses its "−2 cost" modifier (needs M4 effects)',
  );
});
