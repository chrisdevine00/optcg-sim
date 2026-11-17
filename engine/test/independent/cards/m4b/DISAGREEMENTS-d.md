# Disagreements found by the group D independent card tests (M4b wave 2)

Tests marked `it.fails` in `engine/test/independent/cards/m4b/` point here. Every other test in the
group passes against the engine.

## 1. A mandatory "exactly n" choice with 0 candidates still shows a decision (low, not a rules error)

- **Card:** OP17-091 Brook. "[On Play] If there is a Character with a cost of 12 or more, your opponent
  trashes 1 card from their hand."
- **Position:** the condition holds and the opponent's hand is empty.
- **Expected:** nothing to trash, so no decision. `effect-dsl.md` 4.11: `pick: { exactly: n }` "with 0
  candidates there is no decision".
- **Engine:** the opponent gets a `choose` ("trash 0 of your cards in hand") whose only legal actions are
  `done` and `concede`. Rules-wise the outcome is the same (nothing is trashed), so the test
  (`OP17-091.test.ts`, "an empty opposing hand trashes nothing") tolerates the vacuous decision by
  pressing `done`. It is a deviation from the documented design and costs the opponent one click.
- **Confidence:** high that it deviates from 4.11; it is harmless to the rules.

## 2. "Give up to 1 rested DON!! card to 1 of your ..." cannot be answered with "give none" (medium)

- **Cards:** ST17-004 Boa Hancock ("Then, give up to 1 rested DON!! card to 1 of your "The Seven
  Warlords of the Sea" type Leader or Character cards.") and OP14-114 Ran ("[Activate: Main] [Once Per
  Turn] Give up to 1 rested DON!! card to 1 of your {Kuja Pirates} type Leader or Character cards.").
- **Expected:** "up to 1" DON!! allows 0 (CR 8-4-4-1: "up to" N means 0 to N), so the player may end the
  effect without giving anything, for example to keep a rested DON!! for later or because no target is
  wanted. Ran's activation is also only a cost-free choice, so it must be possible to give nothing.
- **Engine:** the decision is a `choose` over the legal targets with no `done` (legal actions: one `pick`
  per target and `concede`). Every outcome ends with 1 DON!! given. ST17-004 explored with `outcomes`:
  the only reachable holders are the Leader, Gecko Moria and Hancock herself, never "nobody".
- **Tests:** `ST17-004.test.ts` ("CR 8-4-4-1: "up to 1" allows giving no DON!! at all") and
  `OP14-114.test.ts` (same title), both `it.fails`.
- **Confidence:** medium. The count of DON!! is "up to 1", but the target is "1 of your ..." (a fixed
  count), so a reading that requires choosing a target is arguable. I read "up to 1 rested DON!!" as
  the controlling count; the targets are only where a DON!! goes if one is given. The same shape
  (`give up to 1 rested DON!! card to 1 of your ...`) appears on many cards. The existing independent
  M4a tests do not cover it.

## Observations that are not disagreements (for the reviewer)

- **OP17-085 Dorry and OP17-092 Brogy** ("This Character gains +12 cost") show their printed cost 5 on
  the field at this commit (OP17-089 Saul, OP17-081 Gerd and OP17-119 Loki do get +12). They are not group
  D cards, so I did not test them, but they look unscripted or mis-scripted. The group D tests use Saul
  (cost 16) as the "Character with a cost of 12 or more" scenery instead.
- **[Trigger] activation is unavailable for unscripted cards**: OP01-104 Speed, ST03-013, EB04-027,
  OP16-105, OP14-100/102/103/106/110/111, OP15-079, OP12-104, OP07-109, OP06-101 and ST13-012 offer only
  `trigger: activate false` in a Life-damage decision. Scripted [Trigger]s that did work in probes:
  OP14-114, OP14-105, OP14-107, OP14-108, OP14-112, OP16-113, P-088, OP12-112. The group D tests therefore use
  those as trigger scenery. The multi-play case of RL-47 (OP16-105 playing 3 Characters, 3 draws for OP14-041)
  could not be tested for that reason.
- **The Block Step is always a decision** even when no Character can block (`block` with only the
  `blocker: null` option). The tests assert on `blockers(g)`, not on the decision kind.
