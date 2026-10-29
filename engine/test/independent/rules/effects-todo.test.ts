/**
 * Engine test checklist items (rules-digest.md) that cannot be produced without card effects.
 * Each becomes a real test once the effect DSL and scripts land (M4). Non-effect checklist items
 * are tested in the other files of this folder.
 */
import { describe, it } from 'vitest';

describe('checklist items that need effects (M4)', () => {
  const todo = (name: string) => it.todo(`${name} (needs M4 effects)`);

  todo(
    'CR 1-3-2-1: resting an already-rested card is "not performed", so a cost needing it cannot be paid',
  );
  todo('CR 1-3-2-2: a count of 0 or less does nothing');
  todo('CR 1-3-3: a prohibition beats a requirement');
  todo(
    'CR 1-3-4 / 1-3-10: the turn player chooses and acts first in simultaneous choices and actions',
  );
  todo('CR 1-3-5 / 1-3-5-1 / 4-8-1: "up to N" allows 0');
  todo('CR 1-3-6 / 1-3-6-1 / 1-3-6-1-1: power may go negative and the card stays on the field');
  todo('CR 1-3-6-2 / 1-3-6-2-1: cost floors at 0 outside a calculation');
  todo('CR 1-3-7 / 2-8-3: effect text resolves top to bottom');
  todo('CR 1-3-8: rest and set active at the same time → rested');
  todo('CR 2-1-2 / 2-1-2-1 / 2-1-3: exact vs substring name matching; text-granted names');
  todo('CR 2-3-5: a multicolor card matches each of its colors');
  todo('CR 2-4-3 / 2-4-3-1 / 2-4-4: exact vs substring type matching; text-granted types');
  todo(
    'CR 2-5-4 / 2-5-6 / 2-5-7: attribute matching, including multiple and text-granted attributes',
  );
  todo('CR 2-8-2: Leader, Character and Stage text is inactive outside its own area');
  todo('CR 2-10-4: only the highest of several Counter values applies');
  todo('CR 4-9-2-1 / 4-9-2-2: several base-setting effects → highest value applies');
  todo('CR 4-12-1 / 4-12-2: Set Power to 0 subtracts current power; no effect if already negative');
  todo('CR 5-1-2-4: deck-construction effects override the 5-1-2 rules');
  todo(
    'CR 5-2-1-5-1 / 5-2-1-5-2: start-of-game Leader effects run chooser first, before hands are drawn',
  );
  todo('CR 3-1-6 / 3-1-6-1: a card leaving the Character or Stage area loses all applied effects');
  todo(
    'CR 3-1-7 / 3-1-8: owner orders simultaneous placements; order hidden when moving open → secret',
  );
  todo('CR 3-6-3: the Leader cannot be moved by any effect');
  todo('CR 3-10-2-1 / 3-10-3: face-up Life is open; looking at Life preserves facing');
  todo('CR 4-4-2: effects cannot set given DON!! active or rested');
  todo('CR 4-5-3 / 4-5-4: draw 0 does nothing; "draw up to X" may stop early');
  todo('CR 4-6-2 / 4-6-2-2: X-point effect damage moves X Life cards one at a time');
  todo(
    'CR 4-6-3 / 4-6-3-1: [Trigger] is offered on damage, and blocked if the card cannot go to hand',
  );
  todo('CR 4-10-1 / 4-10-2: "if" failure blocks the next clause; "then" failure does not');
  todo('CR 6-2-2: start-of-turn effects for both players activate at Refresh');
  todo('CR 6-5-1: start-of-Main-Phase effects activate');
  todo('CR 2-7-3 / 8-4-2: an Event is revealed, paid for, trashed, then resolved');
  todo(
    'CR 6-6-1-1..6-6-1-1-4: End of Your Turn then End of Your Opponent’s Turn, once each, each player ordering their own',
  );
  todo('CR 7-1-1-3 / 10-2-16-1: [When Attacking] resolves before [On Your Opponent’s Attack]');
  todo('CR 7-1-1-4 / 7-1-2-3 / 7-1-3-1-3: attacker or target leaving → skip to End of the Battle');
  todo('CR 7-1-2-2 / 10-2-15-1: [On Block] activates on blocking');
  todo(
    'CR 7-1-3-1-2 / 10-2-4-1: Event [Counter] costs DON!! and only works in the opponent’s Counter Step',
  );
  todo('CR 10-2-4-1-2: an effect cannot activate [Counter] unless it says "activate [Counter]"');
  todo(
    'CR 7-1-4-1: ties at zero or negative power still go to the attacker (-2000 vs -2000; 0 vs 0)',
  );
  todo(
    'CR 7-1-4-1-1-2: the defender may reveal a [Trigger] Life card and activate it instead of adding it to hand',
  );
  todo(
    'CR 7-1-4-1-1-3 / 10-1-2-1: Double Attack damage stays 2 if the attacker leaves during the first [Trigger]',
  );
  todo('CR 7-1-5-2: end-of-battle triggers activate before battle-duration effects expire');
  todo(
    'CR 8-1-2: "may" effects optional; others mandatory as far as possible; an [On Play] with a cost may be declined',
  );
  todo('CR 8-1-3-1: an auto effect fires once per occurrence');
  todo('CR 8-1-3-1-3: an auto effect does not activate if its card moved first');
  todo('CR 8-4-5: move-triggered auto effects fire only into open areas');
  todo(
    'CR 8-1-3-2 / 10-2-2-1 / 10-2-3-1: [Activate: Main] and [Main] only in your Main Phase, never in battle',
  );
  todo('CR 8-1-3-3-3: "under the rules" permanent effects work from secret areas');
  todo('CR 8-1-3-3-5: permanent-effect interaction (turn player first, repeat until stable)');
  todo('CR 8-1-3-4-2: replacement precedence (source card, turn player, non-turn player)');
  todo('CR 8-1-3-4-3: the same replacement does not reapply to the same event');
  todo('CR 8-1-3-4-4 / 8-1-3-4-4-1: mid-text replacement, then the rest of the text continues');
  todo('CR 8-1-3-4-5 / 8-1-3-4-6 / 8-1-3-4-7: impossible replacements, chaining, ownership');
  todo('CR 8-2-1-1 / 8-2-1-2 / 8-2-2 / 8-2-3 / 8-2-4: invalidation semantics');
  todo('CR 8-3-1-1 / 8-3-1-2: activation-cost ordering');
  todo('CR 8-3-1-3 / 8-3-1-3-1: a cost that cannot be paid in full cannot be paid at all');
  todo('CR 8-3-1-4: an optional cost that is skipped → no effect');
  todo('CR 8-3-1-5: ① rests N active cost-area DON!!');
  todo('CR 8-3-1-6 / 10-2-10-1: DON!! −X returns given, active or rested DON!! to the DON!! deck');
  todo('CR 8-3-1-7: replaced costs');
  todo('CR 8-3-2-1 / 8-3-2-2: all conditions required, including added ones');
  todo(
    'CR 8-3-2-3 / 10-2-9-1 [open-question Q7]: [DON!! xX] true at ≥ X, checked at the activation timing',
  );
  todo('CR 8-3-2-4 / 8-3-2-5: [Your Turn] / [Opponent’s Turn]');
  todo('CR 8-3-3: a failed "if" stops the rest of the text');
  todo('CR 8-4-1: activation procedure order');
  todo('CR 8-4-4 / 8-4-4-1: choices made at resolution, as many as possible');
  todo('CR 8-4-4-2: a player may whiff a search in a secret area');
  todo('CR 8-4-4-3: default target is the source card or its controller');
  todo('CR 8-4-6: evaluate against current continuous and permanent effects');
  todo('CR 8-5-4: "when you activate an Event" is not triggered by an Event’s [Trigger]');
  todo(
    'CR 8-6-1: turn player resolves first; a new turn-player effect waits for pending non-turn-player effects',
  );
  todo('CR 8-6-1-1: pending B resolves before newly triggered C');
  todo('CR 8-6-2 / 8-6-2-1: triggers during damage wait, except [Trigger], which pauses damage');
  todo('CR 8.6.3: triggers caused by an activation wait for that activation to finish');
  todo(
    'CR 10-1-5-1 / 10-1-5-2: [Trigger] is optional; a declined Trigger card goes to hand unrevealed',
  );
  todo('CR 10-1-5-3: a [Trigger] card is in no area during activation, then is trashed');
  todo(
    'CR 10-1-7-1: [Unblockable] prevents [Blocker] (no card has a verified [Unblockable] override yet)',
  );
  todo('CR 10-2-1-3: an effect that trashes a Character is not a K.O.');
  todo(
    'CR 10-2-13-1..10-2-13-5: [Once Per Turn] per card, reset on a new object, consumed by a failed payment',
  );
  todo('CR 10-2-14-1: a "Trash" cost means discarding from hand');
  todo('CR 10-2-17-1 / 10-2-17-2: [On K.O.] activates on the field and resolves from the trash');
  todo('CR 11-1-1-1 / 11-1-1-2 / 11-1-1-3: infinite loops (draw, or a declared iteration count)');
  todo('CR 11-2-1 / 11-2-2: secret → secret moves are revealed, then unrevealed');
  todo(
    'CR 11-3-1 / 11-3-2 / 11-3-3: looking at secret areas is private and leaves cards as they were',
  );
  todo('QA-GR "cannot be rested": blocks attacking, [Blocker], rest costs and effect rests');
  todo('QA-GR "Trigger only on damage": an effect moving a Life card offers no [Trigger]');
  todo('QA-GR "Life top/bottom to owner": looked-at Life returns to its owner’s Life');
  it.todo(
    'Format: banned cards, banned pairs and Standard block legality (deck validator in cards/, not the engine)',
  );
});
