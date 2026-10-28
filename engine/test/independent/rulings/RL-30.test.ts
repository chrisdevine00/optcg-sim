/**
 * RL-30 "At the start of the game" order: CR and Q&A disagree.
 * rulings.md RL-30. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-30: "At the start of the game" order: CR and Q&A disagree', () => {
  it.todo(
    "RL-30 @ruling-conflict: with both Leaders OP13-079 Imu and the chooser going second, the chooser's start-of-game effect resolves first (CR 5-2-1-5-1) (needs M4 effects)",
  );
  it.todo('RL-30: with the chooser going first, the CR and QA-OP13 agree (needs M4 effects)');
});
