/**
 * RL-09 "During this turn", "until the end of the turn" and [End of Your Turn].
 * rulings.md RL-09. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-09: "During this turn", "until the end of the turn" and [End of Your Turn]', () => {
  it.todo(
    'RL-09 (QA-OP10 OP10-003): Sugar\'s [End of Your Turn] sees "+2000 during this turn" before it expires (needs M4 effects)',
  );
  it.todo(
    'RL-09: "until the end of the turn" expires at 6-6-1-2, before "during this turn" at 6-6-1-3 (needs M4 effects)',
  );
});
