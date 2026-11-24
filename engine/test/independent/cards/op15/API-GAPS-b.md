# API gaps: OP-15 independent tests, group B

None of these stopped a test from being written. Each says what the public API leaves open and how the tests cope.

1. **Scripted scenery only.** The scenario can place any card, but a card without a script does nothing when played
   (for example OP09-009 Benn.Beckman, EB01-010). Opposing removal is therefore limited to the scripted cards:
   OP09-077 Gum-Gum Lightning (K.O. up to 6000, DON!! -2), EB01-059 Kingdom Come (K.O. any), OP15-115 Impact
   Dial ([Trigger] K.O. cost 4 or less, used to K.O. my Character on my own turn) and OP17-105 Chiffon (bounce
   with a [Trigger] Character). No scripted trash or deck-bottom removal with a suitable target was found.
2. **Mode choices are `choose` with purpose `mode`, options `"0"`, `"1"`, ... with labels.** `pickMode` in
   `kit-op15b.ts` picks by label (regex), so the tests do not depend on the option order.
3. **"You may rest this Character" in an [Activate: Main] cost** gives no `optional`. Choosing to activate pays it
   (OP15-064, 072). "Declining the cost" is therefore only "not activating", and cannot be tested separately.
4. **A cost-area DON!! pick is skipped when there is one class only.** `payDon` in the kit answers a DON!! cost
   `choose` if one is pending and does nothing otherwise (OP15-060, 063, 064, 072).
5. **"Add up to 1 DON!!"** (OP15-065 Goro) is a `choose` with purpose `mode` and count options (`"1"`, `"0"`); it is
   skipped when the DON!! deck is empty. `asksDonCount` / `takeDon` read and answer it.
6. **`atMain(g)` defaults to p1.** In a test that runs on p2's turn the call must name `'p2'`.
7. **An exact-N cost pick from a public zone** (OP15-080, 3 cards from the trash) lists the trash cards including the
   K.O.'d Oars itself; `payHand` picks by card id and works there too.
8. **Scenario DON!! totals.** DON!! given to cards must leave cost area + given at most 10; `donDeck` defaults to the
   rest. OP15-060 / 068 / 080 tests set `costArea` so the "6 or less DON!! cards on your field" boundary is exact.
