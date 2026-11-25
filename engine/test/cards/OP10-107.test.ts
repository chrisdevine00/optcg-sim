/** OP10-107 Jewelry Bonney. */
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
  SUPER_GREEN4,
  SUPER_RED3,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-107';
const LIFE = ['OP02-060', 'ST05-007', V.c3];
const start = (p1: object = {}) =>
  mk({ hand: [ID, SUPER5, SUPER6, SUPER_RED3, SUPER_GREEN4, V.c5], life: LIFE, ...p1 });

describe('OP10-107 Jewelry Bonney', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] add a Life card to your hand: put a Supernovas Character with cost 5 from hand on top of Life face-up', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'top');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', SUPER5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', SUPER6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p1', 'hand', SUPER_GREEN4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p1', 'hand', SUPER_RED3))).toBe(false); // cost 3
    expect(canPick(g, g.find('p1', 'hand', V.c5))).toBe(false); // cost 5 but not Supernovas
    pick(g, [g.find('p1', 'hand', SUPER5)]);
    expect(idsOf(g, 'p1', 'life')).toEqual([SUPER5, LIFE[1], LIFE[2]]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('the Life card can come from the bottom', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'bottom');
    pick(g, [g.find('p1', 'hand', SUPER5)]);
    expect(idsOf(g, 'p1', 'life')).toEqual([SUPER5, LIFE[0], LIFE[1]]);
    expect(hand(g, 'p1')).toContain(LIFE[2]);
  });

  it('"up to 1": may add nothing', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'top');
    none(g);
    expect(g.life('p1')).toBe(2);
  });

  it('declining the cost leaves everything as it was', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(idsOf(g, 'p1', 'life')).toEqual(LIFE);
  });

  it('must not fire with no Life cards', () => {
    const g = start({ life: [] });
    play(g, ID);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expect(g.life('p1')).toBe(0);
  });
});
