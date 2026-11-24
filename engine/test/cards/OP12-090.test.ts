/** OP12-090 Belo Betty. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, trash, V } from './helpers.ts';
import { cardsIn, mk } from './helpers-op12g3.ts';

const ID = 'OP12-090';

const start = (deck: string[]) => mk({ characters: [ID], deck }, { characters: [V.c4, V.c1] });

const attack = (g: ReturnType<typeof start>) =>
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

describe('OP12-090 Belo Betty', () => {
  it('[When Attacking] trash 2 from the top of the deck: up to 1 opposing Character gets -2 cost this turn', () => {
    const g = start([V.c1, V.c2, V.c3, V.c4]);
    attack(g);
    accept(g);
    expect(trash(g, 'p1')).toEqual([V.c2, V.c1]);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c3, V.c4]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(2);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(1);
  });

  it('declining leaves the deck and the costs alone', () => {
    const g = start([V.c1, V.c2, V.c3]);
    attack(g);
    decline(g);
    expect(trash(g, 'p1')).toHaveLength(0);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(4);
    expectDecision(g, 'block', 'p2');
  });

  it('"up to 1": after the cost is paid the target may be skipped', () => {
    const g = start([V.c1, V.c2, V.c3]);
    attack(g);
    accept(g);
    none(g);
    expect(trash(g, 'p1')).toHaveLength(2);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(4);
  });

  it('a cost of 1 lowered by 2 reads as 0 (it does not go negative)', () => {
    const g = start([V.c1, V.c2, V.c3]);
    attack(g);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(0);
  });

  it('boundary: with fewer than 2 cards in the deck the cost cannot be paid and nothing is offered', () => {
    const g = start([V.c1]);
    attack(g);
    expectDecision(g, 'block', 'p2');
    expect(trash(g, 'p1')).toHaveLength(0);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(4);
  });
});
