# OP-11 group A: disagreements

None. All 24 cards (OP11-001 .. OP11-036, group A) behaved as the card text and rules read in every test; no `it.fails` was needed.

Notes on open readings (every test asserts only what all readings share):

- OP11-028, OP11-029, OP11-002, OP11-018, OP11-020: when an "up to 1" target step has no candidate on the field, the engine may skip the empty pick or ask it; tests accept both (`endEmptyIfAsked`).
- OP11-007, OP11-008, OP11-034 with a Leader that fails the "If": the cost may be offered and paid or not offered; tests assert only the outcome (nothing changes).
