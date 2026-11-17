# API gaps found by the group C independent tests (M4b wave 2)

None of these stopped a test from being written.

1. **Which effect an `optional` belongs to when several are pending.** Unchanged from the M4a
   note. The group C tests avoid it by never stacking two optional effects of one player (a played
   Character's [On Play] and a second trigger are driven one after the other).
2. **Unscripted cards cannot be used as scenery that "does something".** Several natural opponent
   removal cards (ST04-015 Brachio Bomber, OP10-040, OP17-025 Building Snake) turned out to have no
   effect in the engine (events say "not automated yet"; a Character's text is silently ignored).
   `whyNot` flags an unscripted Event but there is no public query that says whether a Character's
   text is scripted. The tests that need an opponent's removal effect use OP17-098 Kong Gun (a card
   of this same group) instead. A `isScripted(cardId)` query would let tests pick scenery safely.
3. **Instance ids survive zone changes** (a card moved from hand to trash keeps its instance id).
   That is convenient for tests but the API does not promise it, so `kit-c.ts` `drive()` can also
   match picks by card id (`Plan.cards`) for cards that only exist after a cost is paid.
4. **No way to ask who owns the choice before it is asked.** Tests learn that the opponent chooses
   the cards trashed by ST10-010 only by driving the decision (`decision.player`).
