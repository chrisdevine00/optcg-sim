# OPTCG Sim — Claude Code Master Prompt

Oct 23, 2026 · @Devine

## How to use this prompt

Everything from **Mission** down is the prompt. Paste it whole into Claude Code as the first message in an empty repo, or save it as `PROMPT.md` in the repo root and tell Claude Code: "Read PROMPT.md and execute it end to end."

The prompt is written so Claude Code can run for hours without you. It tells Claude Code to keep its own state in `docs/STATUS.md` and `docs/DECISIONS.md`, so when you come back you can say "Read PROMPT.md and docs/STATUS.md, then continue" and it picks up where it stopped. It also tells Claude Code to leave the app runnable at every commit, so you can open `localhost` at any point and see the product as it stands.

Three things to decide before you paste, each marked **DEVINE:** in the text below. Defaults are filled in so you can paste without touching them.

## Mission

You are building a browser-based One Piece Card Game (OPTCG) simulator that is also a strategy teacher. The player plays full games against an AI using real cards with real card art pulled from a card-data API, and the product explains, while they play and after they play, what a strong player would have done and why. Work through five phases in order: research, plan, research again, design, build. Do not skip a phase and do not start building before the design phase has produced reviewed wireframes.

**DEVINE: product name.** Working name is `OPTCG Sim`. Replace it everywhere if you want something else; otherwise leave it.

### Who it is for

The first user is one person: an OPTCG player who knows the basic rules, owns physical decks, and wants to get better at strategy and understand the competitive meta without grinding hundreds of paper games. He is also a UX director, so the bar for interaction design is professional, not hobbyist. Build for him first; keep the door open for other players later, but never at his expense.

### The four jobs the product must do

1. **Play.** Full, rules-accurate games against an AI opponent, on a board that reads at a glance, with every legal move visible and every irreversible step confirmable or rewindable.
2. **Learn the game.** An interactive tutorial, a rules reference with official rulings, and in-game explanations of timing, keywords, and battle math.
3. **Learn strategy.** A coach that can hint, warn, and explain during a game, plus a post-game review that finds the turns where the player had a win on board and missed it, wasted DON!!, countered when they should have taken the hit, or took the hit when they should have countered.
4. **Learn the meta.** An explorer for the current competitive archetypes: what each deck is trying to do, its key cards and why they are played, how to mulligan with it, how it matches up against the field, and real tournament lists to load straight into a game.

### Reference products

[SeaKing](https://seaking.gg) is the closest existing product: a free browser practice sim whose AI plays real meta decks and whose Game Review searches the finished game for missed wins, with hint, play-both-sides, rewind, a deck builder, and a sealed mode. Treat SeaKing as the baseline to match on play and review, and exceed it on teaching: SeaKing tells you that you missed lethal; this product teaches you how to see lethal next time. Other references to study are listed in Phase 1.

### Done when

- A new visitor can finish the tutorial in under 20 minutes and then play a complete game against the AI with no instructions from anyone.
- Every card in at least 10 current top-tier archetype lists is fully scripted; every other English-release card is browsable with art and text, and the deck builder shows a scripting-coverage percentage for any list.
- The strongest AI tier beats the random-legal-move tier at least 95% of the time and plays each loaded meta deck according to that deck's game plan, not a generic heuristic.
- Game Review correctly flags a planted missed-lethal scenario and a planted wasted-counter scenario in the test suite, and explains each in plain language.
- The Meta Explorer shows the current English-format archetypes with an as-of date, sourced tournament lists, and matchup notes, and can be refreshed by one command.
- A full game vs AI is playable with keyboard alone, passes WCAG 2.2 AA contrast, and holds 60 fps on a 2020 laptop.
- The app is a static build deployed to the hosting target chosen in Phase 2, and `docs/STATUS.md` says so.

## Operating rules

You are expected to run unattended for long stretches. These rules keep you safe to leave alone and easy to resume.

### Autonomy

- Make decisions yourself. The only questions you may stop for are the three **DEVINE:** items, and only if their defaults are unusable. Everything else you decide, record in `docs/DECISIONS.md` as a dated one-paragraph entry (context, decision, alternatives rejected), and move on.
- When a source is ambiguous or two sources disagree (a ruling, a card's text, a meta ranking), record both, pick the official or most recent one, and flag it in `docs/OPEN-QUESTIONS.md`.
- Never invent card text, rulings, tournament results, or meta claims. If you cannot source it, leave it out and log the gap.

### State you must keep

- `docs/STATUS.md`: current phase, current milestone, what is done, what is in progress, what is next, and the exact command to run the app. Update it at the end of every milestone and before any long task. This is the file the owner reads to pick up where you left off; if it is stale, your work is invisible.
- `docs/DECISIONS.md`: every non-trivial choice, newest first.
- `docs/OPEN-QUESTIONS.md`: unresolved ambiguities with your current best answer.
- `docs/research/`, `docs/design/`, `docs/content/`: phase outputs, named in the phases below.

### Resume protocol

When you are started with "Read PROMPT.md and docs/STATUS.md, then continue": read both, run the test suite, start the dev server, take one screenshot of the current state, confirm it matches STATUS.md, then continue from the first unfinished item. If the repo and STATUS.md disagree, trust the repo and fix STATUS.md first.

### Working rhythm

- Commit at every green test run with a conventional-commit message. The app must build and run at every commit; never leave `main` broken overnight.
- Phase gates: a phase is finished only when its named deliverables exist in `docs/` and STATUS.md says so. Do not start Phase 5 code (other than scaffolding) before Phase 4 is gated.
- Use subagents for parallel research, for adversarial review of every design document and every milestone, and for writing tests against the engine independently of the engine's author. A reviewer that only confirms is not a review.
- Time-box: if a milestone has taken more than three times its estimate, stop, write the blocker in STATUS.md, ship the smallest working slice, and continue to the next milestone.
- Verification before claiming done: run the full test suite, run the Playwright flow that plays a complete game against the AI, open the app in a browser and look at screenshots of the key screens. "Tests pass" without a screenshot is not done for anything with a UI.

### Things you must not do

- Do not commit card images or any Bandai art into the repository. Art loads at runtime from the chosen source.
- Do not scrape or hammer any site in violation of its terms or robots policy; cache aggressively and prefer bulk endpoints.
- Do not add accounts, servers, databases, analytics, ads, or payments. Everything is static and local-first.
- Do not use the official One Piece Card Game logo or claim affiliation. Every page footer says the project is an unofficial fan tool and that One Piece and all card names, text, and art belong to their respective owners.

## Phase 1 — Research

Goal: know the rules precisely, pick the card-data and art source, learn what existing sims get right and wrong, and establish today's English-format meta. Run the four tracks below in parallel with subagents. Every track ends in a file under `docs/research/` with an as-of date and links to every page actually opened.

### Track A — Rules

Read the official sources end to end, not summaries of them:

- Comprehensive Rules: https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf (check for a newer version on the official rules page and use the newest).
- The official Rule Manual and Play Guide on https://en.onepiece-cardgame.com/
- The official rules Q&A / card rulings pages on the same site.
- Sanctioned tournament floor rules: https://en.onepiece-cardgame.com/pdf/floor_rule.pdf (for mulligan, time, and procedure conventions).

Write `docs/research/rules-digest.md`: a numbered, engine-ready digest of setup, the five turn phases, DON!! handling, the full attack/block/counter/damage sequence, life and triggers, rest and active states, keyword effects (Blocker, Rush, Double Attack, Banish, Trigger, Counter, On Play, When Attacking, Activate: Main, Once Per Turn, End of Your Turn, On K.O., On Block, and every other keyword in the rules), effect activation and resolution order, rules processing, and every win/loss condition. For each item cite the rule number. Anything you are unsure of goes in OPEN-QUESTIONS.md, not into the engine.

### Track B — Card data and art sources

Evaluate every candidate below plus any newer one you find. Score each on: coverage through the newest English set, effect-text accuracy, image quality and whether images carry a watermark, licensing and terms of use, CORS and rate limits, bulk download endpoint, update cadence, and whether alternate arts are modeled as the same card.

| Candidate | What it is | Verify |
| --- | --- | --- |
| [optcgapi.com](https://optcgapi.com/) | Free REST API, English release, OP-01 through at least OP-15 plus starter decks, with price history | Terms, image URLs, current set coverage, rate limits |
| [arjunkai/optcg-api](https://github.com/arjunkai/optcg-api) | Open-source Hono API on Cloudflare Workers; `GET /cards/all` bulk dump; image proxy with CORS headers; data scraped from the official site | Hosted instance terms; whether to self-host the scraper rather than depend on the live worker |
| [Scrydex](https://scrydex.com/docs/onepiece/cards) | Commercial API with keyed access and small/medium/large image URLs per variant | Pricing, free tier, redistribution terms |
| [apitcg.com](https://apitcg.com) | Multi-game card API reported to include One Piece | Whether it still exists, coverage, terms |
| [Limitless card database](https://onepiece.limitlesstcg.com) | Card pages with text, images, and the decklists each card appears in | Not an API; use only through documented means or as a cross-check |
| Official card list | https://en.onepiece-cardgame.com card database; direct image URLs of the form `/images/cardlist/card/OP01-001.png` | Images carry a SAMPLE watermark; check terms before any direct use |

Write `docs/research/data-sources.md` with the scoring table, the chosen primary source, the fallback source, and the exact endpoints you will call. Confirm the choice by fetching one full set and 20 random cards and diffing their text against the official card list by hand.

### Track C — Existing simulators (UX teardown)

Spend real time in each, as a player, and document screens with screenshots:

- [SeaKing](https://seaking.gg): AI vs real meta decks, Game Review for missed wins, hint, play both sides, rewind, deck builder, sealed; read its patch notes for how it has evolved.
- [DuelVoyager](https://alternativeto.net/software/duelvoyager/about/): browser sim with deck builder, ranked and casual play, replays, custom playmats, meta page.
- OPTCGSim (desktop client by Maebatsu, no official assets): the de facto community standard; note what players tolerate because there is no alternative.
- Untap.in and Tabletop Simulator One Piece tables: free-form sims; note what the lack of rules enforcement costs a learner.
- Bandai's official ONE PIECE CARD GAME Teaching app: how the publisher itself teaches the game.

Write `docs/research/competitive-teardown.md`: for each product, the flow from landing to first attack, the board layout, how attacks, blocks, and counters are performed, how DON!! is attached, what is confusing, what is delightful, and load time. End with a one-page list of UX decisions this product will make differently and why.

### Track D — Meta and strategy landscape

- Establish today's English format: the newest released set and starter decks (Limitless showed OP17 and ST31–36 as the latest at the time this prompt was written), the current banned and restricted list from the official site, and any rotation or block rules in force.
- Primary data: [onepiece.limitlesstcg.com](https://onepiece.limitlesstcg.com) tournaments, decklists, and meta share; [onepiece.gg](https://onepiece.gg/tier-lists/) tier lists and leader guides; the official events page for Regional, Treasure Cup, and Championship results. Cross-check at least two sources before calling anything top tier.
- Identify the 10 to 12 archetypes with the most top-8 placements in the last 90 days, English format. For each, collect three recent top-placing lists with event, date, placing, and link.
- Collect the strategy vocabulary a coach needs: tempo, DON!! curve and efficiency, life as a resource, when to counter versus take the hit, the value of 2000-counters and blockers, board versus face, rush and tempo swings, lethal math, mulligan heuristics, and how leader abilities define archetypes. Note which content creators and articles explain these best; you will cite them in the learning layer.

Write `docs/research/meta-landscape.md` and `docs/research/strategy-concepts.md`.

## Phase 2 — Plan

Goal: turn the research into an architecture, a data model, and a milestone plan that a reviewer could poke holes in. Deliverables: `docs/PLAN.md`, `docs/ARCHITECTURE.md`, and one ADR per major decision in `docs/adr/`.

### Stack

**DEVINE: stack.** Default is TypeScript (strict) + Vite + React, with Vitest for unit tests and Playwright for end-to-end and screenshots. No backend. If you prefer Svelte or vanilla, say so; everything below is framework-agnostic.

**DEVINE: hosting.** Default is GitHub Pages from a `gh-pages` branch via GitHub Actions. Vercel or Netlify are fine alternatives; whichever it is, the build must be a static folder.

### Architecture (keep these boundaries hard)

Four packages in one repo, with the dependency arrows pointing only downward:

1. `engine/` — pure TypeScript, zero DOM and zero React imports. Owns the rules, the game state, the legal-move generator, effect resolution, and the replay log. Deterministic given a seed. This is the package the AI, the coach, the review, and the UI all depend on, so it must be the best-tested code in the repo.
2. `cards/` — the card database as static JSON generated by a build script, plus the effect scripts that attach to card IDs. Depends on nothing. The engine reads it; it never reads the engine.
3. `ai/` — opponent and analysis. Depends on `engine` and `cards`. Runs inside a Web Worker so the board never stutters. Exposes `chooseAction(view, budgetMs)` and `analyze(replay)`.
4. `app/` — React UI, routing, tutorial, coach panel, review, meta explorer, deck builder. Depends on all three. Contains no rules logic; if the UI ever needs to know whether a move is legal, it asks the engine.

### Data model essentials

- A **card** is identified by its printed ID (`OP09-093`). Rules text, cost, power, counter, life, colors, attributes, types, and category live on the card. Decks reference card IDs only.
- An **artwork** is a distinct image of a card (base art uses the bare ID; alternates append a suffix such as `_p1`). Art choice is cosmetic; it never affects rules.
- **Game state** is an immutable value: zones per player (deck, hand, life, leader, character area, stage, trash, DON!! deck, DON!! cost area), phase, turn, active player, pending effects, and a seeded RNG state. Every change is an **event** appended to a log; state is derivable by replaying events from the seed. This is what makes rewind, replay, review, and hidden-information views trivial.
- A **player view** is a projection of the state that hides the other player's hand, both players' deck order, and face-down life. The AI only ever receives a player view.
- An **effect script** is data (JSON or a small TypeScript DSL) attached to a card ID: trigger conditions, costs, targets, and actions drawn from a fixed vocabulary that the engine implements. Scripting coverage is measured and shown in the deck builder.

### What the plan must contain

- The milestone table from Phase 5 with your estimates attached, in hours, and the order you will build in.
- A risk register: top five risks (card-text parsing, effect coverage, AI strength versus speed, art-source terms changing, scope creep in the learning layer) with a mitigation each.
- A test strategy per package.
- The folder layout, scripts (`dev`, `build`, `test`, `test:e2e`, `cards:update`, `meta:update`), and the CI workflow.

Have a subagent review `docs/PLAN.md` as a skeptical senior engineer and a second one as a UX director; fold their notes in before gating the phase.

## Phase 3 — Deep research

Goal: the research the plan now shows you need and could not have known to do first. Three tracks, each gated on a document in `docs/research/`.

### Track E — Effect vocabulary and scripting coverage

Using the full card dump from your chosen data source:

1. Tokenize every card's effect text into its clauses and tag each clause with its timing (On Play, When Attacking, Activate: Main, Once Per Turn, DON!! x1, Trigger, Counter, On Block, On K.O., End of Your Turn, Your Turn, Opponent's Turn) and its action (draw, trash from hand, trash from deck, look at top N and reorder or add, K.O. by cost or power, rest, set active, give power until end of turn or battle, give DON!!, return DON!!, play from hand or trash, cost reduction, search by type or trait, cannot be K.O.'d, cannot attack, cannot be blocked, add life, take life, and so on).
2. Produce a frequency table of action types across the pool and across the 10 to 12 meta archetypes separately. This table is the backlog for the effect DSL: implement actions in order of meta frequency, not pool frequency.
3. Define the DSL in `docs/research/effect-dsl.md`: the full vocabulary, the condition and target grammar, how costs are paid, how choices are presented to the player and to the AI, and how an unscripted card behaves (it can be played for its stats, its text shows in the inspector with an "effect not automated" badge, and the deck builder's coverage number drops).
4. Hand-script five cards of differing complexity against the DSL on paper before writing engine code, including one leader ability, one Trigger, one Counter event, one Blocker with an On Block effect, and one card that interacts with DON!!.

### Track F — Rulings and edge cases

From the official Q&A and rulings pages, and from the comprehensive rules, write `docs/research/rulings.md` covering at least: ordering of simultaneous triggers; what happens when the character area is full; replacing a Stage; when power modifications expire (end of battle versus end of turn); how "cannot be K.O.'d" interacts with cost-based removal; attacks on rested characters; Blocker timing relative to Counter; the Trigger step when life is taken by multiple hits (Double Attack); DON!! returned to the DON!! deck versus the cost area; deck-out; the first player's restrictions on turn 1; mulligan procedure. Each entry: the question, the answer, the source link, and the engine test that will encode it.

### Track G — Meta and strategy content

For each archetype identified in Track D, write `docs/content/archetypes/<leader-id>.md` with: what the deck is trying to do in one paragraph; its game plan by turn; the five to ten cards that define it and why each is played; mulligan priorities and what a keepable hand looks like; what it is weak to; its matchup against each other archetype in the set with a one-line plan; three sourced tournament lists with event, date, and placing. Mark every claim that is your inference rather than a sourced one.

Also write:

- `docs/content/curriculum.md`: a syllabus from first game to competitive-ready, ordered as lessons, each with a concept, a drill that teaches it, and a measurable exit criterion (for example: lesson "Lethal math", drill "10 board states, find lethal or prove none", exit "8 of 10 correct in under 60 seconds each").
- `docs/content/glossary.md`: every term a new player meets, in plain language, with the rule reference.
- `docs/content/sources.md`: every article, video, or page used, with date and what it was used for.

Gate: a subagent plays the role of a competitive OPTCG player and reviews the archetype guides for anything a real player would call wrong or out of date; fix or flag before gating.

## Phase 4 — Design

Goal: a reviewed interaction design before engine and UI are joined. Deliverables in `docs/design/`: `principles.md`, `board.md`, `flows.md`, `visual-system.md`, `learning-ui.md`, and clickable HTML wireframes under `docs/design/wireframes/` that you screenshot with Playwright and review. The owner is a UX director; design as if he will critique every screen, because he will.

### Principles (write these into the app's README too)

1. **The board reads at a glance.** A player should know whose turn it is, what phase it is, how much DON!! each side has, and every creature's current power without reading anything. Numbers that change (power with DON!! attached, life count, cards in hand) are always live and always where the eye expects them.
2. **Legal moves are visible; illegal ones are not offered.** Highlight attackable targets, playable cards (cost met), and attachable DON!!. Never let the player attempt something the engine will reject.
3. **Irreversible steps are confirmable, and most steps are rewindable.** Attacks, counters, and effect choices get a clear confirm; the rewind control steps back through the event log in practice modes.
4. **No hidden state and no surprise.** Pending effects, triggers waiting to resolve, and the opponent's visible resources are always on screen. Opponent actions are animated at a pace a human can follow, with a speed control.
5. **Teach by doing, explain on demand.** Every zone, keyword, and prompt has a one-tap explanation. The coach never interrupts unless the player has asked it to.
6. **Real card art is the hero.** The layout exists to show the cards; chrome is quiet, dark, and low-contrast around high-contrast art.
7. **Landscape first, keyboard complete.** The board is designed at 1280×720 and 1920×1080 first, then adapted to tablet landscape. Phone portrait gets a "rotate to play" screen, not a cramped board.

### Board layout

Design the playmat from the official zones: for each player, Leader, up to five Characters, one Stage, Life (face down, count visible), Deck (count), Trash (top card visible, openable), DON!! deck (count), DON!! cost area (active and rested shown distinctly, attached DON!! shown as badges on the card they boost), and Hand. The opponent is mirrored at the top with their hand shown as backs. Specify exact dimensions, card aspect ratio, minimum legible card size, hover and long-press zoom behavior, and where the phase indicator, turn counter, and end-turn control live. Decide and document: click-to-select versus drag for attacks and DON!! attachment (default: both, with click as primary and drag as an accelerator).

### Flows (document each as a numbered interaction script with states and error cases)

- First launch → tutorial → first full game.
- Setup: choose your deck, choose the AI's deck and tier, choose who goes first, mulligan.
- A full turn: refresh, draw, DON!!, main (play card, attach DON!!, activate ability, attack), end.
- Battle from both sides: declaring an attack; being attacked and choosing Blocker, Counter cards, Counter events, or taking the hit; the Trigger reveal.
- Effect choices: selecting targets, ordering simultaneous effects, choosing from revealed cards.
- Hint, rewind, play-both-sides, concede, rematch.
- Post-game review, deck builder, meta explorer, drills, settings (animation speed, reduced motion, card art variant, coach verbosity).

### Visual system

Define design tokens (color, type scale, spacing, radius, elevation, motion durations and easings) in one file the app imports. Dark playmat by default with a light option; color never carries meaning alone (active vs rested uses rotation and an icon, not only tint); contrast meets WCAG 2.2 AA; all motion respects `prefers-reduced-motion`. Choose a typeface pairing with a display face for headings and a highly legible UI face for numbers; numerals must be tabular. Do not imitate the official brand look; make something that feels like a well-made tool.

### Learning UI

Design the coach as a collapsible side panel, not a modal: a "why" explanation for the last AI move, a hint request, a lethal detector that can be toggled always-on, and a DON!! math overlay that shows the attack and counter arithmetic as it happens. Design the review as a horizontal turn timeline with flagged moments; selecting a moment restores that board state and shows the better line and the reasoning. Design the Meta Explorer as a browsable grid of archetypes with tier, share, and as-of date, each opening to the guide and its lists with a "play this deck" and "play against this deck" action.

### Gate

Build the wireframes in plain HTML/CSS, screenshot every screen at both target resolutions, and run a heuristic review (Nielsen's ten plus the principles above) with a subagent acting as a demanding UX director. Record the findings and fixes in `docs/design/review-1.md`. Phase 4 is gated when no finding of severity 3 or 4 remains open.

## Game engine specification

The engine implements the Comprehensive Rules as digested in Track A. Where this section and the official rules disagree, the official rules win and you fix this section's assumption in DECISIONS.md. The items below are the shape of what you must implement; verify every number and every ordering against the rules digest before coding.

### Setup

- Each player: one Leader, a 50-card main deck (max four copies per card ID, every card's colors a subset of the leader's colors), and a 10-card DON!! deck. Validate decks in the deck builder and again at game start.
- Determine first player, shuffle, draw opening hands, offer one mulligan (full redraw) per the official procedure, set Life equal to the leader's life value by placing that many cards face down from the top of the deck.
- Encode the first player's turn-one restrictions exactly as the rules state them (draw step and DON!! count on turn one, and attack restrictions), and test them.

### Turn structure

Refresh Phase (set all rested cards active, return attached DON!! to the cost area per the rules), Draw Phase, DON!! Phase (place DON!! cards from the DON!! deck into the cost area per the rules), Main Phase (play cards by resting DON!!, attach DON!! to Leader or Characters for +1000 power each for the turn, activate abilities, attack), End Phase (end-of-turn effects, then power modifiers expire). The active player has priority throughout; the engine exposes a phase state machine and advances only through explicit actions or an explicit pass.

### Battle

Attack declaration (an active Leader or an active Character that is not summoning-sick unless it has Rush rests to attack a rested Character or the Leader) → When Attacking effects → Blocker step (the defender may rest one Blocker to redirect) → Counter step (the defender may play Counter cards from hand for their counter value and Counter-timing Events) → damage (compare attacker power to defender power; a Leader hit removes life cards to the defender's hand with Trigger checks; a Character with lower-or-equal power is K.O.'d per the rules; Double Attack takes two life) → end of battle (battle-only modifiers expire). Model every step as an explicit state so the UI and AI can act at each one.

### Effects

- Implement the DSL from Track E. Each scripted effect declares its timing, cost, conditions, targets, and actions; the engine owns the activation window, cost payment, target legality, and resolution order (active player chooses order among their simultaneous effects; opponent's effects per the rules).
- Keywords: Blocker, Rush, Double Attack, Banish, Trigger, Counter, On Play, When Attacking, On Block, On K.O., Activate: Main, Once Per Turn, End of Your Turn, and DON!! xN conditions. Treat the rules digest as the complete list.
- Rules processing: character-area limit (the player trashes down to five when a sixth would enter, per the rules), stage replacement, loss on zero life being hit again or on failing to draw, simultaneous loss handling, and surrender.

### Non-negotiable engineering properties

- Pure functions: `reduce(state, action) → { state, events }`, plus `legalActions(view)` and `project(state, playerId) → view`. No globals, no Date, no Math.random; the RNG is seeded and lives in state.
- Every game is fully described by `{ seed, deckA, deckB, actions[] }`. Replaying it must reproduce the same state hash. This is the foundation of rewind, replay, review, and bug reports.
- Hidden information is enforced by projection, not by convention: the AI and the UI receive views, never raw state, except the hotseat/play-both-sides mode which asks for two views.
- Invariants are checked after every action in development builds: card counts across zones sum to 61 per player (50 + leader + 10 DON!!), no card in two zones, power never negative in a way the rules forbid, life count equals face-down life cards.
- Test coverage: one test per rule number in the digest, one test per ruling in `rulings.md`, one test per scripted card, and a property test that plays 10,000 random legal games to completion without an invariant failure.

## Card data and art pipeline

Card data is fetched once by a script and committed as JSON; card art is never committed and loads at runtime from the chosen source. This keeps the repo legal, the app fast, and the API unbothered.

### `npm run cards:update`

1. Fetch the full card list from the primary source chosen in Track B (prefer a bulk endpoint; fall back to per-set endpoints with polite delays).
2. Normalize into the internal schema: `id`, `name`, `category` (Leader, Character, Event, Stage), `colors[]`, `cost`, `power`, `counter`, `life`, `attributes[]`, `types[]`, `rarity`, `set`, `effectText`, `triggerText`, `artworks[]` (each with `artworkId`, `imageUrls` by size, `source`), `legality` (banned, restricted, limit, by format), `sourceUrl`, `fetchedAt`.
3. Write `cards/data/cards.json` plus one file per set, and `cards/data/manifest.json` with the source, date, card count, and newest set.
4. Print a diff report against the previous snapshot: new cards, changed text (errata), removed cards. Changed effect text on a scripted card fails CI until a human or you re-verify the script.
5. New sets enter only through this script. Never hand-edit `cards.json`.

### Art at runtime

- Load images lazily, at the size the layout needs, with a low-resolution placeholder and the card's name and stats rendered as text until the image arrives, so the board is playable even if images are slow or blocked.
- Cache with a service worker (Cache API) so a second game is instant and the app works offline for already-seen cards. Respect the source's cache headers and terms.
- Fallback order per artwork: primary source URL → secondary source URL → text-only card. Never fail a game because an image failed.
- The official card database images carry a SAMPLE watermark; prefer a source with clean images whose terms allow display, and record the decision and the terms you relied on in DECISIONS.md.
- Alternate arts are selectable per card in the deck builder as a cosmetic preference stored locally; the game references card IDs only.

### Attribution and takedown readiness

- Settings → About lists every data and image source with a link, and the disclaimer that the project is unofficial.
- Image loading goes through one module with one base URL, so a source can be swapped or disabled in one place if its terms change.

## Learning layer

This is the reason the product exists. Every feature here must answer "why", not only "what", and must cite the rule, the ruling, or the strategy source it rests on. Content lives in `docs/content/` as Markdown with front matter (`title`, `sources[]`, `asOf`, `confidence`) and is compiled into the app at build time.

### 1. Guided tutorial

A scripted scenario on the real engine with a fixed seed and two starter-deck-level lists, about 20 minutes, in short steps: zones and what each is for → your first turn (draw, DON!!, play a Character) → attaching DON!! and reading power → attacking the Leader → being attacked: Blocker, Counter, or take it → Triggers → leader abilities → winning. Each step constrains legal actions to the one being taught, highlights it, and explains in two sentences. The tutorial can be exited and resumed at any step.

### 2. Coach (in any game, opt-in, never interrupts unless asked)

- **Hint**: the AI's best line for the current decision, with a one-paragraph reason.
- **Why did it do that**: an explanation of the opponent's last move in terms of the strategy concepts.
- **Lethal detector**: a toggle that lights up when either player has lethal on board, with the sequence.
- **DON!! math overlay**: during attacks, shows attacker power, defender power, counters needed to survive, and counters available in hand.
- **Blunder warning** (off by default): before confirming an action that the analysis scores far below the best line, a quiet "are you sure?" with the alternative.
- **Tempo meter**: a small indicator of DON!! spent versus available this turn, with an explanation of DON!! efficiency.

### 3. Game Review (after every game)

Run the analysis over the replay in the worker and produce a turn timeline with flagged moments: missed lethal, lethal given away, DON!! left unused, counter wasted (countered an attack that did not matter), hit taken that should have been countered (lost a key life card or the game), poor attack ordering (attacked the Leader when K.O.'ing a Character was better, or vice versa), and mulligan decisions. Each flag: what you did, what the stronger line was, the expected difference, and the concept it relates to with a link to the curriculum lesson. Selecting a flag restores the board state at that moment and lets the player replay from there against the AI. Reviews are saved locally with the replay.

### 4. Meta Explorer

A browsable grid of the current English-format archetypes from Track G: tier, meta share, as-of date, leader card art. Each archetype opens to its guide (game plan, key cards and why, mulligan guide, matchups, weaknesses), its three sourced lists, and two buttons: "play this deck" and "play against this deck" (which loads the AI with that archetype's playbook). A matchup grid view shows every archetype against every other with the one-line plan. `npm run meta:update` re-fetches tournament data and flags guides whose lists are older than 60 days.

### 5. Drills

- **Mulligan trainer**: shows an opening hand for a chosen archetype; the player keeps or mulligans and gets the guide's answer with reasoning.
- **Lethal puzzles**: board states where lethal exists or provably does not; the player must find the sequence or declare none; timed; drawn from real review flags.
- **Counter or take it**: an incoming attack with your hand shown; decide; the analysis explains.
- **DON!! allocation**: a main phase with several playable lines; pick; the analysis scores each.

### 6. Rules reference and glossary

Searchable, with the rule number, the official wording digest, the ruling where one exists, and an "show me" button that loads a tiny scenario demonstrating it on the board.

### 7. Progress (local only)

Lessons completed, drill accuracy over time, win rate by archetype and AI tier, and the most frequent review flags, so the player can see which concept to work on next. No accounts; export and import as a JSON file.

## AI opponent

The AI plays real meta decks according to each deck's game plan, never cheats, and can explain itself. It runs in a Web Worker with a per-decision time budget so the board never freezes.

### Tiers

| Tier | Method | Purpose | Budget per decision |
| --- | --- | --- | --- |
| Rookie | Uniformly random legal action, with a rule to always block or counter lethal | Tutorial and the baseline every other tier must beat | 10 ms |
| Pirate | One-ply evaluation with a hand-tuned heuristic (board power, DON!! efficiency, life differential, hand size, tempo) plus the archetype playbook | A beatable but sensible opponent for learners | 100 ms |
| Warlord | Search over the legal-action tree (expectimax or MCTS with determinization for hidden information) using the same heuristic as the leaf evaluation, plus the playbook as a move-ordering prior | The default practice opponent | 1,500 ms |
| Emperor | Warlord with a larger budget and iterative deepening | Stress practice | 5,000 ms |

### Archetype playbooks

For each archetype in the Meta Explorer, a small data file encodes its priorities by game stage: which cards to dig for, when to go face versus clear the board, how aggressively to spend counters, what to keep in a mulligan, and which cards are win conditions. The playbook biases the heuristic and move ordering so that the AI with Red Luffy plays like Red Luffy and the AI with a control deck plays like control. The playbook is also what the Meta Explorer's guide is written from, so the two never disagree.

### Rules the AI must obey

- It receives only a player view. It never reads the opponent's hand, deck order, or face-down life. Determinization samples unknown cards from the known remaining pool.
- It never takes an illegal action; it always picks from `legalActions(view)`.
- Every decision returns `{ action, reason, alternatives[] }` where `reason` is a short template-driven explanation in strategy vocabulary. The coach's "why did it do that" and the review both consume this, so it must be real, not decorative.
- Strength tests in CI: Warlord beats Rookie at least 95% over 200 seeded games; Pirate beats Rookie at least 75%; Warlord beats Pirate at least 65%. Any tier never exceeds its time budget by more than 20% on the CI machine.

### Analysis mode

The same search, with a larger budget and full information (the replay knows everything), powers Game Review: for each decision in the replay, compare the taken action against the best found line and emit flags when the evaluation gap exceeds a threshold, categorized as in the review section. Missed lethal is computed exactly, not heuristically: enumerate attack sequences and counter responses to prove whether a forced win existed.

## Phase 5 — Build milestones

Build in this order. Each milestone ends with a green test suite, a STATUS.md update, a commit, and for anything visible, screenshots reviewed by a subagent. The app must be openable in a browser from M1 onward, even if what it shows is a card browser.

| Milestone | Scope | Done when |
| --- | --- | --- |
| M0 Scaffold | Repo, four packages, scripts, CI, lint, tokens file, README with the principles | `npm run dev` serves a page; CI runs tests and builds on push |
| M1 Cards | `cards:update` script, normalized JSON, image module with caching and fallbacks, card browser with search and filters | Every English-release card browsable with art; diff report works; browser screenshot reviewed |
| M2 Engine core | State, zones, phases, DON!!, play, attach, attack/block/counter/damage, life, triggers, keywords, legal-move generator, projection, replay | One test per rule number; 10,000 random games run clean; replay hash stable |
| M3 Playable board | Playmat per the design, hotseat (play both sides), click and drag interactions, phase stepper, confirm and rewind, card inspector | Playwright plays a full hotseat game; keyboard-only run passes; screenshots at both resolutions reviewed |
| M4 Effects | DSL runtime; scripts for every card in the 10 to 12 meta lists, then by meta frequency; coverage report in deck builder | 100% of meta-list cards scripted with a test each; coverage number shown |
| M5 AI | Worker, Rookie and Pirate, then Warlord, playbooks for all archetypes, explanations | Strength thresholds pass in CI; AI vs AI full game runs under budget |
| M6 Deck builder | Build, validate, import and export (text list and Limitless-style formats), alt-art choice, coverage, load into game | Round-trips a tournament list without loss; validation matches the rules |
| M7 Tutorial and coach | Guided tutorial, hint, why, lethal detector, DON!! overlay, blunder warning, tempo meter | A new user finishes the tutorial in under 20 minutes in a moderated Playwright run; coach never interrupts unprompted |
| M8 Review | Analysis mode, flags, timeline, restore-and-replay, local save | Planted missed-lethal and wasted-counter scenarios are flagged correctly with sensible explanations |
| M9 Meta and drills | Meta Explorer, matchup grid, `meta:update`, four drills, rules reference, progress | Guides render with as-of dates and sources; each drill has at least 20 items; progress persists and exports |
| M10 Polish and release | Performance pass, accessibility audit, reduced motion, offline, About page, deploy | Lighthouse performance and accessibility at or above 90; WCAG 2.2 AA; deployed URL in STATUS.md |

After M10, continue with a backlog file `docs/BACKLOG.md` ordered by value: sealed mode, more AI depth, more archetypes, Japanese-format toggle, replay sharing by URL, and anything the owner adds.

## Quality bar

### Testing

- Engine: unit tests keyed to rule numbers and rulings; a test per scripted card that sets up a minimal board, activates the effect, and asserts the resulting state and events; property tests that play random legal games and check invariants; golden replays that must reproduce the same final state hash across versions.
- AI: strength thresholds and time budgets in CI; a test that the AI never calls anything but `legalActions`; a test that explanations are non-empty and reference a known concept.
- App: Playwright flows for tutorial, full game vs AI, deck import and load, review of a planted game, and every drill; keyboard-only variants of the game flow; visual regression screenshots of the board, inspector, coach panel, review timeline, and meta explorer at 1280×720 and 1920×1080.
- Content: a build-time check that every content file has sources and an as-of date, that every card ID mentioned exists, and that every archetype in the explorer has a playbook.

### Performance

- First playable board under 3 seconds on a throttled mid-range laptop profile; initial JavaScript under 300 KB gzipped excluding the card JSON, which loads per set on demand.
- 60 fps during card animations; AI decisions never block the main thread; worker time budgets enforced.
- Images sized to the slot, lazy, cached; no layout shift when art arrives.

### Accessibility

- WCAG 2.2 AA: contrast, focus visibility, target size, no color-only meaning, reduced motion honored.
- Full keyboard play: tab order follows the board's reading order; every action reachable by keyboard with visible focus; a shortcut sheet.
- Screen reader: zones and cards have names and states (active, rested, DON!! attached, power); phase changes and attack prompts are announced in a live region.

### Code

- TypeScript strict with no `any`; ESLint and Prettier in CI; every package has a README that says what it owns and what it must not know about.
- No rules logic outside `engine/`; a lint rule or review check enforces that `app/` never imports engine internals, only the public API.

### Verification ritual before any milestone is marked done

1. `npm test` and `npm run test:e2e` green.
2. Build the production bundle and serve it; play one full game against Warlord by hand through Playwright, step by step, reading each screenshot.
3. A subagent reviews the screenshots against `docs/design/principles.md` and files any severity 3 or 4 finding as a blocker.
4. STATUS.md updated; commit; push.

## Non-goals, legal, and open questions

### Not in version 1

- Online multiplayer, matchmaking, accounts, chat, or any server.
- Trading, collection tracking, or card prices.
- Japanese-only cards and the Japanese format (design the data layer so a format toggle is possible later; do not build it).
- Portrait phone layout; a rotate prompt is the whole mobile-portrait experience.
- Custom playmats, sleeves, cosmetics, sound design beyond a few subtle cues, and any monetization.

### Legal posture

- This is an unofficial, non-commercial fan tool. It is not affiliated with or endorsed by Bandai, Shueisha, or Toei Animation. The disclaimer appears in the footer of every page and in the README.
- Card images are displayed from their source at runtime and are never redistributed from this repository or build. Card text is factual game data; store it, cite its source, and never claim it as original.
- Follow every data source's terms of use; where terms forbid an intended use, choose another source and record why.
- Keep the image module swappable so a takedown or a terms change is a one-line fix, not a rebuild.

### Open questions for you to resolve and log

- Which source gives clean, non-watermarked images with display rights, and what is its newest-set coverage today?
- Does the chosen rules version include any keywords or timing changes newer than the digest; is a rotation or block format in force for the English game as of today?
- How will mulligan and first-player rules be presented to a new player without a wall of text?
- What is the smallest effect-DSL vocabulary that covers 100% of the current meta lists?
- Which search method gives Warlord real strength inside 1.5 seconds in a browser worker?

### Final instruction

Start now with Phase 1. Create the repo structure, write `docs/STATUS.md` with the phase plan, and begin Track A through Track D in parallel. Do not ask for permission to proceed. When you finish a phase, gate it, update STATUS.md, and continue to the next. When all five phases are done, STATUS.md must contain the deployed URL, the test counts, the scripting coverage, and the AI strength results. Then stop and wait.
