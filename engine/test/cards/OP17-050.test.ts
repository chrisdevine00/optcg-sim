/** OP17-050 Streusen. QA-OP17 OP17-050: both cards go to the top, or both to the bottom. */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { BLUE, expectDecision, game, hand, option, play, PLAIN_PURPLE, ROCKS } from './helpers.ts';

describe('OP17-050 Streusen', () => {
  const start = () => {
    const g = game(
      {
        leader: ROCKS,
        hand: ['OP17-050'],
        deck: ['OP17-045', 'OP17-052', BLUE, BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_PURPLE },
    );
    play(g, 'OP17-050');
    return g;
  };

  it('the controller sees the 2 cards, puts them on top in a chosen order, then draws the first', () => {
    const g = start();
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    const v1 = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v1.looking.map((c) => c.card).sort()).toEqual(['OP17-045', 'OP17-052']);
    const v2 = project(g.state, 'p2') as unknown as { looking: unknown[] };
    expect(v2.looking).toEqual([]);
    option(g, 'top');
    expectDecision(g, 'order', 'p1');
    const kyo = g.legal().find((a) => a.type === 'order' && g.card(a.first).card === 'OP17-052')!;
    g.act(kyo);
    expect(hand(g, 'p1')).toEqual(['OP17-052']);
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual(['OP17-045', BLUE, BLUE]);
  });

  it('both to the bottom, then draw from what was below', () => {
    const g = start();
    option(g, 'bottom');
    const first = g.legal().find((a) => a.type === 'order')!;
    g.act(first);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(
      g
        .zone('p1', 'deck')
        .map((c) => c.card)
        .slice(1)
        .sort(),
    ).toEqual(['OP17-045', 'OP17-052']);
  });
});
