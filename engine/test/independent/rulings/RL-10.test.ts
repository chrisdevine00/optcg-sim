/**
 * RL-10 "Until the start of your next turn".
 * rulings.md RL-10. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-10: "Until the start of your next turn"', () => {
  it.todo(
    "RL-10 (QA-OP06 OP06-074): Sabo's protection holds through the opponent's whole turn and ends at Refresh step 6-2-1 (needs M4 effects)",
  );
});
