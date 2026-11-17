/** OP06-106 Kouzuki Hiyori. QA-GR: adding a Life card to the hand is not damage, so no [Trigger]. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  none,
  option,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { HANCOCK, MONET } from './helpers-hancock-rosi.ts';

describe('OP06-106 Kouzuki Hiyori', () => {
  const start = (life: string[]) => {
    const g = game(
      {
        leader: HANCOCK,
        hand: ['OP06-106', BLUE],
        life,
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP06-106');
    return g;
  };

  it('[On Play] adds the top Life card to your hand, then adds up to 1 hand card to the top of your Life', () => {
    const g = start([MONET, V.c1, V.c2]);
    accept(g);
    option(g, 'top');
    // Not damage: the [Trigger] on Monet is not offered.
    expect(hand(g, 'p1').sort()).toEqual([BLUE, MONET].sort());
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.life('p1')).toBe(3);
    const top = g.zone('p1', 'life')[0]!;
    expect(top.card).toBe(BLUE);
    expect(top.faceUp).toBe(false);
    expect(hand(g, 'p1')).toEqual([MONET]);
  });

  it('may take the bottom Life card instead', () => {
    const g = start([V.c1, V.c2, MONET]);
    accept(g);
    option(g, 'bottom');
    expect(hand(g, 'p1')).toContain(MONET);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([BLUE, V.c1, V.c2]);
  });

  it('the card added to Life is optional ("up to 1"), and may be the card just taken', () => {
    const g = start([MONET, V.c1]);
    accept(g);
    option(g, 'top');
    none(g);
    expect(g.life('p1')).toBe(1);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('the cost may be declined: nothing moves', () => {
    const g = start([MONET, V.c1]);
    decline(g);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('with 0 Life the cost cannot be paid', () => {
    const g = start([]);
    // The ability does not even ask: it cannot be paid.
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});

void PURPLE;
