# OP-11 group A: API gaps

- `CardView` has no printed `types`, so type conditions (Navy, SWORD, Fish-Man, Merfolk, Neptunian) are checked only through their effects (candidate lists, legal attacks), never read directly.
- "Can also attack active Characters", "cannot be rested" and "will not become active" have no observable flag on `CardView`; they are observed through `legalActions` (attack targets, `block` options, rested state after a Refresh Phase).
- A once-per-turn replacement (OP11-001) being spent has no flag; observed by a second removal in the same turn not being offered.
