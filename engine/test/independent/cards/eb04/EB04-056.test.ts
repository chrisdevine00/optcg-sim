/**
 * EB04-056 Pacifista (Character, Yellow, cost 1, 1000, Counter +2000, {Biological Weapon}/{Navy}/{Egghead}).
 *
 * Card text: "If you have [Jewelry Bonney] and you have 0 Life cards, this Character gains [Blocker].
 * (After your opponent declares an attack, you may rest this card to make it the new target of the
 * attack.)"
 *
 * Rules: a conditional keyword is active only while the whole condition holds. "You have
 * [Jewelry Bonney]" is read as a card with that name on your field (the tests use a Character).
 * Whether a Leader named [Jewelry Bonney] also counts is not asserted.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  BLUE,
  fill,
  isRestedInst,
  kind,
  LB,
  theirs,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-056';
/** OP14-007 Jewelry Bonney: Red, cost 6, 7000, vanilla Character. */
const BONNEY = 'OP14-007';
/** EB04-002 Jewelry Bonney: Red, cost 1, 2000, a second card named [Jewelry Bonney] (its [On Play] only matters when played). */
const BONNEY_B = 'EB04-002';
/** OP01-012 Sai: Red, cost 2, 4000, vanilla. */
const SAI = 'OP01-012';
const HAJ = 'OP01-018'; // Red, cost 4, 6000

function attacked(life: number, own: string[], hnd: string[] = []): TestGame {
  const g = theirs(
    LB.egghead,
    { characters: own, hand: hnd, life: fill(BLUE, life), deck: fill(BLUE, 10) },
    { characters: [HAJ] },
  );
  attack(g, at(g, 'p2', 'characters', HAJ), g.leader('p1'));
  return g;
}

function canBlockWithPacifista(g: TestGame): boolean {
  return kind(g) === 'block' && blockers(g).includes(at(g, 'p1', 'characters', ID));
}

describe('EB04-056 Pacifista: with [Jewelry Bonney] and 0 Life cards it gains [Blocker]', () => {
  it('with a [Jewelry Bonney] Character and 0 Life it has [Blocker] and can block', () => {
    const g = attacked(0, [ID, BONNEY]);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
    expect(canBlockWithPacifista(g)).toBe(true);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(isRestedInst(g, at(g, 'p1', 'characters', ID))).toBe(true);
  });

  it('boundary: with 1 Life card it has no [Blocker]', () => {
    const g = attacked(1, [ID, BONNEY]);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).not.toContain('Blocker');
    expect(canBlockWithPacifista(g)).toBe(false);
  });

  it('without [Jewelry Bonney] on the field it has no [Blocker], even at 0 Life', () => {
    const g = attacked(0, [ID, SAI]);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).not.toContain('Blocker');
    expect(canBlockWithPacifista(g)).toBe(false);
  });

  it('a [Jewelry Bonney] in hand does not count', () => {
    const g = attacked(0, [ID], [BONNEY]);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });

  it('a [Jewelry Bonney] in the trash does not count', () => {
    const g = theirs(
      LB.egghead,
      { characters: [ID], trash: [BONNEY], life: [], deck: fill(BLUE, 10) },
      { characters: [HAJ] },
    );
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });

  it('any card named [Jewelry Bonney] works, whatever its cost', () => {
    const g = attacked(0, [ID, BONNEY_B]);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('the opponent [Jewelry Bonney] does not count', () => {
    const g = theirs(
      LB.egghead,
      { characters: [ID], life: [], deck: fill(BLUE, 10) },
      { characters: [HAJ, BONNEY] },
    );
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });

  it('declining to block leaves it active', () => {
    const g = attacked(0, [ID, BONNEY]);
    act(g, { type: 'block', blocker: null });
    expect(isRestedInst(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('it has no printed [Blocker]: with 2 Life cards no blocker can be chosen', () => {
    const g = attacked(2, [ID, BONNEY]);
    expect(kind(g) === 'block' ? blockers(g) : []).toEqual([]);
  });
});
