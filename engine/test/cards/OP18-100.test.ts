/** OP18-100 Kalifa. OP-18 wave G3. */
import { describe, expect, it } from 'vitest';
import { game, hand, option, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { CP2, CP_LEADER } from './helpers-op18-w2.ts';
import { PLAIN_PURPLE } from './helpers-op18.ts';

const ID = 'OP18-100';

describe('OP18-100 Kalifa', () => {
  it('[On Play] draws 1, then the drawn "CP" card may go to the top of Life face-up', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [ID],
        deck: [CP2, V.c3, V.c4],
        life: [V.c2],
        costArea: { active: 6, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    pick(g, [g.find('p1', 'hand', CP2)]);
    option(g, 'top');
    expect(g.zone('p1', 'life').map((c) => [c.card, c.faceUp])).toEqual([
      [CP2, true],
      [V.c2, false],
    ]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger] with a "CP" Leader: draw 1 and rest the opponent\'s Leader', () => {
    const g = game(
      { leader: CP_LEADER, life: [ID], deck: [V.c1, V.c2, V.c3] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.leader('p2')]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(g.card(g.leader('p2')).rested).toBe(true);
  });

  it('[Trigger] with another Leader does nothing', () => {
    const g = game(
      { leader: PLAIN_PURPLE, life: [ID], deck: [V.c1, V.c2, V.c3] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([]);
  });
});
