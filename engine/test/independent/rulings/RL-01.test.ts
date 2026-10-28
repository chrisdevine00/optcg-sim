/**
 * RL-01 Simultaneous auto effects: who goes first, and where new triggers queue.
 * rulings.md RL-01. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-01: Simultaneous auto effects: who goes first, and where new triggers queue', () => {
  it.todo(
    "RL-01 (QA-OP10 OP10-042): Usopp's draw (pending) resolves before Rebecca's [On Play] (newly triggered) (needs M4 effects)",
  );
  it.todo(
    "RL-01 (QA-OP11 OP11-102): the turn player's simultaneous effect resolves before the non-turn player's (needs M4 effects)",
  );
});
