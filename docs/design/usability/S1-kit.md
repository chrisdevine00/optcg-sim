# S1 session kit: slice checkpoint (real game)

**As of:** 2026-11-09. **Protocol:** `docs/design/usability-plan.md` §3 (common protocol) and §5.2 (S1).
**Who:** the owner (P0), self-run from these task cards (§3.2 "Self-run variant"), plus a rules-knowing
invitee if you have one. **Time:** about 90 minutes. **The agent's part:** the analyst, after the session.

## Before you start

1. Build: `git pull && npm ci && npm run build && (cd app && npx vite preview --port 4173)`, then open
   http://localhost:4173/optcg-sim/. Or use the deployed site: https://chrisdevine00.github.io/optcg-sim/
   (same code once CI is green on `main`). Write the commit (`git rev-parse --short HEAD`) at the top of
   your notes.
2. A fresh browser profile (or a private window), browser window at 1280 wide or more.
3. Screen recording with audio (Cmd+Shift+5), local only. Recordings never go in the repo.
4. Print or put on a second screen **the task cards below, front only**. The success criterion for
   each is on the back (the "For the analyst" section at the end). Don't read that section first.

Each task's start link opens a planted position (fixed seed, so every participant sees the same
board). Paste it in the address bar when the card says so. The base is the address you use above,
for example `http://localhost:4173/optcg-sim/`.

## Task cards (front)

**1.1** Start at the home page (the base address).
> "Start a game against the computer and make your first attack."

**1.2** Start at the setup screen: `<base>play`.
> "Play a full game with Rocks against Kaido on the Pirate level. Think aloud the whole time."

Teach-back, right after: Q5 "What couldn't you do on your first turn, and why?" Q7 "Where did the
DON!! you gave go at the start of your next turn?"

**1.3** Open `<base>play?scenario=ub-defend-1&opp=pirate&start=1` and wait for the attack.
> "You're being attacked. Use whatever the screen shows to decide."

Teach-back: Q3 "How much Counter did you need, and why?"

**1.4** Open `<base>play?scenario=ub-lethal-1&opp=pirate&start=1`.
> "Do you have lethal? Use the lethal tool however you like."

Teach-back: Q1 "How many hits did you need, and why?" Q9 "Why did the DON!! go where they went?"

**1.5** Open the planted missed-lethal record: `RECORD_LINK` (filled in when the L screen-reader
script lands; it uses the same record).
> "Open the review of this finished game. Find the missed win, then practise it."

Teach-back: Q10 "What will you look for next time?"

**1.6** Open `<base>play?scenario=ub-keyboard-1&opp=pirate&start=1`. Put the mouse out of reach.
> "Play one complete turn using only the keyboard."

After each task: the SEQ, "Overall, how easy or difficult was this task?" 1 (very difficult) to 7
(very easy). At the end: the ten SUS items (`usability-plan.md` §3.3) and the 5-minute debrief.

## What to send back

Your notes file (per task: the time, the SEQ, your one-line note, every hesitation over 10 seconds
with what you said), the teach-back answers verbatim, the SUS answers, and the debrief. Not the
recording. The agent writes `docs/design/usability/S1-slice.md` from them (§8 format) and turns every
finding into a fix or an accepted, dated decision before M4b.

## For the analyst (the back of the cards)

| # | Success criterion | Position, and the right answer |
| --- | --- | --- |
| 1.1 | First attack confirmed with no assist; time to first attack | Any setup |
| 1.2 | The game ends, win or lose, with no assist; count rewinds and blocked attempts | Real game, Pirate |
| 1.3 | Commits, and Q3 scores 2 | Their Rocks Leader at 8000 (3 DON!!) attacks your 5000 Leader at 2 Life. +4000 to survive: both 0-cost Events (+2000 each). Event + Buckin (+3000) makes a tie, which still hits. Blocking with Gloriosa also survives but loses it. The battle panel says "Need +4000 more" |
| 1.4 | States the number of hits **before** opening tier 3, then plays it | Kaido Leader, Kaido 12000, 5 active DON!! against Rocks at 1 Life with 2 hidden cards (each at most +2000, and the first hit adds a card). Two hits. At least 4 DON!! on the Leader and attack with it first (9000 ties 5000+4000), then Kaido (12000 against at most 11000). Kaido first fails. The detector proves it against any hand |
| 1.5 | Opens the flag, restores it, starts "Practice this", solves the puzzle | The planted record |
| 1.6 | The turn ends with at least one play, one DON!! give and one attack, and no pointer use | Rocks, 5 active DON!!: Don Marlon (3) or Streusen (1) playable, Captain John can attack, their Yamato is a Blocker |

The scenarios are in `app/src/play/setup/usability-scenarios.ts`; `app/test/usability-scenarios.test.ts`
checks 1.3's numbers and that 1.4 is proven and needs the DON!! (one fewer DON!! than the split
needs is not lethal).
