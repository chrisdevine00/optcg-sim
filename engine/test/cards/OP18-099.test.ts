/** OP18-099 Kaku. OP-18 wave G3. */
import { describe, expect, it } from 'vitest';
import { game, hand, none, option, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { CP2, CP_LEADER } from './helpers-op18-w2.ts';
import { PLAIN_PURPLE } from './helpers-op18.ts';

const ID = 'OP18-099';

describe('OP18-099 Kaku', () => {
  it('[On Play] adds a "CP" card from hand to the bottom of Life face-up', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [ID, CP2, V.c1],
        life: [V.c2],
        costArea: { active: 7, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(candidates(g)).toEqual([g.find('p1', 'hand', CP2)]);
    pick(g, [g.find('p1', 'hand', CP2)]);
    option(g, 'bottom');
    expect(g.zone('p1', 'life').map((c) => [c.card, c.faceUp])).toEqual([
      [V.c2, false],
      [CP2, true],
    ]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('"up to 1": may add nothing', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID, CP2], life: [V.c2], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    none(g);
    expect(g.zone('p1', 'life')).toHaveLength(1);
  });

  it('[Trigger] with a "CP" Leader: draw 1 and place a cost 8 or less Character at the bottom of its deck', () => {
    const g = game(
      { leader: CP_LEADER, life: [ID], deck: [V.c1, V.c2, V.c3] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(g.zone('p2', 'characters')).toEqual([]);
  });
});
