/**
 * EB02-033 Klabautermann (Character, Purple, cost 1, 0 power, Counter +1000, {Sprite}).
 *
 * Card text: "If you have [Merry Go] on your field, this Character gains [Blocker]."
 *
 * [Merry Go] is a Stage name: EB02-041 (cost 1, [On Play] draws 1 with a {Straw Hat Crew} Leader),
 * EB02-060 (cost 2, [Activate: Main] only). Mini-Merry (EB01-011) and the Character Merry (OP03-052)
 * have other names. Rules: [Blocker] (CR 10-1-3); "on your field" excludes the hand.
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, decision, E2C, E2L, kw, mine, playRaw, theirs } from './kit-eb02a.ts';

const KLAB = 'EB02-033';
const MERRY_GO = 'EB02-060';
const MERRY_GO_B = 'EB02-041';
/** EB01-011 Mini-Merry: a Stage with a different name. */
const MINI_MERRY = 'EB01-011';
/** OP03-052 Merry: a Character named [Merry], not [Merry Go]. */
const MERRY_CHAR = 'OP03-052';

describe('EB02-033 Klabautermann: with a [Merry Go] on my field it has [Blocker]', () => {
  it('without a [Merry Go] it has no [Blocker]', () => {
    const g = mine(E2L.shc, { characters: [KLAB] });
    expect(kw(g, g.find('p1', 'characters', KLAB))).not.toContain('Blocker');
  });

  it('with a [Merry Go] Stage on my field it has [Blocker]', () => {
    const g = mine(E2L.shc, { characters: [KLAB], stage: MERRY_GO });
    expect(kw(g, g.find('p1', 'characters', KLAB))).toContain('Blocker');
  });

  it('any card named [Merry Go] counts (EB02-041 as well)', () => {
    const g = mine(E2L.shc, { characters: [KLAB], stage: MERRY_GO_B });
    expect(kw(g, g.find('p1', 'characters', KLAB))).toContain('Blocker');
  });

  it('the [Blocker] is real: it may block an attack on my Leader', () => {
    const g = theirs(E2L.shc, { characters: [KLAB], stage: MERRY_GO });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(decision(g)?.kind).toBe('block');
    expect(blockers(g)).toEqual([g.find('p1', 'characters', KLAB)]);
  });

  it('without the Stage it cannot block', () => {
    const g = theirs(E2L.shc, { characters: [KLAB] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('a [Merry Go] in my hand does not count', () => {
    const g = mine(E2L.shc, { characters: [KLAB], hand: [MERRY_GO] });
    expect(kw(g, g.find('p1', 'characters', KLAB))).not.toContain('Blocker');
  });

  it('a [Merry Go] on the opponent’s field does not count', () => {
    const g = mine(E2L.shc, { characters: [KLAB] }, {});
    const h = mine(E2L.shc, { characters: [KLAB] });
    expect(kw(g, g.find('p1', 'characters', KLAB))).toEqual(
      kw(h, h.find('p1', 'characters', KLAB)),
    );
    const opp = mine(E2L.shc, { characters: [KLAB] }, { stage: MERRY_GO });
    expect(kw(opp, opp.find('p1', 'characters', KLAB))).not.toContain('Blocker');
  });

  it('other names do not count: Mini-Merry (Stage) and Merry (Character)', () => {
    const g = mine(E2L.shc, { characters: [KLAB, MERRY_CHAR], stage: MINI_MERRY });
    expect(kw(g, g.find('p1', 'characters', KLAB))).not.toContain('Blocker');
  });

  it('playing a [Merry Go] gives the [Blocker] at once (a permanent effect)', () => {
    const g = mine(E2L.croc, { characters: [KLAB], hand: [MERRY_GO] });
    const klab = g.find('p1', 'characters', KLAB);
    expect(kw(g, klab)).not.toContain('Blocker');
    playRaw(g, MERRY_GO);
    expect(kw(g, klab)).toContain('Blocker');
  });

  it('the [Blocker] goes away when the [Merry Go] is replaced by another Stage', () => {
    const g = mine(E2L.croc, { characters: [KLAB], stage: MERRY_GO, hand: [MINI_MERRY] });
    const klab = g.find('p1', 'characters', KLAB);
    expect(kw(g, klab)).toContain('Blocker');
    playRaw(g, MINI_MERRY);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([MINI_MERRY]);
    expect(kw(g, klab)).not.toContain('Blocker');
  });

  it('every Klabautermann gains it: two copies both have [Blocker]', () => {
    const g = mine(E2L.shc, { characters: [KLAB, KLAB, E2C.mohji], stage: MERRY_GO });
    expect(kw(g, g.find('p1', 'characters', KLAB, 0))).toContain('Blocker');
    expect(kw(g, g.find('p1', 'characters', KLAB, 1))).toContain('Blocker');
    expect(kw(g, g.find('p1', 'characters', E2C.mohji))).not.toContain('Blocker');
  });
});
