# Wave 8 group A: API gaps

- `CardView` has no colours, so "your Leader is multicolored" (PRB02-005) can only be observed through the
  effect it gates, never read directly.
- The hand-activation of an Event is observed through the `EventActivated` event type and the trash/hand
  contents; no watcher card that is scripted reacts to "When you activate an Event" on the owner's own turn
  (OP10-003 Sugar reacts on the opponent's turn only; Page One and Crocodile OP01-062 are not scripted), so
  M6b-Q28 (watchers see a hand activation, not a trash one) is asserted through `EventActivated` only.
- The [Your Turn] clause of EB03-031 cannot be reached: Reiju is only ever played on its owner's turn in a
  position built from the public API.
