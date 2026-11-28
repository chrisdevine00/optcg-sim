/** OP18-112 Yamakaji: a bare [Blocker]. */
import { describe, expect, it } from 'vitest';
import { game, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

const ID = 'OP18-112';

describe('OP18-112 Yamakaji', () => {
  const attacked = (extra: { rested?: boolean } = {}) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, ...extra }] },
      { leader: PLAIN_BLUE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    return g;
  };

  it('has [Blocker] and may block an attack on your Leader, becoming the new target', () => {
    const g = attacked();
    const blocker = g.find('p1', 'characters', ID);
    expect(g.card(blocker).keywords).toContain('Blocker');
    expect(g.isLegal({ type: 'block', blocker, player: 'p1' })).toBe(true);
    g.act({ type: 'block', blocker });
    expect(g.card(blocker).rested).toBe(true);
  });

  it('a rested Yamakaji cannot block', () => {
    const g = attacked({ rested: true });
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(false);
  });

  it('playing it asks nothing: there is no effect', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});
