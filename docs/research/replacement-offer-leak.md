# Replacement offer leak (Finding 1 of standard-deck-property.md)

Fixed in ENGINE_VERSION 0.5.9.

## Bug

A replacement ability whose cost is paid from a hidden zone (OP16-018 Rockstar: trash a Character
with 6000+ power from hand instead of being K.O.'d) was collected only when `payable` held
(`possible` in `engine/src/flow.ts`). Whether the game paused with an `optional` decision therefore
told the opponent whether the hand held a qualifying card.

## Fix

The principle is the one already used for auto abilities (`costIsSecret`, `run.ts`; ADR 0005):

- `possible` now takes the ability's `optional` flag. For an optional replacement whose cost is
  secret it checks only the public part of the cost (DON!!, Characters on the field); the hidden
  part no longer gates the offer.
- The offer (`offerReplacement`, `offerDamageReplacement`) sets `secret` on the decision, and
  `noAccept` when the full cost cannot be paid. The prompt text is identical either way, so the
  opponent's events and the public decision are the same whatever the hand holds. The owner can only
  decline an unpayable offer.
- Non-optional replacements keep the old behaviour (full payability gates them).

## Other offers checked

- Auto abilities (`run.ts` ~221): already secret-aware.
- Counter or Main activation through a [Trigger] (`run.ts` ~1248, "Activate this card's [Counter]
  effect"): an unpayable hidden cost silently skipped, while a payable one paused. Now pushed
  whenever the cost is secret; the activate path asks with accept unavailable. Found by inspection, not by
  the property run.
- `legalActions` for activate abilities and `triggerPayable`: the owner's own action list, never
  shown to the opponent; the damage/[Trigger] decision is asked every time (M2-01). No change.
- Damage replacements (D4) share `possible`, so they are covered.

## Tests

- `engine/test/hooks/leakfix-replacement-offer.test.ts`: planted hand-cost replacement; the opponent's
  projected events and decision are identical for a payable and an unpayable hand. Fails with the
  `flow.ts` fix reverted (3 of 3).
- OP17-043 and OP17-045 author tests now expect the offer and decline it.
- Seed 15 is no longer excluded from the leaks property (`KNOWN_STANDARD_LEAK_SEEDS` removed).
