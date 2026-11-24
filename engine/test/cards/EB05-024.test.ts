/** EB05-024 Little Sadi. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';
import { IMPEL_LEADER } from './helpers-eb05g2.ts';

const SADI = 'EB05-024';

describe('EB05-024 Little Sadi', () => {
  it('with an {Impel Down} Leader it has [Blocker] and +2 cost (printed 1, now 3)', () => {
    const g = game({ leader: IMPEL_LEADER, characters: [SADI] }, { leader: PLAIN_BLUE });
    const c = g.card(g.find('p1', 'characters', SADI));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(3);
  });

  it('without an {Impel Down} Leader it is a plain 1-cost Character', () => {
    const g = game({ leader: PLAIN_BLUE, characters: [SADI] }, { leader: PLAIN_BLUE });
    const c = g.card(g.find('p1', 'characters', SADI));
    expect(c.keywords).not.toContain('Blocker');
    expect(c.cost).toBe(1);
  });

  it('it can block an attack with the granted [Blocker]', () => {
    const g = game(
      { leader: IMPEL_LEADER, characters: [SADI] },
      { leader: PLAIN_BLUE, characters: [V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c1), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    const sadi = g.find('p1', 'characters', SADI);
    g.act({ type: 'block', blocker: sadi });
    expect(g.card(sadi).rested).toBe(true);
  });

  it('without the Leader type it is not offered as a blocker', () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [SADI] },
      { leader: PLAIN_BLUE, characters: [V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c1), target: g.leader('p1') });
    if (g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', SADI)))
      throw new Error('Sadi must not be able to block');
    passBlock(g);
  });
});
