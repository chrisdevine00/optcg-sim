---
title: Strategy concepts for the coach and the AI heuristic
asOf: 2026-10-28
track: Phase 1, Track D (part 2)
confidence: medium (see "Source quality" below)
---

# Strategy concepts: research notes

**As of:** 2026-10-28. The format is English, with OP17 as the latest set per PROMPT.md. Rules are cited from the Comprehensive Rules v1.2.1, last updated 2026-08-28.

**How to read this file**
- Every non-obvious claim carries a citation tag such as `[S7]`. The tags resolve in "Pages opened" below.
- `(inference)` marks my own reasoning. It is not a sourced claim.
- `[CR x-y-z]` cites the official Comprehensive Rules. A rules citation is a fact. A strategy citation is one creator's opinion unless two sources agree.
- "AI feature" proposals and every weight or threshold I suggest are inferences. They need tuning in self-play before anyone trusts them.

## Source quality (read first)

Strong, opinion-rich community sources were hard to reach on 2026-10-28:
- Reddit could not be fetched at all.
- Patreon returned 403.
- TCGplayer articles render on the client, so the fetch returned only the page shell.
- The Metafy guides from iKailaKai, Ayatora, CrossAi and Moiko showed only headings or tables of contents.
- YouTube pages returned only titles and channel names.

The usable body text therefore comes from:
- **onepiece.gg**: one strong article by a competitive player (Sorry/Trickster, 2024). The newer 2026 pieces by razviar and Claire are weaker and contain errors.
- **Shonen TCG**: careful, recent and rule-accurate. It writes under a house pen name ("Alex Chen", "a pen name for the Shonen TCG desk"). Its deck-building piece includes counts from 149 tournament lists.
- **Haki TCG, Bounty TCG, TCGTalk, Geeky Domain, TCG Protectors**: retailer and app blogs.
- **The official Comprehensive Rules and the official "experienced TCG players" page.**

Errors I found in sources. The content pipeline should not repeat them:
- [S2] says counters are "distributed across your non-character cards" and that a defender can "block with Don". Both are wrong. Counter values are printed only on Characters, plus Events with [Counter] [S7][CR 7-1-3-1]. Blocking uses a [Blocker] Character [CR 10-1-4-1].
- Search snippets from some retailer pages said a defender who *matches* the attacker's power survives. That is wrong. **The attacker wins ties** [CR 7-1-4-1][S7][S15].
- [S11] says to "assume the opponent may add DON!! to unlock a keyword mid-combat". Giving DON!! is a Main Phase action [CR 6-5-5], so the defender cannot do this during your attack. On your own turn the attacker gives DON!! before attacking. Card effects are the only exception (inference from rules; confirm in Track F).
- [S3] links to a casino and states things like "purple decks recover DON!! to fuel strong counters" with no support. Treat it as low quality. I cite it only where another source agrees.

## Rules facts the concepts rest on

| Fact | Rule |
|---|---|
| The attack succeeds if attacker power ≥ defender power, so ties go to the attacker | CR 7-1-4-1 |
| Each given DON!! adds +1000 power **during your turn only** | CR 6-5-5-2 |
| Given DON!! returns to the cost area rested in your Refresh Phase. If the card leaves the field, its DON!! goes to the cost area rested | CR 6-2-3, 6-5-5-4 |
| The first player does not draw on turn 1 and places only 1 DON!! that turn. Every later DON!! Phase places 2 | CR 6-3-1, 6-4-1 |
| Neither player can battle on their own first turn | CR 6-5-6-1 |
| Mulligan: once, all five cards, before Life is set | CR 5-2-1-6, 5-2-1-7 |
| Life cards equal the Leader's printed Life value | CR 5-2-1-7, 2-9-1 |
| A hit on a Leader with 1+ Life moves the top Life card to hand. If it has [Trigger], the defender may reveal it and activate it instead | CR 7-1-4-1-1-2, 10-1-5 |
| You lose if your Leader takes damage at 0 Life, or if your deck has 0 cards | CR 1-2-1-1 |
| A Blocker can be used once per battle and only in the Block Step, which comes before the Counter Step | CR 7-1-2-1, 7-1-3 |
| Counter Step: trash a Character for its printed [Counter] value, or pay for and trash a [Counter] Event. Any number, in any order | CR 7-1-3-1 |
| Attack targets are the Leader or a **rested** Character only | CR 7-1-1-2 |
| Rush: can attack the turn it is played. Rush: Character: can attack only Characters that turn | CR 10-1-1, 10-1-6 |
| Double Attack deals 2 Life damage. Banish trashes the Life card and no Trigger activates. Unblockable: no [Blocker] | CR 10-1-2, 10-1-3, 10-1-7 |
| DON!! −X returns X DON!! from your Leader, Characters, or cost area to the DON!! deck | CR 8-3-1-6, 10-2-10 |

---

## 1. Tempo

- **Definition:** Tempo means acting first and using your resources (DON!! and cards) so the opponent must answer you, not the reverse. In this game you measure it as board presence and swings per turn. (Inference: no opened source defines tempo for this game. [S2] says it "does not use the term". [S5] lists aggro's metric as "swings per turn" and control's as "cards in hand".)
- **Why it matters:** The first player's tempo edge starts on turn 2, since nobody battles on turn 1 [S17][CR 6-5-6-1]. In a pure race, the player who attacks first "usually wins by exactly one turn" [S17].
- **Heuristics:**
  - Attack before you develop. The opponent has to guess at Rush threats and may spend counters early [S1].
  - Pick one job per turn, either developing or pushing damage. A half-and-half turn usually leaves "a board that's too small and a swing that gets countered" [S10][S8].
  - Do not let the opponent make their ideal moves (Ayatora tip heading; body not visible) [S27].
- **AI feature:** `tempoDelta` = (my attacks this turn that forced a defensive card or a Life loss) − (theirs last turn), plus the difference in active attackers on board (inference).
- **Coach line:** "You're ahead on tempo when they spend their turn answering you. Make them react."
- **Citations:** S1, S5, S8, S10, S17, S27.

## 2. DON!! curve and DON!! efficiency

### 2a. Curve

- **Definition:** The curve is how many DON!! you have each turn and which cards you can afford with it.
- **Numbers:**
  - Going first: 1, 3, 5, 7, 9, 10.
  - Going second: 2, 4, 6, 8, 10, 10.
  - The second player stays one DON!! ahead and reaches the 10-DON!! cap a turn earlier [S10][CR 6-4-1]. The cap is the size of the 10-card DON!! deck [S10].
- **Curve data:** Per [S13], from 149 tournament lists (lower quartile / median / upper quartile):
  - Cost 0–2: 16 / 20 / 33
  - Cost 3–4: 8 / 11 / 15
  - Cost 5–7: 8 / 9 / 14
  - Cost 8+: 0 / 4 / 7
  - "A small top end of three or four big finishers is normal."
- **Ratios:** [S20] suggests 2–4 boss cards at 8–10 cost and 4–8 one-cost searchers.

### 2b. Efficiency: spend everything, but on purpose

- **Definition:** DON!! does not carry over. Everything refreshes every turn [S10][CR 6-2-3, 6-2-4], so DON!! left active at end of turn is wasted unless it is held for a reason, such as paying for a [Counter] Event.
- **Why it matters:** [S2] says managing DON!! "efficiently every single turn separates developing players from genuinely competitive ones". The official page frames the choice as "Do you pass the turn with DON!! in reserve, daring your opponent to attack?" [S21].
- **Heuristics:**
  - Work out how many DON!! your development needs first, then put the rest on attacks [S1].
  - Do not put all your DON!! into attacks. You still need to develop [S1].
  - Do not put all your DON!! into Characters either. "Develop a little and attach DON!! to push real damage." Attacks at base power "bounce off a single Counter" [S8][S10].
  - DON!! on a Character that leaves the field only costs you that turn's power, not the DON!! itself [S10][CR 6-5-5-4].
  - Holding back 1–2 DON!! "can significantly improve survivability" [S3, low quality]. This ties to [S21] and to [Counter] Events, which cost DON!! [S7][CR 7-1-3-1-2]. One anecdote: leaving 2 DON!! active as a bluff instead of playing a 1-cost character [S5].
- **AI feature:** `donWasted` = active DON!! at end of turn − DON!! reserved for counter events in hand. Penalize it unless a held [Counter] Event can use the DON!!. Also `donPowerUseful` = sum, over given DON!!, of +1000 that changed a battle outcome or forced an extra counter (inference).
- **Coach line:** "Your DON!! comes back next turn either way. Unused DON!! is wasted unless you're holding it for a Counter Event."

### 2c. Attaching versus playing

- **Rule:** Resting DON!! to pay a cost and giving DON!! are separate uses. A DON!! you rested for a cost cannot also be given that turn [S10].
- **Heuristic (inference, built on S1 and S7):** Count attachments in 1000-power steps against the next counter threshold. 1000 extra power matters only if it forces one more counter card or one more Life.

### 2d. Ramp, DON!! acceleration, and DON!! −X

- **Definition:** Some effects gain extra DON!! or set rested DON!! active again (ramp). DON!! −X costs return DON!! to the DON!! deck [CR 10-2-10].
- **Examples [S10][S14]:**
  - Green/Blue Luffy OP16-022 sets up to 2 DON!! active again if all your Characters are Impel Down. [S10] calls this "two extra DON!! to spend".
  - Purple Sengoku OP16-060 returns 8 active DON!! to play up to 3 differently named Admirals.
  - Sakazuki OP16-065 has a DON!! −1 card play and DON!! acceleration.
- **Heuristic (inference):** A DON!! −X cost is a real resource loss only until the DON!! deck refills you. Your 2 per turn come from the DON!! deck, so returned DON!! comes back in later DON!! Phases. Early in the game DON!! −X is close to free tempo. At 10 DON!! it costs you power and plays this turn. Confirm the refill interaction in Track F.
- **AI feature:** `donAvailableNextTurn` (projected), and `donMinusCost` weighted by turns until the cap (inference).
- **Coach line:** "DON!! −X gives DON!! back to your DON!! deck. You'll draw it again, so it hurts most once you're already at 10."
- **Citations:** S1, S2, S3, S5, S7, S8, S10, S13, S14, S20, S21, CR.

## 3. Life as a resource

- **Definition:** Each Life card you lose goes to your hand, or you may activate its [Trigger] instead. Losing Life is a draw that also moves you toward defeat [CR 7-1-4-1-1-2][S21]. The official page says "every attack that lands costs you a Life card—and arms you with one more card to strike back" [S21].
- **Why it matters:** "Taking a life isn't purely bad — it gives you a card" [S2]. "Losing one Life can improve the position" [S4]. Moiko's paid guide is built on "your hand, not your life, is what keeps you alive" [S28].
- **Heuristics:**
  - Aim to sit at **2 Life**. **0 Life is the danger zone**: the opponent can stack all their DON!! on one attacker, and without a Blocker it is "almost impossible to Counter". At 1+ Life the opponent must split DON!! across at least two attackers [S1].
  - Take Life "when you are high and the attacker is plain". Block or counter "near zero Life or against" Banish or Double Attack. "Taking Life early to refuel is frequently correct" [S8].
  - Bait (onepiece.gg snippet; the [S1] body confirms the 0-Life logic): dropping to 0 while holding enough counter can tempt an overcommit. Mark as advanced.
  - **Banish** removes both the card and the Trigger. Against Banish decks, going first is worth more [S11][S17][CR 10-1-3].
  - **Triggers:** Yellow is "notorious for its Trigger abilities". Attack before you play Characters, so Trigger removal or K.O. hits an empty board [S1]. Plan for a bad Trigger before you attack [S3].
- **Leader Life 4 versus 5:**
  - In OP14–OP17, single-color Leaders print 5 Life and two-color Leaders print 4. Examples: Red Ace OP16-001 has 5, Green/Blue Luffy OP16-022 has 4 [S13][S14]. [S18] agrees: "most dual-color Leaders start with 4 Life."
  - (Inference:) A 4-Life Leader gets one fewer free card and one fewer buffer, so its "2 Life" comfort point arrives two hits sooner.
- **AI feature:**
  - `lifeValue(L)`: a concave curve per Life card. L = 0 is very costly, 1–2 is costly, 3+ is cheap, and each Life card counts as roughly +1 hand card (inference).
  - Use `effectiveLife = life + blockersActive×(something) + counterValueInHand/1000` only inside lethal checks.
  - Model Trigger probability from the known Trigger count in the remaining deck pool, determinized.
- **Coach line:** "Life is a card draw with a countdown. Taking hits at 4–5 Life is often fine. At 2 or less, every hit counts."
- **Citations:** S1, S2, S3, S4, S8, S11, S13, S14, S17, S18, S21, S28, CR.

## 4. When to counter versus take the hit

- **Definitions:**
  - Character counters are free: trash the card for +1000 or +2000 during that battle [S21][CR 7-1-3-1-1].
  - [Counter] Events cost DON!! but can be larger. Example: Ground Death OP14-096 gives +4000 for 1 cost, needing 10+ cards in trash [S7][S12][S16].
- **Core rule:** "Counter when the attack's consequence is worse than the card you would spend" [S7].
- **Heuristics with numbers:**
  - **Early:** take an 8000 attack instead of spending two +2000 counters, or a +2000 and two +1000s. Save counters for later [S1].
  - **Midgame:** 5000 attacks are "easier to Counter with a +1000" [S1].
  - **Exact math:** the defender must end *higher*. "A Counter that only matches the attacker's power is a wasted card" [S7]. Worked example: 7000 into 5000 needs more than 2000, so 3000 [S15].
  - **Don't over-counter:** "Spending two cards to stop a minor attack can be worse than accepting one Life" [S7]. Do not "spend every card on one non-lethal attack without checking the next sequence" [S7].
  - **Hand floor:** keep 1–3 counter cards in hand in the midgame, more against aggro. Do not empty your hand [S8].
  - **Counter to save a Character** only if it has "an important ongoing effect". Otherwise let an expendable one go [S7].
  - **Always defend** lethal, or a hit that takes the last Life before your next meaningful turn [S7]. Low-Life defense: see section 3.
  - **Leader-specific:** Whitebeard-style exceptions exist (Patreon snippet, not opened). Do not encode yet.
- **AI feature:** `counterDecisionScore` = Δ(eval if countered) − Δ(eval if not). It weighs lifeValue loss, hand cards lost, Trigger EV, and survival of the next turn's lethal check. Also `handCounterReserve` = sum of counter values in hand after the decision. Penalize going below about 2 cards' worth in the midgame (inference from S8).
- **Review flag:**
  - "Wasted counter": countered an attack where taking it left Life ≥ 3, the player was not facing lethal next turn, and 2+ counter cards were used, or the counter only matched the attack's power.
  - "Hit that should have been countered": the reverse.
  - Thresholds are inference built on S1, S7 and S8.
- **Coach line:** "Only counter when what the hit costs you is worth more than the card you'd spend. Early big hits are usually worth taking."
- **Citations:** S1, S7, S8, S12, S15, S16, S21, CR.

## 5. The value of +2000 counters and Blockers

- **Counters in real lists:** From [S13], across 138 tournament lists (lower quartile / median / upper quartile):

  | Card type | LQ | Median | UQ |
  |---|---|---|---|
  | +1000 counter Characters | 11 | 19 | 22 |
  | +2000 counter Characters | 0 | 9 | 12 |
  | Counter Events | 3 | 5.5 | 9 |
  | All counter cards | 26 | 33 | 36 |

  - About two-thirds of a list can counter.
  - A Reddit user is quoted: "2K counter cards preferably 10 or more."
  - [S20] suggests 8–12 +2000 counters, leaning to 10–12 in faster metas.
  - [S7]: "There is no official Counter ratio."
- **Why +2000 matters (inference built on S1):** All power moves in 1000 steps, so one +2000 card answers a 1000 power gap with 1000 to spare, or a 2000 gap exactly. It does with one card what otherwise takes two +1000s, which is a card saved. Attackers therefore size attacks to break +2000 thresholds (section 8).
- **Blockers:**
  - A Blocker redirects one attack and is then rested [S11][CR 10-1-4-1]. It "saves your Counter cards for later" (onepiece.gg snippet). Blockers are the main answer at 0 Life [S1].
  - Use a Blocker when moving the attack onto a disposable Character is the best trade. Counter when the original target must survive [S7].
  - The Blocker decision comes *before* you see counters, so you cannot wait [CR 7-1-2, 7-1-3].
  - [S20] suggests 4–8 Blockers. [S13] gives no count.
- **AI feature:** `blockersActive`, `counterValueInHand` split into +1000, +2000 and event counters (events weighted by whether the opponent has the DON!! to pay), and `twoKCountersSeen` from the opponent's trash, for inference about their hand (inference).
- **Coach line:** "A +2000 counter does in one card what two +1000s do in two. That's why attackers aim at the 2000 gap."
- **Citations:** S1, S7, S11, S13, S20, CR.

## 6. Board versus face, and attacking rested Characters

- **Definition:** Each attack goes at the Leader (Life) or at a **rested** Character (removal by battle) [CR 7-1-1-2].
- **Heuristics:**
  - "For most decks, controlling the board is a priority over mindlessly attacking the opponent's Leader." Switch to the Leader when you are winning the board and the opponent is low on Life [S1].
  - "Prioritize removing rested Characters over attacking the Leader if their Leader is still healthy" [S1].
  - "Characters with 5000 power or more pose a significant threat" to rested Characters [S1].
  - Clear major threats before you push Life: "leaving major threats on the board can cost more than waiting" [S3, low quality, but it agrees with S1].
  - "Plan each turn around one clear goal, board or pressure" [S8].
  - Use a Blocker as bait and send the real threat after [S8][S11].
- **Why the defender's choice changes (inference):**
  - An attack on a rested Character rarely draws counters unless that Character is key [S7]. Board attacks are "safe" value.
  - Leader attacks give the opponent cards (Life to hand) and possible Triggers [S21][CR 10-1-5].
  - So hitting face at high Life without a lethal plan is partly a gift.
- **AI feature:** `boardPowerDelta` (sum of my Character power minus theirs, with keyword weights), `opponentRestedTargets`, and `faceValue` = lifeValue drop − (card given to opponent) − Trigger EV. Choose board or face by comparing EV per DON!! spent (inference).
- **Coach line:** "When their Leader is healthy, K.O.'ing a rested Character usually does more than one Life. Go face when the Life count is low or you're winning the board."
- **Citations:** S1, S3, S7, S8, S11, S21, CR.

## 7. Rush and tempo swings

- **Definition:** Rush lets a Character attack the turn it is played. Rush: Character can only attack Characters that turn [CR 10-1-1, 10-1-6].
- **Why it matters:**
  - Rush skips the turn of vulnerability, which is a swing. You develop and attack in the same turn.
  - Recursion makes it stronger. Yamato OP16-079 gives Rush to Land of Wano Characters played from trash [S12][S14]. Ace OP16-001 gives Rush to an 8000+ Luffy or Whitebeard Pirates Character [S13][S14].
  - [S11] says Rush "powers aggressive decks". "Red Zoro decks frequently run rush threats" [S3].
- **Heuristics:**
  - Attacking first, then developing, leaves the opponent unsure whether a Rush attacker follows. They may counter early "out of fear of a certain Rush attacker" [S1].
  - (Inference) When the opponent's deck plays Rush, a rested Character you leave behind is a likely target. Weigh resting for an attack against keeping Blockers active.
- **AI feature:** `rushThreat` = probability the opponent holds a playable Rush card, given their DON!! next turn and the known pool. Also `immediateAttackers` after a play (inference).
- **Coach line:** "Rush means no safe turn. A Character can be played and attack right away, so count it in their next-turn damage."
- **Citations:** S1, S3, S11, S12, S13, S14, CR.

## 8. Lethal math

- **Definition:** Lethal means the opponent cannot stop enough attacks to prevent the hit on 0 Life [CR 1-2-1-1-1]. You need **(opponent Life + 1)** successful Leader hits. Double Attack counts 2 toward Life [CR 10-1-2].
- **Rules reading to confirm in Track F (inference):** By CR 7-1-4-1-1-1 to -3, a Double Attack hit against 1 Life removes the last Life card but does *not* win, because the win check happens when damage is determined, at 1 Life.
- **Power gap in 1000s:**
  - To stop an attack, the defender needs `(attacker − defender) + 1000` of counter [CR 7-1-4-1][S15].
  - Matching the target's power forces a +1000. Exceeding it by 2000 forces +3000, which is two cards, a +2000 and a +1000 [S1].
- **Counting the opponent's potential counters:**
  - Upper-bound the defense as each hand card × its maximum plausible counter. Use +2000 for a Character, more for an affordable Event. Event counters can reach "+4000 or more" [S16] but need active DON!! [S7][CR 7-1-3-1-2]. (The upper bound itself is inference. A TCGplayer article reportedly treats each hand card as up to +2000, but I could not read it. See Open questions.)
  - Before key attacks, count the opponent's active DON!! and cards in hand [S8][S10].
  - Use the trash. Six +2000s in the trash means fewer are left in hand. Track the 2K counters already used [S1][S5]. Counters already spent "help narrow what might remain" [S4].
  - Read counter priority. A +2000 used on a 5000 attack may mean no +1000 in hand, or a +1000 kept for its draw effect [S1]. It "does not prove the smaller Counter is absent" [S4]. Ayatora covers the same idea as tip 5, heading only [S27].
- **Attack ordering:**
  - Go weaker first when closing: a 5000 attack, then a 7000 [S1].
  - "Start with a low cost attack that tests the opponent's willingness to defend. Recalculate after seeing the response" [S4].
  - "Several smaller attacks may force more decisions and reveal Counter cards before the final swing" [S4].
  - Leading with characters and finishing with the Leader is "considerably more threatening" [S2].
  - Counterpoint: "There is no universal 'smallest attacker first' rule" [S15].
  - Ayatora's tip 4 is "Attack in Steps (Lethal)" (heading only) [S27].
- **DON!! distribution:**
  - At 1+ Life the defender can force you to split DON!! across attackers. At 0 Life you can stack everything on one [S1].
  - "Spread the dons on all your attackers" (Reddit quote in [S10]).
  - "Commit extra DON!! only after earlier attacks reveal something useful" [S4].
  - iKailaKai's guide covers "Spreading Don!!" and a "1 Life Exception" (headings only) [S24]. His YouTube video covers lethal [S30].
- **Blockers, Unblockable, and blocker removal:**
  - Bait a Blocker with a cheaper attacker first [S8][S11].
  - Unblockable stops [Blocker] [CR 10-1-7]. One anecdote: an all-in unblockable swing at 1 Life after the opponent overextended DON!! [S5].
  - Resting or K.O.'ing an active Blocker before attacks removes a defense (inference from CR 10-1-4-1: rested cards cannot activate Blocker).
- **When to go all in:** if you expect to lose next turn, go all in on the Leader, "especially if they are down to 1 or 2 Life Cards" [S1]. Misreading lethal at low Life is a top mistake. Count their attackers, possible DON!! boosts, your Blockers and your counter value [S8].
- **AI feature (exact, for the lethal detector and review):**
  - Enumerate attack orderings and DON!! splits. Against each ordering, have the defender play an optimal block and counter policy from a determinized hand.
  - For the coach, report `lethalProbability` across determinizations, `minCountersNeededToSurvive`, and `opponentMaxDefense = Σ counter upper bounds + active blockers`.
  - Heuristic version for leaf evaluation: `lethalThreat` = (my potential attacks with power ≥ their Leader power) − (their Life + 1) − (counter cards in their hand ÷ about 1.5) − active blockers (inference; tune).
- **Coach line:** "You need their Life plus one clean hits. Count how many of your swings they can stop with the cards in their hand, and send the small attacks first."
- **Citations:** S1, S2, S4, S5, S7, S8, S10, S11, S15, S16, S24, S27, S30, CR.

## 9. Mulligan heuristics

- **Rule:** One all-or-nothing redraw of 5 cards, before Life is set, with no penalty [CR 5-2-1-6, 5-2-1-7][S8][S9].
- **Odds (50 cards, at least one copy in the opening 5 / with the mulligan) [S9]:**

  | Copies in deck | Opening 5 | With mulligan |
  |---|---|---|
  | 4 | 35.3% | 58.1% |
  | 8 | 59.9% | 83.9% |
  | 12 | 76.3% | 94.4% |
  | 16 | 86.9% | 98.3% |

  - The 35.3% figure is confirmed independently by [S6].
  - I checked it myself: 1 − C(46,5)/C(50,5) ≈ 0.353.
- **Heuristic [S9], three questions in order:**
  1. Can I act on turns 1–2?
  2. Do I hold a piece of my plan: search, ramp, or what the Leader wants?
  3. Can I defend? A couple of counters or a Blocker is a bonus.

  Two yeses is a keep.
- **First versus second [S9]:**
  - Going first, redraw hands that "need a second turn".
  - Going second, you can keep a hand one card short of ideal.
  - Common mistakes: keeping nothing under 5 cost, and keeping a "draw-only" hand while going first.
  - Leader notes: Impel Down Luffy wants an early Impel Down Character, Sengoku tolerates slow hands, and Ace wants a big body on curve.
- **Key 4–5 cost plays:** None of the opened sources gives a generic number. Track G per-archetype guides should define "the two things your deck must do by turn three" [S9].
- **AI feature:** `mulliganScore(hand, leader, seat)` = playbook-defined checks (early play, engine card, defense) with a lower bar going second. Calibrate with Monte Carlo over the archetype list (inference).
- **Coach line:** "Keep if you can act on turns 1–2 and you hold a piece of your plan. Going first, be stricter."
- **Citations:** S6, S8, S9, CR.

## 10. Turn order: first versus second

- **Facts:**
  - The first player gets no turn-1 draw and 1 DON!! instead of 2 [CR 6-3-1, 6-4-1].
  - Nobody battles on their own first turn [CR 6-5-6-1].
  - The second player stays "one card and one DON!! ahead" on equivalent turns [S17][S10].
- **Heuristics [S17]:**
  - "The general default in One Piece is to go second."
  - Go first with aggressive curve-out decks, or when racing a faster deck, and against Banish decks.
  - Go second with removal, late-game and counter-heavy decks.
  - Beginners should go second.
  - No opened source gives play-order win-rate data.
- **AI feature:** `seatAdjust` in mulligan and early-turn aggression from the playbook. For the coach, show the DON!! curve table per seat (section 2a) (inference).
- **Coach line:** "Going second gives you an extra card and DON!! every turn until 10. Going first gives you the first attack."
- **Citations:** S9, S10, S17, CR.

## 11. Hand management

- **Definition:** Hand cards are both plays and defense, since most Characters carry counter values [S13][S21].
- **Heuristics:**
  - "Playing your entire hand every turn ... regularly leaves you with nothing to work with" [S2].
  - Emptying your hand of counters is "the number one mistake". Keep 1–3 [S8].
  - Before committing, ask "How many cards remain in hand afterward?" [S4].
  - "A shrinking hand can make repeated medium attacks harder to defend" [S4].
  - The opponent's hand size is a signal of their counter capacity [S2].
  - Keep "a threat or two in reserve" against removal-heavy colors [S8].
- **AI feature:** `handSize`, `handCounterValue`, and `playableNextTurn` (cards castable with next turn's DON!!), with diminishing returns above about 6 cards (inference).
- **Coach line:** "Most cards in your hand are also shields. Before you play one, ask whether you can still survive their next turn."
- **Citations:** S2, S4, S8, S13, S21.

## 12. Leader abilities define archetypes

- **Definition:** The Leader sets the colors and "the direction of your entire deck" and "never has to be drawn" [S21].
- **Examples by plan (OP16 Leaders, per [S14] and [S13]):**

  | Leader | Card | Colors / Life | Plan |
  |---|---|---|---|
  | Ace | OP16-001 | Red, 5 Life | Aggro, "direct pressure", Rush on big bodies |
  | Luffy | OP16-022 | Green/Blue, 4 Life | "Tempo Leader", DON!! acceleration with an Impel Down-only board |
  | Sengoku | OP16-060 | Purple | Ramp/payoff: hold 8 DON!!, then drop 3 Admirals at once |
  | Teach | OP16-080 | Black/Yellow, 4 Life | "Control", reactive defense, attack redirection, Characters cost +1 on the opponent's turn |
  | Yamato | OP16-079 | Black | Recursion/midrange, uses the trash as a second resource |
  | Buggy | OP16-041 | Blue | Board-wide synergy |

  - Older labels from search snippets: Black Teach as "control, resource denial" and Moria as "midrange-control". These were not opened. Track G must verify against the current format.
  - [S2] says some Leaders "reward aggressive play", others "a slower, more controlling style". Beginners should start with a proactive Leader.
- **Archetype metrics [S5]:** aggro is "swings per turn", control is "cards in hand".
- **AI feature:** Playbook weights per archetype multiply the heuristic terms. Aggro raises `faceValue` and lowers `handCounterReserve`. Control raises `boardPowerDelta`, `handSize` and removal value. Ramp raises `donAvailableNextTurn` and survival until the payoff turn (inference).
- **Coach line:** "Your Leader tells you how this deck wins. Read its ability and ask what it wants you to be doing every turn."
- **Citations:** S2, S5, S13, S14, S21.

## 13. Card advantage

- **Definition (inference, since no opened OPTCG source defines it):** Card advantage means having more cards available (hand plus useful board) than your opponent. In OPTCG it comes from draw and search effects, from taking Life, and from trading one card for two (for example, one removal that also forces a counter).
- **Sourced pieces:**
  - Draw engines such as Stronger OP09-089 and Yamato OP16-098 [S12].
  - Over-extending into removal hands the opponent "a two-for-one" [S8].
  - Searchers, 1-cost "look at top 5" cards, appear 4–8 times per list [S20].
  - The Bounty article's go-second logic is card advantage: one extra card [S17].
  - Life cards add to hand [S21].
- **AI feature:** `cardAdvantage` = (my hand + useful board − opponent hand − opponent useful board), with "useful" weighting by playability and counter value (inference).
- **Coach line:** "Every time one card of yours answers two of theirs, you're pulling ahead, even if the board looks even."
- **Citations:** S8, S12, S17, S20, S21.

## 14. Removal and board-wipe timing

- **Definition:** K.O., bounce, cost-reduction plus K.O., and negate effects, used to remove the opponent's board outside battle.
- **Sourced pieces:**
  - Black stacks cost reduction before a K.O. Van Augur OP09-083 gives −3, Stronger −2, and then Doc Q OP09-090 K.O.s a cost-1-or-less Character, so "Stack the first two on a cost 6 Character" [S12].
  - Crocodile's Leader OP14-079 has a −10 cost effect but cannot remove by effects [S12].
  - Don't overextend into removal [S8].
  - [S12] gives no hold-or-fire timing guidance.
- **Heuristics (inference, to be replaced by Track G playbooks):**
  - Fire removal on a Character that is active or has an ongoing effect, since rested ones can be attacked instead (CR 7-1-1-2).
  - Prefer the effect that saves DON!! for attacks.
  - Hold board-wide effects until the opponent has committed two or more Characters.
- **AI feature:** `removalEV` = (target's eval contribution) − (card and DON!! spent), plus a bonus if the target cannot be attacked this turn (it is active) (inference).
- **Coach line:** "Use effect removal on what your attacks can't reach. Rested Characters can just be attacked."
- **Citations:** S8, S12, CR.

## 15. Resource denial (DON!! return, rest effects, Banish, effect negation)

- **Definition:** Effects that shrink the opponent's usable resources: their DON!!, active Characters, Life-to-hand, or On Play value.
- **Sourced pieces:**
  - Banish denies the card and the Trigger. [S11] says it suits aggressive decks that "starve the opponent of resources".
  - Teach OP09-081 negates the opponent's On Play effects until the end of their next turn [S12].
  - Black/Yellow Blackbeard OP16-080 makes your Characters cost +1 on the opponent's turn (it raises the price of cost-based removal) [S12][S14].
  - "Green decks tend to run blockers or cards that rest opposing characters" [S3, low quality].
  - Opponent-DON!!-return effects: none found in the opened sources. See Open questions.
  - Rest effects on Blockers: one TCGplayer tech article reportedly names a Blocker-rester. I could not read it.
- **Why it matters (inference):** Resting an active Blocker or Character before battle turns it into an attack target (CR 7-1-1-2) and removes a block (CR 10-1-4-1). Denying DON!! caps both their plays and their counter Events.
- **AI feature:** `opponentDonNextTurn`, `opponentActiveBlockers`, and a `deniedValue` term for Banish hits (the Life card is lost without a hand card or Trigger) (inference).
- **Coach line:** "Resting their Blocker before you swing opens the path. Banish takes the card they'd have drawn from Life."
- **Citations:** S3, S11, S12, S14, CR.

## 16. Information: hand reading and trash reading (supporting concept)

- The opponent's trash is public information. Use it to bound what remains in hand [S1][S4][S5].
- Counter priority leaks information but does not prove it [S1][S4].
- Active DON!! the opponent leaves up "may signal that the opponent wants access to an Event" [S4]. Reading the opponent's available DON!! "is most of the mid-game decision-making" [S19].
- Think from your opponent's perspective (Ayatora tip 2, heading) [S27].
- **AI feature:** a determinization prior that conditions the sampled opponent hand on observed counter choices and trash contents (inference).
- **Coach line:** "Their trash tells you which counters are already gone. Count before you swing."

---

## Proposed evaluation features (summary for the AI heuristic)

All weights and forms are inferences to be tuned in self-play. The playbook multiplies them per archetype.

| Feature | Definition | Concepts |
|---|---|---|
| `lifeValue(L)` | Concave per-Life value. Large penalty at 0, high at 1–2, low at 3+. A Life card also counts as a future hand card | 3, 4 |
| `handCounterValue` | Sum of counter values in hand. Events count only if their DON!! cost is affordable next opponent turn | 4, 5, 11 |
| `handSize` / `playableNextTurn` | Cards in hand, and how many can be played with next turn's DON!! | 11, 13 |
| `boardPowerDelta` | My Character power plus keyword weights (Blocker, Rush, Double Attack, Banish, Unblockable) minus the opponent's | 6, 7 |
| `blockersActive` (both sides) | Active Blockers going into the opponent's turn | 5, 8 |
| `donWasted` | Active DON!! at end of turn not needed for a held [Counter] Event | 2 |
| `donEfficiency` | DON!! spent on effects that changed outcomes (plays, attacks that forced a defensive card or Life) ÷ DON!! available | 2 |
| `tempoDelta` | Defensive cards or Life my attacks forced, minus the opponent's, last round | 1 |
| `lethalThreat` (both sides) | Attackers able to break their Leader, minus (Life + 1), minus estimated stoppers (counter cards, blockers). Exact search in analysis mode | 8 |
| `opponentMaxDefense` | Upper bound from hand size, trash-adjusted counter pool, active DON!! for events, and blockers | 8, 16 |
| `cardAdvantage` | Hand plus useful board, mine minus theirs | 13 |
| `rushThreat` / `opponentDonNextTurn` | Next-turn threat estimate from the known pool | 7, 15 |
| `triggerEV` | Expected value of Triggers in the remaining Life, from the determinized pool | 3 |
| `seatAdjust` | First or second adjustment for mulligan and early aggression | 9, 10 |

**Review flags these map to:**
- `donWasted > 0` without a held reason → "DON!! left unused".
- `counterDecisionScore` gap → "wasted counter" or "hit that should have been countered".
- Board-or-face EV gap → "poor attack ordering".
- Exact lethal search → "missed lethal" and "lethal given away".

---

## Best explainers (for citation in the learning layer)

| Creator / article | URL | Date | Best for | Notes |
|---|---|---|---|---|
| Sorry (Trickster), "7 Beginner Tips to Improve at One Piece TCG Quickly" (onepiece.gg) | https://onepiece.gg/7-beginner-tips-to-improve-at-one-piece-tcg-quickly/ | 2024-06-14 | Counter vs take (8000 and 5000 examples), 2-Life rule, DON!! budgeting, power-gap forcing, board vs face, weaker-attack-first, trash reading | Best single explainer found. Its examples are from the OP06 era but the principles hold |
| Shonen TCG, "Counter mechanic explained" (Alex Chen, house pen name) | https://www.shonentcg.com/blog/one-piece-tcg-counter-mechanic-explained | 2026-06-05 (reviewed 2026-10-13) | Ties go to the attacker, the counter decision rule, over-countering, Blocker vs Counter | Rule-accurate |
| Shonen TCG, "Mulligan guide" | https://www.shonentcg.com/blog/one-piece-tcg-mulligan-guide | 2026-06-06 (reviewed 2026-10-21) | Mulligan questions, odds table, first vs second keeps | Includes OP16 Leader notes |
| Shonen TCG, "DON!! system explained" | https://www.shonentcg.com/blog/one-piece-tcg-don-system-explained | 2026-06-07 (updated 2026-10-16) | DON!! curve by seat, rest vs give, DON!! −X, ramp Leaders, spreading DON!! | |
| Shonen TCG, "Deck building guide" | https://www.shonentcg.com/blog/one-piece-tcg-deck-building-guide | 2026-06-02 (reviewed 2026-10-16) | Counter density and cost curve from 149 tournament lists, Leader Life 4 vs 5 | The only source with list statistics |
| Shonen TCG, "Common beginner mistakes" | https://www.shonentcg.com/blog/one-piece-tcg-common-beginner-mistakes | 2026-06-10 | Keep 1–3 counters, develop vs boost, baiting blockers, misreading lethal | |
| razviar, "Luck, Reads and Calculated Risks" (onepiece.gg) | https://onepiece.gg/?p=21961 | 2026-10-02 | Attack sequencing to reveal counters, hand reading, committing DON!! after information | Other razviar pieces are weaker |
| Bounty TCG, "Should you go first or second" | https://www.bountytcg.app/en/blog/one-piece-tcg-going-first-or-second | 2026-08-21 | Turn order defaults and deck fit | No data, opinion only |
| Haki TCG (Julian), "How One Piece TCG works" | https://hakitcg.com/blog/how-one-piece-tcg-works-rules-guide-2026 | 2026-03-02 (updated 2026-10-24) | Battle math example, "no universal smallest-first rule" | |
| Bandai, "For experienced TCG players" | https://en.onepiece-cardgame.com/experienced-tcg-players/ | undated (mentions OP-17) | Official framing of Life as a resource, DON!! in reserve, Leader as deck direction | Official |
| Bandai, Comprehensive Rules v1.2.1 | https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf?20260828 | 2026-08-28 | All rule facts | Authoritative |
| iKailaKai, "[OPTCG101] How to go for LETHAL" (YouTube) | https://www.youtube.com/watch?v=0Tw2RNEOclY | not retrieved | Lethal (title only; not watched) | Also authored Metafy "Ultimate Guide" lethal chapter |
| Car D. Kaizoku, "GUIDE TO LETHAL" (YouTube) | https://www.youtube.com/watch?v=w4dMgRBze5I | not retrieved | Lethal (title only; not watched) | |
| DaCapybara, "Gunning for Game – How to Swing for Lethal" (YouTube) | https://www.youtube.com/watch?v=_d13zz8_isk | not retrieved | Lethal (title only; not watched) | |
| Heart PiratesTCG, "How to REALLY pressure life" / "How to save a life" (YouTube) | https://www.youtube.com/watch?v=HQ6M1-3rKfQ , https://www.youtube.com/watch?v=ydN9kd3DoBM | not retrieved | Life pressure and life management (titles only) | |
| PengPiratesTCG, "COUNTER THE COUNTERS!!" (YouTube) | https://www.youtube.com/watch?v=lzaRfngv2T4 | not retrieved | Playing around counter events (title only) | |
| Moiko, "Road to Yonko" (Metafy, paid) | https://metafy.gg/guides/view/road-to-yonko-one-piece-card-game-strategy-yo2qp1shb3h | 2026-07-11 (updated 2026-08-04) | Attack math ("2K Rule", "5/7/9/11 ladder"), tempo vs value, lethal (TOC only) | Chapter 4 is marked free but was not readable |

Do not cite in the app: S3 (casino links, unsupported claims), S6 (mostly non-OPTCG content), or S2's counter and blocker statements (factually wrong).

## Pages opened

Status: "full" means body text was retrieved. "partial" means headings or TOC only. "shell" means the page rendered without content. "failed" means an error.

| # | URL | Creator | Date | Status |
|---|---|---|---|---|
| S1 | https://onepiece.gg/7-beginner-tips-to-improve-at-one-piece-tcg-quickly/ (also opened as https://onepiece.gg/?p=6003) | Sorry (Trickster) | 2024-06-14 | full |
| S2 | https://onepiece.gg/one-piece-tcg-strategy-guide-for-beginners-everything-you-need-to-win/ (also https://onepiece.gg/?p=20294) | razviar | 2026-03-21 | full |
| S3 | https://onepiece.gg/managing-risk-when-attacking-life-in-the-one-piece-card-game/ | Claire | 2026-02-03 | full (low quality) |
| S4 | https://onepiece.gg/?p=21961 ("Luck, Reads and Calculated Risks") | razviar | 2026-10-02 | full |
| S5 | https://onepiece.gg/tactical-mastery-how-to-dominate-the-one-piece-card-game-meta/ | razviar | 2026-04-20 | full |
| S6 | https://onepiece.gg/the-numbers-behind-better-one-piece-decisions/ | razviar | 2026-08-17 | full |
| S7 | https://www.shonentcg.com/blog/one-piece-tcg-counter-mechanic-explained | Alex Chen (pen name) | 2026-06-05 | full |
| S8 | https://www.shonentcg.com/blog/one-piece-tcg-common-beginner-mistakes | Alex Chen | 2026-06-10 | full |
| S9 | https://www.shonentcg.com/blog/one-piece-tcg-mulligan-guide | Alex Chen | 2026-06-06 | full |
| S10 | https://www.shonentcg.com/blog/one-piece-tcg-don-system-explained | Alex Chen | 2026-06-07 | full |
| S11 | https://www.shonentcg.com/blog/one-piece-tcg-keywords-explained | Alex Chen | 2026-06-08 | full |
| S12 | https://www.shonentcg.com/blog/one-piece-tcg-black-color-guide-2026 | Michael Riley (pen name) | 2026-07-13 | full |
| S13 | https://www.shonentcg.com/blog/one-piece-tcg-deck-building-guide | Alex Chen | 2026-06-02 | full |
| S14 | https://www.shonentcg.com/blog/op-16-all-6-leaders-explained | Kai Tanaka | 2026-05-26 | full |
| S15 | https://hakitcg.com/blog/how-one-piece-tcg-works-rules-guide-2026 | Julian (Haki TCG) | 2026-03-02 | full |
| S16 | https://tcgtalk.com/guides/how-to-play-one-piece-card-game | tcgtalk | 2026-04 | full |
| S17 | https://www.bountytcg.app/en/blog/one-piece-tcg-going-first-or-second | Bounty team | 2026-08-21 | full |
| S18 | https://geekydomain.com/blogs/guides/one-piece-tcg-first-competitive-deck-guide | Geeky Domain | 2026-08-30 | full |
| S19 | https://geekydomain.com/blogs/guides/one-piece-tcg-strategy-hub | Geeky Domain | 2026-08-30 | full |
| S20 | https://tcgprotectors.com/blogs/one-piece-deck-guides/how-to-build-one-piece-tcg-deck-2026 | TCG Protectors team | 2026-02-11 | full |
| S21 | https://en.onepiece-cardgame.com/experienced-tcg-players/ | Bandai (official) | undated | full |
| S22 | https://en.onepiece-cardgame.com/rules/ | Bandai (official) | — | full (index of rule PDFs) |
| CR | https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf?20260828 | Bandai (official) | v1.2.1, 2026-08-28 | full (downloaded to scratchpad, read as text) |
| S23 | https://metafy.gg/guides/view/one-piece-fundamentals-how-to-take-life-da-BPM7Kb8FAnO | CrossAi | 2025-02-07 | partial (body "TBD") |
| S24 | https://metafy.gg/guides/view/the-ultimate-one-piece-card-game-guide-let-sSw4PbyrYIp | CrossAi / iKailaKai | 2025-02-07 | partial (headings) |
| S25 | https://metafy.gg/guides/view/the-ultimate-one-piece-card-game-guide-pra-HISQseLQGb2 | CrossAi / iKailaKai | 2025-02-07 | partial (TOC) |
| S26 | https://metafy.gg/guides/view/road-to-yonko-one-piece-card-game-strategy-yo2qp1shb3h | Moiko | 2026-07-11 | partial (TOC) |
| S27 | https://metafy.gg/guides/view/5-tips-to-improve-at-the-one-piece-card-ga-pJKnQx5t9pQ | Ayatora (PROS) | 2025-11-03 | partial (headings) |
| S28 | = S26 (cited for the "your hand, not your life" overview line) | Moiko | 2026-07-11 | partial |
| S29 | https://www.tcgplayer.com/content/article/How-to-Swing-for-Lethal-in-the-One-Piece-Card-Game/e0730594-f5f4-4ee4-9010-188f6226e21c/ and https://www.tcgplayer.com/content/article/Blue-Green-Luffy-Deck-Guide-One-Piece-Card-Game/b95e6516-819c-47d2-93d7-ccdd36caf43c/ (plus the infinite.tcgplayer.com redirect) | TCGplayer | — | shell (client-rendered; no body) |
| S30 | https://www.youtube.com/watch?v=w4dMgRBze5I , https://www.youtube.com/watch?v=_d13zz8_isk , and YouTube oEmbed lookups for 0Tw2RNEOclY, w4dMgRBze5I, _d13zz8_isk, HQ6M1-3rKfQ, lzaRfngv2T4, ydN9kd3DoBM | various | — | titles and channel names only |
| F | https://www.patreon.com/posts/87794740 , https://www.patreon.com/u92856351/posts/one-piece-card-87476586 , https://spellmana.com/beginner-tips-to-improve-at-optcg-quickly-one-piece-card-game/ (403); https://onepiece.gg/rules/glossary/ (520); old.reddit.com and www.reddit.com r/OnePieceTCG (blocked) | — | — | failed |

## Open questions

1. **Reddit and TCGplayer were not reachable.** The TCGplayer "How to Swing for Lethal" article reportedly treats each opponent hand card as up to +2000 counter and each Life card as one free stop, and splits attacks by 0, 1 or 2+ Life. A Blue Green Luffy guide reportedly prefers holding 2–3 Life over 4. Both came from search snippets only. Someone with a browser should read them and confirm or reject them before they become coach content.
2. **Metafy paid guides.** Moiko's "2K Rule" and "5/7/9/11 ladder", iKailaKai's "1 Life Exception" and "Power Staircase", and CrossAi's "Life Thresholds" sound like the best lethal and life frameworks in the community. Are they worth a purchase, or a permission request to cite? (Not a DEVINE question. Log in OPEN-QUESTIONS.md.)
3. **Double Attack at 1 Life.** My reading of CR 7-1-4-1-1-1 to -3 is that it does not win. Track F should confirm with an official ruling. It changes the lethal search.
4. **DON!! −X refill.** I inferred that returned DON!! comes back through later DON!! Phases. Confirm the interaction with the 10-card cap in Track F.
5. **Play-order data.** No source gave first or second win rates. Limitless match data might include play order. Check in Track D part 1 or Phase 3.
6. **Counter-density targets.** S13's medians (33 counter cards, 9 +2000s) conflict with S20's "8–12 two-thousands" framing only at the edges, but S13's lower quartile of 0 +2000s looks odd. Verify against Limitless lists when Track G collects lists.
7. **Opponent-DON!!-return effects and Blocker-resting tech** (resource denial). No opened source named current examples. Track E's effect vocabulary should list them.
8. **Removal timing** has no sourced OPTCG heuristic beyond "don't overextend". Track G playbooks for control decks should supply deck-specific timing, citing archetype guides.
9. **Leader Life rule of thumb** (single color 5, dual color 4) is stated for OP14–OP17 only [S13]. Verify per Leader from card data instead of hard-coding it.
10. **Format note for Track D part 1:** [S18] and [S19] state that OP-01 to OP-04 "rotated out of Standard" on 2026-04-01. Cross-check with the official site.
