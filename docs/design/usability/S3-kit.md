# S3 session kit: the release candidate (M10)

**As of:** 2026-11-27. **Protocol:** `docs/design/usability-plan.md` §3 (common protocol), §4 (measures), §5.4 (S3), §6 (teach-back bank), §8 (findings).
**Who:** they, the owner, self-run from these task cards (§3.2 "Self-run variant"), plus any invitee they can bring (read the consent script, §2.2, first). With an invitee, the invitee is "the participant" below and the owner is the facilitator; alone, the owner is both.
**Time:** 90 minutes. **The agent's part:** the analyst, after the session; nothing here needs the agent in the room. **VoiceOver:** not part of these 90 minutes. It stays their own listening pass (`docs/design/accessibility.md` §11.2, §11.5; `docs/design/a11y-passes/README.md`, "Listening pass by hand"); the agent never drives VoiceOver on their Mac.
**Build under test:** the deployed site, **https://chrisdevine00.github.io/optcg-sim/**. S3 is the release-candidate session, so it runs on the deployed build, not a local one.

## Plan

| Minutes | Activity |
| --- | --- |
| 0 to 5 | Prep (below), recording on, stopwatch ready |
| 5 to 12 | **Task 3.1**, a game as fast as they can get into one |
| 12 to 22 | **Task 3.2**, import a tournament list and play it |
| 22 to 34 | **Task 3.3**, the Meta explorer, then teach-back Q12 |
| 34 to 50 | **Task 3.4**, one item of each drill |
| 50 to 58 | **Task 3.5**, what to work on next |
| 58 to 66 | **Task 3.6**, reduced motion and a slower opponent |
| 66 to 82 | **Task 3.7**, a whole game by keyboard alone (may be split: see its notes) |
| 82 to 88 | **Task 3.8**, offline |
| 88 to 90 | SUS and the debrief |

Never stop a task for time. Record the time and carry on; trim a later task if the day runs out, and write down which. Tasks 3.1 and 3.2 each start a game: the game does not have to be finished, only started (3.1 and 3.2 are about getting in). Task 3.7 is the one full game.

## Before you start

1. Open **https://chrisdevine00.github.io/optcg-sim/about** and wait for it to settle (the Version section lists Release, Build, Built, Cards through and Tournament lists as of). Write the **Release** and **Build** values at the top of the notes. If the Version section says "could not be loaded", reload once with a connection and write that down: the first load needs the network (task 3.8 depends on it).
2. A **fresh browser profile** (or a private window), 1280 px wide or more, a Chromium browser or Safari, with the **Reduce motion** setting of the operating system **off** (task 3.6 turns it on). Settings at their defaults. Do **not** open Settings, Progress or Drills before the task that names them. In a private window do not close the window until the exports at the end are saved: the app's data lives in that window's storage and a private window forgets it on close.
3. Screen recording with audio (Cmd+Shift+5), local only. Recordings never go in the repo. A stopwatch for anything the app does not time.
4. The task cards below, **front only**, printed or on a second screen. The success criteria are on the back ("For the analyst", at the end); do not read that section first.
5. Have these files at hand: `docs/design/usability/S3-list.txt` (task 3.2) and `docs/design/usability/S3-seed.json` (task 3.5, only if needed). They are in the repo; open them from the checkout, or from GitHub, `https://github.com/chrisdevine00/optcg-sim/tree/main/docs/design/usability`. **S3-list.txt is a text file: open it in a text editor and copy all of it** (Cmd+A, Cmd+C) when task 3.2 asks for it. Do not read the list's cards aloud or study them.
6. Say the think-aloud instruction (§3.2): "Please say what you're looking at, what you're trying to do, and what you expect to happen, as you go."
7. Start a new notes file (the template is at the end of this kit). One block per task.

Every address below is the base `https://chrisdevine00.github.io/optcg-sim/` plus a path; the cards write `<base>path`. Open them by typing or pasting, **only** where a card gives one: where a card gives no address, finding the way in is the task.

## Task cards (front)

Read each card aloud before starting its task. After each task: the **SEQ**, "Overall, how easy or difficult was this task?", 1 (very difficult) to 7 (very easy), and a one-line note.

**3.1** First launch: open `<base>` (the home page). Start the stopwatch when the page appears.
> "You know the rules. Get into a game as fast as you can."

**3.2** Open `<base>decks`. Copy the whole of `S3-list.txt` to the clipboard first.
> "Import this tournament list and play it against the AI."

**3.3** Open `<base>meta`.
> "Find out how Kaido's deck wants to win, then play against it."

Teach-back **Q12**, asked aloud before any debrief, with the screen not looked at: "How does this deck want to win?"

**3.4** Open `<base>drills`.
> "Do one item of each drill."

(They should say what each drill trains when they finish it. Ask: "What was that one practising?" after each, and write the answer down.)

**3.5** Open `<base>progress`. **If they have fewer than three reviewed games** (they almost certainly do), first import `S3-seed.json`: Settings, Data, **Import a file** (`<base>settings`), choose the file, confirm. Then return to Progress.
> "What should you work on next, according to the app?"

What the recommendation should then say, with no games: the headline **Work on: Zones and setup** and a reason that begins **"Not enough games yet: next in the course is L01."** That is the honest answer: the seed holds drill sessions and lesson marks and no games, so it cannot invent a flag. Drills then shows the counter-or-take and DON!! allocation drills passed and the lethal drill still open (the seed has three sessions: 8 of 10, 7 of 10 and 6 of 10). If they want a recommendation built from their own play, they play and review three games; that is not part of this session.

Teach-back **Q10**, only if they open a review (from Reviews, `<base>reviews`, or a flag): "What will you look for next time?"

**3.6** Open `<base>settings` first if they cannot find it.
> "Turn on reduced motion and slow the opponent down; play one opponent turn."

(The app follows the operating system's reduced-motion setting; it has no switch of its own. Whether they look for one in Settings, in the game, or in the system settings, and how long it takes them, is the finding. Turning it on in the system is correct: macOS System Settings, Accessibility, Display, **Reduce motion**; reload the app afterwards. The slower opponent is the **AI speed** buttons on the board, or `[` while the board has focus.)

**3.7** Open `<base>play`.
> "Play a full game using only the keyboard."

Opponent: **Warlord AI**. Set it up before the card is read, or leave it to them: write down which. Put the mouse and trackpad out of reach. **Any pointer use** (a click, a tap, a hover to see something, a scroll by trackpad) is counted and written down with the time; the success criterion is "no pointer use".

*Splitting 3.7 across two sittings.* The app does not offer to reopen a game after the tab is closed or reloaded (no resume control exists yet), so the pause is **within** the sitting: press **K** to pause the AI, or stop at their own turn, and leave the tab open and un-reloaded; note the pause start and end. A break overnight is not available. If they have to stop for the day, that is a finding (write it down) and the next sitting starts a new game; the timing then counts that new game, and the earlier one is noted as abandoned. Do not close the tab to "save" it.

**3.8** The steps are the task, so they are on the card:
1. Open **`<base>about`**, wait until the page has settled (the Version section shows).
2. Switch the browser **offline**: DevTools (Cmd+Option+I), Network tab, throttling menu, **Offline**; or turn Wi-Fi off.
3. Reload the page.
4. > "Continue the game and the drill."

   Start a game against any opponent, and open `<base>drills` and do one drill item.
5. Open `<base>progress` and check that progress is still there.

## Teach-back sheet (front)

Ask aloud, right after the task and before any debrief. The participant does not look at the screen while answering. Write the answer verbatim. No hint and no "are you sure".

| # | Question | After |
| --- | --- | --- |
| Q12 | "How does this deck want to win?" | 3.3 |
| Q10 | "What will you look for next time?" | any review they open (3.5 or after 3.7) |

Scoring (analyst): 2 = restates the guide's "What the deck is trying to do" in substance (Q12), or the flag's `nextTime` rule of thumb in their own words (Q10); 1 = partly, or the claim without the rule; 0 = wrong or "I don't know" (§6).

## SUS sheet (front)

At the end, before the debrief, on a printed sheet or a form on a second screen. Ten statements about the **whole app as they used it today**. For each: 1 = strongly disagree, 2, 3 = neutral, 4, 5 = strongly agree. No thinking aloud for this; do not explain the items.

| # | Statement | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | I think that I would like to use this app frequently. | | | | | |
| 2 | I found the app unnecessarily complex. | | | | | |
| 3 | I thought the app was easy to use. | | | | | |
| 4 | I think that I would need the support of a technical person to be able to use this app. | | | | | |
| 5 | I found the various functions in this app were well integrated. | | | | | |
| 6 | I thought there was too much inconsistency in this app. | | | | | |
| 7 | I would imagine that most people would learn to use this app very quickly. | | | | | |
| 8 | I found the app very cumbersome to use. | | | | | |
| 9 | I felt very confident using the app. | | | | | |
| 10 | I needed to learn a lot of things before I could get going with this app. | | | | | |

**Scoring** (the analyst's script, `scripts/usability-s3.ts`, does the same): odd items (1, 3, 5, 7, 9) contribute the answer minus 1; even items (2, 4, 6, 8, 10) contribute 5 minus the answer; add the ten contributions and multiply by 2.5. The score is 0 to 100. The target at S3 is 75 or more (§4); S1's score is the comparison. Worked examples, to check the arithmetic by hand:

| Sheet | Answers, items 1 to 10 | Score |
| --- | --- | --- |
| A | 4 2 4 2 5 1 4 2 4 3 | 77.5 |
| B | 2 4 3 3 2 4 3 3 4 2 | 45 |

To score a real sheet: `npx tsx scripts/usability-s3.ts sus 4 2 4 2 5 1 4 2 4 3` (the ten answers in order), or hand the sheet to the agent.

## Debrief (5 minutes at most, with the SUS)

"What was the most confusing moment?" "What would you change first?" "Would you use this to practise? Why or why not?" Write the answers verbatim.

## Observation template

Copy one block per task into the notes file. Keep it short; the recording has the rest.

```
## Task 3.N <name>                 Start hh:mm:ss   End hh:mm:ss   Time mm:ss
Success criterion met (yes / after assist 1 / after assist 2 / no):
Assists (level 1 = region, level 2 = the control), and what was asked:
Hesitations over 10 s (time, what they said):
Errors, by type: wrong action | dead end | blocked attempt ("Not yet ..." line) | misreading | assist
Anything slow, jumpy, silent or surprising (the app moved, spoke, lagged, lost something):
SEQ (1 to 7):            One-line note:
Teach-back (3.3, and any review), verbatim:
```

3.7 adds: every pointer use (time, what it was for), every key they tried that did nothing, whether they opened the shortcut sheet (`?`) and when, and the pause and resume times. 3.8 adds: the exact message the app showed offline, and what was missing after the reload.

## What to export, and where it goes

All of it stays on this machine. **Never commit the files, and do not paste them into chat.** The numbers and the notes go back, not the files.

1. **The tutorial timing log**: they chose "I know the rules", so there is none. Write "no tutorial run" in the notes. (If they ran the tutorial, **Settings, Tutorial timing**, the run, Export JSON and CSV, as in the S2 kit.)
2. **The progress export**: Progress, **Export progress only** (the file holds no games); keep it as the owner's check that the progress shown matches.
3. **Everything, including the reviews' flags**: Settings, Data, **Export everything**, after task 3.8 and before closing the window. It holds the game played in 3.7 and its review, if they opened one. The analyst reads only the **flag kinds and counts** and the result of the 3.7 game from it; read them off the Reviews page if the file is not to be shared: the number of reviewed games, and for each flag its kind and severity.
4. The recording and the exports stay local. If a file must reach the agent, say so in the notes and share it outside the repo.

## What to send back, and where findings go

Send back (paste into the chat, or save as `docs/design/usability/S3-notes.md` and say so; it holds numbers and words, no recordings, no exports): per task the time, the SEQ, the one-line note and every hesitation over 10 seconds with what they said; the teach-back answers verbatim; the SUS answers (ten numbers); the debrief; the Release and Build from About; and what they did differently from this kit.

The agent then writes **`docs/design/usability/S3-release-candidate.md`** (§8 format) within one working session, using the template at the end of this kit, and turns each finding into a fix or an accepted, dated decision:

- **Severity 3 and 4 block the release tag** (M10 done criteria): they are fixed, or deferred with a reason the owner accepts, and re-tested with the same task.
- Severity 2 goes to the milestone backlog in `docs/STATUS.md`; severity 1 to `docs/BACKLOG.md`.
- A finding that contradicts a design claim updates `docs/OPEN-QUESTIONS.md`.
- `docs/STATUS.md` records S3 as **run** with a link to the report, or **not run** with the claims left unverified. A partial run says which tasks were done.

If a finding cannot wait for the analyst (the app lost data, or a task cannot be done at all), write it in the notes as **BLOCKER** with the time, and carry on with the next task.

## What counts as passing S3

Indicators for the analyst (§4: not gates on their own; the gate is "no severity 3 or 4 finding open"):

1. Task success at least 80% across 3.1 to 3.8 (success means the criterion was met with no assist).
2. Teach-back Q12 and Q10 at 1.5 or more.
3. SEQ at least 5.5 for the core play tasks (3.1, 3.2, 3.7).
4. SUS at least 75, compared with S1.

## For the analyst (the back of the cards)

| # | Success criterion | Where it is, and the right answer |
| --- | --- | --- |
| 3.1 | In a game in under 60 s from the page appearing, with no assist. Count wrong actions and dead ends | Home, "I know the rules: start a game" (Rocks against Kaido, Pirate AI), then Start game. The page offers this question only on a first visit with nothing saved |
| 3.2 | Imported with no loss, loaded, game started. "No loss" is the report line **15 lines read · 15 OK · 0 problems** and the button **Import 50 cards** (the Leader line is one of the 15 lines and is not one of the 50); the deck then reads 50 cards with no issue; a game is started with it against an opponent they chose | Decks, New deck, **Import**, paste, Import 50 cards; then Decks' "Play against this deck", or Play with the saved deck chosen. The list is `S3-list.txt` (source and date are in its header) |
| 3.3 | They restate the game plan and use "Play against this deck" on the guide. Q12 scores 2 if it matches the guide's "What the deck is trying to do" in substance | Meta, the Kaido tile (OP17-058), its guide at `<base>meta/OP17-058`, the guide's **Play against this deck** button. Compare their answer with the guide's own words |
| 3.4 | Four items attempted, one of each drill (Mulligan trainer, Lethal puzzles, Counter or take it, DON!! allocation), and they can say what each one trains | Drills home, each drill's Start, one item. "What it trains" is the drill's own title and its lesson: mulligan keep-or-redraw, finding lethal, counter-or-take on a defence, where to put DON!! |
| 3.5 | Finds the recommendation and says why it was given. With the seed imported: they read "Not enough games yet" and the lesson it names, and can say that it is the next lesson in the course because there are too few reviewed games (fewer than three) for it to look at flags | Progress, the **Work on** card. If they had three or more reviewed games, it is a flag-based recommendation: record its lesson and reason and check that the reason carries numbers |
| 3.6 | Both settings found and in effect: the board's motion is reduced (no card travel, no flip) and the opponent plays at the slower speed, and one opponent turn was played | Reduced motion is the operating system's (the app reads `prefers-reduced-motion`); the speed is the **AI speed** group on the board. Note how they looked: Settings first, the board, or the system. Not finding the system setting is a finding of severity 2 or 1, not a failure of the product's accessibility claim |
| 3.7 | The game ends, win or lose, with no pointer use. Count the keys that did nothing, and whether they found `?`. Any pointer use ends the criterion as "no"; record what it was for | Warlord AI. Single-key shortcuts are in the sheet (`?`): Tab and arrows between zones, Enter on a card for the action menu, `P` for the current decision, `E` to end the turn, `A` to attack, `+` to give DON!!, `Q` for a status summary. The decision panel is the second stop after the hand |
| 3.8 | The app loads offline after the reload, the offline line shows once ("You are offline. Everything works; card art you have not seen yet shows as text."), a game starts, a drill item can be done, and progress is there (the sessions from 3.4 and the lesson marks) | The service worker precaches the shell and the card data. Card art not yet seen shows as text. A blank page, a dinosaur, or missing progress is severity 3 or 4 |

Teach-back keys: **Q12** against `docs/content/archetypes/OP17-058.md`, "What the deck is trying to do" (2 = the guide's plan in substance; 1 = partly). **Q10** against the flag's `nextTime` line on the review (2 = its rule of thumb in their words; 1 = the claim without the rule).

## Analyst template (the report, `S3-release-candidate.md`)

Header: date, Release and Build from About, participants (anonymised), facilitator, deviations from this kit (which tasks were skipped or trimmed; whether 3.7 was split; whether the seed was imported).

| Task | Completion (success / partial / fail) | Time | Errors by type (wrong action, dead end, blocked attempt, misreading, assist) | SEQ | Notes |
| --- | --- | --- | --- | --- | --- |
| 3.1 | | | | | |
| 3.2 | | | | | |
| 3.3 | | | | | |
| 3.4 | | | | | |
| 3.5 | | | | | |
| 3.6 | | | | | |
| 3.7 | | | | | |
| 3.8 | | | | | |

Task success: ___ of 8. Teach-back: Q12 ___, Q10 ___ (verbatim for any score under 2). **SUS: ___** (ten answers: ___), against S1's ___.

Findings (severity per `docs/design/a11y-passes/README.md` and §4 of the plan: 0 not a problem, 1 cosmetic, 2 minor, 3 major, 4 catastrophe; 3 and 4 block the release tag):

| ID | Task | Observation (what happened) | Quote | Severity 0 to 4 | Principle / heuristic | Proposed fix | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S3-01 | | | | | | | |

What the session did **not** test, and which claims stay unverified (VoiceOver; a beginner, if none was invited; any task trimmed).

The files this kit hands over are made by `scripts/usability-s3.ts`, and `app/test/usability-s3.test.ts` checks them: every address above resolves to a route, `S3-list.txt` imports with no problem through the real importer and is Standard-legal, `S3-seed.json` passes the import validator and holds no games, the plan adds up to 90 minutes, and the SUS examples and the recommendation text above match the code.
