/** OP12-087 Nico Robin. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, pick, play, trash } from './helpers.ts';
import { BLUE, LUFFY_LEADER, mk, PLAIN_BLUE, RA_LEADER, rep, V } from './helpers-op12g3.ts';

const ID = 'OP12-087';
/** The Koala Leader (OP12-081 is unscripted here, so its text is inert). */
const KOALA_LEADER = 'OP12-081';

describe('OP12-087 Nico Robin', () => {
  it('with a [Monkey.D.Luffy] Leader: [Blocker] and +3 cost (6 becomes 9)', () => {
    const g = mk({ leader: LUFFY_LEADER, characters: [ID] });
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(9);
  });

  it('with a [Koala] Leader too', () => {
    const g = mk({ leader: KOALA_LEADER, characters: [ID] });
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(9);
  });

  it('must not apply with any other Leader (even a Revolutionary Army one or another [Luffy]-less Leader): no [Blocker], cost 6', () => {
    for (const leader of [RA_LEADER, PLAIN_BLUE]) {
      const g = mk({ leader, characters: [ID] });
      const c = g.card(g.find('p1', 'characters', ID));
      expect(c.keywords).not.toContain('Blocker');
      expect(c.cost).toBe(6);
    }
  });

  it('[On Play] trash 1 card from your hand: with 5 cards in the opponent hand, they choose and trash 2', () => {
    const g = mk({ hand: [ID, V.c1] }, { hand: [...rep(4, BLUE), V.c2] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    const d = expectDecision(g, 'choose', 'p2');
    expect([d.min, d.max]).toEqual([2, 2]);
    pick(g, [g.find('p2', 'hand', V.c2), g.find('p2', 'hand', BLUE, 0)]);
    expect(hand(g, 'p2')).toHaveLength(3);
    expect(trash(g, 'p2')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('boundary: 4 cards in the opponent hand: the cost is still paid but nothing is trashed', () => {
    const g = mk({ hand: [ID, V.c1] }, { hand: rep(4, BLUE) });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('declining the cost does nothing', () => {
    const g = mk({ hand: [ID, V.c1] }, { hand: rep(6, BLUE) });
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p2')).toHaveLength(6);
  });
});
