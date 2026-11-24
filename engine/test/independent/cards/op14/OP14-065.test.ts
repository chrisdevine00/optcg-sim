/**
 * OP14-065 Senor Pink (Character, Purple, cost 4, 5000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On K.O.] Your opponent returns 1 DON!! card from their field to their DON!! deck."
 *
 * Rules: RL-23 (the owner of the DON!! chooses which ones leave; DON!! on the field means the cost
 * area, active or rested, and DON!! given to the Leader and Characters), the effect is mandatory
 * (no "may", no "up to"). With fewer DON!! than asked the opponent returns as many as they have
 * (M6b-Q45: only "nothing happens with none" is asserted).
 */
import { describe, expect, it } from 'vitest';
import { koEffect } from '../op15/kit-op15c.ts';
import {
  at,
  backToMain,
  chr,
  decider,
  donChoices,
  donOf14,
  kind,
  koGame,
  LD14,
  LIGHTNING,
  need,
  onField,
  payDon,
  SC14,
  theirs,
  trash,
} from './kit-op14c.ts';

const ID = 'OP14-065';

describe('OP14-065 Senor Pink [On K.O.] the opponent returns 1 DON!!', () => {
  it('K.O.d in battle: they return exactly 1 DON!! to their DON!! deck', () => {
    const g = koGame(ID, { p2: { costArea: { active: 9, rested: 0 } } });
    // One class only (all active): nothing to choose, or a single answer.
    if (kind(g) === 'choose') payDon(g, 1);
    backToMain(g, 'p2');
    expect(onField(g, 'p2')).toBe(8);
    expect(donOf14(g, 'p2').deck).toBe(2);
    expect(trash(g)).toEqual([ID]);
  });

  it('it is the OWNER (the opponent) who chooses which DON!! to return, when they differ', () => {
    const g = koGame(ID, { p2: { costArea: { active: 5, rested: 4 } } });
    need(g, 'choose');
    expect(decider(g)).toBe('p2');
    const classes = donChoices(g).map((c) => c.from);
    expect(classes).toContain('costActive');
    expect(classes).toContain('costRested');
    payDon(g, 1, 'costRested');
    backToMain(g, 'p2');
    expect(donOf14(g, 'p2')).toMatchObject({ active: 5, rested: 3, deck: 2 });
  });

  it('DON!! given to their Characters can be the one returned', () => {
    const g = koGame(ID, {
      p2: { costArea: { active: 1, rested: 0 } },
      p2chars: [{ card: SC14.c3, don: 1 }],
    });
    need(g, 'choose');
    expect(donChoices(g).some((c) => c.from === 'given')).toBe(true);
    payDon(g, 1, 'given', chr(g, 'p2', SC14.c3));
    backToMain(g, 'p2');
    expect(donOf14(g, 'p2')).toMatchObject({ active: 1, given: 0, deck: 9 });
    expect(g.card(chr(g, 'p2', SC14.c3)).don).toBe(0);
  });

  it('only 1 is returned, however many DON!! they have', () => {
    const g = koGame(ID, { p2: { costArea: { active: 10, rested: 0 } } });
    if (kind(g) === 'choose') payDon(g, 1);
    backToMain(g, 'p2');
    expect(onField(g, 'p2')).toBe(9);
    expect(donOf14(g, 'p2').deck).toBe(1);
  });

  it('their last DON!!: it is returned (1 is enough)', () => {
    const g = koGame(ID, { p2: { costArea: { active: 1, rested: 0 } } });
    if (kind(g) === 'choose') payDon(g, 1);
    backToMain(g, 'p2');
    expect(onField(g, 'p2')).toBe(0);
    expect(donOf14(g, 'p2').deck).toBe(10);
  });

  it('with no DON!! on their field nothing happens and nothing is asked', () => {
    const g = koGame(ID, { p2: { costArea: { active: 0, rested: 0 } } });
    backToMain(g, 'p2');
    expect(onField(g, 'p2')).toBe(0);
    expect(donOf14(g, 'p2').deck).toBe(10);
  });

  it('my own DON!! are untouched', () => {
    const g = koGame(ID, { p2: { costArea: { active: 9, rested: 0 } } });
    if (kind(g) === 'choose') payDon(g, 1);
    expect(donOf14(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });

  it('mandatory: no "use?" question is put to me', () => {
    const g = koGame(ID, { p2: { costArea: { active: 9, rested: 0 } } });
    expect(kind(g)).not.toBe('optional');
    expect(decider(g)).not.toBe('p1');
  });

  it('also fires when it is K.O.d by an effect', () => {
    const g = theirs(
      LD14.dp,
      { characters: [ID], costArea: { active: 3, rested: 0 } },
      { hand: [LIGHTNING], costArea: { active: 9, rested: 0 } },
    );
    koEffect(g, at(g, 'p1', 'characters', ID));
    // p2 paid DON!! −2 and Lightning's cost, then returns 1 more for Senor Pink: 9 - 2 - 1 = 6 left.
    if (kind(g) === 'choose' && decider(g) === 'p2') payDon(g, 1, 'costRested');
    expect(trash(g)).toEqual([ID]);
    expect(onField(g, 'p2')).toBe(6);
  });
});
