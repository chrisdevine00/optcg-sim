/** OP13-093 Morgans. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, play, pick, PLAIN_PURPLE, V } from './helpers.ts';
import { canBlockWith, mine, names, theirs } from './helpers-op13g4.ts';

const ID = 'OP13-093';

describe('OP13-093 Morgans', () => {
  it('[On Play] draws 2, then trashes exactly 2 cards from hand', () => {
    const g = mine(
      { leader: PLAIN_PURPLE, hand: [ID, V.c1, V.c2], deck: [BLUE, BLUE, V.c3] },
      {},
      3,
    );
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.min).toBe(2);
    expect(d.max).toBe(2);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(names(g, 'p1', 'trash').sort()).toEqual([V.c1, V.c2].sort());
    expect(names(g, 'p1', 'hand').sort()).toEqual([BLUE, BLUE].sort());
  });

  it('the trash is mandatory and the drawn cards are candidates', () => {
    const g = mine({ leader: PLAIN_PURPLE, hand: [ID], deck: [V.c4, V.c5, BLUE] }, {}, 3);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c4), g.find('p1', 'hand', V.c5)]);
    expect(names(g, 'p1', 'hand')).toEqual([]);
    expect(names(g, 'p1', 'trash').sort()).toEqual([V.c4, V.c5].sort());
  });

  it('has printed [Blocker]: it can block', () => {
    const g = theirs({ leader: PLAIN_PURPLE, characters: [ID] }, { characters: [V.c7] });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });

  it('draws 2 from the deck top (deck shrinks by 2)', () => {
    const g = mine(
      { leader: PLAIN_PURPLE, hand: [ID, V.c1, V.c2], deck: [BLUE, BLUE, V.c3, V.c3] },
      {},
      3,
    );
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });
});
