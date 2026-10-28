/**
 * RL-45 OP17-058 Kaido: two timings, one use per turn.
 * rulings.md RL-45. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-45: OP17-058 Kaido: two timings, one use per turn', () => {
  it.todo(
    'RL-45 (QA-OP17 OP17-058): declining on one attack keeps the use for a later attack that turn (needs M4 effects)',
  );
});
