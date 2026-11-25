/**
 * ST21-004 Jewelry Bonney (Red Character, cost 1, 3000, no Counter, {Bonney Pirates}/{Egghead}).
 * "[DON!! x2] [On K.O.] Draw 1 card."
 * Rules: [DON!! x2] needs at least 2 DON!! given to this Character when it is K.O.'d (the DON!! count
 * as they were just before it left the field); [On K.O.] fires for a K.O. by battle or by an effect
 * and is not optional; the owner draws.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  deck,
  hand,
  inst,
  kind,
  LD,
  many,
  opponentKOs,
  SC,
  theirs,
  theyKo,
  trash,
} from './kit-st1821a.ts';

const ID = 'ST21-004';
const LIGHTNING = 'OP09-077';
const TOP = [SC.c2, SC.c3, ...many(BLUE, 8)];

function pos(don: number, extra: string[] = [], opp: Record<string, unknown> = {}) {
  return theirs(
    LD.luffy,
    { characters: [{ card: ID, don, rested: true }, ...extra], deck: TOP },
    { hand: [LIGHTNING], ...opp },
  );
}

describe('ST21-004 Jewelry Bonney: [DON!! x2] [On K.O.] draw 1', () => {
  it('K.O.d in battle with 2 DON!! given: I draw exactly 1 card, the top of my deck', () => {
    const g = pos(2);
    theyKo(g, inst(g, 'p1', 'characters', ID));
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([SC.c2]);
    expect(deck(g)).toHaveLength(9);
    expect(trash(g)).toEqual([ID]);
  });

  it('with only 1 DON!! given nothing is drawn', () => {
    const g = pos(1);
    theyKo(g, inst(g, 'p1', 'characters', ID));
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
  });

  it('with no DON!! given nothing is drawn', () => {
    const g = pos(0);
    theyKo(g, inst(g, 'p1', 'characters', ID));
    expect(hand(g)).toEqual([]);
  });

  it('with 3 DON!! given it still draws just 1', () => {
    const g = pos(3);
    theyKo(g, inst(g, 'p1', 'characters', ID));
    expect(hand(g)).toEqual([SC.c2]);
  });

  it('K.O.d by an opponent effect with 2 DON!! given: I draw 1', () => {
    const g = pos(2);
    opponentKOs(g, inst(g, 'p1', 'characters', ID));
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([SC.c2]);
  });

  it('K.O.d by an opponent effect with 1 DON!! given: no draw', () => {
    const g = pos(1);
    opponentKOs(g, inst(g, 'p1', 'characters', ID));
    expect(hand(g)).toEqual([]);
  });

  it('the draw is automatic: no yes/no question is asked', () => {
    const g = pos(2);
    theyKo(g, inst(g, 'p1', 'characters', ID));
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('the owner draws, not the opponent', () => {
    const g = pos(2);
    const before = hand(g, 'p2').length;
    theyKo(g, inst(g, 'p1', 'characters', ID));
    expect(hand(g, 'p2')).toHaveLength(before);
  });

  it('a Bonney that survives the battle does not draw (it was not K.O.d)', () => {
    // OP13-009 Curly.Dadan (2000) attacks the rested Bonney (3000): Bonney wins.
    const h = theirs(
      LD.luffy,
      { characters: [{ card: ID, don: 2, rested: true }], deck: TOP },
      { characters: ['OP13-009'] },
    );
    theyKo(h, inst(h, 'p1', 'characters', ID), inst(h, 'p2', 'characters', 'OP13-009'));
    expect(h.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(hand(h)).toEqual([]);
  });
});
