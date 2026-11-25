/**
 * ST21-012 Brook (Red Character, cost 3, 4000, Counter +1000, {Straw Hat Crew}).
 * "[When Attacking] Give up to 2 rested DON!! cards to your Leader or 1 of your Characters."
 * Rules: fires when Brook attacks (no DON!! condition, no Once Per Turn); only RESTED DON!! are
 * given; "up to 2" allows 0, 1 or 2; the receiver is my Leader or one of my Characters.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  asksDonCount,
  attack,
  donCountOptions,
  donOf,
  inst,
  kind,
  LD,
  mine,
  need,
  noDefence,
  offeredAbilities,
  pickInst,
  SC,
  takeDon,
} from './kit-st1821a.ts';

const ID = 'ST21-012';

function start(extra: Partial<PlayerSpec> = {}) {
  return mine(LD.luffy, {
    characters: [ID, SC.c3],
    costArea: { active: 2, rested: 4 },
    ...extra,
  });
}

function swing(g: TestGame, nth = 0) {
  attack(g, g.find('p1', 'characters', ID, nth), g.leader('p2'));
}

function targets(g: TestGame) {
  return g
    .legal()
    .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []))
    .sort();
}

describe('ST21-012 Brook: [When Attacking] give up to 2 rested DON!! to my Leader or 1 Character', () => {
  it('attacking asks how many (2, 1 or none), then gives that many rested DON!! to the chosen Character', () => {
    const g = start();
    swing(g);
    expect(donCountOptions(g).sort()).toEqual(['0', '1', '2']);
    takeDon(g, 2);
    const t = inst(g, 'p1', 'characters', SC.c3);
    pickInst(g, [t]);
    expect(kind(g)).toBe('block');
    expect(g.card(t).don).toBe(2);
    expect(donOf(g, 'p1').rested).toBe(2);
    expect(donOf(g, 'p1').active).toBe(2);
  });

  it('candidates are exactly my Leader and my Characters (Brook included), never the opponent', () => {
    const g = start();
    swing(g);
    takeDon(g, 1);
    need(g, 'choose', 'p1');
    expect(targets(g)).toEqual(
      [g.leader('p1'), ...g.zone('p1', 'characters').map((c) => c.instance)].sort(),
    );
  });

  it('the Leader can receive them', () => {
    const g = start();
    swing(g);
    takeDon(g, 2);
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(2);
  });

  it('giving 1 gives exactly 1', () => {
    const g = start();
    swing(g);
    takeDon(g, 1);
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(donOf(g, 'p1').rested).toBe(3);
  });

  it('"up to": choosing none gives nothing and the attack continues', () => {
    const g = start();
    swing(g);
    takeDon(g, 0);
    expect(kind(g)).toBe('block');
    expect(donOf(g, 'p1').given).toBe(0);
    expect(donOf(g, 'p1').rested).toBe(4);
  });

  it('only rested DON!! are given: with 1 rested at most 1 moves and the active DON!! stay', () => {
    const g = start({ costArea: { active: 5, rested: 1 } });
    swing(g);
    if (asksDonCount(g)) {
      expect(donCountOptions(g)).not.toContain('2');
      takeDon(g, 1);
    }
    pickInst(g, [g.leader('p1')]);
    expect(donOf(g, 'p1').active).toBe(5);
    expect(donOf(g, 'p1').rested).toBe(0);
  });

  it('with no rested DON!! nothing is given and the attack goes on', () => {
    const g = start({ costArea: { active: 6, rested: 0 } });
    swing(g);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(['block', 'choose']).toContain(kind(g));
  });

  it('it is a [When Attacking] only: no [Activate: Main] is offered on Brook', () => {
    const g = start();
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('no Once Per Turn: each attacking Brook gives (two Brooks, 2 + 2 DON!!)', () => {
    const g = start({ characters: [ID, ID], costArea: { active: 0, rested: 4 } });
    swing(g, 0);
    takeDon(g, 2);
    pickInst(g, [g.leader('p1')]);
    noDefence(g);
    swing(g, 1);
    takeDon(g, 2);
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(4);
  });
});
