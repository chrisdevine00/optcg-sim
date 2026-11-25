/**
 * OP09-058 Special Muggy Ball (Event, Blue, cost 2, {Buggy Pirates}).
 *
 * Card text: "[Main] Your opponent chooses 1 of their Character with a cost of 6 or less and return to
 * the owner's hand.
 * [Trigger] Return up to 1 Character with a cost of 3 or less to the owner's hand."
 *
 * Rules: the OPPONENT makes the choice; it is exactly 1 (not "up to"); the card returns to its owner's
 * hand; the [Trigger] is "up to 1" over Characters of either player.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  canFinish,
  chars,
  choices,
  decision,
  hand,
  hitLeader,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playId,
  reachablePickSets,
  theirs,
  trash,
} from './kit-op09d.ts';

const ID = 'OP09-058';

function start(o: { opp?: string[]; mine?: string[]; active?: number } = {}) {
  const g = mine(
    L9.neutral,
    { hand: [ID], characters: o.mine ?? [C9.c2], costArea: { active: o.active ?? 10, rested: 0 } },
    { characters: o.opp ?? [C9.c4, C9.c6, C9.c7] },
  );
  playId(g, ID);
  return g;
}

describe('OP09-058 Special Muggy Ball: [Main] my opponent chooses 1 of their Characters with cost 6 or less and returns it to their hand', () => {
  it('the choice belongs to the OPPONENT (p2), among their own Characters with cost 6 or less (cost 7 is not offered)', () => {
    const g = start();
    need(g, 'choose', 'p2');
    expect(decision(g)?.player).toBe('p2');
    expect(offeredIds(g)).toEqual([C9.c4, C9.c6].sort());
  });

  it("the chosen Character goes to its owner's hand (not the trash, not mine); then it is my Main Phase again", () => {
    const g = start();
    pickInst(g, [g.find('p2', 'characters', C9.c6)]);
    expect(atMain(g, 'p1')).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.c4, C9.c7].sort());
    expect(hand(g, 'p2')).toContain(C9.c6);
    expect(trash(g, 'p2')).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('exactly 1 is required: the opponent cannot choose nothing while a candidate exists', () => {
    const g = start();
    need(g, 'choose', 'p2');
    expect(canFinish(g)).toBe(false);
    for (const s of reachablePickSets(g)) expect(s.split('+').filter(Boolean)).toHaveLength(1);
  });

  it('cost boundary: cost 6 is returnable, cost 7 is not (the only Character is cost 7: nothing happens, nothing is asked)', () => {
    const g = start({ opp: [C9.c7] });
    expect(kind(g)).not.toBe('choose');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.c7]);
    expect(hand(g, 'p2')).not.toContain(C9.c7);
  });

  it('a single candidate among others above the limit (cost 4 with cost 7 beside it) is the one returned', () => {
    const g = start({ opp: [C9.c4, C9.c7] });
    if (kind(g) === 'choose') pickInst(g, [g.find('p2', 'characters', C9.c4)]);
    expect(chars(g, 'p2')).toEqual([C9.c7]);
    expect(hand(g, 'p2')).toContain(C9.c4);
  });

  it('my own Characters are never offered and are not returned', () => {
    const g = start({ mine: [C9.c2, C9.c3] });
    need(g, 'choose', 'p2');
    expect(choices(g).every((i) => g.card(i).owner === 'p2')).toBe(true);
    pickInst(g, [g.find('p2', 'characters', C9.c4)]);
    expect(chars(g, 'p1')).toEqual([C9.c2, C9.c3].sort());
  });

  it('when the opponent has no Character at all, nothing happens and the Event is still spent', () => {
    const g = start({ opp: [] });
    expect(kind(g)).not.toBe('choose');
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ID]);
  });

  it('it costs 2 DON!!: with 1 active DON!! it cannot be played', () => {
    const g = mine(
      L9.neutral,
      { hand: [ID], costArea: { active: 1, rested: 0 } },
      { characters: [C9.c4] },
    );
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});

describe("OP09-058 [Trigger] return up to 1 Character with a cost of 3 or less to its owner's hand", () => {
  function hit(mineChars: string[], opp: string[]) {
    const g = theirs(
      L9.neutral,
      { life: [ID, BLUE, BLUE, BLUE], characters: mineChars },
      { characters: opp },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('offers Characters of BOTH players with cost 3 or less (cost 4 is not offered)', () => {
    const g = hit([C9.c2, C9.c4], [C9.c3, C9.c5]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c2, C9.c3].sort());
  });

  it("an opposing Character returns to the OPPONENT's hand", () => {
    const g = hit([C9.c2], [C9.c3]);
    activateTrigger(g);
    pickInst(g, [g.find('p2', 'characters', C9.c3)]);
    expect(chars(g, 'p2')).toEqual([]);
    expect(hand(g, 'p2')).toContain(C9.c3);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('my own Character may be chosen and returns to MY hand', () => {
    const g = hit([C9.c2], [C9.c3]);
    activateTrigger(g);
    pickInst(g, [g.find('p1', 'characters', C9.c2)]);
    expect(chars(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([C9.c2]);
  });

  it('"up to 1": nothing may be chosen, and never more than one is returned', () => {
    const g = hit([C9.c2], [C9.c3]);
    activateTrigger(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(chars(g, 'p1')).toEqual([C9.c2]);
    expect(chars(g, 'p2')).toEqual([C9.c3]);
  });

  it('declining puts the Event into my hand', () => {
    const g = hit([], [C9.c3]);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(chars(g, 'p2')).toEqual([C9.c3]);
  });
});
