/**
 * ST21-009 Nami (Red Character, cost 3, 1000, Counter +1000, {Straw Hat Crew}).
 * "[Activate: Main] [Once Per Turn] Give up to 2 rested DON!! cards to 1 of your {Straw Hat Crew}
 * type Leader or Character cards."
 * Rules: only RESTED DON!! are given; the receiver must have the {Straw Hat Crew} type (Leader or
 * Character, Nami herself included); "up to 2" allows 0, 1 or 2; Once Per Turn.
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  asksDonCount,
  donCountOptions,
  donOf,
  inst,
  LD,
  mainFor,
  mine,
  need,
  offeredAbilities,
  pickInst,
  SC,
  takeDon,
  useAbility,
} from './kit-st1821a.ts';

const ID = 'ST21-009';

function start(leader: string = LD.luffy, rested = 4, active = 2) {
  return mine(leader, {
    characters: [ID, SC.shc3, SC.c3],
    costArea: { active, rested },
  });
}

function offeredTargets(g: TestGame): InstanceId[] {
  return g
    .legal()
    .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []))
    .sort();
}

describe('ST21-009 Nami: [Activate: Main] [Once Per Turn] give up to 2 rested DON!! to a {Straw Hat Crew} Leader or Character', () => {
  it('asks how many (2, 1 or none), then gives that many rested DON!! to the chosen card', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    expect(donCountOptions(g).sort()).toEqual(['0', '1', '2']);
    takeDon(g, 2);
    const target = inst(g, 'p1', 'characters', SC.shc3);
    pickInst(g, [target]);
    mainFor(g);
    expect(g.card(target).don).toBe(2);
    expect(donOf(g, 'p1').rested).toBe(2);
    expect(donOf(g, 'p1').active).toBe(2);
  });

  it('candidates: my {Straw Hat Crew} Leader and Characters (Nami herself too); a Character of another type is not', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    takeDon(g, 1);
    need(g, 'choose', 'p1');
    const want = [
      g.leader('p1'),
      inst(g, 'p1', 'characters', ID),
      inst(g, 'p1', 'characters', SC.shc3),
    ].sort();
    expect(offeredTargets(g)).toEqual(want);
    expect(offeredTargets(g)).not.toContain(inst(g, 'p1', 'characters', SC.c3));
  });

  it('a Leader without the {Straw Hat Crew} type is not a candidate', () => {
    const g = start(LD.katakuri);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    takeDon(g, 1);
    expect(offeredTargets(g)).not.toContain(g.leader('p1'));
    expect(offeredTargets(g)).toContain(inst(g, 'p1', 'characters', SC.shc3));
  });

  it('the {Straw Hat Crew} Leader can receive the DON!!', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    takeDon(g, 2);
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(2);
  });

  it('giving 1 gives exactly 1', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    takeDon(g, 1);
    const t = inst(g, 'p1', 'characters', SC.shc3);
    pickInst(g, [t]);
    expect(g.card(t).don).toBe(1);
    expect(donOf(g, 'p1').rested).toBe(3);
  });

  it('"up to": choosing none gives nothing', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    takeDon(g, 0);
    mainFor(g);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(donOf(g, 'p1').rested).toBe(4);
  });

  it('only rested DON!! are given: with 1 rested DON!! at most 1 moves, the active ones stay', () => {
    const g = start(LD.luffy, 1, 5);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    if (asksDonCount(g)) {
      expect(donCountOptions(g)).not.toContain('2');
      takeDon(g, 1);
    }
    pickInst(g, [inst(g, 'p1', 'characters', SC.shc3)]);
    expect(donOf(g, 'p1').active).toBe(5);
    expect(donOf(g, 'p1').rested).toBe(0);
  });

  it('Once Per Turn: it is not offered again after use', () => {
    const g = start();
    const nami = inst(g, 'p1', 'characters', ID);
    useAbility(g, nami);
    takeDon(g, 1);
    pickInst(g, [g.leader('p1')]);
    mainFor(g);
    expect(offeredAbilities(g, nami)).toEqual([]);
  });

  it('it is offered whenever it is my Main Phase, with no DON!! condition', () => {
    const g = start(LD.luffy, 0, 5);
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toHaveLength(1);
  });
});
