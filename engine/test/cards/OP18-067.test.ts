/** OP18-067 Charlotte Smoothie. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, hand, pick, play, trash, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { mine, POIRE } from './helpers-op18-g3.ts';

const ID = 'OP18-067';
const start = (handCards = [ID, POIRE, BLUE]) => mine({ hand: handCards }, {});

describe('OP18-067 Charlotte Smoothie', () => {
  it('[On Play] you may trash 1 {Big Mom Pirates} card from your hand: draw 2 cards', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(candidates(g)).toEqual([g.find('p1', 'hand', POIRE)]);
    pick(g, [g.find('p1', 'hand', POIRE)]);
    expect(trash(g, 'p1')).toEqual([POIRE]);
    expect(hand(g, 'p1')).toHaveLength(3); // BLUE + 2 drawn
  });

  it('declining draws nothing and trashes nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([POIRE, BLUE]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('without a {Big Mom Pirates} card in hand the cost cannot be paid', () => {
    const g = start([ID, BLUE, V.c2]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('another Smoothie in hand ({Big Mom Pirates}) can pay', () => {
    const g = start([ID, ID, BLUE]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', ID)]);
    expect(hand(g, 'p1')).toHaveLength(3);
  });
});
