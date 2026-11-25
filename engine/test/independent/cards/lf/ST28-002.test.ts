/**
 * ST28-002 Izo (Character, Yellow, cost 2, 1000, Counter +1000, {Former Whitebeard Pirates}/{Land of Wano}).
 *
 * Card text:
 *   [DON!! x2] This Character gains [Blocker].
 *   [On Play] Your "Land of Wano" type Leader gains [Banish] during this turn.
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  blockers,
  hand,
  kw,
  mine,
  need,
  theirs,
  toMyNextMain,
  trash,
} from '../op17/kit-op17b.ts';
import { inst, kind, LC, playRaw } from './kit-lfc.ts';

const IZO = 'ST28-002';

function playIzo(leader: string, p2Leader: string = LC.nova) {
  const g = mine(
    leader,
    { hand: [IZO], deck: [BLUE, BLUE, BLUE, BLUE], costArea: { active: 2, rested: 0 } },
    {},
    p2Leader,
  );
  playRaw(g, IZO);
  return g;
}

describe('ST28-002 Izo: [DON!! x2] [Blocker]; [On Play] a "Land of Wano" Leader gains [Banish] this turn', () => {
  it('with 2 DON!! given it has [Blocker] and can block', () => {
    const g = theirs(LC.plain, { characters: [{ card: IZO, don: 2 }] }, {});
    const izo = inst(g, 'p1', 'characters', IZO);
    expect(kw(g, izo)).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([izo]);
  });

  it('boundary: with 1 DON!! it has no [Blocker]; with 0 neither', () => {
    for (const don of [0, 1]) {
      const g = theirs(LC.plain, { characters: [{ card: IZO, don }] }, {});
      expect(kw(g, inst(g, 'p1', 'characters', IZO))).not.toContain('Blocker');
      attack(g, g.leader('p2'), g.leader('p1'));
      need(g, 'block', 'p1');
      expect(blockers(g)).toEqual([]);
    }
  });

  it('with 3 DON!! (more than required) it still has [Blocker]', () => {
    const g = theirs(LC.plain, { characters: [{ card: IZO, don: 3 }] }, {});
    expect(kw(g, inst(g, 'p1', 'characters', IZO))).toContain('Blocker');
  });

  it('[On Play] with a "Land of Wano" Leader: the Leader gains [Banish] this turn', () => {
    const g = playIzo(LC.wano);
    expect(atMain(g)).toBe(true);
    expect(kw(g, g.leader('p1'))).toContain('Banish');
  });

  it("the Banish is real: the Leader's hit trashes the Life card instead of adding it to the hand", () => {
    const g = playIzo(LC.wano);
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
    expect(trash(g, 'p2')).toHaveLength(1);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('with a Leader that is not "Land of Wano" there is no [Banish]', () => {
    const g = playIzo(LC.plain);
    expect(atMain(g)).toBe(true);
    expect(kw(g, g.leader('p1'))).not.toContain('Banish');
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(trash(g, 'p2')).toEqual([]);
    expect(hand(g, 'p2')).toHaveLength(1);
  });

  it('the Banish lasts this turn only', () => {
    const g = playIzo(LC.wano);
    toMyNextMain(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Banish');
  });

  it('it affects my Leader only: the opponent "Land of Wano" Leader and my Characters get no [Banish]', () => {
    const g = playIzo(LC.wano, LC.wano);
    expect(kw(g, g.leader('p2'))).not.toContain('Banish');
    expect(kw(g, inst(g, 'p1', 'characters', IZO))).not.toContain('Banish');
  });

  it('[On Play] asks no question, and a Izo played without DON!! has no [Blocker]', () => {
    const g = playIzo(LC.wano);
    expect(kind(g)).toBe('main');
    expect(kw(g, inst(g, 'p1', 'characters', IZO))).not.toContain('Blocker');
  });
});
