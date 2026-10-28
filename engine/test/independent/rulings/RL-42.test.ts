/**
 * RL-42 OP05-098 Enel: Life reaches 0 on the opponent's turn.
 * rulings.md RL-42. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe("RL-42: OP05-098 Enel: Life reaches 0 on the opponent's turn", () => {
  it.todo(
    'RL-42 (QA-OP05 OP05-098): Double Attack at 1 Life → both points, then Enel adds 1 Life and trashes 1 (needs M4 effects)',
  );
});
