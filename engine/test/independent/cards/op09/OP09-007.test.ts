/**
 * OP09-007 Heat (Character, Red, cost 3, 4000, Counter +1000, {Kid Pirates}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.) [On Play] Up to 1 of your Leader with 4000 power or less gains +1000
 * power during this turn."
 *
 * Scenery Leader: ST30-001 Luffy & Ace (6000): "If you have a Character with 7000 base power or
 * more, give this Leader −2000 power" (both turns), so it is 4000 while my Kingdew (7000) is on the
 * field and 6000 otherwise. Rules: the power check is on the Leader's current power (DON!! given
 * count on my turn, RL-13); "up to 1" may be 0 (CR 8-4-4-1); only my Leader (not Characters);
 * "during this turn" ends in the End Phase (CR 6-6-1-3).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, endTurn } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  choices,
  kind,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  play,
  S9,
  theirs,
  type Place,
} from './kit-op09a.ts';

const HEAT = 'OP09-007';
const LA = 'ST30-001';
const KINGDEW = S9.c5; // 7000 base: puts the Leader at 4000

function start(o: { leaderDon?: number; own?: Place[]; hand?: string[] } = {}): TestGame {
  const g = mine(
    o.leaderDon ? { card: LA, don: o.leaderDon } : LA,
    {
      hand: o.hand ?? [HEAT],
      characters: o.own ?? [KINGDEW],
      costArea: { active: 10 - (o.leaderDon ?? 0), rested: 0 },
    },
    {},
  );
  play(g, g.find('p1', 'hand', HEAT));
  return g;
}

describe('OP09-007 Heat: [Blocker]; [On Play] up to 1 of my Leader with 4000 power or less gains +1000 this turn', () => {
  it('printed values: cost 3, 4000, Counter +1000, has [Blocker]', () => {
    const g = start();
    const h = at(g, 'p1', 'characters', HEAT);
    expect(g.card(h).cost).toBe(3);
    expect(g.power(h)).toBe(4000);
    expect(g.card(h).counter).toBe(1000);
    expect(g.card(h).keywords).toContain('Blocker');
  });

  it('a Leader at 4000 gets +1000 (4000 → 5000) this turn', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(g.power(g.leader('p1'))).toBe(4000);
    expect(choices(g)).toEqual([g.leader('p1')]);
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boundary: a Leader at 6000 (no 7000-base Character) is not eligible and gets nothing', () => {
    const g = start({ own: [] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('boundary: the check is on current power: 4000 + 1 DON!! given (5000) is not eligible', () => {
    const g = start({ leaderDon: 1 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": I may decline; the Leader stays at 4000', () => {
    const g = start();
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(4000);
  });

  it('only my Leader is a target: my 4000-power Characters are not offered', () => {
    const g = start({ own: [KINGDEW, S9.c2] });
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([g.leader('p1')]);
  });

  it('"during this turn": the +1000 is gone on my next turn', () => {
    const g = start();
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(4000);
  });

  it('a second Heat the same turn finds the Leader at 5000 and gives nothing more', () => {
    const g = start({ hand: [HEAT, HEAT] });
    pickInst(g, [g.leader('p1')]);
    play(g, g.find('p1', 'hand', HEAT));
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Blocker]: it can block an attack on my Leader on the opponent’s turn', () => {
    const g = theirs('ST01-001', { characters: [HEAT] }, { characters: [S9.c3] });
    attack(g, at(g, 'p2', 'characters', S9.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', HEAT)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', HEAT) });
    expect(g.card(at(g, 'p1', 'characters', HEAT)).rested).toBe(true);
  });

  it('must not happen: it does not boost the opponent’s Leader or any Character', () => {
    const g = start({ own: [KINGDEW, S9.c2] });
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', S9.c2))).toBe(4000);
    expect(g.power(at(g, 'p1', 'characters', KINGDEW))).toBe(7000);
  });
});
