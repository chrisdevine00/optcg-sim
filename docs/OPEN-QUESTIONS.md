# Open questions

Unresolved ambiguities with the current best answer. Remove an entry when it is settled and the decision is logged in DECISIONS.md.


## PROMPT.md amendments

- A1. **Approved and applied 2026-11-17.** Full Standard card pool and live updates (new milestone M6b). PROMPT.md changes: the "Done when" bullet on scripting (every Standard-legal card fully scripted; rotated cards browsable and play for their stats; new sets through a reviewed update PR), the Meta Explorer bullet (refreshed by a scheduled job that opens a PR for review), M6b added after M6 in the Phase 5 table, `meta:update` moved from M9 to M6b, and step 6 added to the `cards:update` pipeline. The owner approved the wording. Recorded in DECISIONS.md, 2026-11-17 "Full Standard card pool and live updates (M6b)"; reasoning in ADR 0014. Open check carried by ADR 0014: the Limitless API terms and both sites' robots.txt, before the update job is built.

## Rules (from Tracks A and F; answers and sources in docs/research/rulings.md section J)

Settled by Track F from official sources: R1 (reveal → pay → trash 1 → place), R2 (effect-plays into a full area use the same trash procedure), R4, R5, R6, R7, R8, R9 (a Leader can block: OP05-022), R10, R11 (moot), R12, R14 (permanent-effect layering), S3, S4, B4. The engine encodes each as `engine/test/rulings/RL-xx.test.ts`.

- R3 / Q-T3. Effect damage of 2 or more when Life runs out partway. No card and no ruling exist yet. Best answer: each point is separate, so a point taken at 0 Life defeats.
- R13. Tournament procedure (cuts, time limits) is not enforced in v1.
- Q-T1. Order of "at the start of the game" effects: CR 5-2-1-5-1 says the chooser goes first; the QA-OP13 entry for OP13-079 says the player going first. Best answer: follow the CR, and tag the test `@ruling-conflict`.
- Q-T2. OP13-001 Luffy's +2000 per rested DON!!: one recipient, or a choice per DON!!? Best answer: one recipient.
- Q-T4. OP15-058 Enel's "your second turn". Best answer: the owner's own second turn.

## Strategy (from Track D part 2; detail in docs/research/strategy-concepts.md "Open questions")

- S1. TCGplayer "How to Swing for Lethal" and a Blue-Green Luffy guide were read only as search snippets (pages rendered without text). Best answer: do not use their claims as coach content until a page is read in full; coach lethal math rests on the CR and on freely readable sources allowed by robots.txt (onepiece.gg is excluded; see the 2026-10-28 robots decision).
- S2. Paid Metafy frameworks ("2K Rule", "Power Staircase", life thresholds). Best answer: do not buy or cite paywalled content; the coach cites only freely readable sources (logged in DECISIONS.md).
- S5. No sourced first-vs-second win rates. Best answer: compute from our own AI self-play later; say so in the coach rather than quote a number.
- S6. Counter-density targets (median 33 counter cards, about 9 +2000s per the Shonen TCG sample). Verify against the Track D lists.
- S7. Current examples of DON!!-return and Blocker-resting cards. Track E vocabulary to list them.
- S8. Removal timing has no sourced generic heuristic. Best answer: deck-specific timing goes in the playbooks.
- S9. "Single colour 5 Life, dual colour 4" is a rule of thumb. Best answer: always read Life from card data.
- S10. Settled by Track D part 1: Standard Regulation (blocks 2 to 5) applies since 2026-04-01, with exceptions. Logged in DECISIONS.md.

## Meta (from Track D part 1; detail in docs/research/meta-landscape.md "Gaps and open questions")

- M1. No complete in-person top-8 data for the window (Season 1 Finals, about 13 Season 2 Regionals). Best answer: counts rest on Limitless online events; re-run `meta:update` when Limitless backfills in-person events.
- M2. onepiece.gg tiers are missing because its robots.txt disallows Anthropic agents. Best answer: leave `tierOnepieceGg` null; use opmetagame.com plus Limitless as the two sources.
- M3. Online best-of-one simulator results may not represent paper best-of-three play. Best answer: show both online share and in-person notes in the Meta Explorer, and say which is which.
- M4. Effective date of the OP07-115 + EB04-058 banned pair is not stated on the notices opened. Best answer: treat it as in force (it is on the current master list).
- M5. P-163 Dracule Mihawk (replacement leader) is not yet distributed. Best answer: no Mihawk archetype until results appear.
- M6. The window spans three formats (OP16, OP17 with Mihawk, OP17 without). Best answer: rank by window top-8s but show post-ban share for "today".
- M7. OP17 legality from its 2026-08-21 pre-release (product page) versus "7 days after release" (other product pages). Best answer: per-product legality dates in the card data.
- M8. Block-1 legality was checked only for the 10 older cards in the chosen lists. Best answer: the deck validator checks every card against block data and the exception list.
- M9. EB05 (2026-10-30) and OP18 (2026-11-20) will change the format soon. Best answer: build the archetype guides from these lists now, and let `meta:update` flag lists older than 60 days.
- M10. opmetagame.com contradicts itself on tiers (/tier-list/ vs /decks/). Best answer: report /tier-list/ values and note the disagreement.

## UX research (from Track C; detail in docs/research/competitive-teardown.md)

- C1. SeaKing, the main baseline, could not be observed (robots.txt disallows Anthropic agents). Best answer: about 90 minutes of owner hands-on time (SeaKing Learn, Hint, Rewind, Game Review, plus the Bandai tutorial) is requested before the Phase 4 gate. If it has not happened by then, Phase 4 marks every design claim that rests on unobserved competitor behaviour, and the slice checkpoint revisits them.
- C2. DuelVoyager is not studied (same reason). Best answer: out of scope unless the owner fills it in by hand.
- C3. OPlayTCG and OPTCG Web Sim also claim AI opponents and were not opened. Best answer: check their robots.txt and terms during Phase 4 preparation, and study them only if allowed.
- C4. Bandai's browser Teaching App was observed only up to its Terms of Use, which prohibit unapproved external tools. Best answer: the owner plays its tutorial by hand if Phase 4 needs more than the official play guide.

## Card data (from Track B; detail in docs/research/data-sources.md)

- B1. The card text originates with Bandai whichever intermediary supplies it. Best answer: PROMPT.md's posture holds (factual game data, cited, no art committed, takedown-ready), sourced from optcgapi.com, which grants use. The owner can overrule this.
- B2. Courtesy contact with optcgapi's maintainer about hotlinking images and the diff errors. Best answer: yes; the owner does it (outward-facing).
- B3. The arjunkai image proxy needs its maintainer's approval. Best answer: disabled until approved; request only if optcgapi images prove unreliable.
- B5. EB-05 appears in sources before its 2026-10-30 English release. Best answer: import it when optcgapi has it, with legality from the release date plus the product's stated delay.
- B6. Sign-repair heuristic ("N power/cost" given to an opponent's card with no sign means −N). Best answer: apply it, record each repair in `textFixes`, and verify by hand when the card is scripted. Revisit if the diff report finds a false repair.

## Content (from Track G; detail in docs/content/)

- G1. Drill thresholds and playbook-seed percentages are inference. Best answer: calibrate them from AI self-play in M5, and keep them marked as inference until then.
- G2. Can OP15-088 Pirates Docking Six reach cost 12 with ST14-017 Thousand Sunny and so gain [Blocker] under OP17-079 Luffy? Best answer: unknown; resolve from the card texts and rulings when both cards are scripted (M4b).
- G3. TCGplayer calls Docking Six "a pretty mandatory four-of", but all three of our Sabo lists run three copies. Best answer: guides follow the sourced lists and note the disagreement.
- G4. Settled: the Kalgara win at ChinoizeCup #117 (2026-09-30) is not counted because that event was Extra Regulation (`[EGB]`, API format `EXTRA`), which the method excludes.
- G5. Settled: OP17-020 Shanks is Green (optcgapi and Limitless). Shonen TCG's "Red" is an error.

## Effects (from Track E; full paragraphs with best answers in docs/research/effect-dsl.md §7)

- E-Q1. Does a negated Character's [On K.O.] activate when it is then K.O.'d? *M4a: implemented as the best answer (no); still no official ruling found. OP17-063 depends on it.*
- E-Q2. Is OP12-061 Rosinante's "next time you play [Trafalgar Law] … from your hand" discount used up by a play from hand made by an effect?
- E-Q3. What can OP15-035 Laboon's "rest 2 of your cards" rest?
- E-Q4. Is OP17-118's "If you only have Characters without a Counter" true when you have no Characters? *Resolved by QA-OP17 OP17-118: no, with 0 Characters it has no Counter (the opposite of the Track E best answer). Scripted and tested that way.*
- E-Q5. Who picks the card in "trash … from your opponent's hand" (ST10-010, OP17-075)? *Closed 2026-11-16 (M4b fix round 1): the player who activated it chooses face-down, for both cards. OP17-075 by QA-OP17, ST10-010 by the official ST10 Q&A ("The player who activated this [On Play] effect chooses 2 cards from their opponent's hand face-down"). The engine picks at random (`chooser: 'you', blind: true`).*
- E-Q6. May a player choose a "choose one" mode that would do nothing? *Resolved for OP17-049 by QA-OP17: yes (with 1 card they trash it; with 0 nothing happens).*
- E-Q7. Which events does "removed from the field by your opponent's effect" cover, and how is it ordered against a K.O. replacement?
- E-Q8. Are unsigned power and cost values on self-directed effects sign defects? Best answer: check each by hand in the M1 verification of the 182 meta cards.
- E-Q9. Should printed keywords work on otherwise unscripted cards? Settled: yes, via verified overrides (E-D7).
- E-Q11. "Add up to N DON!! cards" and "set up to N DON!! cards as active": may a player choose fewer? *M4a best answer: the engine adds or sets as many as possible without asking (DECISIONS 2026-10-29). A card where fewer is better would need a choice. 2026-11-16 (M4b fix round 1): the CR does allow fewer (CR 4-8-1; M4b-4 below was ruled that way for giving DON!!), but for adding and setting active more is never worse for the player and no meta card needs fewer, so the engine is deliberately unchanged (a count decision per add would only cost prompts). Revisit if a card makes fewer better.*
- E-Q12. May an Event's activation cost be declined after the Event is played? *Closed 2026-10-29 (M4a-08): yes, for a "you may" cost (CR 8-3-1-4; coordinator ruling B-1) and for DON!! −X, whose reminder reads "You may return …": QA-ST01–04, ST04-016 Blast Breath, "Can I activate this card without paying the DON!! −1? Yes … nothing will happen" (rulings.md RL-52). The engine plays the Event for its printed cost and asks the activation cost, with "use" unavailable when it cannot be paid.*
- E-Q10. Data defects found by Track E for M1 overrides: OP13-004 Sabo's sign defect is not caught by the repair rule; one Sakazuki's name is truncated to "Sakazuk"; OP12-018 has shifted columns; two meta cards have empty text (vanillas per Limitless).

- M4b-1. OP15-032 Brook "Rest up to 1 of your opponent's cards": can it rest an opponent's DON!! card? Best answer: yes, by the same reading as E-Q3 (OP15-035 Laboon's "rest 2 of your cards"): the runtime supports both (`rest` from `field` plus `donCostArea`), and wave 2 scripts it with both zones. Competing reading: field cards only. Needs a Q&A. *Closed 2026-11-16 (M4b review): yes, DON!! is a rest target (official Issho and Mihawk Q&A: "Rest up to 1 of your opponent's cards" may rest a Leader, Character, Stage or DON!! card). The engine was right; independent test B-2 rewritten.*
- M4b-2. OP14-041 Hancock's [DON!! x1] "When one of your {Amazon Lily} or {Kuja Pirates} type Characters with 5000 base power or more is K.O.'d" reads the K.O.'d card with its printed values (a card in the trash), not a last-known snapshot. They differ only for a Character whose base power an effect set (OP17-112, OP15-071, OP15-092). Best answer: printed values; revisit if a ruling says otherwise.
- M4b-3. "Turn 1 card from the top of your Life cards face-up" (EB04-059, EB03-053, OP15-114) when the top card is already face-up: the runtime treats the cost as unpayable. Competing reading: the next face-down card, or the cost is satisfied. No ruling found. *Closed 2026-11-16 (M4b review): the cost is unpayable when the top Life card is already face-up (official OP15-114 Q&A). The engine was right.*
- M4b-4. `giveDon` "up to" gives as many DON!! as are available and never asks for fewer; a player who wants to keep a rested DON!! (to pay a later cost) cannot. Best answer: fewer is never better for the giver; revisit if a card makes it so. *Closed 2026-11-16 (M4b fix round 1): the player may give any number from 0 to N (ST01-011 Q&A: "Can I use this [On Play] effect to give only 1 rested DON!! card? Yes"; QA-GR; CR 4-8-1). `giveDon` asks the count (a mode choice, most first, "None" last) when more than one DON!! can be given, then the target; with one DON!! the target choice may end with `done`. `each` is unchanged (OP14-105).*
- M4b-5. "Then, <effect>" after an "If <condition>, <effect>" clause: is the "Then" part gated by the condition? Wave 2 put it inside the guard for OP09-078, EB02-052, OP06-115, OP14-107, OP14-112, EB04-038, OP13-118, OP15-058, OP15-074, OP15-075, OP15-076, and outside it for OP08-115, OP05-115, EB03-053 and the Luffy & Ace cards (OP12-015, OP12-018, OP17-017, OP14-031), each by its wording (readings in `docs/research/m4b-wave2/*.md`). Best answer: per card as scripted; no official Q&A found for any. The M4b review checks the split for consistency. *Closed 2026-11-16 (M4b review): a "Then" after a failed "If" does not resolve (official OP14-111/112, OP14-070, OP15-116, EB02-052, OP13-118 Q&As; CR 4-10-1, 8-3-3). Every card was consistent with that except OP08-115, fixed in M4b fix round 1 (the play of [Upper Yard] is inside the guard). OP05-115, OP12-015, OP12-018, OP17-017, OP14-031 and EB03-053 are not "If, Then" wording and stay.*
- M4b-6. OP15-119 Luffy "reveal up to 1 card from the top of your Life cards": scripted as always revealing. A player may prefer not to reveal (it shows the opponent a Life card). Best answer: offer the choice (it is "up to"); flagged for the M4b review. *Closed 2026-11-16 (M4b fix round 1): "up to 1" may be 0 (CR 4-8-1, QA-GR), so OP15-119's activation is optional (asked before the reveal; not offered with no Life card).*
- M4b-7. "If there is a Character with a cost of 12 or more" (11 Elbaph cards): read as any Character on either field, current cost, the card itself included. Competing reading: your own Characters only. Best answer: either field, by the wording ("If you have ..." is used where only yours count, e.g. OP13-004). *Closed 2026-11-16 (M4b review): either field, current cost, the card itself included (the text has no "your"). The engine was right.*

## Engine (from the M2 review)

- M2-16. Single-elimination loss rule (TRM §5.2: on a simultaneous loss, the turn player loses; RL-27). It needs a new `GameSetup` option, and `GameSetup` is a frozen shape. Best answer: add an optional `lossRule: 'bothLose' | 'turnPlayerLoses'` when a tournament mode is built (backlog). Casual play records `bothLost` and shows a draw.

## M6b-1 runtime audit (2026-11-23)

Full text, proposed readings, source auditor IDs and what `rulings.md`/`rules-digest.md` already say are in `docs/research/m6b-runtime-audit.md` §7 (per-card evidence in `docs/research/m6b-audit/block{5,4,3}.md`). One line per question; the 15 cards held for design decisions D1 to D9 are in §3 of the same file.

- M6b-Q1. ST32-001/003/004/005, EB03-014: attribute name dropped from the verified text; restore Slash by override.
- M6b-Q2. OP15-102, OP11-023, EB03-006, OP14-016, OP13-017, EB02-005: lost +/- signs on power and cost; check each at verification.
- M6b-Q3. PRB02-017: timing header missing; probably [Activate: Main].
- M6b-Q4. EB05-001, EB05-057, OP16-039, OP16-043, OP16-014, OP14-119, OP14-120, EB04-025: scrape typos; EB-05 text is unverified.
- M6b-Q5. OP17-043, EB04-044: unqualified "would be removed from the field": does it cover battle K.O. and own effects?
- M6b-Q6. OP13-046: does one Once Per Turn cover both replaced events?
- M6b-Q7. EB05-061: "removed from the field by your opponent" with no "effect".
- M6b-Q8. EB05-052: is replaced damage not dealt at all (no Life card, no Trigger)?
- M6b-Q9. OP16-034: distinct names including itself, or Characters named differently from it?
- M6b-Q10. OP16-080, OP14-060: new Block Step, [When Attacking] refire, legal new targets after redirecting an attack.
- M6b-Q11. OP16-079: does "played from your trash" cover any play, and is "that Character" the played card?
- M6b-Q12. OP01-120: is the 2000-power Blocker filter read at block time or at resolution?
- M6b-Q13. OP16-116 and others: is "Then" gated by a failed "If"? (answered: yes, M4b-5)
- M6b-Q14. OP17-117: opponent may trash 3 from hand with fewer than 3 cards.
- M6b-Q15. OP17-099: whose hand, and who chooses, in each mode.
- M6b-Q16. OP17-057, OP16-001: one target in total over Leader and Characters; power condition on both.
- M6b-Q17. EB05-010: printed or last-known values for the K.O.'d Character (answered: printed, M4b-2).
- M6b-Q18. OP04-083: does the protection cover Characters that arrive later?
- M6b-Q19. EB05-048, EB05-049, OP16-008: is a K.O. cost a K.O.? (answered: RL-15, RL-16)
- M6b-Q20. OP16-041: any move off the field, with the type read as it left?
- M6b-Q21. OP16-022: "only Characters are X" with no Characters (E-Q4 precedent says false; auditor proposed true).
- M6b-Q22. OP16-100: any K.O. of an opponent's Character this turn, and replaced K.O.s?
- M6b-Q23. EB05-043: K.O.-or-rest then target, as a choose-one.
- M6b-Q24. OP15-003/010/012/017/023/025/026/028: whose DON!! is given, active or rested.
- M6b-Q25. OP15-023, OP14-024, EB03-012, EB03-061, OP10-033: do "cards" include DON!! for rest and skip-refresh?
- M6b-Q26. OP15-073, EB03-010: one card in total or one of each description.
- M6b-Q27. OP15-014, OP15-046, EB03-031, OP12-041: cost paid and destination when an effect activates an Event.
- M6b-Q28. Same four: does it count as activating an Event for watchers?
- M6b-Q29. EB03-003/007/009/039, EB04-052, EB04-010: "no base effect", "same as Leader", "power to 0".
- M6b-Q30. OP14-021/027/028/032/035/119/070: does attacking, blocking or paying a cost count as becoming rested?
- M6b-Q31. OP14-045/049/056, OP12-040, ST15-001: does a cost count as "by an effect"? (RD 112 and RL-16 conflict with the auditors)
- M6b-Q32. OP13-003: given DON!! state and the first player's single placement.
- M6b-Q33. OP13-028: `cannotPlay` has no hand-only scope.
- M6b-Q34. OP13-066: when is the DON!! added, when set active.
- M6b-Q35. OP11-066/071/073/074/079/081: range, publicity and empty deck for "choose a cost".
- M6b-Q36. OP10-118: once-per-turn K.O. protection is spent when it prevents.
- M6b-Q37. OP12-096: "may select cost 6 or less instead" as an if/else.
- M6b-Q38. OP11-092: played Character already gone at end of turn.
- M6b-Q39. OP09-101: cost that moves an opponent's Character into their Life.
- M6b-Q40. OP10-022: revealed Life card played; does lifeRemoved fire?
