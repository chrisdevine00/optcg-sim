# Leftovers group B: disagreements

None. Every test for ST22-001, 002, 003, 005, 006, 007, 011, 012, 015, 016, 017 and ST23-001, 002, 003, 004, 005 passes against the scripts.

Points where the tests pin a reading that the card text leaves to the engine (not disagreements; listed so a later reader can see what is asserted):

- **ST22-001 (Activate: Main with a "you may" reveal cost):** activating is the player's choice, so there is no separate yes/no prompt; the cost pick (one candidate included, because the hand is hidden) follows the activation. A hand with no matching card does not offer the ability at all.
- **ST22-015:** the Leader pick after the Life card ("up to 1 of your Leader") is asked, and may be left empty (Life card still added, no boost). A Character played by this Event has its [On Play] resolve after the Event's remaining steps (the Life question comes first).
- **ST23-001 / ST23-002:** the hand cost reduction reads current power (ST23-001) and base power (ST23-002), and is visible as `CardView.cost` on the hand card.
