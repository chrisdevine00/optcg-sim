/** OP14-016 X.Drake. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, expectDecision, none, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { attack, finishBattle, mk, mk5, SN2 } from './helpers-op14g1.ts';

const ID = 'OP14-016';

const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
/** p2's turn: p1 has Drake, a {Supernovas} Character and a plain one; p2 K.O.s `target`. */
const byOpponent = (target: string, action: Record<string, unknown> = koOne) => {
  const g = mk({ characters: [ID, SN2, V.c4] }, {}, { turn: 4, activePlayer: 'p2' });
  plantOpponentEffect(g, action);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP14-016 X.Drake', () => {
  it("[Opponent's Turn]: instead of a {Supernovas} Character being K.O.'d by the opponent's effect, the Leader gets -2000 power", () => {
    const g = byOpponent(SN2);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toContain(SN2);
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it('may be declined: the Character is K.O.d and the Leader keeps its power', () => {
    const g = byOpponent(SN2);
    decline(g);
    expect(chars(g)).not.toContain(SN2);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('covers Drake himself and any removal by the opponent (a return to hand)', () => {
    const g = byOpponent(ID);
    accept(g);
    expect(chars(g)).toContain(ID);
    const h = byOpponent(SN2, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    expectDecision(h, 'optional', 'p1');
    accept(h);
    expect(chars(h)).toContain(SN2);
  });

  it('must not cover a Character that is not {Supernovas}', () => {
    const g = byOpponent(V.c4);
    expectDecision(g, 'main', 'p2');
    expect(chars(g)).not.toContain(V.c4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not apply on your own turn, nor to your own effect, nor in battle', () => {
    const own = mk({ characters: [ID, SN2] });
    own.state = applyOp(own.state, {
      op: 'ko',
      card: own.find('p1', 'characters', SN2),
      by: 'p2',
    }).state;
    expectDecision(own, 'main', 'p1');
    expect(chars(own)).not.toContain(SN2);

    const self = mk({ characters: [ID, SN2] }, {}, { turn: 4, activePlayer: 'p2' });
    self.state = applyOp(self.state, {
      op: 'ko',
      card: self.find('p1', 'characters', SN2),
      by: 'p1',
    }).state;
    expect(chars(self)).not.toContain(SN2);
  });

  it('Once Per Turn: the second removal in the same turn is not replaced', () => {
    const g = mk({ characters: [ID, SN2, SN2] }, {}, { turn: 4, activePlayer: 'p2' });
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', SN2, 0)]);
    accept(g);
    g.act({ type: 'activate', card: g.leader('p2'), ability: 'planted' });
    pick(g, [g.find('p1', 'characters', SN2, 1)]);
    expectDecision(g, 'main', 'p2');
    expect(chars(g).filter((c) => c === SN2)).toHaveLength(1);
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it('[DON!! x1] [When Attacking]: -2000 to up to 1 opposing Character; needs 1 DON!! given', () => {
    const g = mk5({ characters: [{ card: ID, don: 1 }] }, { characters: [V.c5] });
    attack(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(5000);
    finishBattle(g);
    const h = mk({ characters: [ID] }, { characters: [V.c5] });
    attack(h, h.find('p1', 'characters', ID));
    expect(h.power(h.find('p2', 'characters', V.c5))).toBe(7000);
    const i = mk5({ characters: [{ card: ID, don: 1 }] }, { characters: [V.c5] });
    attack(i, i.find('p1', 'characters', ID));
    none(i);
    expect(i.power(i.find('p2', 'characters', V.c5))).toBe(7000);
  });
});
