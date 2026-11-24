# Disagreements: OP-14 independent tests, group D (OP14-087 to OP14-120, 21 cards)

Each open entry has an `it.fails` in the card's test file, so the suite stays green while the question is
open. When it is settled, fix the engine and drop `it.fails`, or change the test and delete the entry.

> Resolved: the engine asks the play pick at max 0 (probe: `choose`, max 0, 0 candidates). `pickInst`/`choose` in `kit.ts` answers a following empty `choose` with `done` when the first pick reaches its max, which looked like a skip. The test now picks raw and passes (`it`). Planted engine tests: `engine/test/cards/empty-pick-hidden.test.ts`.

## D-1 (RESOLVED, a test-helper artifact; the engine asks the empty pick). OP14-116 Salamander: "play up to 1 ... from your hand" is skipped when the hand holds no qualifying card (severity 4)

- **Card text:** "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this
  battle. Then, play up to 1 {Amazon Lily} or {Kuja Pirates} type Character card with a cost of 4 or
  less from your hand."
- **Test:** `OP14-116.test.ts`, "with nothing in hand that qualifies the 'up to 1' play is still
  asked". The hand holds a plain Character and a cost-5 {Kuja Pirates} Character (neither qualifies).
  After the +2000 target is picked the game goes straight back to the Counter Step: no `choose` with
  max 0 is asked.
- **Why it is a disagreement:** the hand is hidden. When a qualifying card is in hand the engine asks
  the pick (the other tests in the file show it), so the opponent can tell from the presence of the
  prompt whether the defender holds an Amazon Lily or Kuja Pirates Character of cost 4 or less. The
  brief for this group (and the hidden-gate rule of the runbook) says an "up to" pick from the hand is
  asked even when nothing matches (max 0).
- **Contrast (held):** the same shape over the hand in OP14-091 (play from "your hand or trash") is
  asked empty; every "look at N, reveal up to 1" in this group (087, 097, 099, 100, 113) is asked empty
  when nothing among the looked-at cards matches.

## Readings the tests rely on (no disagreement; each held against the engine)

- OP14-091 Mr.2.Bon.Kurei(Bentham): the printed exclusion reads "[Mr.2.Bon.Kurei.(Bentham)]" with a
  stray "."; the tests read it as the card's own name (same-name cards, including the K.O.'d card in
  the trash, are excluded; [Mr.2.Bon.Kurei] ST08-013 is a different name and is allowed).
- OP14-093 Mr.4(Babe): the K.O.'d Babe is in the trash while its [On K.O.] resolves (CR 10-2-17), so it
  may add itself to the hand (no "other than" in the text).
- OP14-098 Crescent Cutlass: "all of your Characters ... gain +3 cost" is fixed when the effect
  resolves; a Baroque Works Character played afterwards has its printed cost.
- OP14-119 Dracule Mihawk: an attack declaration rests the attacker and counts as "becomes rested"
  (M6b-Q30 is open; if an attack did not count, the [Your Turn] effect could not be tested with real
  cards on the owner's turn).
- OP14-111 Perona [On K.O.]: only the rest of that turn is asserted for the "cannot attack" lock, not
  the following turn (what "your opponent's next End Phase" means when the K.O. happens during that
  turn is open).
- OP14-120 Crocodile: "Then, if your opponent has a Character with a cost of 0 or with a cost of 8 or
  more" counts only the opponent's Characters and is evaluated whether or not a target was chosen for
  the "cannot attack" clause.
