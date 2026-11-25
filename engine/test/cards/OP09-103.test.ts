/** OP09-103 Koala. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  canPick,
  dec,
  decline,
  expectDecision,
  handIds,
  idsOf,
  mk,
  none,
  option,
  pick,
  play,
  V,
  Y4,
} from './helpers-a09g3.ts';

const ID = 'OP09-103';
const RA5 = 'OP12-083'; // {Revolutionary Army} cost 5 (too expensive)
const LIFE = [V.c5, V.c2, V.c1];
const start = (p1: object = {}) =>
  mk({ hand: [ID, Y4, RA5, V.c3], life: LIFE, deck: [V.c4, V.c6, V.c7], ...p1 }, {}, undefined, 10);

describe('OP09-103 Koala', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] add a Life card to hand: play a {Revolutionary Army} Character with cost 4 or less from hand; if you do, draw 1', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'top');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', Y4))).toBe(true); // cost 4: boundary
    expect(canPick(g, g.find('p1', 'hand', RA5))).toBe(false); // cost 5
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false); // not {Revolutionary Army}
    pick(g, [g.find('p1', 'hand', Y4)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID, Y4]);
    expect(g.life('p1')).toBe(2);
    expect(handIds(g, 'p1')).toEqual([RA5, V.c3, V.c5, V.c4]); // Life card added, then the draw
  });

  it('the Life card can come from the bottom', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'bottom');
    none(g);
    expect(handIds(g, 'p1')).toContain(V.c1);
    expect(idsOf(g, 'p1', 'life')).toEqual([V.c5, V.c2]);
  });

  it('"If you do": no Character played means no draw (the Life card is still added)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'top');
    none(g);
    expect(handIds(g, 'p1')).toEqual([Y4, RA5, V.c3, V.c5]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c4, V.c6, V.c7]);
  });

  it('declining the cost does nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(handIds(g, 'p1')).toHaveLength(3);
    expect(dec(g)?.kind).toBe('main');
  });

  it('with no Life cards the cost cannot be paid', () => {
    const g = start({ life: [] });
    play(g, ID);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });
});
