/**
 * OP13-112 Vegapunk (Character, Yellow, cost 1, 1000, Counter +1000, {Scientist}/{Egghead}).
 *
 * Card text: "If you have a total of 2 or more given DON!! cards, this Character gains [Blocker]."
 *
 * Rules: CR 6-5-5 (given DON!!; they stay attached through the opponent's turn, RD 82), CR 10-1-4
 * ([Blocker]), CR 8-1-3-3 (permanent effects apply continuously). Given DON!! are counted over my
 * Leader and all my Characters ("a total").
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  act,
  at,
  attack,
  blockers,
  isLegal,
  keywordsOf,
  LD13,
  mine,
  SC15,
  theirsP,
} from './kit-op13d.ts';

const ID = 'OP13-112';

type Spec = string | { card: string; don?: number; rested?: boolean };

function mineWith(leader: Spec, own: Spec[], p2: Spec[] = [], p2Leader?: string): TestGame {
  const l = typeof leader === 'string' ? leader : { card: leader.card, don: leader.don };
  return mine(
    l,
    { characters: own, costArea: { active: 5, rested: 0 } },
    { characters: p2 },
    p2Leader,
  );
}

const veg = (g: TestGame) => at(g, 'p1', 'characters', ID);
const blocker = (g: TestGame) => keywordsOf(g, veg(g)).includes('Blocker');

describe('OP13-112 Vegapunk: with a total of 2 or more given DON!!, gains [Blocker]', () => {
  it('no given DON!!: no [Blocker]', () => {
    const g = mineWith(LD13.yellow, [ID]);
    expect(blocker(g)).toBe(false);
  });

  it('boundary: 1 given DON!! is not enough', () => {
    const g = mineWith({ card: LD13.yellow, don: 1 }, [ID]);
    expect(blocker(g)).toBe(false);
  });

  it('boundary: 2 given DON!! on my Leader give [Blocker]', () => {
    const g = mineWith({ card: LD13.yellow, don: 2 }, [ID]);
    expect(blocker(g)).toBe(true);
  });

  it('"a total": 1 on my Leader and 1 on another Character give [Blocker]', () => {
    const g = mineWith({ card: LD13.yellow, don: 1 }, [ID, { card: SC15.red3, don: 1 }]);
    expect(blocker(g)).toBe(true);
  });

  it('2 given DON!! on Vegapunk himself give [Blocker]', () => {
    const g = mineWith(LD13.yellow, [{ card: ID, don: 2 }]);
    expect(blocker(g)).toBe(true);
  });

  it('more than 2 still works (3 given in all)', () => {
    const g = mineWith({ card: LD13.yellow, don: 1 }, [
      { card: ID, don: 1 },
      { card: SC15.red3, don: 1 },
    ]);
    expect(blocker(g)).toBe(true);
  });

  it('the opponent’s given DON!! do not count', () => {
    const g = mine(
      LD13.yellow,
      { characters: [ID] },
      { characters: [{ card: SC15.red3, don: 2 }] },
    );
    expect(blocker(g)).toBe(false);
  });

  it('DON!! in the cost area are not "given": 5 active and 5 rested give nothing', () => {
    const g = mine(LD13.yellow, { characters: [ID], costArea: { active: 5, rested: 5 } }, {});
    expect(blocker(g)).toBe(false);
  });

  it('giving the 2nd DON!! during my Main Phase turns it on at once', () => {
    const g = mineWith({ card: LD13.yellow, don: 1 }, [ID]);
    expect(blocker(g)).toBe(false);
    const target = g.leader('p1');
    expect(isLegal(g, { type: 'giveDon', target })).toBe(true);
    act(g, { type: 'giveDon', target });
    expect(blocker(g)).toBe(true);
  });

  it('on the opponent’s turn the given DON!! are still attached: it can block, and is the only blocker', () => {
    const g = theirsP({ card: LD13.yellow, don: 2 }, { characters: [ID] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    const expected: InstanceId[] = [veg(g)];
    expect(blockers(g)).toEqual(expected);
  });

  it('on the opponent’s turn without the DON!! (1 given) it is no blocker', () => {
    const g = theirsP({ card: LD13.yellow, don: 1 }, { characters: [ID] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});
