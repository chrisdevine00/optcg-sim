/** OP11-108 Neptune. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { SHIRAHOSHI, up } from './helpers-op11g3.ts';

const ID = 'OP11-108';

describe('OP11-108 Neptune', () => {
  const start = (
    leader: string = SHIRAHOSHI,
    life: Parameters<typeof game>[0]['life'] = [up(BLUE), BLUE],
  ) =>
    game(
      {
        leader,
        hand: [ID, V.c1],
        life,
        deck: [V.c2, V.c3, V.c4],
        costArea: { active: 5, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: with [Shirahoshi], turn the top Life card face-down: draw 2 cards and trash 1 card from your hand', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, V.c3]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c3]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expectDecision(g, 'main', 'p1');
  });

  it('the trashed card may be one of the freshly drawn cards or an older one', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c2, V.c3]);
  });

  it('the cost is optional: declining draws nothing and trashes nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('does nothing with a Leader that is not [Shirahoshi]: no cost is offered', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('cannot be paid when the top Life card is face-down', () => {
    const g = start(SHIRAHOSHI, [BLUE, up(BLUE)]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });
});
