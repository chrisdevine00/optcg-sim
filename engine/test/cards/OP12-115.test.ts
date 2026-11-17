/** OP12-115 I Love You!! */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  pick,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { LAW5, ROSI } from './helpers-hancock-rosi.ts';

describe('OP12-115 I Love You!!', () => {
  /** p2 attacks p1's Leader; p1 is at the Counter Step with the Event in hand. */
  const counter = (life: number, trash: string[] = [LAW5, V.c1]) => {
    const g = game(
      {
        leader: ROSI,
        hand: ['OP12-115'],
        life: Array.from({ length: life }, () => PURPLE),
        trash,
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP12-115'), ability: 'counter' });
    return g;
  };

  it('[Counter] gives +2000 power during this battle', () => {
    const g = counter(3);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expectDecision(g, 'counter', 'p1');
  });

  it('with 2 or less Life, also adds a [Trafalgar Law] from the trash to hand', () => {
    const g = counter(2);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p1', 'trash', LAW5)]);
    expect(hand(g, 'p1')).toEqual([LAW5]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g);
  });

  it('with 3 Life nothing is added (the "Then, if" is checked after the power)', () => {
    const g = counter(3);
    pick(g, [g.leader('p1')]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(LAW5);
  });

  it('adding the Law is optional ("up to 1")', () => {
    const g = counter(1);
    pick(g, [g.leader('p1')]);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with no Law in the trash only the power applies', () => {
    const g = counter(2, [V.c1]);
    pick(g, [g.leader('p1')]);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'counter', 'p1');
  });
});
