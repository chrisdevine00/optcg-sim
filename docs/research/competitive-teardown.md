# Competitive teardown: existing OPTCG simulators (Track C)

As of: 2026-10-28. Author: Phase 1 Track C research agent.

Screenshots of third-party products are gitignored (see DECISIONS 2026-10-28, "Third-party screenshots are not committed"). They live in `docs/research/teardown-shots/` on the machine that produced them and are referenced here by filename only. Prefixes: `ut-` Untap.in, `bt-` Bandai Teaching App (browser version). There are no `sk-` (SeaKing) shots; see §2.

Status legend for each section: **Hands-on** means a person-equivalent session in the product, with screenshots. **Secondhand** means assembled from public pages, store listings and write-ups that could actually be opened; nothing in a secondhand section was observed directly.

## Access and conduct notes (read first)

Before any automated browsing, each site's `robots.txt` was fetched (2026-10-28):

| Site | robots.txt for Anthropic agents | What we did |
|---|---|---|
| seaking.gg | `ClaudeBot`, `anthropic-ai`, `Claude-Web`: `Disallow: /`. Header also reserves text-and-data-mining rights and states that "rebuilding a competing card-game engine from this content" is prohibited without a written licence. | **No automated access.** No Playwright session, no WebFetch of any SeaKing page. Section is secondhand, from third-party pages only. The owner should play SeaKing himself (checklist in that section). |
| duelvoyager.com | Cloudflare-managed: `User-agent: *` allowed with `Content-Signal: search=yes, ai-train=no, use=reference`, but `ClaudeBot`, `anthropic-ai`, `Claude-Web`: `Disallow: /`. | An earlier agent session captured screenshots **before** this check was recorded. That material is not used; see §1. No further automated access was made. |
| untap.in | `User-agent: * Allow: /` | Browsed as a guest where possible (see section). |
| optcgsim.com | `User-agent: *` allowed except `/wp-admin/` | Public pages read. |
| app.onepiece-cardgame.com (Bandai) | robots.txt returns 404 (no rules) | Browser tutorial loaded; stopped at its Terms of Use, which prohibit "external tools … not approved by Us" (see §6). |

No accounts were created anywhere.

## Pages opened

Opened in this session (2026-10-28).

- https://seaking.gg/robots.txt (the only SeaKing URL fetched)
- https://duelvoyager.com/robots.txt
- https://untap.in/robots.txt, https://untap.in/sitemap.xml
- https://untap.in/play/one-piece-card-game, https://untap.in/, https://untap.in/updates (Playwright)
- https://wiki.untap.in/robots.txt, https://wiki.untap.in/, https://wiki.untap.in/books/game-interface
- https://optcgsim.com/robots.txt, https://optcgsim.com/, https://optcgsim.com/patch-notes/
- https://optcgsim.com/patch-notes/1-39a-release-op16/, …/1-40a-release-target-fixes/, …/1-41a-release-starter-decks/, …/1-41b-release-action-fix/, …/1-42a-release-op17/, …/1-44a-release-eb05-updates/
- https://onepieceplayer.com/play-one-piece-card-game-online-optcgsim/
- https://www.shonentcg.com/blog/one-piece-tcg-how-to-play-online-free
- https://www.dexerto.com/gaming/one-piece-card-game-can-you-play-online-2258359
- https://apps.apple.com/us/app/-/id1631528594
- https://en.onepiece-cardgame.com/, …/play-guide/, …/beginners/, …/beginners/how-to-play.php
- https://app.onepiece-cardgame.com/robots.txt (404), https://app.onepiece-cardgame.com/en/, https://app.onepiece-cardgame.com/en/webgl/index.html (Playwright, stopped at Terms of Use)
- Web searches (summaries only; not cited as fact): SeaKing features, OPTCGSim guides, TTS One Piece tables, Bandai Teaching App.

Tried and failed: dotesports.com OPTCGSim guide (HTTP 403), Steam Workshop item 3009136894 (HTTP 429), ljlambino.com OPTCGSim 1.14d article (connection reset), YouTube tutorial page (no description in the response).

---

## 1. DuelVoyager (duelvoyager.com) — Not studied

DuelVoyager's robots.txt disallows `ClaudeBot`, `anthropic-ai` and `Claude-Web`. An earlier agent session (killed by a machine restart) browsed it and took screenshots before that check was made. That material was gathered against the site's policy, so it is **not used** in this document, and its observations were removed on 2026-10-28.

What is known without visiting the site comes from PROMPT.md's description (via alternativeto.net): a browser simulator with a deck builder, ranked and casual play, replays, custom playmats and a meta page. Whether it enforces rules, how battles and DON!! work, and how it onboards a new player are **unknown** here. The owner can fill this section by hand using the SeaKing checklist in §2.

---

## 2. SeaKing (seaking.gg) — Secondhand (no access; robots.txt disallows Anthropic agents)

**This is the most important product on the list and the least observed.** SeaKing's `robots.txt` disallows `ClaudeBot`, `anthropic-ai` and `Claude-Web` site-wide and reserves text-and-data-mining rights, explicitly naming "rebuilding a competing card-game engine from this content" as prohibited without a licence. Per the conduct rules for this track, no Playwright session was run and no SeaKing page was fetched. Everything below comes from a general web-search index's summaries of SeaKing's own marketing pages (vendor claims, unverified) and from the description in `PROMPT.md`. No independent review, Reddit thread or video about SeaKing was found by search on 2026-10-28.

### What SeaKing says it does (vendor claims via search index)

- Free, unofficial, browser-based practice simulator; "not affiliated with Bandai".
- Play full games against an AI that pilots real tournament decks; build a deck; or open sealed packs.
- AI tiers Easy, Medium, Hard; Hard is described as the default for regular practice. The AI "searches its legal moves" and "considers how you can answer"; the player's hand and face-down Life are hidden from it (claimed fair-information AI).
- A "Learn" mode "keeps the rule prompts on screen and lets you take a move back".
- An in-game hint menu containing "Hint", "Play both sides" and "Rewind".
- Every game is recorded; **Game Review** rebuilds the game and searches each of your turns for a win that was on board, showing "the full line from the first card through the last attack". The vendor's own test: 30 of 32 recorded turns completed the search, one hit a branch limit, one timed out. It says a reasonable table decision can still be graded low if it lost to cards you could not see, and that Game Review cannot import a paper game or screenshot.
- SeaKing publishes SEO pages comparing simulators ("Best One Piece TCG Simulator in 2026"), an "OPTCG vs AI" page and a Game Review page ("Find the Lethal You Missed").

### What we could not observe

Flow from landing to first attack, board layout, attack/block/counter mechanics, DON!! attachment, load time, sealed flow, deck builder, the visual design of Game Review, and patch notes (patch notes are on seaking.gg and were not fetched). No `sk-` screenshots exist.

### Critical reading of the claims (inference, not observation)

1. Game Review grades **outcomes of a search for lethal**. Its own caveat ("a reasonable table decision can still get a low grade if it lost against cards you could not see") is a sign that it evaluates against perfect information after the fact. That is a teaching hazard: it will sometimes punish correct play under uncertainty. Our review should separate "missed a line that was winning against every hand the opponent could hold" from "a line that only works if you knew their hand".
2. Search with a branch limit and a time limit means some turns are "unknown". The UI needs an honest third state (not "no missed win") for those turns.
3. "Rewind" and "Learn" exist; that sets the floor. Our differentiation has to be the explanation layer (why this line, how to see it next time), not the existence of review.
4. The AI claims hidden-information fairness. We should match that and say so in the UI, because a learner who suspects the AI cheats stops trusting the coach.

### Hands-on checklist for the owner (15–20 minutes, as a human player)

Because the agent cannot access SeaKing, the owner should play one game and note: time from typing the URL to a clickable board; how deck pick for both sides works; mulligan presentation; whether legal plays are highlighted; how DON!! is attached (drag, click, count stepper); how the defender is prompted (Blocker step, Counter step, battle maths shown or not); how Triggers are presented; animation pacing and speed control; what Hint actually says (move only, or a reason); how Rewind scopes (one action, one turn, any point); what Game Review shows for a turn with a missed win (board snapshot, line, explanation, grade); deck builder import format; sealed flow. Save screenshots as `docs/research/teardown-shots/sk-NN-step.png` (gitignored). Note that SeaKing's terms prohibit using its content to rebuild a competing engine; observations of UX are fine, copying its review logic or text is not.

---

## 3. OPTCGSim (desktop client, Batsu / "Maebatsu") — Secondhand

Sources actually opened: optcgsim.com (home, patch-notes index, and five patch-note posts: 1.39a, 1.40a, 1.41a, 1.41b, 1.42a, 1.44a) and onepieceplayer.com's install-and-play guide (updated 2025-05-28; its changelog stops at 1.25c, 2024-10-23). Nothing was installed. Videos found by search (YouTube tutorials) could not be read beyond their titles.

### What it is

A free, unofficial practice client "made by a single developer" (onepieceplayer.com), distributed as zip files for Windows, Mac and Linux, an Android APK (plus a 32-bit build), and a sideloaded iOS build ("Apple does not allow unsigned apps to be installed normally onto iOS devices", optcgsim.com). Downloads come from Dropbox/Google Drive mirrors, a Linktree, or a Discord bot command (`!download`). Latest release on the site: **1.44a (EB05 Updates), 2026-10-07**; the download filenames still say 1.30d, unexplained. Online play uses port 7777 and "VPNs can mess up matchmaking". Ranked play is run on a separate Discord server with MMR and seasons ("OPBounty" in patch notes).

### Flow from landing to first attack (as documented)

Download zip from a mirror → unzip → run the executable (no signed installer; the guide does not mention Gatekeeper/SmartScreen) → enter a player name → tick settings ("We recommend ticking all of the boxes," because they prevent common mistakes, onepieceplayer.com) → Deck Editor to load or import a list → Multiplayer: choose a card pool queue (Western = current English-legal, Eastern = Japanese incl. upcoming sets, Unlimited, Private) → lobby list / Quick Join / host → mulligan (keep or reshuffle five) → play. **There is no AI opponent**; the only solo mode is "Solo v Self", playing both sides.

Updating is manual on desktop: overwrite the old folder while keeping your `Decks` folder (back it up first). 1.40a added "Mini-patching functionality … for all device types. We'll find out soon if it works!" Alternate art is user-installed by dropping image files named by card ID into `StreamingAssets/Cards/<set>/`.

### Board, attacks, blocks, counters, DON!!

Not directly documented in any source we could read. What the patch notes reveal about the interaction model:

- Card effects are **scripted per card and executed by the client**, with optional/mandatory prompts and target selection (e.g. "OP04-058 Crocodile Ramp should be optional", "OP05-085 Cobra's mill effect should not be optional", "OP15-015 Higuma should only be able to attach Rested Don"). This is an automated engine.
- DON!!: an "Attach all Don" button exists but must be enabled in Settings and "always requires confirmation"; right-clicking the DON!! area "visually separates your DON"; "The default 'Tap a Don' action should try to skip Frozen Don if possible" (1.39a). DON!! is not included in the deck list.
- Turn structure has explicit sub-steps the player sees ("Added a new Step 'Then End of Turn Actions' that happens after 'End of Turn Actions'", 1.39a).
- There is a combat log and beta save states ("Added logging for Save States and Combat log saving", 1.39a); a lobby turn timer; "Deck counts are now hidden by default" (1.39a); a "Hide Player Names" setting.
- Hover shows card details; set code shows bottom-right (onepieceplayer.com).

### What players tolerate (evidence from patch notes)

- **Game-breaking bugs tied to individual cards, every release.** Examples: "ST36-005 Kid crashes the game if no life can be flipped down" (1.44a); "OP10-087 Chopper can crash the game if opponent doesn't have enough cards" (1.44a); "Any actions that require switching the active player (ie On Opponent Attacks, etc) were breaking the game" (1.41b); "Cards that use 'Two different target types' tech are broken, only the first target type coded will be valid targets" affecting eight cards including two Leaders (1.40a); a Double Attack sequence "causing the attacker to also take a life" (1.40a); "Big network code rewrite to make Kaido + Linlin clearing a board full of OnKOs work properly" (1.41a).
- **Timing-window special cases** handled by exception: "OP05-098 Enel leader should be able to choose to activate his effect in the same timing window as any trigger-queued effects … because he is a Special Snowflake"; "OP13-064 Roger's passive isn't removed by Silence effects because he's a Special Snowflake" (1.39a). This is what a per-card scripting approach without a general timing model looks like after three years.
- **Install friction** (zip, unsigned binaries, Discord-gated download, manual folder-overwrite updates, back up your decks first) and **no AI**: you need a human opponent or you play yourself.
- Name typos and type-line errors (e.g. "Sea King" renamed "Neptunian" across the board, 1.44a) that silently break type-matching effects.

Players accept all of this because it is the most complete card pool, current within days of reveals, with an active ranked community. That is the bar for card coverage and freshness; it is not a bar for interaction design.

### Confusing / delightful (inferred, secondhand)

Confusing: the settings you must tick to avoid mistakes are opt-in; save states are beta; known-bugs page reads "Coming soon…". Delightful: same-week card coverage of new sets; queues by card pool; an "Attach all Don" accelerator with confirmation; a combat log.

### Load time

Not measurable without installing. Time-to-first-game includes download, unzip, first-run settings and finding an opponent.

---

## 4. Untap.in — Hands-on to the signup wall, then secondhand from its own release notes

Robots allow all. Browsed with Playwright (Chromium, 1280×720) on 2026-10-28: `https://untap.in/play/one-piece-card-game` (`ut-01-op-landing.png`), the app root `https://untap.in/` (`ut-02-app-root.png`) and the release notes `https://untap.in/updates` (`ut-03-updates.png`). The wiki's "Game Interface" book (`wiki.untap.in/books/game-interface`) is empty ("No pages or chapters have been created for this guide").

### The wall

There is **no guest mode**. The app root is a login card (username/password, "Login with Discord", Create Account) beside an intro video (`ut-02`). Playing requires an account; per the conduct rules none was created, so no board was observed. The One Piece landing page (`ut-01`) loads fast (DOMContentLoaded 69 ms, network idle 0.65 s on this connection) and is an SEO page with stats ("13,172 cards in database… 43,142 decks built"), feature blurbs, and a "Popular cards" strip whose first entries are "Don!!" and "Don!! Card", i.e. DON!! is modelled as an ordinary card in the database. The app root never reached network idle within 30 s (a persistent connection), but the login card painted promptly.

### What Untap is, in its own words

- "it does not enforce the rules, so you play the way you would across a real table" (app root FAQ).
- Untap Script (a recent addition): "It is not a rules engine and it enforces nothing: every action a script takes is one you could have made by hand." Community-published "board helpers" add buttons above your hand (e.g. draw opening hand, mulligan), and they replaced the per-game quality-of-life buttons.
- Rewind: "lists what's been done so far this round; pick an action and the board goes back… Playing on your own it happens straight away; with other people at the table it needs a majority of them to agree first." It reshuffles decks by default "because anyone who saw the cards you're putting back still knows what they were."
- One Piece gets a symbol palette ("One Piece gets Rush, Blocker and Banish") and a generic N/N stat counter on cards; life is a single big number on a seat plate with +/- buttons.
- Live Presence: you can see the opponent's cursor, a ghost of the card they are dragging, and a ring around the card they are looking at.
- "Board for AI": copies a text description of the table to paste into any AI assistant "for a read of the board". This is the clearest signal in the whole landscape that players want strategic analysis and are bolting it on by hand.
- Deck import by URL from many sites (for One Piece: Limitless One Piece, gumgum.gg, onepiece.gg, Egman Events); "Popular decks" from the last 90 days.
- Solo: goldfish against an empty seat; "Deck vs Deck" with up to six decks.

### What the lack of rules enforcement costs a learner (analysis)

1. **No feedback loop.** A learner who attacks an active Character, forgets that DON!! power only applies on your own turn, double-counts a Counter, or skips the Trigger check gets no signal at all. Mistakes are rehearsed into habit.
2. **The learner must already know the turn structure** to drive the board: refresh, draw (not on turn 1 going first), add DON!!, main, end. In OPTCG the DON!! economy is the whole game, and a free-form table makes the learner do the bookkeeping instead of the thinking.
3. **Battle maths is mental arithmetic.** With only an N/N counter, the learner computes base power + DON!! + effects + Counter values alone, under time pressure, which is exactly the skill they came to practise and exactly where they need a visible worked example.
4. **Hidden information is honour-system.** Life cards, the deck order and the opponent's hand are all physically reachable; rewind reshuffles to compensate. A learner cannot trust a "practice" result.
5. **No opponent without a human.** Goldfishing teaches sequencing but not interaction (when to counter, when to take a hit). Learning to defend requires an opponent who attacks correctly.
6. The upside is generality and freedom: any card works on day one, house rules are fine, misclicks are recoverable by social agreement.

### Delightful

Rewind with a list of actions and an honest "reshuffle because people saw the cards" default; Live Presence (cursor, drag ghost, look ring) as a way to make the opponent's intent visible; one-click deck import by URL; Board for AI.

### Confusing

No guest path; the interface guide in the wiki is empty; DON!! is a generic card rather than a resource; the game-agnostic table puts One Piece's specific zones (Life, DON!! deck, cost area) on the player to arrange.

---

## 5. Tabletop Simulator One Piece tables — Secondhand

Sources opened: shonentcg.com "One Piece TCG: how to play online free" (2026-08-07). A Steam Workshop item ("One Piece TCG - All available cards (EN)", changelog last entry seen in a search result dated 2023-12-15) could not be opened (Steam returned HTTP 429), so no Workshop description is quoted.

- Tabletop Simulator is a paid Steam app; One Piece tables are free community Workshop mods. "There's no automated rules engine checking your plays for you" (shonentcg.com). It is "a general-purpose virtual tabletop game" not built for One Piece; mods can go stale; a separate voice channel is usually needed.
- Cost to a learner is the same as Untap but higher: 3D physics card handling (pick up, flip, rotate) for every DON!! rest and every attach; a paid install; a stale card pool unless the mod author keeps up; no hidden-information enforcement beyond hand zones.
- Board layout, flow, load time: not observed.

---

## 6. Bandai ONE PIECE CARD GAME Teaching App — Mostly secondhand (title screen and terms observed)

Sources: App Store listing (id1631528594), Dexerto (2023-08-21), shonentcg.com (2026-08-07), and the official site's Play Guide, "Learn the Rules to Play" and Teaching App browser-version pages on en.onepiece-cardgame.com / app.onepiece-cardgame.com.

### What it is

- Free, by BANDAI Co., Ltd. iOS listing: version 1.3.2, last updated 2025-03-19 ("In-app text updates"), 291.6 MB, 3.4/5 from 316 ratings. Android exists (Dexerto in 2023 said Android-only; the iOS listing contradicts that now).
- **There is also an official browser version** (Unity WebGL) at `app.onepiece-cardgame.com/en/`. Its recommended environment is striking: Windows "Core i7-3770… 8GB… GeForce GTX 75Ti or higher… Open Disc Space: 20GB… Display 1920 x 1080 or higher", Mac "32GB" memory.
- Two modes: "Tutorial Mode" for the basic rules, then "Free Battle Mode" to play against the computer. The official Play Guide says "The Teaching App lets you try the game using a Starter Deck." App Store reviewers: "only 2 of the 4 starter decks are playable"; praise for step-by-step teaching, smooth play and no turn timer; asks for deck building, more decks and online play; "some early tutorials were described as confusing."

### Observed (Playwright, browser version, 2026-10-28)

- Load: the page fetched a 71 MB data file and a 38 MB WebAssembly file (≈111 MB before the first screen). On this connection the "TAP TO START" title screen was up within 5 s (`bt-01-load-5s.png`; later frames `bt-01-load-15s/30s/60s/90s.png` are identical). On a typical home connection 111 MB is tens of seconds.
- The canvas is letterboxed at a fixed 16:9 inside the window with white bars (`bt-01-load-5s.png`), version string "Ver1.3.2" in the corner.
- Tapping start opens a Terms of Use modal (`bt-02-after-tap.png`, `bt-03-terms-a…f.png`). The mouse wheel does not scroll it; only dragging the text does. The terms prohibit "(4) Use of external tools in the App that are not approved by Us" and "(6) Use of the App for purposes other than those intended". **Automated play was stopped at this point** because driving the app with Playwright is plausibly an "external tool not approved". Tutorial content, board and battle flows were therefore not observed. The owner can play it by hand (10–15 minutes) to fill this gap.

### How the publisher teaches (from the official pages)

The Play Guide is a model of sequencing: what you need (1 Leader, 50 cards, 10 DON!!), five card types each in two sentences, an annotated playmat with eight numbered zones, a five-step game setup, two victory conditions, five phases one line each, then "TRY THE TEACHING APP". It is accurate and short. It also simplifies: "You win a battle against your opponent's Leader when they have 0 Life cards remaining" and "Your opponent has no cards left in their deck" (the CR's deck-out wording is subtler; see `rules-digest.md`). Bandai routes learners next to video, a Quick Beginner's Guide, official shops and teaching events, i.e. humans.

### Confusing / delightful (secondhand)

Confusing: limited to Starter Decks two of which are playable; nothing after "Free Battle" (no deck building, no meta); a 111 MB download and gaming-PC specs for a tutorial; terms gate before any content. Delightful: official, accurate, free, untimed, reviewers find the step-by-step tutorial clear; the official Play Guide's zone diagram and five-phase list are the right first ten minutes.

---

## 7. Other products seen but not studied

Search on 2026-10-28 surfaced at least two further browser sims that claim an AI opponent: **OPlayTCG** (oplaytcg.com: "solo practice where you play both sides and rewind any move… a real match against the AI") and **OPTCG Web Sim** (optcgwebsim.com: "an AI opponent piloting any of the current top meta decks", plus ranked). Neither was opened; both are vendor claims from search summaries. The AI-practice niche is more crowded than PROMPT.md assumes. Recommended follow-up: owner spends 10 minutes in each.

---

## UX decisions we will make differently, and why

Numbers in brackets are the Phase 4 principles: [1] board reads at a glance, [2] legal moves visible / illegal not offered, [3] confirm irreversible, rewind most, [4] no hidden state or surprise, [5] teach by doing, explain on demand, [6] card art is the hero, [7] landscape first, keyboard complete. Evidence comes only from the sections above that were studied (Untap.in, OPTCGSim, TTS, Bandai Teaching App, and SeaKing's own claims).

1. **Rules are enforced; the UI offers only legal actions.** [2][5] Untap and TTS enforce nothing (§4, §5); OPTCGSim does automate, but its patch notes show per-card timing exceptions and game-breaking card bugs every release (§3), which is why our engine has one general timing model and a test per scripted card. A learner cannot learn from a table that silently accepts every mistake. Our highlights come from the engine, and a card that is not a legal target explains why on hover ("Active Characters can't be attacked").
2. **Every Leader and Character shows its live power as a large tabular number, and every battle opens a battle panel.** [1][4][5] The panel shows attacker power vs defender power, the gap, the Counter cards in hand that would close it, and updates live as Blockers and Counters are chosen. This is the DON!! math overlay from the Learning UI brief, and it is where most learning happens.
3. **The defender is walked through Blocker → Counter → damage → Trigger as prompts with a "take it" option.** [2][4] In manual tables (Untap, TTS) the defender must know the battle steps and negotiate them with the opponent. Each prompt names the step, shows only legal choices, and confirms before committing a Counter [3].
4. **Phase and turn are named in words, in one fixed place, with a labelled End Turn button and a keyboard shortcut.** [1][7] The board reads "Your turn 3 · Main phase", with the steps of the turn visible as a breadcrumb.
5. **No wall between the URL and a game against the AI.** [5][7] Untap is login-only (`ut-02`); OPTCGSim is a zip, an unsigned binary and a Discord; Bandai's browser tutorial downloads about 111 MB (`bt-01`). Ours: no account, the first screen offers "Play vs AI" with a preselected deck, and a load budget is set in Phase 2.
6. **Rewind is instant, unlimited in practice modes, and deterministic.** [3] Untap's rewind needs a majority vote and reshuffles decks. Against the AI we restore the exact prior state including the RNG seed, so rewinding cannot be used to fish for a better draw, and the UI says so.
7. **The review states what the player could know.** [4][5] SeaKing's own caveat (a reasonable decision "can still get a low grade if it lost against cards you could not see") shows the hazard of grading with hindsight. Our review labels each finding as one of three kinds: a win that worked whatever the opponent held, a line that needed hidden information, or "search incomplete". It never marks an unsearched turn as clean.
8. **Card art is the hero; the chrome stays quiet.** [6] A large hover or focus preview with readable rules text, dark low-contrast chrome, and colour never carrying meaning alone.
9. **Opponent actions are paced and logged.** [4] An always-visible log, one line per event, in the same words as the battle panel, with a speed control.

## Open questions

1. **DuelVoyager.** Not studied (§1). The owner may fill it in by hand; otherwise it stays out of scope.
2. **SeaKing hands-on.** SeaKing blocks Anthropic agents and reserves mining rights, so this teardown has no first-hand view of the main baseline. Will the owner play one SeaKing game using the checklist in §2, and the Bandai browser tutorial, and add notes and `sk-`/`bt-` screenshots?
3. **Wider scope.** OPlayTCG and OPTCG Web Sim also claim AI opponents. Should they be added to the teardown?

## Proposed decisions

1. **Research automation obeys robots.txt and terms.** Context: SeaKing and DuelVoyager disallow Anthropic agents, and Bandai's app terms prohibit unapproved external tools. Decision: agents do not automate those sites. Where we need first-hand observation, the owner does it by hand, and documents mark each source as hands-on or secondhand. Alternatives rejected: generic browser user agents (that evades the block); skipping SeaKing entirely (it is the baseline).
2. **Rules enforcement only; no manual sandbox in v1.** Context: Untap and TTS show that manual tables teach nothing and let mistakes become habit. Decision: the UI offers only actions the engine says are legal; any manual "fix the board" tool waits for a later debug or puzzle editor. Alternatives rejected: a manual override menu; a toggle between enforced and free play.
3. **Battle panel and deterministic rewind are core to the MVP.** Context: no product we surveyed shows live battle maths, and Untap's rewind needs a vote and reshuffles. Decision: every attack shows live attacker and defender power, the gap, and the Counters available. Rewind restores the exact state including the RNG seed. Alternatives rejected: power shown only on hover; rewind that re-randomises the deck.
