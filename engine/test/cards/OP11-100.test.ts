/** OP11-100 Otohime. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, expectDecision, game, hand, play, PLAIN_BLUE } from './helpers.ts';
import { SHIRAHOSHI, up } from './helpers-op11g3.ts';

const ID = 'OP11-100';

describe('OP11-100 Otohime', () => {
  const start = (
    leader: string = SHIRAHOSHI,
    life: Parameters<typeof game>[0]['life'] = [up(BLUE), BLUE],
  ) =>
    game({ leader, hand: [ID], life, costArea: { active: 1, rested: 0 } }, { leader: PLAIN_BLUE });

  it('[On Play]: with [Shirahoshi] as Leader, turn the top Life card face-down: draw 1 card', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toHaveLength(1);
    expectDecision(g, 'main', 'p1');
  });

  it('the cost is optional: declining keeps the Life card face-up and draws nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('does nothing with a Leader that is not [Shirahoshi]: no cost is offered', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('cannot be paid when the top Life card is face-down', () => {
    const g = start(SHIRAHOSHI, [BLUE, up(BLUE)]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('cannot be paid with no Life cards', () => {
    const g = start(SHIRAHOSHI, []);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
