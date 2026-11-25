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
- E-Q11. "Add up to N DON!! cards" and "set up to N DON!! cards as active": may a player choose fewer? *M4a best answer: the engine adds or sets as many as possible without asking (DECISIONS 2026-10-29). A card where fewer is better would need a choice. 2026-11-16 (M4b fix round 1): the CR does allow fewer (CR 4-8-1; M4b-4 below was ruled that way for giving DON!!), but for adding and setting active more is never worse for the player and no meta card needs fewer, so the engine is deliberately unchanged (a count decision per add would only cost prompts). Revisit if a card makes fewer better. *Reopened and closed 2026-11-24 (OP-17 review OP17-R2, engine 0.5.7): "add up to N DON!!" now asks a count like `giveDon` does (a `mode` choice, most first, "None" last; per part for a two-part add such as EB04-031 or OP15-058); an exact "add N" (no `upTo` in the script) still asks nothing, and an empty DON!! deck asks nothing. Reason: 38 Standard-legal cards compare DON!! counts against the opponent's, so extra DON!! can hurt the player, and giving already asked. "Set up to N DON!! as active" (`setActive`) was left unchanged at that point; *reopened and closed 2026-11-24 (OP-14 review OP14-R2, engine 0.5.13): counter-examples exist (OP07-023, OP13-001, the "give rested DON!!" family), so `setActive` with `upTo` now asks a count like `addDon`.* See docs/research/eq11-adddon.md.*
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
- M6b-Q5. OP17-043, EB04-044: unqualified "would be removed from the field": does it cover battle K.O. and own effects? *Built: yes for both. The Character-area overflow trash (a sixth Character) is rule processing, CR 3-7-6-1-1, and is not replaced: EB04-044 is trashed with no offer when chosen for it (W4-R6, pinned in `w4-fix-round.test.ts`; same reading as Law in effect-dsl.md).*
- M6b-Q6. OP13-046: does one Once Per Turn cover both replaced events? *Open. The mechanism is built (wave 4, G14 b): `replaces` may be a list and one ability, one Once Per Turn, covers all its events; two separate replacements give two uses. Which one OP13-046 is stays for its review.*
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
- M6b-Q26. OP15-073, EB03-010, EB03-042: one card in total or one of each description.
- M6b-Q27. OP15-014, OP15-046, EB03-031, OP12-041: cost paid and destination when an effect activates an Event.
- M6b-Q28. Same four: does it count as activating an Event for watchers?
- M6b-Q29. EB03-003/007/009/039, EB04-052, EB04-010: "no base effect", "same as Leader", "power to 0". *Settled 2026-11-24 (block 4 tail fix round, lead decision; B4T-R1, B4T-R2): "the same as your opponent's Leader" reads the Leader's **current** power (EB04-052 now matches OP16-036 and OP16-055; OP-16-Q2 and the audit's base-power reading are closed); "Set the power of ... to 0" lowers the target's power by its current power at resolution (CR 4-12-1, rules-digest 35; EB04-010 uses `power` with `mul: [{ targetPower: true }, -1]`). ST34-004 says "base power becomes 0", so it stays a base-power set. "No base effect" is unchanged.*
- M6b-Q30. OP14-021/027/028/032/035/119/070: does attacking, blocking or paying a cost count as becoming rested?
- M6b-Q31. OP14-045/049/056, OP12-040, ST15-001: does a cost count as "by an effect"? (RD 112 and RL-16 conflict with the auditors) *Cost half settled 2026-11-24 (OP-14 fix round, lead decision): a cost is part of the effect (CR 8-1-1, RD 112), so a card trashed as a cost counts ("trashed from your hand by an effect"); OP14-045/049/056 have `includeCosts: true`. DECISIONS 2026-11-24.*
- M6b-Q32. OP13-003: given DON!! state and the first player's single placement.
- M6b-Q33. OP13-028: `cannotPlay` has no hand-only scope. *Settled 2026-11-24 (OP-13 fix round, OP13-R3, engine 0.5.14): `cannotPlay` takes `from: 'hand'`; OP13-028 bars only plays from the hand, so a same-turn play from the trash or deck by an effect is allowed. The other `cannotPlay` scripts (OP13-023, 118, OP14-024, EB05-021, OP17-085, 092) have no zone in their text and keep the any-means bar.*
- M6b-Q34. OP13-066 Silvers Rayleigh: when is the DON!! added, when set active. *Open (OP-13 review OP13-R4): scripted as the whole add delayed to the end of the turn (the audit's proposal); the other reading is "add now (rested), set active at the end of this turn", which differs while the turn runs (the DON!! count for OP13-068/071 "8 or more DON!!", and rested DON!! can be given, OP13-100, 005). No ruling on file; owner decision.*
- M6b-Q35. OP11-066/071/073/074/079/081: range, publicity and empty deck for "choose a cost".
- M6b-Q36. OP10-118: once-per-turn K.O. protection is spent when it prevents.
- M6b-Q37. OP12-096: "may select cost 6 or less instead" as an if/else.
- M6b-Q38. OP11-092: played Character already gone at end of turn.
- M6b-Q39. OP09-101: cost that moves an opponent's Character into their Life.
- M6b-Q40. OP10-022: revealed Life card played; does lifeRemoved fire?
- M6b-Q41. OP10-036, PRB02-009, OP14-070: "rested by your (opponent's) effect": does a rest paid as a cost count? Built: a `by` qualifier matches a rest by an effect only; leaving `by` out matches every cause (attack, block, cost). Joins Q30.
- M6b-Q42. OP16-041, OP13-078, OP10-042: a K.O.'d Character's [On K.O.] and the "removed from the field" watchers activate together; whose order? Built: the removal watchers are queued first, as their own batch, then the [On K.O.] (so a player orders them only within a batch).
- M6b-Q43. OP16-041: is a Character trashed to make room (Character area full, CR 3-7-6-1) "removed from the field"? Built: yes when the timing names no `cause`; no when it names one (a rule move is not an effect).
- M6b-Q44. OP15-023, OP15-025, OP15-028: "give DON!! from its owner's cost area": who picks active or rested? Built: the giver, asked only when both kinds are there and not all of them go. Joins Q24.
- M6b-Q45. OP14-065, OP16-074, OP15-059: "your opponent returns N DON!! cards" when they have fewer (as many as they have, built), and OP15-059's "may return 1 of their active DON!!" when they have none active (they cannot return one; not yet decided how the offer reads). The owner chooses which classes (RL, QA-OP16 OP16-074).
- M6b-Q46. OP12-040, OP14-045/049/056: "a card is trashed from your hand by an effect": one event per trash instruction (built) or per effect resolution (an effect with two trash steps)? Joins Q31 (costs).
- M6b-Q47. EB04-016, OP10-030: "you cannot set DON!! cards as active using Character effects": built as a restriction on the DON!!'s owner against any Character effect, either player's; no ruling on whose Character effect.
- M6b-Q48. OP15-024 Usopp [On K.O.]: "rest up to 1 of your opponent's Leader or Character cards with a cost of 7 or less": a Leader has no cost. Built: the cost limit restricts the Characters only and the opposing Leader is always eligible (review OP15-R4, fixed in the OP-15 fix round). The other reading (a Leader never matches a cost filter) was the first script. Look for an official Q&A.
- M6b-Q49. OP15-098 Monkey.D.Luffy (Leader): "would be removed from the field by your opponent" has no "effect": does a battle K.O. also trigger the Life-to-hand replacement? Built: opponent's effects only, as EB05-061 and OP15-035/069 (joins M6b-Q7; review OP15-R3). A Leader of this shape matters most in battle, so check the official card text and Q&A first.
- M6b-Q50. OP09-118 `winGame`: an effect's win against a defeat not yet processed (the opponent is also at a defeat condition in the same check, RL-27). Built: the effect's win is final at once and ends the game before any pending defeat is read. No ruling.
- M6b-Q51. OP14-001, OP14-009, OP14-017 `swapBasePower`: with another effect that already sets the same card's base power ("base power becomes N"), which value does the swap give? Built: each card takes the other's base power as it is now (set effects included) and is given as one more base-power setting, so the highest setting applies (CR 4-9-2-1), as for any two base-power effects. No ruling. Consequence (wave 4 review W4-R3, pinned in `engine/test/independent/cards/w4/w4-fix-round.test.ts`): two swaps on the same pair end with both cards at the larger value (Oars 9000 and Bepo 3000: 3000/9000 after the first, 9000/9000 after the second), because the second swap is one more base-power setting and the highest setting wins. "Swap" stops meaning "exchange" there. A ruling that a later swap replaces the earlier one changes that test on purpose.
- M6b-Q52. PRB02-006 rest replacement: with several of the owner's Characters rested by one effect, each Character is offered its own replacement (the others are rested at once); an "if you do" after the replaced rest reads it as done. No ruling for either.
- M6b-Q53. OP14-051 Hatchan `[DON!! xN] [On K.O.]`: built as the DON!! the card had given when it left the field (last-known information), as CR 8-3-2-3 checks the condition at activation. No ruling that names this combination.
- M6b-Q54. EB02-030 (D6): a replacement an Event creates "during this turn" applies to every matching K.O. of the turn (built: it is offered again each time, there is no Once Per Turn in the text). Decided in M6b-1 (D6), recorded here for the card's review.
- M6b-Q55. OP15-008 Krieg: "for every DON!! card given to that Character": built per target (each opposing Character gets -1000 for each DON!! given to it). The other reading (the one Character the [On Play] gave DON!! to) needs an official card text check before the card is scripted. Pinned (W4-R5, `w4-fix-round.test.ts`): with Kingdew holding 2 DON!!, Marco 1 and Sai 0, the activation gives 5000 / 4000 / 4000 (7000, 5000, 4000 less 2000, 1000, 0). The one-Character reading would give every Character -2000 (5000 / 3000 / 2000).

## EB-05 verification (2026-11-24, runbook step d.1)

- EB-05-V1. **EB05-031 Vinsmoke Reiju: cost 5 (optcgapi) or 4 (Limitless)?** Not verified and not scripted until it is read on the official card list (it was not reachable from here on 2026-11-24). Owner or next agent: read https://en.onepiece-cardgame.com/cardlist/ (EB-05 series) and write `cards/overrides/EB05-031.json`.
- EB-05-V2. EB05-014 Shirahoshi: block 5 (product) or X (Limitless)? Both are Standard-legal now, so play is unaffected; check the printed icon on the official list with V1.
- Five clear upstream defects were settled on Limitless (EB05-029 and EB05-053 missing [Trigger] text, EB05-057 "If your have", EB05-058 accent, EB05-030 and EB05-040 the ♡ in the name); each override says so.
- OP-17-V1. OP17-037 name: "Are You That Afraid of the New Era?!" (optcgapi) or "…?!!" (Limitless)? Read on the official list; no script depends on it.
- M6b-Q58. OP15-001 Krieg "If the only Characters on your field are {East Blue} type Characters" with no Characters on the field: built as not true (the aura is off; "the only Characters ... are" presupposes Characters, as OP16-022 in M6b-Q21). The empty field is common for this Leader (early turns, after a wipe), so the reading decides real games. Pinned in `w4-fix-round.test.ts` (W4-R4). No Q&A.
- M6b-Q56. EB04-013 Carrot "set up to 2 of your {Minks} Characters and your Leader as active": the Leader is always set (scripted, not part of "up to 2") or counts as one of the 2? Both readings agree on the tested cases (block 4 tail review, B4T-R6).
- M6b-Q57. EB03-021 Alvida: the second placement has no "of your opponent's" and may take one of your own Characters (scripted: sequential picks, the same card cannot fill both). Block 4 tail review, B4T-R6.
- M6b-Q59. "Turn 1 card from the top of your Life cards face-down" when the top card is already face-down (and, the mirror of M4b-3, "face-up" when it is already face-up): the runtime treats the cost as unpayable (`engine/src/effects/eval.ts`: `turnLifeFaceDown` needs every turned card face-up, `turnLifeFaceUp` needs face-down). Life is face-down by default, so the face-down cards are usable only after something turned the top card face-up. Competing reading: the cost is satisfied (a no-op) whatever the face, which makes these cards freely usable in any deck, a large play difference. M4b-3 was closed for the face-up half only (official OP15-114 Q&A); no ruling found for the face-down mirror. Cards: OP11-100, OP11-103, OP11-104, OP11-107, OP11-108, OP11-117, OP12-102, ST29-008, EB03-056 (named in the review). A search of `cards/effects` also finds `turnLifeFaceDown` in EB05-011 and `turnLifeFaceUp` in EB05-060, OP13-109, OP13-114, OP13-117 (the face-up users, with OP11-022, EB03-053, EB04-059, OP15-114, are the M4b-3 half). Source: review B3A-R2.
- OP-17-Q1. OP17-007 Kouzuki Oden: does "with 6000 power or less" apply to both "{Land of Wano} type Character card" and "Character card with a type including Whitebeard Pirates", or only the second? Scripted for both (review OP17-R1); a Q&A saying "second only" raises it to severity 3.
- OP-17-Q2. EB05-052 Gloriosa against a [Double Attack] hit: one "would take damage" for both points (scripted) or one per point (review OP17-R3; joins M6b-Q5 and Q8).
- OP-16-Q1. OP16-001 Ace Leader: does the "8000 power or more" clause cover the [Monkey.D.Luffy] branch too (audit) or only the Whitebeard branch (scripted)? Review OP16-R2; M6b-Q16.
- OP-16-Q2. OP16-036 / OP16-055 "the same as your opponent's Leader": current power (scripted) or base power (audit)? Review OP16-R5; M6b-Q29. *Settled 2026-11-24 (lead decision): current power; see M6b-Q29.*

## Block 4 verification (2026-11-24, runbook step d.1)

Block 4 sets (OP-13 to OP-15, EB-03, EB-04, ST-29, ST-02, PRB-02; OP-01 to OP-04 had no disagreements) were checked against Limitless. Clear upstream defects were settled on Limitless (each override says so); EB04-014 (Limitless typo "Kozuki") and OP13-079 (the "?" attribute the schema cannot hold) were verified with our value. The cards below are not verified; read the official card list (https://en.onepiece-cardgame.com/cardlist/) and write `cards/overrides/<ID>.json`.

- B4-V1. **EB04-048 Rob Lucci: "−2 cost" (optcgapi) or "+2 cost" (Limitless)** "for every 5 cards in your trash"?
- B4-V2. **OP13-084 St. Shepherd Ju Peter: different second ability.** optcgapi: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 \"Five Elders\" type card and add it to your hand. Then, place the rest at the bottom of your deck in any order." Limitless: "[Your Turn] If you have 10 or more cards in your trash, set the base power of all of your {Five Elders} type Characters to 7000."
- B4-V3. **OP14-094 Mr.5(Gem): attribute Strike (optcgapi) or Special (Limitless)?**
- B4-V4. **PRB02-017 Boa Hancock: "[Once Per Turn] You may trash 1 card with a [Trigger]..." (optcgapi) or "[On Play] You may trash..." (Limitless)?**
- B4-V5. **EB03-034 Charlotte Linlin: type {Big Mom Pirates} (optcgapi) or {Rocks Pirates} (Limitless)?**
- B4-V6. EB04-061 Monkey.D.Luffy (verified, all fields match): block X (optcgapi) or 4 (Limitless)? Block only; check the printed icon (as EB-05-V2).
- B4-V7. **OP14-103 Gloriosa: Limitless names it "Gloriosa (Grandma Nyon)"; ours is "Gloriosa".** `cards/src/validate.ts` rejects a name ending in "(...)" as a printing suffix, so the override cannot be written as is. Is "(Grandma Nyon)" part of the printed name (it matters for the four-copy rule, since other Gloriosa cards exist) or a Limitless disambiguation? Decide, then either relax the validator for printed parentheticals (OP14-091 "Mr.2.Bon.Kurei(Bentham)" has no space and passes) or verify with the plain name.

## Block 3 verification (2026-11-24, runbook step d.1)

Block 3 sets (OP-09 to OP-12, EB-02, ST-15, ST-22) were checked against Limitless. Clear upstream defects (dropped minus signs, `(Slash)` for `<Slash>`, missing [Trigger] text or cost clauses, joined types, missing line breaks) were settled on Limitless, and OP10-096 (a typographic apostrophe in Limitless) was verified with our value; each override says so. The cards below are not verified; read the official card list (https://en.onepiece-cardgame.com/cardlist/) and write `cards/overrides/<ID>.json`.

- B3-V1. **OP10-010 Chadros.Higelyges: Limitless names it "Chadros.Higelyges (Brownbeard)"; ours is "Chadros.Higelyges".** Same question as B4-V7: `cards/src/validate.ts` rejects a name ending in "(...)" as a printing suffix. Is "(Brownbeard)" printed or a Limitless disambiguation?
- B3-V2. **OP10-064 Clone Soldier: types {The Vinsmoke Family} {Kingdom of GERMA} (optcgapi) or {Kingdom of GERMA} only (Limitless)?**
- B3-V3. **OP11-031 Jinbe: types {The Sun Pirates} {Merfolk} {Fish-Man Island} (optcgapi) or {Fish-Man} {Fish-Man Island} {The Sun Pirates} (Limitless)?**
- B3-V4. **ST15-005 Portgas.D.Ace: counter none (optcgapi) or 1000 (Limitless)?** Limitless also has "−2000" where optcgapi has "2000" and line breaks around the reminder text (clear defects, to be fixed in the same override once the counter is settled).
