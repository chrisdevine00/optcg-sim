/**
 * RL-16 "Cannot be K.O.'d" versus costs and cost-filtered removal.
 * rulings.md RL-16. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-16: "Cannot be K.O.\'d" versus costs and cost-filtered removal', () => {
  it.todo(
    "RL-16 (QA-OP05 OP05-087): choosing Fukurou for Hakuba's K.O. cost fizzles; no −5 cost (needs M4 effects)",
  );
  it.todo(
    'RL-16 (QA-OP04 OP04-079): a protected Character stays a legal K.O. target, and stays on the field (needs M4 effects)',
  );
});
