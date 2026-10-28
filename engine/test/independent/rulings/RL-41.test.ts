/**
 * RL-41 OP12-061 Donquixote Rosinante: Law K.O. replacement.
 * rulings.md RL-41. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-41: OP12-061 Donquixote Rosinante: Law K.O. replacement', () => {
  it.todo(
    "RL-41: optional Life-to-hand instead of Law's K.O., once per turn, not at 0 Life (needs M4 effects)",
  );
  it.todo(
    'RL-41: the cost reduction applies only to the next [Trafalgar Law] of cost 4+ from hand (needs M4 effects)',
  );
});
