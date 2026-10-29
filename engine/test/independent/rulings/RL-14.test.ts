/**
 * RL-14 "Cannot be K.O.'d" covers battle and effects.
 * rulings.md RL-14. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-14: "Cannot be K.O.\'d" covers battle and effects', () => {
  it.todo(
    'RL-14 (QA-PROMO P-040, QA-ST05 ST05-017): an unqualified "cannot be K.O.\'d" Character that loses a battle stays (needs M4 effects)',
  );
  it.todo('RL-14: "cannot be K.O.\'d by effects" does not stop a battle K.O. (needs M4 effects)');
});
