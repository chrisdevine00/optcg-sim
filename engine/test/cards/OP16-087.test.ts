/** OP16-087 Shinobu. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  trash,
} from './helpers.ts';
import { MOMO_6, NOT_NAVY, WANO_LEADER } from './helpers-op16g3.ts';

const ID = 'OP16-087';
const start = (leader: string, chars: string[] = [MOMO_6]) =>
  game(
    { leader, hand: [ID], characters: chars, costArea: { active: 2, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP16-087 Shinobu', () => {
  it('[On Play] trash this Character: with a {Land of Wano} Leader draw 1 and [Kouzuki Momonosuke] gains +20 cost', () => {
    const g = start(WANO_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', MOMO_6)]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.card(g.find('p1', 'characters', MOMO_6)).cost).toBe(26);
  });

  it('with another Leader type Shinobu is still trashed (cost) but nothing else happens', () => {
    const g = start(NOT_NAVY);
    play(g, ID);
    accept(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.card(g.find('p1', 'characters', MOMO_6)).cost).toBe(6);
  });

  it('declining keeps Shinobu on the field and does nothing', () => {
    const g = start(WANO_LEADER);
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ID);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the card is drawn even with no [Kouzuki Momonosuke] to choose, and "up to 1" may be empty', () => {
    const g = start(WANO_LEADER, []);
    play(g, ID);
    accept(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    const h = start(WANO_LEADER);
    play(h, ID);
    accept(h);
    none(h);
    expect(h.card(h.find('p1', 'characters', MOMO_6)).cost).toBe(6);
  });
});
