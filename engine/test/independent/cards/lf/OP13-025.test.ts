/**
 * OP13-025 Koby (Character, Green, cost 5, 6000, Counter +1000, Strike, {FILM}/{Navy}).
 *
 * Card text: "[Blocker] [On Play] If your Leader has the "FILM" type or the "Strike" attribute, set up to
 * 1 of your DON!! cards as active."
 *
 * Rules: the [On Play] is mandatory and its "If" is an effect condition on my Leader (the type or
 * the attribute, either one); "set up to N DON!! as active" asks a count, most first (DECISIONS
 * 2026-11-24, E-Q11) and acts on rested DON!!; the quoted type is an exact type in the card data;
 * [Blocker] works as printed.
 * Scenery: ST05-001 Shanks (Slash, {FILM}), ST01-001 Luffy (Strike, not FILM), ST03-001 Crocodile
 * (Special, neither), OP02-039 Franky ({FILM} Character), OP02-006 Kingdew, OP02-007 Thatch.
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  act,
  at,
  attack,
  blockers,
  chars,
  don,
  kind,
  LD_LF,
  mine,
  need,
  playRaw,
  theirs,
  VAN_LF,
} from './kit-lfa.ts';
import { countOptions, pickCount } from '../op13/kit-op13a.ts';

const KOBY = 'OP13-025';
const { frankyShc, thatch } = VAN_LF;

/** p1 plays Koby with 5 active DON!! (all 5 rested by the cost) or `active` active DON!! in total. */
function play(
  leader: string,
  o: { active?: number; rested?: number; chars?: string[] } = {},
): TestGame {
  const g = mine(leader, {
    hand: [KOBY],
    characters: o.chars ?? [],
    costArea: { active: o.active ?? 5, rested: o.rested ?? 0 },
  });
  playRaw(g, KOBY);
  return g;
}

describe('OP13-025 Koby', () => {
  it('printed values: cost 5, 6000, Counter +1000, [Blocker]', () => {
    const g = play(LD_LF.croc);
    const k = at(g, 'p1', 'characters', KOBY);
    expect(g.card(k).cost).toBe(5);
    expect(g.power(k)).toBe(6000);
    expect(g.card(k).counter).toBe(1000);
    expect(g.card(k).keywords).toContain('Blocker');
  });

  it('a {FILM} Leader: asks how many (up to 1) and sets 1 rested DON!! active', () => {
    const g = play(LD_LF.shanks);
    need(g, 'choose', 'p1');
    expect(countOptions(g).sort()).toEqual([0, 1]);
    pickCount(g, 1);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
    expect(kind(g)).toBe('main');
  });

  it('a <Strike> attribute Leader that is not {FILM} works too', () => {
    const g = play(LD_LF.luffy);
    need(g, 'choose', 'p1');
    pickCount(g, 1);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
  });

  it('a Leader with neither the type nor the attribute: nothing is set, no prompt', () => {
    const g = play(LD_LF.croc);
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
  });

  it('only the Leader is read: a {FILM} Character of mine does not make the condition true', () => {
    const g = play(LD_LF.croc, { chars: [frankyShc] });
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
  });

  it('"up to 1": the count never offers more than 1, and 0 sets nothing', () => {
    const g = play(LD_LF.shanks, { active: 10 });
    need(g, 'choose', 'p1');
    expect(Math.max(...countOptions(g))).toBe(1);
    pickCount(g, 0);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('exactly 1 is set even when many DON!! are rested', () => {
    const g = play(LD_LF.shanks, { active: 5, rested: 5 });
    need(g, 'choose', 'p1');
    pickCount(g, 1);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 9 });
  });

  it('the effect is not optional ("you may" is absent): no yes/no question is asked first', () => {
    const g = play(LD_LF.shanks);
    expect(kind(g)).toBe('choose');
  });

  it('[Blocker]: she blocks an attack on my Leader', () => {
    const g = theirs(LD_LF.croc, { characters: [KOBY] }, { characters: [thatch] });
    attack(g, at(g, 'p2', 'characters', thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', KOBY)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', KOBY) });
    expect(chars(g)).toEqual([KOBY]);
  });
});
