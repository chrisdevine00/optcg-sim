/** EB04-053 Sentomaru: [Blocker]; [On Block] if you have 2 or less Life cards, draw 1 card. */
import { describe, expect, it } from 'vitest';
import { hand, V } from './helpers.ts';
import { ids, oppAttack, OTHER_LEADER } from './helpers-eb04g2.ts';

const ID = 'EB04-053';

const blockWith = (life: string[]) => {
  const g = oppAttack({ leader: OTHER_LEADER, characters: [ID], life, deck: [V.c1, V.c2, V.c3] });
  g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
  return g;
};

describe('EB04-053 Sentomaru', () => {
  it('has [Blocker]', () => {
    const g = oppAttack({ leader: OTHER_LEADER, characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Block] with 2 Life: draw 1 card', () => {
    const g = blockWith([V.c1, V.c1]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(ids(g, 'p1', 'deck')).toEqual([V.c2, V.c3]);
  });

  it('[On Block] with 0 Life: draw 1 card (0 is 2 or less)', () => {
    const g = blockWith([]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('boundary: with 3 Life nothing is drawn', () => {
    const g = blockWith([V.c1, V.c1, V.c1]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'deck')).toHaveLength(3);
  });

  it('only a block triggers it: being attacked without blocking draws nothing', () => {
    const g = oppAttack({
      leader: OTHER_LEADER,
      characters: [ID],
      life: [V.c1],
      deck: [V.c1, V.c2],
    });
    g.act({ type: 'block', blocker: null });
    expect(hand(g, 'p1')).toEqual([]);
  });
});
