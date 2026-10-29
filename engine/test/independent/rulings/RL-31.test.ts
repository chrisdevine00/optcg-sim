/**
 * RL-31 Replacement effects: optional or mandatory, one for several events, impossible replacements.
 * rulings.md RL-31. Every engine test for this ruling needs card effects or data that is not
 * available through the public API yet, so each is tracked as a todo.
 */
import { describe, it } from 'vitest';

describe('RL-31: Replacement effects: optional or mandatory, one for several events, impossible replacements', () => {
  it.todo(
    "RL-31 [open-question Q6] (a): OP08-045 Thatch's replacement is mandatory: no optional decision (needs M4 effects)",
  );
  it.todo(
    "RL-31 (b) QA-OP17 OP17-023: one rest of Nami saves two Characters K.O.'d at once (needs M4 effects)",
  );
  it.todo(
    'RL-31 (c) QA-OP12 OP12-061: the Life replacement cannot be used at 0 Life (needs M4 effects)',
  );
});
