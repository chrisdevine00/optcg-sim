/** EB02-046 Hildon. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, PURPLE } from './helpers.ts';
import { canPick, ids, mk, V } from './helpers-aeb2g2.ts';

const ID = 'EB02-046';
const DECK = [V.c1, V.c2, V.c3, V.c6, PURPLE];
const start = (deck = DECK, p2chars: string[] = [V.c4, V.c1]) => {
  const g = mk({ hand: [ID], deck, characters: [V.c3] }, { characters: p2chars });
  play(g, ID);
  return g;
};

describe('EB02-046 Hildon', () => {
  it('[On Play] trashes 2 cards from the top of the deck and gives an opposing Character -1 cost', () => {
    const g = start();
    expect(ids(g, 'p1', 'trash')).toEqual([V.c2, V.c1]);
    expect(ids(g, 'p1', 'deck')).toEqual([V.c3, V.c6, PURPLE]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(3);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(1);
  });

  it('only opposing Characters can be chosen (not mine, not a Leader)', () => {
    const g = start();
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('"up to 1": may give the cost to nothing, and the deck cards are trashed anyway', () => {
    const g = start();
    none(g);
    expect(ids(g, 'p1', 'trash')).toHaveLength(2);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(4);
  });

  it('the trash happens even with no opposing Character, and the effect does not depend on it', () => {
    const g = start(DECK, []);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'trash')).toEqual([V.c2, V.c1]);
  });

  it('the -1 cost lasts only this turn', () => {
    const g = start();
    pick(g, [g.find('p2', 'characters', V.c4)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(4);
  });
});
