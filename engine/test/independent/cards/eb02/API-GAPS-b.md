# API gaps: EB-02 independent tests, group B

None of these stopped a test from being written. Each says what the public API leaves open and how the tests cope.

1. **The Life zone during a [Trigger] decision.** While the `trigger` decision is pending, `zone(p, 'life')` still lists the revealed Life card (`g.life` reads one higher than the count the condition uses). EB02-055 Jinbe's "2 or less Life cards" boundary is therefore asserted from the outcome (played or trashed), not from a Life count read at the decision.
2. **Multi-target picks list targets in canonical zone order, not instance-id order.** `choose` in kit.ts sorts targets by instance id and fails on "up to a total of 3" over the Leader and Characters (EB02-007). `pickSome` in `kit-eb02b.ts` takes the first listed wanted pick each time.
3. **Mode labels.** Both modes of EB02-045 and EB02-051 are picked by label regex (`mode` in `kit-eb02b.ts`); the option ids (`0`, `1`) are not stable API. The K.O. label of EB02-051 itself contains the word "cost", so the cost mode is matched on `4 cost`.
4. **Forced cost picks are skipped.** With exactly 2 candidates for a "place 2 cards from your trash" cost (EB02-045) the engine pays by itself and goes to the order prompt; `payIfAsked` only pays when a prompt exists.
5. **A trailing empty "up to" prompt is easy to swallow.** Plays use `playRaw` (a raw `playCard` that only pays DON!! picks), never the shared `play`, so an empty target prompt after an [On Play] stays visible.
6. **Own DON!! counts.** `queries.don` gives `active`, `rested` and `given` per player; DON!! returned to the DON!! deck (EB02-061) is observed as the drop of the field total, not as the DON!! deck size.
