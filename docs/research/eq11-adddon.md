# E-Q11 reopened: "add up to N DON!!" asks a count (engine 0.5.7)

Source: OP-17 review finding OP17-R2 (docs/reviews/m6b-OP-17.md), CR 4-8-1, rules-digest 15.

## What changed
- `engine/src/effects/run.ts` `addDon`: a part with `upTo: true` asks "how many ... DON!! cards will you add (up to k)?" where k is `min(n, DON!! deck)`. It is the same decision `giveDon` uses: `choose`, purpose `mode`, options `k ... 0` (most first, "None" last). No new decision kind, so the app needs no change (it already draws that decision for `giveDon`; the DON!! count and the add are public).
- A part without `upTo` ("add 1 DON!!") adds exactly `min(n, deck)` and asks nothing. An empty DON!! deck asks nothing. A multi-part add asks per part, in order; `Scratch.add` (engine/src/state.ts) records how many parts are done so a re-entry after an answer does not redo them.
- All 20 scripts that use `addDon` already carried `upTo: true` (text reads "up to"), so no script changed except dropping the two E-Q11 "engine note" rulings in OP17-068 and OP17-078.
- `setActive` is unchanged.
- ENGINE_VERSION 0.5.6 -> 0.5.7; three goldens re-recorded (meta-random-2, meta-random-deckout, rocks-vs-kaido-damage).

## Tests
- Planted: `engine/test/cards/m6b-eq11/add-don-count.test.ts` (9 tests on vanilla cards).
- The four `it.fails` (EB05-033, EB05-036, OP17-068, OP17-078 independent tests) are now `it`.
- About 45 author and independent tests of the 20 scripts got one extra most-first answer (`addMost` in engine/test/cards/helpers.ts, `takeMost` in engine/test/independent/helpers.ts).
- OP17-R5: author tests added for OP17-066 (a cost-9 Character does not count) and OP17-021 (a battle K.O. is not replaced).

## Revert checks
- Engine change reverted (`git checkout engine/src/effects/run.ts`): 7 of the 9 planted tests fail; the two that pass (empty deck, exact amount) are guards for behaviour that must not change.
- OP17-066 `gte: 10` -> `gte: 9`: the new cost-9 test fails. OP17-021 `cause: 'opponentEffect'` -> `'any'`: the new battle K.O. test fails. Both restored.

## AI behaviour
The count is an ordinary effect `choose` decision (purpose `mode`), exactly like `giveDon`'s, so no AI code changed. Pirate and Warlord roll out with `quickChoose` (ai/src/search/sim.ts), which scores every `option` pick 0 and so takes the first legal one: the most. MCTS macro expansion (ai/src/search/mcts.ts) lists up to 12 `mode` picks, so it can explore adding fewer. Rookie picks a random legal action for every decision, as it already does for `giveDon`'s count, so it may add fewer.
