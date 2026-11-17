/** OP14-104 Gecko Moria. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  none,
  option,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { damageGame, HANCOCK, KUJA, LILY, TBP4, TBP8 } from './helpers-hancock-rosi.ts';

describe('OP14-104 Gecko Moria', () => {
  const start = (trash: string[] = [TBP4, TBP8, LILY]) => {
    const g = game(
      {
        leader: HANCOCK,
        hand: ['OP14-104'],
        trash,
        life: [PURPLE, PURPLE],
        costArea: { active: 8, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP14-104');
    return g;
  };

  it('[On Play] selects a {Thriller Bark Pirates} Character with a cost of 4 or less from the trash and plays it', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    // Only the cost 4 {Thriller Bark Pirates} card qualifies.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', TBP4)]);
    option(g, '0');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP14-104', TBP4]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([TBP8, LILY]);
  });

  it('or adds it to the top of your Life cards face-up', () => {
    const g = start();
    pick(g, [g.find('p1', 'trash', TBP4)]);
    option(g, '1');
    expect(g.life('p1')).toBe(3);
    const top = g.zone('p1', 'life')[0]!;
    expect(top.card).toBe(TBP4);
    expect(top.faceUp).toBe(true);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP14-104']);
  });

  it('selecting nothing does nothing (no mode is offered)', () => {
    const g = start();
    none(g);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP14-104']);
    expect(g.life('p1')).toBe(2);
  });

  it('with no qualifying card in the trash there is nothing to select', () => {
    const g = start([TBP8, LILY, V.c2]);
    expectDecision(g, 'main', 'p1');
  });

  it('[Trigger] plays up to 1 Character with a cost of 4 or less from your trash (any type)', () => {
    const g = damageGame('OP14-104', { leader: HANCOCK, trash: [KUJA, LILY, BLUE] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    // Cost 6 Kuja is too expensive; Lily (4) and the 1-cost vanilla qualify.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'trash', LILY)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([LILY]);
  });
});
