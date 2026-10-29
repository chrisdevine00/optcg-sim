# M3 screen-reader pass log (nvda-firefox)

```json
{
  "project": "nvda-firefox",
  "reader": "NVDA",
  "readerNotes": [
    "Speech tap: joined the NVDA Remote relay; every phrase NVDA spoke is timestamped. Guidepup's per-key capture is off (it stops speech before each key)."
  ],
  "url": "http://localhost:4173/optcg-sim/play?scenario=a11y-m3&speed=step&start=1",
  "when": "2026-10-29T11:50:02.186Z",
  "commit": "6f826f29eb82244f42dc46b2e05889ce144513cc",
  "versions": {
    "NVDA_VERSION": "2026.2",
    "BROWSER_VERSION": "firefox 157.0",
    "GUIDEPUP_VERSION": "guidepup 0.38.0, @guidepup/playwright 0.21.0",
    "IMAGE_VERSION": "win25-vs2026 20261021.278.1",
    "RUNNER_OS": "Windows"
  }
}
```

## Step 1: Load the game; Tab from the page top (done)

**Do:** Load the game; press Tab from the page top

**Expect:** Skip link "Skip to decision"; then the board's name "Game board, turn 1, your Main Phase" and its role description

- Note: The scenario starts on turn 3 (see a11y-scenarios.ts), so the board reads "turn 3".
- Note: Tab right after the page loaded reached: heading "Your Main phase" [level=2]

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Tab` | heading "Your Main phase" [level=2] | main | main landmark, Your Main phase, region, Your Main phase, heading, level 2 |  |  |
| 2 | `Control+Home` | heading "Your Main phase" [level=2] | main | out of region, same page, link, Skip to decision |  |  |
| 3 | `Tab` | heading "Your Main phase" [level=2] | main | Your Main phase, region, Your Main phase, heading, level 2 |  |  |
| 4 | `Tab` | button "⟲ Rewind U" [disabled] | main | ⟲ Rewind, U, button, unavailable |  |  |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 

</details>

## Step 2: Tab through every zone (done)

**Do:** Tab through every zone

**Expect:** Each zone in §3.1 order, with its name and count; empty zones say "empty"; the decision panel comes right after your hand

- Note: Focus was not at the top of the board (button "⟲ Rewind U" [disabled]); Shift+Tab back to the skip link first.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 2 | `Shift+Tab` | button "Your DON!! deck, 2" | main | Your Leader row, grouping ⏐ Your DON deck, 2, button |  |  |
| 3 | `Shift+Tab` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Characters, 2 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu |  |  |
| 4 | `Shift+Tab` | button "Turn 3 · Your turn, main phase" | main | Turn and phase, grouping ⏐ Turn 3 Your turn, main phase, button |  |  |
| 5 | `Shift+Tab` | button "Opponent’s King, active, 7000 power, cost 6" | main | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, active, 7000 power, cost 6, button, sub Menu |  |  |
| 6 | `Shift+Tab` | button "Opponent’s DON!! deck, 10" | main | Opponent’s Leader row, grouping ⏐ Opponent’s DON deck, 10, button |  |  |
| 7 | `Shift+Tab` | 'button "Opponent: Kaido"' | main | Opponent, grouping ⏐ Opponent: Kaido, button |  |  |
| 8 | `Shift+Tab` | link "Skip to decision": | main | button, unavailable, ⟲ Rewind ⏐ Skip to decision, same page, link |  |  |
| 9 | `Tab` | 'button "Opponent: Kaido"' | main | Game board, turn 3, your main phase, game board ⏐ Opponent, grouping ⏐ Opponent: Kaido, button |  |  |
| 10 | `Tab` | button "Opponent’s DON!! deck, 10" | main | Opponent’s Leader row, grouping ⏐ Opponent’s DON deck, 10, button |  |  |
| 11 | `Tab` | button "Opponent’s King, active, 7000 power, cost 6" | main | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, active, 7000 power, cost 6, button, sub Menu |  |  |
| 12 | `Tab` | button "Turn 3 · Your turn, main phase" | main | Turn and phase, grouping ⏐ Turn 3 Your turn, main phase, button |  |  |
| 13 | `Tab` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Characters, 2 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu |  |  |
| 14 | `Tab` | button "Your DON!! deck, 2" | main | Your Leader row, grouping ⏐ Your DON deck, 2, button |  |  |
| 15 | `Tab` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Your hand, 5 cards, grouping ⏐ Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 16 | `Tab` | button "⟲ Rewind U" [disabled] | main | same page, link, Skip to decision ⏐ Your Main phase, region, ⟲ Rewind, U, button, unavailable |  |  |
| 17 | `Tab` | button "End turn E 3 can attack · 6 DON!! unused" | main | End turn, E, 3 can attack 6 DON unused, button |  |  |
| 18 | `Tab` | log "Game log": | main | Event log, region, Game log |  |  |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>

## Step 3: Status summary (done)

**Do:** Q

**Expect:** The status summary (§9.2)

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "End turn E 3 can attack · 6 DON!! unused" | main | Your Main phase, region, End turn, E, 3 can attack 6 DON unused, button |  |  |
| 2 | `Shift+Tab` | button "⟲ Rewind U" [disabled] | main | ⟲ Rewind, U, button, unavailable |  |  |
| 3 | `Shift+Tab` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 4 | `q` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Turn 3, your main phase. You: 3 Life, 5 cards in hand, 6 of 8 DON active, 2 Characters. Opponent: 2 Life, 1 cards in hand, 0 of 0 DON active, 3 Characters. |  | Turn 3, your main phase. You: 3 Life, 5 cards in hand, 6 of 8 DON!! active, 2 Characters. Opponent: 2 Life, 1 cards in hand, 0 of 0 DON!! active, 3 Characters. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 

</details>

## Step 4: Hand, inspector (done)

**Do:** Your hand: arrows; I on a card; Escape

**Expect:** Each card's name and playable state; the inspector opens with full text; focus returns to the card

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Home` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main |  |  |  |
| 2 | `ArrowRight` | button "Your X.Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Your X dot Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 3 | `ArrowRight` | button "Your Yamato, Character, cost 3, Counter +1000, 1000 power, Blocker, can be played" | main | Your Yamato, Character, cost 3, Counter plus 1000, 1000 power, Blocker, can be played, button, sub Menu |  |  |
| 4 | `ArrowRight` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main | Your Nola, Character, cost 1, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 5 | `ArrowRight` | button "Your Queen, Character, cost 9, 10000 power, Banish" | main | Your Queen, Character, cost 9, 10000 power, Banish, button, sub Menu |  |  |
| 6 | `Home` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 7 | `ArrowRight` | button "Your X.Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Your X dot Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 8 | `i` | button "Unpin and close (Escape)": ✕ | main | Inspector: X dot Drake, dialog ⏐ Unpin and close (Escape), button ⏐ Inspector: X dot Drake, dialog ⏐ button, Unpin and close (Escape) |  |  |
| 9 | `Escape` | button "Your X.Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your X dot Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>

## Step 5: Play a Character (done)

**Do:** Enter on a playable Character; choose Play

**Expect:** Menu items with costs; after playing: "Played Nami, rested 2 DON!!." Focus is on the new card or the hand

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Home` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 2 | `Enter` | menuitem "▶ Play · rest 3 DON!! P" | main | button, Cancel ⏐ play button Play rest 3 DON P, 1 of 2 ⏐ Actions for Black Maria, menu |  |  |
| 3 | `ArrowDown` | menuitem "Inspect I" | main | Inspect I, 2 of 2 |  |  |
| 4 | `ArrowUp` | menuitem "▶ Play · rest 3 DON!! P" | main | play button Play rest 3 DON P, 1 of 2 |  |  |
| 5 | `Enter` | body (no accessible node) | main | You: Play Black Maria. ⏐ Game OPTCG Sim, document, ￼ |  | You: Play Black Maria. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 

</details>

## Step 6: Give DON!! to the Leader (done)

**Do:** + on your Leader; Up twice; Enter

**Expect:** Count dialog "1 of N"; "3: Leader 8000"; "Gave 3 DON!! to Leader. Leader 8000."

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "Unofficial fan tool. Not affiliated with or endorsed by Bandai, Shueisha or Toei Animation. One Piece and all card names, text and art belong to their respective owners.": ⓘ | main | Unofficial fan tool. Not affiliated with or endorsed by Bandai, Shueisha or Toei Animation. One Piece and all card names, text and art belong to their respective owners., button |  |  |
| 2 | `Shift+Tab` | button "Leave the game (Home)": ⌂ | main | Leave the game (Home), button |  |  |
| 3 | `Shift+Tab` | button "Fullscreen": ⤢ | main | Fullscreen, button |  |  |
| 4 | `Shift+Tab` | button "Game menu": ≡ | main | Game menu, button, collapsed, sub Menu |  |  |
| 5 | `Shift+Tab` | 'button "Rewind to before: Play Black Maria"': ⟲ | main | Event log, region, list, with 1 item, Rewind to before: Play Black Maria, button |  |  |
| 6 | `Shift+Tab` | log "Game log": | main | You Play Black Maria, Rewind to before: Play Black Maria |  |  |
| 7 | `Shift+Tab` | button "End turn E 3 can attack · 3 DON!! unused" | main | Your Main phase, region, End turn, E, 3 can attack 3 DON unused, button |  |  |
| 8 | `Shift+Tab` | button "⟲ Rewind U" | main | ⟲ Rewind, U, button |  |  |
| 9 | `Shift+Tab` | button "Your X.Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 4 cards, grouping ⏐ Your X dot Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 10 | `Shift+Tab` | button "Your DON!! deck, 2" | main | Your Leader row, grouping ⏐ Your DON deck, 2, button |  |  |
| 11 | `ArrowRight` | button "3 active DON!!, select to give DON!!" | main | 3 active DON , select to give DON, toggle button, not pressed |  |  |
| 12 | `ArrowRight` | button "5 rested DON!!, 0 given to cards" | main | 5 rested DON , 0 given to cards, button |  |  |
| 13 | `ArrowRight` | button "Your Life, 3 cards, face down" | main | Your Life, 3 cards, face down, button |  |  |
| 14 | `ArrowRight` | button "Your Leader, Kaido, active, 5000 power, can attack" | main | Your Leader, Kaido, active, 5000 power, can attack, button, sub Menu |  |  |
| 15 | `+` | spinbutton "DON!! to give, 1 of 3 active": "1" | main | Give DON to your Leader, dialog ⏐ Give DON to your Leader, dialog ⏐ DON to give, 1 of 3 active, spin button, 1: your Leader 6000 |  |  |
| 16 | `ArrowUp` | spinbutton "DON!! to give, 2 of 3 active": "2" | main | 7000 ⏐ 2: your Leader 7000 ⏐ DON to give, 2 of 3 active |  |  |
| 17 | `ArrowUp` | spinbutton "DON!! to give, 3 of 3 active": "3" | main | 8000 ⏐ 3: your Leader 8000 ⏐ DON to give, 3 of 3 active |  |  |
| 18 | `Enter` | button "Your Leader, Kaido, active, 8000 power, 3 DON!!, can attack" | main | You: Give 3 DON to Kaido. ⏐ Game board, turn 3, your main phase, game board ⏐ Your Leader row, grouping ⏐ Your Leader, Kaido, active, 8000 power, 3 DON , can attack, button, sub Menu |  | You: Give 3 DON!! to Kaido. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>

## Step 7: Attack with a Character played this turn (done)

**Do:** A on a Character played this turn

**Expect:** "Nami can't attack: it was played this turn." No dialog

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Characters, 3 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu |  |  |
| 2 | `ArrowRight` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu |  |  |
| 3 | `ArrowRight` | button "Your Black Maria, active, 2000 power, cost 3, ability ready" | main | Your Black Maria, active, 2000 power, cost 3, ability ready, button, sub Menu |  |  |
| 4 | `a` | button "Your Black Maria, active, 2000 power, cost 3, ability ready" | main | Black Maria can’t attack: A Character can't attack on the turn it is played. |  | Black Maria can’t attack: A Character can't attack on the turn it is played. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 

</details>

## Step 8: End turn; Rookie plays at Step pace (done)

**Do:** E, then confirm; let Rookie play its turn at Step pace, pressing . for each move

**Expect:** One sentence per AI move; the end-of-turn summary

- Note: First decision of yours in Rookie's turn: optional.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `e` | button "Your Black Maria, active, 2000 power, cost 3" | waiting | You: End of turn. Kaido’s turn 4. Kaido: Refresh Draw 1 DON plus 2. ⏐ Your Black Maria, active, 2000 power, cost 3 ⏐ Kaido: King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested). |  | You: End of turn. Kaido’s turn 4. Kaido: Refresh · Draw 1 · DON!! +2. ⏐ Kaido: King: Add up to 1 active and up to 1 rested DON!! · Add 1 DON!! · Add 1 DON!! (rested). |
| 2 | `.` | button "Your Black Maria, active, 2000 power, cost 3" | waiting | Kaido: Kaido attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power. |  | Kaido: Kaido attacks your Leader · Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 3 | `.` | button "Use Enter" | optional | Kaido: Kaido: effect not used Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ button, Skip ⏐ Use, Enter, button |  | Kaido: Kaido: effect not used · Kaido: Give up to 1 of your opponent's Characters −2000 power. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 

</details>

## Step 9: Attacked: the defence planner (done)

**Do:** When attacked: the defence planner

**Expect:** Focus moves to it; the heading reads the attack; Blockers listed with previews; the primary reads "Take the hit" and Enter alone does not commit it

- Note: Decision "optional" arrived; focus was on: button "Use Enter"
- Note: Optional prompt before the defence: Optional effect Kaido: pay DON!! −1 to use this effect (Give up to 1 of your opponent's Characters −2000 power)? Skip Use Enter. Answered Skip.
- Note: Decision "block" arrived; focus was on: heading "Defend your Leader · Kaido attacks" [level=2]
- Note: Planner text: Defend your Leader · Kaido attacks Attacker Kaido (their Leader) base 5000 Defender Your Leader no change 5000 ✕ Ties go to the attacker Need +1000 more Block No block Kaido 12000 · survives Kaido 12000 · survives Counter X.Drake +2000 Yamato +1000 Nola +2000 Select lit hand cards to stage · ties go to the attacker Clear Esc Counter Stage a lit hand card Take the hit Life 3 → 2
- Note: After Enter the decision is still "block".

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Tab` | log "Game log": | optional | Event log, region, list, with 3 items, Opp King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested), Opp Kaido attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Opp Kaido: effect not used Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 2 | `Shift+Tab` | button "Use Enter" | optional | Optional effect, region, Use, Enter, button |  |  |
| 3 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 4 | `Enter` | heading "Defend your Leader · Kaido attacks" [level=2] | block | You: Kaido: effect not used. ⏐ unavailable ⏐ Counter Stage a lit hand card ⏐ Defend your Leader Kaido attacks, heading, level 2 ⏐ alert, Kaido attacks your Leader. Kaido 5000, your Leader 5000. You need 1000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. |  | You: Kaido: effect not used. ⏐ (assertive) Kaido attacks your Leader. Kaido 5000, your Leader 5000. You need 1000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. |
| 5 | `Enter` | heading "Defend your Leader · Kaido attacks" [level=2] | block |  |  |  |
| 6 | `Tab` | link "Skip to decision": | block | Skip to decision, same page, link |  |  |
| 7 | `Tab` | 'button "Opponent: Kaido"' | block | Game board, turn 4, opponent’s battle phase, game board ⏐ Opponent, grouping ⏐ Opponent: Kaido, button |  |  |
| 8 | `Tab` | button "Opponent’s DON!! deck, 6" | block | Opponent’s Leader row, grouping ⏐ Opponent’s DON deck, 6, button |  |  |
| 9 | `Tab` | button "Opponent’s King, active, 7000 power, cost 6" | block | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, active, 7000 power, cost 6, button, sub Menu |  |  |
| 10 | `Tab` | button "Turn 4 · Opponent’s turn, battle, block step" | block | Turn and phase, grouping ⏐ Turn 4 Opponent’s turn, battle, block step, button |  |  |
| 11 | `Tab` | button "Your Black Maria, active, 2000 power, cost 3" | block | Your Characters, 3 of 5, grouping ⏐ Your Black Maria, active, 2000 power, cost 3, button, sub Menu |  |  |
| 12 | `Tab` | button "Your Leader, Kaido, active, 5000 power, 3 DON!! (no bonus on the opponent’s turn)" | block | Your Leader row, grouping ⏐ Your Leader, Kaido, active, 5000 power, 3 DON (no bonus on the opponent’s turn), button, sub Menu |  |  |
| 13 | `Tab` | button "Your X.Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | block | Your hand, 4 cards, grouping ⏐ Your X dot Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 14 | `Tab` | button "No block" [pressed] | block | same page, link, Skip to decision ⏐ Defend your Leader Kaido attacks, region, Block, grouping, No block, toggle button, pressed |  |  |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>

## Step 11: A hit reveals a [Trigger] (done)

**Do:** Take a hit that reveals a [Trigger]

**Expect:** The Trigger prompt with two buttons; the result is announced

- Note: Decision "block"; focus: button "No block" [pressed]
- Note: Decision "trigger"; focus: button "Activate Trigger"
- Note: Trigger prompt: Damage · your top Life card 2 Gum-Gum Lightning P Life card: Gum-Gum Lightning Only you see this. Life 3 → 2. [Trigger] Add up to 1 DON!! card from your DON!! deck and set it as active. Activate Trigger: reveal it and use its [Trigger]. Add to hand: hand +1, kept hidden from your opponent. Activate Trigger Add to hand Enter

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 2 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 3 | `Tab` | button "X.Drake +2000" | block | Counter, grouping, X dot Drake plus 2000, toggle button, not pressed |  |  |
| 4 | `Tab` | button "Yamato +1000" | block | Yamato plus 1000, toggle button, not pressed |  |  |
| 5 | `Tab` | button "Nola +2000" | block | Nola plus 2000, toggle button, not pressed |  |  |
| 6 | `Tab` | button "Clear Esc" [disabled] | block | Clear, Esc, button, unavailable |  |  |
| 7 | `Tab` | button "Counter Stage a lit hand card" [disabled] | block | Counter, Stage a lit hand card, button, unavailable |  |  |
| 8 | `Tab` | button "Take the hit Life 3 → 2" | block | Take the hit, Life 3 right arrow 2, button |  |  |
| 9 | `Enter` | button "Activate Trigger" | trigger | Kaido: Hit 5000 vs 5000 ties go to the attacker. ⏐ Add to hand Enter ⏐ Activate Trigger, button |  | Kaido: Hit · 5000 vs 5000 · ties go to the attacker. |
| 10 | `Enter` | button "Use Enter" | optional | You: Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON . ⏐ Skip to my decision S ⏐ Kaido: King attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Skip ⏐ Use, Enter, button |  | You: Life card trashed · your Life 3 → 2 · Trigger: Gum-Gum Lightning · Add 1 DON!!. ⏐ Kaido: King attacks your Leader · Kaido: Give up to 1 of your opponent's Characters −2000 power. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>

## Step 10: Stage Counters (done)

**Do:** Choose "No block"; stage one counter that ties; check the footer; stage a second; change one counter's target; Enter

**Expect:** After the first Space: the tie wording and a footer of "Take the hit" (primary) and "Play anyway · still hits"; after the second: "Counter plus 3000, survive" as the primary; Enter plays the counters; then the result

- Note: Before the 7000 attack: "optional"; focus: button "Use Enter"
- Note: Planner: Defend your Leader · King attacks Attacker King base 7000 Defender Your Leader no change 5000 ✕ Hit lands · your Life 2 → 1 Need +3000 more Block No block Kaido 12000 · survives Kaido 12000 · survives Counter X.Drake +2000 Yamato +1000 Nola +2000 Select lit hand cards to stage · ties go to the attac
- Note: No control changes one staged Counter's target: staged Counters all go to the defender (the Leader, or the staged Blocker). "Change one counter's target" is not built.
- Note: "." did nothing with focus on button "Next move . the AI waits for you" (in the decision panel, outside the board's application region). From here the script presses Enter on that button, as a user would.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Tab` | log "Game log": | optional | Event log, region, list, with 3 items, Opp Hit 5000 vs 5000 ties go to the attacker, You Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON, Opp King attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 2 | `Shift+Tab` | button "Use Enter" | optional | Optional effect, region, Use, Enter, button |  |  |
| 3 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 4 | `Enter` | heading "Defend your Leader · King attacks" [level=2] | block | You: Kaido: effect not used. ⏐ unavailable ⏐ Counter Stage a lit hand card ⏐ Defend your Leader King attacks, heading, level 2 |  | You: Kaido: effect not used. ⏐ (assertive) King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. |
| 5 | `Tab` | button "No block" [pressed] | block | Block, grouping, No block, toggle button, pressed |  |  |
| 6 | ` ` | button "No block" [pressed] | block | No block. Your Leader 5000 against 7000: still hits. Need 3000 more. |  | No block. Your Leader 5000 against 7000: still hits. Need 3000 more. |
| 7 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 8 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 9 | `Tab` | button "X.Drake +2000" | block | Counter, grouping, X dot Drake plus 2000, toggle button, not pressed |  |  |
| 10 | ` ` | button "X.Drake +2000 ✓" [pressed] | block | Staged X dot Drake, plus 2000. Your Leader 7000 against 7000: tied: the attacker wins ties. Need 1000 more. ⏐ pressed ⏐ X dot Drake plus 2000 check |  | Staged X.Drake, plus 2000. Your Leader 7000 against 7000: tied: the attacker wins ties. Need 1000 more. |
| 11 | `Tab` | button "Yamato +1000" | block | Yamato plus 1000, toggle button, not pressed |  |  |
| 12 | `Tab` | button "Nola +2000" | block | Nola plus 2000, toggle button, not pressed |  |  |
| 13 | `Tab` | button "Clear Esc" | block | Clear, Esc, button |  |  |
| 14 | `Tab` | button "Play anyway still hits" | block | Play anyway, still hits, button |  |  |
| 15 | `Tab` | button "Take the hit Life 2 → 1 · staging discarded" | block | Take the hit, Life 2 right arrow 1 staging discarded, button |  |  |
| 16 | `Shift+Tab` | button "Play anyway still hits" | block | Play anyway, still hits, button |  |  |
| 17 | `Shift+Tab` | button "Clear Esc" | block | Clear, Esc, button |  |  |
| 18 | `Shift+Tab` | button "Nola +2000" | block | Counter, grouping, Nola plus 2000, toggle button, not pressed |  |  |
| 19 | `Shift+Tab` | button "Yamato +1000" | block | Yamato plus 1000, toggle button, not pressed |  |  |
| 20 | ` ` | button "Yamato +1000 ✓" [pressed] | block | Staged Yamato, plus 1000. Your Leader 8000 against 7000: the attack fails. ⏐ pressed ⏐ Yamato plus 1000 check |  | Staged Yamato, plus 1000. Your Leader 8000 against 7000: the attack fails. |
| 21 | `Tab` | button "Nola +2000" | block | Nola plus 2000, toggle button, not pressed |  |  |
| 22 | `Tab` | button "Clear Esc" | block | Clear, Esc, button |  |  |
| 23 | `Tab` | button "Take the hit Life 2 → 1" | block | Take the hit, Life 2 right arrow 1, button |  |  |
| 24 | `Tab` | button "Counter +3000 Enter survive · 8000 vs 7000" | block | Counter plus 3000, Enter, survive 8000 vs 7000, button |  |  |
| 25 | `Enter` | button "Next move . the AI waits for you" | waiting | You: Counter: X dot Drake plus 2000 Counter: Yamato plus 1000. Kaido: Attack fails 7000 vs 8000. ⏐ Next move dot the AI waits for you |  | You: Counter: X.Drake +2000 · Counter: Yamato +1000. Kaido: Attack fails · 7000 vs 8000. |
| 26 | `.` | button "Next move . the AI waits for you" | waiting |  |  |  |
| 27 | `Enter` | button "Next move . the AI waits for you" | waiting | unavailable ⏐ Next move dot the AI is moving ⏐ Kaido: Give 1 DON to Yamato. ⏐ Next move dot the AI waits for you |  | Kaido: Give 1 DON!! to Yamato. |
| 28 | `Enter` | button "Next move . the AI waits for you" | waiting | unavailable ⏐ Next move dot the AI is moving ⏐ Next move dot the AI waits for you |  |  |
| 29 | `Enter` | button "Next move . the AI waits for you" | waiting | unavailable ⏐ Next move dot the AI is moving ⏐ Next move dot the AI waits for you |  |  |
| 30 | `Enter` | body (no accessible node) | main | Kaido: End of turn. Your turn 5. You: Refresh Draw: Basil Hawkins DON plus 1. |  | Kaido: End of turn. Your turn 5. You: Refresh · Draw: Basil Hawkins · DON!! +1. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>

## Step 12: Attack with the Leader (done)

**Do:** Your turn: A on the Leader; arrows; Enter; Enter

**Expect:** Only legal targets cycle; the confirm reads the `preview` maths; "Leader attacks…"

- Note: Confirm panel: Attack · Kaido → their Leader Attacker Kaido (your Leader) base 5000 Defender Their Leader no change 5000 ✕ Attack fails · ties go to the attacker They need +1000 to survive · 2 cards in hand Enter or click the target again to attack. Esc goes back. Cancel Esc Confirm attack Enter 5000 vs 5000
- Note: Decision "optional": Optional effect Kaido: pay DON!! −1 to use this effect (Give up to 1 of your opponent's Characters −2000 power)? Skip Use Enter
- Note: Decision "choose": Choose Kaido: choose up to 1 of your opponent's Characters. 0 of up to 1 chosen ⌖ Basil Hawkins · 1000 ⌖ Yamato · 1000 ⌖ King · 7000 Reset Choose none Enter 0 of 1

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "⟲ Rewind U" | main | ⟲ Rewind, U, button |  |  |
| 2 | `Shift+Tab` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 3 | `Shift+Tab` | button "Your Leader, Kaido, active, 5000 power, can attack" | main | Your Leader row, grouping ⏐ Your Leader, Kaido, active, 5000 power, can attack, button, sub Menu |  |  |
| 4 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Your Leader, Kaido, active, 5000 power ⏐ Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, button, sub Menu |  |  |
| 5 | `ArrowRight` | button "Opponent’s King, rested, 7000 power, cost 6, can be targeted" | main | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, rested, 7000 power, cost 6, can be targeted, button, sub Menu |  |  |
| 6 | `ArrowRight` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, button, sub Menu |  |  |
| 7 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main |  |  |  |
| 8 | `Enter` | button "Use Enter" | optional | You: Kaido attacks their Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Opponent’s Leader, Kaido, rested, 5000 power ⏐ button, Skip ⏐ Use, Enter, button |  | You: Kaido attacks their Leader · Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 9 | `Enter` | heading "Choose" [level=2] | choose | You: Return 1 DON to the DON deck. ⏐ Choose none Enter 0 of 1 ⏐ Choose, heading, level 2 |  | You: Return 1 DON!! to the DON!! deck. |
| 10 | `Tab` | button "⌖ Basil Hawkins · 1000" | choose | Candidates, grouping, ⌖ Basil Hawkins 1000, toggle button, not pressed |  |  |
| 11 | `Enter` | button "⌖ Basil Hawkins · 1000 ✓ 1" [pressed] | choose | 1 ⏐ pressed ⏐ ⌖ Basil Hawkins 1000 check 1 |  |  |
| 12 | `Tab` | button "⌖ Yamato · 1000" | choose | ⌖ Yamato 1000, toggle button, not pressed |  |  |
| 13 | `Tab` | button "⌖ King · 7000" | choose | ⌖ King 7000, toggle button, not pressed |  |  |
| 14 | `Tab` | button "Reset" | choose | Reset, button |  |  |
| 15 | `Tab` | button "Done Enter 1 of 1" | choose | Done, Enter, 1 of 1, button |  |  |
| 16 | `Enter` | body (no accessible node) | waiting | You: Basil Hawkins minus 2000 Kaido: Give up to 1 of your opponent's Characters minus 2000 power. |  | You: Basil Hawkins −2000 · Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 17 | `Shift+Tab` | button "⟲ Rewind U" | waiting | ⟲ Rewind, U, button |  |  |
| 18 | `Shift+Tab` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power" | waiting | Game board, turn 5, your battle phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, button, sub Menu |  |  |
| 19 | `.` | 'button "First: Kaido (DON!! returned): Add up to 1 active DON!!; then set up to 1 of your DON!! active"' | order | Kaido: Kaido: effect not used. ⏐ Your effects triggered together (CR 8-6-1). Pick the one to resolve first. ⏐ Order, grouping, First: Kaido (DON returned): Add up to 1 active DON ; then set up to 1 of your DON active, button |  | Kaido: Kaido: effect not used. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>

## Step 14: Order two simultaneous triggers (done)

**Do:** Resolve an `order` decision (two simultaneous triggers)

**Expect:** Grab, move and drop are announced with positions; commit

- Note: Reached during step 12: Kaido's DON!! −1 returned a DON!!, which triggered both Kaido (OP17-062).
- Note: Focus when the order decision arrived: 'button "First: Kaido (DON!! returned): Add up to 1 active DON!!; then set up to 1 of your DON!! active"'
- Note: Panel: Choose what resolves first Several of your effects activated at once. Choose the one to resolve first. Your effects triggered together (CR 8-6-1). Pick the one to resolve first. First: Kaido (DON!! returned): Add up to 1 active DON!!; then set up to 1 of your DON!! active First: Kaido (DON!! returned): Add up to 1 active DON!!; then set up to 1 of your DON!! active

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Enter` | body (no accessible node) | waiting | You: Kaido: Add up to 1 active DON ; then set up to 1 of your DON active Add 1 DON Kaido: Add up to 1 active DON ; then set up to 1 of your DON active. ⏐ Kaido: Counter: Nola plus 2000. ⏐ You: Attack fails 5000 vs 7000. |  | You: Kaido: Add up to 1 active DON!!; then set up to 1 of your DON!! active · Add 1 DON!! · Kaido: Add up to 1 active DON!!; then set up to 1 of your DON!! active. ⏐ Kaido: Counter: Nola +2000. ⏐ You: Attack fails · 5000 vs 7000. |
| 2 | `Shift+Tab` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 3 | `.` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main |  |  |  |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 

</details>

## Step 13: Two-target effect (Pick mode) (done)

**Do:** Resolve the two-target effect (Pick mode)

**Expect:** Count line "1 selected of up to 2"; an unavailable candidate gives its reason; commit

- Note: Queen (OP17-065) [On Play] DON!! −1: up to 2 of the opponent's Characters with a cost of 5 or less.
- Note: Decision "optional": Optional effect Queen: pay DON!! −1 to use this effect (Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack)? Skip Use Enter
- Note: Decision "choose": Choose Queen: choose 1 DON!! to return to your DON!! deck. Active DON!! in your cost area (1) Rested DON!! in your cost area (9)
- Note: Decision "choose": Choose Queen: choose up to 2 of your opponent's Characters. 0 of up to 2 chosen ⌖ Basil Hawkins · −1000 ⌖ Yamato · 1000 Reset Choose none Enter 0 of 2
- Note: Status after pick 1: 1 of up to 2 chosen
- Note: Status after pick 2: 2 of up to 2 chosen

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `ArrowRight` | button "Your Queen, Character, cost 9, 10000 power, Banish, can be played" | main | Your Queen, Character, cost 9, 10000 power, Banish, can be played, button, sub Menu |  |  |
| 2 | `Enter` | menuitem "▶ Play · rest 9 DON!! P" | main | out of grouping, Character cost 9 10000 ⏐ play button Play rest 9 DON P, 1 of 2 ⏐ Actions for Queen, menu |  |  |
| 3 | `Enter` | button "Use Enter" | optional | You: Play Queen Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack. ⏐ Game OPTCG Sim, document, ￼ ⏐ Optional effect, region, Use, Enter, button |  | You: Play Queen · Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack. |
| 4 | `Enter` | heading "Choose" [level=2] | choose | Choose, heading, level 2 |  |  |
| 5 | `Tab` | button "Active DON!! in your cost area (1)" | choose | Options, grouping, Active DON in your cost area (1), button |  |  |
| 6 | `Enter` | heading "Choose" [level=2] | choose | You: Return 1 DON to the DON deck Draw 1. ⏐ Choose, heading, level 2 |  | You: Return 1 DON!! to the DON!! deck · Draw 1. |
| 7 | `Tab` | button "⌖ Basil Hawkins · −1000" | choose | Candidates, grouping, ⌖ Basil Hawkins minus 1000, toggle button, not pressed |  |  |
| 8 | `Tab` | button "⌖ Yamato · 1000" | choose | ⌖ Yamato 1000, toggle button, not pressed |  |  |
| 9 | `Tab` | button "Reset" [disabled] | choose | Reset, button, unavailable |  |  |
| 10 | `Tab` | button "Choose none Enter 0 of 2" | choose | Choose none, Enter, 0 of 2, button |  |  |
| 11 | `Tab` | log "Game log": | choose | Event log, region, list, with 3 items, You Attack fails 5000 vs 7000, You Play Queen Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, You Return 1 DON to the DON deck Draw 1 |  |  |
| 12 | `Shift+Tab` | button "Choose none Enter 0 of 2" | choose | Choose, region, Choose none, Enter, 0 of 2, button |  |  |
| 13 | `Shift+Tab` | button "Reset" [disabled] | choose | Reset, button, unavailable |  |  |
| 14 | `Shift+Tab` | button "⌖ Yamato · 1000" | choose | Candidates, grouping, ⌖ Yamato 1000, toggle button, not pressed |  |  |
| 15 | `Enter` | button "⌖ Yamato · 1000 ✓ 1" [pressed] | choose | 1 ⏐ pressed ⏐ ⌖ Yamato 1000 check 1 |  |  |
| 16 | `Tab` | button "Reset" | choose | Reset, button |  |  |
| 17 | `Tab` | button "Done Enter 1 of 2" | choose | Done, Enter, 1 of 2, button |  |  |
| 18 | `Tab` | log "Game log": | choose | Event log, region, list, with 3 items, You Attack fails 5000 vs 7000, You Play Queen Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, You Return 1 DON to the DON deck Draw 1 |  |  |
| 19 | `Shift+Tab` | button "Done Enter 1 of 2" | choose | Choose, region, Done, Enter, 1 of 2, button |  |  |
| 20 | `Shift+Tab` | button "Reset" | choose | Reset, button |  |  |
| 21 | `Shift+Tab` | button "⌖ Yamato · 1000 ✓ 1" [pressed] | choose | Candidates, grouping, ⌖ Yamato 1000 check 1, toggle button, pressed |  |  |
| 22 | `Shift+Tab` | button "⌖ Basil Hawkins · −1000" | choose | ⌖ Basil Hawkins minus 1000, toggle button, not pressed |  |  |
| 23 | `Enter` | button "⌖ Basil Hawkins · −1000 ✓ 2" [pressed] | choose | 2 ⏐ pressed ⏐ ⌖ Basil Hawkins minus 1000 check 2 |  |  |
| 24 | `Tab` | button "⌖ Yamato · 1000 ✓ 1" [pressed] | choose | ⌖ Yamato 1000 check 1, toggle button, pressed |  |  |
| 25 | `Tab` | button "Reset" | choose | Reset, button |  |  |
| 26 | `Tab` | button "Done Enter 2 of 2" | choose | Done, Enter, 2 of 2, button |  |  |
| 27 | `Enter` | button "End turn E 3 can attack · 0 DON!! unused" | main | You: Basil Hawkins cannot attack Yamato cannot attack. ⏐ End turn E 3 can attack 0 DON unused |  | You: Basil Hawkins cannot attack · Yamato cannot attack. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>

## Step 15: Rewind (done)

**Do:** U, then R, then choose a move and confirm

**Expect:** The rewind sentence; the list reads each move; focus is restored per §4.3

- Note: After U: decision "choose"; focus: heading "Choose" [level=2]
- Note: ArrowDown did not move focus in the rewind list.
- Note: Chose: 'button "Play Queen · Queen: Draw 1; up to 2 of your opponent''s Characters with a cost of 5 or less cannot attack"'
- Note: The rewind did not happen; focus: button "Rewind to before it" [disabled]. Closing the list with Escape.
- Note: After the rewind: decision "choose"; focus: button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power"

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "⟲ Rewind U" | main | ⟲ Rewind, U, button |  |  |
| 2 | `Shift+Tab` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | main | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu |  |  |
| 3 | `U` | heading "Choose" [level=2] | choose | Rewound. Back to: before basil Hawkins cannot attack Yamato cannot attack. Same shuffle: rewinding won’t change your draws. ⏐ button, unavailable, Reset ⏐ Choose, heading, level 2 |  | Rewound. Back to: before basil Hawkins cannot attack · Yamato cannot attack. Same shuffle: rewinding won’t change your draws. |
| 4 | `Shift+Tab` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | choose | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu |  |  |
| 5 | `r` | button "Return 1 DON!! to the DON!! deck · Draw 1" | choose | Rewind to before a move, dialog, Rewinding is deterministic: the same shuffle, so the same draws. Rewound games don’t count in your win rate. ⏐ Your moves, newest first, list ⏐ Your moves, newest first, list, Return 1 DON to the DON deck Draw 1, toggle button, not pressed ⏐ Rewind to before a move, dialog, Rewinding is deterministic: the same shuffle, so the same draws. Rewound games don’t count in your win rate. ⏐ Your moves, newest first, list, toggle button, not pressed, Return 1 DON to the DON deck Draw 1 |  |  |
| 6 | `ArrowDown` | button "Return 1 DON!! to the DON!! deck · Draw 1" | choose | button, Cancel |  |  |
| 7 | `ArrowDown` | button "Return 1 DON!! to the DON!! deck · Draw 1" | choose | button, unavailable, Rewind to before it |  |  |
| 8 | `Tab` | 'button "Play Queen · Queen: Draw 1; up to 2 of your opponent''s Characters with a cost of 5 or less cannot attack"' | choose | Play Queen Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, toggle button, not pressed |  |  |
| 9 | `Enter` | button "Rewind to before it" [disabled] | choose |  |  |  |
| 10 | `Escape` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | choose | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu ⏐ alert, King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. |  |  |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>

## Step 16: Shortcut sheet (done)

**Do:** ?, then Escape

**Expect:** Sheet dialog read; focus returns

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `?` | button "Close (Escape)": ✕ | choose | Keyboard shortcuts, dialog, Single-key shortcuts work while focus is on the board or the decision panel. In a defence, Enter commits only a Counter that stops the attack or a block; Take the hit needs focus, then Enter. play button can be played crossed swords can attack black diamond can receive DON ⌖ can be targeted high voltage ability ready ⛨ Blocker » Rush »C Rush: Character times 2 Double Attack circled division slash Banish ⤳ Unblockable T Trigger ⏐ Close (Escape), button ⏐ Keyboard shortcuts, dialog, Single-key shortcuts work while focus is on the board or the decision panel. In a defence, Enter commits only a Counter that stops the attack or a block; Take the hit needs focus, then Enter. play button can be played crossed swords can attack black diamond can receive DON ⌖ can be targeted high voltage ability ready ⛨ Blocker » Rush »C Rush: Character times 2 Double Attack circled division slash Banish ⤳ Unblockable T Trigger ⏐ button, Close (Escape) |  |  |
| 2 | `Escape` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | choose | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu ⏐ alert, King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. |  |  |

<details><summary>Guidepup per-key capture</summary>

- 
- 

</details>

## Step 17: Single-key shortcuts off (not built)

**Do:** Settings → Single-key shortcuts off; back to the board; press A

**Expect:** Nothing happens; the action menu still offers Attack

- Note: There is no Settings screen and no "Single-key shortcuts" setting in this build.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |

## Step 18: Play to the end (done)

**Do:** Play to the end (Rookie)

**Expect:** `GameEnded` is announced assertively; review link reachable

- Note: Final panel: Game over You win · Turn 7 Their Leader was hit at 0 Life (CR 9-2-1-1). Rewound: not counted in your win rate. Game Review arrives in a later milestone. The full log is above. New game Rematch Enter
- Note: No control named "review" between the game-over heading and the game log.
- Harness assist: step 18 drives the game: focus an attacker
- Harness assist: step 18 drives the game: focus an attacker
- Harness assist: step 18 drives the game: focus an attacker
- Harness assist: step 18 drives the game: focus an attacker
- Harness assist: step 18 drives the game: focus an attacker

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `p` | heading "Choose" [level=2] | choose | out of region, clickable, main landmark, heading, level 1, OPTCG Sim game: You vs Kaido ⏐ Choose, region, Choose, heading, level 2 |  |  |
| 2 | `Tab` | button "⌖ Basil Hawkins · −1000" | choose | Candidates, grouping, ⌖ Basil Hawkins minus 1000, toggle button, not pressed |  |  |
| 3 | `Tab` | button "⌖ Yamato · 1000" | choose | ⌖ Yamato 1000, toggle button, not pressed |  |  |
| 4 | `Tab` | button "Reset" [disabled] | choose | Reset, button, unavailable |  |  |
| 5 | `Tab` | button "Choose none Enter 0 of 2" | choose | Choose none, Enter, 0 of 2, button |  |  |
| 6 | `Enter` | button "End turn E 3 can attack · 0 DON!! unused" | main | End turn E 3 can attack 0 DON unused ⏐ Game board, turn 5, your main phase, game board ⏐ Your Characters, 4 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu |  |  |
| 7 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Your Kaido, active, 12000 power, cost 10, Blocker ⏐ Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, button, sub Menu |  |  |
| 8 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main |  |  |  |
| 9 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting | You: Kaido attacks their Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Opponent’s Leader, Kaido, rested, 5000 power |  | You: Kaido attacks their Leader · Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 10 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting |  |  |  |
| 11 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | main | Kaido: Block: Yamato. ⏐ You: Hit 10000 vs 1000 K dot O. Their Yamato. ⏐ Your Characters, 4 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu |  | Kaido: Block: Yamato. ⏐ You: Hit · 10000 vs 1000 · K.O. · Their Yamato. |
| 12 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Your Kaido, active, 12000 power, cost 10, Blocker ⏐ Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, button, sub Menu |  |  |
| 13 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main |  |  |  |
| 14 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting | You: Kaido attacks their Leader. ⏐ Opponent’s Leader, Kaido, rested, 5000 power ⏐ You: Hit 12000 vs 5000. |  | You: Kaido attacks their Leader. ⏐ You: Hit · 12000 vs 5000. |
| 15 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | main | Kaido: Life card to hand their Life 2 right arrow 1. ⏐ Your Characters, 4 of 5, grouping ⏐ Your Black Maria, active, 2000 power, cost 3, can attack, button, sub Menu |  | Kaido: Life card to hand · their Life 2 → 1. |
| 16 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Your Black Maria, active, 2000 power, cost 3 ⏐ Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, button, sub Menu |  |  |
| 17 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main |  |  |  |
| 18 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting | You: Black Maria attacks their Leader. ⏐ Opponent’s Leader, Kaido, rested, 5000 power ⏐ You: Attack fails 2000 vs 5000. |  | You: Black Maria attacks their Leader. ⏐ You: Attack fails · 2000 vs 5000. |
| 19 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | main |  |  |  |
| 20 | `Tab` | button "Opponent’s King, rested, 7000 power, cost 6" | main | Opponent’s Characters, 2 of 5, grouping ⏐ Opponent’s King, rested, 7000 power, cost 6, button, sub Menu |  |  |
| 21 | `Tab` | button "Turn 5 · Your turn, main phase" | main | Turn and phase, grouping ⏐ Turn 5 Your turn, main phase, button |  |  |
| 22 | `Tab` | button "Your Black Maria, rested, 2000 power, cost 3, ability ready" | main | Your Characters, 4 of 5, grouping ⏐ Your Black Maria, rested, 2000 power, cost 3, ability ready, button, sub Menu |  |  |
| 23 | `Tab` | button "Your Leader, Kaido, rested, 5000 power" | main | Your Leader row, grouping ⏐ Your Leader, Kaido, rested, 5000 power, button, sub Menu |  |  |
| 24 | `Tab` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | main | Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu |  |  |
| 25 | `e` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | You: End of turn. Kaido’s turn 6. Kaido: Refresh Draw 1 DON plus 2. ⏐ Kaido: King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested). |  | You: End of turn. Kaido’s turn 6. Kaido: Refresh · Draw 1 · DON!! +2. ⏐ Kaido: King: Add up to 1 active and up to 1 rested DON!! · Add 1 DON!! · Add 1 DON!! (rested). |
| 26 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | Kaido: Kaido attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power. |  | Kaido: Kaido attacks your Leader · Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 27 | `.` | button "Use Enter" | optional | Kaido: Kaido: effect not used Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ button, Skip ⏐ Use, Enter, button |  | Kaido: Kaido: effect not used · Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 28 | `Tab` | log "Game log": | optional | Event log, region, list, with 3 items, Opp King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested), Opp Kaido attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Opp Kaido: effect not used Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 29 | `Shift+Tab` | button "Use Enter" | optional | Optional effect, region, Use, Enter, button |  |  |
| 30 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 31 | `Enter` | heading "Defend your Leader · Kaido attacks" [level=2] | counter | You: Kaido: effect not used. ⏐ Skip to my decision S ⏐ unavailable ⏐ Counter Stage a lit hand card ⏐ Defend your Leader Kaido attacks, heading, level 2 |  | You: Kaido: effect not used. ⏐ (assertive) Kaido attacks your Leader. Kaido 5000, your Leader 5000. You need 1000 to stop it. You have 2 Counter cards worth 4000. Plan your defence. |
| 32 | `Tab` | 'button "Activate [Counter]: Mamaragan · cost 0 +1000 power during this battle; then draw 1 with 6 or less DON!! on your field"' | counter | Event Counters, grouping, Activate Counter : Mamaragan cost 0, plus 1000 power during this battle; then draw 1 with 6 or less DON on your field, button |  |  |
| 33 | `Tab` | button "Nola +2000" | counter | Counter, grouping, Nola plus 2000, toggle button, not pressed |  |  |
| 34 | `Tab` | button "Basil Hawkins +2000" | counter | Basil Hawkins plus 2000, toggle button, not pressed |  |  |
| 35 | `Tab` | button "Clear Esc" [disabled] | counter | Clear, Esc, button, unavailable |  |  |
| 36 | `Tab` | button "Counter Stage a lit hand card" [disabled] | counter | Counter, Stage a lit hand card, button, unavailable |  |  |
| 37 | `Tab` | button "Take the hit Life 2 → 1" | counter | Take the hit, Life 2 right arrow 1, button |  |  |
| 38 | `Enter` | button "Activate Trigger" | trigger | Kaido: Hit 5000 vs 5000 ties go to the attacker. ⏐ Add to hand Enter ⏐ Activate Trigger, button |  | Kaido: Hit · 5000 vs 5000 · ties go to the attacker. |
| 39 | `Enter` | button "Skip to my decision S" | waiting | You: Life card trashed your Life 2 right arrow 1 Trigger: Slow-Slow Beam Sword Add 1 DON . ⏐ Skip to my decision S ⏐ Kaido: Give 1 DON to King. |  | You: Life card trashed · your Life 2 → 1 · Trigger: Slow-Slow Beam Sword · Add 1 DON!!. ⏐ Kaido: Give 1 DON!! to King. |
| 40 | `Enter` | button "Use Enter" | optional | Skipped 1 moves. Kaido: King attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Skip ⏐ Use, Enter, button |  | Skipped 1 moves. Kaido: King attacks your Leader · Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 41 | `Tab` | log "Game log": | optional | Event log, region, list, with 3 items, You Life card trashed your Life 2 right arrow 1 Trigger: Slow-Slow Beam Sword Add 1 DON, Opp Give 2 DON to King, Opp King attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 42 | `Shift+Tab` | button "Use Enter" | optional | Optional effect, region, Use, Enter, button |  |  |
| 43 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 44 | `Enter` | heading "Defend your Leader · King attacks" [level=2] | counter | You: Kaido: effect not used. ⏐ Skip to my decision S ⏐ unavailable ⏐ Counter Stage a lit hand card ⏐ Defend your Leader King attacks, heading, level 2 |  | You: Kaido: effect not used. ⏐ (assertive) King attacks your Leader. King 9000, your Leader 5000. You need 5000 to stop it. You have 2 Counter cards worth 4000. Plan your defence. |
| 45 | `Tab` | 'button "Activate [Counter]: Mamaragan · cost 0 +1000 power during this battle; then draw 1 with 6 or less DON!! on your field"' | counter | Event Counters, grouping, Activate Counter : Mamaragan cost 0, plus 1000 power during this battle; then draw 1 with 6 or less DON on your field, button |  |  |
| 46 | `Tab` | button "Nola +2000" | counter | Counter, grouping, Nola plus 2000, toggle button, not pressed |  |  |
| 47 | `Tab` | button "Basil Hawkins +2000" | counter | Basil Hawkins plus 2000, toggle button, not pressed |  |  |
| 48 | `Tab` | button "Clear Esc" [disabled] | counter | Clear, Esc, button, unavailable |  |  |
| 49 | `Tab` | button "Counter Stage a lit hand card" [disabled] | counter | Counter, Stage a lit hand card, button, unavailable |  |  |
| 50 | `Tab` | button "Take the hit Life 1 → 0" | counter | Take the hit, Life 1 right arrow 0, button |  |  |
| 51 | `Enter` | button "Activate Trigger" | trigger | Kaido: Hit 9000 vs 5000. ⏐ Add to hand Enter ⏐ Activate Trigger, button |  | Kaido: Hit · 9000 vs 5000. |
| 52 | `Enter` | heading "Choose" [level=2] | choose | You: Life card trashed your Life 1 right arrow 0 Trigger: Wo Ro Ro Ro Ro... I Think I've Sobered Up. ⏐ Choose, heading, level 2 |  | You: Life card trashed · your Life 1 → 0 · Trigger: Wo Ro Ro Ro Ro... I Think I've Sobered Up. |
| 53 | `Tab` | button "Active DON!! in your cost area (1)" | choose | Options, grouping, Active DON in your cost area (1), button |  |  |
| 54 | `Enter` | body (no accessible node) | waiting | You: Return 1 DON to the DON deck Draw 2. ⏐ Kaido: Give 1 DON to Basil Hawkins. |  | You: Return 1 DON!! to the DON!! deck · Draw 2. ⏐ Kaido: Give 1 DON!! to Basil Hawkins. |
| 55 | `Shift+Tab` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | Game board, turn 6, opponent’s main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu |  |  |
| 56 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting |  |  |  |
| 57 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting |  |  |  |
| 58 | `.` | button "Use Enter" | optional | Kaido: Basil Hawkins attacks your Black Maria Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ out of grouping, Kaido: pay DON minus 1 to use this effect (Give up to 1 of your opponent's Characters minus 2000 power)? ⏐ Use, Enter, button |  | Kaido: Basil Hawkins attacks your Black Maria · Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 59 | `Tab` | log "Game log": | optional | Event log, region, list, with 3 items, You Return 1 DON to the DON deck Draw 2, Opp Give 3 DON to Basil Hawkins, Opp Basil Hawkins attacks your Black Maria Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 60 | `Shift+Tab` | button "Use Enter" | optional | Optional effect, region, Use, Enter, button |  |  |
| 61 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 62 | `Enter` | heading "Defend Black Maria · Basil Hawkins attacks" [level=2] | counter | You: Kaido: effect not used. ⏐ Skip to my decision S ⏐ unavailable ⏐ Counter Stage a lit hand card ⏐ Defend Black Maria Basil Hawkins attacks, heading, level 2 |  | You: Kaido: effect not used. ⏐ (assertive) Basil Hawkins attacks Black Maria. Basil Hawkins 4000, Black Maria 2000. You need 3000 to stop it. You have 4 Counter cards worth 6000. Plan your defence. |
| 63 | `Tab` | 'button "Activate [Counter]: Mamaragan · cost 0 +1000 power during this battle; then draw 1 with 6 or less DON!! on your field"' | counter | Event Counters, grouping, Activate Counter : Mamaragan cost 0, plus 1000 power during this battle; then draw 1 with 6 or less DON on your field, button |  |  |
| 64 | `Tab` | button "Nola +2000" | counter | Counter, grouping, Nola plus 2000, toggle button, not pressed |  |  |
| 65 | `Tab` | button "Basil Hawkins +2000" | counter | Basil Hawkins plus 2000, toggle button, not pressed |  |  |
| 66 | `Tab` | button "Yamato +1000" | counter | Yamato plus 1000, toggle button, not pressed |  |  |
| 67 | `Tab` | button "Queen +1000" | counter | Queen plus 1000, toggle button, not pressed |  |  |
| 68 | `Tab` | button "Clear Esc" [disabled] | counter | Clear, Esc, button, unavailable |  |  |
| 69 | `Tab` | button "Counter Stage a lit hand card" [disabled] | counter | Counter, Stage a lit hand card, button, unavailable |  |  |
| 70 | `Tab` | button "Take the hit Black Maria K.O.’d" | counter | Take the hit, Black Maria K dot O. d, button |  |  |
| 71 | `Enter` | button "Next move . the AI waits for you" | waiting | Kaido: Hit 4000 vs 2000 K dot O. Your Black Maria. ⏐ Next move dot the AI waits for you |  | Kaido: Hit · 4000 vs 2000 · K.O. · Your Black Maria. |
| 72 | `Enter` | button "Next move . the AI waits for you" | waiting | unavailable ⏐ Next move dot the AI is moving ⏐ Kaido: Play Nola. ⏐ Next move dot the AI waits for you |  | Kaido: Play Nola. |
| 73 | `Enter` | body (no accessible node) | main | Kaido: End of turn. Your turn 7. You: Refresh Draw: X dot Drake DON plus 1. ⏐ Game board, turn 7, your main phase, game board |  | Kaido: End of turn. Your turn 7. You: Refresh · Draw: X.Drake · DON!! +1. |
| 74 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Your Characters, 3 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu ⏐ Your Kaido, active, 12000 power, cost 10, Blocker ⏐ Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, button, sub Menu |  |  |
| 75 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main |  |  |  |
| 76 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting | You: Kaido attacks their Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Opponent’s Leader, Kaido, rested, 5000 power |  | You: Kaido attacks their Leader · Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 77 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting |  |  |  |
| 78 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting |  |  |  |
| 79 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | main | You: Hit 10000 vs 5000. ⏐ Kaido: Life card trashed their Life 1 right arrow 0 Trigger: Slow-Slow Beam Sword Add 1 DON . ⏐ Your Characters, 3 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu |  | You: Hit · 10000 vs 5000. ⏐ Kaido: Life card trashed · their Life 1 → 0 · Trigger: Slow-Slow Beam Sword · Add 1 DON!!. |
| 80 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Your Kaido, active, 12000 power, cost 10, Blocker ⏐ Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, button, sub Menu |  |  |
| 81 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main |  |  |  |
| 82 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting | You: Kaido attacks their Leader. ⏐ Opponent’s Leader, Kaido, rested, 5000 power |  | You: Kaido attacks their Leader. |
| 83 | `.` | heading "Game over" [level=2] | over | Rematch, or New game. ⏐ button, New game ⏐ Game over, heading, level 2 |  | You: Hit · 12000 vs 5000. Game over · You win. ⏐ Rematch, or New game. ⏐ (assertive) Game over. You win on turn 7. |
| 84 | `Tab` | button "New game" | over | New game, button |  |  |
| 85 | `Tab` | button "Rematch Enter" | over | Rematch, Enter, button |  |  |
| 86 | `Tab` | log "Game log": | over | Event log, region, list, with 67 items, You Play Black Maria, You Give 3 DON to Kaido, You End of turn, Turn 4 Opp, Opp Refresh Draw 1 DON plus 2, Opp King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested), Why? King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested), button, Opp Kaido attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Why? Kaido attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, button, Opp Kaido: effect not used Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Why? Kaido: effect not used Kaido: Give up to 1 of your opponent's Characters minus 2000 power, button, You Kaido: effect not used, Opp Hit 5000 vs 5000 ties go to the attacker, You Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON, Opp King attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Why? King attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, button, You Kaido: effect not used, You Counter: X dot Drake plus 2000 Counter: Yamato plus 1000, Opp Attack fails 7000 vs 8000, Opp Give 3 DON to Yamato, Why? Give 3 DON to Yamato, button, Opp End of turn, Why? End of turn, button, Turn 5 You, You Refresh Draw: Basil Hawkins DON plus 1, You Kaido attacks their Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, You Return 1 DON to the DON deck, You Basil Hawkins minus 2000 Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Opp Kaido: effect not used, Why? Kaido: effect not used, button, You Kaido: Add up to 1 active DON ; then set up to 1 of your DON active Add 1 DON Kaido: Add up to 1 active DON ; then set up to 1 of your DON active, Opp Counter: Nola plus 2000, Why? Counter: Nola plus 2000, button, You Attack fails 5000 vs 7000, You Play Queen Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, You Return 1 DON to the DON deck Draw 1, You Kaido attacks their Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Opp Return 1 DON to the DON deck Kaido minus 2000, Why? Return 1 DON to the DON deck Kaido minus 2000, button, Opp Block: Yamato, Why? Block: Yamato, button, You Hit 10000 vs 1000 K dot O. Their Yamato, You Kaido attacks their Leader, You Hit 12000 vs 5000, Opp Life card to hand their Life 2 right arrow 1, Why? Life card to hand their Life 2 right arrow 1, button, You Black Maria attacks their Leader, You Attack fails 2000 vs 5000, You End of turn, Turn 6 Opp, Opp Refresh Draw 1 DON plus 2, Opp King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested), Why? King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested), button, Opp Kaido attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Why? Kaido attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, button, Opp Kaido: effect not used Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Why? Kaido: effect not used Kaido: Give up to 1 of your opponent's Characters minus 2000 power, button, You Kaido: effect not used, Opp Hit 5000 vs 5000 ties go to the attacker, You Life card trashed your Life 2 right arrow 1 Trigger: Slow-Slow Beam Sword Add 1 DON, Opp Give 2 DON to King, Why? Give 2 DON to King, button, Opp King attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Why? King attacks your Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, button, You Kaido: effect not used, Opp Hit 9000 vs 5000, You Life card trashed your Life 1 right arrow 0 Trigger: Wo Ro Ro Ro Ro... I Think I've Sobered Up, You Return 1 DON to the DON deck Draw 2, Opp Give 3 DON to Basil Hawkins, Why? Give 3 DON to Basil Hawkins, button, Opp Basil Hawkins attacks your Black Maria Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Why? Basil Hawkins attacks your Black Maria Kaido: Give up to 1 of your opponent's Characters minus 2000 power, button, You Kaido: effect not used, Opp Hit 4000 vs 2000 K dot O. Your Black Maria, Opp Play Nola, Why? Play Nola, button, Opp End of turn, Turn 7 You, You Refresh Draw: X dot Drake DON plus 1, You Kaido attacks their Leader Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Opp Return 1 DON to the DON deck Kaido minus 2000, Why? Return 1 DON to the DON deck Kaido minus 2000, button, You Hit 10000 vs 5000, Opp Life card trashed their Life 1 right arrow 0 Trigger: Slow-Slow Beam Sword Add 1 DON, Why? Life card trashed their Life 1 right arrow 0 Trigger: Slow-Slow Beam Sword Add 1 DON, button, You Kaido attacks their Leader, You Hit 12000 vs 5000, Game over You win |  |  |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

</details>
