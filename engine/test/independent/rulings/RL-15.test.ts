/**
 * RL-15 "Cannot be K.O.'d" versus bounce, bottom-deck, trash and rule trash.
 * rulings.md RL-15. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-15: "Cannot be K.O.\'d" versus bounce, bottom-deck, trash and rule trash', () => {
  it.todo(
    'RL-15: Top Knot bottom-decks a Fukurou; Inuarashi stays; a "trash" effect is not a K.O. (needs M4 effects)',
  );
});
