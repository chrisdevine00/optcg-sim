/** OP15-118 Enel (Character). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  payDon,
  pick,
  play,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { drainOrders, ENEL, plantOpponentEffect, PLAIN_BLUE } from './helpers-rgl-penel.ts';

/** Red 10000-power vanilla (cost 8). */
const C8 = 'EB02-004';

describe('OP15-118 Enel', () => {
  const onBoard = (leader: string, active: number, extra: object = {}) =>
    game(
      {
        leader,
        characters: ['OP15-118'],
        costArea: { active, rested: 0 },
        ...(leader === ENEL ? { donDeck: 6 - active } : {}),
        ...extra,
      },
      { leader: PLAIN_BLUE, characters: [C8] },
      { turn: 4, activePlayer: 'p2' },
    );
  const onField = (g: ReturnType<typeof onBoard>) => g.zone('p1', 'characters').map((c) => c.card);
  const koIt = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

  it("with 6 or less DON!! on your field it gains +2000 power and cannot be removed by the opponent's effects", () => {
    const g = onBoard(PLAIN_PURPLE, 6);
    expect(g.power(g.find('p1', 'characters', 'OP15-118'))).toBe(10000);
    plantOpponentEffect(g, koIt);
    // The planted K.O. finds no legal target (a removal-proof Character cannot be chosen) or does nothing.
    if (g.legal().some((a) => a.type === 'pick')) pick(g, [g.find('p1', 'characters', 'OP15-118')]);
    expect(onField(g)).toEqual(['OP15-118']);
  });

  it("cannot be bounced by the opponent's effect either", () => {
    const g = onBoard(PLAIN_PURPLE, 6);
    plantOpponentEffect(g, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    if (g.legal().some((a) => a.type === 'pick')) pick(g, [g.find('p1', 'characters', 'OP15-118')]);
    expect(onField(g)).toEqual(['OP15-118']);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with 7 or more DON!! on your field it has 8000 power and can be removed', () => {
    const g = onBoard(PLAIN_PURPLE, 7);
    expect(g.power(g.find('p1', 'characters', 'OP15-118'))).toBe(8000);
    plantOpponentEffect(g, koIt);
    pick(g, [g.find('p1', 'characters', 'OP15-118')]);
    expect(onField(g)).toEqual([]);
  });

  it('given DON!! count as on the field (6 in all is still protected)', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [{ card: 'OP15-118', don: 2 }],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(g.power(g.find('p1', 'characters', 'OP15-118'))).toBe(10000);
  });

  it('is not protected from a battle K.O.', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: 'OP15-118', rested: true }] },
      { leader: PLAIN_BLUE, characters: [C8] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', C8),
      target: g.find('p1', 'characters', 'OP15-118'),
    });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    expect(g.zone('p1', 'characters')).toHaveLength(0); // 10000 vs 10000: the attacker wins ties
  });

  const play118 = (hand: string[] = []) => {
    const g = game(
      {
        leader: ENEL,
        hand: ['OP15-118', ...hand],
        deck: [PURPLE, V.c2, V.c3, V.c4, V.c5, V.c1],
        costArea: { active: 6, rested: 0 },
        donDeck: 0,
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP15-118');
    return g;
  };

  it('[On Play] DON!! -1: looks at 5, adds up to 1 to the hand, puts the rest at the bottom, then trashes 1 card from the hand', () => {
    const g = play118([BLUE]);
    accept(g);
    payDon(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', V.c3)]);
    drainOrders(g);
    // Then trash 1 from hand: the hand is [BLUE, the card just added].
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c1);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('may add nothing and still trashes 1 from the hand', () => {
    const g = play118([BLUE]);
    accept(g);
    payDon(g);
    g.act({ type: 'done' });
    drainOrders(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
  });

  it('[On Play] may be declined', () => {
    const g = play118([BLUE]);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
