/** OP12-108 Donquixote Rosinante. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { LAW5, orderAll, ROSI } from './helpers-hancock-rosi.ts';

describe('OP12-108 Donquixote Rosinante', () => {
  const deck = [V.c1, LAW5, 'EB04-038', PURPLE, BLUE, BLUE];
  const start = () => {
    const g = game(
      { leader: ROSI, hand: ['OP12-108'], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP12-108');
    return g;
  };

  it('[On Play] reveals up to 1 [Trafalgar Law], the rest go to the bottom', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', LAW5)]);
    expect(hand(g, 'p1')).toEqual([LAW5]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(LAW5);
    orderAll(g);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(BLUE);
  });

  it('offers EB04-038 Rosinante & Law, which is also named [Trafalgar Law] (rules.alsoNamed)', () => {
    const g = start();
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', 'EB04-038')]);
    expect(hand(g, 'p1')).toEqual(['EB04-038']);
  });

  it('may take nothing', () => {
    const g = start();
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
  });
});
