/** OP16-049 Portgas.D.Ace (Blue, cost 3). */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, game, hand } from './helpers.ts';
import { BLUE_LEADER, IMPEL_LEADER } from './helpers-op16g2.ts';

const ID = 'OP16-049';

describe('OP16-049 Portgas.D.Ace', () => {
  const start = (rested = false) =>
    game(
      { leader: IMPEL_LEADER, characters: [{ card: ID, rested }], deck: Array(6).fill(BLUE) },
      { leader: BLUE_LEADER },
    );
  const act = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'activate' });
  const canAct = (g: ReturnType<typeof start>) =>
    g.isLegal({
      type: 'activate',
      card: g.find('p1', 'characters', ID),
      ability: 'activate',
      player: 'p1',
    });

  it('[Activate: Main] rest this Character: draw 1 card', () => {
    const g = start();
    act(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('draws exactly 1, not more', () => {
    const g = start();
    act(g);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('cannot be activated while rested', () => {
    expect(canAct(start(true))).toBe(false);
  });

  it('cannot be activated a second time in the same turn (it is rested)', () => {
    const g = start();
    act(g);
    expect(canAct(g)).toBe(false);
  });

  it('is available again on the next turn', () => {
    const g = start();
    act(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canAct(g)).toBe(true);
  });
});
