# API gaps: OP-09 independent tests, group B

None of these stopped a test from being written. Each says what the public API leaves open and how the tests cope.

1. **No observable for "an effect resolved with no visible change".** `EffectActivated` events (with `card`) are used to assert that an [End of Your Turn], [On Your Opponent's Attack] or [Your Turn] effect did or did not fire (OP09-031, 032, 037, 074); a `SetActive` / state check covers the visible half.
2. **DON!! pick classes only.** A DON!! return or rest is picked by class (`costActive` / `costRested`), never by instance, so OP09-064 and OP09-074 assert counts (active, rested, deck) rather than which DON!! moved.
3. **A sole candidate may be resolved by the engine.** The "play from hand" pick of OP09-052 with one hand card, and Killer's Leader pick (OP09-064), may be answered by the engine; the tests answer such a pick only when it is pending.
4. **Several prompts after one DON!! return.** Bepo's pick and the source's own pick are separate `choose` decisions told apart by `Decision.source.card` (OP09-074).
5. **Scripted scenery.** OP09-077 Gum-Gum Lightning is the only opposing K.O. source used (OP09-043, 052, and as Bepo's DON!! −2 source); OP09-064 Killer is the DON!! −1 source. No scripted own-turn K.O. of one's own Character exists.
6. **Console output is swallowed** by the vitest setup, so scratch probes wrote to a file; none remain.
