/**
 * OP09-040 Thunder Lance Flip Caliber Phoenix Shot (Event, Green, cost 3, {Straw Hat Crew}/
 * {Supernovas}/{ODYSSEY}).
 *
 * Card text: "[Main] If you have 2 or more rested Characters, K.O. up to 1 of your opponent's
 * Characters with a cost of 4 or less.
 * [Trigger] Rest up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: a colon-less "If" is an effect condition (the Event is still spent); CR 8-4-4 ("up to").
 * The Leader needs no type: only the rested-Character count matters.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  chars,
  choices,
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

const ID = 'OP09-040';
const REST = (c: string) => ({ card: c, rested: true });

function start(
  o: {
    mine?: (string | { card: string; rested?: boolean })[];
    opp?: (string | { card: string; rested?: boolean })[];
    leader?: string;
  } = {},
) {
  const g = mine(
    o.leader ?? L9.neutral,
    { hand: [ID], characters: o.mine ?? [REST(C9.c2), REST(C9.c3)] },
    { characters: o.opp ?? [C9.c4, C9.c5, C9.c2] },
  );
  playId(g, ID);
  return g;
}

describe('OP09-040 Thunder Lance Flip Caliber Phoenix Shot: [Main] with 2+ rested Characters, K.O. up to 1 opposing Character with cost 4 or less', () => {
  it("printed effect: offers the opposing Characters with cost 4 or less; the chosen one is K.O.'d (trash)", () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c2, C9.c4].sort());
    pickInst(g, [g.find('p2', 'characters', C9.c4)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.c2, C9.c5].sort());
    expect(trash(g, 'p2')).toEqual([C9.c4]);
    expect(trash(g)).toEqual([ID]);
  });

  it('cost boundary: cost 4 qualifies, cost 5 does not (the only Character is cost 5: nothing to pick)', () => {
    const g = start({ opp: [C9.c5] });
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([C9.c5]);
  });

  it('count boundary: exactly 2 rested Characters is enough, even with active Characters besides', () => {
    const g = start({ mine: [REST(C9.c2), REST(C9.c3), C9.c4] });
    need(g, 'choose', 'p1');
  });

  it("count boundary: only 1 rested Character: nothing is asked, nothing is K.O.'d, the Event is spent", () => {
    const g = start({ mine: [REST(C9.c2), C9.c3] });
    expect(kind(g)).not.toBe('choose');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.c2, C9.c4, C9.c5].sort());
    expect(trash(g)).toEqual([ID]);
  });

  it('active Characters do not count: 3 active Characters and none rested does nothing', () => {
    const g = start({ mine: [C9.c2, C9.c3, C9.c4] });
    expect(kind(g)).not.toBe('choose');
    expect(chars(g, 'p2')).toHaveLength(3);
  });

  it('opposing rested or active Characters are equally valid targets (only the cost matters)', () => {
    const g = start({ opp: [REST(C9.c4), C9.c3] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c3, C9.c4].sort());
  });

  it('"up to 1": at most one is K.O.\'d, and choosing nothing is allowed', () => {
    const g = start();
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(chars(g, 'p2')).toHaveLength(3);
  });

  it("only the opponent's Characters: my own rested Characters are never offered", () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.find('p1', 'characters', C9.c2));
    expect(choices(g)).not.toContain(g.find('p1', 'characters', C9.c3));
  });

  it('no Leader type is required (a plain Leader with 2 rested Characters works)', () => {
    const g = start({ leader: L9.luffy });
    need(g, 'choose', 'p1');
  });
});

describe("OP09-040 [Trigger] rest up to 1 of the opponent's Characters with a cost of 4 or less", () => {
  function hit(opp: string[]) {
    const g = theirs(L9.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: opp });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it("offers cost 4 or less, not cost 5; the chosen Character is rested (not K.O.'d)", () => {
    const g = hit([C9.c4, C9.c5]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c4]);
    pickInst(g, [g.find('p2', 'characters', C9.c4)]);
    expect(g.card(g.find('p2', 'characters', C9.c4)).rested).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.c4, C9.c5].sort());
    expect(trash(g)).toEqual([ID]);
  });

  it('works without any rested Characters of mine (no condition)', () => {
    const g = hit([C9.c4]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
  });

  it('"up to 1": choosing nothing rests nothing', () => {
    const g = hit([C9.c4, C9.c3]);
    activateTrigger(g);
    none(g);
    expect(g.card(g.find('p2', 'characters', C9.c4)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', C9.c3)).rested).toBe(false);
  });

  it('declining puts the Event into my hand', () => {
    const g = hit([C9.c4]);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
  });
});
