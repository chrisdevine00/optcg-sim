# OP-13 group B (OP13-032 .. OP13-058): independent test disagreements

Each entry is an `it.fails` in the card's independent test. Severity as in the review docs (1 low, 3 high, 4 prompt that depends on hidden cards).

| # | Card | Test | Card text / rule | Engine behaviour | Severity |
| --- | --- | --- | --- | --- | --- |
| B-1 | OP13-050 Boa Sandersonia, OP13-052 Boa Marigold | `hidden hand: an empty hand asks nothing` | "[On Play] If your Leader is [Boa Hancock], play up to 1 [Boa Hancock] ... from your hand." With an empty hand (public) there is nothing to pick, and the brief says an "up to" hand pick is asked unless the hand is empty. | After the card is played from a one-card hand, the hand is empty and the engine still asks an empty `choose` (legal actions: `done`, `concede`). No hidden information is revealed (a non-empty hand with no match asks the same prompt, which is the required behaviour), so this is a UX nit, not a leak. | 1 |
