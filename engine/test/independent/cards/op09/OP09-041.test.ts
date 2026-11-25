/**
 * OP09-041 Soul Franky Swing Arm Boxing Solid (Event, Green, cost 1, {Straw Hat Crew}/{ODYSSEY}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this battle.
 * Then, if your Leader has the "ODYSSEY" type and you have 2 or more rested Characters, set up to 2 of
 * your Characters as active.
 * [Trigger] Rest up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: CR 10-2-4 ([Counter]), CR 8-4-4 ("up to"), "during this battle" ends with the battle.
 * The "If" belongs to the second sentence only: the boost is unconditional.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  canCounterNow,
  choices,
  counterSpot,
  don,
  endCounter,
  hitLeader,
  kind,
  L9,
  need,
  none,
  offeredIds,
  pickInst,
  reachablePickSets,
  theirs,
  trash,
  useEvent,
} from './kit-op09d.ts';

const ID = 'OP09-041';
const REST = (c: string) => ({ card: c, rested: true });

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

describe('OP09-041 Soul Franky Swing Arm Boxing Solid: [Counter] +2000 this battle, then with ODYSSEY and 2+ rested Characters set up to 2 active', () => {
  it('printed effect: Leader +2000 holds off the 6000 attack, then both rested Characters are set active', () => {
    const g = spot();
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', C9.c2), g.find('p1', 'characters', C9.c3)]);
    expect(g.card(g.find('p1', 'characters', C9.c2)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', C9.c3)).rested).toBe(false);
    endCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
  });

  it('the boost lasts for the battle only: after it, the Leader is back at 5000', () => {
    const g = spot();
    useEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    none(g);
    endCounter(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boost candidates are my Leader and Characters only', () => {
    const g = spot();
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c2, C9.c3, L9.ody].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('"set up to 2": any number from 0 to 2 may be set active, never more', () => {
    const g = spot({ mine: [REST(C9.c2), REST(C9.c3), REST(C9.c4)] });
    useEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('setting only 1 active leaves the other rested', () => {
    const g = spot({ mine: [REST(C9.c2), REST(C9.c3), REST(C9.c4)] });
    useEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [g.find('p1', 'characters', C9.c4)]);
    expect(g.card(g.find('p1', 'characters', C9.c4)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', C9.c2)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', C9.c3)).rested).toBe(true);
  });

  it('the rested Characters are offered as candidates for "set as active"', () => {
    const g = spot();
    useEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(C9.c2);
  });

  it('boundary: only 1 rested Character: the boost applies, no second prompt, the Character stays rested', () => {
    const g = spot({ mine: [REST(C9.c2), C9.c3] });
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.card(g.find('p1', 'characters', C9.c2)).rested).toBe(true);
  });

  it('a Leader without {ODYSSEY}: the boost applies (unconditional), nothing is set active', () => {
    const g = spot({ leader: L9.neutral });
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.card(g.find('p1', 'characters', C9.c2)).rested).toBe(true);
    endCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('the boost can go to a Character instead of the Leader', () => {
    const g = spot();
    useEvent(g, ID);
    pickInst(g, [g.find('p1', 'characters', C9.c2)]);
    expect(g.power(g.find('p1', 'characters', C9.c2))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it costs 1 DON!!: with no active DON!! it cannot be used', () => {
    const g = spot({ active: 0 });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });
});

describe("OP09-041 [Trigger] rest up to 1 of the opponent's Characters with a cost of 4 or less", () => {
  function hit(opp: (string | { card: string; rested?: boolean })[]) {
    const g = theirs(L9.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: opp });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('offers the opposing Characters with cost 4 or less (cost 5 is not offered); the chosen one is rested', () => {
    const g = hit([C9.c4, C9.c5, C9.c2]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c2, C9.c4].sort());
    pickInst(g, [g.find('p2', 'characters', C9.c4)]);
    expect(g.card(g.find('p2', 'characters', C9.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', C9.c2)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', C9.c5)).rested).toBe(false);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": choosing nothing rests nothing', () => {
    const g = hit([C9.c4]);
    activateTrigger(g);
    none(g);
    expect(g.card(g.find('p2', 'characters', C9.c4)).rested).toBe(false);
  });

  it('declining puts the Event into my hand', () => {
    const g = hit([C9.c4]);
    g.act({ type: 'trigger', activate: false });
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([ID]);
    expect(g.card(g.find('p2', 'characters', C9.c4)).rested).toBe(false);
  });
});
