/** OP18-098 Onigumo: a bare [Unblockable]. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, game, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

const ID = 'OP18-098';
const BLOCKER = 'OP18-112';

const attack = (attacker: string) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [attacker] },
    { leader: PLAIN_BLUE, characters: [BLOCKER] },
  );
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', attacker), target: g.leader('p2') });
  return g;
};

describe('OP18-098 Onigumo', () => {
  it('has [Unblockable]', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Unblockable');
  });

  it('the defender is not asked to block, even with an active [Blocker]', () => {
    const g = attack(ID);
    const blocker = g.find('p2', 'characters', BLOCKER);
    expect(g.isLegal({ type: 'block', blocker, player: 'p2' })).toBe(false);
    g.act({ type: 'block', blocker: null });
    expect(dec(g)?.kind).toBe('counter');
  });

  it('control: a Character without it can be blocked', () => {
    const g = attack(V.c7);
    expectDecision(g, 'block', 'p2');
    const blocker = g.find('p2', 'characters', BLOCKER);
    expect(g.isLegal({ type: 'block', blocker, player: 'p2' })).toBe(true);
  });

  it('playing it asks nothing: there is no effect', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });
});
