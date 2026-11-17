# API gaps found while writing the M4b group-B independent card tests

None of these stopped a test from being written. Each says what the public API leaves open and how
the tests cope.

1. **`DonClass` does not say whose DON!!.** `{ from: 'costActive' }` is offered both for paying your
   own cost and for choosing an opponent's DON!! as a target (OP12-037, and Brook's "cards", see
   DISAGREEMENTS-b.md B-2). The `play()` helper of `helpers.ts` pays a play cost by taking the first
   `costActive` pick it sees, so with an opponent's DON!! offered as a target it would rest the
   opponent's DON!! instead. Tests that need this call `act(playCard)` directly. Wanted: an `owner`
   (or a `purpose` split) on DON!! picks.
2. **Exact-N picks hide candidates (canonical order).** For "rest 2 of your Characters" with 3
   candidates, the first pick offers only 2 of them (the highest id can no longer complete a canonical
   pair). `choiceCards` therefore under-reports the candidates. The tests use `reachablePickSets`
   (OP01-055) or check the effect, not the offered list, for exact-N decisions.
3. **"You may" costs of [Activate: Main] have no decline step.** The activation itself is the choice
   to pay (as `kit.ts` documents), so "decline the cost" is "do not activate". OP15-032 Brook has no
   such test for that reason.
4. **Empty `choose` for hidden-zone searches.** With no legal card in the hand (ST31-001) the engine
   still asks a `choose` with `max: 0` and only `done`, so the opponent cannot learn the hand has no
   candidate (CR 8-4-4-2). Tests call `finishEmpty`. This is by design.
5. **A simultaneous pair of [End of Your Turn] effects asks for an `order` decision**
   (two OP14-022 Usopp). Tests answer it with `drive`.

## Not tested (and why)

- OP13-118 Luffy: with a single-color Leader the "Then, you cannot play Character cards with a base
  cost of 5 or more" clause should not apply, because its preceding "if" failed (CR 4-10-1). The
  game cannot show it: Luffy costs 6, leaving at most 4 active DON!! when the DON!! are not set
  active, so no cost-5 Character is affordable either way.
- OP11-012 Franky with a [Trigger] Event activated from the opponent's Life: whether that counts as
  "your opponent activates an Event" has no ruling in `rulings.md`.
- OP15-035 Laboon: whether DON!! may pay "rest 2 of your cards" (see B-2).
- OP12-006 Shakuyaku: "1 [Monkey.D.Luffy] or 1 red Event" is tested as one card in total.
