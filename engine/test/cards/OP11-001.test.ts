/** OP11-001 Koby (Leader). */
import { describe, expect, it } from 'vitest';
import { accept, dec, expectDecision, pick, trash, V } from './helpers.ts';
import { canHit, ids, koBy, koByEffect, mk, NAVY, settle, SWORD6 } from './helpers-op11g1.ts';

const ID = 'OP11-001';
const T4 = [V.c1, V.c2, V.c3, V.c4];
const opp = { turn: 4, activePlayer: 'p2' } as const;
const run = (chars: string[], trashCards: string[] = T4) =>
  mk({ leader: ID, characters: chars, trash: trashCards }, {}, opp);

describe('OP11-001 Koby', () => {
  it('your {SWORD} Characters can attack Characters on the turn they are played', () => {
    const g = mk(
      {
        leader: ID,
        characters: [
          { card: SWORD6, playedThisTurn: true },
          { card: V.c4, playedThisTurn: true },
        ],
      },
      { characters: [{ card: V.c1, rested: true }] },
    );
    const target = g.find('p2', 'characters', V.c1);
    expect(canHit(g, g.find('p1', 'characters', SWORD6), target)).toBe(true);
    // It is Rush: Character, not Rush: the Leader is still out of reach.
    expect(canHit(g, g.find('p1', 'characters', SWORD6), g.leader('p2'))).toBe(false);
    // A Character without the {SWORD} type gets nothing.
    expect(canHit(g, g.find('p1', 'characters', V.c4), target)).toBe(false);
  });

  it("a {Navy} Character with 7000 base power is saved from the opponent's effect: 3 trash cards go to the bottom in the order picked", () => {
    const g = run([NAVY.c5]);
    koByEffect(g, 'p1', NAVY.c5);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [
      g.find('p1', 'trash', V.c3),
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', V.c2),
    ]);
    settle(g);
    expect(ids(g, 'p1', 'characters')).toEqual([NAVY.c5]);
    expect(trash(g, 'p1')).toEqual([V.c4]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(-3)
        .map((c) => c.card),
    ).toEqual([V.c3, V.c1, V.c2]);
  });

  it('does not apply to base power 8000, to a non-{Navy} Character, or to your own effect', () => {
    const g = run([NAVY.c6, V.c1, NAVY.c5]);
    koByEffect(g, 'p1', NAVY.c6);
    expect(dec(g)?.kind).not.toBe('optional');
    koByEffect(g, 'p1', V.c1);
    expect(dec(g)?.kind).not.toBe('optional');
    koBy(g, 'p1', NAVY.c5, 'p1');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('boundaries on BASE power: 4000 is covered, 10000 is not', () => {
    const g = run([NAVY.c2, NAVY.c8]);
    koByEffect(g, 'p1', NAVY.c8);
    expect(dec(g)?.kind).not.toBe('optional');
    koByEffect(g, 'p1', NAVY.c2);
    expectDecision(g, 'optional', 'p1');
  });

  it('is Once Per Turn, and is not offered with fewer than 3 cards in the trash', () => {
    const few = run([NAVY.c5], [V.c1, V.c2]);
    koByEffect(few, 'p1', NAVY.c5);
    expect(dec(few)?.kind).not.toBe('optional');
    expect(ids(few, 'p1', 'characters')).toEqual([]);

    const g = run([NAVY.c5, NAVY.c2], [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6]);
    koByEffect(g, 'p1', NAVY.c5);
    accept(g);
    pick(g, [
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', V.c2),
      g.find('p1', 'trash', V.c3),
    ]);
    settle(g);
    koByEffect(g, 'p1', NAVY.c2);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([NAVY.c5]);
  });
});
