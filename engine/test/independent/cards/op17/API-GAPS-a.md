# OP-17 group A independent card tests: API gaps and observations

- **Scenery must be scripted.** Only scripted cards run their effects (an unscripted Event such as OP03-017
  Cross Fire cannot be played). The opponent-effect scenery is therefore limited to the scripted K.O.
  events OP09-077 Gum-Gum Lightning (K.O. up to 1 with 6000 power or less) and OP12-038 Two-Sword Style
  Rashomon (K.O. up to 2 rested Characters with a base cost of 4 or less), and to -power events
  OP05-077 Gamma Knife and ST21-017 Gum-Gum Mole Pistol.
- **No scripted way to remove a Character other than K.O.** (bounce, bottom of deck, trash by effect). OP17-021
  Crone Oil and OP17-015 Marco say "removed from the field", so only their K.O. path is covered; the
  non-K.O. removals are untested. Likewise no scripted card removes the player's OWN Character by the
  player's own effect with a Red-Haired Pirates or Whitebeard Pirates Character, so "by your OPPONENT's
  effect" is covered for battle K.O. only (the replacement is not offered), not for the own-effect case.
- **No scripted effect damage.** EB05-052 Gloriosa says "if you would take damage", which includes effect
  damage. Only battle damage can be driven (unblocked Leader attack, 0-Life case, [Banish] attacker).
  A [Double Attack] attacker was not tested: the rules digest does not say whether the 2 damage are two
  "would take damage" events (two replacement offers) or one.
- **OP17-015 Marco, his own K.O.** When Marco is himself the Character K.O.'d by the opponent's effect the
  engine may still offer "Use Marco's effect instead of the K.O. of Marco?". The outcome is the same
  whatever is answered, so the test declines it if asked and asserts only the result.
- **OP17-029 Hongo, "set up to 1 of your DON!! as active".** The engine sets one rested DON!! itself
  with no decision (the DON!! are interchangeable) and the "up to 1" cannot be answered with 0. Never
  useful to decline, so not treated as a disagreement; the first decision the player sees is the
  target choice.
- **Decision encodings.** "Pay with A or B" (OP17-020) is a `choose` with `purpose: 'mode'` whose options
  are labelled `trash 1 card from your hand` / `rest 1 DON!!`; the tests select by label.
- **OP15-076 Lightning Beast Kiten** applies none of its text without an [Enel] Leader (both the draw and
  the -1000 are inside the "if"), per OPEN-QUESTIONS M4b-5; not usable as plain -power scenery.
