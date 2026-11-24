# Disagreements: EB-05 independent tests, group B (EB05-030 .. EB05-061)

Each entry is an `it.fails` in the named test file. The review settles which side is right.

## B-1 "Add up to N DON!! cards" is always taken in full (EB05-033, EB05-036)

- **Cards and tests.**
  - EB05-033 Nico Robin, `"up to 4": adding fewer DON!! (even none) is reachable, and never more than 4`.
  - EB05-036 Tsuru, `"up to 1": adding no DON!! is a reachable outcome`.
- **Card text.**
  - EB05-033: "... Then, add up to 4 DON!! cards as rested from your DON!! deck."
  - EB05-036: "... draw 1 card, and add up to 1 DON!! card as rested from your DON!! deck."
- **My reading.** "Up to N" lets the player take any number from 0 to N, so adding fewer (or none) is a legal choice.
- **Engine.** `outcomes()` over every decision p1 owes reaches only the full amount (rested DON!! 5 for Nico Robin; 1 more for Tsuru). No `choose` or `optional` is asked.
- **Source.** rules-digest item 15 (CR 1-3-5-1, 4-8-1, 8-4-4-1; QA-GR "up to ... choose 0"); plain reading.

## B-2 "Add up to 1 card from the top of your deck to the top of your Life" is always taken (EB05-060)

- **Card and test.** EB05-060 Take Care of Lilith!!!, `"up to 1": after paying, adding no card is allowed (the Character is still trashed)`.
- **Card text.** "[Main] You may trash 1 of your {Egghead} type Characters with a cost of 5 or more: Add up to 1 card from the top of your deck to the top of your Life cards."
- **My reading.** After the cost is paid the player may still add 0 cards ("up to 1").
- **Engine.** After the cost, the only reachable outcome is Life +1 (no choice is offered). The same wording on EB05-055 Nami ("add up to 1 card from the top of your deck to the top of your Life cards") does offer the choice (its test passes), so the two scripts differ.
- **Source.** rules-digest item 15 (CR 8-4-4-1); plain reading.
