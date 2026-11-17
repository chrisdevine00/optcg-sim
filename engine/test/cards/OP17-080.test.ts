/** OP17-080 Usopp. */
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
import { ELBAPH, expectBigCondition, GIANT } from './helpers-sabo.ts';

describe('OP17-080 Usopp', () => {
  it('+3000 power while a Character with a cost of 12 or more exists (either side, current cost)', () => {
    expectBigCondition('OP17-080', (g, id) => g.power(id), 2000, 5000);
  });

  const setup = (deck: string[]) =>
    game(
      { leader: PLAIN_PURPLE, hand: ['OP17-080'], deck, costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: look at 3, add up to 1 {Elbaph} card to hand, trash the rest', () => {
    const g = setup([BLUE, ELBAPH, V.c1, V.c2]);
    play(g, 'OP17-080');
    // Only the {Elbaph} card (Rodo) can be chosen.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', ELBAPH)]);
    expect(hand(g, 'p1')).toEqual([ELBAPH]);
    expect(trash(g, 'p1').sort()).toEqual([BLUE, V.c1].sort());
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c2]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(ELBAPH);
  });

  it('[On Play]: "up to 1": the player may take nothing and all 3 are trashed', () => {
    const g = setup([BLUE, ELBAPH, GIANT, V.c2]);
    play(g, 'OP17-080');
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(3);
  });

  it('[On Play]: with no {Elbaph} card among the 3 the look is still shown (nothing to take), then all are trashed', () => {
    const g = setup([BLUE, V.c1, V.c2, ELBAPH]);
    play(g, 'OP17-080');
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toHaveLength(3);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
