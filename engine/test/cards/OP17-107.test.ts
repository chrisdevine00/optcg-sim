/** OP17-107 Charlotte Daifuku: [Trigger] play this card (no other effect). */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, play, PLAIN_BLUE } from './helpers.ts';
import { ENEL, ids, triggerHit } from './helpers-robin.ts';

describe('OP17-107 Charlotte Daifuku', () => {
  it('[Trigger] plays this card', () => {
    const g = triggerHit('OP17-107');
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual(['OP17-107']);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
  });

  it('declining the [Trigger] adds it to hand instead', () => {
    const g = triggerHit('OP17-107');
    g.act({ type: 'trigger', activate: false });
    expect(ids(g, 'p1', 'hand')).toEqual(['OP17-107']);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('has no [On Play]: playing it from hand does nothing more', () => {
    const g = game(
      { leader: ENEL, hand: ['OP17-107'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-107');
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual(['OP17-107']);
  });
});
