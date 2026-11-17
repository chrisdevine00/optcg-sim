# M4b group A independent card tests: disagreements with the engine

Each entry has a test marked `it.fails` that points here. When the question is settled, either fix the
script and drop `it.fails`, or change the test and delete the entry. Probed against `origin/main` at
768f719. Confidence is the author's confidence that the engine is wrong, not that the test is right.

## A-1. OP05-098 Enel (Leader): the mandatory effect is offered as optional

- **Text:** "[Opponent's Turn] [Once Per Turn] When your number of Life cards becomes 0, add 1 card from
  the top of your deck to the top of your Life cards. Then, trash 1 card from your hand."
- **Test:** `OP05-098.test.ts`, "the effect has no 'you may', so it is mandatory".
- **Expected:** after the hit that takes the last Life card, no `optional` decision. The effect resolves
  and p1 picks the card to trash. CR 8-3-1-4: only effects worded "can/may" are optional. RL-42 says the
  trash is mandatory.
- **Engine:** an `optional` decision "Enel: add the top card of your deck to the top of your Life cards?"
  (`purpose: use`) with a legal `accept: false`. Declining skips the whole effect.
- **Confidence:** high. Impact: a player can refuse a free Life card and skip the Once Per Turn.
  Every other test in the file says yes to the question so they do not depend on it.

## A-2. "Give up to 1 rested DON!!" cannot be given as 0

- **Cards:** OP15-114 Wyper ([Activate: Main], "Give up to 1 rested DON!! card to 1 of your {Sky Island}
  type Leader or Character cards"), EB03-053 Nami ([On Play], "Give up to 1 rested DON!! card to your
  Leader").
- **Tests:** `OP15-114.test.ts` and `EB03-053.test.ts`, "up to 1 rested DON!!: may give none".
- **Expected:** CR 8-4-4-1: "up to 1" allows 0. Some path through the decisions ends with 0 DON!! given.
- **Engine:** Wyper demands a recipient (a `choose` with no `done`) and then gives the DON!!. Nami gives
  the DON!! with no decision. In both, every reachable end state has 1 DON!! given. (The same Nami script
  does let p1 decline the "up to 1" Life card, so only the DON!! half is stuck.)
- **Confidence:** medium. The repo notes the add-DON!!-from-deck case as an open question (E-Q11); this is
  the give-DON!! case. Low practical impact (a free DON!! is rarely unwanted).

## A-3. OP15-119 Luffy: "reveal up to 1 card" cannot be taken as 0

- **Text:** "When your opponent activates an Event or [Blocker], reveal up to 1 card from the top of your
  Life cards. This Character gains +1000 power during this turn per 1 cost on the revealed card."
- **Test:** `OP15-119.test.ts`, "reveal up to 1: revealing none leaves Luffy unboosted".
- **Expected:** CR 8-4-4-1: p1 may choose to reveal nothing, so no boost.
- **Engine:** no decision is asked; the top Life card is always revealed and the boost applied (11000
  in the probe with a cost-4 card).
- **Confidence:** medium-low. It only ever helps the player, but it is a choice the text gives.

## A-4. OP08-115 The Earth Will Not Lose!: "Then, play [Upper Yard]" runs after a failed "If"

- **Text:** "[Counter] If your Leader has the {Shandian Warrior} type, up to 1 of your Leader or Character
  cards gains +3000 power during this battle. Then, play up to 1 [Upper Yard] from your hand."
- **Test:** `OP08-115.test.ts`, "a Leader without {Shandian Warrior}: the 'Then, play [Upper Yard]' does
  not resolve either".
- **Expected (CR 8-3-3 as digested: "Text after a failed 'if...' does not resolve"):** with a {Sky Island}
  only Leader, no +3000 and no play; the Upper Yard stays in hand.
- **Engine:** no +3000, but a "play up to 1 of your cards in hand" choice is offered and Upper Yard is
  played. The same engine skips the "Then" part in the two sibling cards EB02-052 ("Then, +1000" after a
  failed "If you have 1 or less Life") and OP09-078 ("Then, draw 2" after a failed Leader-type "If"), whose
  tests here assert the skip and pass. So the three scripts are inconsistent with one another.
- **Confidence:** medium. Each card text has two sentences ("If ..., A. Then, B."), so the CR 8-3-3
  reading is open to doubt; but whichever reading is right, the three cards should agree.
