# Usability plan

**As of:** 2026-10-28 (Phase 4, revision 2: review-1 fixes)
**Answers:** `docs/plan-review-1.md` UX-2 (no testing with real people; partly accepted) and UX-8 (SeaKing never observed; partly accepted); `docs/PLAN.md` §3 and rows 6, 14, 18, 21.
**Companions:** `docs/design/accessibility.md` (the screen-reader passes are there, not here), `flows.md`, `learning-ui.md`, `docs/content/curriculum.md`.

## 1. Purpose and constraints

Playwright proves that flows work. It does not show whether a person understands the board, trusts the coach, or learns from the review. This plan defines the sessions that test those things.

Constraints, all from PROMPT.md and PLAN §3:
- **Participants:** the owner, plus anyone the owner chooses to invite. The project cannot recruit, and no session depends on anyone but the owner.
- **No analytics.** Nothing is sent anywhere. Every measure comes from a facilitator's notes, the participant's own words, and local logs that the participant exports by hand.
- **Owner time never blocks the autonomous run** (CLAUDE.md, PLAN risk 8). A session that has not happened by its checkpoint is recorded as "not run" in STATUS.md, and the design claims it would have tested stay marked as unverified.

**A known limit, stated up front.** The owner knows the rules and is a UX director. He cannot be the "new visitor" in PROMPT.md's first Done-when line. His sessions test reading, flow, trust and teaching quality; they do not prove that a beginner finishes the tutorial in 20 minutes. §2.3 says how that gap is handled.

## 2. Participants and roles

### 2.1 Roles

| Role | Who | Does |
| --- | --- | --- |
| Participant | The owner (P0), or an invitee (P1, P2, …) | Does the tasks and thinks aloud |
| Facilitator | An invitee's session: the owner. The owner's own session: self-run from task cards (§3.2) | Reads the tasks, stays neutral, takes notes |
| Analyst | The agent | Reads the notes and exported logs, rates severity, writes the session report, proposes fixes |

### 2.2 Invitees (optional)

The owner decides whether to invite anyone. The most useful profiles, in order:
1. **A true beginner** to OPTCG (has played other card games, or none). This is the only way to test the tutorial against PROMPT.md's "new visitor".
2. **A player who knows the rules** but has not seen this product, for the slice and M10 sessions.
3. **A keyboard-only or screen-reader user**, for M10 (`accessibility.md` risk R10).

**Consent script** (read aloud, before any recording): "This is a test of the app, not of you. Think aloud as you go. I won't help unless you're completely stuck. I'd like to record the screen and audio on this computer only; nothing leaves it, and I'll delete the recording after I've written my notes. You can stop at any time. OK?"

**Privacy.** Session reports name participants only as P0, P1 and so on, with a one-line profile ("plays weekly, knows the rules"). Recordings and exported logs stay on the owner's machine and are never committed. A recording is deleted once its notes are written. Only the anonymised report and the timing numbers enter the repo.

### 2.3 The tutorial and the "new visitor" gap

- If a beginner is available for S2 (M7), they take the tutorial, and that measures the "under 20 minutes" target.
- If none is available, the owner takes it as an **expert proxy** (§7.4). The result is labelled "expert proxy; beginner unverified", and STATUS.md carries that label next to the Done-when line until a beginner session happens.
- The owner is asked once at S0 whether a beginner can be invited for S2. The answer goes in `docs/OPEN-QUESTIONS.md`.

## 3. Common protocol

### 3.1 Before each session

- Build: the commit named in the session's section, served locally (`npm run build && npx vite preview`) or from the deployed URL.
- A fresh browser profile, so settings and progress start clean. Exception: S3 includes one task that resumes saved progress.
- Settings at defaults, except where a task says otherwise.
- Scenarios: tasks that need a specific position start from the named `ScenarioSpec` (ARCHITECTURE §2.9), so every participant sees the same board.
- Recording: macOS screen recording with audio (Cmd+Shift+5), local only.
- Printed or second-screen **task cards**, one task per card. The participant reads each card aloud.
- A stopwatch, for anything the app does not log itself.

### 3.2 Think-aloud

**Instructions to the participant** (read aloud): "Please say what you're looking at, what you're trying to do, and what you expect to happen, as you go. There are no wrong answers. If you go quiet, I'll just say 'keep talking'."

**Facilitator rules:**
- Concurrent think-aloud. Allowed prompts: "Keep talking." "What are you looking for?" "What do you expect will happen?" "What just happened?"
- No hints, no leading questions, and no explaining the UI.
- **Assists** (counted as errors, §4): give one only if the participant has been stuck for 3 minutes or asks to give up. Assist level 1 is a pointer to the region ("Look at the bottom of the screen"); level 2 names the control.
- Note the time and the participant's words at every hesitation of more than 10 seconds, every wrong click, and every "huh".

**Self-run variant (owner alone).** The owner reads each task card, starts the screen recording, and thinks aloud into it. He stops a task when the success criterion is met or he would have asked for help, and writes the task's SEQ score and a one-line note. He does not look at the success criteria before the task: they are on the back of the card. The agent later reviews the notes and the exported logs.

### 3.3 After each task and at the end

- **After each task:** the Single Ease Question (SEQ): "Overall, how easy or difficult was this task?" 1 (very difficult) to 7 (very easy).
- **Teach-back:** the questions listed with each task. They are asked aloud right after the task, before any debrief, and the answer is noted verbatim. The participant may not look at the screen while answering, except where the question points at the board.
- **End of S1 and S3:** the System Usability Scale (SUS, ten items). That gives two comparable points across the build.
- **Debrief** (5 minutes): "What was the most confusing moment?" "What would you change first?" "Would you use this to practise? Why or why not?"

## 4. Measures

| Measure | Definition | Source |
| --- | --- | --- |
| **Completion** | **Success:** the criterion was met with no assist. **Partial:** met after a level-1 assist, or met with a wrong intermediate result that the participant noticed and fixed. **Fail:** a level-2 assist, abandoned, or a wrong final result. | Facilitator notes |
| **Time on task** | From reading the card to the criterion being met. Recorded, never limited. | App log where one exists (tutorial §7); otherwise the stopwatch or the recording |
| **Errors** | Counted by type: **wrong action** (a move the participant then rewound, or said was not what they meant); **dead end** (opened a menu or panel and left it without acting, because it was not what they wanted); **blocked attempt** (tried an action the engine did not offer and saw a `whyNot` reason); **misreading** (a stated belief about the board that was false); **assist** (§3.2). | Notes, rewind log, `whyNot` count in the timing log |
| **Teach-back correctness** | Each answer scored **2** (correct answer and correct reason), **1** (correct answer with a vague or partly wrong reason, or correct reason with an arithmetic slip), **0** (wrong). A rubric for every question is in §6. | Facilitator notes, scored by the analyst |
| **SEQ** | Mean per task across participants | Cards |
| **SUS** | Standard scoring (0–100) | Questionnaire |
| **Severity** | Each finding is rated 0–4 on Nielsen's scale (0 not a problem, 1 cosmetic, 2 minor, 3 major, 4 catastrophe), the same scale as the Phase 4 review gate | Analyst, reviewed by the owner |

**Targets.** These are indicators for the analyst, not gates on their own; the gate rules are in §8.
- Task success ≥ 80% per session.
- Teach-back mean ≥ 1.5 of 2 per question.
- SEQ ≥ 5.5 for core play tasks.
- SUS ≥ 75 at S3.

## 5. Sessions

### Schedule

| ID | When | Build | Participants | Length | Feeds |
| --- | --- | --- | --- | --- | --- |
| **H** | Before S0; requested before the Phase 4 gate (PLAN row 6) | SeaKing and the Bandai tutorial, by hand (§9) | Owner | 90 min | Phase 4 design assumptions; `competitive-teardown.md` gaps |
| **S0** | Phase 4, after the wireframes and before the UX-director review closes | HTML wireframes in `docs/design/wireframes/` | Owner (plus an invitee if offered) | 60 min | `review-1.md` and the Phase 4 gate |
| **S1** | Slice checkpoint (PLAN row 14), after L | Real game: Rocks vs Kaido; Rookie and Pirate; the learning slice | Owner, plus a rules-knowing invitee if possible | 90 min | Fixes before M4b; ADR 0012's checkpoint |
| **S2** | M7 (PLAN row 18) | Tutorial plus the full coach | **A beginner if possible**; owner for coach tasks | 75 min | M7 done criterion |
| **S3** | M10 (PLAN row 21) | Release candidate | Owner, plus any invitee | 90 min | M10 done; release |

H and S0 can run on the same day: H first, then a break, then S0. The owner's SeaKing impressions then sit beside our wireframes while they are fresh.

### 5.1 S0: wireframes

**Goals:**
1. Does the board read at a glance (principle 1)?
2. Are the decision prompts and the battle panel understood without explanation?
3. Is the keyboard model learnable from the shortcut sheet?
4. Do the coach panel and the review timeline make sense as places?
5. Owner sign-off on the card-face study under the SAMPLE watermark (UX-10), and review of the example explanation copy (ARCHITECTURE §4.5). These are review tasks, not usability tasks, and are timed separately.

The wireframes are static HTML with click-through. Tasks only use paths the wireframes implement, and each wireframe screen named below must exist before S0.

| # | Task (card text) | Start | Success criterion |
| --- | --- | --- | --- |
| 0.1 | **Five-second test.** "Look at this board for five seconds." The board is then hidden. Ask: whose turn is it, which phase, how many active DON!! each side has, the power of your strongest Character, and the opponent's Life. | Main-phase board screenshot | At least 4 of 5 correct |
| 0.2 | "Play the Character that costs 3." | Board, your Main Phase | Reaches the played state via the action menu or drag, with no dead end |
| 0.3 | "Give 2 DON!! to Zoro, then attack the opponent's Leader." | Board | Reaches the attack confirm and correctly reads its numbers aloud |
| 0.4 | "You're being attacked. Decide what to do and do it." | Defend wireframe: Kaido 7000 attacks your Leader 5000; hand holds a +2000 and a +1000 counter; one Blocker at 4000 | Commits a defence the participant can justify; the choice itself is not graded |
| 0.5 | "Do task 0.3 again using only the keyboard. You may open the shortcut sheet." | Board, focus at the page top. The wireframes implement the `accessibility.md` §3.1 tab order (one stop per zone, roving arrows, the "Skip to decision" link) and the keys `P`, `G`, `A`, `+`, `E` and `U` (`wireframes/wf.js`), so this task is runnable | Reaches the attack confirm by keyboard; notes how the sheet was found; the Tab count to End turn is recorded |
| 0.6 | "Ask the app for a hint, then undo your last move." | Board after a move | Finds Hint and Rewind without an assist |
| 0.7 | "This game is over. Find the turn where you could have won, and explain how." | Review wireframe (Overview), planted missed lethal | Opens the flag, goes to Study, and restates the line in their own words |
| 0.8 | **Keyword recognition** (UX-R16). Show `03-main` at 1280 for five seconds, then point at three keyword glyphs on the board (⛨, »C, ⊘) and ask what each means. Repeat at 1920, where the board shows short text chips ("Blocker", "Rush: C"). | Board screenshots at both sizes | Records how many of the three glyphs are named correctly at 1280 without the legend, and whether the participant finds the legend (shortcut sheet, Rules page). Fewer than 2 of 3 is a finding against the compact glyph set |

**Teach-back:**
- After 0.3: Q2 ("Why does Zoro show 7000 now, and what will it show on your opponent's turn?").
- After 0.4: Q3 ("How much Counter did you need, and why?").
- After 0.7: **Q1, "How many hits did you need, and why?"**

### 5.2 S1: slice checkpoint (real game)

**Goals:**
1. A cold start reaches a first attack with no help.
2. A complete game against Pirate is playable and understandable.
3. The battle panel and DON!! overlay change decisions.
4. The tiered lethal detector teaches counting, rather than just answering.
5. The missed-lethal review and "Practice this" teach something that transfers to the puzzle.
6. Keyboard play holds up for a whole turn.

| # | Task | Start | Success criterion |
| --- | --- | --- | --- |
| 1.1 | "Start a game against the computer and make your first attack." | The app's landing page, fresh profile | First attack confirmed with no assist. Time to first attack recorded |
| 1.2 | "Play a full game with Rocks against Kaido on the Pirate level. Think aloud the whole time." | Setup screen | The game reaches an end, win or lose, with no assist. Rewinds and blocked attempts counted |
| 1.3 | "You're being attacked. Use whatever the screen shows to decide." | Scenario `ub-defend-1`: the right answer depends on reading the counters needed in the battle panel | Commits, and teach-back Q3 scores 2 |
| 1.4 | "Do you have lethal? Use the lethal tool however you like." | Scenario `ub-lethal-1`: lethal exists, and needs a DON!! split | Participant states the number of hits **before** opening the full line (tier 2) and then plays it |
| 1.5 | "Open the review of this finished game. Find the missed win, then practise it." | The planted missed-lethal record | Opens the flag, restores it, starts "Practice this", and solves the puzzle |
| 1.6 | "Play one complete turn using only the keyboard." | Scenario `ub-keyboard-1` | The turn ends with at least one play, one DON!! give and one attack, and no pointer use |

**Teach-back:**
- After 1.2: Q5 (first-turn restrictions), Q7 (where given DON!! go at Refresh).
- After 1.3: Q3.
- After 1.4: **Q1**, Q9 (why the DON!! split mattered).
- After 1.5: Q10 ("What will you look for next time?", scored against the flag's `nextTime`).

### 5.3 S2: M7 (tutorial and coach)

**Goals:**
1. The tutorial is finished in under 20 minutes (§7).
2. After it, a complete game vs the AI with no instructions from anyone (PROMPT.md Done when).
3. Hint, Why and the blunder warning are understood and trusted.
4. The coach never interrupts unprompted (owner's observation, alongside the automated test).

| # | Task | Start | Success criterion |
| --- | --- | --- | --- |
| 2.1 | "Learn to play using the app." (Beginner; or owner as expert proxy) | First launch; choose the beginner path | Tutorial completed. Timing log exported (§7) |
| 2.2 | "Now play a game against the computer." No help from anyone, including the facilitator, from here on | After the tutorial | The game reaches an end with no assist |
| 2.3 | "Ask for a hint, and decide whether you agree with it." | Scenario `ub-hint-1` | Participant restates the hint's reason; teach-back Q11 |
| 2.4 | "Find out why the computer just did that." | Scenario `ub-why-1`, right after an AI move | Uses Why, and restates the explanation in their own words |
| 2.5 | Blunder warning on: "Make your move." | Scenario `ub-blunder-1`, where the obvious move is a planted blunder | Notices the warning and can say what the alternative was. The final choice is not graded |

**Teach-back** after 2.1 for a beginner: the full tutorial battery, **Q1 to Q8** (each maps to a tutorial step, §6). For the owner as proxy, ask only Q1 and Q3, as a sanity check.

### 5.4 S3: M10 (release candidate)

**Goals:**
1. The whole product end to end on the deployed build.
2. Learning-layer breadth (drills, meta explorer, progress).
3. Settings and accessibility features work for a real person.
4. SUS comparable with S1.

| # | Task | Success criterion |
| --- | --- | --- |
| 3.1 | "You know the rules. Get into a game as fast as you can." (First-launch "I know the rules" branch, UX-12) | In a game in under 60 s with no assist |
| 3.2 | "Import this tournament list and play it against the AI." (A list from `meta-lists.json`, as text) | Imported with no loss, loaded, game started |
| 3.3 | "Find out how Kaido's deck wants to win, then play against it." (Meta explorer) | Restates the game plan; uses "Play against this deck" |
| 3.4 | "Do one item of each drill." | Four items attempted; the participant can say what each drill trains |
| 3.5 | "What should you work on next, according to the app?" (Progress, after the session's games) | Finds the recommendation and says why it was given |
| 3.6 | "Turn on reduced motion and slow the opponent down; play one opponent turn." | Both settings found and in effect |
| 3.7 | "Play a full game using only the keyboard." (Can be split across two sittings) | The game ends with no pointer use |
| 3.8 | "Close the browser, reopen the app offline, and continue." (Service worker) | The app loads, and progress is there |

**Teach-back:** Q12 after 3.3, Q10 after any review the participant opens.

## 6. Teach-back question bank

The answers are checked against `docs/research/rules-digest.md` (CR v1.2.1) and `docs/content/curriculum.md`. Rubric: 2, 1, 0 as defined in §4.

| # | Question | Correct answer (2 points) | 1 point if | Source | Tutorial step |
| --- | --- | --- | --- | --- | --- |
| **Q1** | **"How many hits did you need, and why?"** | Opponent's Life + 1 hits that connect. Each hit takes one Life, and the game is won only by a hit that lands when they are at 0 Life. A [Double Attack] takes 2 Life but does not win against 1 Life. | The number is right but the reason is "to get them to zero", missing the final hit; or the reason is right with a counting slip | Digest items 94, 95 (CR 7-1-4-1-1-1, 10-1-2-1); lesson L15 `lethal-math` | 8 Winning |
| Q2 | "Why does Zoro show 7000 now, and what will it show on your opponent's turn?" | Each given DON!! adds +1000 only during your own turn, so it shows base power on the opponent's turn. | Says +1000 per DON!! but not the turn restriction | Item 82 (CR 6-5-5-2); L03 | 3 DON!! and power |
| Q3 | "How much Counter did you need, and why?" (attacker 7000, your Leader 5000) | 3000, because ties go to the attacker (attacker ≥ defender wins). | Says 2000 with "to match it" (the tie rule missed) and corrects it when asked "what happens on a tie?" | Item 94 (CR 7-1-4-1); L04, L05 | 5 Being attacked |
| Q4 | "Which of their cards could you have attacked, and which not?" | The Leader, and only **rested** Characters. Active Characters cannot be attacked. | Names the Leader and "Characters" without the rested condition | Item 88 (CR 7-1-1-2); L04 | 4 Attacking |
| Q5 | "What couldn't you do on your first turn, and why?" | Neither player can battle on their own first turn. The player going first also does not draw and places only 1 DON!!. | Names one of the restrictions | Items 68, 69, 71 (CR 6-3-1, 6-4-1, 6-5-6-1); L02 | 2 First turn |
| Q6 | "What happened when the Life card with a Trigger was hit?" | You may reveal it and activate the [Trigger] instead of adding it to hand; if you decline, it goes to hand. ([Banish] stops this.) | Knows the Trigger happens but not that it replaces adding the card to hand | Items 101, 96 (CR 10-1-5-1, 10-1-3-1); L06 | 6 Triggers |
| Q7 | "Where did the DON!! you gave go at the start of your next turn?" | Back to the cost area rested, and then everything is set active in the Refresh Phase. | Says "back to the cost area" without the order | Item 67 (CR 6-2-3, 6-2-4); L03 | 3 DON!! and power |
| Q8 | "How many Blockers can you use against one attack?" | One. | n/a | Item 91 (CR 7-1-2-1); L05 | 5 Being attacked |
| Q9 | (After a lethal line that needed a DON!! split) "Why did the DON!! go where they went?" | Each attacker needed enough power to get through the defender's possible counters; the split makes every hit cost them the most. | Says "to make them bigger" without the counters | Strategy concept `lethal-math`, `don-efficiency`; L15, L16 | n/a |
| Q10 | "What will you look for next time?" (after a review flag) | Restates the flag's `nextTime` rule of thumb in their own words. | Restates the flag's claim but not the rule of thumb | `Explanation.nextTime` (ARCHITECTURE §4.5) | n/a |
| Q11 | "Why does the hint want that move?" | Restates the hint's reason with at least one piece of its evidence (a number from the board). | Restates the move but not why | `Explanation.claim`, `evidence` | n/a |
| Q12 | "How does this deck want to win?" | Matches the archetype guide's "What the deck is trying to do" in substance. | Partly matches | `docs/content/archetypes/<leader-id>.md`; L19 | n/a |

Q1 to Q8 are the **tutorial battery**. Each tutorial step has at least one question, except step 1 (zones), which the five-second test (0.1) and lesson L01 cover; step 7 (leader abilities) is checked by asking "What does your Leader do?" and scoring against the leader's card text.

## 7. Tutorial measurement

### 7.1 The local timing log

ARCHITECTURE §5 already lists "a per-step tutorial timing log" in IndexedDB. This section specifies it.

**What is recorded**, one record per tutorial run:

```ts
type TutorialTimingLog = {
  schema: 'tutorial-timing/1';
  runId: string;              // random, local; not linked to anything
  appVersion: string; engineVersion: string; tutorialVersion: string;
  startedAt: string;          // one ISO timestamp, local clock
  settings: { reducedMotion: boolean; aiPace: string; singleKeyShortcuts: boolean; cardAnnouncements: string };
  steps: Array<{
    stepId: string;           // stable IDs from learning-ui.md, e.g. 't3-don-and-power'
    enteredMs: number;        // performance.now() offset from run start
    completedMs: number | null;
    activeMs: number;         // wall time in the step minus hidden-tab time and exited time
    hiddenMs: number;         // document.visibilityState === 'hidden'
    idleMs: number;           // spans of more than 120 s with no input (reported, not subtracted)
    blockedAttempts: number;  // whyNot reasons shown
    hintsOpened: number;
    explainOpened: number;    // "Show me" or a glossary link
    rewinds: number;
    inputs: { pointer: number; keyboard: number };
    exits: number;            // exit and resume during this step
  }>;
  completedMs: number | null;
  totalActiveMs: number;
  totalWallMs: number;
};
```

**What is never recorded:** names, free text, card choices outside the tutorial, IP addresses or device identifiers. There is nothing to identify a person.

**Export.** Settings → Progress → "Tutorial timing" lists runs with their totals. Each run has "Export JSON", "Export CSV" (one row per step) and "Delete". The log is also in the full progress export (ARCHITECTURE §5). The participant sends the file to the owner, or the owner copies it from his own machine, by hand.

**No network.**
- A Playwright test records every request during a full tutorial run and fails on any request to an origin other than the app's own and the configured art sources.
- A lint rule bans `navigator.sendBeacon`, and bans `fetch` outside `app/src/art/` and the service worker.

### 7.2 The "under 20 minutes" target

- **The measure:** `totalActiveMs` from the start of step 1 to the completion of the final step. This is wall time minus time with the tab hidden and time exited between sessions. Idle time over 120 s is reported beside it, not subtracted. The facilitator notes the reason for any idle span, and a span caused by an interruption (not by confusion) can be excluded, with the reason written in the report.
- **Pass:** `totalActiveMs` < 20:00 for a beginner (or "expert proxy" for the owner, §2.3), **and** the tutorial teach-back battery averages ≥ 1.5. A fast tutorial that teaches nothing does not pass.
- **Per-step budget.** It gives the analyst a way to find which step is slow. The step content and IDs belong to `learning-ui.md`, and this table is updated to match it.

| Step (PROMPT.md order) | Budget |
| --- | --- |
| 1 Zones and what each is for | 2:00 |
| 2 Your first turn: draw, DON!!, play a Character | 3:00 |
| 3 Attaching DON!! and reading power | 2:30 |
| 4 Attacking the Leader | 2:30 |
| 5 Being attacked: Blocker, Counter, or take it | 3:30 |
| 6 Triggers | 2:00 |
| 7 Leader abilities | 2:00 |
| 8 Winning | 2:00 |
| **Total** | **19:30** |

A step over budget by more than 50%, or with three or more blocked attempts, is a finding of at least severity 2.

### 7.3 Comparison with Bandai's official tutorial

Bandai's Teaching App ("Tutorial Mode") is the comparison point (PLAN §3). Agents may not drive it, because its terms prohibit unapproved external tools (`competitive-teardown.md` §6), so the owner plays it by hand during H (§9).

The comparison has four parts:

| Dimension | How measured | For us |
| --- | --- | --- |
| Time | The owner times each Bandai lesson with a stopwatch | Our log, step by step |
| Coverage | A concept matrix (below): which concepts each tutorial teaches, and in what order | Our 8 steps |
| Accuracy | Notes on any simplification that conflicts with the CR. The official Play Guide simplifies deck-out and the 0-Life win (`competitive-teardown.md` §6) | Our step text is checked against the digest |
| Interaction | Is the learner constrained to the taught action? Can they exit and resume? Is there a timer? Is there feedback on a wrong attempt? | Our design |

**Concept matrix** (tick and order number for each tutorial): setup and the playmat zones; mulligan; Refresh; Draw (including the first-player rule); DON!! Phase (1 on the first turn); playing a Character; giving DON!! and the turn-only bonus; attack targets (Leader or rested Character); first-turn battle restriction; Blocker; Character Counter; Event Counter; tie goes to the attacker; damage and Life to hand; [Trigger]; K.O.; leader ability; Rush; Double Attack; the win condition (a hit at 0 Life); deck-out.

**Caveats** written into every comparison report:
- The owner is an expert, so his Bandai time measures pacing and content, not learning.
- Order effects: anyone who does one tutorial learns from it, so a beginner takes **only ours**. The Bandai comparison is the owner's content-and-pacing review, not a head-to-head with the same person.

### 7.4 Expert-proxy run

When the owner takes the tutorial as a proxy, he plays it as written, without skipping, at his natural pace, and thinks aloud about where a beginner would stumble. The analyst reports his times per step beside the budget, labelled "expert proxy". A proxy time over budget is a strong signal; a proxy time under budget proves little.

## 8. Recording findings and feeding them back

**Session report.** The analyst writes `docs/design/usability/<session-id>.md` (for example `S1-slice.md`) within one working session of receiving the notes. It contains:
1. Header: date, build commit, participants (anonymised profiles), facilitator, deviations from this plan.
2. Results per task: completion, time, errors by type, SEQ.
3. Teach-back scores per question, with the verbatim answer for any score under 2.
4. Tutorial timing (S2): the table from §7.2 with actual times, and the exported log's file name (not the file).
5. **Findings table:**

| ID | Task | Observation (what happened) | Quote | Severity 0–4 | Principle / heuristic | Proposed fix | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1-07 | 1.3 | Read 7000 vs 7000 as "safe" | "Same power, so I'm fine" | 3 | Principle 1; Nielsen 2 (match the real world) | Battle panel states "tied: attacker wins ties" | Fixed in <commit> |

6. SUS (S1, S3).
7. What the session did **not** test, and which claims stay unverified.

**Feeding back.**
- **Severity 3–4 findings** block the next milestone's done criteria, exactly as a review finding does in the verification ritual. They are fixed, or explicitly deferred with a reason the owner accepts.
- **Severity 2** goes to the milestone backlog in STATUS.md. **Severity 1** goes to `docs/BACKLOG.md`.
- Any fix that changes a documented design gets a dated entry in `docs/DECISIONS.md` (context, decision, alternatives rejected), and the design document is updated in the same commit.
- **Contradicted assumptions** (from H or any session) also update `docs/OPEN-QUESTIONS.md`, and the design claim's "unobserved" mark is removed or changed to "contradicted".
- STATUS.md records each session as **run** (with a link to the report) or **not run** (with the claims left unverified).
- **Re-test.** Every severity 3–4 finding is re-tested in the next session with the same task, or with an added task if the next session's set does not cover it. The report says whether the fix held.

## 9. Owner hands-on: SeaKing and the Bandai tutorial (session H, 90 minutes)

**Why the owner, and only by hand.** SeaKing's robots.txt disallows Anthropic agents and reserves text-and-data-mining rights. Bandai's app terms prohibit unapproved external tools (`competitive-teardown.md` §2, §6). Our agents therefore have no first-hand view of the main baseline (UX-8). The owner plays both as a normal player.

**Rules for the session.**
- Play by hand in a normal browser. No automation, scrapers or extensions that read the page.
- Record **observations of the experience**: what is shown, where, when, and how it feels. Do **not** copy SeaKing's explanation text, review logic or wording into the repo; paraphrase. SeaKing's terms prohibit using its content to rebuild a competing engine.
- Screenshots are allowed for the owner's notes. Save them as `docs/research/teardown-shots/sk-NN-step.png` and `bt-NN-step.png`; that folder is gitignored, and the files are never committed.
- Write notes in the template below. Paste them into `docs/research/owner-hands-on.md` (a new file), or hand them to the agent in chat to file.

### 9.1 Kit

A desktop browser; a stopwatch; macOS screen recording (optional, local); this section printed or on a second screen; 90 uninterrupted minutes. For the Bandai tutorial: the browser version at app.onepiece-cardgame.com (it downloads about 111 MB and recommends a strong GPU), or the phone app.

### 9.2 Plan

| Minutes | Activity | Focus |
| --- | --- | --- |
| 0–5 | Setup | Start the stopwatch at the moment you type seaking.gg |
| 5–20 | **SeaKing: landing to first attack, in Learn mode** | Time to a clickable board; deck pick for both sides; first-player choice and mulligan presentation; are legal plays highlighted; how DON!! is given (drag, click, count stepper); what Learn mode keeps on screen |
| 20–35 | **SeaKing: Hint and Rewind** in the same game | Use Hint three times: in your Main Phase, when attacked, and before an attack. Does it give one move or a line? Does it give a reason? Use Rewind three times: within a turn, across a turn boundary, and after a draw or a Trigger. What is the step size? Can you rewind into a different random result? Try "Play both sides" if offered |
| 35–55 | **SeaKing: finish or concede, then Game Review** | How long until the review is ready; how a missed win is shown (board snapshot, line, explanation, grade); how it states certainty or hidden information; how you navigate between turns; can you replay from a moment; does it link to anything that teaches |
| 55–60 | **SeaKing: quick accessibility probe** | Tab through the board: is focus visible? Can you play a card or attack by keyboard? Is there an animation speed or reduced-motion setting? Is any battle maths shown as text? |
| 60–80 | **Bandai Teaching App: Tutorial Mode** | Time each lesson (lap times). Fill the concept matrix (§7.3). Note constraints, feedback on wrong attempts, text length per screen, anything inaccurate or confusing |
| 80–90 | **Synthesis** | The five things to copy in spirit, the five to avoid, and every "assumption check" answer below |

If time runs short, cut the accessibility probe first, then Rewind's third case. Never cut Game Review; it is the most important unobserved feature.

### 9.3 Observation template

Copy one block per feature.

```
## <Product> — <Feature> (Learn | Hint | Rewind | Game Review | Tutorial lesson N | Other)
Time spent: mm:ss            Screenshots: sk-NN … sk-NN
What I did (steps):
What it showed (where on screen, when, how long):
What it said (paraphrase, no verbatim copying):
Interaction (clicks or keys, confirms, can I undo?):
Speed / waiting (anything slow; any timer?):
What worked (and why):
What confused me (and why):
Accuracy concerns (vs. the rules as I know them):
Accessibility notes (focus, keyboard, contrast, motion, text size):
Compared with our design (board.md / flows.md / learning-ui.md section): same | better | worse | different — note:
Severity if we copied its problem (0–4):
```

### 9.4 Assumption checks

Our design rests on the competitor claims below, which are unobserved (`competitive-teardown.md` §2). For each one, the owner marks **confirmed**, **contradicted** or **could not tell**, with a one-line note.

| # | Assumption | Design that rests on it |
| --- | --- | --- |
| A1 | SeaKing's Hint gives a move, not a full line with a reason | Hints as whole lines with an `Explanation` (UX-3) |
| A2 | SeaKing's Rewind exists in Learn mode; its step size is unknown | Rewind by player move (`intentId`), deterministic RNG |
| A3 | SeaKing's Game Review grades with hindsight (full information) and has a "search incomplete" outcome | Certainty labels `any-hand` / `needed-hidden-info` / `search-incomplete` |
| A4 | SeaKing's review shows the missed line but does not teach how to see it next time | `nextTime`, the lesson link, "Practice this" |
| A5 | No live battle maths in SeaKing during attacks | Battle panel as an MVP feature (DECISIONS 2026-10-28) |
| A6 | SeaKing's AI turns are fast enough not to bore and slow enough to follow, or they are not | Pace control, ≤8 s turn target |
| A7 | SeaKing is not keyboard-playable | "Keyboard complete" as a differentiator |
| A8 | Bandai's tutorial takes roughly 10–15 minutes (`competitive-teardown.md` §6, estimated) | Our 20-minute target and the step budgets |
| A9 | Bandai's tutorial constrains the learner to the taught action | Our constrained steps |
| A10 | Bandai's tutorial is untimed | Our no-timer policy matches the official experience |

**How H feeds back.** The agent files the notes (§8 rules apply). Every **contradicted** assumption becomes a finding against the design document that relies on it, and is fixed or explicitly accepted before the Phase 4 gate if H happens in time. If H has not happened by the gate, the Phase 4 documents keep their "unobserved" marks, and the slice checkpoint (S1) revisits them (PLAN risk 8).

## 10. Proposed decisions and open questions

**UP-1. The owner's sessions are labelled "expert", and the beginner claim stays unverified until a beginner is tested.** *Context:* PROMPT.md's tutorial target is about a new visitor; the owner is an expert, and the project cannot recruit. *Decision:* §2.3 and §7.4. *Alternatives rejected:* treating the owner's time as the beginner result (overstates the claim); a Playwright "moderated run" as the measure (it measures runtime, not learning; UX-2); recruiting online (not allowed).

**UP-2. Tutorial time is measured as active time, with idle time reported but not subtracted.** *Context:* wall time includes interruptions; subtracting every idle span would hide real confusion. *Decision:* §7.2. *Alternatives rejected:* wall time (penalises a phone call); subtracting all idle time (rewards confusion that goes quiet).

**UP-3. Pass requires both speed and teach-back.** *Context:* a fast tutorial that teaches nothing would pass a time-only gate. *Decision:* under 20:00 active **and** a teach-back mean ≥ 1.5 (§7.2). *Alternatives rejected:* time only (PROMPT.md's literal wording, but it cannot show learning).

**Open questions for the owner (none blocking):**
1. Can you invite a beginner for S2? (Needed for an unqualified "under 20 minutes" claim.)
2. Can you invite a keyboard-only or screen-reader user for S3? (`accessibility.md` R10.)
3. When can session H happen? Ideally before the Phase 4 gate, and on the same day as S0.
