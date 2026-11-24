/** OP12-106 Trafalgar Law (keyword-only: [Blocker]). */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { RA_LEADER } from './helpers-op12g3.ts';

const ID = 'OP12-106';

/** p2 attacks p1's Leader; p1 owes the block decision. */
const blockStep = (law: string | { card: string; rested: boolean }) => {
  const g = game(
    { leader: RA_LEADER, characters: [law] },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  return g;
};

describe('OP12-106 Trafalgar Law', () => {
  it('has [Blocker], cost 6 and 7000 power', () => {
    const g = game({ leader: RA_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(6);
    expect(c.power).toBe(7000);
  });

  it('may block: it becomes the new target, rests, and takes the 9000 attack (K.O. 9000 >= 7000)', () => {
    const g = blockStep(ID);
    expectDecision(g, 'block', 'p1');
    const law = g.find('p1', 'characters', ID);
    expect(g.legal().some((a) => a.type === 'block' && a.blocker === law)).toBe(true);
    g.act({ type: 'block', blocker: law });
    expect(g.card(law).rested).toBe(true);
  });

  it('must not block while rested', () => {
    const g = blockStep({ card: ID, rested: true });
    expectDecision(g, 'block', 'p1');
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });

  it('has no other effect: no ability is offered', () => {
    const g = game({ leader: RA_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });
});
