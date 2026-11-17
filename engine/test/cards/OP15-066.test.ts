/** OP15-066 Satori. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  option,
  payDon,
  play,
  PURPLE,
  V,
} from './helpers.ts';
import { drainOrders, ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP15-066 Satori', () => {
  it('[On Play] DON!! -1: draws 1 card', () => {
    const g = game(
      { leader: ENEL, hand: ['OP15-066'], costArea: { active: 3, rested: 0 }, donDeck: 3 },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP15-066');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(don(g, 'p1').deck).toBe(4);
  });

  it('[On Play] may be declined: no draw', () => {
    const g = game(
      { leader: ENEL, hand: ['OP15-066'], costArea: { active: 3, rested: 0 }, donDeck: 3 },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP15-066');
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  const attack = (leader: string, active: number, donDeck?: number) => {
    const g = game(
      {
        leader,
        characters: ['OP15-066'],
        deck: [V.c1, V.c2, PURPLE, BLUE],
        costArea: { active, rested: 0 },
        ...(donDeck === undefined ? {} : { donDeck }),
      },
      { leader: PLAIN_BLUE },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', 'OP15-066'),
      target: g.leader('p2'),
    });
    return g;
  };

  it('[When Attacking] with 6 or less DON!!: looks at 2 and places both on the top or both on the bottom', () => {
    const g = attack(ENEL, 6, 0);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    option(g, 'bottom');
    drainOrders(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([PURPLE, BLUE]);
    expect(deck.slice(2).sort()).toEqual([V.c1, V.c2].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[When Attacking] with 7 or more DON!! nothing happens', () => {
    const g = attack('ST05-001', 7);
    expectDecision(g, 'block', 'p2');
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c1, V.c2, PURPLE, BLUE]);
  });
});
