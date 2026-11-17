/** OP15-061 Ohm. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  payDon,
  pick,
  play,
  V,
} from './helpers.ts';
import { ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP15-061 Ohm', () => {
  it('[On Play] DON!! -1: draws 1 card', () => {
    const g = game(
      { leader: ENEL, hand: ['OP15-061'], costArea: { active: 3, rested: 0 }, donDeck: 3 },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP15-061');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(don(g, 'p1').deck).toBe(4);
  });

  it('[On Play] may be declined: no draw', () => {
    const g = game(
      { leader: ENEL, hand: ['OP15-061'], costArea: { active: 3, rested: 0 }, donDeck: 3 },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP15-061');
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  const attack = (active: number, rested = 0) => {
    const g = game(
      {
        leader: ENEL,
        characters: ['OP15-061'],
        costArea: { active, rested },
        donDeck: 6 - active - rested,
      },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', 'OP15-061'),
      target: g.leader('p2'),
    });
    return g;
  };

  it("[When Attacking] with 6 or less DON!!: gives up to 1 of the opponent's Characters -1000 power", () => {
    const g = attack(6);
    expectDecision(g, 'choose', 'p1');
    const c3 = g.find('p2', 'characters', V.c3);
    pick(g, [c3]);
    expect(g.power(c3)).toBe(4000);
  });
});

describe('OP15-061 Ohm: the DON!! condition', () => {
  it('[When Attacking] with 7 DON!! on the field nothing happens', () => {
    // Enel's DON!! deck has 6 cards, so 7 DON!! need a Leader with the usual 10: a vanilla Leader.
    const g = game(
      { leader: 'ST05-001', characters: ['OP15-061'], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', 'OP15-061'),
      target: g.leader('p2'),
    });
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expectDecision(g, 'block', 'p2');
  });

  it('DON!! given count as on your field (6 in all is still "6 or less")', () => {
    const g = game(
      {
        leader: 'ST05-001',
        characters: [{ card: 'OP15-061', don: 2 }],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', 'OP15-061'),
      target: g.leader('p2'),
    });
    expectDecision(g, 'choose', 'p1');
  });
});
