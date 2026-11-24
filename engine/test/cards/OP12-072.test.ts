/** OP12-072 Zeff. */
import { describe, expect, it } from 'vitest';
import { canAttack, mine, NAVY_LEADER, plant, SANJI_LEADER } from './helpers-op12g2.ts';

const ID = 'OP12-072';
const returnMine = { returnDon: { n: 1 } };
const returnTheirs = { returnDon: { n: 1, player: 'opponent' } };

describe('OP12-072 Zeff', () => {
  const start = (leader: string, p2active = 2) =>
    mine(
      { leader, characters: [{ card: ID, playedThisTurn: true }] },
      { costArea: { active: p2active, rested: 0 } },
    );
  const zeff = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

  it('when your DON!! is returned and your Leader is [Sanji], Zeff gains [Rush] (he can attack the turn he is played)', () => {
    const g = start(SANJI_LEADER);
    expect(canAttack(g, zeff(g), g.leader('p2'))).toBe(false);
    plant(g, 'p1', returnMine);
    expect(g.card(zeff(g)).keywords).toContain('Rush');
    expect(canAttack(g, zeff(g), g.leader('p2'))).toBe(true);
  });

  it('with a Leader that is not [Sanji] he gains nothing', () => {
    const g = start(NAVY_LEADER);
    plant(g, 'p1', returnMine);
    expect(g.card(zeff(g)).keywords).not.toContain('Rush');
    expect(canAttack(g, zeff(g), g.leader('p2'))).toBe(false);
  });

  it("the opponent's DON!! returned to their deck does not count", () => {
    const g = start(SANJI_LEADER);
    plant(g, 'p1', returnTheirs);
    expect(g.card(zeff(g)).keywords).not.toContain('Rush');
    expect(canAttack(g, zeff(g), g.leader('p2'))).toBe(false);
  });

  it('[Rush] lasts during this turn only', () => {
    const g = start(SANJI_LEADER);
    plant(g, 'p1', returnMine);
    g.act({ type: 'endTurn' });
    expect(g.card(zeff(g)).keywords).not.toContain('Rush');
  });

  it('nothing happens until a DON!! is actually returned', () => {
    const g = start(SANJI_LEADER);
    expect(g.card(zeff(g)).keywords).not.toContain('Rush');
  });
});
