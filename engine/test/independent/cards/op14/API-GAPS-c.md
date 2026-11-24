# OP-14 group C: API gaps

Observation gaps met while writing the OP14-062 .. OP14-086 tests (none blocks a test).

- **Exact-N picks list only starting cards.** For an exact-2 "trash 2 cards from your hand" (OP14-085) the `pick` actions name only the cards that can start a canonical selection, so `choices` shows 2 of 3 cards. Tests read `reachablePickSets` instead of the offered list.
- **No printed 0-cost Character exists.** OP14-083 (0 cost targets) needs a cost effect first; the tests use OP17-097 (all opposing Characters −1 cost) as scenery.
- **Older scenery is mostly unscripted.** Cards such as OP02-106 Tsuru and OP06-021 Perona have no script, so their effects cannot be used as scenery; tests use scripted cards (OP17-097, EB05-012 Camie, OP09-077 Lightning, OP14-078 Bullet String) or vanilla ones.
- **Count prompts have no stable name.** "Add up to N DON!!" is a `choose` with purpose `mode` and options whose ids are the numbers; `asksCount` recognises it by the prompt text "how many". A "choose one" mode shares the purpose, so a helper must not take any `mode` choose as a count (it did once: Gladius's K.O.-or-rest was answered as a count).
- **"Use?" for a public non-cost "you may".** OP14-070 Buffalo asks "do this?" with accept legal even with no DON!! on the field (the DON!! return is public, not a hidden cost). Not wrong, but a test cannot tell "not usable" from "usable and then does nothing" except through the outcome.
