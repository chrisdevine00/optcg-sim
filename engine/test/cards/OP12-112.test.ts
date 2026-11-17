/** OP12-112 Baby 5: [Trigger] if your Leader is multicolored, draw 2 cards. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, PLAIN_BLUE, play, PURPLE, V } from './helpers.ts';
import { ENEL, ids, ROBIN } from './helpers-robin.ts';
import { damageWith } from './triggers.ts';

describe('OP12-112 Baby 5', () => {
  it('[Trigger] with a multicolored Leader: draw 2 cards', () => {
    const g = damageWith('OP12-112', { leader: ROBIN });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(ids(g, 'p1', 'trash')).toEqual(['OP12-112']);
  });

  it('[Trigger] with a single-colored Leader: nothing is drawn', () => {
    const g = damageWith('OP12-112', { leader: ENEL });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual(['OP12-112']);
  });

  it('declining the [Trigger] puts the card in hand and draws nothing', () => {
    const g = damageWith('OP12-112', { leader: ROBIN });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual(['OP12-112']);
  });

  it('has no other effect: playing it from hand does nothing', () => {
    const g = game(
      { leader: ROBIN, hand: ['OP12-112'], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1], life: [PURPLE] },
    );
    play(g, 'OP12-112');
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([]);
  });
});
