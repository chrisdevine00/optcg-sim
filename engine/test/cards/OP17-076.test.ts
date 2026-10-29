/** OP17-076 Wo Ro Ro Ro Ro... I Think I've Sobered Up. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  don,
  game,
  hand,
  KAIDO,
  passBlock,
  pick,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { damageWith } from './triggers.ts';

describe('OP17-076', () => {
  it('[Counter] trash 1 card: +3000 during this battle', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-076', PURPLE] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-076'), ability: 'counter' });
    accept(g); // the "you may" activation cost (CR 8-3-1-4)
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('CR 8-3-1-4 (B-1): with no other card it can be activated, but the trash cost is forced no: no +3000', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-076'] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-076'), ability: 'counter' });
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    g.act({ type: 'optional', accept: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP17-076']);
  });

  it('[Trigger] DON!! −1: draw 2; not offered with no DON!! on the field', () => {
    const g = damageWith('OP17-076', {
      costArea: { active: 1, rested: 0 },
      deck: [BLUE, BLUE, BLUE],
    });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(don(g, 'p1').deck).toBe(10);
    const none = damageWith('OP17-076');
    expect(none.isLegal({ type: 'trigger', activate: true, player: 'p1' })).toBe(false);
  });
});
