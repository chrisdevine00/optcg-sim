/** OP15-111 Mont Blanc Noland. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, PLAIN_BLUE, takeDamage, V } from './helpers.ts';
import { canAttack, KALGARA_V, OTHER_LEADER, SI_SETO } from './helpers-op15g3.ts';

const ID = 'OP15-111';

describe('OP15-111 Mont Blanc Noland', () => {
  /** Noland (with `don` DON!! given) attacks; Kalgara copies were played this turn (summoning sick). */
  const attack = (don: number, others: string[] = [KALGARA_V], sick = true) => {
    const g = game(
      {
        leader: OTHER_LEADER,
        characters: [{ card: ID, don }, ...others.map((card) => ({ card, playedThisTurn: sick }))],
      },
      { leader: PLAIN_BLUE, characters: [{ card: V.c1, rested: true }] },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    return g;
  };
  const rush = (g: ReturnType<typeof attack>, card: string, nth = 0) =>
    g.card(g.find('p1', 'characters', card, nth)).keywords.includes('Rush');

  it('[DON!! x1] [When Attacking] gives up to 1 of your [Kalgara] cards [Rush] this turn', () => {
    const g = attack(1);
    expect(g.card(g.find('p1', 'characters', KALGARA_V)).keywords).not.toContain('Rush');
    // "up to 1" with a single candidate: it is asked once.
    pick(g, [g.find('p1', 'characters', KALGARA_V)]);
    expect(rush(g, KALGARA_V)).toBe(true);
  });

  it('with 0 DON!! given nothing happens and no choice is asked', () => {
    const g = attack(0);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(rush(g, KALGARA_V)).toBe(false);
  });

  it('only a card named [Kalgara] qualifies: another {Sky Island} Character does not', () => {
    const g = attack(1, [SI_SETO]);
    expect(
      g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p1', 'characters', SI_SETO)),
    ).toBe(false);
    expect(rush(g, SI_SETO)).toBe(false);
  });

  it('only one of two [Kalgara] Characters is given [Rush]', () => {
    const g = attack(1, [KALGARA_V, KALGARA_V]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', KALGARA_V, 1)]);
    expect(rush(g, KALGARA_V, 0)).toBe(false);
    expect(rush(g, KALGARA_V, 1)).toBe(true);
  });

  it('"up to 1": may choose none', () => {
    const g = attack(1);
    none(g);
    expect(rush(g, KALGARA_V)).toBe(false);
  });

  it('the [Rush] lets a Kalgara played this turn attack, which it could not before; it ends with the turn', () => {
    const g = game(
      {
        leader: OTHER_LEADER,
        characters: [
          { card: ID, don: 1 },
          { card: KALGARA_V, playedThisTurn: true },
        ],
      },
      { leader: PLAIN_BLUE, characters: [{ card: V.c1, rested: true }] },
    );
    const kal = g.find('p1', 'characters', KALGARA_V);
    expect(canAttack(g, kal, g.leader('p2'))).toBe(false);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    pick(g, [kal]);
    expect(g.card(kal).keywords).toContain('Rush');
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    takeDamage(g);
    expectDecision(g, 'main', 'p1');
    expect(canAttack(g, kal, g.leader('p2'))).toBe(true);
    g.act({ type: 'endTurn' });
    expect(g.card(kal).keywords).not.toContain('Rush');
  });
});
