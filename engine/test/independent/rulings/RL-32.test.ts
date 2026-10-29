/**
 * RL-32 Order of interacting permanent effects.
 * rulings.md RL-32. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-32: Order of interacting permanent effects', () => {
  it.todo('RL-32 (QA-OP10 OP10-042 case 1): Tsuru −2 → Bartolomeo cost 2 (needs M4 effects)');
  it.todo('RL-32 (case 2): Kaku −3 → cost 0 (needs M4 effects)');
  it.todo("RL-32 (case 3): Issho's permanent −3 → cost 0 (needs M4 effects)");
  it.todo('RL-32 (control): no opponent effect → cost 4 (needs M4 effects)');
});
