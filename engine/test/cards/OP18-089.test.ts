/** OP18-089 Dorry. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, hand, pick, play, trash, V } from './helpers.ts';
import { mine } from './helpers-op18-g3.ts';

const ID = 'OP18-089';
const start = (mineHand = [ID, BLUE], oppHand = [V.c1, V.c2]) =>
  mine({ hand: mineHand, costArea: { active: 5, rested: 0 } }, { hand: oppHand });

describe('OP18-089 Dorry', () => {
  it('gains +12 cost on the field (base cost 4, so 16) and not in the hand', () => {
    const g = mine({ characters: [ID], hand: [ID] }, {});
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(16);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(4);
  });

  it('[On Play] you may trash 1 card from your hand: your opponent trashes 1 card from their hand (their choice)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    // the opponent chooses
    expect(g.decider).toBe('p2');
    pick(g, [g.find('p2', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(trash(g, 'p2')).toEqual([V.c2]);
    expect(hand(g, 'p2')).toEqual([V.c1]);
  });

  it('declining the cost makes the opponent trash nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p2')).toHaveLength(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('with no card in your hand the cost cannot be paid', () => {
    const g = start([ID]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    expect(hand(g, 'p2')).toHaveLength(2);
  });

  it('an opponent with an empty hand trashes nothing; your cost is still paid', () => {
    const g = start([ID, BLUE], []);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(g.decider).toBe('p1');
  });
});
