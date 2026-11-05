# M3 screen-reader pass log (nvda-chrome)

```json
{
  "project": "nvda-chrome",
  "reader": "NVDA",
  "readerNotes": [
    "Speech tap: joined the NVDA Remote relay; every phrase NVDA spoke is timestamped. Guidepup's per-key capture is off (it stops speech before each key)."
  ],
  "url": "http://localhost:4173/optcg-sim/play?scenario=a11y-m3&speed=step&start=1",
  "when": "2026-11-05T23:18:22.409Z",
  "commit": "23c06cb48f9c93248974c78fadd309a46547bdbd",
  "versions": {
    "NVDA_VERSION": "2026.2",
    "BROWSER_VERSION": "chromium 156.0.8078.80",
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
| 1 | `Shift+Tab` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |
| 2 | `Shift+Tab` | button "Your DON!! deck, 2" | main | Your Leader row, grouping ⏐ Your DON deck, 2, button |  |  |
| 3 | `Shift+Tab` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Characters, 2 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, menu button, sub Menu |  |  |
| 4 | `Shift+Tab` | button "Turn 3 · Your turn, main phase" | main | Turn and phase, grouping ⏐ Turn 3 Your turn, main phase, button |  |  |
| 5 | `Shift+Tab` | button "Opponent’s King, active, 7000 power, cost 6" | main | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, active, 7000 power, cost 6, menu button, sub Menu |  |  |
| 6 | `Shift+Tab` | button "Opponent’s DON!! deck, 10" | main | Opponent’s Leader row, grouping ⏐ Opponent’s DON deck, 10, button |  |  |
| 7 | `Shift+Tab` | 'button "Opponent: Kaido"' | main | Opponent, grouping ⏐ Opponent: Kaido, button |  |  |
| 8 | `Shift+Tab` | link "Skip to decision": | main | heading, clickable, level 2, Your Main phase ⏐ Skip to decision, same page, link |  |  |
| 9 | `Tab` | 'button "Opponent: Kaido"' | main | Game board, turn 3, your main phase, game board ⏐ Opponent, grouping ⏐ Opponent: Kaido, button |  |  |
| 10 | `Tab` | button "Opponent’s DON!! deck, 10" | main | Opponent’s Leader row, grouping ⏐ Opponent’s DON deck, 10, button |  |  |
| 11 | `Tab` | button "Opponent’s King, active, 7000 power, cost 6" | main | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, active, 7000 power, cost 6, menu button, sub Menu |  |  |
| 12 | `Tab` | button "Turn 3 · Your turn, main phase" | main | Turn and phase, grouping ⏐ Turn 3 Your turn, main phase, button |  |  |
| 13 | `Tab` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Characters, 2 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, menu button, sub Menu |  |  |
| 14 | `Tab` | button "Your DON!! deck, 2" | main | Your Leader row, grouping ⏐ Your DON deck, 2, button |  |  |
| 15 | `Tab` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Your hand, 5 cards, grouping ⏐ Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |
| 16 | `Tab` | button "⟲ Rewind" [disabled] | main | Decision actions, decision actions ⏐ ⟲ Rewind, button, unavailable, U |  |  |
| 17 | `Tab` | button "End turn , 3 can attack · 6 DON!! unused" | main | End turn , 3 can attack 6 DON unused, button, E |  |  |
| 18 | `Tab` | log "Game log": | main | same page, link, Skip to decision ⏐ Event log, region, Game log, grouping |  |  |

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
| 3 | `Shift+Tab` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |
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
| 2 | `ArrowRight` | button "Your X. Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Your X. Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |
| 3 | `ArrowRight` | button "Your Yamato, Character, cost 3, Counter +1000, 1000 power, Blocker, can be played" | main | Your Yamato, Character, cost 3, Counter plus 1000, 1000 power, Blocker, can be played, menu button, sub Menu |  |  |
| 4 | `ArrowRight` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main | Your Nola, Character, cost 1, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |
| 5 | `ArrowRight` | button "Your Queen, Character, cost 9, 10000 power, Banish" | main | Your Queen, Character, cost 9, 10000 power, Banish, menu button, sub Menu |  |  |
| 6 | `Home` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |
| 7 | `ArrowRight` | button "Your X. Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Your X. Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |
| 8 | `i` | button "Unpin and close (Escape)": ✕ | main | Inspector: X dot Drake, dialog, On Play DON minus 2: Trash 1 card from your opponent's hand. ⏐ Unpin and close (Escape), button ⏐ Inspector: X dot Drake, dialog, On Play DON minus 2: Trash 1 card from your opponent's hand. ⏐ button, Unpin and close (Escape) |  |  |
| 9 | `Escape` | button "Your X. Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | Game board, turn 3, your main phase, game board ⏐ Your hand, 5 cards, grouping ⏐ Your X. Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |

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
| 1 | `Home` | button "Your Black Maria, Character, cost 3, Counter +2000, 2000 power, can be played" | main | Your Black Maria, Character, cost 3, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |
| 2 | `Enter` | menuitem "Play · rest 3 DON!!" | main | out of grouping, out of region, button, Fullscreen ⏐ Play rest 3 DON, P, 1 of 2 |  |  |
| 3 | `ArrowDown` | menuitem "Inspect" | main | Inspect, I, 2 of 2 |  |  |
| 4 | `ArrowUp` | menuitem "Play · rest 3 DON!!" | main | Play rest 3 DON, P, 1 of 2 |  |  |
| 5 | `Enter` | button "Your X. Drake, Character, cost 2, Counter +2000, 2000 power, can be played" | main | You: Played Black Maria, rested 3 DON . ⏐ Game board, turn 3, your main phase, game board ⏐ Your hand, 4 cards, grouping ⏐ Your X. Drake, Character, cost 2, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  | You: Played Black Maria, rested 3 DON!!. |

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
| 5 | `ArrowRight` | button "Your Leader, Kaido, active, 5000 power, can attack" | main | Your Leader, Kaido, active, 5000 power, can attack, menu button, sub Menu |  |  |
| 6 | `+` | spinbutton "DON!! to give, 1 of 3 active": "1" | main | Give DON to your Leader, dialog ⏐ Give DON to your Leader, dialog ⏐ DON to give, 1 of 3 active, spin button, 1: your Leader 6000 |  |  |
| 7 | `ArrowUp` | spinbutton "DON!! to give, 2 of 3 active": "2" | main | your Leader: 5000 right arrow 7000 this turn ⏐ DON to give, 2 of 3 active ⏐ 2: your Leader 7000 |  |  |
| 8 | `ArrowUp` | spinbutton "DON!! to give, 3 of 3 active": "3" | main | your Leader: 5000 right arrow 8000 this turn ⏐ DON to give, 3 of 3 active ⏐ 3: your Leader 8000 |  |  |
| 9 | `Enter` | button "Your Leader, Kaido, active, 8000 power, 3 DON!!, can attack" | main | You: Give 3 DON to Kaido. ⏐ Game board, turn 3, your main phase, game board ⏐ Your Leader row, grouping ⏐ Your Leader, Kaido, active, 8000 power, 3 DON , can attack, menu button, sub Menu |  | You: Give 3 DON!! to Kaido. |

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
| 1 | `Shift+Tab` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Characters, 3 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, menu button, sub Menu |  |  |
| 2 | `ArrowRight` | button "Your Kaido, active, 12000 power, cost 10, Blocker, can attack" | main | Your Kaido, active, 12000 power, cost 10, Blocker, can attack, menu button, sub Menu |  |  |
| 3 | `ArrowRight` | button "Your Black Maria, active, 2000 power, cost 3, ability ready" | main | Your Black Maria, active, 2000 power, cost 3, ability ready, menu button, sub Menu |  |  |
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
| 1 | `e` | button "Your Black Maria, active, 2000 power, cost 3" | waiting | You: End of turn. Opponent’s turn 4. Opponent: Refresh Draw 1 DON plus 2. ⏐ Opponent: Their King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested). |  | You: End of turn. Opponent’s turn 4. Opponent: Refresh · Draw 1 · DON!! +2. ⏐ Opponent: Their King: Add up to 1 active and up to 1 rested DON!! · Add 1 DON!! · Add 1 DON!! (rested). |
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
- Note: Planner text: Defend your Leader · Kaido attacks Attacker Kaido (their Leader) base 5000 Defender Your Leader no change 5000 ✕ Ties go to the attacker Need +1000 more What you have 3 Counter cards worth +5000. Ties go to the attacker (CR 7-1-4-1). Block No block Kaido 12000 · survives Kaido 12000 · survives Counter X.Drake +2000 Yamato +1000 Nola +2000 Select lit hand cards to stage · ties go to the attacker Cl
- Note: After Enter the decision is still "block".

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Tab` | log "Game log": | optional | Event log, region, Game log, grouping, list, with 3 items, Opp, Their King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested), Opp, Kaido attacks your Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Opp, Their Kaido: effect not used Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 2 | `Shift+Tab` | button "Use" | optional | Decision actions, decision actions ⏐ Use, button |  |  |
| 3 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 4 | `Enter` | heading "Defend your Leader · Kaido attacks" [level=2] | block | You: Your Kaido: effect not used. ⏐ Kaido attacks your Leader. Kaido 5000, your Leader 5000. You need 1000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. ⏐ unavailable ⏐ Opp, Kaido attacks your Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power ⏐ Defend your Leader Kaido attacks, region, Defend your Leader Kaido attacks, heading, clickable, level 2 |  | You: Your Kaido: effect not used. ⏐ (assertive) Kaido attacks your Leader. Kaido 5000, your Leader 5000. You need 1000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. |
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
| 9 | `Enter` | button "Activate Trigger" | trigger | Opponent: Hit 5000 vs 5000 ties go to the attacker. ⏐ Activate Trigger, button |  | Opponent: Hit · 5000 vs 5000 · ties go to the attacker. |
| 10 | `Enter` | button "Use" | optional | You: Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON . ⏐ Opponent: King attacks your Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Use, button |  | You: Life card trashed · your Life 3 → 2 · Trigger: Gum-Gum Lightning · Add 1 DON!!. ⏐ Opponent: King attacks your Leader · Your Kaido: Give up to 1 of your opponent's Characters −2000 power. |

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
- Note: Planner: Defend your Leader · King attacks Attacker King base 7000 Defender Your Leader no change 5000 ✕ Hit lands · your Life 2 → 1 Need +3000 more What you have 3 Counter cards worth +5000. 1 active DON!!: no Event Counter in hand to pay for. Block No block Kaido 12000 · survives Kaido 12000 · survives Cou
- Note: No control changes one staged Counter's target: staged Counters all go to the defender (the Leader, or the staged Blocker). "Change one counter's target" is not built.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Tab` | log "Game log": | optional | decision actions, Decision actions ⏐ Event log, region, Game log, grouping, list, with 3 items, Opp, Hit 5000 vs 5000 ties go to the attacker, You, Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON, Opp, King attacks your Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 2 | `Shift+Tab` | button "Use" | optional | Decision actions, decision actions ⏐ Use, button |  |  |
| 3 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 4 | `Enter` | heading "Defend your Leader · King attacks" [level=2] | block | You: Your Kaido: effect not used. ⏐ King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. ⏐ unavailable ⏐ You, Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON ⏐ Defend your Leader King attacks, region, Defend your Leader King attacks, heading, clickable, level 2 |  | You: Your Kaido: effect not used. ⏐ (assertive) King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 3 Counter cards worth 5000. Plan your defence. |
| 5 | `Tab` | button "No block" [pressed] | block | Block, grouping, No block, toggle button, pressed |  |  |
| 6 | ` ` | button "No block" [pressed] | block | No block. Your Leader 5000 against 7000: still hits. Need 3000 more. |  | No block. Your Leader 5000 against 7000: still hits. Need 3000 more. |
| 7 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 8 | `Tab` | button "Kaido 12000 · survives" | block | Kaido 12000 survives, toggle button, not pressed |  |  |
| 9 | `Tab` | button "X.Drake +2000" | block | Counter, grouping, X dot Drake plus 2000, toggle button, not pressed |  |  |
| 10 | ` ` | button "X.Drake +2000 ✓" [pressed] | block | Staged X dot Drake, plus 2000. Your Leader 7000 against 7000: tied: the attacker wins ties. Need 1000 more. ⏐ pressed |  | Staged X.Drake, plus 2000. Your Leader 7000 against 7000: tied: the attacker wins ties. Need 1000 more. |
| 11 | `Tab` | button "Yamato +1000" | block | Counter, grouping, Yamato plus 1000, toggle button, not pressed |  |  |
| 12 | `Tab` | button "Nola +2000" | block | Nola plus 2000, toggle button, not pressed |  |  |
| 13 | `Tab` | button "Clear Esc" | block | Clear, Esc, button |  |  |
| 14 | `Tab` | button "Play anyway , still hits" | block | Decision actions, decision actions ⏐ Play anyway , still hits, button |  |  |
| 15 | `Tab` | button "Take the hit , Life 2 → 1 · staging discarded" | block | Take the hit , Life 2 right arrow 1 staging discarded, button |  |  |
| 16 | `Shift+Tab` | button "Play anyway , still hits" | block | Play anyway , still hits, button |  |  |
| 17 | `Shift+Tab` | button "Clear Esc" | block | button, Clear ⏐ Clear, Esc, button |  |  |
| 18 | `Shift+Tab` | button "Nola +2000" | block | Counter, grouping, Nola plus 2000, toggle button, not pressed |  |  |
| 19 | `Shift+Tab` | button "Yamato +1000" | block | Yamato plus 1000, toggle button, not pressed |  |  |
| 20 | ` ` | button "Yamato +1000 ✓" [pressed] | block | Staged Yamato, plus 1000. Your Leader 8000 against 7000: the attack fails. ⏐ pressed |  | Staged Yamato, plus 1000. Your Leader 8000 against 7000: the attack fails. |
| 21 | `Tab` | button "Nola +2000" | block | Nola plus 2000, toggle button, not pressed |  |  |
| 22 | `Tab` | button "Clear Esc" | block | Clear, Esc, button |  |  |
| 23 | `Tab` | button "Take the hit , Life 2 → 1" | block | Decision actions, decision actions ⏐ Take the hit , Life 2 right arrow 1, button |  |  |
| 24 | `Tab` | button "Counter +3000 , survive · 8000 vs 7000" | block | Counter plus 3000 , survive 8000 vs 7000, button |  |  |
| 25 | `Enter` | button "Next move , the AI waits for you" | waiting | You: Counter: X dot Drake plus 2000 Counter: Yamato plus 1000. Opponent: Attack fails 7000 vs 8000. |  | You: Counter: X.Drake +2000 · Counter: Yamato +1000. Opponent: Attack fails · 7000 vs 8000. |
| 26 | `.` | button "Next move , the AI waits for you" | waiting | unavailable ⏐ Opponent: Give 1 DON to Yamato. |  | Opponent: Give 1 DON!! to Yamato. |
| 27 | `.` | button "Next move , the AI waits for you" | waiting | Opponent: Give 2 DON to Yamato. ⏐ unavailable |  | Opponent: Give 2 DON!! to Yamato. |
| 28 | `.` | button "Next move , the AI waits for you" | waiting | Opponent: Give 3 DON to Yamato. ⏐ unavailable |  | Opponent: Give 3 DON!! to Yamato. |
| 29 | `.` | heading "Your Main phase" [level=2] | main | Opponent’s turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2. Opponent: End of turn. Your turn 5. You: Refresh Draw: Basil Hawkins DON plus 1. ⏐ decision actions, Decision actions ⏐ urn, heading, clickable, level 2, You is |  | Opponent’s turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2. Opponent: End of turn. Your turn 5. You: Refresh · Draw: Basil Hawkins · DON!! +1. |

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

- Note: Confirm panel: Attack · Kaido → their Leader Attacker Kaido (your Leader) base 5000 Defender Their Leader no change 5000 Kaido 5000 against their Leader 5000. Result depends on [When Attacking]. Enter to attack, Escape to go back. Result depends on [When Attacking] · ties go to the attacker They need +1000 to survive · 2 cards in hand What they could have 1 active Blocker (Yamato): each stops one attack. Kaido: Give up to 1 of your opponent's Characters −2000 power 2 cards in hand: up to +8000 if each is one of their deck’s +4000 Counters. Ties go to the attacker (CR 7-1-4-1). Enter or click the target again to attack. Esc goes back. Cancel Esc Confirm attack Enter , 5000 vs 5000
- Note: Decision "optional": Optional effect Kaido: pay DON!! −1 to use this effect (Give up to 1 of your opponent's Characters −2000 power)? Skip Use Enter
- Note: Decision "choose": Choose Kaido: choose up to 1 of your opponent's Characters. 0 of up to 1 chosen ⌖ Basil Hawkins · 1000 ⌖ Yamato · 1000 ⌖ King · 7000 Reset Choose none Enter , 0 of 1
- Note: "." did nothing with focus on heading "Kaido attacks their Leader" [level=2] (in the decision panel, outside the board's application region). From here the script presses Enter on that button, as a user would.

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, can be played, menu button, sub Menu |  |  |
| 2 | `Shift+Tab` | button "Your Leader, Kaido, active, 5000 power, can attack" | main | Your Leader row, grouping ⏐ Your Leader, Kaido, active, 5000 power, can attack, menu button, sub Menu |  |  |
| 3 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, menu button, sub Menu |  |  |
| 4 | `ArrowRight` | button "Opponent’s King, rested, 7000 power, cost 6, can be targeted" | main | Opponent’s Characters, 3 of 5, grouping ⏐ Opponent’s King, rested, 7000 power, cost 6, can be targeted, menu button, sub Menu |  |  |
| 5 | `ArrowRight` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, menu button, sub Menu |  |  |
| 6 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Kaido 5000 against their Leader 5000. Result depends on When Attacking . Enter to attack, Escape to go back. |  | Kaido 5000 against their Leader 5000. Result depends on [When Attacking]. Enter to attack, Escape to go back. |
| 7 | `Enter` | button "Use" | optional | You: Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Decision actions, decision actions ⏐ Use, button |  | You: Kaido attacks their Leader · Your Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 8 | `Enter` | heading "Choose" [level=2] | choose | You: Return 1 DON to the DON deck. ⏐ heading, clickable, level 2, Choose ⏐ Choose, heading, clickable, level 2 |  | You: Return 1 DON!! to the DON!! deck. |
| 9 | `Tab` | button "Basil Hawkins · 1000" | choose | Candidates, grouping, Basil Hawkins 1000, toggle button, not pressed |  |  |
| 10 | `Enter` | button "Basil Hawkins · 1000 ✓ 1" [pressed] | choose | 1 of up to 1 chosen ⏐ pressed |  |  |
| 11 | `Tab` | button "Yamato · 1000" | choose | Yamato 1000, toggle button, not pressed |  |  |
| 12 | `Tab` | button "King · 7000" | choose | King 7000, toggle button, not pressed |  |  |
| 13 | `Tab` | button "Reset" | choose | Decision actions, decision actions ⏐ Reset, button |  |  |
| 14 | `Tab` | button "Done , 1 of 1" | choose | Done , 1 of 1, button |  |  |
| 15 | `Enter` | heading "Kaido attacks their Leader" [level=2] | waiting | You: Basil Hawkins minus 2000 Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ out of grouping, decision actions, Decision actions ⏐ Kaido attacks their Leader, heading, clickable, level 2 |  | You: Basil Hawkins −2000 · Their Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 16 | `.` | heading "Kaido attacks their Leader" [level=2] | waiting |  |  |  |
| 17 | `Shift+Tab` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power" | waiting | Game board, turn 5, your battle phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, menu button, sub Menu |  |  |
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
| 1 | `Enter` | heading "Kaido attacks their Leader" [level=2] | waiting | You: Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active Add 1 DON Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active. ⏐ Kaido attacks their Leader, heading, clickable, level 2 |  | You: Your Kaido: Add up to 1 active DON!!; then set up to 1 of your DON!! active · Add 1 DON!! · Your Kaido: Add up to 1 active DON!!; then set up to 1 of your DON!! active. ⏐ Opponent: Counter: Nola +2000. |
| 2 | `Shift+Tab` | button "Your Nola, Character, cost 1, Counter +2000, 2000 power, can be played" | main | Opponent: Counter: Nola plus 2000. ⏐ Game board, turn 5, your battle phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Nola, Character, cost 1, Counter plus 2000, 2000 power, menu button, sub Menu ⏐ You: Attack fails 5000 vs 7000. |  | You: Attack fails · 5000 vs 7000. |
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
| 1 | `ArrowRight` | button "Your Queen, Character, cost 9, 10000 power, Banish, can be played" | main | Your Queen, Character, cost 9, 10000 power, Banish, can be played, menu button, sub Menu |  |  |
| 2 | `Enter` | menuitem "Play · rest 9 DON!!" | main | heading, clickable, level 2, Queen selected ⏐ Play rest 9 DON, P, 1 of 2 |  |  |
| 3 | `Enter` | button "Use" | optional | You: Played Queen, rested 9 DON Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack. ⏐ Game board, turn 5, your main phase, game board ⏐ Your hand, 2 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, menu button, sub Menu ⏐ Decision actions, decision actions ⏐ Use, button |  | You: Played Queen, rested 9 DON!! · Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack. |
| 4 | `Enter` | heading "Choose" [level=2] | choose | Choose, region, Choose, heading, clickable, level 2 |  |  |
| 5 | `Tab` | button "Active DON!! in your cost area (1)" | choose | Options, grouping, Active DON in your cost area (1), button |  |  |
| 6 | `Enter` | heading "Choose" [level=2] | choose | You: Return 1 DON to the DON deck Draw 1. ⏐ Choose, heading, clickable, level 2 |  | You: Return 1 DON!! to the DON!! deck · Draw 1. |
| 7 | `Tab` | button "Basil Hawkins · −1000" | choose | Candidates, grouping, Basil Hawkins minus 1000, toggle button, not pressed |  |  |
| 8 | `Tab` | button "Yamato · 1000" | choose | Yamato 1000, toggle button, not pressed |  |  |
| 9 | `Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 10 | `Tab` | button "Reset" [disabled] | choose | Decision actions, decision actions ⏐ Reset, button, unavailable |  |  |
| 11 | `Tab` | button "Choose none , 0 of 2" | choose | Choose none , 0 of 2, button |  |  |
| 12 | `Tab` | log "Game log": | choose | button, unavailable, King cost 6 7000: can’t be chosen for this effect ⏐ Event log, region, Game log, grouping, list, with 3 items, You, Attack fails 5000 vs 7000, You, Play Queen 9 DON Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, You, Return 1 DON to the DON deck Draw 1 |  |  |
| 13 | `Shift+Tab` | button "Choose none , 0 of 2" | choose | Decision actions, decision actions ⏐ Choose none , 0 of 2, button |  |  |
| 14 | `Shift+Tab` | button "Reset" [disabled] | choose | Reset, button, unavailable |  |  |
| 15 | `Shift+Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | You, Attack fails 5000 vs 7000 ⏐ Choose, region, Candidates, grouping, King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 16 | `Shift+Tab` | button "Yamato · 1000" | choose | Yamato 1000, toggle button, not pressed |  |  |
| 17 | `Enter` | button "Yamato · 1000 ✓ 1" [pressed] | choose | 1 of up to 2 chosen ⏐ pressed |  |  |
| 18 | `Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 19 | `Tab` | button "Reset" | choose | Decision actions, decision actions ⏐ Reset, button |  |  |
| 20 | `Tab` | button "Done , 1 of 2" | choose | Done , 1 of 2, button |  |  |
| 21 | `Tab` | log "Game log": | choose | button, unavailable, King cost 6 7000: can’t be chosen for this effect ⏐ Event log, region, Game log, grouping, list, with 3 items, You, Attack fails 5000 vs 7000, You, Play Queen 9 DON Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, You, Return 1 DON to the DON deck Draw 1 |  |  |
| 22 | `Shift+Tab` | button "Done , 1 of 2" | choose | Decision actions, decision actions ⏐ Done , 1 of 2, button |  |  |
| 23 | `Shift+Tab` | button "Reset" | choose | Reset, button |  |  |
| 24 | `Shift+Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | You, Attack fails 5000 vs 7000 ⏐ Choose, region, Candidates, grouping, King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 25 | `Shift+Tab` | button "Yamato · 1000 ✓ 1" [pressed] | choose | Yamato 1000 check 1, toggle button, pressed |  |  |
| 26 | `Shift+Tab` | button "Basil Hawkins · −1000" | choose | Basil Hawkins minus 1000, toggle button, not pressed |  |  |
| 27 | `Enter` | button "Basil Hawkins · −1000 ✓ 2" [pressed] | choose | 2 of up to 2 chosen ⏐ pressed |  |  |
| 28 | `Tab` | button "Yamato · 1000 ✓ 1" [pressed] | choose | Yamato 1000 check 1, toggle button, pressed |  |  |
| 29 | `Tab` | 'button "King · cost 6 · 7000: can’t be chosen for this effect" [disabled]' | choose | King cost 6 7000: can’t be chosen for this effect, button, unavailable |  |  |
| 30 | `Tab` | button "Reset" | choose | Decision actions, decision actions ⏐ Reset, button |  |  |
| 31 | `Tab` | button "Done , 2 of 2" | choose | Done , 2 of 2, button |  |  |
| 32 | `Enter` | button "End turn , 3 can attack · 0 DON!! unused" | main | You: Basil Hawkins cannot attack Yamato cannot attack. |  | You: Basil Hawkins cannot attack · Yamato cannot attack. |

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
- Note: Chose: radio "Attack fails · 5000 vs 7000" [checked]
- Note: After the rewind: decision "main"; focus: button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power, can be played"

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Shift+Tab` | button "⟲ Rewind" | main | ⟲ Rewind, button, U |  |  |
| 2 | `Shift+Tab` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | main | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, menu button, sub Menu |  |  |
| 3 | `U` | heading "Choose" [level=2] | choose | Rewound. Back to: before Basil Hawkins cannot attack Yamato cannot attack. Same shuffle: rewinding won’t change your draws. ⏐ out of grouping, Candidates, grouping, button, unavailable, King cost 6 7000: can’t be chosen for this effect ⏐ Choose, heading, clickable, level 2 |  | Rewound. Back to: before Basil Hawkins cannot attack · Yamato cannot attack. Same shuffle: rewinding won’t change your draws. |
| 4 | `Shift+Tab` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | choose | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, menu button, sub Menu |  |  |
| 5 | `r` | radio "Return 1 DON!! to the DON!! deck · Draw 1" | choose | Rewind to before a move, dialog, Rewinding is deterministic: the same shuffle, so the same draws. Rewound games don’t count in your win rate. ￼Return 1 DON to the DON deck Draw 1 ￼Play Queen 9 DON Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack ￼Attack fails 5000 vs 7000 ￼Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active Add 1 DON Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active ￼Basil Hawkins minus 2000 Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power ￼Return 1 DON to the DON deck ￼Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power ￼Refresh Draw: Basil Hawkins DON plus 1 ￼Counter: X dot Drake plus 2000 Counter: Yamato plus 1000 ￼Your Kaido: effect not used ￼Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON ￼Your Kaido: effect not used ￼End of turn ￼Give 3 DON to Kaido ￼Play Black Maria 3 DON ⏐ Your moves, newest first, grouping ⏐ Rewind to before a move, dialog, Rewinding is deterministic: the same shuffle, so the same draws. Rewound games don’t count in your win rate. ￼Return 1 DON to the DON deck Draw 1 ￼Play Queen 9 DON Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack ￼Attack fails 5000 vs 7000 ￼Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active Add 1 DON Your Kaido: Add up to 1 active DON ; then set up to 1 of your DON active ￼Basil Hawkins minus 2000 Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power ￼Return 1 DON to the DON deck ￼Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power ￼Refresh Draw: Basil Hawkins DON plus 1 ￼Counter: X dot Drake plus 2000 Counter: Yamato plus 1000 ￼Your Kaido: effect not used ￼Life card trashed your Life 3 right arrow 2 Trigger: Gum-Gum Lightning Add 1 DON ￼Your Kaido: effect not used ￼End of turn ￼Give 3 DON to Kaido ￼Play Black Maria 3 DON ⏐ Your moves, newest first, grouping ⏐ Return 1 DON to the DON deck Draw 1, radio button, not checked, 1 of 15 |  |  |
| 6 | `ArrowDown` | 'radio "Play Queen · 9 DON!! · Your Queen: Draw 1; up to 2 of your opponent''s Characters with a cost of 5 or less cannot attack" [checked]' | choose | Play Queen 9 DON Your Queen: Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack, radio button, checked, 2 of 15 |  |  |
| 7 | `ArrowDown` | radio "Attack fails · 5000 vs 7000" [checked] | choose | Attack fails 5000 vs 7000, radio button, checked, 3 of 15 |  |  |
| 8 | `Tab` | button "Cancel" | choose | Cancel, button |  |  |
| 9 | `Tab` | button "Rewind to before it" | choose | Rewind to before it, button |  |  |
| 10 | `Enter` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power, can be played" | main | Game board, turn 5, your battle phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, menu button, sub Menu ⏐ You: Attack fails 5000 vs 7000. ⏐ Rewound. Back to: before attack fails 5000 vs 7000. |  | Rewound. Back to: before attack fails · 5000 vs 7000. ⏐ You: Attack fails · 5000 vs 7000. ⏐ Rewound. Back to: before attack fails · 5000 vs 7000. |

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
| 1 | `?` | button "Close (Escape)": ✕ | main | Keyboard shortcuts, dialog, Single-key shortcuts work while focus is on the board or the decision panel. In a defence, Enter commits only a Counter that stops the attack or a block; Take the hit needs focus, then Enter. With NVDA, the buttons at the foot of the decision panel are in focus mode, so these keys work there; in the panel’s text, press NVDA plus Space first. play button can be played crossed swords can attack black diamond can receive DON ⌖ can be targeted high voltage ability ready ⛨ Blocker » Rush »C Rush: Character times 2 Double Attack circled division slash Banish ⤳ Unblockable T Trigger ⏐ Close (Escape), button ⏐ Keyboard shortcuts, dialog, Single-key shortcuts work while focus is on the board or the decision panel. In a defence, Enter commits only a Counter that stops the attack or a block; Take the hit needs focus, then Enter. With NVDA, the buttons at the foot of the decision panel are in focus mode, so these keys work there; in the panel’s text, press NVDA plus Space first. play button can be played crossed swords can attack black diamond can receive DON ⌖ can be targeted high voltage ability ready ⛨ Blocker » Rush »C Rush: Character times 2 Double Attack circled division slash Banish ⤳ Unblockable T Trigger ⏐ button, Close (Escape) |  |  |
| 2 | `Escape` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power, can be played" | main | Game board, turn 5, your main phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, can be played, menu button, sub Menu |  |  |

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

- Note: Final panel: Game over You win · Turn 7 Their Leader was hit at 0 Life (CR 9-2-1-1). Rewound: not counted in your win rate. Review this game New game Rematch Enter
- Note: Review reached by Tab: button "Review this game"
- Harness assist: step 18 drives the game: focus an attacker
- Harness assist: step 18 drives the game: focus an attacker
- Harness assist: step 18 drives the game: focus an attacker
- Harness assist: step 18 drives the game: focus an attacker
- Harness assist: step 18 drives the game: focus an attacker

| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, menu button, sub Menu |  |  |
| 2 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Kaido 12000 against their Leader 5000: hits unless they counter. Enter to attack, Escape to go back. |  | Kaido 12000 against their Leader 5000: hits unless they counter. Enter to attack, Escape to go back. |
| 3 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting | You: Kaido attacks their Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power. |  | You: Kaido attacks their Leader · Their Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 4 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | main | Opponent: Return 1 DON to the DON deck. ⏐ Opponent: Return 1 DON to the DON deck Kaido minus 2000. ⏐ Opponent: Block: Yamato. ⏐ You: Hit 10000 vs 1000 K dot O. Their Yamato. ⏐ Your Characters, 3 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, menu button, sub Menu |  | Opponent: Return 1 DON!! to the DON!! deck. ⏐ Opponent: Return 1 DON!! to the DON!! deck · Kaido −2000. ⏐ Opponent: Block: Yamato. ⏐ You: Hit · 10000 vs 1000 · K.O. · Their Yamato. |
| 5 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, menu button, sub Menu |  |  |
| 6 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Kaido 12000 against their Leader 5000: hits unless they counter. Enter to attack, Escape to go back. |  | Kaido 12000 against their Leader 5000: hits unless they counter. Enter to attack, Escape to go back. |
| 7 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting | You: Kaido attacks their Leader. |  | You: Kaido attacks their Leader. |
| 8 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | main | You: Hit 12000 vs 5000. ⏐ Opponent: Life card to hand their Life 2 right arrow 1. ⏐ Your Characters, 3 of 5, grouping ⏐ Your Black Maria, active, 2000 power, cost 3, can attack, menu button, sub Menu |  | You: Hit · 12000 vs 5000. ⏐ Opponent: Life card to hand · their Life 2 → 1. |
| 9 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, can be targeted, menu button, sub Menu |  |  |
| 10 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, can be targeted" | main | Black Maria 2000 against their Leader 5000: fails unless you gain power. Enter to attack, Escape to go back. |  | Black Maria 2000 against their Leader 5000: fails unless you gain power. Enter to attack, Escape to go back. |
| 11 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power" | waiting | You: Black Maria attacks their Leader. |  | You: Black Maria attacks their Leader. |
| 12 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power" | main | You: Attack fails 2000 vs 5000. |  | You: Attack fails · 2000 vs 5000. |
| 13 | `Tab` | button "Opponent’s King, rested, 7000 power, cost 6" | main | Opponent’s Characters, 2 of 5, grouping ⏐ Opponent’s King, rested, 7000 power, cost 6, menu button, sub Menu |  |  |
| 14 | `Tab` | button "Turn 5 · Your turn, main phase" | main | Turn and phase, grouping ⏐ Turn 5 Your turn, main phase, button |  |  |
| 15 | `Tab` | button "Your Black Maria, rested, 2000 power, cost 3, ability ready" | main | Your Characters, 3 of 5, grouping ⏐ Your Black Maria, rested, 2000 power, cost 3, ability ready, menu button, sub Menu |  |  |
| 16 | `Tab` | button "Your Leader, Kaido, rested, 5000 power" | main | Your Leader row, grouping ⏐ Your Leader, Kaido, rested, 5000 power, menu button, sub Menu |  |  |
| 17 | `Tab` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power, can be played" | main | Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, can be played, menu button, sub Menu |  |  |
| 18 | `e` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | You: End of turn. Opponent’s turn 6. Opponent: Refresh Draw 1 DON plus 2. ⏐ Opponent: Their King: Add up to 1 active and up to 1 rested DON Add 1 DON Add 1 DON (rested). |  | You: End of turn. Opponent’s turn 6. Opponent: Refresh · Draw 1 · DON!! +2. ⏐ Opponent: Their King: Add up to 1 active and up to 1 rested DON!! · Add 1 DON!! · Add 1 DON!! (rested). |
| 19 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | Opponent: Give 1 DON to Kaido. |  | Opponent: Give 1 DON!! to Kaido. |
| 20 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | Opponent: Give 1 DON to Basil Hawkins. |  | Opponent: Give 1 DON!! to Basil Hawkins. |
| 21 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | Opponent: Give 2 DON to Basil Hawkins. |  | Opponent: Give 2 DON!! to Basil Hawkins. |
| 22 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | Opponent: Give 3 DON to Basil Hawkins. |  | Opponent: Give 3 DON!! to Basil Hawkins. |
| 23 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | Opponent: Give 4 DON to Basil Hawkins. |  | Opponent: Give 4 DON!! to Basil Hawkins. |
| 24 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | Opponent: Give 5 DON to Basil Hawkins. |  | Opponent: Give 5 DON!! to Basil Hawkins. |
| 25 | `.` | button "Your Basil Hawkins, Character, cost 3, Counter +2000, 1000 power" | waiting | Opponent: Kaido attacks your Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power. |  | Opponent: Kaido attacks your Leader · Their Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 26 | `.` | button "Use" | optional | Opponent: Their Kaido: effect not used Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Decision actions, decision actions ⏐ Use, button |  | Opponent: Their Kaido: effect not used · Your Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 27 | `Tab` | log "Game log": | optional | out of region, clickable, main landmark, heading, level 1, OPTCG Sim game: You vs Kaido ⏐ Event log, region, Game log, grouping, list, with 3 items, Opp, Give 5 DON to Basil Hawkins, Opp, Kaido attacks your Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power, Opp, Their Kaido: effect not used Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 28 | `Shift+Tab` | button "Use" | optional | Decision actions, decision actions ⏐ Use, button |  |  |
| 29 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 30 | `Enter` | heading "Defend your Leader · Kaido attacks" [level=2] | counter | You: Your Kaido: effect not used. ⏐ Kaido attacks your Leader. Kaido 6000, your Leader 5000. You need 2000 to stop it. You have 2 Counter cards worth 4000. Plan your defence. ⏐ unavailable ⏐ Opp, Kaido attacks your Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power ⏐ Defend your Leader Kaido attacks, region, Defend your Leader Kaido attacks, heading, clickable, level 2 |  | You: Your Kaido: effect not used. ⏐ (assertive) Kaido attacks your Leader. Kaido 6000, your Leader 5000. You need 2000 to stop it. You have 2 Counter cards worth 4000. Plan your defence. |
| 31 | `Tab` | button "Nola +2000" | counter | Counter, grouping, Nola plus 2000, toggle button, not pressed |  |  |
| 32 | `Tab` | button "Basil Hawkins +2000" | counter | Basil Hawkins plus 2000, toggle button, not pressed |  |  |
| 33 | `Tab` | button "Clear Esc" [disabled] | counter | Clear, Esc, button, unavailable |  |  |
| 34 | `Tab` | button "Counter , Stage a lit hand card" [disabled] | counter | Decision actions, decision actions ⏐ Counter , Stage a lit hand card, button, unavailable |  |  |
| 35 | `Tab` | button "Take the hit , Life 2 → 1" | counter | Take the hit , Life 2 right arrow 1, button |  |  |
| 36 | `Enter` | button "Activate Trigger" | trigger | Opponent: Hit 6000 vs 5000. ⏐ Activate Trigger, button |  | Opponent: Hit · 6000 vs 5000. |
| 37 | `Enter` | button "Use" | optional | You: Life card trashed your Life 2 right arrow 1 Trigger: Slow-Slow Beam Sword. ⏐ Opponent: Basil Hawkins attacks your Black Maria Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power. ⏐ Use, button |  | You: Life card trashed · your Life 2 → 1 · Trigger: Slow-Slow Beam Sword. ⏐ Opponent: Basil Hawkins attacks your Black Maria · Your Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 38 | `Tab` | log "Game log": | optional | decision actions, Decision actions ⏐ Event log, region, Game log, grouping, list, with 3 items, Opp, Hit 6000 vs 5000, You, Life card trashed your Life 2 right arrow 1 Trigger: Slow-Slow Beam Sword, Opp, Basil Hawkins attacks your Black Maria Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 39 | `Shift+Tab` | button "Use" | optional | Decision actions, decision actions ⏐ Use, button |  |  |
| 40 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 41 | `Enter` | heading "Defend Black Maria · Basil Hawkins attacks" [level=2] | counter | You: Your Kaido: effect not used. ⏐ Basil Hawkins attacks Black Maria. Basil Hawkins 6000, Black Maria 2000. You need 5000 to stop it. You have 2 Counter cards worth 4000. Plan your defence. ⏐ unavailable ⏐ You, Life card trashed your Life 2 right arrow 1 Trigger: Slow-Slow Beam Sword ⏐ Defend Black Maria Basil Hawkins attacks, region, Defend Black Maria Basil Hawkins attacks, heading, clickable, level 2 |  | You: Your Kaido: effect not used. ⏐ (assertive) Basil Hawkins attacks Black Maria. Basil Hawkins 6000, Black Maria 2000. You need 5000 to stop it. You have 2 Counter cards worth 4000. Plan your defence. |
| 42 | `Tab` | button "Nola +2000" | counter | Counter, grouping, Nola plus 2000, toggle button, not pressed |  |  |
| 43 | `Tab` | button "Basil Hawkins +2000" | counter | Basil Hawkins plus 2000, toggle button, not pressed |  |  |
| 44 | `Tab` | button "Clear Esc" [disabled] | counter | Clear, Esc, button, unavailable |  |  |
| 45 | `Tab` | button "Counter , Stage a lit hand card" [disabled] | counter | Decision actions, decision actions ⏐ Counter , Stage a lit hand card, button, unavailable |  |  |
| 46 | `Tab` | button "Take the hit , Black Maria K.O.’d" | counter | Take the hit , Black Maria K dot O. d, button |  |  |
| 47 | `Enter` | button "Next move , the AI waits for you" | waiting | Opponent: Hit 6000 vs 2000 K dot O. Your Black Maria. |  | Opponent: Hit · 6000 vs 2000 · K.O. · Your Black Maria. |
| 48 | `Enter` | button "Use" | optional | unavailable ⏐ Opponent: King attacks your Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power. |  | Opponent: King attacks your Leader · Your Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 49 | `Tab` | log "Game log": | optional | decision actions, Decision actions ⏐ Event log, region, Game log, grouping, list, with 3 items, You, Your Kaido: effect not used, Opp, Hit 6000 vs 2000 K dot O. Your Black Maria, Opp, King attacks your Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power |  |  |
| 50 | `Shift+Tab` | button "Use" | optional | Decision actions, decision actions ⏐ Use, button |  |  |
| 51 | `Shift+Tab` | button "Skip" | optional | Skip, button |  |  |
| 52 | `Enter` | heading "Defend your Leader · King attacks" [level=2] | counter | You: Your Kaido: effect not used. ⏐ King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 2 Counter cards worth 4000. Plan your defence. ⏐ unavailable ⏐ Opp, Hit 6000 vs 2000 K dot O. Your Black Maria ⏐ Defend your Leader King attacks, region, Defend your Leader King attacks, heading, clickable, level 2 |  | You: Your Kaido: effect not used. ⏐ (assertive) King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 2 Counter cards worth 4000. Plan your defence. |
| 53 | `Tab` | button "Nola +2000" | counter | Counter, grouping, Nola plus 2000, toggle button, not pressed |  |  |
| 54 | `Tab` | button "Basil Hawkins +2000" | counter | Basil Hawkins plus 2000, toggle button, not pressed |  |  |
| 55 | `Tab` | button "Clear Esc" [disabled] | counter | Clear, Esc, button, unavailable |  |  |
| 56 | `Tab` | button "Counter , Stage a lit hand card" [disabled] | counter | Decision actions, decision actions ⏐ Counter , Stage a lit hand card, button, unavailable |  |  |
| 57 | `Tab` | button "Take the hit , Life 1 → 0" | counter | Take the hit , Life 1 right arrow 0, button |  |  |
| 58 | `Enter` | button "Activate Trigger" | trigger | Opponent: Hit 7000 vs 5000. ⏐ Activate Trigger, button |  | Opponent: Hit · 7000 vs 5000. |
| 59 | `Enter` | button "Skip to my decision" | waiting | You: Life card trashed your Life 1 right arrow 0 Trigger: Wo Ro Ro Ro Ro... I Think I've Sobered Up Return 1 DON to the DON deck Draw 2. |  | You: Life card trashed · your Life 1 → 0 · Trigger: Wo Ro Ro Ro Ro... I Think I've Sobered Up · Return 1 DON!! to the DON!! deck · Draw 2. |
| 60 | `Enter` | button "⟲ Rewind" | main | Skipped 2 moves. Opponent: End of turn. You: Refresh Draw: Queen DON plus 1. ⏐ Game board, turn 7, your main phase, game board ⏐ Your Characters, 2 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, menu button, sub Menu |  | Skipped 2 moves. Opponent: End of turn. You: Refresh · Draw: Queen · DON!! +1. |
| 61 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, 1 DON!! (no bonus on the opponent’s turn), can be targeted" | main | Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, 1 DON (no bonus on the opponent’s turn), can be targeted, menu button, sub Menu |  |  |
| 62 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, 1 DON!! (no bonus on the opponent’s turn), can be targeted" | main | Kaido 12000 against their Leader 5000: hits unless they counter. Enter to attack, Escape to go back. |  | Kaido 12000 against their Leader 5000: hits unless they counter. Enter to attack, Escape to go back. |
| 63 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, 1 DON!! (no bonus on the opponent’s turn)" | waiting | You: Kaido attacks their Leader Their Kaido: Give up to 1 of your opponent's Characters minus 2000 power. |  | You: Kaido attacks their Leader · Their Kaido: Give up to 1 of your opponent's Characters −2000 power. |
| 64 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power, 1 DON!! (no bonus on the opponent’s turn)" | waiting | Opponent: Return 1 DON to the DON deck. ⏐ Opponent: Return 1 DON to the DON deck Kaido minus 2000. |  | Opponent: Return 1 DON!! to the DON!! deck. ⏐ Opponent: Return 1 DON!! to the DON!! deck · Kaido −2000. ⏐ You: Hit · 10000 vs 5000. |
| 65 | `.` | button "Opponent’s Leader, Kaido, rested, 5000 power, 1 DON!! (no bonus on the opponent’s turn)" | main | You: Hit 10000 vs 5000. ⏐ Opponent: Life card trashed their Life 1 right arrow 0 Trigger: Slow-Slow Beam Sword Add 1 DON . ⏐ Your Characters, 2 of 5, grouping ⏐ Your Kaido, active, 12000 power, cost 10, Blocker, can attack, menu button, sub Menu |  | Opponent: Life card trashed · their Life 1 → 0 · Trigger: Slow-Slow Beam Sword · Add 1 DON!!. |
| 66 | `a` | button "Opponent’s Leader, Kaido, rested, 5000 power, 1 DON!! (no bonus on the opponent’s turn), can be targeted" | main | Opponent’s Leader row, grouping ⏐ Opponent’s Leader, Kaido, rested, 5000 power, 1 DON (no bonus on the opponent’s turn), can be targeted, menu button, sub Menu |  |  |
| 67 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, 1 DON!! (no bonus on the opponent’s turn), can be targeted" | main | Kaido 12000 against their Leader 5000: hits unless they counter. Enter to attack, Escape to go back. |  | Kaido 12000 against their Leader 5000: hits unless they counter. Enter to attack, Escape to go back. |
| 68 | `Enter` | button "Opponent’s Leader, Kaido, rested, 5000 power, 1 DON!! (no bonus on the opponent’s turn)" | waiting | You: Kaido attacks their Leader. |  | You: Kaido attacks their Leader. |
| 69 | `.` | heading "Game over" [level=2] | over | Game over. You win on turn 7. ⏐ Rematch, or New game. ⏐ decision actions, Decision actions ⏐ Game over, heading, clickable, level 2 |  | You: Hit · 12000 vs 5000. Game over · You win. ⏐ Rematch, or New game. ⏐ (assertive) Game over. You win on turn 7. |
| 70 | `Tab` | button "Review this game" | over | Review this game, button |  |  |

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

</details>
