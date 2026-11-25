# S2 session kit: the tutorial and the coach (M7)

**As of:** 2026-11-25. **Protocol:** `docs/design/usability-plan.md` §3 (common protocol), §5.3 (S2), §6 (teach-back bank) and §7 (tutorial measurement).
**Who:** a beginner if you can invite one (an unqualified "under 20 minutes" claim needs one, `OPEN-QUESTIONS` and usability-plan §2.3); otherwise you, as the **expert proxy**, self-run from these task cards (§3.2 "Self-run variant"). Results from the proxy are labelled "expert proxy; beginner unverified" (§7.4). Run S1 first if you can.
**Time:** 75 minutes. **The agent's part:** the analyst, after the session. **VoiceOver:** not part of these 75 minutes. It stays your own listening pass (accessibility.md §11.2 and §11.5; `docs/design/a11y-passes/README.md`, "Listening pass by hand"); the agent never drives VoiceOver on your Mac.

## Plan

| Minutes | Activity |
| --- | --- |
| 0 to 5 | Prep (below), recording on, stopwatch ready |
| 5 to 30 | **Task 2.1**, the tutorial (the target is under 20 minutes of it), then the teach-back sheet (about 5 minutes) |
| 30 to 50 | **Task 2.2**, a whole game against the computer with no help |
| 50 to 56 | **Task 2.3**, the hint |
| 56 to 62 | **Task 2.4**, "Why?" |
| 62 to 69 | **Task 2.5**, the blunder warning |
| 69 to 75 | Debrief, then export the timing log |

Never stop a task for time. Record the time and carry on; trim a later task if the day runs out.

## Before you start

1. Build: `git pull && npm ci && npm run build && (cd app && npx vite preview --port 4173)`, then open http://localhost:4173/optcg-sim/. Or use the deployed site, https://chrisdevine00.github.io/optcg-sim/, once CI is green on `main`. Write the commit (`git rev-parse --short HEAD`, or the build's commit named for this session) at the top of your notes.
2. A **fresh browser profile** (or a private window), 1280 px wide or more. Settings at their defaults: do not open Settings before task 2.5. Do **not** close the window or clear site data until the timing log is exported: it lives in this browser's storage (`optcg.tutorial.timing.v1`) and a private window forgets it on close.
3. Screen recording with audio (Cmd+Shift+5), local only. Recordings never go in the repo. A stopwatch for anything the app does not log.
4. The task cards below, front only, printed or on a second screen. The success criteria are in "For the analyst" at the end. Don't read that section first.
5. Say the think-aloud instruction (§3.2): "Please say what you're looking at, what you're trying to do, and what you expect to happen, as you go." With an invitee, read the consent script (§2.2) first.

The base address below is the one you opened, for example `http://localhost:4173/optcg-sim/`.

## Task cards (front)

**2.1** First launch: open the base address.
> "Learn to play using the app."

(The home page asks one question. The beginner path is "I'm new: teach me". Start the stopwatch when the page opens: the app times the tutorial itself, and your watch is the cross-check.) When it is over, close nothing and do the teach-back sheet.

**2.2** After the tutorial. From here on **no help from anyone, including the facilitator**, and no reading of the docs.
> "Now play a game against the computer."

(The tutorial's last screen offers "Play your first full game". If you are skipping the tutorial, open `<base>play?preset=first`.)

**2.3** Open `<base>play?scenario=ub-hint-1&opp=pirate&aibudget=iterations&start=1`.
> "Ask for a hint, and decide whether you agree with it."

Teach-back: Q11 "Why does the hint want that move?"

**2.4** Open `<base>play?scenario=ub-why-1&opp=pirate&aibudget=iterations&start=1` and let the computer take its turn. When it is your turn:
> "Find out why the computer just did that."

Teach-back: "Why did it do that?"

**2.5** First open Settings (the "Settings" link at the top of any page), find the Coach section and switch **Blunder warning** on. Then open `<base>play?scenario=ub-blunder-1&opp=pirate&aibudget=iterations&start=1`.
> "Make your move."

Teach-back: "What did the warning say, and what was the other choice?" (The final choice is not graded.)

After each task: the SEQ, "Overall, how easy or difficult was this task?" 1 (very difficult) to 7 (very easy). No SUS at S2 (S1 and S3 have it). End with the 5-minute debrief (§3.3): "What was the most confusing moment?" "What would you change first?" "Would you use this to practise? Why or why not?"

## Teach-back sheet (front)

Ask aloud, right after task 2.1 and before any debrief. The participant does not look at the screen while answering. Write the answer verbatim. After each answer, no hint and no "are you sure".

For a **beginner**, all of these. For the **owner as proxy**, only Q1 and Q3 (a sanity check, §5.3).

| # | Question | Tutorial step |
| --- | --- | --- |
| Q5 | "What couldn't you do on your first turn, and why?" | `t2-first-turn` |
| Q2 | "Why did your Leader show 6000 after you gave it a DON!!, and what does it show on your opponent's turn?" | `t3-don-and-power` |
| Q7 | "Where does a DON!! you gave go at the start of your next turn?" | `t3-don-and-power` |
| Q4 | "Which of their cards could you attack, and which not?" | `t4-attack` |
| Q3 | "When their Leader attacked yours, how much Counter did you need, and why?" | `t5-defend` |
| Q8 | "How many Blockers can you use against one attack?" | `t5-defend` |
| Q6 | "What happened when the Life card with a Trigger was hit?" | `t6-trigger` |
| t7 | "What does your Leader do?" | `t7-leader` |
| Q1 | "How many hits did you need to win, and why?" | `t8-winning` |

Step `t1-zones` has no question (the five-second test and lesson L01 cover it). **Scoring** (analyst, from the keys at the back): 2 = the right answer with the right reason, 1 = the right answer with a vague or partly wrong reason (or the right reason with an arithmetic slip), 0 = wrong or "I don't know". A beginner passes the battery at a mean of 1.5 or more.

## Observation template

Copy one block per task. Keep it short; the recording has the rest.

```
## Task 2.N <name>                 Start hh:mm:ss   End hh:mm:ss   Time mm:ss
Success criterion met (yes / after assist 1 / after assist 2 / no):
Assists (level 1 = region, level 2 = the control), and what was asked:
Hesitations over 10 s (time, what I said):
Errors, by type: wrong action | dead end | blocked attempt ("Not yet ..." line) | misreading | assist
Did the coach open, speak, take focus or make a sound that I did not ask for? (yes / no; what, when)
Anything that felt held back or slow (2.5: did a commit lag?):
SEQ (1 to 7):            One-line note:
Teach-back, verbatim:
```

## Timing log: export it, keep it local

The tutorial times itself: per step the active time, hidden-tab time, idle spans over 120 s, blocked attempts, rewinds and exits. It records no names, no free text and nothing about who you are, and it sends nothing anywhere.

1. As soon as the tutorial is finished, the completion screen offers **Export JSON** and **Export CSV** for that run. Press both. (Or later: **Settings → Tutorial timing**, the run, **Export JSON** and **Export CSV**.) The files are `optcg-tutorial-timing-<runId>.json` and `.csv`, and land in Downloads.
2. Keep the files on this machine. **Never commit them**, and do not paste them into chat; the same goes for the recording.
3. Put the numbers, not the files, into the report: `totalActiveMs` (the "N min active" Settings shows is the same number), then per step `activeMs`, `blockedAttempts`, `rewinds`, `exits` and `idleMs` (they are in the CSV, one row per step), beside the budget table of usability-plan §7.2. Only numbers go into `docs/design/usability/S2-*.md`, with the file's name and nothing of its contents beyond them.
4. A run that you left and resumed is one run with exits counted on its step; a second start from "Start the tutorial again" is a second run. Report the run you want measured and say why.

Idle time (over 120 s) is reported beside the total, not taken off it. If an idle span was an interruption (a phone call), not confusion, write the reason down and the analyst can exclude it (§7.2).

## What to send back

Your notes file (per task: the time, the SEQ, your one-line note, every hesitation over 10 seconds with what you said, every moment the coach did something you had not asked for), the teach-back answers verbatim, the numbers from the timing log (above), the debrief, and whether a beginner could be invited. Not the recording, not the log files. The agent writes `docs/design/usability/S2-tutorial-coach.md` from them (§8 format) and turns every finding into a fix or an accepted, dated decision before M8.

Two owner checks ride on this session: read the tutorial's words as a beginner would (`OPEN-QUESTIONS` M7-V2: note any step that took more than one "Read again" or three blocked attempts), and with the warning on in 2.5, say whether any commit felt held back (M7-W5-1).

## What counts as passing M7

All three, from PLAN §2 and usability-plan §7.2 (UP-3: speed and teaching, never speed alone):

1. **The tutorial takes under 20 minutes**, read from the timing log: `totalActiveMs` under 20:00 for the completed run. For the owner as proxy the result is labelled "expert proxy; beginner unverified", and STATUS keeps that label beside the Done-when line until a beginner has been tested.
2. **The teach-back is answered.** Every question on the sheet is asked and scored; the battery's mean is 1.5 or more (the owner's Q1 and Q3 only, as proxy). A fast tutorial that teaches nothing does not pass.
3. **The coach never interrupts unprompted.** In tasks 2.1 and 2.2, at the default settings, the notes show no moment where the coach opened, spoke, took focus or made a sound without being asked. This is also an automated test (`app/test/coach-contract.test.ts`, `app/e2e/coach-contract.spec.ts`); your observation is the human half. Any such moment is a severity 3 finding and blocks M7.

Also in S2, not separate gates: the game in 2.2 reaches its end with no assist; the hint in 2.3 returns a line you can restate (the automated "hint returns a line" tests are in `ai/test/hint.test.ts` and `app/test/usability-s2.test.ts`).

## For the analyst (the back of the cards)

| # | Success criterion | Position, and the right answer |
| --- | --- | --- |
| 2.1 | The tutorial is completed (eight steps, `t1-zones` to `t8-winning`); the timing log is exported. Time against the budget table; a step over budget by 50% or with three blocked attempts is a finding of at least severity 2 | First launch, "I'm new: teach me", ST-21 against ST-22, going second |
| 2.2 | The game ends, win or lose, with no assist and no help from anyone. Count rewinds, blocked attempts and assists. Note any coach interruption | The first-game preset: the tutorial decks, Rookie, coach at Learner, the lethal detector at tier 1 |
| 2.3 | The participant asks (H, or the Hint button), reads the result, and restates the hint's reason with at least one number from the board (Q11 scores 2); agreeing or disagreeing is not graded. They may use "Do step 1": it only lines the move up | Kaido (OP17-058), your turn 7, 4 active DON!!, Yamato and Basil Hawkins in hand; Rocks has no Characters, 4 Life, 3 cards. The hint: play Yamato (and choose an option), give 1 DON!! to the Leader, attack their Leader, end the turn with 0 DON!! active (4 DON!!: 3 for Yamato, 1 given; the count is read when the turn passes, M7-R1). Reasons: "to stop your 6000 Leader they need 6000 − 5000 + 1000 = 2000", "they are at 4 Life with 0 active Blockers", "you end your turn with 0 DON!! active, after giving 1". Certainty: works against any hand |
| 2.4 | The participant opens a "Why?" (the Coach's Why button, the Why? on a log line, or `W`) and restates what it said in their own words (2 = a claim and one reason from it; 1 = the move but not the reason) | Rocks (you), Kaido (the AI, turn 6, 6 active DON!!, Yamato and Basil Hawkins in hand; your Yamato is a Blocker). The AI plays Yamato (its Why cites its guide, "a DON!!-adding Character in its first three turns", under "More"), then ends its turn with Basil Hawkins in hand and 3 DON!! up (the last move, which the Why button and `W` open: "It kept 3 DON!! active and 1 card in hand"). The game stops at your Main Phase |
| 2.5 | The participant notices the warning (the polite line and the note) and can say what the alternative was (attack with Kaido, which wins). The final choice is not graded. If they press End turn within the first second and nothing warns, that is by design (a late score commits silently, learning-ui §2.8); wait for the analysis and have them press again (reload restarts the position), and record it for M7-W5-1 | Kaido (OP17-058), your turn 9, 5 active DON!!, Kaido (OP17-063, 12000) ready. Rocks is at 0 Life, two +2000 Events in hand, no Blockers: one hit from Kaido wins against any hand (12000 against 5000 + 4000). Yamato and Basil Hawkins are the tempting plays (playing Yamato keeps the win, so it is not warned). End turn is the blunder: "You have lethal this turn, and this move gives it up." The note offers "Use the better choice" (plays the attack line's first step: attack with Kaido), "Commit anyway" and "Don't warn me about this" |

Teach-back keys (CR numbers are in usability-plan §6; the tutorial's own numbers are used):

| # | 2 points | 1 point |
| --- | --- | --- |
| Q5 | Neither player can battle on their own first turn; the player going first also does not draw and takes only 1 DON!! | Names one of these |
| Q2 | 6000 is the 5000 base plus 1000 for the DON!! on it; a given DON!! adds +1000 only during your own turn, so it shows 5000 on the opponent's turn | Says +1000 per DON!! but not the turn restriction |
| Q7 | Back to the cost area rested, then everything is set active in the Refresh Phase | "Back to the cost area" without the order |
| Q4 | Their Leader, and only **rested** Characters; an active Character cannot be attacked | Leader and "Characters" without the rested condition |
| Q3 | 1000 (5000 against 5000), because a tie goes to the attacker, so yours must end up higher | Says "to match it" and corrects it when asked "what happens on a tie?" |
| Q8 | One | n/a |
| Q6 | You may reveal the Life card and use its [Trigger] instead of adding it to your hand; if you decline, it goes to hand | Knows a Trigger happens but not that it replaces adding the card to hand |
| t7 | Luffy's [Activate: Main]: gives up to 2 of your rested DON!! to one of your Characters, once per turn, while he has 1 DON!! on him (scored against the card's text) | Knows it moves DON!! to a Character but not how many or the limit |
| Q1 | Their Life + 1 hits that connect: each takes one Life, and the win is a hit that lands at 0 Life | The number is right but the reason is "to get them to zero", or the reason is right with a counting slip |
| Q11 | Restates the hint's reason with a number from the board | Restates the move, not why |

The positions are `ub-hint-1`, `ub-why-1` and `ub-blunder-1` in `app/src/play/setup/usability-scenarios.ts`; `app/test/usability-s2.test.ts` checks what each shows (the hint's line and that it replays, the AI's first move with its Why, `missed-lethal` on End turn), and `app/e2e/usability-s2.spec.ts` plays task cards 2.3 to 2.5 as written above.
