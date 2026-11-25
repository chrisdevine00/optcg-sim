/** ST21-004 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { BLUE, endCounter, hand, passBlock, V } from './helpers.ts';
import { mk, oppTurn } from './helpers-st1821.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'ST21-004';

/** p2's V.c4 (6000) attacks p1's rested Bonney (3000 power) with `don` DON!! given to her. */
const koBonney = (don: number): TestGame => {
  const g = mk(
    { characters: [{ card: ID, rested: true, don }], costArea: { active: 3, rested: 0 }, hand: [] },
    { characters: [V.c4] },
    oppTurn,
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c4),
    target: g.find('p1', 'characters', ID),
  });
  passBlock(g);
  endCounter(g);
  return g;
};

describe('ST21-004 Jewelry Bonney', () => {
  it("[DON!! x2] [On K.O.]: draws 1 card when K.O.'d in battle with 2 DON!! given", () => {
    const g = koBonney(2);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('draws only 1 with more DON!! given (3)', () => {
    const g = koBonney(3);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('boundary: 1 DON!! given draws nothing', () => {
    const g = koBonney(1);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('no DON!! given draws nothing', () => {
    const g = koBonney(0);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('is not an effect on play or attack: nothing is drawn while she survives', () => {
    const g = mk({
      characters: [{ card: ID, don: 2 }],
      hand: [],
      costArea: { active: 5, rested: 0 },
    });
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });
});
