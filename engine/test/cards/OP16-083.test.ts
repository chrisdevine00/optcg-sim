/** OP16-083 Kouzuki Oden. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { NOT_NAVY, WANO_8 } from './helpers-op16g3.ts';

const ID = 'OP16-083';
const start = (cards: string[]) =>
  game(
    { leader: NOT_NAVY, hand: [ID, ...cards], costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP16-083 Kouzuki Oden', () => {
  it('has [Blocker]', () => {
    const g = start([]);
    play(g, ID);
    if (g.legal().some((a) => a.type === 'optional' && a.accept)) decline(g);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] trash a Character with a cost of 8 or more from hand: draw 2', () => {
    const g = start([WANO_8, V.c7, PURPLE]);
    play(g, ID);
    accept(g);
    // Only the cost 8 Character qualifies; the cost 7 one and the vanilla are not offered.
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', WANO_8)]);
    expect(trash(g, 'p1')).toEqual([WANO_8]);
    expect(hand(g, 'p1')).toEqual([V.c7, PURPLE, BLUE, BLUE]);
  });

  it('declining the optional cost draws nothing', () => {
    const g = start([WANO_8]);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([WANO_8]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('with no Character of cost 8 or more in hand the cost cannot be paid', () => {
    const g = start([V.c7, PURPLE]);
    play(g, ID);
    if (g.legal().some((a) => a.type === 'optional' && a.accept)) decline(g);
    expect(hand(g, 'p1')).toEqual([V.c7, PURPLE]);
    expect(trash(g, 'p1')).toEqual([]);
  });
});
