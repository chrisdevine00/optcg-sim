# M3 screen-reader pass log (nvda-firefox)

```json
{
  "project": "nvda-firefox",
  "reader": "NVDA",
  "readerNotes": [
    "Speech tap: joined the NVDA Remote relay; every phrase NVDA spoke is timestamped. Guidepup's per-key capture is off (it stops speech before each key)."
  ],
  "url": "http://localhost:4173/optcg-sim/play?scenario=a11y-m3&speed=step&start=1",
  "when": "2026-11-05T22:46:44.752Z",
  "commit": "41c752acb3dd4778a91c511d3fa9173642b9702a",
  "versions": {
    "NVDA_VERSION": "2026.2",
    "BROWSER_VERSION": "firefox 157.0",
    "GUIDEPUP_VERSION": "guidepup 0.38.0, @guidepup/playwright 0.21.0",
    "IMAGE_VERSION": "win25-vs2026 20261030.294.1",
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
| 1 | `Tab` | heading "Your Main phase" [level=2] | main | main landmark, Your Main phase, region, Your Main phase, heading, clickable, level 2 |  |  |
| 2 | `Control+Home` | heading "Your Main phase" [level=2] | main | out of region, same page, link, Skip to decision |  |  |
| 3 | `Tab` | heading "Your Main phase" [level=2] | main | Your Main phase, region, Your Main phase, heading, clickable, level 2 |  |  |
| 4 | `Tab` | button "⟲ Rewind" [disabled] | main | Decision actions, decision actions ⏐ ⟲ Rewind, button, unavailable, U |  |  |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 
- 

</details>

## Step 2: Tab through every zone (done)

**Do:** Tab through every zone

**Expect:** Each zone in §3.1 order, with its name and count; empty zones say "empty"; the decision panel comes right after your hand

- Note: Focus was not at the top of the board (button "⟲ Rewind" [disabled]); Shift+Tab back to the skip link first.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 2 | `Shift+Tab` | button "Your DON!! deck, 2" | main | Your Leader row, grouping ⏐ Your DON deck, 2, button |  |  |
| 3 | `Shift+Tab` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Characters, 2 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu |  |  |
| 4 | `Shift+Tab` | button "Turn 3 · Your turn, main phase" | main | Turn and phase, grouping ⏐ Turn 3 Your turn, main phase, button |  |  |
| 5 | `Shift+Tab` | button "Opponent’s King, active, 7000 power, cost 6" | main | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, active, 7000 power, cost 6, button, sub Menu |  |  |
| 6 | `Shift+Tab` | button "Opponent’s DON!! deck, 10" | main | Opponent’s Leader row, grouping ⏐ Opponent’s DON deck, 10, button |  |  |
| 7 | `Shift+Tab` | 'button "Opponent: Kaido"' | main | Opponent, grouping ⏐ Opponent: Kaido, button |  |  |
| 8 | `Shift+Tab` | link "Skip to decision": | main | heading, clickable, level 2, Your Main phase ⏐ Skip to decision, same page, link |  |  |
| 9 | `Tab` | 'button "Opponent: Kaido"' | main | Game board, turn 3, your main phase, game board ⏐ Opponent, grouping ⏐ Opponent: Kaido, button |  |  |
| 10 | `Tab` | button "Opponent’s DON!! deck, 10" | main | Opponent’s Leader row, grouping ⏐ Opponent’s DON deck, 10, button |  |  |
| 11 | `Tab` | button "Opponent’s King, active, 7000 power, cost 6" | main | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, active, 7000 power, cost 6, button, sub Menu |  |  |
| 12 | `Tab` | button "Turn 3 · Your turn, main phase" | main | Turn and phase, grouping ⏐ Turn 3 Your turn, main phase, button |  |  |
| 13 | `Tab` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Characters, 2 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, button, sub Menu |  |  |
| 14 | `Tab` | button "Your DON!! deck, 2" | main | Your Leader row, grouping ⏐ Your DON deck, 2, button |  |  |
| 15 | `Tab` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Your hand, 5 cards, grouping ⏐ Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 16 | `Tab` | button "⟲ Rewind" [disabled] | main | Decision actions, decision actions ⏐ ⟲ Rewind, button, unavailable, U |  |  |
| 17 | `Tab` | button "End turn , 3 can attack · 6 DON!! unused" | main | End turn , 3 can attack 6 DON unused, button, E |  |  |
| 18 | `Tab` | log "Game log": | main | same page, link, Skip to decision ⏐ Event log, region, Game log |  |  |

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
| 1 | `Shift+Tab` | button "End turn , 3 can attack · 6 DON!! unused" | main | Decision actions, decision actions ⏐ End turn , 3 can attack 6 DON unused, button, E |  |  |
| 2 | `Shift+Tab` | button "⟲ Rewind" [disabled] | main | ⟲ Rewind, button, unavailable, U |  |  |
| 3 | `Shift+Tab` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 4 | `q` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Turn 3, your main phase. You: 3 Life, 5 cards in hand, 6 of 8 DON active, 2 Characters. Opponent: 2 Life, 1 card in hand, 0 of 0 DON active, 3 Characters. |  | Turn 3, your main phase. You: 3 Life, 5 cards in hand, 6 of 8 DON!! active, 2 Characters. Opponent: 2 Life, 1 card in hand, 0 of 0 DON!! active, 3 Characters. |

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
| 2 | `ArrowRight` | button "Your X. Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Your X. Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 3 | `ArrowRight` | button "Your Yamato, Character, cost 3, Counter +1000, 1000 power, Blocker, can be played" | main | Your Yamato, Character, cost 3, Counter plus 1000, 1000 power, Blocker, can be played, button, sub Menu |  |  |
| 4 | `ArrowRight` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main | Your Nola, Character, cost 1, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 5 | `ArrowRight` | button "Your Queen, Character, cost 9, 10000 power, Banish" | main | Your Queen, Character, cost 9, 10000 power, Banish, button, sub Menu |  |  |
| 6 | `Home` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 7 | `ArrowRight` | button "Your X. Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Your X. Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 8 | `i` | button "Unpin and close (Escape)": ✕ | main | Inspector: X dot Drake, dialog, Card text ⏐ Unpin and close (Escape), button ⏐ Inspector: X dot Drake, dialog, Card text ⏐ button, Unpin and close (Escape) |  |  |
| 9 | `Escape` | button "Your X. Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your X. Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |

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
| 2 | `Enter` | menuitem "Play · rest 3 DON!!" | main | out of region, button, Fullscreen ⏐ Play rest 3 DON, P, 1 of 2 ⏐ Actions for Black Maria, menu |  |  |
| 3 | `ArrowDown` | menuitem "Inspect" | main | Inspect, I, 2 of 2 |  |  |
| 4 | `ArrowUp` | menuitem "Play · rest 3 DON!!" | main | Play rest 3 DON, P, 1 of 2 |  |  |
| 5 | `Enter` | button "Your X. Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | You: Played Black Maria. ⏐ Game board, turn 3, your main phase, game board ⏐ Your hand, 4 cards, grouping ⏐ Your X. Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, button, sub Menu |  | You: Played Black Maria. |

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
| 1 | `Shift+Tab` | button "Your DON!! deck, 2" | main | Your Leader row, grouping ⏐ Your DON deck, 2, button |  |  |
| 2 | `ArrowRight` | button "3 active DON!!, select to give DON!!" | main | 3 active DON , select to give DON, toggle button, not pressed |  |  |
| 3 | `ArrowRight` | button "5 rested DON!!, 0 given to cards" | main | 5 rested DON , 0 given to cards, button |  |  |
| 4 | `ArrowRight` | button "Your Life, 3 cards, face down" | main | Your Life, 3 cards, face down, button |  |  |
| 5 | `ArrowRight` | button "Your Leader, Kaido, active, 5000 power, can attack" | main | Your Leader, Kaido, active, 5000 power, can attack, button, sub Menu |  |  |
| 6 | `+` | spinbutton "DON!! to give, 1 of 3 active": "1" | main | Give DON to your Leader, dialog ⏐ Give DON to your Leader, dialog ⏐ DON to give, 1 of 3 active, spin button, 1: your Leader 6000 |  |  |
| 7 | `ArrowUp` | spinbutton "DON!! to give, 2 of 3 active": "2" | main | 7000 ⏐ 2: your Leader 7000 ⏐ DON to give, 2 of 3 active |  |  |
| 8 | `ArrowUp` | spinbutton "DON!! to give, 3 of 3 active": "3" | main | 8000 ⏐ 3: your Leader 8000 ⏐ DON to give, 3 of 3 active |  |  |
| 9 | `Enter` | button "Your Leader, Kaido, active, 8000 power, 3 DON!!, can attack" | main | You: Give 3 DON to Kaido. ⏐ Game board, turn 3, your main phase, game board ⏐ Your Leader row, grouping ⏐ Your Leader, Kaido, active, 8000 power, 3 DON , can attack, button, sub Menu |  | You: Give 3 DON!! to Kaido. |

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
| 1 | `e` | button "Your Black Maria, active, 2000 power, cost 3" | waiting | You: End of turn. Opponent’s turn 4. Opponent: Refresh Draw 1 DON plus 2. ⏐ Your Black Maria, active, 2000 power, cost 3 ⏐ Opponent: Their King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested). |  | You: End of turn. Opponent’s turn 4. Opponent: Refresh · Draw 1 · DON!! +2. ⏐ Opponent: Their King: Add up to 1 active and up to 1 rested DON!! · Add 1 DON!! · Add 1 DON!! (rested). |
| 2 | `.` | button "Your Black Maria, active, 2000 power, cost 3" | waiting | Opponent: Kaido attacks your Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power. |  | Opponent: Kaido attacks your Leader · Their Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 3 | `.` | button "Use" | optional | Opponent: Their Kaido: effect not used Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Decision actions, decision actions ⏐ Use, button |  | Opponent: Their Kaido: effect not used · Your Kaido: Give up to 1 of your opponent's Characters −2000 power. |

<details><summary>Guidepup per-key capture</summary>

- 
- 
- 

</details>

## Step 9: Attacked: the defence planner (done)

**Do:** When attacked: the defence planner

**Expect:** Focus moves to it; the heading reads the attack; Blockers listed with previews; the primary reads "Take the hit" and Enter alone does not commit it

- Note: Decision "optional" arrived; focus was on: button "Use"
- Note: Optional prompt before the defence: Optional effect Kaido: pay DON!! −1 to use this effect (Give up to 1 of your opponent's Characters −2000 power)? Skip Use Enter. Answered Skip.
- Note: Decision "block" arrived; focus was on: heading "Defend your Leader · Kaido attacks" [level=2]
- Note: Planner text: Defend your Leader · Kaido attacks Attacker Kaido (their Leader) base 5000 Defender Your Leader no change 5000 ✕ Ties go to the attacker Need +1000 more Block No block Kaido 12000 · survives Kaido 12000 · survives Counter X.Drake +2000 Yamato +1000 Nola +2000 Select lit hand cards to stage · ties go to the attacker Clear Esc Counter , Stage a lit hand card Take the hit , Life 3 → 2
- Note: After Enter the decision is still "block".

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Tab` | log "Game log": | optional | Event log, region, list, with 3 items, Opp Their King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested), Opp Kaido attacks your Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Opp Their Kaido: effect not used Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 2 | `Shift+Tab` | button "Use" | optional | Decision actions, decision actions ⏐ Use, button |  |  |
| 3 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 4 | `Enter` | heading "Defend your Leader · Kaido attacks" [level=2] | block | You: Your Kaido: effect not used. ⏐ Kaido attacks your Leader. Kaido 5000, your Leader 5000. You need 1000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. ⏐ unavailable ⏐ Counter , Stage a lit hand card ⏐ Opp Kaido attacks your Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power ⏐ Defend your Leader Kaido attacks, region, Defend your Leader Kaido attacks, heading, clickable, level 2 |  | You: Your Kaido: effect not used. ⏐ (assertive) Kaido attacks your Leader. Kaido 5000, your Leader 5000. You need 1000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. |
| 5 | `Enter` | heading "Defend your Leader · Kaido attacks" [level=2] | block |  |  |  |
| 6 | `Tab` | button "No block" [pressed] | block | Block, grouping, No block, toggle button, pressed |  |  |
| 7 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 8 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 9 | `Tab` | button "X.Drake +2000" | block | Counter, grouping, X dot Drake plus 2000, toggle button, not pressed |  |  |
| 10 | `Shift+Tab` | button "Kaido 12000 · survives" | block | Block, grouping, Kaido 12000 survives, toggle button, not pressed |  |  |
| 11 | `Shift+Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 12 | `Shift+Tab` | button "No block" [pressed] | block | No block, toggle button, pressed |  |  |

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
| 7 | `Tab` | button "Counter , Stage a lit hand card" [disabled] | block | Decision actions, decision actions ⏐ Counter , Stage a lit hand card, button, unavailable |  |  |
| 8 | `Tab` | button "Take the hit , Life 3 → 2" | block | Take the hit , Life 3 right arrow 2, button |  |  |
| 9 | `Enter` | button "Activate Trigger" | trigger | Opponent: Hit 5000 vs 5000 ties go to the attacker. ⏐ Add to hand ⏐ Activate Trigger, button |  | Opponent: Hit · 5000 vs 5000 · ties go to the attacker. |
| 10 | `Enter` | button "Use" | optional | You: Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON . ⏐ Skip to my decision ⏐ Opponent: King attacks your Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Skip ⏐ Use, button |  | You: Life card trashed · your Life 3 → 2 · Trigger: Gum-Gum Lightning · Add 1 DON!!. ⏐ Opponent: King attacks your Leader · Your Kaido: Give up to 1 of your opponent's Characters −2000 power. |

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

- Note: Before the 7000 attack: "optional"; focus: button "Use"
- Note: Planner: Defend your Leader · King attacks Attacker King base 7000 Defender Your Leader no change 5000 ✕ Hit lands · your Life 2 → 1 Need +3000 more Block No block Kaido 12000 · survives Kaido 12000 · survives Counter X.Drake +2000 Yamato +1000 Nola +2000 Select lit hand cards to stage · ties go to the attac
- Note: No control changes one staged Counter's target: staged Counters all go to the defender (the Leader, or the staged Blocker). "Change one counter's target" is not built.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Tab` | log "Game log": | optional | Kaido: pay DON minus 1 to use this effect (Give up to 1 of your opponent's Characters minus 2000 power)? ⏐ Event log, region, list, with 3 items, Opp Hit 5000 vs 5000 ties go to the attacker, You Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON, Opp King attacks your Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 2 | `Shift+Tab` | button "Use" | optional | Decision actions, decision actions ⏐ Use, button |  |  |
| 3 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 4 | `Enter` | heading "Defend your Leader · King attacks" [level=2] | block | You: Your Kaido: effect not used. ⏐ King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. ⏐ unavailable ⏐ Counter , Stage a lit hand card ⏐ You Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON ⏐ Defend your Leader King attacks, region, Defend your Leader King attacks, heading, clickable, level 2 |  | You: Your Kaido: effect not used. ⏐ (assertive) King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. |
| 5 | `Tab` | button "No block" [pressed] | block | Block, grouping, No block, toggle button, pressed |  |  |
| 6 | ` ` | button "No block" [pressed] | block | No block. Your Leader 5000 against 7000: still hits. Need 3000 more. |  | No block. Your Leader 5000 against 7000: still hits. Need 3000 more. |
| 7 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 8 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 9 | `Tab` | button "X.Drake +2000" | block | Counter, grouping, X dot Drake plus 2000, toggle button, not pressed |  |  |
| 10 | ` ` | button "X.Drake +2000 ✓" [pressed] | block | Staged X dot Drake, plus 2000. Your Leader 7000 against 7000: tied: the attacker wins ties. Need 1000 more. ⏐ pressed ⏐ X dot Drake plus 2000 check |  | Staged X.Drake, plus 2000. Your Leader 7000 against 7000: tied: the attacker wins ties. Need 1000 more. |
| 11 | `Tab` | button "Yamato +1000" | block | Yamato plus 1000, toggle button, not pressed |  |  |
| 12 | `Tab` | button "Nola +2000" | block | Nola plus 2000, toggle button, not pressed |  |  |
| 13 | `Tab` | button "Clear Esc" | block | Clear, Esc, button |  |  |
| 14 | `Tab` | button "Play anyway , still hits" | block | Decision actions, decision actions ⏐ Play anyway , still hits, button |  |  |
| 15 | `Tab` | button "Take the hit , Life 2 → 1 · staging discarded" | block | Take the hit , Life 2 right arrow 1 staging discarded, button |  |  |
| 16 | `Shift+Tab` | button "Play anyway , still hits" | block | Play anyway , still hits, button |  |  |
| 17 | `Shift+Tab` | button "Clear Esc" | block | button, Clear ⏐ Clear, Esc, button |  |  |
| 18 | `Shift+Tab` | button "Nola +2000" | block | Counter, grouping, Nola plus 2000, toggle button, not pressed |  |  |
| 19 | `Shift+Tab` | button "Yamato +1000" | block | Yamato plus 1000, toggle button, not pressed |  |  |
| 20 | ` ` | button "Yamato +1000 ✓" [pressed] | block | Staged Yamato, plus 1000. Your Leader 8000 against 7000: the attack fails. ⏐ pressed ⏐ Yamato plus 1000 check |  | Staged Yamato, plus 1000. Your Leader 8000 against 7000: the attack fails. |
| 21 | `Tab` | button "Nola +2000" | block | Nola plus 2000, toggle button, not pressed |  |  |
| 22 | `Tab` | button "Clear Esc" | block | Clear, Esc, button |  |  |
| 23 | `Tab` | button "Take the hit , Life 2 → 1" | block | Decision actions, decision actions ⏐ Take the hit , Life 2 right arrow 1, button |  |  |
| 24 | `Tab` | button "Counter +3000 , survive · 8000 vs 7000" | block | Counter plus 3000 , survive 8000 vs 7000, button |  |  |
| 25 | `Enter` | button "Next move , the AI waits for you" | waiting | You: Counter: X dot Drake plus 2000 Counter: Yamato plus 1000. Opponent: Attack fails 7000 vs 8000. ⏐ Next move , the AI waits for you |  | You: Counter: X.Drake +2000 · Counter: Yamato +1000. Opponent: Attack fails · 7000 vs 8000. |
| 26 | `.` | button "Next move , the AI waits for you" | waiting | unavailable ⏐ Next move , the AI is moving ⏐ Opponent: Give 1 DON to Yamato. ⏐ Next move , the AI waits for you |  | Opponent: Give 1 DON!! to Yamato. |
| 27 | `.` | button "Next move , the AI waits for you" | waiting | Opponent: Give 2 DON to Yamato. ⏐ unavailable ⏐ Next move , the AI is moving ⏐ Next move , the AI waits for you |  | Opponent: Give 2 DON!! to Yamato. |
| 28 | `.` | button "Next move , the AI waits for you" | waiting | Opponent: Give 3 DON to Yamato. ⏐ unavailable ⏐ Next move , the AI is moving ⏐ Next move , the AI waits for you |  | Opponent: Give 3 DON!! to Yamato. |
| 29 | `.` | heading "Your Main phase" [level=2] | main | Opponent’s turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2. Opponent: End of turn. Your turn 5. You: Refresh Draw: Basil Hawkins DON plus 1. ⏐ Last: Give 3 DON to Yamato ⏐ Opponent’s turn, heading, clickable, level 2 ⏐ Your Main phase |  | Opponent’s turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2. Opponent: End of turn. Your turn 5. You: Refresh · Draw: Basil Hawkins · DON!! +1. |

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

</details>

## Step 12: Attack with the Leader (done)

**Do:** Your turn: A on the Leader; arrows; Enter; Enter

**Expect:** Only legal targets cycle; the confirm reads the `preview` maths; "Leader attacks…"

- Note: Confirm panel: Attack · Kaido → their Leader Attacker Kaido (your Leader) base 5000 Defender Their Leader no change 5000 Kaido 5000 against their Leader 5000. Result depends on [When Attacking]. Enter to attack, Escape to go back. Result depends on [When Attacking] · ties go to the attacker They need +1000 to survive · 2 cards in hand Enter or click the target again to attack. Esc goes back. Cancel Esc Confirm attack Enter , 5000 vs 5000
- Note: Decision "optional": Optional effect Kaido: pay DON!! −1 to use this effect (Give up to 1 of your opponent's Characters −2000 power)? Skip Use Enter
- Note: Decision "choose": Choose Kaido: choose up to 1 of your opponent's Characters. 0 of up to 1 chosen ⌖ Basil Hawkins · 1000 ⌖ Yamato · 1000 ⌖ King · 7000 Reset Choose none Enter , 0 of 1
- Note: "." did nothing with focus on heading "Kaido attacks their Leader" [level=2] (in the decision panel, outside the board's application region). From here the script presses Enter on that button, as a user would.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, can be played, button, sub Menu |  |  |
| 2 | `Shift+Tab` | button "Your Leader, Kaido, active, 5000 power, can attack" | main | Your Leader row, grouping ⏐ Your Leader, Kaido, active, 5000 power, can attack, button, sub Menu |  |  |
| 3 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Your Leader, Kaido, active, 5000 power ⏐ Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, button, sub Menu |  |  |
| 4 | `ArrowRight` | button "Opponent’s King, rested, 7000 power, cost 6, can be targeted" | main | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, rested, 7000 power, cost 6, can be targeted, button, sub Menu |  |  |
| 5 | `ArrowRight` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, button, sub Menu |  |  |
| 6 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Kaido 5000 against their Leader 5000. Result depends on When Attacking . Enter to attack, Escape to go back. |  | Kaido 5000 against their Leader 5000. Result depends on [When Attacking]. Enter to attack, Escape to go back. |
| 7 | `Enter` | button "Use" | optional | You: Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Opponent’s Leader, Kaido, rested, 5000 power ⏐ Decision actions, decision actions ⏐ Use, button |  | You: Kaido attacks their Leader · Your Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 8 | `Enter` | heading "Choose" [level=2] | choose | You: Return 1 DON to the DON deck. ⏐ Choose none , 0 of 1 ⏐ heading, clickable, level 2, Choose ⏐ Choose, heading, clickable, level 2 |  | You: Return 1 DON!! to the DON!! deck. |
| 9 | `Tab` | button "Basil Hawkins · 1000" | choose | Candidates, grouping, Basil Hawkins 1000, toggle button, not pressed |  |  |
| 10 | `Enter` | button "Basil Hawkins · 1000 ✓ 1" [pressed] | choose | 1 ⏐ pressed ⏐ Basil Hawkins 1000 check 1 |  |  |
| 11 | `Tab` | button "Yamato · 1000" | choose | Yamato 1000, toggle button, not pressed |  |  |
| 12 | `Tab` | button "King · 7000" | choose | King 7000, toggle button, not pressed |  |  |
| 13 | `Tab` | button "Reset" | choose | Decision actions, decision actions ⏐ Reset, button |  |  |
| 14 | `Tab` | button "Done , 1 of 1" | choose | Done , 1 of 1, button |  |  |
| 15 | `Enter` | heading "Kaido attacks their Leader" [level=2] | waiting | You: Basil Hawkins minus 2000 Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ out of grouping, Kaido is deciding. ⏐ Choose, heading, clickable, level 2 |  | You: Basil Hawkins −2000 · Their Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 16 | `.` | heading "Kaido attacks their Leader" [level=2] | waiting |  |  |  |
| 17 | `Shift+Tab` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power" | waiting | Game board, turn 5, your battle phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, button, sub Menu |  |  |
| 18 | `.` | 'button "First: Kaido (DON!! returned): Add up to 1 active DON!!; then set up to 1 of your DON!! active (Character slot 3)"' | order | Opponent: Their Kaido: effect not used. ⏐ heading, clickable, level 2, Choose what resolves first ⏐ Order, grouping, First: Kaido (DON returned): Add up to 1 active DON ; then set up to 1 of your DON active (Character slot 3), button |  | Opponent: Their Kaido: effect not used. |

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

## Step 14: Order two simultaneous triggers (done)

**Do:** Resolve an `order` decision (two simultaneous triggers)

**Expect:** Grab, move and drop are announced with positions; commit

- Note: Reached during step 12: Kaido's DON!! −1 returned a DON!!, which triggered both Kaido (OP17-062).
- Note: Focus when the order decision arrived: 'button "First: Kaido (DON!! returned): Add up to 1 active DON!!; then set up to 1 of your DON!! active (Character slot 3)"'
- Note: Panel: Choose what resolves first Several of your effects activated at once. Choose the one to resolve first. Your effects triggered together (CR 8-6-1). Pick the one to resolve first. First: Kaido (DON!! returned): Add up to 1 active DON!!; then set up to 1 of your DON!! active (Character slot 3) First: Kaido (DON!! returned): Add up to 1 active DON!!; then set up to 1 of your DON!! active (Character slot 2)

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Enter` | heading "Kaido attacks their Leader" [level=2] | waiting | You: Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active Add 1 DON Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active. ⏐ Kaido attacks their Leader, heading, clickable, level 2 |  | You: Your Kaido: Add up to 1 active DON!!; then set up to 1 of your DON!! active · Add 1 DON!! · Your Kaido: Add up to 1 active DON!!; then set up to 1 of your DON!! active. |
| 2 | `Shift+Tab` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main | Opponent: Counter: Nola plus 2000. ⏐ Game board, turn 5, your battle phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, button, sub Menu ⏐ You: Attack fails 5000 vs 7000. ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, can be played |  | Opponent: Counter: Nola +2000. ⏐ You: Attack fails · 5000 vs 7000. |
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
- Note: Decision "choose": Choose Queen: choose up to 2 of your opponent's Characters. 0 of up to 2 chosen ⌖ Basil Hawkins · −1000 ⌖ Yamato · 1000 King · cost 6 · 7000: can’t be chosen for this effect Reset Choose none Enter , 0 of 2
- Note: Status after pick 1: 1 of up to 2 chosen
- Note: Status after pick 2: 2 of up to 2 chosen

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `ArrowRight` | button "Your Queen, Character, cost 9, 10000 power, Banish, can be played" | main | Your Queen, Character, cost 9, 10000 power, Banish, can be played, button, sub Menu |  |  |
| 2 | `Enter` | menuitem "Play · rest 9 DON!!" | main | heading, clickable, level 2, Queen selected ⏐ Play rest 9 DON, P, 1 of 2 ⏐ Actions for Queen, menu |  |  |
| 3 | `Enter` | button "Use" | optional | You: Played Queen Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack. ⏐ Game board, turn 5, your main phase, game board ⏐ Your hand, 2 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu ⏐ Decision actions, decision actions ⏐ Use, button |  | You: Played Queen · Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack. |
| 4 | `Enter` | heading "Choose" [level=2] | choose | Choose, region, Choose, heading, clickable, level 2 |  |  |
| 5 | `Tab` | button "Active DON!! in your cost area (1)" | choose | Options, grouping, Active DON in your cost area (1), button |  |  |
| 6 | `Enter` | heading "Choose" [level=2] | choose | You: Return 1 DON to the DON deck Draw 1. ⏐ Choose, heading, clickable, level 2 |  | You: Return 1 DON!! to the DON!! deck · Draw 1. |
| 7 | `Tab` | button "Basil Hawkins · −1000" | choose | Candidates, grouping, Basil Hawkins minus 1000, toggle button, not pressed |  |  |
| 8 | `Tab` | button "Yamato · 1000" | choose | Yamato 1000, toggle button, not pressed |  |  |
| 9 | `Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 10 | `Tab` | button "Reset" [disabled] | choose | Decision actions, decision actions ⏐ Reset, button, unavailable |  |  |
| 11 | `Tab` | button "Choose none , 0 of 2" | choose | Choose none , 0 of 2, button |  |  |
| 12 | `Tab` | log "Game log": | choose | button, unavailable, King cost 6 7000: can’t be chosen for this effect ⏐ Event log, region, list, with 3 items, You Attack fails 5000 vs 7000, You Play Queen Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, You Return 1 DON to the DON deck Draw 1 |  |  |
| 13 | `Shift+Tab` | button "Choose none , 0 of 2" | choose | Decision actions, decision actions ⏐ Choose none , 0 of 2, button |  |  |
| 14 | `Shift+Tab` | button "Reset" [disabled] | choose | Reset, button, unavailable |  |  |
| 15 | `Shift+Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | You Attack fails 5000 vs 7000 ⏐ Choose, region, Candidates, grouping, King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 16 | `Shift+Tab` | button "Yamato · 1000" | choose | Yamato 1000, toggle button, not pressed |  |  |
| 17 | `Enter` | button "Yamato · 1000 ✓ 1" [pressed] | choose | 1 ⏐ pressed ⏐ Yamato 1000 check 1 |  |  |
| 18 | `Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 19 | `Tab` | button "Reset" | choose | Decision actions, decision actions ⏐ Reset, button |  |  |
| 20 | `Tab` | button "Done , 1 of 2" | choose | Done , 1 of 2, button |  |  |
| 21 | `Tab` | log "Game log": | choose | button, unavailable, King cost 6 7000: can’t be chosen for this effect ⏐ Event log, region, list, with 3 items, You Attack fails 5000 vs 7000, You Play Queen Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, You Return 1 DON to the DON deck Draw 1 |  |  |
| 22 | `Shift+Tab` | button "Done , 1 of 2" | choose | Decision actions, decision actions ⏐ Done , 1 of 2, button |  |  |
| 23 | `Shift+Tab` | button "Reset" | choose | Reset, button |  |  |
| 24 | `Shift+Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | You Attack fails 5000 vs 7000 ⏐ Choose, region, Candidates, grouping, King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 25 | `Shift+Tab` | button "Yamato · 1000 ✓ 1" [pressed] | choose | Yamato 1000 check 1, toggle button, pressed |  |  |
| 26 | `Shift+Tab` | button "Basil Hawkins · −1000" | choose | Basil Hawkins minus 1000, toggle button, not pressed |  |  |
| 27 | `Enter` | button "Basil Hawkins · −1000 ✓ 2" [pressed] | choose | 2 ⏐ pressed ⏐ Basil Hawkins minus 1000 check 2 |  |  |
| 28 | `Tab` | button "Yamato · 1000 ✓ 1" [pressed] | choose | Yamato 1000 check 1, toggle button, pressed |  |  |
| 29 | `Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 30 | `Tab` | button "Reset" | choose | Decision actions, decision actions ⏐ Reset, button |  |  |
| 31 | `Tab` | button "Done , 2 of 2" | choose | Done , 2 of 2, button |  |  |
| 32 | `Enter` | button "End turn , 3 can attack · 0 DON!! unused" | main | You: Basil Hawkins cannot attack Yamato cannot attack. ⏐ End turn , 3 can attack 0 DON unused |  | You: Basil Hawkins cannot attack · Yamato cannot attack. |

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

</details>

## Step 15: Rewind (done)

**Do:** U, then R, then choose a move and confirm

**Expect:** The rewind sentence; the list reads each move; focus is restored per §4.3

- Note: After U: decision "choose"; focus: heading "Choose" [level=2]
- Note: Chose: button "Cancel"
- Note: The rewind did not happen; focus: dialog "Rewind to before a move":. Closing the list with Escape.
- Note: After the rewind: decision "choose"; focus: dialog "Rewind to before a move":

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "⟲ Rewind" | main | ⟲ Rewind, button, U |  |  |
| 2 | `Shift+Tab` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | main | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu |  |  |
| 3 | `U` | heading "Choose" [level=2] | choose | Rewound. Back to: before Basil Hawkins cannot attack Yamato cannot attack. Same shuffle: rewinding won’t change your draws. ⏐ out of grouping, Candidates, grouping, button, unavailable, King cost 6 7000: can’t be chosen for this effect ⏐ Choose, heading, clickable, level 2 |  | Rewound. Back to: before Basil Hawkins cannot attack · Yamato cannot attack. Same shuffle: rewinding won’t change your draws. |
| 4 | `Shift+Tab` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | choose | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu |  |  |
| 5 | `r` | radio "Return 1 DON!! to the DON!! deck · Draw 1" | choose | Rewind to before a move, dialog, Rewinding is deterministic: the same shuffle, so the same draws. Rewound games don’t count in your win rate. ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ⏐ Your moves, newest first, grouping ⏐ Rewind to before a move, dialog, Rewinding is deterministic: the same shuffle, so the same draws. Rewound games don’t count in your win rate. ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ￼￼ ⏐ Your moves, newest first, grouping ⏐ Return 1 DON to the DON deck Draw 1, radio button, not checked, 1 of 15 |  |  |
| 6 | `ArrowDown` | 'radio "Play Queen · Your Queen: Draw 1; up to 2 of your opponent''s Characters with a cost of 5 or less cannot attack" [checked]' | choose | Play Queen Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, radio button, checked, 2 of 15 |  |  |
| 7 | `ArrowDown` | radio "Attack fails · 5000 vs 7000" [checked] | choose | Attack fails 5000 vs 7000, radio button, checked, 3 of 15 |  |  |
| 8 | `Tab` | button "Cancel" | choose | Cancel, button |  |  |
| 9 | `Shift+Tab` | radio "Attack fails · 5000 vs 7000" [checked] | choose | Your moves, newest first, grouping ⏐ Attack fails 5000 vs 7000, radio button, checked, 3 of 15 |  |  |
| 10 | `Shift+Tab` | radiogroup "Your moves, newest first": | choose | clickable, Return 1 DON to the DON deck Draw 1, radio button, not checked, Return 1 DON to the DON deck Draw 1, clickable, Play Queen Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, radio button, not checked, Play Queen Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, clickable, Attack fails 5000 vs 7000, radio button, checked, Attack fails 5000 vs 7000, clickable, Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active Add 1 DON Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active, radio button, not checked, Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active Add 1 DON Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active, clickable, Basil Hawkins minus 2000 Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power, radio button, not checked, Basil Hawkins minus 2000 Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power, clickable, Return 1 DON to the DON deck, radio button, not checked, Return 1 DON to the DON deck, clickable, Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power, radio button, not checked, Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power, clickable, Refresh Draw: Basil Hawkins DON plus 1, radio button, not checked, Refresh Draw: Basil Hawkins DON plus 1, clickable, Counter: X dot Drake plus 2000 Counter: Yamato plus 1000, radio button, not checked, Counter: X dot Drake plus 2000 Counter: Yamato plus 1000, clickable, Your Kaido: effect not used, radio button, not checked, Your Kaido: effect not used, clickable, Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON, radio button, not checked, Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON, clickable, Your Kaido: effect not used, radio button, not checked, Your Kaido: effect not used, clickable, End of turn, radio button, not checked, End of turn, clickable, Give 3 DON to Kaido, radio button, not checked, Give 3 DON to Kaido, clickable, Play Black Maria, radio button, not checked, Play Black Maria |  |  |
| 11 | `Shift+Tab` | button "Close (Escape)": ✕ | choose | Close (Escape), button |  |  |
| 12 | `Shift+Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 13 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Navigation, tool bar ⏐ Account, button, 1 of 3 |  |  |
| 14 | `Shift+Tab` | dialog "Rewind to before a move": | choose | JUGGLER 599dee 7d-7f 97-4021-bc 54-e 92cf 2056a 59, button |  |  |
| 15 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Search or enter address, combo box, collapsed, has auto complete, editable, selected http: slash slash localhost:4173 slash optcg-sim slash play scenario equals a 11y-m 3 and speed equals step and start equals 1 |  |  |
| 16 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Pick a search engine, button, collapsed, sub Menu, Google, pick a search engine |  |  |
| 17 | `Enter` | dialog "Rewind to before a move": | choose | Google, 1 of 5 ⏐ menu |  |  |
| 18 | `Tab` | dialog "Rewind to before a move": | choose | Bing, 2 of 5 |  |  |
| 19 | `Tab` | dialog "Rewind to before a move": | choose | Duck Duck Go, 3 of 5 |  |  |
| 20 | `Tab` | dialog "Rewind to before a move": | choose | Perplexity, 4 of 5 |  |  |
| 21 | `Tab` | dialog "Rewind to before a move": | choose | Wikipedia (en), 5 of 5 |  |  |
| 22 | `Tab` | dialog "Rewind to before a move": | choose | Bookmarks, 1 of 4 |  |  |
| 23 | `Tab` | dialog "Rewind to before a move": | choose | Tabs, 2 of 4 |  |  |
| 24 | `Tab` | dialog "Rewind to before a move": | choose | History, 3 of 4 |  |  |
| 25 | `Tab` | dialog "Rewind to before a move": | choose | Actions, 4 of 4 |  |  |
| 26 | `Tab` | dialog "Rewind to before a move": | choose | Settings, 1 of 1 |  |  |
| 27 | `Tab` | dialog "Rewind to before a move": | choose | Google, 1 of 5 |  |  |
| 28 | `Tab` | dialog "Rewind to before a move": | choose | Bing, 2 of 5 |  |  |
| 29 | `Tab` | dialog "Rewind to before a move": | choose | Duck Duck Go, 3 of 5 |  |  |
| 30 | `Tab` | dialog "Rewind to before a move": | choose | Perplexity, 4 of 5 |  |  |
| 31 | `Tab` | dialog "Rewind to before a move": | choose | Wikipedia (en), 5 of 5 |  |  |
| 32 | `Tab` | dialog "Rewind to before a move": | choose | Bookmarks, 1 of 4 |  |  |
| 33 | `Tab` | dialog "Rewind to before a move": | choose | Tabs, 2 of 4 |  |  |
| 34 | `Tab` | dialog "Rewind to before a move": | choose | History, 3 of 4 |  |  |
| 35 | `Tab` | dialog "Rewind to before a move": | choose | Actions, 4 of 4 |  |  |
| 36 | `Tab` | dialog "Rewind to before a move": | choose | Settings, 1 of 1 |  |  |
| 37 | `Tab` | dialog "Rewind to before a move": | choose | Google, 1 of 5 |  |  |
| 38 | `Tab` | dialog "Rewind to before a move": | choose | Bing, 2 of 5 |  |  |
| 39 | `Tab` | dialog "Rewind to before a move": | choose | Duck Duck Go, 3 of 5 |  |  |
| 40 | `Tab` | dialog "Rewind to before a move": | choose | Perplexity, 4 of 5 |  |  |
| 41 | `Tab` | dialog "Rewind to before a move": | choose | Wikipedia (en), 5 of 5 |  |  |
| 42 | `Tab` | dialog "Rewind to before a move": | choose | Bookmarks, 1 of 4 |  |  |
| 43 | `Tab` | dialog "Rewind to before a move": | choose | Tabs, 2 of 4 |  |  |
| 44 | `Tab` | dialog "Rewind to before a move": | choose | History, 3 of 4 |  |  |
| 45 | `Tab` | dialog "Rewind to before a move": | choose | Actions, 4 of 4 |  |  |
| 46 | `Tab` | dialog "Rewind to before a move": | choose | Settings, 1 of 1 |  |  |
| 47 | `Tab` | dialog "Rewind to before a move": | choose | Google, 1 of 5 |  |  |
| 48 | `Escape` | dialog "Rewind to before a move": | choose | Search or enter address, combo box, collapsed, has auto complete, editable, selected http: slash slash localhost:4173 slash optcg-sim slash play scenario equals a 11y-m 3 and speed equals step and start equals 1 |  |  |

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

</details>

## Step 16: Shortcut sheet (done)

**Do:** ?, then Escape

**Expect:** Sheet dialog read; focus returns

- Harness assist: Tab did not reach the hand zone

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Escape` | dialog "Rewind to before a move": | choose |  |  |  |
| 2 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Account, button, 1 of 3 |  |  |
| 3 | `Shift+Tab` | dialog "Rewind to before a move": | choose | JUGGLER 599dee 7d-7f 97-4021-bc 54-e 92cf 2056a 59, button |  |  |
| 4 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Search or enter address, combo box, collapsed, has auto complete, editable, selected http: slash slash localhost:4173 slash optcg-sim slash play scenario equals a 11y-m 3 and speed equals step and start equals 1 |  |  |
| 5 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Pick a search engine, button, collapsed, sub Menu, Google, pick a search engine |  |  |
| 6 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Sidebars, button, Show sidebar (Alt plus Ctrl plus Z), 1 of 4 |  |  |
| 7 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Browser tabs, tool bar ⏐ tab control ⏐ Open a new tab (Ctrl plus T), button, sub Menu, 2 of 2 |  |  |
| 8 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Game OPTCG Sim, tab, selected, JUGGLER 599dee 7d-7f 97-4021-bc 54-e 92cf 2056a 59, 1 of 1, level 1 |  |  |
| 9 | `Shift+Tab` | button "Rewind to before it" | choose | Browser tabs, tool bar |  |  |
| 10 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 11 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 12 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 13 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 14 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 15 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 16 | `Tab` | button "Rewind to before it" | choose | tab control ⏐ Game OPTCG Sim, tab, selected, JUGGLER 599dee 7d-7f 97-4021-bc 54-e 92cf 2056a 59, 1 of 1, level 1 |  |  |
| 17 | `Tab` | button "Rewind to before it" | choose | Open a new tab (Ctrl plus T), button, sub Menu, 2 of 2 |  |  |
| 18 | `Tab` | button "Rewind to before it" | choose | Navigation, tool bar ⏐ Sidebars, button, Show sidebar (Alt plus Ctrl plus Z), 1 of 4 |  |  |
| 19 | `Tab` | button "Rewind to before it" | choose | View site information, button |  |  |
| 20 | `Tab` | button "Rewind to before it" | choose | Search or enter address, combo box, collapsed, has auto complete, editable, selected http: slash slash localhost:4173 slash optcg-sim slash play scenario equals a 11y-m 3 and speed equals step and start equals 1 |  |  |
| 21 | `Tab` | button "Rewind to before it" | choose | JUGGLER 599dee 7d-7f 97-4021-bc 54-e 92cf 2056a 59, button |  |  |
| 22 | `Tab` | button "Rewind to before it" | choose | Account, button, 1 of 3 |  |  |
| 23 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 24 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 25 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 26 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 27 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 28 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 29 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 30 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 31 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 32 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 33 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 34 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 35 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 36 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 37 | `Tab` | dialog "Rewind to before a move": | choose |  |  |  |
| 38 | `?` | dialog "Rewind to before a move": | choose |  |  |  |
| 39 | `Escape` | dialog "Rewind to before a move": | choose |  |  |  |

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

</details>

## Step 17: Single-key shortcuts off (not built)

**Do:** Settings → Single-key shortcuts off; back to the board; press A

**Expect:** Nothing happens; the action menu still offers Attack

- Note: There is no Settings screen and no "Single-key shortcuts" setting in this build.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |

## Step 18: Play to the end (not reached)

**Do:** Play to the end (Rookie)

**Expect:** `GameEnded` is announced assertively; review link reachable

- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel
- Harness assist: focus was outside the board and the decision panel
- Harness assist: Tab did not reach Done / Choose none in the decision panel

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | dialog "Rewind to before a move": | choose | JUGGLER 599dee 7d-7f 97-4021-bc 54-e 92cf 2056a 59, button |  |  |
| 2 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Search or enter address, combo box, collapsed, has auto complete, editable, selected http: slash slash localhost:4173 slash optcg-sim slash play scenario equals a 11y-m 3 and speed equals step and start equals 1 |  |  |
| 3 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Pick a search engine, button, collapsed, sub Menu, Google, pick a search engine |  |  |
| 4 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Sidebars, button, Show sidebar (Alt plus Ctrl plus Z), 1 of 4 |  |  |
| 5 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Browser tabs, tool bar ⏐ tab control ⏐ Open a new tab (Ctrl plus T), button, sub Menu, 2 of 2 |  |  |
| 6 | `Shift+Tab` | dialog "Rewind to before a move": | choose | Game OPTCG Sim, tab, selected, JUGGLER 599dee 7d-7f 97-4021-bc 54-e 92cf 2056a 59, 1 of 1, level 1 |  |  |
| 7 | `Shift+Tab` | button "Rewind to before it" | choose | Browser tabs, tool bar |  |  |
| 8 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 9 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 10 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 11 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 12 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 13 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 14 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 15 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 16 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 17 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 18 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 19 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 20 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 21 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 22 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 23 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 24 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 25 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 26 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 27 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 28 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 29 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 30 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 31 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 32 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 33 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 34 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 35 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 36 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 37 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 38 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 39 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 40 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 41 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 42 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 43 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 44 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 45 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 46 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 47 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 48 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 49 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 50 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 51 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 52 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 53 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 54 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 55 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 56 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 57 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 58 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 59 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 60 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 61 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 62 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 63 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 64 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 65 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 66 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 67 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 68 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 69 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 70 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 71 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 72 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 73 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 74 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 75 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 76 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 77 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 78 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 79 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 80 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 81 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 82 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 83 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 84 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 85 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 86 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 87 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 88 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 89 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 90 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 91 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 92 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 93 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 94 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 95 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 96 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 97 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 98 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 99 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 100 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 101 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 102 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 103 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 104 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 105 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 106 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 107 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 108 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 109 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 110 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 111 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 112 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 113 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 114 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 115 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 116 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 117 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 118 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 119 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 120 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 121 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 122 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 123 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 124 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 125 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 126 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 127 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 128 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 129 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 130 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 131 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 132 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 133 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 134 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 135 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 136 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 137 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 138 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 139 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 140 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 141 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 142 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 143 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 144 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 145 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 146 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 147 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 148 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 149 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 150 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 151 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 152 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 153 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 154 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 155 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 156 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 157 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 158 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 159 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 160 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 161 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 162 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 163 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 164 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 165 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 166 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 167 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 168 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 169 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 170 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 171 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 172 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 173 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 174 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 175 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 176 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 177 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 178 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 179 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 180 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 181 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 182 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 183 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 184 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 185 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 186 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 187 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 188 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 189 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 190 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 191 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 192 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 193 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 194 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 195 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 196 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 197 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 198 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 199 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 200 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 201 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 202 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 203 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 204 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 205 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 206 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 207 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 208 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 209 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 210 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 211 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 212 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 213 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 214 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 215 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 216 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 217 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 218 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 219 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 220 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 221 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 222 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 223 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 224 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 225 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 226 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 227 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 228 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 229 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 230 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 231 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 232 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 233 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 234 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 235 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 236 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 237 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 238 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 239 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 240 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 241 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 242 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 243 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 244 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 245 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 246 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 247 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 248 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 249 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 250 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 251 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 252 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 253 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 254 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 255 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 256 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 257 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 258 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 259 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 260 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 261 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 262 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 263 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 264 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 265 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 266 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 267 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 268 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 269 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 270 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 271 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 272 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 273 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 274 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 275 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 276 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 277 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 278 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 279 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 280 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 281 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 282 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 283 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 284 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 285 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 286 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 287 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 288 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 289 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 290 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 291 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 292 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 293 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 294 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 295 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 296 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 297 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 298 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 299 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 300 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 301 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 302 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 303 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 304 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 305 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 306 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 307 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 308 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 309 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 310 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 311 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 312 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 313 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 314 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 315 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 316 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 317 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 318 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 319 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 320 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 321 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 322 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 323 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 324 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 325 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 326 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 327 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 328 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 329 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 330 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 331 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 332 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 333 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 334 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 335 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 336 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 337 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 338 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 339 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 340 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 341 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 342 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 343 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 344 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 345 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 346 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 347 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 348 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 349 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 350 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 351 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 352 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 353 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 354 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 355 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 356 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 357 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 358 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 359 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 360 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 361 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 362 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 363 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 364 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 365 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 366 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 367 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 368 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 369 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 370 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 371 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 372 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 373 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 374 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 375 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 376 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 377 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 378 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 379 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 380 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 381 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 382 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 383 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 384 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 385 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 386 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 387 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 388 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 389 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 390 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 391 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 392 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 393 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 394 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 395 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 396 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 397 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 398 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 399 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 400 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 401 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 402 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 403 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 404 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 405 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 406 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 407 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 408 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 409 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 410 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 411 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 412 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 413 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 414 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 415 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 416 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 417 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 418 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 419 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 420 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 421 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 422 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 423 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 424 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 425 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 426 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 427 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 428 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 429 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 430 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 431 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 432 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 433 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 434 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 435 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 436 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 437 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 438 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 439 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 440 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 441 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 442 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 443 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 444 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 445 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 446 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 447 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 448 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 449 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 450 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 451 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 452 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 453 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 454 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 455 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 456 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 457 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 458 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 459 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 460 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 461 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 462 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 463 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 464 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 465 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 466 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 467 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 468 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 469 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 470 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 471 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 472 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 473 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 474 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 475 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 476 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 477 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 478 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 479 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 480 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 481 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 482 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 483 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 484 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 485 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 486 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 487 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 488 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 489 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 490 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 491 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 492 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 493 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 494 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 495 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 496 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 497 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 498 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 499 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 500 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 501 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 502 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 503 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 504 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 505 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 506 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 507 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 508 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 509 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 510 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 511 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 512 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 513 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 514 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 515 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 516 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 517 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 518 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 519 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 520 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 521 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 522 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 523 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 524 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 525 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 526 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 527 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 528 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 529 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 530 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 531 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 532 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 533 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 534 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 535 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 536 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 537 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 538 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 539 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 540 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 541 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 542 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 543 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 544 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 545 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 546 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 547 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 548 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 549 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 550 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 551 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 552 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 553 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 554 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 555 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 556 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 557 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 558 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 559 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 560 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 561 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 562 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 563 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 564 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 565 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 566 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 567 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 568 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 569 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 570 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 571 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 572 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 573 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 574 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 575 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 576 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 577 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 578 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 579 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 580 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 581 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 582 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 583 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 584 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 585 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 586 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 587 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 588 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 589 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 590 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 591 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 592 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 593 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 594 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 595 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 596 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 597 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 598 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 599 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 600 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 601 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 602 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 603 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 604 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 605 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 606 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 607 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 608 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 609 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 610 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 611 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 612 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 613 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 614 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 615 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 616 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 617 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 618 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 619 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 620 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 621 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 622 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 623 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 624 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 625 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 626 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 627 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 628 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 629 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 630 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 631 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 632 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 633 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 634 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 635 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 636 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 637 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 638 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 639 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 640 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 641 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 642 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 643 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 644 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 645 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 646 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 647 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 648 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 649 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 650 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 651 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 652 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 653 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 654 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 655 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 656 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 657 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 658 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 659 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 660 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 661 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 662 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 663 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 664 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 665 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 666 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 667 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 668 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 669 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 670 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 671 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 672 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 673 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 674 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 675 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 676 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 677 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 678 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 679 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 680 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 681 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 682 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 683 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 684 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 685 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 686 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 687 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 688 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 689 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 690 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 691 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 692 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 693 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 694 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 695 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 696 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 697 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 698 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 699 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 700 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 701 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 702 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 703 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 704 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 705 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 706 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 707 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 708 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 709 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 710 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 711 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 712 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 713 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 714 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 715 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 716 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 717 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 718 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 719 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 720 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 721 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 722 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 723 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 724 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 725 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 726 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 727 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 728 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 729 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 730 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 731 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 732 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 733 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 734 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 735 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 736 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 737 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 738 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 739 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 740 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 741 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 742 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 743 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 744 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 745 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 746 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 747 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 748 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 749 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 750 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 751 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 752 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 753 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 754 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 755 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 756 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 757 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 758 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 759 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 760 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 761 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 762 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 763 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 764 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 765 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 766 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 767 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 768 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 769 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 770 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 771 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 772 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 773 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 774 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 775 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 776 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 777 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 778 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 779 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 780 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 781 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 782 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 783 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 784 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 785 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 786 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 787 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 788 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 789 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 790 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 791 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 792 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 793 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 794 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 795 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 796 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 797 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 798 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 799 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 800 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 801 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 802 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 803 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 804 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 805 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 806 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 807 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 808 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 809 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 810 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 811 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 812 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 813 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 814 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 815 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 816 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 817 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 818 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 819 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 820 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 821 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 822 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 823 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 824 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 825 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 826 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 827 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 828 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 829 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 830 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 831 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 832 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 833 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 834 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 835 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 836 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 837 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 838 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 839 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 840 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 841 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 842 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 843 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 844 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 845 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 846 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 847 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 848 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 849 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 850 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 851 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 852 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 853 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 854 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 855 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 856 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 857 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 858 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 859 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 860 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 861 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 862 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 863 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 864 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 865 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 866 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 867 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 868 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 869 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 870 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 871 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 872 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 873 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 874 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 875 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 876 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 877 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 878 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 879 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 880 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 881 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 882 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 883 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 884 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 885 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 886 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 887 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 888 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 889 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 890 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 891 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 892 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 893 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 894 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 895 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 896 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 897 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 898 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 899 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 900 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 901 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 902 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 903 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 904 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 905 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 906 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 907 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 908 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 909 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 910 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 911 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 912 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 913 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 914 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 915 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 916 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 917 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 918 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 919 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 920 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 921 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 922 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 923 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 924 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 925 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 926 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 927 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 928 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 929 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 930 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 931 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 932 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 933 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 934 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 935 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 936 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 937 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 938 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 939 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 940 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 941 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 942 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 943 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 944 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 945 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 946 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 947 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 948 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 949 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 950 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 951 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 952 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 953 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 954 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 955 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 956 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 957 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 958 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 959 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 960 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 961 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 962 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 963 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 964 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 965 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 966 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 967 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 968 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 969 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 970 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 971 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 972 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 973 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 974 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 975 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 976 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 977 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 978 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 979 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 980 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 981 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 982 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 983 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 984 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 985 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 986 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 987 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 988 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 989 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 990 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 991 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 992 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 993 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 994 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 995 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 996 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 997 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 998 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 999 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1000 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1001 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1002 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1003 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1004 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1005 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1006 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1007 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1008 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1009 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1010 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1011 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1012 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1013 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1014 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1015 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1016 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1017 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1018 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1019 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1020 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1021 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1022 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1023 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1024 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1025 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1026 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1027 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1028 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1029 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1030 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1031 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1032 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1033 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1034 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1035 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1036 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1037 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1038 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1039 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1040 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1041 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1042 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1043 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1044 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1045 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1046 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1047 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1048 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1049 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1050 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1051 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1052 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1053 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1054 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1055 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1056 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1057 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1058 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1059 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1060 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1061 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1062 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1063 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1064 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1065 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1066 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1067 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1068 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1069 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1070 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1071 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1072 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1073 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1074 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1075 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1076 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1077 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1078 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1079 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1080 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1081 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1082 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1083 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1084 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1085 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1086 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1087 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1088 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1089 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1090 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1091 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1092 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1093 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1094 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1095 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1096 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1097 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1098 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1099 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1100 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1101 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1102 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1103 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1104 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1105 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1106 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1107 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1108 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1109 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1110 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1111 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1112 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1113 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1114 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1115 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1116 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1117 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1118 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1119 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1120 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1121 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1122 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1123 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1124 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1125 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1126 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1127 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1128 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1129 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1130 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1131 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1132 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1133 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1134 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1135 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1136 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1137 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1138 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1139 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1140 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1141 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1142 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1143 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1144 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1145 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1146 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1147 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1148 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1149 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1150 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1151 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1152 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1153 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1154 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1155 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1156 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1157 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1158 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1159 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1160 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1161 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1162 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1163 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1164 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1165 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1166 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1167 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1168 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1169 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1170 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1171 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1172 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1173 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1174 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1175 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1176 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1177 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1178 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1179 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1180 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1181 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1182 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1183 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1184 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1185 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1186 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1187 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1188 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1189 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1190 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1191 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1192 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1193 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1194 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1195 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1196 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1197 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1198 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1199 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1200 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1201 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1202 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1203 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1204 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1205 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1206 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1207 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1208 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1209 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1210 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1211 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1212 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1213 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1214 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1215 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1216 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1217 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1218 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1219 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1220 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1221 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1222 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1223 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1224 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1225 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1226 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1227 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1228 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1229 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1230 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1231 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1232 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1233 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1234 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1235 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1236 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1237 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1238 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1239 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1240 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1241 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1242 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1243 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1244 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1245 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1246 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1247 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1248 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1249 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1250 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1251 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1252 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1253 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1254 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1255 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1256 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1257 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1258 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1259 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1260 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1261 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1262 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1263 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1264 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1265 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1266 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1267 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1268 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1269 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1270 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1271 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1272 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1273 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1274 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1275 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1276 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1277 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1278 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1279 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1280 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1281 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1282 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1283 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1284 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1285 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1286 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1287 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1288 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1289 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1290 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1291 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1292 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1293 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1294 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1295 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1296 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1297 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1298 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1299 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1300 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1301 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1302 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1303 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1304 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1305 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1306 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1307 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1308 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1309 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1310 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1311 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1312 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1313 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1314 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1315 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1316 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1317 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1318 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1319 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1320 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1321 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1322 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1323 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1324 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1325 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1326 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1327 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1328 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1329 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1330 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1331 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1332 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1333 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1334 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1335 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1336 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1337 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1338 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1339 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1340 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1341 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1342 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1343 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1344 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1345 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1346 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1347 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1348 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1349 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1350 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1351 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1352 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1353 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1354 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1355 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1356 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1357 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1358 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1359 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1360 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1361 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1362 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1363 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1364 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1365 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1366 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1367 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1368 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1369 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1370 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1371 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1372 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1373 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1374 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1375 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1376 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1377 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1378 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1379 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1380 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1381 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1382 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1383 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1384 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1385 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1386 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1387 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1388 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1389 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1390 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1391 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1392 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1393 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1394 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1395 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1396 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1397 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1398 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1399 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1400 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1401 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1402 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1403 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1404 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1405 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1406 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1407 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1408 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1409 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1410 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1411 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1412 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1413 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1414 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1415 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1416 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1417 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1418 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1419 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1420 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1421 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1422 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1423 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1424 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1425 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1426 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1427 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1428 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1429 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1430 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1431 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1432 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1433 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1434 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1435 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1436 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1437 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1438 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1439 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1440 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1441 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1442 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1443 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1444 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1445 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1446 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1447 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1448 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1449 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1450 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1451 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1452 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1453 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1454 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1455 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1456 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1457 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1458 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1459 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1460 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1461 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1462 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1463 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1464 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1465 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1466 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1467 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1468 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1469 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1470 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1471 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1472 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1473 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1474 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1475 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1476 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1477 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1478 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1479 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1480 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1481 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1482 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1483 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1484 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1485 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1486 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1487 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1488 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1489 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1490 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1491 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1492 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1493 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1494 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1495 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1496 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1497 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1498 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1499 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1500 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1501 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1502 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1503 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1504 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1505 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1506 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1507 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1508 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1509 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1510 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1511 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1512 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1513 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1514 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1515 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1516 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1517 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1518 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1519 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1520 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1521 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1522 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1523 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1524 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1525 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1526 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1527 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1528 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1529 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1530 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1531 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1532 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1533 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1534 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1535 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1536 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1537 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1538 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1539 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1540 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1541 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1542 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1543 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1544 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1545 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1546 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1547 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1548 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1549 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1550 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1551 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1552 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1553 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1554 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1555 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1556 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1557 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1558 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1559 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1560 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1561 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1562 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1563 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1564 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1565 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1566 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1567 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1568 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1569 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1570 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1571 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1572 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1573 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1574 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1575 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1576 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1577 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1578 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1579 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1580 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1581 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1582 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1583 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1584 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1585 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1586 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1587 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1588 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1589 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1590 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1591 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1592 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1593 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1594 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1595 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1596 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1597 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1598 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1599 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1600 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1601 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1602 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1603 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1604 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1605 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1606 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1607 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1608 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1609 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1610 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1611 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1612 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1613 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1614 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1615 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1616 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1617 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1618 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1619 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1620 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1621 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1622 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1623 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1624 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1625 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1626 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1627 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1628 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1629 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1630 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1631 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1632 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1633 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1634 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1635 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1636 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1637 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1638 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1639 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1640 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1641 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1642 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1643 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1644 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1645 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1646 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1647 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1648 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1649 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1650 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1651 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1652 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1653 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1654 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1655 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1656 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1657 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1658 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1659 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1660 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1661 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1662 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1663 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1664 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1665 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1666 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1667 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1668 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1669 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1670 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1671 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1672 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1673 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1674 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1675 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1676 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1677 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1678 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1679 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1680 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1681 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1682 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1683 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1684 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1685 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1686 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1687 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1688 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1689 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1690 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1691 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1692 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1693 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1694 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1695 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1696 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1697 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1698 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1699 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1700 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1701 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1702 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1703 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1704 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1705 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1706 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1707 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1708 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1709 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1710 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1711 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1712 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1713 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1714 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1715 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1716 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1717 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1718 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1719 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1720 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1721 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1722 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1723 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1724 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1725 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1726 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1727 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1728 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1729 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1730 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1731 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1732 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1733 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1734 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1735 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1736 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1737 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1738 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1739 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1740 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1741 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1742 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1743 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1744 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1745 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1746 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1747 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1748 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1749 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1750 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1751 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1752 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1753 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1754 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1755 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1756 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1757 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1758 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1759 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1760 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1761 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1762 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1763 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1764 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1765 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1766 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1767 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1768 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1769 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1770 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1771 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1772 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1773 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1774 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1775 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1776 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1777 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1778 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1779 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1780 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1781 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1782 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1783 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1784 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1785 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1786 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1787 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1788 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1789 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1790 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1791 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1792 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1793 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1794 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1795 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1796 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1797 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1798 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1799 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1800 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1801 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1802 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1803 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1804 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1805 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1806 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1807 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1808 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1809 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1810 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1811 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1812 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1813 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1814 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1815 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1816 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1817 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1818 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1819 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1820 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1821 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1822 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1823 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1824 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1825 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1826 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1827 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1828 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1829 | `Enter` | button "Rewind to before it" | choose |  |  |  |
| 1830 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1831 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1832 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1833 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1834 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1835 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1836 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1837 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1838 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1839 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1840 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1841 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1842 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1843 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1844 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1845 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1846 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1847 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1848 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1849 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1850 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1851 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1852 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1853 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1854 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1855 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1856 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1857 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1858 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1859 | `Shift+Tab` | button "Rewind to before it" | choose |  |  |  |
| 1860 | `Enter` | button "Rewind to before it" | choose |  |  |  |

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
