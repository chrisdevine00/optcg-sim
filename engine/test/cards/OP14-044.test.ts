/** OP14-044 Edward.Newgate. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { FM_LEADER, mine, WB4 } from './helpers-op14g2.ts';

const ID = 'OP14-044';

const start = (deck: string[], handCards: string[] = [V.c1]) =>
  mine(FM_LEADER, { hand: [ID, ...handCards], deck, costArea: { active: 8, rested: 0 } });

describe('OP14-044 Edward.Newgate', () => {
  it('[On Play]: a revealed {Whitebeard Pirates} card: draw 2 (the revealed card first) and trash 1', () => {
    const g = start([WB4, V.c2, V.c3, BLUE]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1'); // trash 1 from hand
    expect(hand(g, 'p1')).toHaveLength(3); // V.c1 + the 2 drawn
    pick(g, [g.find('p1', 'hand', WB4)]);
    expect(trash(g, 'p1')).toEqual([WB4]);
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c3);
  });

  it('[On Play]: a revealed card that is not {Whitebeard Pirates}: nothing is drawn or trashed, it stays on top', () => {
    const g = start([V.c4, WB4, BLUE]);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c4);
    expect(trash(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it('the type only has to include the text: a {Fish-Man} / {Whitebeard Pirates} card counts', () => {
    const g = start(['OP03-007', V.c2, V.c3, BLUE]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
  });

  it('[Blocker]: it can block an attack on your Leader', () => {
    const g = mine(
      FM_LEADER,
      { characters: [ID] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
  });
});
