/**
 * EB02-012 Gaimon (Character, Green, cost 1, 1000, Counter +1000, {East Blue}).
 *
 * Card text: "If you have a [Sarfunkel], this Character gains [Blocker]."
 *
 * Rules: [Blocker] (CR 10-1-3); "you have" means on your field; names are matched exactly.
 * [Sarfunkel] is EB02-014 (cost 2, 0 power, {East Blue}, [On Play] plays a [Gaimon] from hand).
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  blockers,
  decision,
  E2C,
  E2L,
  kw,
  mine,
  playRaw,
  theirs,
  canFinish,
  chooseNone,
  kind,
} from './kit-eb02a.ts';

const GAIMON = 'EB02-012';
const SARFUNKEL = 'EB02-014';

describe('EB02-012 Gaimon: with a [Sarfunkel] on my field it has [Blocker]', () => {
  it('without a [Sarfunkel] it has no [Blocker]', () => {
    const g = mine(E2L.eastBlue, { characters: [GAIMON] });
    expect(kw(g, g.find('p1', 'characters', GAIMON))).not.toContain('Blocker');
  });

  it('with a [Sarfunkel] on my field it has [Blocker]', () => {
    const g = mine(E2L.eastBlue, { characters: [GAIMON, SARFUNKEL] });
    expect(kw(g, g.find('p1', 'characters', GAIMON))).toContain('Blocker');
  });

  it('the [Blocker] is real: it may block an attack on my Leader', () => {
    const g = theirs(E2L.eastBlue, { characters: [GAIMON, SARFUNKEL] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(decision(g)?.kind).toBe('block');
    expect(blockers(g)).toEqual([g.find('p1', 'characters', GAIMON)]);
  });

  it('without a [Sarfunkel] it cannot block', () => {
    const g = theirs(E2L.eastBlue, { characters: [GAIMON] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('a [Sarfunkel] in my hand is not "on the field": no [Blocker]', () => {
    const g = mine(E2L.eastBlue, { characters: [GAIMON], hand: [SARFUNKEL] });
    expect(kw(g, g.find('p1', 'characters', GAIMON))).not.toContain('Blocker');
  });

  it('a [Sarfunkel] on the opponent’s field does not count', () => {
    const g = mine(E2L.eastBlue, { characters: [GAIMON] }, { characters: [SARFUNKEL] });
    expect(kw(g, g.find('p1', 'characters', GAIMON))).not.toContain('Blocker');
  });

  it('a different Character of the same type is not a [Sarfunkel] (names are exact)', () => {
    const g = mine(E2L.eastBlue, { characters: [GAIMON, E2C.momoo, E2C.ryu] });
    expect(kw(g, g.find('p1', 'characters', GAIMON))).not.toContain('Blocker');
  });

  it('a rested [Sarfunkel] still counts as "you have a [Sarfunkel]"', () => {
    const g = mine(E2L.eastBlue, { characters: [GAIMON, { card: SARFUNKEL, rested: true }] });
    expect(kw(g, g.find('p1', 'characters', GAIMON))).toContain('Blocker');
  });

  it('the [Blocker] appears the moment a [Sarfunkel] is played (a permanent effect, not a snapshot)', () => {
    const g = mine(E2L.eastBlue, { characters: [GAIMON], hand: [SARFUNKEL] });
    const gaimon = g.find('p1', 'characters', GAIMON);
    expect(kw(g, gaimon)).not.toContain('Blocker');
    playRaw(g, SARFUNKEL);
    if (kind(g) === 'choose') {
      // [On Play] "play up to 1 [Gaimon] from your hand": none in hand; leave it.
      if (canFinish(g)) chooseNone(g);
    }
    expect(kw(g, gaimon)).toContain('Blocker');
  });

  it('every Gaimon of mine gains it: two copies both have [Blocker]', () => {
    const g = mine(E2L.eastBlue, { characters: [GAIMON, GAIMON, SARFUNKEL] });
    expect(kw(g, g.find('p1', 'characters', GAIMON, 0))).toContain('Blocker');
    expect(kw(g, g.find('p1', 'characters', GAIMON, 1))).toContain('Blocker');
  });
});
