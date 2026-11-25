/**
 * OP09-115 Ice Block Partisan (Event, Yellow, cost 1, {Navy}).
 *
 * Card text: "[Main] K.O. up to 1 of your opponent's Characters with a cost of 3 or less and a [Trigger].
 * [Trigger] Draw 1 card."
 *
 * Rules: "a [Trigger]" means the Character has a [Trigger] ability; CR 8-4-4 ("up to").
 * Trigger Characters used: Speed (cost 2), Carrot (cost 2), Charlotte-type EB05-054 (cost 3, vanilla body
 * with a [Trigger]), OP03-026 (cost 4, has a [Trigger]). Marco (cost 3) and Mohji (cost 1) have none.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  chars,
  choices,
  deck,
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

const ID = 'OP09-115';
const TRIG3 = 'EB05-054';

function start(opp: string[], o: { mine?: string[]; active?: number } = {}) {
  const g = mine(
    L9.neutral,
    { hand: [ID], characters: o.mine ?? [], costArea: { active: o.active ?? 10, rested: 0 } },
    { characters: opp },
  );
  playId(g, ID);
  return g;
}

describe('OP09-115 Ice Block Partisan: [Main] K.O. up to 1 opposing Character with cost 3 or less and a [Trigger]', () => {
  it('offers exactly the opposing Characters with cost 3 or less that have a [Trigger]', () => {
    const g = start([C9.speed, C9.carrot, TRIG3, C9.c3, C9.trig4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.speed, C9.carrot, TRIG3].sort());
  });

  it("the chosen Character is K.O.'d (trash); the others stay; the Event is trashed", () => {
    const g = start([C9.speed, C9.carrot, C9.c3]);
    pickInst(g, [g.find('p2', 'characters', C9.speed)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.carrot, C9.c3].sort());
    expect(trash(g, 'p2')).toEqual([C9.speed]);
    expect(trash(g)).toEqual([ID]);
  });

  it('cost boundary: cost 3 with a [Trigger] qualifies; cost 4 with a [Trigger] does not', () => {
    const g = start([TRIG3, C9.trig4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TRIG3]);
  });

  it('a [Trigger] is required: cost 3 and cost 1 Characters without one are not offered (nothing to pick)', () => {
    const g = start([C9.c3, C9.c1]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([C9.c1, C9.c3].sort());
  });

  it("a Character with a [Trigger] but cost 4 alone: not offered, not K.O.'d", () => {
    const g = start([C9.trig4]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([C9.trig4]);
  });

  it('"up to 1": at most one is K.O.\'d, and choosing nothing is allowed', () => {
    const g = start([C9.speed, C9.carrot]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(chars(g, 'p2')).toEqual([C9.carrot, C9.speed].sort());
  });

  it("only the opponent's Characters: my own [Trigger] Character is never offered", () => {
    const g = start([C9.speed], { mine: [C9.carrot] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.speed]);
    expect(choices(g)).not.toContain(g.find('p1', 'characters', C9.carrot));
  });

  it('nothing is drawn by the [Main] (the draw belongs to the [Trigger])', () => {
    const g = start([C9.speed]);
    pickInst(g, [g.find('p2', 'characters', C9.speed)]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('it costs 1 DON!!: with no active DON!! it cannot be played', () => {
    const g = mine(
      L9.neutral,
      { hand: [ID], costArea: { active: 0, rested: 0 } },
      { characters: [C9.speed] },
    );
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});

describe('OP09-115 [Trigger] draw 1 card', () => {
  function hit() {
    const g = theirs(L9.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [C9.c4, C9.c5, ...Array(10).fill(BLUE)],
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it("activating draws exactly 1 card; the Event is trashed and nothing is K.O.'d", () => {
    const g = hit();
    activateTrigger(g);
    expect(hand(g)).toEqual([C9.c4]);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(11);
  });

  it('declining puts the Event into my hand', () => {
    const g = hit();
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
  });
});
