# Disagreements: EB-02 independent tests, group B

Cards: EB02-038, 044, 045, 046, 047, 048, 049, 054, 055, 056, 061, 007, 008, 020, 031, 040, 050, 051, 058, 059, 041, 060.

1. **EB02-044 Sengoku, "type including" (closed, B3C-R3).** The first reading was that `black "Navy" type` matches by substring, so OP17-089 ({Former Navy}) would be offered; the `it.fails` is now a plain test that it is not. Reason: optcgapi renders the official `{Navy}` as `"Navy"` (docs/research/data-sources.md rows 43 and 54); the substring form is printed `type including "X"`. The script (exact type) is right.

Readings the tests assume, so the review can check them:

1. **EB02-059 [Counter], "[Sanji]" colour:** whether the "yellow" in `your yellow "Straw Hat Crew" type Character cards or [Sanji]` also limits [Sanji] is not asserted. The test uses OP03-102 Sanji (Yellow, {The Vinsmoke Family}), which qualifies under both readings, and no non-yellow [Sanji].
2. **EB02-007 "Then, K.O." after a boost pick of 0:** not asserted; every K.O. test either boosts a card first or picks none and then reads the K.O. prompt only where the first half was declined with `done` and a prompt still follows.
3. **EB02-060 Merry Go:** a top Life card that is already face-up cannot be turned face-up again, so the cost is not payable (CR 1-3-2-1, rules-digest item 10). The test "next turn ... already face-up" asserts this; if the owner's reading is that a face-up top card still pays the cost, that one test flips.
4. **EB02-055 Jinbe:** the Life count in the [Trigger] condition is the count after the Life card was taken (the card is the revealed trigger card). The tests only assert the outcome (3 left: trashed; 2 left: played), not a Life count read during the decision.
5. **EB02-049 Garp and EB02-047 Blueno:** an [Activate: Main] with a "You may ... cost" has no separate "use it?" question (activating is paying), and an optional hand cost that cannot be paid is either not offered or offered with accept illegal; the tests accept both.
6. **Public-zone empty "up to" picks** (EB02-044 Sengoku's trash, EB02-046 Hildon's opposing Characters, EB02-048 Brook's trash): the engine skips the prompt when nothing qualifies; the tests accept asked-empty or skipped. Hand-sourced "up to" picks (EB02-038, 048 [On K.O.], 059, 056 deck look) are asserted as asked, per the brief.
