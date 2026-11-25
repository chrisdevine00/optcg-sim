/**
 * OP10-019 Divine Departure (Event, Red, cost 1, {The Four Emperors}/{Red-Haired Pirates}).
 *
 * Card text: "[Main] You may rest 5 of your DON!! cards: K.O. up to 1 of your opponent's Characters
 * with 8000 power or less.
 * [Counter] Up to 1 of your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1-3/-4 (an optional cost that cannot be paid or is declined: no effect), CR 8-4-4-1
 * ("up to"), RL-08 ("during this battle"), CR 2-7-3 (an Event is played by resting DON!! equal to
 * its cost, so the Main cost is 1 + 5 active DON!!). Only active DON!! can be rested.
 */
import { describe, expect, it } from 'vitest';
import { act, passCounter } from '../../helpers.ts';
import {
  activateCounter,
  atMain,
  canCounterNow,
  choices,
  defend,
  don,
  kind,
  LD10,
  mayDone,
  mine,
  need,
  no,
  none,
  offeredInst,
  pickInst,
  playId,
  SC10,
  trash,
  unusable,
  yes,
} from './kit-op10d.ts';

const ID = 'OP10-019';

function main(o: { active?: number; rested?: number; p2?: string[]; own?: string[] } = {}) {
  const g = mine(
    LD10.neutral,
    {
      hand: [ID],
      costArea: { active: o.active ?? 6, rested: o.rested ?? 0 },
      characters: o.own ?? [],
    },
    { characters: o.p2 ?? [SC10.c6, SC10.c7] },
  );
  playId(g, ID);
  return g;
}

describe('OP10-019 Divine Departure [Main]: you may rest 5 DON!!: K.O. up to 1 Character with 8000 power or less', () => {
  it('pay: 5 more DON!! are rested and the 8000-power Character is K.O.d (boundary: 8000 qualifies)', () => {
    const g = main();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.c6)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c7]);
    expect(trash(g, 'p2')).toEqual([SC10.c6]);
    expect(don(g, 'p1').active).toBe(0);
    expect(don(g, 'p1').rested).toBe(6);
    expect(trash(g)).toEqual([ID]);
  });

  it('offers only the opposing Characters of 8000 power or less: 9000 is not a candidate', () => {
    const g = main({ p2: [SC10.c5, SC10.c6, SC10.c7], own: [SC10.c2] });
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    const ok = [SC10.c5, SC10.c6].map((c) => g.find('p2', 'characters', c)).sort();
    expect(offeredInst(g)).toEqual(ok);
  });

  it('"you may": declining pays nothing and K.O.s nothing', () => {
    const g = main();
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').active).toBe(5);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('CR 8-3-1-3: with 4 active DON!! left after the cost of 1, the 5 cannot be rested: unusable, nothing K.O.d', () => {
    const g = main({ active: 5 });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').active).toBe(4);
  });

  it('rested DON!! cannot be rested again: 4 active + 4 rested after the cost is unpayable', () => {
    const g = main({ active: 5, rested: 4 });
    unusable(g, 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').rested).toBe(5);
  });

  it('exactly 5 are left after the cost of 1 (6 active): payable', () => {
    const g = main({ active: 6 });
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(choices(g).length).toBeGreaterThan(0);
  });

  it('"up to 1": the cost is paid and no Character need be chosen', () => {
    const g = main();
    yes(g, 'p1');
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').rested).toBe(6);
  });

  it('at most 1 Character is K.O.d even when two qualify', () => {
    const g = main({ p2: [SC10.c5, SC10.c6] });
    yes(g, 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(kind(g)).toBe('main');
  });

  it('must not K.O. my own Characters or the opposing Leader: only opposing Characters are offered', () => {
    const g = main({ p2: [SC10.c4], own: [SC10.c2] });
    yes(g, 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c4)]);
  });
});

describe('OP10-019 Divine Departure [Counter]: up to 1 of your Leader gains +3000 power during this battle', () => {
  it('+3000 on the Leader (8000) beats a 7000 attacker; the boost ends with the battle', () => {
    const g = defend({ hand: [ID], active: 1, p2chars: [SC10.c5], attackerCard: SC10.c5 });
    activateCounter(g, g.find('p1', 'hand', ID));
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only the Leader can take the boost: a Character of mine is never a candidate', () => {
    const g = defend({
      hand: [ID],
      active: 1,
      chars: [SC10.c4],
      p2chars: [SC10.c5],
      attackerCard: SC10.c5,
    });
    activateCounter(g, g.find('p1', 'hand', ID));
    if (kind(g) === 'choose') {
      expect(offeredInst(g)).toEqual([g.leader('p1')]);
      pickInst(g, [g.leader('p1')]);
    }
    expect(g.power(g.find('p1', 'characters', SC10.c4))).toBe(6000);
  });

  it('the Counter costs 1 DON!! only (not 5): usable with a single active DON!!; the rest effect is not paid', () => {
    const g = defend({ hand: [ID], active: 1, p2chars: [SC10.c5], attackerCard: SC10.c5 });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(true);
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('with 0 active DON!! it cannot be used as a Counter', () => {
    const g = defend({ hand: [ID], active: 0, p2chars: [SC10.c5], attackerCard: SC10.c5 });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
    act(g, { type: 'endCounter' });
  });
});
