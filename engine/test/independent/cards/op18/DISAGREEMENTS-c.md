# OP-18 group c: disagreements with the engine

One entry per `it.fails` test. Cards read from `cards/data/sets/OP-18.json`.

## OP18-016 Monkey.D.Luffy ([On K.O.] play up to 1 {Alabasta} Character with 6000 power or less from hand)

- Test: `OP18-016.test.ts`, "nothing is asked when no card in hand qualifies".
- Expected: with no qualifying card in hand there is nothing to choose, so no decision is raised and the game returns to the opponent's Main Phase (same as OP18-010 Chopper's empty "add up to 1 from trash", ARCHITECTURE §2.3 auto-skip of forced picks).
- Engine: raises a `choose` for p1 with `min 0, max 0` and only `done` legal ("play up to 1 of your cards in hand"). Low severity (a no-op prompt), but it is an extra click and inconsistent with the Chopper script.

**Settled (review OP18-R11, 2026-11-28):** the engine is right. ADR 0005 and `cards/src/hidden-gate.ts`: a pick over the hidden hand is asked even when nothing qualifies, so the pause leaks nothing; OP18-010 picks from the public trash. The test now asserts the empty pick.
