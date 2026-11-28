/** OP18-105 Spandam. OP-18 wave G6. */
import { describe, expect, it } from 'vitest';
import { game, hand, pick, PLAIN_BLUE, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { CP2, CP_LEADER } from './helpers-op18-w2.ts';
import { PLAIN_PURPLE } from './helpers-op18.ts';

const ID = 'OP18-105';
/** OP18-100 Kalifa ({CP9}): its [Trigger] draws 1 and rests an opponent's Leader or Character. */
const KALIFA = 'OP18-100';
const damaged = (leader: string, handCards: string[]) => {
  const g = game(
    { leader, life: [ID], hand: handCards, deck: [V.c1, V.c2] },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  g.act({ type: 'block', blocker: null });
  g.act({ type: 'endCounter' });
  g.act({ type: 'trigger', activate: true });
  return g;
};

describe('OP18-105 Spandam', () => {
  it('[Trigger] reveals a "CP" card other than [Spandam] and runs its [Trigger]; it stays in hand', () => {
    const g = damaged(CP_LEADER, [KALIFA, ID, CP2]);
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'hand', KALIFA), g.find('p1', 'hand', CP2)].sort(),
    );
    pick(g, [g.find('p1', 'hand', KALIFA)]);
    pick(g, [g.leader('p2')]); // Kalifa's [Trigger]: draw 1, rest up to 1
    expect(hand(g, 'p1').sort()).toEqual([KALIFA, ID, CP2, V.c1].sort());
    expect(g.card(g.leader('p2')).rested).toBe(true);
  });

  it('a revealed card with no [Trigger] does nothing', () => {
    const g = damaged(CP_LEADER, [CP2]);
    pick(g, [g.find('p1', 'hand', CP2)]);
    expect(hand(g, 'p1')).toEqual([CP2]);
  });

  it('with another Leader nothing is revealed', () => {
    const g = damaged(PLAIN_PURPLE, [KALIFA]);
    expect(hand(g, 'p1')).toEqual([KALIFA]);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });
});
