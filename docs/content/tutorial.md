---
title: "Guided tutorial: the eight steps"
asOf: 2026-11-25
confidence: high
sources:
  - docs/research/rules-digest.md
  - docs/design/flows.md
  - docs/design/learning-ui.md
  - docs/content/curriculum.md
  - CR 3-1-1
  - CR 3-1-4
  - CR 6-3-1
  - CR 6-4-1
  - CR 6-5-3-1
  - CR 6-5-4
  - CR 6-5-5-2
  - CR 6-5-6-1
  - CR 7-1-1-1
  - CR 7-1-2-1
  - CR 7-1-3-1
  - CR 7-1-4-1
  - CR 7-1-4-1-1-1
  - CR 7-1-4-1-1-2
  - CR 10-1-5-1
---

# Guided tutorial: the eight steps

The words the tutorial shows, one block per step. The player is Starter Deck ST-21 (Monkey.D.Luffy) and always goes second; the opponent is ST-22 (Ace & Newgate) and follows a script. Each `intro` is the lesson in two sentences; `prompt` is the exact pointer input and `keys` the exact keyboard input the game itself uses (docs/design/flows.md F2, "the tutorial teaches only real inputs"); `blocked` is shown when the player tries something else; `done` is shown when the step's goal is reached; `rule` is the rule it rests on. A number in braces is read from the board when the words are shown, never typed in. Step 8 gives no input hint on purpose: it is the graduation test.

## t1-zones

- title: The zones
- intro: The board is split into zones, and each zone holds one kind of card. Look at all nine on your side, from your Leader to your hand.
- prompt: Click each lit zone on your side, one after another. {visited} of 9 visited.
- keys: Or press G then L to reach your Leader row, then use the arrow keys: Left and Right along a row, Up and Down between rows.
- done: That is the whole board. Your Life is how many hits you can take, and the player who is hit at 0 Life loses.
- rule: CR 3-1-1
- zone.leader: Leader: starts the game face up and stays there. It sets your colours and your Life, and it can attack.
- zone.characters: Characters: the cards you play. They can attack and block, up to five at a time.
- zone.stage: Stage: one lasting card with an ongoing effect. None is in play here.
- zone.life: Life: your face-down cards. Each hit that lands takes the top one into your hand.
- zone.deck: Deck: you draw from it at the start of each turn.
- zone.trash: Trash: where used and defeated cards go, face up.
- zone.donDeck: DON!! deck: the DON!! cards you have not got yet. Two arrive each turn.
- zone.costArea: Cost area: your DON!!. Active ones pay for cards; rested ones are used up until your next turn.
- zone.hand: Hand: cards only you can see. Play them with DON!!, or use a Counter from here when you are attacked.

## t2-first-turn

- title: Your first turn
- intro: Each turn you draw a card, take 2 DON!!, and then spend DON!! to play cards: a card costs as many DON!! as its cost. You go second, so you have {donActive} DON!! to spend and your hand has {hand} cards, but nobody can attack on their own first turn.
- prompt: Click Jinbe in your hand, then choose Play.
- keys: Or press G then H to reach your hand, where Jinbe is first, press Enter, then P.
- blocked: Not yet. First, play Jinbe: he costs 2 and you have {donActive} DON!! active.
- done: Jinbe is in play, and his cost is why {donActive} DON!! is left to spend. He cannot attack this turn.
- rule: CR 6-5-3-1

## t3-don-and-power

- title: DON!! and power
- intro: Each DON!! you give to a card adds 1000 power to it, but only during your turn. Give one to your Leader, which shows {leaderPower} now, and watch the number.
- prompt: Click your DON!! cost area, then click your Leader.
- keys: Or press G then L, press Right until your Leader is focused, press plus, then Enter.
- blocked: Not yet. First, give 1 DON!! to your Leader.
- done: Your Leader shows {leaderPower}, which is its {leaderBase} plus 1000 for the DON!! on it. On your opponent's turn it shows {leaderBase} again.
- rule: CR 6-5-5-2

## t4-attack

- title: Attacking the Leader
- intro: To attack, rest one of your active cards and pick their Leader or one of their rested Characters. If your power is at least theirs, the attack hits and they take a Life card into their hand.
- prompt: Click your Leader, choose Attack, click their Leader, then press Confirm attack.
- keys: Or press G then L, press Right until your Leader is focused, press A, then Enter on their Leader, then Enter on Confirm attack.
- blocked: Not yet. First, attack their Leader with your Leader: their active Character cannot be attacked.
- done: Your Leader's {leaderPower} against their Leader's {theirPower} is a tie, and a tie goes to the attacker, so it hit. They now have {oppLife} Life.
- rule: CR 7-1-4-1

## t5-defend

- title: Being attacked
- intro: When they attack you may block with a Blocker, play Counter cards from your hand, or take the hit. Their Leader has {theirPower} and yours has {leaderPower}, and a tie goes to the attacker, so yours must end up higher than theirs.
- prompt: Click Jinbe in your hand to stage him, then press Counter.
- keys: Or press G then H, press Space on Jinbe to stage him, then press P and Enter.
- blocked: Not in this step: this one teaches countering. Stage Jinbe, then press Counter.
- done: Jinbe's Counter lifted your Leader above their {theirPower}, so the attack failed and you still have {life} Life.
- rule: CR 7-1-3-1

## t6-trigger

- title: Triggers
- intro: Some Life cards have a [Trigger]. When a hit takes one, you may reveal it and use its effect instead of adding it to your hand.
- prompt: Choose Take the hit. When the Life card shows, choose Activate to use its Trigger, or Add to hand to keep the card.
- keys: Or press Tab until you reach Take the hit and press Enter. For the Trigger, press Enter on Activate Trigger, or Tab and Enter to add the card to your hand.
- blocked: Not yet. First, take the hit: you have no Counter to play.
- done: The hit took 1 Life, so you have {life} left. Activate uses the card's [Trigger] without paying anything; Add to hand keeps the card for later.
- rule: CR 10-1-5-1

## t7-leader

- title: Your Leader's ability
- intro: A Leader can have an ability of its own, and Luffy's [Activate: Main] works once each turn while he has 1 DON!! on him. It gives up to 2 of your rested DON!! to one of your Characters.
- prompt: Click your Leader and choose Activate: Main, then give 2 DON!! and pick your Character.
- keys: Or press G then L, press Right until your Leader is focused, press Enter, then E, and Tab to 2 DON!! and press Enter.
- blocked: Not yet. First, use your Leader's Activate: Main.
- done: That Character now has {donOnCharacter} DON!! and shows {characterPower} this turn. The Leader decides how a deck plays, so read yours.
- rule: CR 6-5-4

## t8-winning

- title: Winning
- intro: They have {oppLife} Life, no Blockers and no cards in hand. You win when a hit lands on them at 0 Life, so work out how many hits you need.
- prompt: No hints this time. Win the game.
- keys: Everything you learned works the same from the keyboard.
- done: You win. The first hit took their last Life card, and the second landed at 0 Life, which wins the game.
- failed: Not quite. Your turn ended and they are still in the game, so the step starts again. You need one hit more than they have Life, and every attacker counts.
- rule: CR 7-1-4-1-1-1
