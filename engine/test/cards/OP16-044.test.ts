/** OP16-044 Emporio.Ivankov: a bare [Blocker]. */
import { describe, expect, it } from 'vitest';
import { dec, game, play, V } from './helpers.ts';
import { BLUE_LEADER, IMPEL_LEADER, IVANKOV, mine } from './helpers-op16g2.ts';

const ID = IVANKOV;

describe('OP16-044 Emporio.Ivankov', () => {
  const attacked = (extra: { rested?: boolean } = {}) => {
    const g = game(
      { leader: IMPEL_LEADER, characters: [{ card: ID, ...extra }] },
      { leader: BLUE_LEADER, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c6),
      target: g.leader('p1'),
    });
    return g;
  };

  it('has [Blocker] and may block an attack on your Leader, becoming the new target', () => {
    const g = attacked();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    const blocker = g.find('p1', 'characters', ID);
    expect(g.isLegal({ type: 'block', blocker, player: 'p1' })).toBe(true);
    g.act({ type: 'block', blocker });
    expect(g.card(blocker).rested).toBe(true);
  });

  it('a rested Ivankov cannot block', () => {
    const g = attacked({ rested: true });
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(false);
  });

  it('playing it asks nothing: there is no effect', () => {
    const g = mine({ hand: [ID] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
  });
});
