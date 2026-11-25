# M6b-2 wave 8a: what was built

Deliverable of the leftovers branch (runbook `docs/runbooks/new-set.md` step c) for the three gaps G69 to G71 of [m6b-audit/leftovers.md](m6b-audit/leftovers.md). Method as in [wave 1](m6b-wave1.md) to [wave 7](m6b-wave7.md): a DSL type, an `IMPLEMENTED` entry and validation, a hidden-zone classification, a runtime path, planted tests on vanilla test cards (`engine/test/cards/m6b-w8a/`), each seen to fail with its implementation broken. After the gates passed, the three cards that needed them were scripted (readings in [leftovers-scripting-d.md](leftovers-scripting-d.md)). `ENGINE_VERSION` stays **0.5.17**: see the last section.

Tests: `engine/test/cards/m6b-w8a/` (3 files, 17 tests), `ai/test/m6b-w8a-bound.test.ts` (3), and the three card test files (`ST33-004` 6, `ST28-004` 7, `OP11-088` 8). Counts and the full-suite result are in the last section.

## Per gap

| Gap | DSL | Runtime | Test |
| --- | --- | --- | --- |
| G69 hand card trashed this turn | `Condition` `{ handTrashedThisTurn: P }` ("a card in P's hand was trashed by an effect during this turn"), read anywhere a condition is, in practice by a `permanent` with `zone: 'hand'` | `History` gets an optional `handTrashed: Record<PlayerId, number>` (absent until a card is trashed, so the shape of every existing history is unchanged); `history.ts` `tracksHistory` also scans for `"handTrashedThisTurn"` and `recordHandTrashed` adds to it; `run.ts` `handTrashed()` (the one place every effect or cost trash from a hand passes through, next to `fireTrashedFromHand`) records before it fires; `eval.ts` reads it beside `koedThisTurn`. The hand-zone permanent is re-derived on every read, so the cost drops the moment the trash resolves | `g69-hand-trashed-this-turn.test.ts` (6) |
| G70 return given DON!! to the cost area | `Cost` `{ returnGivenDon: number }` ("return N total of your currently given DON!! cards to your cost area rested") | `eval.ts` `payable`: `givenDon(you) >= N` (Leader and Characters; active and rested cost-area DON!! do not count); `run.ts` `payCost` calls `returnGivenDon`, which reuses the DON!! class prompt of DON!! -N (`{ from: 'given', card }` candidates with counts, so any split of the N, several from one card included) but offers only the cards that hold given DON!!; asked only when it is a choice (one card holds them all, or the total is N); the DON!! go to `donRested`, nothing goes to the DON!! deck, the event is `DonReturned` with `to: 'costRested'` (as when a card leaves the field), no `donReturned` watcher fires; `costText` names it | `g70-return-given-don.test.ts` (5) |
| G71 the attacking card | `Condition` `{ attackerIs: Filter }`, in an auto ability whose timings are all `onOpponentAttack`: at ability level ("when your opponent's Character attacks": `{ attackerIs: { category: ['Character'] } }`) and as an effect `if` ("if that Character has <Slash>") | `eval.ts`: `s.battle` exists and `matches(c, battle.attacker, filter)` at the attacker's current attributes (a timed attribute grant counts, G59); false with no battle | `g71-attacker-filter.test.ts` (6) |

Validator refusals pinned by tests: `handTrashedThisTurn` with anything but `you` or `opponent`; `returnGivenDon` of 0, not an integer, not a number, or in a replacement payload (it asks which DON!!); `attackerIs` outside an auto ability (an activate, a permanent), in an auto with any timing other than `onOpponentAttack` (`whenAttacking`, `onPlay`, or `onOpponentAttack` mixed with another), with a filter that does not exist (an unknown attribute) or with `true`.

Test-support change: `engine/src/testing.ts` `ModSpec` and the `modifier` op now carry `attribute` (a `grantAttribute` modifier could not be planted without it).

## Revert checks

Each implementation was broken in turn (one line changed, its test file run, restored). Failures with the break in place, out of the file's tests:

| Break | Failing tests |
| --- | --- |
| G69 `recordHandTrashed` not called | 4 of 6 |
| G70 `payCost` returns without paying | 2 of 5 |
| G70 `payable` stops checking the given DON!! | 1 of 5 |
| G71 `attackerIs` always false | 4 of 6 |
| G71 `attackerIs` always true | 3 of 6 |

## Readings

Each is an open question with the competing reading (docs/OPEN-QUESTIONS.md M6b-Q87 to M6b-Q89, opened by the leftovers audit; none has a ruling).

- **G69 (M6b-Q87)** a card of the stated player's own hand, trashed by an effect of either player, a cost included (M6b-Q31, RL-16), at any time earlier in the turn (also before the discounted card was drawn); a card that leaves a hand some other way (played, to the deck, to the Life) does not count. It lasts until the turn changes.
- **G70 (M6b-Q88)** the N DON!! may come from several cards; they stay on the field, rested; "return" here is not a return to the DON!! deck, so DON!! -N and the "DON!! returned" watchers do not see it. The cost is payable only when N or more are given.
- **G71 (M6b-Q89)** the ability is activatable only when the attacker is a Character, so a Leader attack neither offers nor spends it; the Slash check is the effect's own `if`, so a non-Slash Character's attack spends the Once Per Turn when it is used, and a "can be activated" auto is asked (W57-R5), so the player may decline and keep it.

## Hidden information and the AI

- **No new prompt depends on a hidden card.** `returnGivenDon` chooses among cards on the board (public given-DON counts); the two conditions read public facts (cards trashed, the cards of a battle). `cards/src/hidden.ts`: the cost and both conditions read no hidden zone (a note records it); `hidden-gate.ts` needs no entry. The history record is a pair of counts of cards that went to a public trash; the projection does not show `hist` and the determinizer copies it as it copies the K.O. history.
- **Leak case:** none added, nothing hidden is revealed or moved by any of the three: the cards trashed from a hand were already public in the trash, and the DON!! counts are public.
- **The lethal bound** (`ai/src/search/lethal/bound.ts`, `ai/test/m6b-w8a-bound.test.ts`): `returnGivenDon` is not one of the costs that make a repeatable ability "limited", so a repeatable ability paid with it is searched; with Once Per Turn it is scanned by its effects (the cost only lowers the given DON!!). The conditions are not read by the scan, which over-estimates (sound).

## Cards now scripted

ST33-004 Borsalino (G69), ST28-004 Kouzuki Momonosuke (G70), OP11-088 Shu (G71): 3 cards. ST-28 gets its first script directory (`cards/effects/ST-28/`).

## Results

Gate results are in the DECISIONS entry "M6b-2 gaps G69 to G71". **`ENGINE_VERSION` stays 0.5.17, goldens not re-recorded.** No recorded game plays out differently: the new condition, cost and `History` field are read by no scripted card but the three new ones (none is in a golden deck or the property decks' scripted set); `tracksHistory` is true only for a game whose cards contain `"handTrashedThisTurn"` (as for G26), so every other game's state and hash are untouched; the `modifier` test op only forwards a field. The golden games and the 2,000-game property run replay with the same hashes with the version unchanged.
