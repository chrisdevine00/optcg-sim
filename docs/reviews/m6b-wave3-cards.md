# M6b review: wave 3 cards (scripting batch 6, 14 scripts)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` twice (second merge at `ff1cafd`, which includes the OP-15 fix round `dadaaca`: Lucy's hand gate, engine 0.5.12). `npm ci`. No repository code was changed; the temporary harnesses (`engine/test/w3rev/`, `ai/test/w3rev-pirate.test.ts`) and mutations were removed or restored (`git status` clean before this file).

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable; 1 = nit. Any 3 or 4 fails.

**Verdict: FAIL.** Two severity 4 findings (OP16-041 Buggy and ST32-003 Mihawk gate a hand prompt on a filtered hidden-zone condition, so the opponent can tell whether the hand holds the card). No severity 3. Two severity 2, five severity 1. Lucy (OP15-002) had the same defect at the merge base; it is fixed on `main` (`dadaaca`) and re-probed clean.

## Method

1. Compared each of the 14 scripts with the verified text in `cards/data/sets/OP-15.json`, `OP-16.json`, `ST-32.json` (textFixes included), clause by clause (cost, "you may", "up to", "if", "then", duration, filter, owner, timing). Names and types used as filters exist with exact spelling (`Prisoner of Impel Down`, `Perona`, `Yamato`, `East Blue`, `Impel Down`, `Slash`).
2. Read the readings (`docs/research/wave3-scripting.md`), wave 3 notes (`m6b-wave3.md`), DISAGREEMENTS (none; no `it.fails`) and API-GAPS, OPEN-QUESTIONS M6b-Q24, Q25, Q30, Q41 to Q47, DECISIONS "Empty picks".
3. Hidden-information probes: for each script that asks a prompt from a hand or deck, two positions identical except for one hidden card, compared through `project(state, 'p2')` (the opponent's view) at the first prompt.
4. Random games, replay, leak and skeleton checks; Pirate AI games; mutation run (numbers below).

Author tests: 276 passed across the 14 `engine/test/cards/<ID>.test.ts` and the 14 `engine/test/independent/cards/w3/` files (the author suite has 98 `it`, the independent suite 141).

## Findings

### W3C-R1 (4) OP16-041 Buggy: the prompt's presence depends on whether the hand holds [Prisoner of Impel Down]
- **Script:** `effect: [{ if: { exists: { from: 'hand', owner: 'you', filter: { name: 'Prisoner of Impel Down' } } }, then: [ play up to 1 ... ] }]`. The scripter's note (`wave3-scripting.md`) says the guard exists "so no dead prompt appears".
- **Probe** (Leader with 1 DON!!, an {Impel Down} Character K.O.'d by the opponent; hand `[Prisoner]` against hand `[vanilla]`): the opponent's projected decision is `{"kind":"choose","player":"p1","prompt":"Your opponent is choosing."}` in the first and `{"kind":"main","player":"p1","prompt":"It is your opponent's Main Phase."}` in the second. The opponent learns whether the hand holds the card.
- **Rule:** DECISIONS "Empty picks (M4b-05)": with a filter over a hidden zone the choice is still asked at max 0, because skipping it tells the other player that no matching card exists (CR 8-4-4-2, ADR 0005). Only the whole zone being empty (public) may skip it.
- **Fix:** gate on the public hand size (`cmp [{ hand: 'you' }, '>=', 1]`) as `dadaaca` did for Lucy; the pick stays `upTo: 1` with the filter and is asked at max 0 when nothing matches. The author test that pins "nothing asked" with no Prisoner in hand must change to answer the empty prompt. Add a leak test (two hands differing in the Prisoner, equal opponent views).

### W3C-R2 (4) ST32-003 Dracule Mihawk [On Play]: the prompt's presence depends on the hand holding an eligible Character
- **Script:** `if: all [ leader attribute Slash, exists { from: 'hand', ... filter: Character, cost <= 5, [Perona] or <Slash> } ]`. The Leader attribute is public; the `exists` over the hand is not.
- **Probe** (Leader {East Blue}/<Slash>, Mihawk played; hand with a <Slash> cost 2 Character against hand of two <Strike> Characters): opponent's view `choose / "Your opponent is choosing."` against `main / "It is your opponent's Main Phase."`.
- **Fix:** keep the Leader condition (public) and gate the pick on hand size at least 1; ask the filtered pick at max 0 when none is eligible. Same test change as R1.

### W3C-R3 (4, fixed on `main`) OP15-002 Lucy: same defect at the merge base
- At the first merge (`fbf7597`) the pick was gated on `exists` an Event or Stage in hand: opponent's view `choose / "Your opponent is choosing."` against `block / "Your opponent is attacking..."` depending on one hand card. The lead's `dadaaca` gates on `cmp [{ hand: 'you' }, '>=', 1]`; the same probe after the second merge shows `choose` in both positions. Closed; no action.

### W3C-R4 (2) Why the random leak property did not find R1 and R2
- 2,000 two-sided games with decks that force 3 copies of every card of the batch that fits the Leader's colours (Leaders OP15-002 and OP16-041 on one seat in three of four games, all other Leaders random Standard): 319,117 actions, 0 invariant failures, 0 anomalies, 0 replay differences (every record replayed to an equal final view), 0 capped games; 211,396 view-and-skeleton permutation checks (every third state, both viewers), 0 differences. The prompt for R1 and R2 is a single state per play and the permutation must change the eligibility of a hand card, which almost never happens at the sampled states. Targeted two-position probes (Method 3) found both at once. Recommendation: a planted leak test per `exists`-gated hand prompt in the batch (the pattern of `engine/test/cards/m6b-w3/g22-hand-trash.test.ts`), and a lint in `cards/` that refuses `exists { from: 'hand' }` as the sole gate of a pick `choose` (a hidden zone with a filter).
- Events seen in the games (counts of events that name one of the 14 cards): DonGiven 12,203, Rested 11,558, EffectActivated 19,907, KO 2,368, EffectDeclined 626, ModeChosen 193, ReplacementApplied 13, EventActivated 650, SetActive 3.
- Pirate AI games (`ai/test/support/match.ts`, same decks, ten games per Leader OP15-002 and OP16-041, rotating opponents): 20 played, 0 errors, 0 fallbacks, 0 capped.

### W3C-R5 (2) OP15-003/010/012/017/023/026/028: "its owner's" DON!! is read as the opponent's (M6b-Q24), seven cards depend on it
- The reading: the DON!! given is the opponent's own cost-area DON!!, to their Leader or Characters. The text of the cost clause ("give 1 of your opponent's rested DON!! cards to 1 of your opponent's Characters") names the opponent explicitly, and "its owner's Leader or 1 of their Characters" would be odd for your own DON!!, so the reading is the more natural one. OP15-010 and OP15-012 have no antecedent ("Give up to 1 rested DON!! card to its owner's Leader or 1 of their Characters"); a reading in which it is any rested DON!! on the field (including your own) cannot be excluded from the files. No Q&A row exists in `rulings.md`. Kept open as Q24; not 3 because nothing contradicts it. The independent tests deliberately keep their own DON!! active so they pass under both readings.
- **Q44 (OP15-023, OP15-028 who picks active or rested):** the giver picks only when both kinds are present and not all go; acceptable, and the DON!! counts are public (no leak).

### W3C-R6 (2) OP15-023 Arlong [On K.O.]: "rested cards" excludes DON!! (Q25)
- Script: `skipRefresh` over Leader, Characters, Stage with `state: 'rested'`, `upTo: 2`. If "cards" includes rested DON!! cards in the cost area (they are "DON!! cards", not "cards", in most wordings; the card's own second ability says "DON!! card"), the script is right. The refresh-skip lasts one Refresh Phase only (author test over two opponent turns). Open as Q25; the reading matches the audit's block 4 Q5. Filed at 2 because a DON!! reading would change which targets exist.

### W3C-R7 (1) Readings judged acceptable
- **OP15-059 Amazon (Q45):** with no active DON!! the opponent cannot return one, so "if they do not" applies and the -2000 happens with no offer (an `if` on the public active-DON!! count, so no leak; the opponent's `chooseOne` is shown only when they have one). The -2000 target is chosen by Amazon's controller after the opponent's choice, which matches the text's order. Accepted.
- **OP15-002 Lucy:** "trash any number" as the pick is right (choosing none is the decline); +1000 per card actually trashed. The second ability's "If" has no colon, so it is an effect condition and the Once Per Turn is spent when it is false (RL-style reading, tested). The Event's base cost is read from the printed cost when activated from hand. Accepted.
- **ST32-003 Mihawk:** "[Your Turn] ... becomes rested" counts every cause on your turn (attack, cost, effect); draw 1 and trash exactly 1, not optional. Q30/Q41 open; the opponent's-turn rest is correctly excluded by `yourTurn`. Accepted.
- **OP16-041 Buggy (Q17, Q42, Q43):** any move off the field of an {Impel Down} Character counts; Once Per Turn is spent even if no Prisoner is in hand; `donGiven: 1` is checked at trigger and at resolution. Accepted apart from R1.
- **OP16-024 Inazuma:** `koCause: 'opponentEffect'` matches an effect (a cost included) of the K.O.'d card's controller's opponent and neither a battle K.O. nor the controller's own effect. Matches the text.
- **OP15-026 Jango, OP15-028 Meowban:** probed with no rested DON!! and no Characters: no dead prompt (the effect finds nothing and the Main Phase resumes; Jango's cost is still paid, which the text permits: "you may trash this Character"). Jango's [On Play] look-at-top asks a max-0 choose when no {East Blue} card is in the top 3: that is the standing convention (the looked-at cards are private; skipping would show their absence), so it is not a defect.
- **OP16-074, OP16-100, OP15-012, OP15-017, OP15-010:** no clause mismatch (counts, `restDon 2`, "If" after the colon so the cost is paid when false, once-per-turn flags, `Blocker`).

### W3C-R8 (1) `cards/src/optional-cost.ts` (fdd576e): the new unit match is safe on scripted cards
- `printedWindow` for `onKO` is `^When this Character is K\.O\.'d\b`, so it matches only a unit that begins with that phrase. Scan of every `effectText` in `cards/data/sets/*.json`: units that begin so are EB01-057, OP11-024, OP11-035, OP11-051, OP16-024 (all but OP16-024 unscripted today) and ST15-003 / OP02-085, which start with `[Opponent's Turn]` and do not match. No card has both a tagged `[On K.O.]` unit and an untagged one, so `units.find` cannot return the wrong unit. `cards/test/optional-cost.test.ts`: 517 passed. When EB01-057, OP11-024/035/051 are scripted, their `onKO` unit is the untagged one by design. A card with two `onKO` autos where one is tagged and one is not would pair both with the first match; none exists.

### W3C-R9 (1) Mutation survivors
- 14 one-clause mutations (one per script), author and independent test counts of failing tests: OP15-002 (4, 4), OP15-003 (2, 2), OP15-010 (6, 4), OP15-012 (2, 6), OP15-017 (1, 1), OP15-023 (2, 3), OP15-026 (2, 3), OP15-028 (4, 7), OP15-059 (2, 4), OP16-024 (1, **0**), OP16-041 (5, 7), OP16-074 (2, 3), OP16-100 (2, 2), ST32-003 (2, 1). Mutations: Lucy bonus 1000 to 500; Alvida power cap 6000 to 7000; Nezumi rested to active; Buggy OP15-012 [When Attacking] to [On Play]; Morgan once per turn removed; Arlong upTo 2 to 1; Jango look at 3 to 4; Meowban Leader type East Blue to Navy; Amazon -2000 to -1000; Inazuma `koCause` to `effect`; Buggy OP16-041 `donGiven` 1 to 2; Magellan on K.O. 4 to 3; Glacier Slash `restDon` 2 to 1; Mihawk cost 5 to 6.
- The author tests caught all 14; the independent tests caught 13. **OP16-024 `koCause: 'effect'` survived the independent suite** (no independent test K.O.s Inazuma with its own controller's effect). The author test catches it.
- **Weak spot in both suites:** none of the author or independent tests for R1 and R2 asserts that the prompt appears when no card is eligible, nor compares the opponent's view across two hands, so the leak was invisible to all of them.

### W3C-R10 (1) Doc nits
- `docs/research/wave3-scripting.md` still says OP16-024 is "held back" and lists 13 scripted; the script is registered and the checker accepts it (fdd576e).
- The `exists` guard rationale in that file ("so no dead prompt appears") is the claim R1 and R2 show to be wrong; update when fixed.

## Numbers

- Scripts compared: 14; clause mismatches against text: 0.
- Findings: severity 4: 2 open (R1, R2) plus 1 already fixed on main (R3); severity 3: 0; severity 2: 2 (R5, R6); severity 1: 4 (R7 to R10 as listed); R4 is a method note (coverage).
- Random games: 2,000 (319,117 actions), 0 errors, 0 replay differences, 211,396 permutation checks, 0 differences; Pirate: 20 games, 0 errors, 0 fallbacks.
- Targeted leak probes: 6 positions pairs (Lucy pre-fix, Buggy, Mihawk, Alvida, Jango, Lucy post-fix): leaks in 3 at the first merge, 2 after the second.
- Mutations: 14 of 14 caught by author tests, 13 of 14 by independent tests.

## Fix round (runbook step g)

Script-only changes (no ENGINE_VERSION bump; goldens unchanged, full suite green). The sweep came from the new static check `cards/src/hidden-gate.ts` (`cards/test/hidden-gate.test.ts`, DECISIONS "Static hidden-gate check"), which found exactly these two gates in all scripts; its allowlist is empty.

- **W3C-R1 (fixed, script):** OP16-041 Buggy now gates on `cmp [{ hand: 'you' }, '>=', 1]`; the pick is asked at max 0 when no [Prisoner] is held, and not at all with an empty hand. Author tests: the "nothing asked" assertion became "asked at max 0, answer none"; a planted two-position leak test (hands `[Prisoner]` against `[vanilla]`, same public state: `project` and `projectEvents` for the opponent are identical). The new tests fail with the old script (checked).
- **W3C-R2 (fixed, script):** ST32-003 [On Play] keeps the public Leader condition and gates on hand size at least 1; the filtered pick is asked at max 0 when none is eligible. Author tests: "nothing asked with no eligible card" became "asked at max 0"; added an empty-hand test (nothing asked) and a two-position leak test (`[SLASH_2, SLASH_5]` against `[SLASH_6, STRIKE_3]`, identical opponent views). They fail with the old script (checked).
- **W3C-R3:** closed on main (Lucy).
- **W3C-R9 (kill test added):** independent `OP16-024.test.ts` now K.O.s Inazuma with its controller's own planted [Activate: Main] and asserts nothing is rested; with `koCause` mutated to `'effect'` it fails (checked, then restored).
- No independent test needed editing for R1/R2 (none asserted the absence of the prompt).
- R5, R6, R7, R8, R10: not touched here.
