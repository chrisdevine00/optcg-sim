/** ST34-004 Charlotte Linlin. QA-ST34 ST34-004 (two rows). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  expectDecision,
  game,
  KAIDO,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';

describe('ST34-004 Charlotte Linlin', () => {
  it("DON!! −4 and trash 1: top of deck to Life, then an opponent's base power becomes 0", () => {
    const g = game(
      { leader: KAIDO, hand: ['ST34-004', PURPLE], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c6] },
    );
    play(g, 'ST34-004');
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    accept(g); // add the top card to Life
    expect(g.zone('p1', 'life')).toHaveLength(4);
    const t = g.find('p2', 'characters', V.c6);
    pick(g, [t]);
    expect(g.power(t)).toBe(0);
  });

  it('QA: as the only card in hand, the cost cannot be paid and nothing resolves', () => {
    const g = game(
      { leader: KAIDO, hand: ['ST34-004'], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c6] },
    );
    play(g, 'ST34-004');
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    g.act({ type: 'optional', accept: false });
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
  });
});
