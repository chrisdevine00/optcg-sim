/**
 * OP09-039 Gum-Gum Cuatro Jet Cross Shock Bazooka (Event, Green, cost 1, {Straw Hat Crew}/{Supernovas}/
 * {ODYSSEY}).
 *
 * Card text: "[Counter] If your Leader has the "ODYSSEY" type and you have 2 or more rested Characters,
 * up to 1 of your Leader or Character cards gains +2000 power during this turn.
 * [Trigger] K.O. up to 1 of your opponent's rested Characters with a cost of 4 or less."
 *
 * Rules: CR 10-2-4 ([Counter]), a colon-less "If" is an effect condition (the Event is used and its
 * cost is spent even when the check fails), CR 8-4-4 ("up to"), "during this turn" outlasts the battle.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  canCounterNow,
  chars,
  choices,
  counterSpot,
  don,
  endCounter,
  hitLeader,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playable,
  reachablePickSets,
  theirs,
  trash,
  useEvent,
} from './kit-op09d.ts';

const ID = 'OP09-039';
const REST = (c: string) => ({ card: c, rested: true });

/** p1 (ODYSSEY Leader by default) defends against Hajrudin (6000) with the Event in hand. */
function spot(
  o: {
    leader?: string;
    mine?: (string | { card: string; rested?: boolean })[];
    active?: number;
  } = {},
) {
  return counterSpot(o.leader ?? L9.ody, {
    hand: [ID],
    characters: o.mine ?? [REST(C9.c2), REST(C9.c3)],
    costArea: { active: o.active ?? 1, rested: 0 },
  });
}

describe('OP09-039 Gum-Gum Cuatro Jet Cross Shock Bazooka: [Counter] if ODYSSEY Leader and 2+ rested Characters, +2000 this turn', () => {
  it('printed effect: the Leader gets +2000 (7000) and a 6000-power attack no longer hurts it', () => {
    const g = spot();
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
  });

  it('"during this turn": the boost is still there after the battle, in the rest of the opponent\'s turn', () => {
    const g = spot();
    useEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    endCounter(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('boundary: exactly 2 rested Characters is enough, with any number of active Characters besides', () => {
    const g = spot({ mine: [REST(C9.c2), REST(C9.c3), C9.c4, C9.c5] });
    useEvent(g, ID);
    need(g, 'choose', 'p1');
  });

  it('boundary: only 1 rested Character: the Event is used, nothing is asked, no power is gained, the attack hits', () => {
    const g = spot({ mine: [REST(C9.c2), C9.c3] });
    useEvent(g, ID);
    expect(kind(g)).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(5000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toEqual([ID]);
  });

  it('active Characters do not count: 2 active Characters and 0 rested gain nothing', () => {
    const g = spot({ mine: [C9.c2, C9.c3] });
    useEvent(g, ID);
    expect(kind(g)).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader without the {ODYSSEY} type: 2 rested Characters are not enough', () => {
    const g = spot({ leader: L9.neutral });
    useEvent(g, ID);
    expect(kind(g)).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(5000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('candidates are my Leader and my Characters only (not the attacker nor the opposing Leader)', () => {
    const g = spot();
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([C9.c2, C9.c3, L9.ody].sort());
  });

  it('the boost can go to a Character instead: a rested Character gets +2000 and the Leader stays at 5000', () => {
    const g = spot();
    useEvent(g, ID);
    pickInst(g, [g.find('p1', 'characters', C9.c3)]);
    expect(g.power(g.find('p1', 'characters', C9.c3))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": choosing nothing gives no boost; at most one card gets it', () => {
    const g = spot();
    useEvent(g, ID);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it costs 1 DON!!: with no active DON!! it cannot be used', () => {
    const g = spot({ active: 0 });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });

  it('must not happen: it is not playable in my own Main Phase (it only has [Counter] and [Trigger])', () => {
    const g = mine(L9.ody, { hand: [ID], characters: [REST(C9.c2), REST(C9.c3)] });
    expect(playable(g, ID)).toBe(false);
  });
});

describe("OP09-039 [Trigger] K.O. up to 1 of the opponent's rested Characters with a cost of 4 or less", () => {
  function hit(opp: (string | { card: string; rested?: boolean })[]) {
    const g = theirs(L9.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: opp });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('offers only rested Characters with cost 4 or less: cost 4 yes, cost 5 no, an active cost-3 no', () => {
    const g = hit([REST(C9.c4), REST(C9.c5), C9.c3]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c4]);
    pickInst(g, [g.find('p2', 'characters', C9.c4)]);
    expect(chars(g, 'p2')).toEqual([C9.c3, C9.c5].sort());
    expect(trash(g, 'p2')).toEqual([C9.c4]);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": at most one is K.O.\'d and none is allowed', () => {
    const g = hit([REST(C9.c4), REST(C9.c3)]);
    activateTrigger(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it("declining the [Trigger]: the Event goes to my hand and nothing is K.O.'d", () => {
    const g = hit([REST(C9.c4)]);
    g.act({ type: 'trigger', activate: false });
    expect(chars(g, 'p2')).toEqual([C9.c4]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([ID]);
  });
});
