/** OP09-004 Shanks. */
import { describe, expect, it } from 'vitest';
import { expectDecision, play, V } from './helpers.ts';
import { canHit, koByEffect, mk, OPP } from './helpers-a09g1.ts';

const ID = 'OP09-004';
const pw = (g: ReturnType<typeof mk>, who: 'p1' | 'p2', card: string) =>
  g.power(g.find(who, 'characters', card));

describe('OP09-004 Shanks', () => {
  it("gives all of your opponent's Characters -1000 power (not their Leader, not yours)", () => {
    const g = mk({ characters: [ID, V.c4] }, { characters: [V.c4, V.c1] });
    expect(pw(g, 'p2', V.c4)).toBe(5000);
    expect(pw(g, 'p2', V.c1)).toBe(2000);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(pw(g, 'p1', V.c4)).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('is continuous: it also lowers a Character the opponent plays later, and on their turn', () => {
    const g = mk({ characters: [ID] }, { hand: [V.c4], costArea: { active: 5, rested: 0 } }, OPP);
    play(g, V.c4);
    expect(pw(g, 'p2', V.c4)).toBe(5000);
  });

  it('ends when Shanks leaves the field', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c4] });
    expect(pw(g, 'p2', V.c4)).toBe(5000);
    koByEffect(g, 'p1', ID);
    expect(pw(g, 'p2', V.c4)).toBe(6000);
  });

  it('two Shanks stack: -2000', () => {
    const g = mk({ characters: [ID, ID] }, { characters: [V.c4] });
    expect(pw(g, 'p2', V.c4)).toBe(4000);
  });

  it('[Rush]: can attack the turn it is played (an ordinary Character cannot)', () => {
    const g = mk({
      characters: [
        { card: ID, playedThisTurn: true },
        { card: V.c4, playedThisTurn: true },
      ],
    });
    expect(canHit(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
    expect(canHit(g, g.find('p1', 'characters', V.c4), g.leader('p2'))).toBe(false);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expectDecision(g, 'block', 'p2');
  });
});
