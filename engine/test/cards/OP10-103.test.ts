/** OP10-103 Capone"Gang"Bege. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  canAccept,
  canPick,
  dec,
  decline,
  expectDecision,
  hand,
  idsOf,
  mk,
  none,
  option,
  pick,
  play,
  SUPER5,
  SUPER6,
  SUPER_RED3,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-103';
const LIFE = ['OP02-060', 'ST05-007', V.c3]; // top first
const start = (p1: object = {}) => mk({ hand: [ID, SUPER5, V.c1, SUPER6], life: LIFE, ...p1 });

describe('OP10-103 Capone"Gang"Bege', () => {
  it('[On Play] add a Life card (top) to your hand: put a Supernovas Character from hand on top of Life, face up', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'top');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', SUPER5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', SUPER6))).toBe(true); // any cost
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false); // not Supernovas
    pick(g, [g.find('p1', 'hand', SUPER5)]);
    expect(idsOf(g, 'p1', 'life')).toEqual([SUPER5, LIFE[1], LIFE[2]]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect([...hand(g, 'p1')].sort()).toEqual([V.c1, SUPER6, LIFE[0]].sort());
  });

  it('the Life card can be taken from the bottom, and the new card goes on top', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'bottom');
    pick(g, [g.find('p1', 'hand', SUPER6)]);
    expect(idsOf(g, 'p1', 'life')).toEqual([SUPER6, LIFE[0], LIFE[1]]);
    expect(hand(g, 'p1')).toContain(LIFE[2]);
  });

  it('"up to 1": may add nothing; the Life card was still taken', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'top');
    none(g);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toContain(LIFE[0]);
  });

  it('the card just taken from Life may itself be put back (it is in the hand)', () => {
    const g = start({ life: [SUPER_RED3, V.c2, V.c3], hand: [ID] });
    play(g, ID);
    accept(g);
    option(g, 'top');
    expect(canPick(g, g.find('p1', 'hand', SUPER_RED3))).toBe(true);
    pick(g, [g.find('p1', 'hand', SUPER_RED3)]);
    expect(idsOf(g, 'p1', 'life')[0]).toBe(SUPER_RED3);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the cost: Life and hand are unchanged', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(idsOf(g, 'p1', 'life')).toEqual(LIFE);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('must not fire with no Life cards (the cost cannot be paid)', () => {
    const g = start({ life: [] });
    play(g, ID);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expect(g.life('p1')).toBe(0);
  });
});
