/**
 * ST21-001 Monkey.D.Luffy (Red Leader, 5000, 5 Life, {Straw Hat Crew}/{The Four Emperors}).
 * "[DON!! x1] [Activate: Main] [Once Per Turn] Give up to 2 rested DON!! cards to 1 of your
 * Characters."
 * Rules: [DON!! x1] needs at least 1 DON!! given to this Leader; only RESTED DON!! can be given by
 * this effect; the target is a Character (not the Leader); "up to 2" allows 0, 1 or 2.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  asksDonCount,
  donCountOptions,
  donOf,
  inst,
  mainFor,
  mine,
  need,
  offeredAbilities,
  pickInst,
  SC,
  takeDon,
  useAbility,
} from './kit-st1821a.ts';

const LEADER = 'ST21-001';

function start(extra: Partial<PlayerSpec> = {}, leaderDon = 1) {
  return mine(
    { card: LEADER, don: leaderDon },
    { characters: [SC.c3, SC.c4], costArea: { active: 2, rested: 4 }, ...extra },
  );
}

describe('ST21-001 Monkey.D.Luffy: [DON!! x1] [Activate: Main] give up to 2 rested DON!! to 1 Character', () => {
  it('with 1 DON!! given to the Leader the activation is offered', () => {
    const g = start();
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
  });

  it('without a DON!! given to the Leader it is not offered', () => {
    const g = start({}, 0);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('asks how many (2, 1 or none), then gives that many rested DON!! to the chosen Character', () => {
    const g = start();
    useAbility(g, g.leader('p1'));
    expect(donCountOptions(g).sort()).toEqual(['0', '1', '2']);
    takeDon(g, 2);
    const target = inst(g, 'p1', 'characters', SC.c4);
    pickInst(g, [target]);
    mainFor(g);
    expect(g.card(target).don).toBe(2);
    expect(donOf(g, 'p1').rested).toBe(2);
    expect(donOf(g, 'p1').given).toBe(3);
    expect(donOf(g, 'p1').active).toBe(2);
  });

  it('giving 1 gives exactly 1', () => {
    const g = start();
    useAbility(g, g.leader('p1'));
    takeDon(g, 1);
    const target = inst(g, 'p1', 'characters', SC.c3);
    pickInst(g, [target]);
    expect(g.card(target).don).toBe(1);
    expect(donOf(g, 'p1').rested).toBe(3);
  });

  it('"up to": choosing none gives nothing', () => {
    const g = start();
    useAbility(g, g.leader('p1'));
    takeDon(g, 0);
    mainFor(g);
    expect(donOf(g, 'p1').given).toBe(1);
    expect(donOf(g, 'p1').rested).toBe(4);
  });

  it('only Characters can receive the DON!!: the Leader is not a target', () => {
    const g = start();
    useAbility(g, g.leader('p1'));
    takeDon(g, 2);
    need(g, 'choose', 'p1');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []))
      .sort();
    expect(offered).toEqual(
      g
        .zone('p1', 'characters')
        .map((c) => c.instance)
        .sort(),
    );
    expect(offered).not.toContain(g.leader('p1'));
  });

  it('with only 1 rested DON!! at most 1 can be given', () => {
    const g = start({ costArea: { active: 5, rested: 1 } });
    useAbility(g, g.leader('p1'));
    if (asksDonCount(g)) {
      expect(donCountOptions(g)).not.toContain('2');
      takeDon(g, 1);
    }
    pickInst(g, [inst(g, 'p1', 'characters', SC.c3)]);
    expect(donOf(g, 'p1').rested).toBe(0);
    expect(donOf(g, 'p1').active).toBe(5);
  });

  it('only rested DON!! are given: the 2 active DON!! are never used', () => {
    const g = start({ costArea: { active: 3, rested: 2 } });
    useAbility(g, g.leader('p1'));
    takeDon(g, 2);
    pickInst(g, [inst(g, 'p1', 'characters', SC.c3)]);
    expect(donOf(g, 'p1').active).toBe(3);
    expect(donOf(g, 'p1').rested).toBe(0);
  });

  it('Once Per Turn: it is not offered again after being used', () => {
    const g = start();
    useAbility(g, g.leader('p1'));
    takeDon(g, 1);
    pickInst(g, [inst(g, 'p1', 'characters', SC.c3)]);
    mainFor(g);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    expect(act).toBeDefined();
  });
});
