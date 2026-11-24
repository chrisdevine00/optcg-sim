/** OP12-050 Jaguar.D.Saul. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { canBlockWith } from './helpers-op12g2.ts';

const ID = 'OP12-050';

/** p2 (turn 4) attacks p1's Leader with its 9000-power Character. */
const attacked = (p1chars: Parameters<typeof game>[0]['characters']) => {
  const g = game(
    { leader: 'ST04-001', characters: p1chars, life: [PURPLE, PURPLE, PURPLE] },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  return g;
};

describe('OP12-050 Jaguar.D.Saul', () => {
  it('has [Blocker]: an active Saul can be declared as the new target', () => {
    const g = attacked([ID]);
    expectDecision(g, 'block', 'p1');
    const saul = g.find('p1', 'characters', ID);
    expect(g.card(saul).keywords).toContain('Blocker');
    expect(canBlockWith(g, saul)).toBe(true);
    g.act({ type: 'block', blocker: saul });
    expect(g.card(saul).rested).toBe(true);
  });

  it('a rested Saul cannot block', () => {
    const g = attacked([{ card: ID, rested: true }]);
    const saul = g.find('p1', 'characters', ID);
    expect(g.legal().some((a) => a.type === 'block' && a.blocker === saul)).toBe(false);
  });

  it('gives [Blocker] to no other Character', () => {
    const g = attacked([ID, V.c3]);
    expect(canBlockWith(g, g.find('p1', 'characters', V.c3))).toBe(false);
    expect(g.card(g.find('p1', 'characters', V.c3)).keywords).not.toContain('Blocker');
  });
});
