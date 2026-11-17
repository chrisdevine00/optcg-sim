/**
 * EB01-056 Charlotte Flampe (Character, Yellow, cost 1, 1000, Counter +2000, {Big Mom Pirates}).
 *
 * Card text: "[On Play] You may add 1 card from the top or bottom of your Life cards to your hand: Draw 1
 * card."
 *
 * Rules: CR 8-3-1-3 (an unpayable cost cannot be paid), CR 8-3-1-4 ("may" cost), RL-22 (moving Life by an
 * effect is not damage: no [Trigger], no defeat), CR 10-1-5.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  accept,
  BLUE,
  cardOf,
  choices,
  count,
  decline,
  deck,
  hand,
  kind,
  lifeCards,
  mine,
  offered,
  optionChoices,
  pickLife,
  playCard,
  RED,
  SC,
  skipUnusable,
  YL,
} from './kit-a.ts';

const LIFE = [RED, SC.bobbin, SC.opera]; // top, middle, bottom

function played(life: string[] = LIFE) {
  const g = mine(YL.bmp, { hand: ['EB01-056'], life, deck: [SC.anana, ...fill(BLUE, 10)] });
  playCard(g, 'EB01-056');
  return g;
}

describe('EB01-056 Charlotte Flampe: [On Play] add 1 top or bottom Life card to hand: draw 1', () => {
  it('taking the TOP Life card: it goes to hand, then draw 1', () => {
    const g = played();
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    pickLife(g, 'top');
    expect(hand(g)).toEqual([RED, SC.anana].sort());
    expect(lifeCards(g)).toEqual([SC.bobbin, SC.opera]);
    expect(deck(g)).toHaveLength(10);
  });

  it('taking the BOTTOM Life card works the same', () => {
    const g = played();
    accept(g);
    pickLife(g, 'bottom');
    expect(hand(g)).toEqual([SC.opera, SC.anana].sort());
    expect(lifeCards(g)).toEqual([RED, SC.bobbin]);
  });

  it('the middle Life card is not an option', () => {
    const g = played();
    accept(g);
    expect(kind(g)).toBe('choose');
    const opts = optionChoices(g);
    if (opts.length) {
      expect(opts.length).toBe(2);
    } else {
      const offeredCards = choices(g).map((i) => cardOf(g, i));
      expect(offeredCards).not.toContain(SC.bobbin);
      expect(choices(g)).toHaveLength(2);
    }
  });

  it('CR 8-3-1-4: declining the cost draws nothing and leaves Life as it was', () => {
    const g = played();
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(hand(g)).toEqual([]);
    expect(lifeCards(g)).toEqual(LIFE);
    expect(deck(g)).toHaveLength(11);
  });

  it('CR 8-3-1-3: with 0 Life the cost cannot be paid: no draw, and no loss', () => {
    const g = played([]);
    skipUnusable(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(11);
    expect(kind(g)).toBe('main');
  });

  it('with exactly 1 Life card, it is both top and bottom and can be taken (Life 0 is not a defeat)', () => {
    const g = played([RED]);
    accept(g);
    if (kind(g) === 'choose') pickLife(g, 'top');
    expect(g.life('p1')).toBe(0);
    expect(hand(g)).toEqual([RED, SC.anana].sort());
    expect(kind(g)).toBe('main');
  });

  it('RL-22: a Life card with [Trigger] taken this way is just added to hand (no [Trigger] decision)', () => {
    const g = played([SC.speed, RED, RED]);
    accept(g);
    pickLife(g, 'top');
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SC.speed, SC.anana].sort());
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['EB01-056']);
    expect(count(g, 'p1', 'trash')).toBe(0);
  });
});
