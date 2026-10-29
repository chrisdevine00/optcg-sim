# API gaps found while writing the M4a independent card tests

The tests in this folder use only `engine/src/api.ts`, the frozen fixtures and `../helpers.ts`.
Each gap below says what the frozen API leaves open, how the tests work around it today, and what
would make the test direct. None of these stops a test from being written. They make some tests
assert on outcomes instead of on the decision itself.

## 1. Modes of a "choose one" effect have no names

`pick.choice` is `InstanceId | DonClass`. A mode ("Draw 2 cards" or "Your opponent trashes 2
cards") is neither, so its handle is opaque, and `Decision` carries only `prompt` text.

- **Affects:** OP17-049 Charlotte Linlin [On Play].
- **Workaround:** `outcomes()` in `kit.ts` tries every legal action of the opponent's decisions on
  copies of the game. The test asserts the set of reachable end states.
- **Wanted:** named options on `Decision` (for example `options: { id, text }[]`), or a `mode`
  pick.

## 2. What `counter.target` means for an Event [Counter]

`{ type: 'counter', card, target }` fits a Character Counter, which boosts `target`. For an
Event, the target is part of the effect. It can be chosen at resolution ("Up to 1 of your Leader
or Characters", OP17-055, OP17-056, OP07-076, OP15-078, OP17-076). It can be fixed ("Your Leader",
EB04-040, OP17-077). An Event may also have a cost to pay first (DON!! −1, "you may trash 1").

- **Workaround:** `useCounter()` prefers the `counter` action whose `target` matches and otherwise
  takes any. `chooseIfAsked()` then picks the target if a `choose` follows.
  `eventCounterTargets()` reads targets from the actions if they differ, or from the `choose` that
  follows on a copy.
- **Wanted:** document it. Either `target` is the boosted card and is validated against the
  effect's filter, or it is ignored for Events and the target always comes from a `choose`.

## 3. A pending `optional`, `choose` or `order` does not say which effect it belongs to

`Decision` has `kind`, `player`, `prompt`, `min` and `max`. `order.first` is an opaque string. When
two of one player's effects trigger together, a test cannot tell which `optional` belongs to which
card. Examples:

- OP17-039's [When Attacking] and OP17-040 Newgate's "when your Leader attacks"
- Kaido Leader DON!! −1 followed by OP17-062's trigger

Nor can a test tell a cost pick from a target pick (OP17-075 "trash 1 card from your opponent's
hand").

- **Workaround:** accept or decline everything (`settleYes` / `settleNo`) and assert the combined
  result.
- **Wanted:** `Decision.source?: { card: InstanceId; ability: string }` and a `purpose: 'cost' |
  'target' | 'mode' | …` tag.

## 4. "Add up to N DON!! from the DON!! deck" has no decision shape

`DonClass` covers `costActive`, `costRested` and `given`, but not the DON!! deck. So "up to 1" or
"up to 5" DON!! from the DON!! deck can be resolved automatically, as an `optional`, or as some
other `choose`; the API does not say which.

- **Affects:** EB04-031, EB04-032, OP08-074, OP17-060, OP17-062, OP17-073, OP17-074, OP17-077,
  OP07-076 and OP09-077 [Trigger].
- **Workaround:** `settleYes()` takes the maximum.
- **Wanted:** document it. Automatic maximum is the simplest; a DON!!-deck class otherwise.

## 5. Looked-at and revealed cards are in no `ZoneName`

"Look at 5 cards" (OP07-077) and "Look at 2 cards" (OP17-050) put cards in a pseudo-zone that
`ZoneName` cannot name.

- **Workaround:** tests identify `choose` candidates with `queries.card(instance)`. They assume that
  works for a card being looked at; if it throws, the candidate checks fail. OP17-050's
  top-or-bottom choice and card order are tested by enumerating reachable deck orders.
- **Wanted:** a `looked` zone in `ZoneName`, or a statement that `queries.card` works on any live
  instance.

## 6. Continuous states are not visible on `CardView`

`CardView` has `power`, `cost` and `keywords`. It has none of these:

| State | Cards | Tested through |
| --- | --- | --- |
| "Cannot attack" | OP17-054, OP17-065 | attack actions on later turns |
| Attack-target restriction | OP17-044 | the targets of `attack` actions |
| Counter value of a card in hand, printed or granted | OP17-118, OP17-063 | whether a `counter` action is legal, and the resulting power |
| Negated effects | OP17-063 | the negated card's replacement no longer being offered |
| Pending delayed effects | OP08-074's end-of-turn return | DON!! counts after `endTurn` |

- **Wanted (optional):** `CardView.counter`, `CardView.negated`, and a can-attack flag. Today's
  indirect tests are sound.

## 7. Spelling of granted keywords

Tests assume a granted keyword shows up in `CardView.keywords` with the same spelling as a printed
one, for example `'Unblockable'` (OP17-055) and `'Rush'` (EB04-030), like `'Blocker'`,
`'Banish'` and `'Rush: Character'`. The API does not fix the spelling.

## Not API gaps, but untestable with these two lists

- **OP08-051 Buckin [Your Turn]:** there is no way to play Buckin on the opponent's turn, so the
  failing side of the condition cannot be built.
- **RL-34** (an attacker's [When Attacking] moves the target, then Kaido's [On Your Opponent's
  Attack] still activates): no card in the Rocks or Kaido lists has such a [When Attacking].
- A scenario cannot start mid-battle or in the End Phase. Every test reaches those points through
  actions, which works but makes some tests longer.
