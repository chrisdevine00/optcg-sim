# API gaps: OP-14 independent tests, group B

None of these stopped a test from being written. Each says what the public API leaves open and how the tests cope.

1. **"Rest N of your cards" offers the Leader, Characters, Stage and DON!! in one `choose`.** The candidates are card instances plus DON!! classes (`{ from: 'costActive' }`); a test that wants to rest a particular card picks it by instance (`restPick`), and one that wants DON!! picks the class (`settle` with `cost: 'don'`). With a single candidate kind (DON!!-only costs such as OP14-058's) the engine pays on its own and asks nothing, so the answer helpers do nothing when no cost `choose` is pending.
2. **The order of cost and target prompts is not fixed.** For OP14-036 [Counter] the cost is asked before the target when the target is the Leader and the target before the cost when it is a Character. `settle` in `kit-op14b.ts` answers each pending cost or target `choose` in whichever order it comes.
3. **A sole candidate is resolved by the engine.** OP14-040's target ("1 of your {Fish-Man} or {Merfolk} Leader or Characters") is not asked when only the Leader qualifies; `give` in the OP14-040 test answers the target only if a `choose` is pending.
4. **Several watchers of one event are ordered by their owner.** Two Kuroobi (OP14-045) or two Wadatsumi (OP14-056) reacting to one hand trash produce an `order` decision; `trashByKuma` ends with `settleOrders`.
5. **"Set up to 1 DON!! as active" (OP14-039) may or may not ask a count.** The tests answer `asksDonCount` when it is pending and assert the same board either way.
6. **A `trashed from your hand by an effect` source.** OP16-093 Kuma is the only scripted cheap source used; its trailing "give up to 1 rested DON!!" prompt is declined with `done` (`trashByKuma`). OP03-044 Kaya (also "draw 2, trash 2") is not scripted and does nothing when played, so it is not used.
7. **Scripted scenery.** OP09-077 Gum-Gum Lightning (opposing K.O. and DON!! -2) and OP14-038 (opposing rest effect) are the only opposing effects used; OP06-020 Hody Jones' Leader ability is not scripted.
8. **Scenario DON!! totals.** DON!! given to cards must be subtracted from `costArea` so cost area + given <= 10 (OP14-058).
