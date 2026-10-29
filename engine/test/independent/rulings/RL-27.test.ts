/**
 * RL-27 Simultaneous defeat and rule-processing granularity.
 * rulings.md RL-27. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-27: Simultaneous defeat and rule-processing granularity', () => {
  it.todo(
    'RL-27 [open-question Q5]: "each player draws 1" with 1 card each → the turn player loses before the other draws (needs M4 effects)',
  );
  it.todo(
    "RL-27 [open-question Q4]: an atomic step that empties both decks → { draw: 'bothLost' } (needs M4 effects or a scripted test op; not reachable through the public API)",
  );
  it.todo(
    'RL-27 [open-question Q4]: with a single-elimination option, a simultaneous loss goes to the turn player (no such option in GameSetup yet)',
  );
});
