# API gaps: OP-15 independent tests, group C

None of these stopped a test from being written. Each says what the public API leaves open and how the tests cope.

1. **An Event's trash count includes the Event itself.** A played Event is already in the trash while it resolves (RD 74). OP15-095 and OP15-097 state the boundary in their titles (14 or 9 cards before the play). A revealed [Trigger] Event may or may not be counted while it resolves, so the Trigger tests of OP15-097 use a large margin (12 and 3) instead of a boundary.
2. **"Add up to 1 card from the top of your deck/Life" is asked as an `optional`, not an "up to 1" `choose`.** OP15-109 (deck top to Life) and OP15-110 (deck top to Life) see a yes/no prompt, so "up to 1" and "you may" cannot be told apart from outside. Tests accept one named kind and fail on any other.
3. **An [Activate: Main] with a "you may" cost asks nothing after activation.** OP15-085's "You may trash this Character" is paid at activation (the Character is in the trash before the target choose), so activating is the choice; declining is not activating.
4. **An empty candidate set may be skipped or asked empty.** OP15-084/085/086/091/102/106/115/117 accept both (`if (kind(g) === 'choose') { expect(choices(g)).toEqual([]); skip }`) and assert the outcome.
5. **Instances change on a zone move.** A K.O.'d or returned card is a new object (CR 3-1-6), so tests read the zones by card id (`chars`, `trash`, `hand`) and use `zoneOf` (returns `'gone'`) for the old instance.
6. **Unusable "you may" costs from hidden zones.** The effect is offered with accept illegal (OP15-096 Counter with only the Event in hand, OP15-100/109 with 0 Life); tests use `unusable`. A hand-cost Counter Event with no other card is still activated and trashed (the Event cost is paid) and does nothing.
7. **Deck-out is immediate.** Milling or adding the last deck card (OP15-084, 096, 110) ends the game at once with `{ winner: 'p2', reason: 'deck out' }` (CR 9-2-1-2); tests assert the result.
8. **Scenario caps DON!!:** given DON!! plus cost-area DON!! must be at most 10, so OP15-111 sets `costArea.active` to `10 - don`.
9. **Scenery for the opponent's removal.** "By your opponent's effect" is exercised with OP09-077 Gum-Gum Lightning (K.O. power 6000 or less), OP17-056 Rocks Pirates (return cost 6 or less) and OP17-046 Gloriosa (bottom of deck, cost 5 or less), all played by p2 in `theirsWith`.
