# M6b-2 wave 8: what was built

Deliverable of the wave 8 branch (runbook `docs/runbooks/new-set.md` step c) for the three design items of [m6b-runtime-audit.md](m6b-runtime-audit.md) section 3 that DECISIONS 2026-11-23 "M6b-1 decisions" approved for wave 8 after their rulings: **D2** (activate an Event from the hand or the trash by an effect), **D8** (a delayed effect at the start of the opponent's next Main Phase) and **D9** (an effect acting on the event's subject). Method as in [wave 1](m6b-wave1.md) to [wave 8a](m6b-wave8a.md): the official ruling first, then a DSL type, validator rules, a hidden-zone classification, a runtime path, planted tests on vanilla test cards (`engine/test/cards/m6b-w8/`), each seen to fail with its implementation broken. After the gates passed, the six cards they unblock were scripted (readings in [wave8-scripting.md](wave8-scripting.md)). D1, D5 and D7 stay stats-only (DECISIONS 2026-11-23) and were not touched. `ENGINE_VERSION` stays **0.5.18**: see the last section.

Tests: `engine/test/cards/m6b-w8/` (3 files, 20 tests), `ai/test/m6b-w8-bound.test.ts` (4), `cards/test/m6b-w8-hidden.test.ts` (4), and the six card test files (OP12-041 8, OP15-014 8, OP15-046 6, EB03-031 7, PRB02-005 6, OP16-079 5).

## The rulings, first

All from the local copies of the official Q&A (`.cache/track-f/qa/`); the PDFs' text puts each card's name after its rows, which was checked against the card texts (Rebecca, Orlumbus, Leo in the OP15 file).

| Item | Entry | Says | Settles |
| --- | --- | --- | --- |
| D2 | `qa_op12.txt`, OP12-041 Sanji, five rows | "You do not pay the cost shown in the upper left of the card, but you must pay any activation cost written in the effect text, such as DON!! -2" (and "Yes" for OP09-077 Gum-Gum Lightning: it still returns 2 DON!!); "Is the Event activated ... trashed? Yes"; "No" to activating [Counter] or [Trigger]: only the [Main] effects of Events with [Main]; "Yes" to activating "When you activate an Event" (OP04-053 Page One) | M6b-Q27, Q28 for the hand version |
| D2 | `faq_op15-eb04.txt`, OP15-046 Sabo, two rows | "Unless the Event card specifies otherwise, it will be placed in Trash"; "No" to activating an Event's [Counter] in response to the [On Play] | M6b-Q27 for OP15-046 (and OP15-014: the same activation) |
| D2 | `qa_eb03.txt`, EB03-031 Reiju | "No, you cannot. Activating the [Main] effect of an Event card with this [On Play] effect differs from activating the Event card itself" (Page One) | M6b-Q28 for the trash version; Q27: only the [Main], the card stays |
| D8 | `qa_prb02.txt`, PRB02-005 | "Yes, they do": the opponent with 8 or more DON!! at the start of their next Main Phase still rests 1 active DON!! | M6b-Q91 (new, closed): conditions are read at the [On Play] |
| D9 | `qa_op16.txt`, OP16-079 Yamato | A {Land of Wano} Character played from the trash and then negated "can still attack" | consistent with a grant that is the Leader's, not the Character's; M6b-Q11 itself (any play, "that Character" is the played card) is not asked: reading kept |

Nothing needed a broader engine change than the audit's recommendation, so no item was left out.

## Per gap

| Item | DSL | Runtime | Test |
| --- | --- | --- | --- |
| D2 activate an Event | `Action.activate` takes `of: 'self'` (as before) or `{ ability: 'main', of: Selector }`: one zone (`hand` or `trash`), `owner: 'you'`, a pick of 1 (`upTo` or `exactly`), a filter that requires `category: ['Event']`, no `chooser`, `blind`, `reveal`, `bind` or `lki`; refused as a cost. The validator (`activateEvent`) rejects everything else | `run.ts` `activateEvent`: `select` with a `restrict` (an Event with a [Main] whose written activation cost is payable now, `payable` with the Event excluded as a payment; an optional "you may" cost stays a candidate, as `eventPayable` does for a play). **From the hand** it pushes the existing `play` frame with `free: true`, and `flow.ts` skips the printed cost for an Event when `free` (`playCostOf` and `payCost` were unconditional): the Event is revealed, trashed, `EventActivated` is emitted, the history and `eventActivated` watchers see it, its [Main] runs. **From the trash** it emits `EffectActivated` and pushes the Event's [Main] effect frame; the card stays, no watcher or history sees an activation | `d2-activate-event.test.ts` (9) |
| D8 delayed at the opponent's next Main Phase | `delayed: { at: 'startOfOpponentsNextMainPhase' }` beside `endOfThisTurn` | `Delayed.at` (absent for end of turn, so every existing state and hash is as before), the `delay` instruction carries it; `flow.ts` `fireDelayedMain` queues the entries whose controller is not the active player and whose `turn` is earlier, in a new batch right after the Main Phase's own `startOfMainPhase` effects (`mainStart`); `fireDelayed` (end of turn) skips entries with `at`. The body runs as any delayed body: its source leaving the field or being negated does not stop it (M4a-10) | `d8-delayed-main-phase.test.ts` (5) |
| D9 the event's subject | `Selector.lki: 'subject'` (the field already existed): valid only in an auto ability whose timings are all `cardPlayed` events; no `pick` or `exactly: 1`; no `blind` | `Ev.subject`; `flow.ts` `fire` gets a `subject` argument and gives it to a pending effect only when the ability reads it (`readsSubject`, a memoised scan for `"lki":"subject"`), so no other game's pending state changes; `eval.ts` `poolOf`: the pool is the subject only, and only while it is in the selector's zones and passes its filter (the zone, owner and filter of the selector still apply) | `d9-event-subject.test.ts` (6) |

Validator refusals pinned by tests: D2: `counter` or `onPlay` as the ability of a selector, `deckTop`, two zones, the opponent's cards, a pick of 2 or none, a filter that does not require Events (could name a Character), `reveal`, and as a cost; D8: an unknown `at`; D9: a non-`cardPlayed` ability (`onPlay`, `eventActivated`, a mix, an `activate`), a pick of 2, `blind`, `lki` other than `'subject'`.

## Revert checks

Each implementation was broken in turn (one line changed, its test file run, restored). Failures with the break in place, out of the file's tests (counts as run on the final files):

| Break | Failing tests |
| --- | --- |
| D2 the `activateEvent` branch never taken | 8 of 9 (`d2-activate-event.test.ts`) |
| D2 the printed cost paid again (`if (true)` for `!f.free`) | 1 of 9 |
| D8 `fireDelayedMain` not called | 3 of 5 |
| D8 `fireDelayed` (end of turn) also takes entries with `at` | 3 of 5 |
| D9 `fire` does not give the pending effect the subject | 6 of 11 (`d9-event-subject.test.ts` and `OP16-079.test.ts`) |
| D9 `poolOf` ignores the subject (the whole pool is bound) | 2 of 11 |
| bound: `winsByEffect` does not count `activate` of an Event | 1 of 4 |

The validator tests and the hidden-information tests fail when their rule is removed in the same way (the `validates` tests; the projection tests need the `secret` decision flag).

## Hidden information and the AI

- **No new prompt depends on a hidden card.** From the hand, the choice of the Event reads a hidden zone (`cards/src/hidden.ts` now says so for `activate` with a selector in the hand; `hidden-gate.ts` counts it as a prompt). The pick is asked whatever the hand holds: the pool is secret, so with a filter an empty result is still asked (`selectCards`, effect-dsl 4.11; an `upTo` pick answered with none), so the opponent cannot tell a hand with an Event from one without. `cards/test/m6b-w8-hidden.test.ts` pins the classification and the gate; no script has a hidden condition around it.
- **Leak cases** (`d2-activate-event.test.ts`, "D2 hidden information"): two positions that differ only in whether the hand holds a matching Event give the opponent byte-identical projections of the state and the events at the question and after declining; the chooser's own view differs (the control). What the chosen Event is, once activated, is public (revealed and trashed; the same as any Event played). The trash version reads a public zone. D8 adds nothing hidden (the entry names a card on the field; the delayed list was already public). D9 reads a card on the field.
- **The lethal bound** (`ai/src/search/lethal/bound.ts`, `ai/test/m6b-w8-bound.test.ts`): `activate` of another card's Event runs a script the scan of this card does not see, so `winsByEffect` now counts it as unclassified (the solver searches), where `activate` of the card itself stays safe; `scanAbility` already refuses `activate` (not in its neutral ops). A delayed body is scanned as a body; a `grant` to the subject is the same grant. `ai/test/lethal-*.test.ts` stay green.

## Cards unblocked and scripted

Every gap they need is built and none is a D-item now: **OP12-041** Sanji (D2), **OP15-014** Bartolomeo (D2, with G11's replacement), **OP15-046** Sabo (D2), **EB03-031** Vinsmoke Reiju (D2, trash), **PRB02-005** Monkey.D.Luffy (D8), **OP16-079** Yamato (D9 and G25's `from: 'trash'`). All six are `verified: true`, were scripted and tested (`engine/test/cards/<ID>.test.ts`, 40 tests), and `npm run cards:effects-index` and `npm run cards:measure` were rerun.

## Notes for later

- A DON!! rest with only DON!! to choose from still asks which class (one answer) when `exactly` is less than the number active: PRB02-005 therefore shows its opponent a one-answer prompt at the start of their Main Phase (the opponent is the chooser). The same prompt exists today for OP11-024, OP11-035 and OP12-018. Auto-answering it changes those cards' tests and recorded flows, so it was left for a separate change (BACKLOG).
- An Event activated from the trash is an effect frame whose source stays in the trash: a [Main] that names "this card" would read it there. A search of the Events of cost 7 or less for "this card" in a [Main] finds only reminder text and the in-hand cost clause of OP15-021 (not a [Main]); revisit if one reads itself.

## Results

Gate results are in the DECISIONS entry "M6b-2 wave 8: D2, D8, D9". **`ENGINE_VERSION` stays 0.5.18, goldens not re-recorded.** No recorded game plays out differently: the new `Delayed.at`, `Ev.subject` and `free` Events are reached only by the new actions and by the six newly scripted cards; `fire` passes the subject only to an ability that selects it; the selector `lki` was rejected by the validator before, so no script used it; the `play` frame with `free` was reachable before only for Characters and Stages. The golden games and the 2,000-game property run replay with the same hashes with the version unchanged; a record containing one of the six cards carries a different per-game scripts hash and opens as the old one did (`scriptsVersionOf`).
