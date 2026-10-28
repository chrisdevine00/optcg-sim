# Open questions

Unresolved ambiguities with the current best answer. Remove an entry when it is settled and the decision is logged in DECISIONS.md.

- Which card-data source gives clean, non-watermarked images with display rights, and what is its newest-set coverage today? (Resolve in Phase 1, Track B.)

## Rules (from Track A; full reasoning in docs/research/rules-digest.md "Open questions")

- R1. Cost payment order when playing a 6th Character. Best answer: reveal → pay → trash 1 → place. Track F to confirm.
- R2. Does the 5-Character trash procedure apply to effect-played Characters? Best answer: yes (CR 3-7-3, 3-7-6). Track F to confirm.
- R3. Effect damage ≥2 when Life runs out partway. Best answer: each point is a separate damage event, so a point taken at 0 Life defeats; battle damage (Double Attack) is fixed at determination. Track F to confirm.
- R4. Simultaneous loss result. Best answer: store `bothLost`, show as a draw; optional tournament setting where the turn player loses (TRM §5.2).
- R5. Rule-processing granularity for simultaneous actions. Best answer: check after each player's atomic action (turn player first).
- R6. Replacement effects without "may" are mandatory. Best answer: mandatory unless worded "may/can".
- R7. [DON!! xX] is a plain state check (≥ X), valid on either turn unless also [Your Turn].
- R8. [Trigger] does not pay the card's printed cost.
- R9. A Leader with [Blocker] could block under CR wording; not relevant to current cards.
- R10. CR 6-5-5-1 "cost area" is a typo for Character area.
- R11. Stage is not a DON!! −X source (CR 8-3-1-6 over the Q&A).
- R12. [On Your Opponent's Attack] activates before the end-of-Attack-Step check (CR 7-1-1-3/4).
- R13. Tournament procedure (cuts, time limits) is not enforced in v1.

## Strategy (from Track D part 2; detail in docs/research/strategy-concepts.md "Open questions")

- S1. TCGplayer "How to Swing for Lethal" and a Blue-Green Luffy guide were read only as search snippets (pages rendered without text). Best answer: do not use their claims as coach content until a page is read in full; coach lethal math rests on the CR plus onepiece.gg.
- S2. Paid Metafy frameworks ("2K Rule", "Power Staircase", life thresholds). Best answer: do not buy or cite paywalled content; the coach cites only freely readable sources (logged in DECISIONS.md).
- S3. Double Attack at 1 Life does not win (CR 7-1-4-1-1). Track F to confirm with an official ruling.
- S4. DON!! −X returned DON!! re-enters through later DON!! Phases, within the 10-card cap. Track F to confirm.
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

- C1. SeaKing, the main baseline, could not be observed (robots.txt disallows Anthropic agents). Best answer: the owner plays one SeaKing game by hand using the checklist in teardown §2 and adds notes before Phase 4 is gated; until then, Phase 4 designs from PROMPT.md's description of SeaKing.
- C2. DuelVoyager is not studied (same reason). Best answer: out of scope unless the owner fills it in by hand.
- C3. OPlayTCG and OPTCG Web Sim also claim AI opponents and were not opened. Best answer: check their robots.txt and terms during Phase 4 preparation, and study them only if allowed.
- C4. Bandai's browser Teaching App was observed only up to its Terms of Use, which prohibit unapproved external tools. Best answer: the owner plays its tutorial by hand if Phase 4 needs more than the official play guide.
