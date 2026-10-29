/**
 * RL-22 Effect damage and the 0-Life loss.
 * rulings.md RL-22. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-22: Effect damage and the 0-Life loss', () => {
  it.todo('RL-22 (QA-EB03 EB03-055): 1 effect damage at 0 Life wins (needs M4 effects)');
  it.todo(
    'RL-22 (OP06-116 Reject): effect damage taking the last Life card does not defeat (needs M4 effects)',
  );
  it.todo(
    'RL-22 [open-question Q3]: effect damage of 2 at 1 Life defeats on the second point (needs M4 effects)',
  );
});
