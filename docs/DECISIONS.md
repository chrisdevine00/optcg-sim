# Decisions

Newest first. One dated paragraph per decision: context, decision, alternatives rejected.

## 2026-10-29 — M5a fix round 1: "Why?" from public facts only, blind skeletons, gates that can fail

Context: the M5a review (`docs/reviews/m5a-review.md`) failed the milestone: the "Why?" chip's presence leaked the AI's hidden option count (M5a-01, severity 4), the search skeleton copied another player's decision verbatim (M5a-02), and the AI's follow-up picks were never announced (M5a-03), plus eleven severity-2 findings.

- **"Why?" is a function of public information (M5a-01).** The rule: an AI explanation depends only on the position as the player sees it, the AI's move (public once made) and its playbook (public). So every AI decision goes to the worker and stores an explanation, forced or not, and one builder (`ai/src/search/why.ts`) explains every decision the same way. "Only legal move." is gone (forcedness can be private), and so are `search-incomplete` labels (whether the budget ran out depends on how many moves the hidden hand allows). Reasons never cite the heuristic term a move gained on, because the search that ranked moves played out the AI's hidden cards. Wording stays true for any hidden hand ("It let the hit through", "It added its Life card to its hand", "Its Leader already holds"). The "thinking" state shows only on the AI's own turn; on the player's turn the uniform considering beat covers the search. Rejected: hiding the chip on forced windows (its absence leaks), and keeping term-based reasons with a filter (no filter can make a reason computed from hidden cards public). Guards: `ai/test/why-differential.test.ts` (reachable pairs that differ only in the AI's hand, Life or deck; 2,258 action explanations and 526 decisions compared) and the controller twin tests in `app/test/ai-controller.test.ts`. Both fail on the M5a code.
- **Playbook citations replace heuristic reasons (M5a-04).** When a move follows a playbook line whose condition is public, "Why?" cites the line and its guide source; otherwise a main move says "Its search ranked this move first, playing out guesses at your hidden hand." `avoidPlay` is never cited (its condition is a card in hand). Attacks carry `needed-hidden-info` (their result depends on the player's hand), and their outcome names Blockers and effects (M5a-07).
- **The skeleton is blind to other players' decisions (M5a-02).** When another player owes the decision, the skeleton holds only its public shape (kind, player, generic prompt) and is opaque; a record about a hidden card has its `cardId` and `label` blanked too. A reachable-pair differential (`engine/test/property/skeleton-diff.test.ts`) replaces the permutation property's blind spot; it fails on the M5a code in under a second.
- **Merged lines are announced (M5a-03).** An action that joins an earlier move (an effect's pick, the next DON!! of a group) re-announces that move's line, whole. A live-region test checks every final AI line was heard.
- **Defence (M5a-05, M5a-11).** At 0 Life a lethal hit is always defended when a defence exists, even when a later attack may still win; the take template has separate wordings for 0, 1–2 and 3+ Life; a defence of several cards is explained card by card, never previewing a card still in hand. The chosen defence survives an Event's target pick, and the worker forgets its plan and battle memory on rewind (`reset`).
- **DON!! steps (M5a-06)** explain only themselves, never the attack that may follow.
- **Scoring (M5a-15).** Candidates are compared over complete rounds of samples only, and the first round always completes once started, so no candidate goes unscored (at most one round past the budget per plan). Unchosen alternatives are no longer posted to the page. The fallback when a skeleton is opaque speaks as Pirate, not Rookie.
- **Weights (M5a-09).** Every weight now says what is sourced (the direction, with its passage) and what is inference (the number). The two changed during M5a say why; their A/B over 140 Pirate-vs-Pirate games each (benchmarks.md "Heuristic A/B") shows no measurable strength difference either way, so they are kept for the reasons they were changed, not as strength gains. The AI's Life table is concave from 0: 1 → 0 costs 4.2, 2 → 1 3.1. The quick policies' thresholds are named (`QUICK`), Unblockable gets a weight (§6). Kaido's mulligan counts each card once and needs two Counters, as its guide says; the explanation states the rule it applied.
- **Game-plan assertions (M5a-08)** run twice per push: with the biases, and on search alone. Search alone finds 7 of the 10 seeds plus the Leader-attack hold; two Kaido lines (holding the −2000 when it changes nothing; the Ulti set-up) pass only by their bias and are marked `it.fails`, so the test turns red if search alone ever finds them. The planted positions now offer real alternatives, and no assertion can pass vacuously. Nightly measures the tallies with and without biases, and counts the exempted finishing turns.
- **Strength gates that can fail (M5a-10).** Since the scoring fix, a "1-rollout" Pirate still scores every candidate once, so it is no longer crippled (it beat Rookie and the baselines). The gates use real baselines instead: Pirate vs Rookie at 90% per push and 95% nightly; Pirate vs a shallow Pirate (no rollouts: it scores moves by the position right after them) at 60% (per push 14 of 20; a broken rollout makes Pirate into that player, and the nightly shallow-vs-shallow control shows the gate failing at about 50%). Nightly adds a row where the Pirate's prior leaves out the opponent's actual list, and A/B rows. Rejected: a higher floor against Rookie alone (Rookie cannot tell settings apart).
- **Pacing (M5a-12).** The per-push pacing e2e uses iteration budgets (`?aibudget=iterations`), checks every turn (the whole turn, the board's own pacing, and the worker's visible time, separately), measures four turns, and runs without CI's retry. The AI's own-turn picks hold `dwell`; a DON!! group dwells at its end unless that card's attack follows. The plan request is tracked and cancelled on rewind; requests queue in the worker so a cancel arriving behind one is read before it runs. The considering beat covers every AI decision on the player's turn, as flows F21.2 says; board.md §5.2 now agrees.
- **"Why?" panel (M5a-13).** The dialog is described by its claim, the claim and evidence are announced politely when it opens, the log behind it is inert, and W with nothing to explain says so. Rejected for now: moving "Why?" into the coach panel (the learning slice builds it).
- **Carried:** board.md's dwell compression for long turns (every measured turn is within 8 s without it; it needs the plan's length on the main thread) and the pre-existing midline overlap at 1280×720, both to M10 polish.

## 2026-10-29 — M5a AI slice: search views, the Pirate tier, playbooks and explanations

Context: M5a (PLAN row 12) needs per-turn planning on views only (ADR 0005, 0008), the Pirate tier, the two slice playbooks with game-plan assertions, the `Explanation` builder, and the app's "Why?" chip (M3-23). Each decision lists what was rejected.

- **Search views (engine, additive).** `projectForSearch(state, p)` is `project` plus a *skeleton*: the state with every card `p` cannot see stripped of its identity and flags, every instance id replaced by a canonical id assigned from public structure (player, zone, position), the RNG removed and projection keys blanked. A reference to a hidden card outside the zones (a frame local, a modifier) would say which hidden card it is, so it becomes a constant and the skeleton is marked `opaque`; `determinize(view, fill, cards, seed)` refuses those, and the AI then answers from the view (lethal defence first). `determinize` names every hidden card from the `fill` (keyed by the view's positional handles), rebuilds definitions from card data and seeds a fresh RNG. The leak property now also requires identical skeletons under hidden permutations, and a mutation that leaves hidden card ids in the skeleton fails it. In 331 sampled positions none was opaque, and the true fill round-trips to the same cards, decision and legal actions. Rejected: rebuilding a state from the plain view (it loses modifiers, Once Per Turn marks, summoning sickness and the stack); giving the worker full state (cheating by construction); a `determinize` that takes state (the worker never has it).
- **Queries (additive).** `queries.battle`, `queries.usedThisTurn` and `CardView.played` (public facts the search and the explanations need). No rule, hash or record changed, so ENGINE_VERSION stays 0.5.2. `projectForSearch` and `determinize` join the lint list of full-state names: allowed only in `app/src/session/` and `ai/src/search/`.
- **Pirate is a greedy planner scored by rollouts.** Each candidate is applied in K = 4 determinized states, its follow-ups and the rest of the turn are played by quick policies, and the position is evaluated at the start of the next turn's Main Phase, so every candidate (including ending the turn) is judged at the same point. Candidates: every play and activation; every attack alone or after 1, 2, 3 or all active DON!!; one DON!! to a card that can still attack; ending the turn. Moves that cannot matter are left out (DON!! to a card that cannot attack, an attack that fails for certain from a card with no [When Attacking]), so a level score never shows a pointless move. The plan runs until the samples disagree about what the AI will see next (an attack's result, a draw); `decide` follows it while the view's fingerprint matches and plans again otherwise. Rejected: a static evaluation right after each move (it cannot value DON!! given before an attack, and ended turns early); every DON!! split (too many candidates for the budget); searching each decision without a plan (more work per turn, and nothing to explain as a turn).
- **Defence.** A Counter decision compares "take it" with *whole* defences that stop the attack (fewest cards; least Counter spent), never a partial one, and keeps to the chosen defence for the rest of the battle. Lethal is always defended where possible. Block, Trigger and effect choices are scored by rollouts to the start of the AI's next turn. Rejected: judging one Counter card at a time (it can strand a half-played defence, which is exactly the "thrown-away counter" the review flags).
- **Determinization prior.** The opponent's hidden cards come from one of their archetype's three sourced lists, weighted 3/2/1 by recency, minus every card of theirs the AI has seen; short or long pools are padded from the same list or trimmed at random. The AI's own deck order and Life come from its own list. Rejected: uniform legal cards of the Leader's colours (no meta signal; kept only as the fallback for a Leader with no sourced list, where seen cards and the AI's own list pad it); the human's actual list (cheating).
- **Heuristic.** Seven named terms (life, hand, counter, board, DON!!, lethal threat, deck), each weight documented with its concept in `ai/src/search/heuristic.ts`. strategy-concepts.md marks all its weights as inferences to tune, so two were tuned against tests: a rested Character's exposure 0.35 → 0.15 (it held attackers back), and the AI's own Life value from 2 to 1 raised to 3.2, so that at 2 Life a cheap Blocker beats a hit ("switch hard to blocking once you're at 2" [S31], "below two Life, block by default" [S40]).
- **Playbooks** (`ai/playbooks/OP17-039.json`, `OP17-058.json`): the guides' five playbook seeds each, as assertions with thresholds, plus weight multipliers, card values for ongoing effects, face-versus-board by stage, mulligan rules (strategy-concepts §9, the guides' keepable hands) and move biases. Both go second (§10 [S17]: "the general default is to go second"; go second with removal, late-game and counter-heavy decks). Two biases encode guide lines the greedy search cannot see on its own: Kaido holds its −2000 "for the turn it changes an outcome" [SH-KAI] (a penalty for using it when it changes nothing), and its Leader's [When Attacking] −2000 sets up Ulti & Page One's K.O. [SH-KAI] (keep its DON!!, shrink the target first). Rejected: hard-coded scripted lines (they would not survive a different hand).
- **Game-plan assertions** run in two ways. Per push: planted positions, one per seed, plus "holds the −2000" negatives (`ai/test/game-plan.test.ts`). Nightly: statistically over 40 Pirate-vs-Pirate games, because against Rookie most games are decided before the guides' key turns; a turn the AI's own search scores as a win in at least half its samples is a finishing turn and is not judged by the plan. Rejected: judging over the Rookie games alone (they measured how fast it wins, not whether it plays the plan).
- **Explanations.** `ai/src/explain.ts` builds every decision's `Explanation` from public facts only (flows D9): a template per decision kind (block, counter, take, the Leader's trick, play, attack, DON!!, activation, choices, mulligan, turn order), with the heuristic term the chosen move gained most on, against its runner-up, as the reason. E12, E13 and E16 are snapshot tests that read the expected objects from `docs/design/explanations.md` itself, recompute every figure from the position, and check the "AI Why" certainty label. A whole-game test checks every AI explanation for its concept, lesson, copy rules and that it names no card the player could not see. `certaintyLabel(certainty, context)` holds the labels table.
- **Worker protocol.** `init` now carries the game (tier, the AI's own list, both Leaders, budgets); `cards` adds public card data as cards become visible to the AI; `planTurn` plans and keeps the plan in the worker, answering only with a count; `decide` follows the plan while it holds. Rejected: sending the plan to the main thread and back (the UI has no use for it, and it would put the AI's intentions in the UI's memory).
- **Budgets.** Iterations (rollouts) in tests and CI: 900 per plan, 120 per defensive decision. Milliseconds in the app: 500 and 250. K = 4 samples.
- **App.** Pirate is selectable on setup and is the default opponent (it is the slice's tier; Rookie stays as the baseline). The e2e flows written against Rookie name it (`opp=rookie` in the shared start helper). The AI's turn plan starts with its 700 ms Refresh-Draw-DON!! segment, and each next decision is requested as soon as the previous move is applied, so the worker searches while moves animate. The considering beat now applies only to the AI's defensive windows on the player's turn (flows G5, board.md §5.2); before, it also delayed the AI's own effect choices on its turn. DON!! given to one card in a row is one move (one log line, one animation), as board.md §5.2 budgets it. Each AI move with a choice stores its `Explanation` by the move's first action index; follow-up picks of an effect join the move's intent. "Why?" is a 24 px chip on the move's first log line and W opens the last one; the panel docks over the log (the coach panel arrives with the learning slice) at Standard verbosity. Measured AI turns at 1×: 1.0 to 6.8 s (docs/benchmarks.md).

## 2026-10-29 — M4a fix round 1, Phase B (app) and CI time

- **[Activate: Main] in the UI (M4a-03).** A card with a scripted [Activate: Main] opens its action menu on click or Enter (with "⚔ Attack…" when it can also attack); each ability is an item ("✦ Activate: <label>", key E for the first), or disabled with `whyNot`'s reason. Rejected: a separate ability bar (more chrome; the menu is already the keyboard path).
- **Effect log lines (M4a-05)** come from projected events only, so a hidden card is never named: activations with the script's label, Events, declines, reveals (the engine now tags `CardRevealed.reason`: play, cost, effect, search), looks, modes (the `neutral` label), DON!! returns and adds, replacements, effect rests (`Rested.reason`), power and keyword changes (`PowerModified`/`ModifierAdded` carry `card` and `byEffect`), bounce, bottom-deck and trash. Hotseat keeps using the public log. Draws by an effect are a count.
- **Prompts (M4a-09).** The `use` prompt names its cost ("pay DON!! −1 to use this effect"); focus starts on Use and Enter uses it (flows F8d). Enter never commits "choose none" on a paid effect's target choice. DON!! choices show counts per location and warn when the DON!! sits on a card in the battle. The order panel names the timing ("Kaido [On Play]: …"), and card ordering has "Keep this order". Event [Counter]s list their cost (with the optional activation cost) and effect, and show in the Block Step as "available in the Counter Step". When the attack already fails, the defence footer says "Done · the attack fails". Rejected for now: staging Event [Counter]s with Character Counters (their costs and targets need decisions, which the one-commit sequence cannot carry).
- **Setup copy (M4a-15)** is per seat and per deck, counted by different card numbers, and claims only that scripted cards' effects happen.
- **Veiled hotseat (M3-41, M3-42, M3-43).** The veiled panel says whether Use will show the hand, judged from the last effect both seats saw activate in the public log and its public script, so it cannot vary with hidden cards. A differential e2e test presses Use under the veil for a payable and an unpayable Shiki cost and for Kaido's public DON!! −1; removing the `readsHiddenZone` check fails it. A `scenario=json:` spec without a valid mode returns to setup with a message.
- **CI time.** Playwright runs in 3 parallel shards, separate from lint, typecheck and unit tests. Per push, the full-game flows (vs Rookie, hotseat, keyboard) play to completion from a late-game Rocks-vs-Kaido position with every card scripted; the turn-1 full games run nightly (`E2E_FULL=1`). `E2E_PORT` lets several working copies run e2e on one machine without reusing another copy's preview server. Rejected: dropping the full games (coverage) or a single longer timeout (still flaky).

## 2026-10-29 — M4a fix round 1 (engine and cards)

Context: the M4a review (`docs/reviews/m4a-review.md`) failed the milestone. Phase A covers the engine and card findings.

- **M4a-04: cards played by one effect trigger as one event.** OP17-118 plays up to 2 cards; their play frames share a pending batch, so their [On Play]s queue together and the player orders them with the existing `order` decision (CR 8-6-1). The cards are still placed in canonical order, which only matters for the 5-Character rule. Rejected: asking the play order first (an extra decision that only stands in for the [On Play] order).
- **M4a-08: an Event's DON!! −X activation cost is optional**, like its "you may" costs (B-1). The engine treats any DON!! −X in an Event's [Main] or [Counter] cost as declinable, without a per-script flag: QA-ST01–04 ST04-016 (attribution checked by hand from the cached text, RL-52), CR 8-3-1-4 and the "You may return" reminder. Affected: OP09-077, OP15-078 [Main]; OP07-076, EB04-040, OP17-077 [Counter]. E-Q12 is closed. Unchanged: [Activate: Main] and [Trigger] costs (activating is the consent) and auto costs (already asked).
- **M4a-07: the schema rejects what the runtime would get wrong.** `validateScript` now rejects: a move from the deck top other than "up to 1 to the top of Life"; moves from hand or trash to the deck without a top or bottom position; moves into Life or from mixed zones; a restriction on a player; `play.rested`; plays from outside the hand; K.O. outside the Character area; modifiers on cards off the field; looking at the opponent's deck; trash-from-hand outside the hand. The runtime honours a declared deck position, and every fall-through emits an `Anomaly`, which fails any random game. Rejected: implementing each shape now (M4b will, with its cards).
- **M4a-06: the leak property knows what the viewer knows.** A card whose play is in progress was revealed at its pay step, so it is no longer treated as hidden. Card ids in projected events are now compared up to the first reveal, instead of being stripped everywhere, and the follow-up `autoSkip` check is skipped only when an event revealed a card.
- **M4a-11:** a "choose one" may give `neutral` labels for both players' logs; `ModeChosen.label` uses them (OP17-049).
- **M4a-12:** the summary hash drops projection keys and batch counters (batches become queue positions) and adds each player's `known` cards by position.

ENGINE_VERSION 0.5.2.

## 2026-10-29 — An Event's "you may" activation cost can be declined (B-1)

Context: the independent card tests (DISAGREEMENTS.md B-1) expected EB04-040's "[Main] You may rest 6 of your DON!! cards: …" to let the player decline the cost after playing the Event. The engine paid it automatically, and refused to play OP17-056 when its "you may" cost could not be paid. The coordinator ruled for the test author: under CR 8-3-1-4 a "can/may" cost is optional and skipping it means only that the effect does not activate; playing the Event (paying its printed cost and trashing it, CR 2-7-3, 8-4-2) is a separate step.

Decision: the DSL marks such abilities `costOptional: true` (EB04-040, OP17-055, OP17-056, OP17-077 [Main]; OP17-076 [Counter]). The Event is legal to play, or to activate in the Counter Step, whenever its printed cost can be paid. After it is trashed, the engine asks a `use` decision; "use" is unavailable when the activation cost cannot be paid (a forced no). Declining trashes the Event with no effect. Costs written as DON!! −X or with no "may", and costs of [Activate: Main] and [Trigger] abilities, are unchanged: choosing to activate those is the consent. ENGINE_VERSION 0.5.1.

Rejected: refusing the play when the optional cost cannot be paid (no rule supports it); asking only when payable (the AI and UI would see a different flow for the same card).

## 2026-10-29 — Veiled hotseat screens are a pure function of a branded public view

Context: three review rounds each found another veiled widget reading private data (M3-01 to M3-04, M3-35, M3-39/M4a-01). The last one, whether "Use" was enabled, revealed whether the hidden hand could pay a cost.

Decision:
- **One entry point:** veiled effect decisions render only through `veiledContent(VeiledProps)`. The props carry a branded `PublicView`, which only `GameSession.publicView()` returns, plus the seat name and callbacks.
- **Public decision:** it keeps only its kind, its player and constant wording.
- **No private answers under the veil:** `controller.actions()` returns nothing for veiled optional, choose and order decisions.
- **Answerability is public:** Use and Skip are always enabled. Whether Use needs a reveal comes from the public script (`readsHiddenZone`), never from the private answer list.
- **Guard:** a differential e2e test requires identical veiled HTML, aria and live-region text across 52 position pairs that differ only in hidden cards.

Rejected: fixing each widget as it was found, which had already failed three times; and disabling Use when the cost can't be paid, which leaks the hand.

## 2026-10-29 — Hotseat reveal: hold for mouse and R, sticky tap for touch, pen and keyboard

Context: M3 re-review 1 (M3-32) found that on touch the defender could hold to reveal their hand but could not stage a Counter. A second finger's tap fires no `click`, and lifting the holding finger hid the hand.

Decision:
- With a mouse, or the R key, the reveal is press-and-hold.
- With touch, a pen, or Enter/Space on the veil, a tap turns on a sticky reveal. It ends on "Hide my hand", the defence commit, the window losing focus, or a seat change.
- Single taps stage Counters while the hand is revealed. The commit always re-hides it.

Rejected: handling second-finger taps on `pointerup`. Browsers don't reliably fire a click for them, so it would be fragile, and it needs two hands.

## 2026-10-29 — M4a effects slice: runtime and API decisions

Context: M4a builds the effect DSL runtime and scripts the Rocks (OP17-039) and Kaido (OP17-058) lists, 37 cards. The independent card-test author reported API gaps (mode choices, Event [Counter] targets, decision sources, DON!! adds, looked-at cards, effect state in views, keyword strings). Each decision below lists what was rejected.

- **Programs, not trees.** Each ability compiles to a flat program (costs, then the effect; if/else, may/ifDid, choose-one modes and delayed bodies become jumps); an effect frame holds an instruction pointer and its locals. Rejected: walking the step tree with a path stack (more state per frame, harder to hash).
- **API additions (additive, frozen shapes unchanged):** `Decision.purpose` (`cost`, `target`, `mode`, `order`, `use`, `replacement`, `characterLimit`), `Decision.source` (card id, ability id, label; `instance` in queries, `handle` in views), `Decision.options` (named options with labels); `pick.choice` may be `{ option: id }` for modes and top/bottom; `order.first` is a listed option id (a card, or `<card>#<ability>` for pending effects); `CardView`/`ViewCard` gain `counter`, `cannotAttack`, `negated`; `ProjectedView` gains `looking`, `known` (now filled), `attackLock`, `delayed`; event types `CardsLooked`, `ModeChosen`, `EffectDeclined`. Granted keywords use the printed strings (`Rush`, `Unblockable`, `Blocker`). Rejected: a new decision kind for modes (breaks every consumer's switch); encoding modes in the prompt.
- **Event [Counter] is `activate` in the Counter Step.** `{ type: 'activate', card, ability }` with the card in hand; costs are paid at activation and targets are chosen while it resolves (CR 8-4-4). `counter` stays for Character Counters only. Rejected: `counter` with a dummy target.
- **Auto with a cost asks first.** If payability depends on the hand (a trash or reveal cost), the `optional` is asked even when the cost cannot be paid, with "use" unavailable and `secret` set, so the opponent learns nothing; a public cost that cannot be paid skips silently. Rejected: asking only when payable (leaks whether the hand holds a matching card).
- **Hidden-zone choices are always asked** (even with no match) and flagged `secret`; `publicCount` marks a pick over a whole hand of public size. With another human watching, `autoSkip` skips a forced pick only when every candidate is visible or the count forces it (M2-19).
- **DON!! by location with counts (E-D4).** A DON!! −X or return asks for classes with counts; it is not asked when one class can pay or every DON!! must go. "Add up to N DON!!" and "set up to N DON!! active" act on as many as possible without asking. Rejected: asking "how many" each time (adding fewer is never better in these decks; it would double the decisions for players and the AI). Logged as open question E-Q11.
- **Pending effects batch per event; a player orders their own.** `order` asks the controller when two or more of their effects from one event wait (Rule Manual "Effect Activation Order"). Two Characters played by one effect (OP17-118) trigger in play order, as separate batches. Rejected: FIFO with no choice.
- **Negation removes printed keywords too** (CR 10-1 calls them keyword effects; CR 8-2-1-1); granted keywords stay (CR 8-2-4). A negated card's [On K.O.] does not activate, and its replacements do not apply (E-Q1's best answer).
- **"If X, A. Then, B" puts B inside the guard** (CR 4-10-1; effect-dsl §4.10): EB04-030, OP17-060, OP08-074, OP07-077.
- **Blind picks are random.** "Trash 1 card from your opponent's hand" (OP17-075) is chosen face-down by its controller (QA-OP17); the engine picks uniformly with the seeded RNG. Rejected: a positional pick (the hand array order is draw order, so it would leak).
- **Replacement order.** Applicable replacements are offered one at a time in CR 8-1-3-4-2 rank order; each is optional, so declining one and taking the next gives the same choice as ordering them.
- **`derive` never memoizes a state that is being drafted.** A memo taken mid-`reduce` went stale and showed one viewer an old power; the leak property found it.
- **Instance ids start with `$` (M2-22)** so the hash and the leak tests recognise them anywhere, including compound keys.
- **Benchmark:** 5,588 two-turn simulations per second in a worker; ADR 0008 confirmed, no fallback (`docs/benchmarks.md`).

## 2026-10-29 — Target milestones for M3's carried items

Context: M3 re-review 1 (M3-33) found that the items carried out of M3 had no target milestone, so they could drift.

Decision:
- the "Why?" chip on AI log lines goes to **M5a**, with the `Explanation` builder;
- the hotseat "you look away" line goes to **M7**, with the coach copy;
- saving and resuming a game goes to **M8**, with local save;
- drag as a shortcut for click, and 44 px lane chips on tablets (M3-18, the product's own rule in board.md §6.2; the chips already meet WCAG 2.5.8 at 24 px), go to **M10** polish.

Rejected: building them in M3. None is in PLAN's M3 exit criteria, and each depends on later work (Explanations, the coach, local save) or competes with the tablet height margin that fixed the Linux scroll.

## 2026-10-29 — Hotseat renders a public view while veiled

Context: M3 review 1 found four severity-4 leaks in hotseat (M3-01 to M3-04). Behind the handoff curtain and during a veiled defence, the board, log, live regions, staged-Counter breakdown and rewind list all rendered from the private view of the incoming or defending seat.

Decision: the app session builds a **public view** from the two player views, keeping only cards both seats can see, with no actions and generic decision wording. It also builds a **public log**, keeping only event fields both projections share. The hotseat screen renders the public view unless a seat's reveal is active (holding R, or press-and-hold on touch). The hotseat log and live regions are always public, and they are cleared when a reveal ends. Everything behind the curtain is `inert`. Rewind is off while a seat is veiled, and a hotseat rewind needs the other player's agreement. The cost: a player's own draws no longer appear by name in the hotseat log.

Rejected:
- masking each widget separately, which is how the leaks happened;
- adding a public projection to the engine, which would change the frozen API for something the app can derive from two views.

Also decided in this round: with a Blocker chosen, Enter blocks without playing Counters that would be wasted, and "Play anyway" is a separate button (M3-05). Carried: 44 px lane chips on tablets (M3-18), because they would use up the cross-platform height margin; the chips pass WCAG 2.5.8 through the spacing exception.

## 2026-10-28 — Tablet defence panel compacts instead of scrolling

Context: at 1024×690, the defence panel body had only 19 px of free height on macOS. Linux fonts wrap more text, so the panel scrolled on CI, and it would scroll for Linux and Windows users too.

Decision: on rails 280 px and narrower:
- the Attacker and Defender labels sit above the names, not in a 62 px column;
- the defender breakdown reads "+N staged", with the card names listed only in the Counter lane;
- the lane labels shrink to 52 px;
- the staging hint drops "ties go to the attacker", which the result line already states.

The e2e check now also requires at least 24 px of free height in every tall state at the adapted sizes. Rejected:
- letting the body scroll, which `board.md` forbids for decision panels;
- relaxing the test, which would hide a cross-platform failure.

## 2026-10-28 — M3 board implementation decisions

Context: the M3 builder made these choices while building the playable board.
1. **No coach strip yet.** The coach arrives with the learning slice, and an empty strip would be dead UI. The decision panel keeps its `board.md` coordinates, and the strip's 48 px go to the log (and to the ticker when the panel is tall). Rejected: a placeholder strip of disabled buttons.
2. **Hotseat seat.** The screen always belongs to whoever owes the decision. A defence flips the board to the defender, whose hand stays hidden until they hold R. When play returns to the attacker, their hand stays hidden until they click or press Space. Rejected: keeping the attacker's view throughout, which leaves the attacker's hand on screen while the defender looks.
3. **Accessible names from content.** Cards and zones take their accessible name from visually hidden text instead of `aria-label`, because axe's label-in-name rule (WCAG 2.5.3) failed on the card art. Rejected: suppressing the rule.
4. **Tablet footer.** Rails of 280 px and narrower get an 80 px footer, so the primary button keeps its 136 px minimum and its labels fit (UX-V12). Rejected: shortening labels or dropping key hints.
5. **Test-only setup parameters.** Setup reads URL parameters (`scenario`, `seed`, `speed`, `skip`, `paused`, `start`), and three named scenarios ship in the app so the e2e tests are deterministic. Rejected: a separate test build, which would test a different bundle from the one users get.

## 2026-10-28 — M2 engine implementation decisions

Context: the M2 engine author made these choices while implementing the frozen API.
1. **View handles.** A view handle is a hash of the viewer, the instance id and a hidden per-card key. The key is re-rolled when the card enters a hidden zone and on every shuffle. Instance ids stay stable except under the new-object rule (CR 3-1-6). Rejected: re-keying the instance ids themselves (breaks ARCHITECTURE §2.2 and the tests).
2. **Concession.** `legalActions` lists only the decider's actions, their own concede included. `reduce` accepts a concede from either player (CR 1-2-3).
3. **Unscripted Events cannot be played** (E-D8), rather than playing as a no-op.
4. **Deck-out** is checked when an operation draws from or touches an empty deck (CR 9-2-1-2 via rule processing), so scenarios may start with empty decks. Rejected: an immediate state check, which ends every minimal scenario.
5. **Choices** complete automatically at `max` picks; `done` is only for stopping early.
6. **State internals.**
   - DON!! are counts by location class, not instances.
   - Card definitions are copied into state, because `reduce` takes no lookup.
   - Instance ids use a separate RNG stream.
   - `summaryHash` hashes board positions, so internal refactors keep golden hashes.
7. **Additions to the API** (no frozen shape changed): `autoSkip`, `projectEvents`, `actionFromView`, `ProjectedView`, `startRecord`/`appendAction`, `ENGINE_VERSION`, `validateDeck`, plus the root scripts `test:nightly` and `bench`.
8. **Ordering and preview.** When the turn player has two or more replacement effects, they resolve in canonical order until M4 adds the `order` decision. `preview` is keyed by instance ids; M3 adds a handle-keyed preview for the app as an addition.

Alternatives rejected are noted per item.

## 2026-10-28 — Frozen engine API amended after the independent test author's report

Context: the independent test author (branch `m2-independent-tests`: 132 tests and 183 todos, written without seeing engine source) found three gaps in the API frozen earlier today. First, `Omit<Action, …>` does not distribute over the `Action` union, so the fixtures' documented `g.act({ type: 'attack', … })` did not typecheck. Second, `PlayerView` exposed only the decision and actions, so visibility rules (CR 3-1-4 public zone counts, CR 3-3-2 DON!! deck) could not be tested. Third, event names were not frozen. It also found a data gap: OP05-022, a Leader with printed [Blocker], had no keywords, because only meta cards had verified overrides.

Decision:
- **Types.** Add `DistributiveOmit` and use it for `Intent` and in the fixtures.
- **PlayerView.** Add `turn`, `result`, `zones` (both players, `ViewCard` with `card: null` when hidden and handles re-keyed per ARCHITECTURE §2.7) and `don` counts.
- **Events.** Export a frozen `GameEventType` union. A trash that is not a K.O. never emits `KO`.
- **Data.** Add a verified override for OP05-022 (Limitless cross-check). Non-meta cards get keyword overrides when a test or a script needs them.

The engine author applies the API changes in its next commit. Alternatives rejected: leaving the bug and making the tests work around it; letting the tests read internal state.

## 2026-10-28 — Engine public API and test fixtures frozen for M2

Context: PLAN §5 requires the fixture API to be frozen before M2. The engine author and an independent test author can then work in parallel, and the tests encode the rules rather than the implementation. Decision:
- **Frozen API.** `engine/src/api.ts` fixes the public types: `GameSetup`, `ScenarioSpec` with `PlayerSpec` and `CardPlacement`, `Action`, `Decision`, `DonClass`, `PlayerView`, `Preview`, `GameRecord`, `Queries` and `IllegalAction`.
- **Stubs.** `engine/src/game.ts` holds stub entry points that throw until implemented.
- **Card lookup.** Card data is injected as a `CardLookup`, so the engine never loads JSON.
- **Read-only access.** Tests observe the game only through `queries` (zone, card, decision, turn, DON!!, result). `GameState` is opaque to them.
- **Fixtures.** `engine/test/fixtures/` offers `scenario()` with defaults (seed 1, turn 3, p1 active, Main Phase) and a `TestGame` with `act`, `legal`, `find`, `leader`, `power` and `life`. Every action is checked against `legalActions`, and the invariants are checked after every step.
- **Change rule.** Changing any frozen shape needs an entry here and an update to the independent tests.

Alternatives rejected: letting tests read `GameState` fields (it couples tests to internals); a fluent builder DSL for scenarios (plain objects are easier to read and to diff).

## 2026-10-28 — M1 card data decisions

Context: building `cards:update` and verifying the 182 meta cards raised five choices.

1. **Blocks follow the printed icons, not a formula.** topics/013.php implies four boosters per block, but official pages and Limitless show OP-13 to OP-15 as block 4 and OP-16 and OP-17 as block 5. `standard.json` uses the printed icons and lists the 9 cards printed with block X. No source gives a block for 9 starter products or for most promos, so 185 cards show legality "unknown" in the browser. The deck builder will say so rather than guess.
2. **Type vocabulary addendum.** 73 type names never appear alone in optcgapi, so they cannot be learned from it. They live in a cited addendum (official series page entries or Limitless pages). It is a list of names, not card data.
3. **Disagreement reads.** Disagreements between optcgapi and Limitless were settled one card at a time: 14 meta cards and 7 non-meta cards that blocked the run. Where a cached copy of the official page existed from the Track B or Track F research fetch, it was used instead of a fresh fetch. Only two fresh official pages were read (OP-01, OP-11). Each correction is an override with its source URL. This keeps to ADR 0007: the pipeline itself never fetches the official site.
4. **Set data loads lazily.** Set JSON is bundled as lazy chunks through `import.meta.glob` (`@optcg/cards/browser` entry), instead of copying the files and fetching them at runtime.
5. **Browser-only keyword filter.** The card browser's keyword filter matches card text for browsing only. Gameplay keywords come only from verified overrides (E-D7).

Alternatives rejected: a block formula (wrong for OP-16); failing the run on about 90 multi-type strings; fresh bulk fetches of the official list.

## 2026-10-28 — M0: tokens in the app, fonts self-hosted, contrast enforced in CI

Context: M0 needs the design tokens in the app, self-hosted fonts within the visual-system budget (about 70 KB Inter, about 40 KB Fraunces, Latin), and a contrast check that fails CI. Decision:
- `app/src/styles/tokens.css` is the source of truth from now on; `docs/design/tokens.css` stays as the Phase 4 snapshot.
- `scripts/contrast.ts` checks all 72 declared pairs in both themes. It runs in `npm run build` (`check:contrast`) and in `app/test/tokens.test.ts`.
- Fonts come from `@fontsource-variable/inter` 5.3.0 (wght, 48 KB Latin) and `@fontsource-variable/fraunces` 5.3.0 using the **wght-only** file (37 KB Latin). The opsz file is 67 KB; Fraunces is used only for headings at 24–40 px, where the default display cut is right, so the optical-size axis is not worth 30 KB.
- An e2e test proves both fonts load and that numerals are tabular.

Alternatives rejected: the Fraunces opsz file (over budget); a CDN (the product is local-first and offline-capable).

## 2026-10-28 — Phase 4 gated; on-board disclaimer form

Context: PROMPT.md requires the unofficial-fan-tool disclaimer in every page footer, but the full-height game board has no footer (`board.md` OQ-6). The verification pass in `docs/design/review-1.md` §6.7 found no open severity-3 or severity-4 finding.

Decision: Phase 4 is gated.
- **Disclaimer.** Every non-board page carries the full disclaimer in its footer. The board carries it as a visible two-line notice under the rail header, at 12 px. Its accessible name is the full disclaimer text, and Settings → About carries the full text with all sources. The owner may change the form; that is a one-component change.
- **Carried to M3** (severity 2): the defence card preview covers both players' Character slots 1–2; on tablet rails two button labels overflow by 6–11 px, and one button is 115 px wide against a 136 px minimum. Screenshots at the adapted sizes (1280×600, 1024×690, 1180×740) are also taken in M3.

Alternatives rejected: a disclaimer only in Settings (it would not be on every page); hiding it on the board behind an info icon (the reviewer showed the hover text was incomplete and easy to miss).

## 2026-10-28 — Design review 1 fixes; AI-turn target stays at 8 s

Context: review 1 found 11 severity-3 problems, among them a defence panel that overflowed at 1280 and an Enter key that committed counters too small to stop the hit. A fixer applied all 22 conflict rulings and fixed every severity-3 problem, with measurements recorded in `review-1.md`. The review's longer dwell times on attacks and results put a typical Warlord turn at about 9.2 s at 1× speed.

Decision:
- **Defence panel.** It grows over the log at both resolutions, and its footer keeps the same position.
- **Defence commits.** Every defence offers "Take the hit" and a separate commit. Enter only commits a counter that actually stops the hit.
- **Skip.** "Skip to my decision" stops at the player's own defensive decisions.
- **Review.** It has an Overview mode and a full-size Study mode, with no text under 12 px.
- **Keyboard.** One tab stop per zone, with shortcuts.
- **Disclaimer.** The board shows a visible two-line disclaimer whose accessible name is the full text. The owner may still change its form.
- **New screens.** Learn, Progress, History, Study and error screens.
- **AI-turn target.** It stays at 8 s or less at 1× speed (the PLAN M5a criterion). Dwell times get tuned against real AI turns in M5a, and Step and 0.5× remain available for anyone who wants a slower pace.

Alternatives rejected: relaxing the target to 10 s (waiting is the most common complaint about AI opponents); dropping the review's dwell increases outright (the reviewer showed that attacks were hard to follow).

## 2026-10-28 — Phase 4 design decisions (board, flows, accessibility)

Context: three design agents wrote the Phase 4 documents in parallel. Their proposed decisions are accepted as written in each file; the full paragraphs, with the alternatives rejected, are there.
- **`board.md` PD-1 to PD-6:**
  - a fixed board column plus a fixed right rail (log, coach, decision panel), 320/400 px wide;
  - the opponent mirrored vertically with the same columns;
  - click primary, drag as accelerator, and a keyboard path for everything;
  - AI turns paced as highlight → move → dwell (600 ms per move at 1×), with "thinking" shown only when it is real;
  - an honest phone screen;
  - a minimum card of 76×106, below which the layout changes mode instead of shrinking.
- **`flows.md` decisions 1 to 9:**
  - commit rather than confirm;
  - one defence panel with Blocker, Counter and Trigger lanes and a single commit;
  - multi-select with a running count, sent to the engine one pick at a time;
  - auto-skip only when no human could learn hidden information from it, and a constant visible AI "considering" time;
  - rewind by move with the same shuffle, marked and excluded from stats;
  - "skip to my decision" never skips the player's own decisions;
  - hotseat privacy via a handoff screen plus hold-to-reveal in battles;
  - one welcome question and no account;
  - AI explanations cite public information only.
- **`accessibility.md`:**
  - staged picks are validated by replaying them through `reduce` on a scratch state, with an engine helper added only if that exceeds 16 ms;
  - screen-reader passes use Guidepup automation plus a human VoiceOver pass;
  - the owner's tutorial runs are labelled "expert proxy".

Reconciled across the documents:
- the coach uses the rail's full width (`board.md` is the source of truth for layout);
- `accessibility.md` owns the keyboard map, which resolves the shortcut collision in `flows.md` question 6;
- the `Evidence` and `Move` shapes from `explanations.md` are added to ARCHITECTURE §4.5.

## 2026-10-28 — Phase 3 gated after the competitive-player review

Context: PROMPT.md gates Phase 3 on a competitive-player review of the archetype guides. The review found 20 issues: 6 severity-3, including misread leader texts (OP17-058, OP05-098), targets out of a card's cost range, a curriculum flag that would penalize correct OP13-001 play, and missing fundamentals. Decision: a separate agent checked every finding against card text, the rulings and the lists. It accepted 18 and partly accepted 2 (`docs/content/review-1.md`), fixed nine further errors found along the way, added lessons L25–L27 (base vs current values, Leader vs Character targeting, opponent-turn timing), marked every unsourced claim individually, and added the EB05 format note. Lesson IDs are stable, so teaching order follows section order rather than ID. Alternative rejected: gating with the guides marked "low confidence" (they would teach false facts).

## 2026-10-28 — Rulings adopted from Track F

Context: Track F read all 46 official Q&A PDFs, CR v1.2.1 (still the newest), the Rule Manual, the tournament manual and the floor rules, and wrote 49 rulings (`docs/research/rulings.md`). Decision:
- The open questions are closed as in its section J.
- Permanent effects apply in the layer order shown by the OP10-042 Q&As (D-3; ARCHITECTURE §2.5).
- "Until the end of your opponent's next End Phase" is a duration, and every modifier records its creation turn (D-2; merged with Track E's E-D2 names).
- "Cannot be K.O.'d" Characters stay legal targets for K.O. effects and costs (D-4).
- Each ruling becomes `engine/test/rulings/RL-xx.test.ts` (D-5).

The rules digest is corrected on three points:
- OP05-022 is a Leader with [Blocker];
- an effect that trashes a Character is not a K.O.;
- the CR and the OP13-079 Q&A conflict on the order of start-of-game effects.

Alternative rejected: an `order` decision for permanent effects (the Q&As fix the order).

## 2026-10-28 — Effect DSL accepted as specified by Track E

Context: Track E tokenized 2,516 cards with text. 97.7% of clauses were tagged, and every one of the 182 meta cards maps to a vocabulary of 28 effect primitives, 12 costs, 17 timings, 10 condition forms and one replacement shape. Its proposed decisions E-D1 to E-D11 (`docs/research/effect-dsl.md` §8) are accepted:
- scripts are typed TS data with a CI schema;
- two new durations: until the end of the opponent's next turn, and until the start of your next turn;
- one `leaveField` choke point with a cause;
- DON!! picks by location class;
- one `move` verb over whitelisted zone pairs;
- full cost lookahead with exact cost picks;
- printed keywords come from verified overrides;
- unscripted Events and [Trigger]s are not offered;
- Once Per Turn is keyed by instance and ability;
- the tagger is kept as a per-set measurement tool;
- scripting order is leaders first, then meta weight.

ARCHITECTURE.md §2.2, §2.3, §2.4 and §3 are updated. Alternatives rejected are recorded per decision in §8.

## 2026-10-28 — Content conventions from Track G

Context: Track G wrote 12 archetype guides, a 24-lesson curriculum, a glossary and a sources list, and it needed shared conventions for turn numbers, matchup data and lesson tags. Decision:
- Turn numbers in guides and playbook assertions count the deck's own turns: T1 is that player's first turn.
- Matchup cells show the newest post-ban sample with at least 8 games, with older samples as secondary.
- Rules-only lessons (L01–L07) carry CR numbers instead of concept slugs.
- Drill thresholds and playbook-seed percentages are marked as inference until calibrated in self-play (M5).

Alternatives rejected: game-turn numbering, which is ambiguous between first and second player; pooling matchup records across formats, which mixes pre-ban and post-ban data.

## 2026-10-28 — onepiece.gg material removed from Phase 1 research

Context: `strategy-concepts.md` (Track D part 2) cited six onepiece.gg articles read in full and several onepiece.gg snippets, and `rules-digest.md` listed one onepiece.gg page as a cross-check. onepiece.gg's robots.txt disallows Anthropic agents. Decision: under the robots decision below, that material is removed. The rules-digest entry is withdrawn; CR 6-5-6-1 stands on its own. `strategy-concepts.md` is being scrubbed, with heuristics re-sourced from allowed sources where possible and otherwise listed as gaps. The Track G content never used onepiece.gg. Alternative rejected: keeping already-collected material (launders the violation).

## 2026-10-28 — Phase 2 reviews folded in; plan re-baselined to about 720 hours with a vertical slice first

Context: two adversarial reviews (`docs/plan-review-1.md`) found the 264-hour estimate about half of reality, and found that the strict M0–M10 order would start the learning layer about 70% of the way in. They also found engine-model gaps: replacement effects, last-known information, scenario starts, record versioning, projection linkage leaks, and invariants hard-coded to 10 DON!!. Decision:
- Accept every severity 3–4 finding.
- Build a vertical slice before breadth (ADR 0012): Rocks and Kaido, Pirate, and the learning slice, then an owner usability session.
- Add replacement hooks, last-known information and scenarios as engine primitives (ADR 0013).
- Revise ADRs 0003, 0004, 0005 and 0008.
- Re-baseline to about 720 hours.

Two findings are only partly accepted. Usability sessions use the owner, plus others at the owner's discretion, because the project cannot recruit participants. Owner hands-on time on SeaKing is requested but does not block the autonomous run. Alternatives rejected: keeping the PROMPT.md milestone order literally (the time-box would cut the learning layer); deferring the engine-model fixes to M2 (they change the data model and the record format).

## 2026-10-28 — Card data from optcgapi.com, not the official card list

Context: Track B recommended parsing the official card list (the most accurate source, and the only one with block icons), with optcgapi.com as fallback. But the official site's terms say its "text and data … may not be reproduced without permission", and PROMPT.md says to choose another source where terms forbid an intended use. optcgapi.com says it is "open for anyone to use", but it drops minus signs, loses type delimiters, and has a few corrupt rows. Decision: optcgapi.com is the only source `cards:update` fetches. Mechanical repairs are recorded per card. Hand-verified overrides, from a person-scale read of the official entry, are written for every scripted card, and CI requires them. Block, ban and exception data is a hand-kept, cited `cards/format/standard.json`. Full reasoning in ADR 0007. Alternatives rejected: bulk-parsing the official site (terms); optcgapi raw (sign loss changes meaning); Scrydex (paid, no mirroring); arjunkai (private data).

## 2026-10-28 — Images: optcgapi, then arjunkai (off until approved), then text-only

Context: no candidate offers clean art; every source serves the official SAMPLE-watermarked scans, and official image URLs are blocked cross-site. Decision: hotlink optcgapi images through one image module and cache them in a service worker. The arjunkai proxy is wired in but disabled until its maintainer approves. A text-only card keeps the game playable. Alternatives rejected: official URLs (blocked by CORP); Scrydex (paid); Limitless and TCGplayer CDNs (no permission).

## 2026-10-28 — Research automation obeys robots.txt; material gathered against it is not used

Context: SeaKing and DuelVoyager disallow `ClaudeBot`, `anthropic-ai` and `Claude-Web` in robots.txt, and SeaKing also reserves text-and-data-mining rights. The first Track C attempt browsed DuelVoyager and took 62 screenshots before checking. Bandai's Teaching App terms prohibit unapproved external tools. Decision: agents check robots.txt and terms before any automated access and do not automate sites that disallow them; material already gathered against a site's policy is not used (the DuelVoyager observations were removed from `competitive-teardown.md`). Where first-hand observation is needed, the owner does it by hand, and documents mark each section as hands-on or secondhand. Alternatives rejected: generic browser user agents (evades the block); keeping the DuelVoyager material because it was already collected (launders the violation).

## 2026-10-28 — Rules are always enforced; no manual sandbox in v1

Context: Untap.in and Tabletop Simulator are free-form tables that enforce nothing, so a learner's mistakes go unnoticed and become habit (`competitive-teardown.md` §4, §5). Decision: the UI offers only actions from `legalActions`; any manual "fix the board" tool waits for a later debug or puzzle editor. Alternatives rejected: a manual override menu; a toggle between enforced and free play.

## 2026-10-28 — Battle panel and deterministic rewind are MVP features

Context: none of the products studied shows live battle maths, and Untap's rewind needs a vote and reshuffles. Decision: every attack opens a panel with live attacker and defender power, the gap, and the Counters available, updating as Blockers and Counters are chosen. Rewind restores the exact prior state, RNG included, so it cannot be used to fish for a better draw. Alternatives rejected: power shown only on hover; rewind that re-randomizes the deck.

## 2026-10-28 — Meta archetypes keyed by leader ID, counted from Limitless online events

Context: Track D part 1 needed the 10 to 12 archetypes with the most top-8s in the last 90 days, English format. The Limitless tournament database has no events after 2026-07-26, complete in-person standings for the Season 1 Finals and Season 2 Regionals were not available from any source we may crawl, and onepiece.gg disallows Anthropic agents in robots.txt. Decision: an archetype is identified by its leader card ID. Top-8 counts come from the documented Limitless play API (33 English-legal Standard online events with 24+ players, 2026-07-30 to 2026-10-28), with eras split at the OP17 pre-release and the 2026-10-12 ban. In-person results and opmetagame.com are used only as cross-checks, and "top tier" requires two independent sources. Banned leaders (OP14-020 Mihawk) are kept in an `excluded` array rather than in the archetype set. The 12 archetypes and 36 lists are in `docs/research/meta-lists.json`. Alternatives rejected: scraping blocked sites (violates robots.txt); waiting for Limitless to backfill in-person events (blocks Phase 1 with no date); counting by name or colour (ambiguous: two Enels and three Luffys are in the field).

## 2026-10-28 — Standard Regulation (blocks 2 to 5) is the v1 format

Context: Bandai has applied the Block Number System and Standard Regulation to the English game since 2026-04-01; blocks 2 to 5 are legal until 2027-03-31, with listed exceptions. Decision: the deck validator and meta data target Standard Regulation, with block number and exception lists in the card data so the next rotation (blocks 3 to 6 from 2027-04-01) is a data change. Extra Regulation is not supported in v1. Alternative rejected: no format restriction (would let the player build decks that are illegal at any English event).

## 2026-10-28 — Learning content cites only freely readable sources

Context: some of the most-cited community frameworks are behind Metafy and Patreon paywalls, and some public pages (Reddit, TCGplayer Infinite) could not be read by the research agents. Decision: coach and curriculum content cite only sources that were read in full and are freely accessible, plus the official rules; claims seen only in search snippets are not used. Alternatives rejected: purchasing guides (licensing to quote them is unclear, and a reader of the app could not check the source); paraphrasing snippets (violates "never invent").

## 2026-10-28 — Engine spec corrected to Comprehensive Rules v1.2.1

Context: Track A read CR v1.2.1 (8/28/2026) and found places where PROMPT.md's engine specification is imprecise. Decision: the engine follows the CR; details and rule numbers are in `docs/research/rules-digest.md` "Corrections to PROMPT.md assumptions". In brief: neither player attacks on their own first turn (CR 6-5-6-1); deck-out is a defeat when the deck reaches 0, checked in rule processing, not "failing to draw"; with five Characters out the player trashes one before the new one is placed, and that trash is not a K.O.; power may be negative; the per-player card-count invariant includes a transient "resolving" location for Trigger cards; Refresh and End phases follow the CR's ordered sub-steps with separate expiry for "until end of turn" and "during this turn"; Character counters are free from hand and Event counters cost DON!!; Double Attack against 1 Life does not win; simultaneous loss and unbreakable loops produce a draw result; the keyword set includes [Rush: Character], [Unblockable], [On Your Opponent's Attack], [End of Your Opponent's Turn], [Main], [Your Turn], [Opponent's Turn], DON!! −X and Trash; start-of-game leader effects run before hands are drawn and Life is set after the mulligan; the four-copy limit is per card number across alt arts; DON!! power applies only on its owner's turn, though [DON!! xX] still counts on the opponent's turn. Alternative rejected: implementing PROMPT.md's wording literally.

## 2026-10-28 — Toolchain versions and workspace layout

Context: scaffold needs a type checker that ESLint understands. TypeScript 7.0 (native port) is current, but typescript-eslint 8.72 supports only `<6.1`. Decision: TypeScript 6.0.3, Vite 8, Vitest 4.1 (Vitest 5 does not list Node 25 in its engines), Playwright 1.64, ESLint 10 flat config. Packages are npm workspaces consumed as TypeScript source through `exports` (no per-package build), so Vite and Vitest compile everything once. Package boundaries are enforced with `no-restricted-imports`, and the engine additionally bans `Date`, `Math.random`, and DOM globals. Alternatives rejected: TS 7 without type-aware lint; project references with per-package builds (slower, no benefit for a static app).

## 2026-10-28 — Third-party screenshots are not committed

Context: the UX teardown and wireframe reviews need screenshots, and screenshots of other simulators show Bandai card art. Decision: such screenshots live in `docs/research/teardown-shots/` and `docs/design/wireframes/shots/`, both gitignored; documents describe them in text and refer to filenames. Alternative rejected: committing cropped or blurred screenshots (still risky and low value).

## 2026-10-28 — GitHub Pages via the Actions artifact flow, deploy after green CI

Context: PROMPT.md default hosting named a gh-pages branch, but the owner made the repo public and enabled Pages with the "GitHub Actions" source. Decision: `deploy.yml` builds `app/dist`, uploads it with `actions/upload-pages-artifact`, and publishes with `actions/deploy-pages` after CI succeeds on `main`; Vite `base` is `/optcg-sim/`; `404.html` is a copy of `index.html`. URL: https://chrisdevine00.github.io/optcg-sim/. Alternative rejected: pushing to a gh-pages branch (would require changing the owner's Pages setting). The stale `gh-pages` branch from the first run is deleted.

## 2026-10-23 — Defaults accepted from PROMPT.md

Product name `OPTCG Sim` (cosmetic, swappable). Stack: TypeScript strict + Vite + React, Vitest, Playwright. Hosting: GitHub Pages via GitHub Actions. Alternatives (Svelte, Vercel, Netlify) remain open and are one-file changes.
