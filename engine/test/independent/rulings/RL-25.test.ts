/**
 * RL-25 [Trigger] costs nothing but its own activation cost; the card is in no area.
 * rulings.md RL-25. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-25: [Trigger] costs nothing but its own activation cost; the card is in no area', () => {
  it.todo(
    'RL-25 [open-question Q8] (QA-OP04 OP04-064): the [Trigger] is offered with 0 active DON!!; DON!! −2 is the only payment (needs M4 effects)',
  );
  it.todo(
    'RL-25 (CR 10-1-5-3): the Trigger card is in no area while it resolves; zone counts still hold (needs M4 effects)',
  );
});
