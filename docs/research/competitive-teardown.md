# Competitive teardown: existing OPTCG simulators (Track C)

As of: 2026-10-28. Author: Phase 1 Track C research agent.

Screenshots of third-party products are gitignored (see DECISIONS 2026-10-28, "Third-party screenshots are not committed"). They live in `docs/research/teardown-shots/` on the machine that produced them and are referenced here by filename only. Prefixes: `dv-` DuelVoyager, `ut-` Untap.in.

Status legend for each section: **Hands-on** means a person-equivalent session in the product, with screenshots. **Secondhand** means assembled from public pages, store listings and write-ups that could actually be opened; nothing in a secondhand section was observed directly.

## Access and conduct notes (read first)

Before any automated browsing, each site's `robots.txt` was fetched (2026-10-28):

| Site | robots.txt for Anthropic agents | What we did |
|---|---|---|
| seaking.gg | `ClaudeBot`, `anthropic-ai`, `Claude-Web`: `Disallow: /`. Header also reserves text-and-data-mining rights and states that "rebuilding a competing card-game engine from this content" is prohibited without a written licence. | **No automated access.** No Playwright session, no WebFetch of any SeaKing page. Section is secondhand, from third-party pages only. The owner should play SeaKing himself (checklist in that section). |
| duelvoyager.com | Cloudflare-managed: `User-agent: *` allowed with `Content-Signal: search=yes, ai-train=no, use=reference`, but `ClaudeBot`, `anthropic-ai`, `Claude-Web`: `Disallow: /`. | The 62 `dv-*` screenshots were captured by an earlier agent session (killed by a machine restart) **before** this check was recorded. No further automated access was made. The section below is written from those screenshots. Whether to keep them is an open question for the owner (see Open questions). |
| untap.in | `User-agent: * Allow: /` | Browsed as a guest where possible (see section). |
| optcgsim.com | `User-agent: *` allowed except `/wp-admin/` | Public pages read. |

No accounts were created anywhere. DuelVoyager's guest mode auto-assigns a `DuelVoyager#NNNNN` handle; that is not a signup.

## Pages opened

(Filled in as each section is finished.)

- https://seaking.gg/robots.txt (only SeaKing URL fetched)
- https://duelvoyager.com/robots.txt
- https://untap.in/robots.txt
- https://optcgsim.com/robots.txt

---

## 1. DuelVoyager (duelvoyager.com) — Hands-on (earlier session, screenshots only)

Captured at 1280×720 in Chromium by the earlier session: landing, guest lobby, deck select, deck builder, "Make Me A Deck", a public replay, and a two-browser game between two guest sessions (`A` and `B` in filenames) matched through Unranked Quickjoin "Mystery Deck Duel" (Jinbe vs Sugar), played through rock-paper-scissors, mulligan, a T1 character play, T2 DON!! attach and attack, a counter event, taking a Life card, and a Trigger reveal. Lobby chat and replay screenshots contain other players' handles and, in the replay, a real player's photo avatar; those are not reproduced here.

### Flow from landing to first attack

1. Landing (`dv-01-landing.png`, `dv-02-landing-5s.png`): a full-bleed animated sky-and-sea scene, sound icon bottom-left, three pill buttons (Meta & Top Decks, What is DuelVoyager?, Rules). For the first several seconds there is nothing to click that starts a game.
2. Around 10 s (`dv-02-landing-10s.png`, `dv-02-landing-20s.png`) a login card fades in over the logo: username/password, Play, Forgot password?, Create account, and below the fold of attention a "Continue as Guest" button at the bottom of the screen.
3. Guest lobby (`dv-03-guest-lobby.png`): three columns. Left: big Play tile, Build/Edit Deck ("Current: No deck selected"), Tournaments, Most Wanted, Custom Cards, Judge Test, Meta & Top Decks. Centre: Profile, Replays, Friends, Quests, Trade Doubloons, Alt Arts, Customize, Logout, Online Players count, Settings. Right: Lobby Chat / Tournaments / Update Logs tabs and a creator-video carousel. Roughly 20 equally weighted targets; nothing says "start here".
4. Play menu (`dv-04-play-menu.png`): Ranked (Join), Unranked Quickjoin (format dropdown defaulting to "Mystery Deck Duel": "Random legal deck generated for you"), Tables (Open/Spectate), Current Deck selector, Create Casual Table.
5. Guest wall: the deck selector is empty for guests (`dv-05-deck-select.png`, `dv-13-solo-deckpick.png` "No matching decks"); Create Casual Table opens "Create your own table … Create a free DuelVoyager account" (`dv-20-A-table-created.png`). The Solo Playtest dialog (`dv-07-solo-playtest.png`) needs two saved decks and shows a red "Invalid Deck" pill before you have done anything. **A guest's only path into a game is Mystery Deck Duel against a stranger** (here, our second browser). There is no AI opponent.
6. Rock-paper-scissors (`dv-23-A-game-start.png`, `dv-24-B-game-start.png`, `dv-25-A-after-rps.png`, `dv-26-B-after-rps.png`): a modal with three face-down "?" cards for the opponent and Rock/Paper/Scissors cards for you, both Leaders shown large on the right. Winner chooses first/second ("Opponent is selecting whether to go 1st or 2nd…").
7. Mulligan (`dv-27-A-mulligan.png`, `dv-28-B-mulligan.png`): a small centred dialog, "Mulligan? You're Going First.", primary "Keep Hand", secondary "Mulligan". The hand is visible beneath it. Good: the dialog states turn order in the same sentence.
8. Turn 1 (`dv-30-A-board-T1.png`): the DON!! phase auto-adds one DON!!. Playing a Character: hovering a hand card opens a vertical action menu above it (Reveal / To Life / To Deck / Trash / Play or Activate) (`dv-32-A-hover-hand.png`, `dv-33-A-click-hand.png`, `dv-38a-A-menu-play-cost.png`); alternatively drag the card onto the field (`dv-35-A-dragging.png`, `dv-36-A-after-drop.png`, `dv-38-A-played-character.png`). The DON!! is not rested automatically when you pay; the player rests DON!! manually (see below).
9. End turn via the red "skip" icon in the phase rail (`dv-41-A-ended-turn.png`); the opponent gets "Pass turn" in chat (`dv-43-B-turn2-main.png`).
10. First attack, turn 2 (`dv-46-B-give-don.png` → `dv-48-B-attack-targeting.png` → `dv-49-B-attack-declared.png`): click your Leader, choose Attack from its menu, valid-looking targets get a red outline, click a target, a large orange arrow is drawn from attacker to target and an automatic chat line reads "Attack with [Sugar (Leader)] into [Jinbe (Leader)]".

### Board layout

`dv-30-A-board-T1.png`, `dv-43-B-turn2-main.png`, `dv-15-replay-step60.png`.

- 1280×720, landscape. The playmat occupies roughly the central 56% of the width (x≈270–995). Left 20%: a large card-preview panel (art plus a big-type rules text block) that shows whatever was last hovered. Right 22%: a vertical phase/action icon rail, chat/log panel, and both players' avatars.
- Each half: Life as a vertical fanned stack at the far left; Character row (five slots) nearest the centre line; a grey DON!! cost area with a numeric count and tiny "A"/"R" (active/rested) toggles and +/− buttons; Leader to the right of the DON!! area; Stage slot to the right of the Leader; Deck and Trash stacked at the far right. Hand is a fanned row at the bottom edge; opponent's hand is card backs at the top edge, partly off screen.
- The opponent's side is mirrored, so the opponent's Leader sits top-left-of-centre and yours bottom-right-of-centre: the two Leaders are diagonally opposite, which makes the attack arrow long and diagonal for the most common attack in the game.
- Card size on the field is about 72×100 px at 1280×720. Power is printed only as the card's own small number; attached DON!! show as an "x1" badge and a DON!! card tucked under the Leader with a "Your Turn +1000" caption at ~7 px (`dv-47-B-don-active-choice.png`). **There is no live, large current-power number anywhere on the board.**
- Turn counter "T1"/"T2" sits above the phase rail; there is no named phase label, only icons (refresh, draw, DON!!, a "?" hand icon, a red skip icon, an "END" icon).

### How attacks, blocks and counters are performed

- **Attack:** click attacker → per-card menu (Active/Rested toggle, Rest, Attack, Declare; with DON!! attached also Detach DON!!, Give DON!!, DON!! −1) → Attack → click target (`dv-46`, `dv-47`, `dv-48`, `dv-49`). Targets are outlined in red. In `dv-48` the opponent's Shirahoshi is outlined although it was played the previous turn and appears to be **active**; under CR only rested Characters can be attacked, so either the highlight is "everything on the other side" or legality is not enforced. Either way the highlight does not teach the rule.
- **Being attacked (`dv-50-A-being-attacked.png`):** the defender sees the arrow and the attack line in the log. There is **no battle panel**: no attacker power vs defender power, no "you need +N", no prompt to choose Blocker → Counter → done. The defender must know the battle steps.
- **Counter:** hover a hand card, choose "Activate" from the same Reveal/To Life/To Deck/Trash menu (`dv-51-A-defender-hand-menu.png`, `dv-52-A-counter-event-menu.png`, `dv-53-A-activated-counter.png`). The event goes to the trash; its +3000 is not applied to any number on screen that I can find in `dv-53`/`dv-55`. Character [Counter] values are not surfaced as a "counter" action at all; they are applied by agreement or by trashing.
- **Blocker:** no dedicated affordance observed; you would rest your Blocker and tell your opponent in chat.
- **Damage and Trigger:** the defender clicks their Life stack → View / View All / To Deck / Trash / Face Up / Take (`dv-57-A-life-menu.png`); "Take" moves the top card toward hand and shows a mini-menu Undo / Trigger / Hand (`dv-58-A-took-life.png`); the revealed Vagabond Drill shows in the preview panel (`dv-60-A-trigger.png`), the attacker sees it (`dv-61-B-sees-trigger.png`). The defender decides whether to Trigger and resolves it by hand.
- In-game help (`dv-56-A-game-help.png`) states the model plainly: "DuelVoyager is a manual simulator… you will be performing all of the actions of the game, just as you would with physical cards… The only automatic operations are gaining DON!!, drawing a card, and setting your cards as Active… To use your effects, communicate with your opponent… Typing a quick message in the chat after Declaring or Activating a card is an efficient way to communicate."

### How DON!! is attached

Click the DON!! area to rest/activate cards via +/− and A/R (`dv-44-B-click-don.png`); click the Leader or Character → "Give DON!!" (`dv-46`, `dv-47`). An "x1" badge appears on the card and the log records "attached 1 active DON!! to [Sugar (Leader)]" (`dv-61`). The count "2" in the DON!! area does not visibly distinguish active from rested at a glance; the A/R letters are the only cue and are ~10 px.

### What is confusing

1. The landing hides the guest path for ~10 s behind an animation, then places it far below the login card (`dv-02-*`).
2. Lobby has ~20 peer-weighted buttons and live chat with unmoderated content as the most prominent element (`dv-03`).
3. Guests cannot pick a deck, cannot play an AI, and cannot solo-test; the only way in is a random deck against a stranger. For a learner this is the worst possible first game.
4. It is a manual sim. Every per-card menu offers illegal moves (a hand card can go "To Life" or "To Deck" at any time, `dv-33`). Nothing stops or explains a rules error; correctness depends on two humans agreeing in chat.
5. No live power numbers, no battle maths, no phase names; the phase rail is unlabeled icons (`dv-30`).
6. Leaders diagonal to each other; the attack arrow crosses the whole board and covers cards (`dv-49`, `dv-50`).
7. The log is in a toggleable drawer that shares space with chat; in these captures the defender's log (`dv-50`–`dv-58`) stops at the opponent's turn start and never shows the attack, while the attacker's log does (`dv-61`). The defender's best source of truth is the chat line.
8. The same colour-coded button vocabulary (yellow "To Life", red "Trash", green "Play") means different things in different menus (Life menu "Take" is gold, `dv-57`), and colour carries meaning alone.
9. Heavy themed chrome (scroll-parchment modals, beach-and-coral background) competes with card art; card art is watermarked "SAMPLE".

### What is delightful

1. Card preview panel: hover any card and a large, legible art + rules text panel appears at left (`dv-32`, `dv-50`). Big type, keyword chips. This is the single best pattern in the product.
2. Attack arrow plus an auto-generated, linkable chat line ("Attack with [Sugar (Leader)] into [Jinbe (Leader)]") makes intent unambiguous between humans (`dv-49`).
3. Replay viewer (`dv-14-replay-start.png`, `dv-15-replay-step*.png`): Back / Play / Forward, a scrubber, game clock vs duration, 0.5×–8× speed, and "Swap Perspective". Shareable replay URLs are posted in lobby chat, so the community uses replays to ask for advice ("wasted so much don… looking for advice", `dv-03`). That demand is exactly the job our Game Review does automatically.
4. "Make Me A Deck" (`dv-10`, `dv-11`, `dv-12`): pick a Leader from a carousel, get a legal 50-card list in one click. Fast way to have something to play.
5. Mulligan dialog names the turn order in the same sentence (`dv-27`).
6. Per-action log with timestamps and card links (`dv-40-A-logs.png`, `dv-61`).

### Load time

From the earlier session's timed landing captures: at 5 s the animated landing is up but there is no actionable control except three info pills (`dv-02-landing-5s.png`); by 10 s the login/guest controls are present (`dv-02-landing-10s.png`). Navigation to a first interactive board additionally requires guest sign-in, the lobby, Play, quickjoin matchmaking against another human, and RPS: not meaningfully measurable for a solo learner because it depends on another person being in the queue. The earlier session did not record a timestamp for "first board", so no number is given here.

### Takeaways for OPTCG Sim

Steal the hover preview panel, the attack arrow with a plain-language log line, and the replay scrubber with perspective swap and speed. Reject the manual-sim model, icon-only phase rail, illegal options in card menus, missing power arithmetic, and the guest wall in front of solo play.

---
