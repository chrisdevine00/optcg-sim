/** OP13-047 Fossa. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, pick, PLAIN_BLUE } from './helpers.ts';
import {
  expectDecision,
  mainOf,
  mk,
  plantOpponentEffect,
  V,
  WB4,
  WB_ALLY,
} from './helpers-op13g2.ts';

const ID = 'OP13-047';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

// p2's turn: p2's Leader plants a K.O. effect that targets one of p1's Characters.
const byOpponent = (target: string, board: string[] = [ID, WB4, V.c2, WB_ALLY]) => {
  const g = mk({ characters: board }, { leader: PLAIN_BLUE }, { turn: 4, activePlayer: 'p2' });
  plantOpponentEffect(g, koOne);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};

describe('OP13-047 Fossa', () => {
  it("a {Whitebeard Pirates} Character K.O.'d by the opponent's effect stays when you trash Fossa instead", () => {
    const g = byOpponent(WB4);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toContain(WB4);
    expect(chars(g)).not.toContain(ID);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('may be declined: the Character is K.O.ed and Fossa stays', () => {
    const g = byOpponent(WB4);
    decline(g);
    expect(chars(g)).not.toContain(WB4);
    expect(chars(g)).toContain(ID);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([WB4]);
  });

  it('"a type including": a {Whitebeard Pirates Allies} Character is covered too', () => {
    const g = byOpponent(WB_ALLY);
    accept(g);
    expect(chars(g)).toContain(WB_ALLY);
  });

  it('reading: Fossa is a {Whitebeard Pirates} Character herself, so her own K.O. is covered (trashed instead)', () => {
    const g = byOpponent(ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).not.toContain(ID);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('must not cover a Character without the type', () => {
    const g = byOpponent(V.c2);
    expect(mainOf(g, 'p2')).toBe(true);
    expect(chars(g)).not.toContain(V.c2);
    expect(chars(g)).toContain(ID);
  });

  it('must not cover a K.O. by your own effect', () => {
    const g = mk(
      { characters: [ID, WB4] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', WB4), by: 'p1' }).state;
    expect(chars(g)).not.toContain(WB4);
    expect(chars(g)).toContain(ID);
  });

  it('must not cover a bounce (K.O. only)', () => {
    const g = mk(
      { characters: [ID, WB4] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    pick(g, [g.find('p1', 'characters', WB4)]);
    expect(mainOf(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([ID]);
  });
});
