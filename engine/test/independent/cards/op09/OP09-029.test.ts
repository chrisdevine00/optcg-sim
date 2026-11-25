/**
 * OP09-029 Tony Tony.Chopper (Character, Green, cost 3, 4000, Counter +1000, {Animal}/{Straw Hat
 * Crew}/{ODYSSEY}).
 *
 * Card text: "[End of Your Turn] Set up to 1 of your "ODYSSEY" type Characters with a cost of 4 or less
 * as active."
 *
 * Rules: [End of Your Turn] activates in MY End Phase only (CR 6-6-1-1), not at the end of the
 * opponent's turn; "up to 1" may be 0 (CR 8-4-4-1); my Characters only; the type is {ODYSSEY}
 * (exact) and the cost is current cost 4 or less; Chopper is itself an {ODYSSEY} Character with
 * cost 3, so he can be the one set active; a card set active stays active through the opponent's
 * turn (the Refresh Phase only happens at the start of my own turn).
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  allOf,
  at,
  canFinish,
  choices,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  S9,
  settleOrders,
  type Place,
} from './kit-op09a.ts';

const CHOPPER = 'OP09-029';
const ODY5 = 'OP09-027'; // Sabo: Green, cost 5, 6000, {ODYSSEY}; only a [When Attacking] effect
const R = (card: string): Place => ({ card, rested: true });

function board(own: Place[], p2: Place[] = []): TestGame {
  return mine(L9.luffy, { characters: own }, { characters: p2 });
}

/** End my turn; the effect's question is now pending. */
function toEnd(g: TestGame): void {
  endTurn(g);
  settleOrders(g);
}

describe('OP09-029 Tony Tony.Chopper: [End of Your Turn] set up to 1 of my {ODYSSEY} Characters with cost 4 or less as active', () => {
  it('printed values: cost 3, 4000, Counter +1000', () => {
    const g = board([CHOPPER]);
    const c = at(g, 'p1', 'characters', CHOPPER);
    expect(g.card(c).cost).toBe(3);
    expect(g.power(c)).toBe(4000);
    expect(g.card(c).counter).toBe(1000);
  });

  it('at my End Phase the chosen rested {ODYSSEY} Character becomes active (and stays active for the opponent’s turn)', () => {
    const g = board([CHOPPER, R(S9.lucci)]);
    toEnd(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.lucci)]);
    expect(kind(g)).toBe('main');
    expect(g.decider).toBe('p2');
    expect(g.card(at(g, 'p1', 'characters', S9.lucci)).rested).toBe(false);
  });

  it('boundary: cost 4 is offered, cost 5 is not; non-{ODYSSEY} Characters are not offered', () => {
    const g = board([CHOPPER, R(S9.lucci), R(ODY5), R(S9.frankyR4)]);
    toEnd(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(S9.lucci);
    expect(offeredIds(g)).not.toContain(ODY5);
    expect(offeredIds(g)).not.toContain(S9.frankyR4);
  });

  it('Chopper himself (cost 3, {ODYSSEY}) can be the one set active', () => {
    const g = board([{ card: CHOPPER, rested: true }]);
    toEnd(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(at(g, 'p1', 'characters', CHOPPER));
    pickInst(g, [at(g, 'p1', 'characters', CHOPPER)]);
    expect(g.card(at(g, 'p1', 'characters', CHOPPER)).rested).toBe(false);
  });

  it('"up to 1": I may choose nobody and the Character stays rested', () => {
    const g = board([CHOPPER, R(S9.lucci)]);
    toEnd(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.card(at(g, 'p1', 'characters', S9.lucci)).rested).toBe(true);
  });

  it('only one Character is set active even when two rested ones qualify', () => {
    const g = board([CHOPPER, R(S9.lucci), R(S9.limBlocker)]);
    toEnd(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.lucci)]);
    expect(kind(g)).toBe('main');
    expect(g.card(at(g, 'p1', 'characters', S9.lucci)).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', S9.limBlocker)).rested).toBe(true);
  });

  it('only my own Characters are offered (an opposing {ODYSSEY} Character is not)', () => {
    const g = board([CHOPPER, R(S9.lucci)], [R(S9.lucci)]);
    toEnd(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(at(g, 'p2', 'characters', S9.lucci));
  });

  it('with nothing else rested (only an active Chopper) the turn passes without a stuck prompt', () => {
    const g = board([CHOPPER]);
    toEnd(g);
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('main');
    expect(g.decider).toBe('p2');
  });

  it('it is only for MY End Phase: nothing is asked at the end of the opponent’s turn', () => {
    const g = board([CHOPPER, R(S9.lucci)]);
    toEnd(g);
    if (kind(g) === 'choose') none(g);
    need(g, 'main', 'p2');
    endTurn(g);
    // p1's next turn begins with no [End of Your Turn] prompt for p1.
    need(g, 'main', 'p1');
  });

  it('two Chopper copies each set up to 1 Character active at my End Phase', () => {
    const g = board([CHOPPER, CHOPPER, R(S9.lucci), R(S9.limBlocker)]);
    toEnd(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.lucci)]);
    settleOrders(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.limBlocker)]);
    expect(allOf(g, 'p1', CHOPPER)).toHaveLength(2);
    expect(g.card(at(g, 'p1', 'characters', S9.lucci)).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', S9.limBlocker)).rested).toBe(false);
  });
});
