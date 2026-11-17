/** OP17-089 Jaguar.D.Saul. QA-OP17 OP17-089 (via RL-43): the +12 cost applies only on the field. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';
import { ELBAPH, GIANT } from './helpers-sabo.ts';

describe('OP17-089 Jaguar.D.Saul', () => {
  it('has +12 cost on the field (16) and its printed cost elsewhere (QA-OP17 OP17-089)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [GIANT], hand: [GIANT], trash: [GIANT], deck: [GIANT] },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', GIANT)).cost).toBe(16);
    expect(g.card(g.find('p1', 'hand', GIANT)).cost).toBe(4);
    expect(g.card(g.find('p1', 'trash', GIANT)).cost).toBe(4);
  });

  const setup = (deck: string[]) =>
    game(
      { leader: PLAIN_PURPLE, hand: [GIANT], deck, costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: look at 3, add up to 1 {Elbaph} card to hand, trash the rest', () => {
    const g = setup([V.c1, ELBAPH, BLUE, V.c2]);
    play(g, GIANT);
    pick(g, [g.find('p1', 'deck', ELBAPH)]);
    expect(hand(g, 'p1')).toEqual([ELBAPH]);
    expect(trash(g, 'p1').sort()).toEqual([BLUE, V.c1].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  it('[On Play]: the player may take nothing; the 3 cards are trashed', () => {
    const g = setup([V.c1, ELBAPH, BLUE, V.c2]);
    play(g, GIANT);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(3);
  });

  it('[On Play]: with no {Elbaph} card among the 3 the look is still shown (nothing to take), then all are trashed', () => {
    const g = setup([V.c1, BLUE, V.c3, ELBAPH]);
    play(g, GIANT);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toHaveLength(3);
  });
});
