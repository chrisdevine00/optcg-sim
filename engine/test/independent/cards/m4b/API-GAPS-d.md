# API gaps found while writing the group D independent card tests (M4b wave 2)

None of these stopped a test from being written; each made some assertions indirect.

## 1. Picks of an unordered set are canonical, so "which cards are offered" is not "which cards are legal"

For an exact-N or up-to-N pick (reveal 3 cards, trash 2 of 4, K.O. up to 2), the engine only offers a
candidate as the first pick if the remaining picks can still be made in canonical order (ADR 0003). The
last candidate is therefore not offered first. `kit.choose` sorts targets by instance id and can pick a
later candidate first, then fail; `m4b/kit-d.ts` replaces it with a `choose` that picks in the order the
engine offers. Tests that need the full set of legal selections use `reachablePickSets` instead of
`choiceCards`.

## 2. `Decision.max` counts the picks still allowed, not the maximum

After one pick of an up-to-2 decision, `max` reads 1. `kit.choose` compares the number of targets with
the current `max` to decide whether `done` is needed, which is wrong after a pick. The new `choose` in
`kit-d.ts` reads `max` before the first pick. Documenting `max` as "remaining" (or adding the original)
would remove the trap.

## 3. No way to ask which effect a decision belongs to for an Event [Counter] cost

Unchanged from M4a gap 3 for these cards (OP06-115, OP12-115, OP14-118): after `activate` of an Event in
the Counter Step the tests cannot tell a cost pick from a target pick except by `purpose` and by the
candidates. `useCounter`, `payWith` and `chooseIfAsked` cover it.

## 4. Giving DON!! "up to 1" has no `done`

See DISAGREEMENTS-d.md entry 2. If the engine's decision is intentional, the API gives no way to say
"give none".

## 5. Probing which [Trigger]s are scripted

A test cannot ask whether a printed [Trigger] is implemented; it can only reach the `trigger` decision
and see whether `activate: true` is among the legal actions. A `PlayerView` flag, or a `queries` helper
such as "is this card's [Trigger] scripted", would let tests skip or fail loudly instead of discovering it
by trial.
