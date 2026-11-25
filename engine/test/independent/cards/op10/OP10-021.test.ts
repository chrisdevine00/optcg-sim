/**
 * OP10-021 Punk Hazard (Stage, Red, cost 1, {Punk Hazard}).
 *
 * Card text: "[Activate: Main] You may rest this Stage: If your Leader is [Caesar Clown], give up to
 * 1 rested DON!! card to your Leader or 1 of your Characters."
 *
 * Rules: CR 8-3-1-3/-4 (an optional cost), CR 8-4-4-1 ("up to"), CR 6-5-5 (given DON!! add +1000
 * on its owner's turn), colon-less/after-colon "If" is an effect condition: the cost is paid first
 * and the check is made after it (DECISIONS 2026-11-24).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  atMain,
  canUse,
  don,
  LD10,
  mayDone,
  kind,
  mine,
  need,
  none,
  offeredAbilities,
  offeredInst,
  pickInst,
  SC10,
} from './kit-op10d.ts';

const ID = 'OP10-021';

function board(o: { leader?: string; active?: number; rested?: number; chars?: string[] } = {}) {
  const g = mine(o.leader ?? LD10.caesar, {
    stage: ID,
    characters: o.chars ?? [SC10.c3],
    costArea: { active: o.active ?? 5, rested: o.rested ?? 3 },
  });
  return g;
}

function activate(g: ReturnType<typeof board>) {
  const stage = g.zone('p1', 'stage')[0]!.instance;
  const [ability] = offeredAbilities(g, stage);
  if (!ability) throw new Error('No ability offered on the Stage');
  act(g, { type: 'activate', card: stage, ability });
  return stage;
}

describe('OP10-021 Punk Hazard [Activate: Main]: rest this Stage: if the Leader is [Caesar Clown], give a rested DON!!', () => {
  it('with [Caesar Clown] as Leader: rests the Stage and gives 1 rested DON!! to the Leader (+1000 on my turn)', () => {
    const g = board();
    const stage = activate(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.card(stage).rested).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(don(g, 'p1').rested).toBe(2);
    expect(don(g, 'p1').given).toBe(1);
  });

  it('the DON!! may go to one of my Characters instead', () => {
    const g = board();
    activate(g);
    const c3 = g.find('p1', 'characters', SC10.c3);
    expect(offeredInst(g)).toEqual([g.leader('p1'), c3].sort());
    pickInst(g, [c3]);
    expect(g.power(c3)).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the given DON!! comes from the rested ones, never from the active ones', () => {
    const g = board({ active: 5, rested: 1 });
    activate(g);
    pickInst(g, [g.leader('p1')]);
    expect(don(g, 'p1').active).toBe(5);
    expect(don(g, 'p1').rested).toBe(0);
  });

  it('with no rested DON!! nothing can be given (the Stage is still rested as the cost)', () => {
    const g = board({ active: 8, rested: 0 });
    const stage = activate(g);
    if (mayDone(g)) none(g);
    expect(g.card(stage).rested).toBe(true);
    expect(don(g, 'p1').given).toBe(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader that is not [Caesar Clown]: the cost is paid but no DON!! is given', () => {
    const g = board({ leader: LD10.smoker });
    const stage = activate(g);
    if (mayDone(g)) none(g);
    expect(g.card(stage).rested).toBe(true);
    expect(don(g, 'p1').given).toBe(0);
    expect(don(g, 'p1').rested).toBe(3);
    expect(atMain(g)).toBe(true);
  });

  it('"you may": not activating leaves the Stage active and gives nothing; activating asks no extra yes/no (activating is paying)', () => {
    const g = board();
    const stage = g.zone('p1', 'stage')[0]!.instance;
    expect(g.card(stage).rested).toBe(false);
    expect(don(g, 'p1').given).toBe(0);
    activate(g);
    expect(kind(g)).not.toBe('optional');
  });

  it('"up to 1": the target may be skipped; the Stage stays rested', () => {
    const g = board();
    const stage = activate(g);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.card(stage).rested).toBe(true);
    expect(don(g, 'p1').given).toBe(0);
    expect(don(g, 'p1').rested).toBe(3);
  });

  it('a rested Stage cannot be activated again (the cost is resting it)', () => {
    const g = board();
    const stage = activate(g);
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, stage)).toEqual([]);
  });

  it('must not give more than 1 DON!!: only one is given even with several rested', () => {
    const g = board({ active: 2, rested: 6 });
    activate(g);
    pickInst(g, [g.leader('p1')]);
    expect(don(g, 'p1').given).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('is offered in my Main Phase while the Stage is active, and only then', () => {
    const g = board();
    expect(canUse(g)).toBe(false);
    const stage = g.zone('p1', 'stage')[0]!.instance;
    expect(offeredAbilities(g, stage)).toHaveLength(1);
  });
});
