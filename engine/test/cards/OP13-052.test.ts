/** OP13-052 Boa Marigold. */
import { describe, expect, it } from 'vitest';
import { none, pick, play, PLAIN_BLUE } from './helpers.ts';
import {
  canPick,
  cardsOf,
  dec,
  expectDecision,
  H3,
  H6,
  H7,
  HANCOCK,
  mk,
  V,
} from './helpers-op13g2.ts';

const ID = 'OP13-052';

const start = (leader: string, hand: string[] = [H3, H6, H7, V.c1]) =>
  mk({ leader, hand: [ID, ...hand] });

describe('OP13-052 Boa Marigold', () => {
  it('[On Play]: with [Boa Hancock] as Leader, plays a [Boa Hancock] of cost 6 or less (boundary 6)', () => {
    const g = start(HANCOCK);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', H6))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', H3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', H7))).toBe(false); // cost 7
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'hand', H6)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID, H6]);
  });

  it('must not fire with another Leader', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play none, and only one is played', () => {
    const g = start(HANCOCK);
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    const h = start(HANCOCK);
    play(h, ID);
    pick(h, [h.find('p1', 'hand', H3)]);
    expectDecision(h, 'main', 'p1');
    expect(cardsOf(h, 'p1', 'characters')).toEqual([ID, H3]);
  });

  it('[Blocker]: can block an attack on your Leader', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(dec(g)?.kind).toBe('block');
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
  });
});
