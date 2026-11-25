# Wave 7 scripting, group C: readings

## ST36-005 Eustass"Captain"Kid

[On Your Opponent's Attack] [Once Per Turn] You may turn 1 card from the top or bottom of your Life cards face-down: Change the target of the attack to your [Eustass"Captain"Kid] with 5000 base power or more. [Activate: Main] [Once Per Turn] You may turn 1 card from the top or bottom of your Life cards face-up: Give up to 1 rested DON!! card to your Leader.

- "Top or bottom": either end whose card is in the needed face state; an end already in the target state is not payable (M6b-Q86, M6b-Q59). The choice of end is public and asked only when both ends can pay (G68).
- Redirect target: a [Eustass"Captain"Kid] Character of yours with 5000 base power or more, itself or another copy, active or rested (QA-EB01 EB01-029); the Leader is not a Character. `basePower` is the printed power (7000 here), not the current power.
- The cost is paid before the target is chosen, so with no matching Character the Life card is turned and nothing is redirected (M6b-Q86).
- "Give up to 1 rested DON!!": `giveDon` rested to the Leader, as ST35-005; the DON!! target (the Leader) is asked, up to 1.
- Both abilities are [Once Per Turn] and each is its own use; the redirect does not fire [On Your Opponent's Attack] again (M6b-Q85).
