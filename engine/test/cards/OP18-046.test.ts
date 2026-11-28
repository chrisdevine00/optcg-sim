/** OP18-046 Mr.0 & Ms. All Sunday. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  option,
  pick,
  trash,
} from './helpers.ts';
import { BW_L, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-046';

describe('OP18-046 Mr.0 & Ms. All Sunday', () => {
  const onPlay = () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], characters: [V.c3], costArea: { active: 9, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    return g;
  };

  it('[On Play] draws 2 and gives the Leader and every Character up to 2 rested DON!! each', () => {
    const g = onPlay();
    addMost(g, 3);
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(g.card(g.find('p1', 'characters', V.c3)).don).toBe(2);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(2);
  });

  it('"up to 2": a target may be given just 1', () => {
    const g = onPlay();
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options![1]!.id);
    addMost(g, 2);
    const total =
      g.card(g.leader('p1')).don +
      g.card(g.find('p1', 'characters', V.c3)).don +
      g.card(g.find('p1', 'characters', ID)).don;
    expect(total).toBe(5);
  });

  const attacked = (leader: string, h: string[] = [V.c1]) => {
    const g = game(
      { leader, characters: [ID], hand: h },
      { leader: PLAIN_BLUE, characters: [V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    return g;
  };

  it("[On Your Opponent's Attack] trash 1: a {Baroque Works} Leader's base power becomes 7000 this turn", () => {
    const g = attacked(BW_L);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('declining pays nothing and changes nothing', () => {
    const g = attacked(BW_L);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('a Leader without a Baroque Works type is not changed (the cost is still paid)', () => {
    const g = attacked(PLAIN_PURPLE);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });
});
