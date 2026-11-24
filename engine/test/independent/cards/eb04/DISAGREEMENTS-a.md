# EB-04 group A independent card tests: disagreements with the engine

Each entry would have a test marked `it.fails` that points here. When the question is settled, either fix the script and drop `it.fails`, or change the test and delete the entry. Probed against the lead's local `main` (1b7b030). Confidence is the author's confidence that the engine is wrong, not that the test is right.

None open. B-1 (EB04-015 Jinbe, "the up to 1 hand pick is not asked without a match") was a test-helper artifact, not an engine behaviour: `restCost`/`pickInOrder` answered the next, empty pick with `done`. Settled in the block 4 tail review (B4T-R3): the pick is asked in every hand, the test is now a plain test with raw picks, and the helpers send `done` only to the decision they were answering.

Readings the tests rely on (not disagreements):

- EB04-006 Moda: `[Lulucia Kingdom]` in square brackets is a card name (the Stage EB04-010), so Moda herself ({Lulucia Kingdom} type) is not a candidate. The engine agrees.
- EB04-009: "1 of your [Silvers Rayleigh]" includes a Leader named Silvers Rayleigh (OP12-001), as the Counter half ("Characters or [Silvers Rayleigh]") implies. The engine agrees.
- EB04-013 Carrot: the Leader is read as always set active (not part of "up to 2"); the tests only assert the Leader-only case and the 2-Character cap, which hold under either reading.
- EB04-025 Vivi: whether the opponent still places a card when I play nothing is unsettled; the tests assert the placement only after a card was played.

No other disagreement found. Every other test of the 24 cards passes.
