# Independent card tests: disagreements with the engine (M4a)

These are the failures left after the tests were adapted to the M4a API (2026-10-29) and their own
bugs were fixed. Each **B** entry is a rules disagreement. Its test is marked `it.fails` with a
comment pointing here, so the suite stays green while the question is open. When the question is
settled, either fix the engine and drop `it.fails`, or change the test and delete the entry.

## B. Rules disagreements

### B-1. EB04-040 Flame Dragon Torch: a [Main] Event's "you may" cost cannot be declined

**Resolved 2026-10-29 for the test author** (coordinator's ruling, CR 8-3-1-4). The engine now asks
an Event's "you may" activation cost as a `use` decision after the card is played; declining it
trashes the Event with no effect. The Event is playable whenever its printed cost can be paid; if
the activation cost cannot be paid, "use" is unavailable. Scripts with `costOptional`: EB04-040,
OP17-055, OP17-056, OP17-077 ([Main]) and OP17-076 ([Counter]). The test is a plain `it` again.
The original entry follows.


- **Card text:** "[Main] You may rest 6 of your DON!! cards: Up to 1 of your [Kaido] cards gains
  +3000 power during this turn. Then, rest up to 1 of your opponent's Characters."
- **Test:** `EB04-040.test.ts`, "CR 8-3-1-4: declining the rest-6 cost does nothing" (`it.fails`).
- **Expected:**
  - p1 plays the Event and pays its printed cost (1).
  - p1 may then decline to rest 6 DON!!.
  - The Event goes to the trash and nothing else happens: the Leader stays at 5000, and the cost
    area shows 6 active and 1 rested.
- **Engine:** no `optional` (purpose `use` or `cost`) is asked. Playing the Event rests the 6 DON!!
  and goes straight to the target `choose`.
- **Support:**
  - CR 8-3-1-4: costs worded "can/may" are optional, and skipping them means only that the effect
    does not activate.
  - CR 2-7-3 and 8-4-2: playing an Event (paying its cost and trashing it) is a separate step from
    paying the activation cost of its [Main].
  - The engine already asks this question for auto effects with a "you may" cost (DECISIONS
    2026-10-29, "Auto with a cost asks first").
- **Same behaviour elsewhere (no failing test):**
  - OP17-055, OP17-056 and OP17-077 also pay their "you may" [Main] cost without asking.
  - With too few active DON!! for that cost, the engine does not let the Event be played at all. In
    a probe, OP17-056 was not playable with 1 DON!!. Under CR 8-3-1-4, the Event could still be
    played for its printed cost with no effect.
  - The OP17-056 test "with 4 active DON!! … if the Event can be played at all, nothing returns"
    accepts both behaviours, so it passes.
- **Impact:** small, but real. It stops a player from playing such an Event only to put it in the
  trash, for example to set up OP17-052 Don Marlon, which returns a blue cost-0 Event from trash.

## C. API gaps

None. The M4a additions cover every gap the first pass reported. `API-GAPS.md` gives the status of
each one.

## A. Test bugs fixed in this pass (for the record)

1. **Canonical pick order.**
   - The problem: `choose` and `payWith` in `kit.ts` picked targets in the order the test listed
     them. The engine requires unordered picks in canonical (instance-id) order (ARCHITECTURE
     §2.3), so a valid second pick was refused.
   - The fix: both helpers now try picks sorted by instance id.
   - Tests affected: the OP17-042 reveal-3 cost (5 tests) and OP17-118's two-card play (2 tests).
2. **A Leader's own [When Attacking] left pending.**
   - The problem: some tests attacked with the Rocks Leader and did not answer the Leader's own
     `optional`.
   - The fix: those tests now decline it with `settleNo`.
   - Tests affected: OP17-042 ("during this turn", 1 test) and OP17-055 (the happy path and the
     Franky control).
3. **OP17-040 Newgate's own offer left pending.**
   - The problem: in the OP17-118 Counter tests, Newgate's "is attacked" offer was still waiting
     when the test passed on the Block Step. The positive test failed. The two negative tests passed
     without ever reaching the Counter Step.
   - The fix: those tests now decline Newgate's offer.
4. **Negative checks could pass at the wrong decision.**
   - The problem: `canAttackAny`, `canActivate` and `canCounterWith` returned `false` whenever the
     game was waiting on any other decision.
   - The fix: they now throw unless the game is at the decision they test (`expectKind`).
