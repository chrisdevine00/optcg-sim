# API gaps: OP-14 independent tests, group D

None of these stopped a test from being written. Each says what the public API leaves open and how
the tests cope.

1. **No scripted cost-0 Character exists.** No card in the pool has printed cost 0, and OP02-117
   (Ice Age) is unscripted ("effect not automated yet"). Cost 0 is made with OP17-097 (scripted: every
   opposing Character gets -1 cost this turn) on a cost-1 Character, so only an OPPONENT's Character
   can be cost 0, and the same Event drops every other opposing cost by 1 (tests keep other opposing
   Characters out of the 8/9 boundaries when it is used).
2. **Exact-N cost picks with exactly N candidates are forced.** "Place 3 cards from your trash" (OP14-092)
   with exactly 3 in the trash asks no pick; with more it asks three `choose` steps (purpose `cost`)
   followed by `order` decisions. The tests accept the forced case (`if (kind(g) === 'choose')`).
3. **The trashed-for-room Character prompt is a `choose`.** Used for OP14-089 and OP14-106
   (Character area full); the tests pick by instance id.
4. **A K.O. replacement is an `optional` with purpose `replacement`** whose follow-up cost is a `choose`
   with purpose `cost`; the replacement is observed through the zone state, the `ReplacementApplied`
   event and the deck tail.
5. **"Cannot be rested" shows only through its consequences** (OP14-119): the locked Character is
   missing from the block options and from the attackers list; there is no flag on `CardView`.
   "Cannot attack" (OP14-111, OP14-120) shows only as the Character missing from the legal attackers.
6. **An empty candidate set over a PUBLIC zone (the trash, the opposing field) may be skipped or asked
   empty**; tests over those accept both (`skipEmptyChoose`). Over a hidden zone (hand, looked-at deck
   cards) the pick must be asked empty and the tests require it (`askedEmpty`).
