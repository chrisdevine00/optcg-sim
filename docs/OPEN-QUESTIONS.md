# Open questions

Unresolved ambiguities with the current best answer. Remove an entry when it is settled and the decision is logged in DECISIONS.md.


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
- E-Q5. Who picks the card in "trash … from your opponent's hand" (ST10-010, OP17-075)? *Resolved for OP17-075 by QA-OP17: the player who activated it chooses face-down; the engine picks at random.*
- E-Q6. May a player choose a "choose one" mode that would do nothing? *Resolved for OP17-049 by QA-OP17: yes (with 1 card they trash it; with 0 nothing happens).*
- E-Q7. Which events does "removed from the field by your opponent's effect" cover, and how is it ordered against a K.O. replacement?
- E-Q8. Are unsigned power and cost values on self-directed effects sign defects? Best answer: check each by hand in the M1 verification of the 182 meta cards.
- E-Q9. Should printed keywords work on otherwise unscripted cards? Settled: yes, via verified overrides (E-D7).
- E-Q11. "Add up to N DON!! cards" and "set up to N DON!! cards as active": may a player choose fewer? *M4a best answer: the engine adds or sets as many as possible without asking (DECISIONS 2026-10-29). A card where fewer is better would need a choice.*
- E-Q12. May an Event's activation cost be declined after the Event is played? *Closed 2026-10-29 (M4a-08): yes, for a "you may" cost (CR 8-3-1-4; coordinator ruling B-1) and for DON!! −X, whose reminder reads "You may return …": QA-ST01–04, ST04-016 Blast Breath, "Can I activate this card without paying the DON!! −1? Yes … nothing will happen" (rulings.md RL-52). The engine plays the Event for its printed cost and asks the activation cost, with "use" unavailable when it cannot be paid.*
- E-Q10. Data defects found by Track E for M1 overrides: OP13-004 Sabo's sign defect is not caught by the repair rule; one Sakazuki's name is truncated to "Sakazuk"; OP12-018 has shifted columns; two meta cards have empty text (vanillas per Limitless).

## Engine (from the M2 review)

- M2-16. Single-elimination loss rule (TRM §5.2: on a simultaneous loss, the turn player loses; RL-27). It needs a new `GameSetup` option, and `GameSetup` is a frozen shape. Best answer: add an optional `lossRule: 'bothLose' | 'turnPlayerLoses'` when a tournament mode is built (backlog). Casual play records `bothLost` and shows a draw.
