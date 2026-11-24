/** OP17-043 Ganzui. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import {
  accept,
  BLUE,
  decline,
  dec,
  endCounter,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';

const ID = 'OP17-043';
const rested = (card: string) => ({ card, rested: true });

describe('OP17-043 Ganzui', () => {
  /** p1 owns a rested Ganzui and `hand`; p2's 9000 Character can attack it. */
  const board = (handCards: string[]) =>
    game(
      { leader: PLAIN_BLUE, characters: [rested(ID)], hand: handCards },
      { leader: PLAIN_PURPLE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
  const ganzui = (g: ReturnType<typeof board>) => g.find('p1', 'characters', ID);
  const battle = (g: ReturnType<typeof board>) => {
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: ganzui(g) });
    passBlock(g);
    endCounter(g);
  };

  it('a battle K.O.: you may trash 2 cards from your hand instead, and Ganzui stays', () => {
    const g = board([V.c1, V.c2, V.c3]);
    battle(g);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(hand(g, 'p1')).toEqual([V.c3]);
  });

  it("declining lets it be K.O.'d and keeps the hand", () => {
    const g = board([V.c1, V.c2]);
    battle(g);
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('no qualifier: your own effect removing it is replaced too', () => {
    const g = board([V.c1, V.c2]);
    g.state = applyOp(g.state, { op: 'ko', card: ganzui(g), by: 'p1' }).state;
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('is not offered with fewer than 2 cards in hand', () => {
    const g = board([V.c1]);
    battle(g);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it("[On Play]: your Leader's base power becomes 6000 until the end of your opponent's next End Phase", () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [ID], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_PURPLE },
    );
    const leader = g.leader('p1');
    expect(g.power(leader)).toBe(5000);
    play(g, ID);
    expect(g.power(leader)).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(g.power(leader)).toBe(6000); // still through the opponent's turn
    void BLUE;
  });
});
