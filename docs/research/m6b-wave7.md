# M6b-2 wave 7: what was built

Deliverable of PLAN §2a M6b-2, wave 7 (G59 to G67 and D3 of [m6b-runtime-audit.md](m6b-runtime-audit.md) §2 to §4). Method as in [wave 1](m6b-wave1.md) to [wave 6](m6b-wave6.md): a DSL type, an `IMPLEMENTED` entry and validation (every variant not built is refused), a hidden-zone classification, a runtime path, planted tests on vanilla test cards (no real card is scripted), each seen to fail with its implementation broken. `ENGINE_VERSION` stays **0.5.16**: see the last section. D3 was decided on 2026-11-23 (narrow: redirect to your Leader or a Character) and is built behind a read of the official Q&A, recorded below.

Tests: `engine/test/cards/m6b-w7/` (10 files, 78 tests), `ai/test/m6b-w7-bound.test.ts` (10) and `cards/test/m6b-w7-hidden.test.ts` (10). Counts and the full-suite result are in the last section.

## Per gap

| Gap | DSL | Runtime | Test |
| --- | --- | --- | --- |
| G59 attribute grant | `grant { target, keyword?, attribute?, duration }` (at least one of the two) | new `ModKind` `grantAttribute`; `Derived.attributes`; `eval.ts` `matchesOf` reads the derived attributes (the printed list when the game has no modifier) | `g59-grant-attribute.test.ts` |
| G60 no Life to hand | `restrict { target: 'you', what: 'cannotAddLifeToHandByOwnEffects', duration }` (a player restriction) | modifier `cannotLifeToHand` on the Leader (like `cannotDraw`); `run.ts` `move` (`lifeTop` and `lifeTopOrBottom` to your own hand), the `lifeToHand` cost (`payable` refuses it, `payCost` raises the anomaly) and the test-only internal step | `g60-no-life-to-hand.test.ts` |
| G61 Character into Life | `move { what: { from: 'characters', owner: you or opponent or any, pick: exactly or upTo 1 }, to: { zone: 'life', position: top or bottom or topOrBottom, faceUp? } }`, as an effect, a cost (`move` cost, owner `you` or `opponent`, exactly 1) and a replacement payload (`{ ref: 'replaced' }` names the replaced card) | `flow.ts` `pushRemove` takes the destination `life` and a face state (`Frame.remove.faceUp`); `runRemove` places the card in its owner's Life and marks a face-down card known to both players; `run.ts` `move` (and `fieldCost` for the cost) asks the end once for "top or bottom"; `applyReplacement` binds `replaced` for a payload that reads it | `g61-character-into-life.test.ts` |
| G62 Leader power cost | cost `power { target (your Leader, exactly 1), amount, duration }` | `run.ts` `payCost` adds the modifier; `eval.ts` `payable` needs the selector to match (an active Leader) | `g62-leader-power-cost.test.ts` |
| G63 not played by effects | `restrict { target: { from: 'self', owner: 'you' }, what: 'cannotBePlayedByEffects' }` in a `permanent` with `zone: 'hand'` | modifier `cannotPlayByEffect` at the restriction stage of the layers (hand-zone permanents were already computed); `Derived.noEffectPlay`; `run.ts` `play` drops such a card from its candidates | `g63-hand-no-effect-play.test.ts` |
| G64 look at Life | `lookAtLife { owner: 'you' or 'opponent' or 'any', n: 1, place: 'topOrBottom' }` and `lookAtLife { owner: 'you', n: 'all', place: 'anyOrder' }` | `run.ts` `lookAtLife`; new ops `placeLife` and `orderLife` (the cards never leave Life, no `lifeRemoved`); `markKnown` for the looker; the cards are in the frame's `look` list, so the looker's view shows them | `g64-look-at-life.test.ts` |
| G65 move a given DON!! | `moveDon { n, from (your Leader or Character, pick upTo 1 or exactly 1), to (your Character, exactly 1) }` | `run.ts`: the source is chosen among cards with DON!! given, then the destination (never the same card); counters on the two cards change; event `DonMoved` | `g65-move-given-don.test.ts` |
| G66 permanent negate | continuous `negate { target }` (a selector with a printed-values filter, no pick) | `derive.ts` `negationOf` reads every permanent negate once per memo, before the other stages; `deriveAt` adds a `negate` modifier to the cards it names and `isNegated` asks it too (so `liveSources`, replacements, `fire` and `computePerms` skip a negated source); the compile-time guard that no permanent negates is replaced by the real thing | `g66-permanent-negate.test.ts` |
| G67 stat of a selector | `Num` `{ statOf: Selector, stat: 'cost' or 'power' or 'basePower' }` (`from: 'leader'` or `'self'`, no pick) and `{ totalCost: Selector }` (a field selector, no pick) | `eval.ts` `numOf` | `g67-stat-of-selector.test.ts` |
| D3 redirect attack | `redirectAttack { to: Selector }` (your Leader and Characters, exactly 1), only in an auto ability on `onOpponentAttack` | `run.ts`: the choice, then `s.battle.target` and `keys.target` are rewritten; event `AttackRedirected`; nothing fires again | `d3-redirect-attack.test.ts` |

Validator refusals pinned by tests: `grant` with neither keyword nor attribute, an attribute that does not exist, no duration; the Life restriction on `opponent`, on a card selector or as a permanent; a `move` of a Character into Life with no position, from a Stage, from mixed zones, with `upTo: 2`, as a cost with owner `any`, `upTo`, or from a Stage; a power cost on a Character, on the opponent's Leader, with `upTo`, of 0, not an integer or with no duration; `cannotBePlayedByEffects` outside a hand permanent, on another selector, with a filter or pick, or as a timed restriction; `lookAtLife` of all the opponent's Life, of `any` in an order, with a count other than 1 or `all`, with the wrong `place`; `moveDon` with `n` below 1, from a Stage, from the opponent's cards, with `upTo: 2` for the source or `upTo` for the destination; a permanent `negate` with a pick, a bind, a state or keyword filter, a hand, or a duration; `statOf` with a pick, a bind, several zones, owner `any` or a stat that does not exist; `totalCost` with a pick or a hand; `redirectAttack` outside `onOpponentAttack` (`whenAttacking`, `onPlay`, an `activate`), for the opponent's cards, from a Stage or hand, with `upTo` or no pick.

## Revert checks

Each implementation was broken in turn (one line changed, its test file run, restored; `w7-revert.py` in the working tree during the work, deleted before the commit). Failures with the break in place, out of the file's tests:

| Break | Failing tests |
| --- | --- |
| G59 `attribute` filter reads the printed list | 3 of 6 |
| G60 the restriction is never in force | 2 of 8 |
| G61 the effect `move` into Life disabled / the removal goes to the trash instead of Life | 4 of 10 / 7 of 10 |
| G62 the power cost is not paid (the anomaly) | 2 of 5 |
| G63 the effect play ignores `noEffectPlay` | 1 of 5 |
| G64 `lookAtLife` does nothing | 11 of 13 |
| G65 `moveDon` disabled | 6 of 7 |
| G66 `deriveAt` adds no permanent negation | 4 of 8 |
| G67 `statOf` not read / `totalCost` not read | 3 of 7 / 3 of 7 |
| D3 `redirectAttack` disabled | 8 of 9 |

## Readings

Each is an open question with the competing reading (docs/OPEN-QUESTIONS.md M6b-Q76 to M6b-Q85); none was settled by an official answer except where D3 says so.

- **G59** the attribute is added to the printed ones and lasts the turn (M6b-Q76).
- **G60** the restriction covers a cost that adds a Life card to the hand (a cost is part of the effect, M6b-Q31, RL-16) and only your own Life moving to your own hand by your own effect: damage, the opponent's effects and an opponent's Life going to its owner's hand are not stopped (M6b-Q77).
- **G61** the card goes to its owner's Life, face-down unless the text says face-up (rules-digest 107), at the end the controller chooses. A removal like any other: replacements and "cannot be removed by your opponent's effects" apply, and a cost of yours that moves the opponent's Character counts as your effect for that protection (`byOpponentEffect` now reads a cost as an effect; a cost on your own Character is unchanged). A face-down card put into Life is known to both players (M6b-Q78).
- **G62** "active" is not rested; the cost can be paid again and the changes add up (M6b-Q79).
- **G63** the bar holds while the card is in the hand, for an effect of either player; a normal play is legal (M6b-Q80).
- **G64** rules-digest 108: the card returns to its owner's Life, with the face state it had; "up to 1" may be declined; a card moved inside Life is not removed, so no `lifeRemoved` watcher fires; the controller remembers what they saw (M6b-Q81).
- **G65** the source and the destination are different cards (M6b-Q82).
- **G66** the negation is the first stage of the layers; a source never negates itself; sources that negate each other would both do (M6b-Q83).
- **G67** the Leader's base power is read before base power is set at the stage that reads it (M6b-Q84).
- **D3** (M6b-Q85). Official Q&A read (the local copy of the official PDFs under `.cache/track-f/qa`, the documented route of `docs/research/rulings.md`): QA-OP12 OP12-020 and QA-OP16 OP16-080 (an attack redirected to a Leader is an attack on a Leader, so the attacker did not battle a Character); QA-EB01 EB01-029 ("change the attack target to my active Character": yes, so the new target may be active); QA-EB01 EB01-038 (a Blocker redirected to cannot then activate its [Blocker]: it is the attacked card, CR 10-1-4-1); QA-ST29 ST29-014 (a [Rush: Character] attack can be redirected to your Leader) and ST29-016 (an [Unblockable] attack can be redirected, even to a [Blocker]: "changing the attack's target with an effect is different from using [Blocker]"); QA-OP03 OP03-001 and QA-ST01 (a target set after the declaration stays; "when attacked" is read at the declaration). No answer covers whether the declaration's timings fire again; the audit proposed that [On Your Opponent's Attack] does (M6b-Q10). Built the other way: [On Your Opponent's Attack] and "when attacked" are read once, at the declaration, so the redirect fires nothing again, and the Block Step it precedes is the one for the new target.

## Hidden information and the AI

- **No new prompt depends on a hidden card.** `lookAtLife` asks whose Life (the options are the players that have Life cards, public counts, with "none"), then the end (not asked with one Life card), or the order of all your Life cards (the number of prompts is the Life count); `moveDon` and `redirectAttack` choose among cards on the board; a Character placed into Life asks the end of the controller. `cards/src/hidden.ts` classifies `lookAtLife` and a move into Life as hidden-zone reads and the rest as reading none; `hidden-gate.ts` counts the new prompts, so a hidden condition that decides whether they are asked is a gate (`cards/test/m6b-w7-hidden.test.ts`).
- **Leak cases** (two-position tests): G64, two Life areas that differ only in their cards give the opponent the same view of the look, the decision and the placement; during the look only the looker's view lists the cards, afterwards only the looker's `known` map names them; the events the other player gets name no card. G61, a face-down card placed into Life is named in the events (it came off the field, which both saw) and has no handle where it is; both players' `known` map names it.
- **The lethal bound** (`ai/src/search/lethal/bound.ts`, `ai/test/m6b-w7-bound.test.ts`): `lookAtLife`, `moveDon`, `redirectAttack`, a `grant` of an attribute, a `move` into Life and the permanent `negate` are not in the neutral set, so `scanAbility` returns false and the solver searches; a repeatable ability paid with a power cost is not "limited", so it is searched too. `winsByEffect`: a move into Life counts (it changes a Life count); the three new ops that change no Life count and decide nothing are in `LIFE_SAFE_OPS` with the reason.

## Deferred

- **ST36-005** (Eustass "Captain" Kid, in the lead's list for D3) is not expressible after this wave: both its costs turn the top **or bottom** Life card face-down or face-up, a cost form the DSL does not have (`turnLifeFaceDown` and `turnLifeFaceUp` are the top N). It is not one of the audit's gaps. The redirect it needs is built.
- **EB01-029 and EB01-038** (a [Counter] that changes an attack's target) would need `redirectAttack` in a [Counter] timing; the validator allows only `onOpponentAttack`, as the audit's cards need.
- `redirectAttack` does not restart or repeat anything: a redirect after a Blocker was declared does nothing.
- Two permanents that negate each other are read as both negating (no card makes one). `negate` filters read printed values only.

## Cards now expressible, by set

- **EB-02:** EB02-009 (G65), EB02-053 (G64), EB02-057 (G61).
- **EB-03:** EB03-006 (G62).
- **EB-04:** EB04-023 (G62).
- **OP-09:** OP09-101 (G61).
- **OP-10:** OP10-022 (G67, with wave 6's G53 and G57), OP10-116 (G64).
- **OP-11:** OP11-101, OP11-116 (G61).
- **OP-12:** OP12-036 (G63, with wave 5's G46), OP12-117 (G61).
- **OP-13:** OP13-064 (G66), OP13-105 (G64).
- **OP-14:** OP14-053 (G67), OP14-060 (D3).
- **OP-15:** OP15-093 (G59).
- **OP-16:** OP16-080 (D3).
- **ST-15:** ST15-001 (G60).
- **ST-20:** ST20-003 (G64, with wave 6's G57).

20 cards (the audit's count). Cumulative with waves 1 to 6: 1,164 of 1,175 once they are scripted.

## Results

- Tests added: 78 in `engine/test/cards/m6b-w7/` (10 files), 10 in `ai/test/m6b-w7-bound.test.ts`, 10 in `cards/test/m6b-w7-hidden.test.ts`. One existing test edited: `app/test/m4b-fix.test.ts` lists every `ModKind`, so it lists the three new ones.
- Full suite (`npx vitest run engine cards ai`): 28,601 passed, 26 expected fail, 10 skipped, 164 todo (2,753 files; 33 skipped files). `ENGINE_GAMES=2000 npx vitest run engine/test/property engine/test/golden`: 29 passed (10 files). Typecheck, eslint and prettier are clean.
- **`ENGINE_VERSION` stays 0.5.16, goldens not re-recorded.** No recorded game plays out differently: every new shape is one no scripted card uses; the paths scripted cards run are unchanged for them. `byOpponentEffect` reads a cost as an effect, but every scripted cost moves your own card (cause by its owner), so the result is the same; `fieldCost` keeps its chosen cards in the frame scratch (the same field the removal path already used); `deriveAt` and `isNegated` consult the permanent negation only in a game whose cards have one (`negating`), and `matchesOf` reads the derived attributes only when the game has a modifier, with the same result as the printed list when none grants an attribute; `applyReplacement` binds `replaced` only for a payload that names it. No new `Def` field, so the card-data version is as it was. The golden games and the 2,000-game property run replay with the same hashes with the version unchanged.
