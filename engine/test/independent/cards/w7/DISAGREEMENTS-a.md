# Wave 7, group A (EB02-009, EB02-053, EB02-057, EB03-006, EB04-023, OP09-101, OP10-022, OP10-116, OP11-101, OP11-116): independent test disagreements

One disagreement. Every other test in this group passes against the scripts as written.

- **D-1 RESOLVED (W57 fix round, W57-R1): the test was right, the engine reading was wrong.** The `it.fails` is now a plain test; OP09-101 is scripted with the placement as a cost, the checker (`cards/src/optional-cost.ts`) accepts a colon cost with no "you may" on an auto, and the `place` helper answers the "pay this cost?" question. The original note follows.
- **D-1 (OP09-101 Kuzan, severity 2, rules reading).** "[On Play] Place 1 of your opponent's Characters ... face-up: Your opponent trashes 1 card from their hand." has a cost and no "you may". Rules-digest 112 (CR 8-1-2 with QA-GR "play a Character card with an [On Play] effect without activating") says an [On Play] with a cost may be declined and the card is still played. The engine asks no question: after the play the cost pick (exactly 1, no `done`) is the first prompt, so the effect cannot be declined once an eligible Character exists. Pinned as `it.fails` "declining the cost (rules-digest 112)". The competing reading (a cost without "may" is mandatory when payable, CR 8-3-1-4 and DECISIONS 2026-10-29) is the one built; the review settles it. A non-severe reading, no card text is misplayed when the player would pay anyway.

Readings the tests rely on (each is also in the test header):

- M6b-Q81 (EB02-053, OP10-116): only the order and the owner of a looked-at Life card are asserted, never its face state or what the other player is told.
- OP10-116: whether "Then, K.O. ..." resolves after the look was answered "none" is not asserted (the rules on file do not settle it; M6b-Q62 is the same shape).
- M6b-Q84 (OP10-022): the "total cost of your Characters" is tested with printed costs only.
- OP11-101: whether declining the replacement spends the [Once Per Turn] is not asserted.
- EB02-009: giving a DON!! back to the card that already holds it is not asserted.
