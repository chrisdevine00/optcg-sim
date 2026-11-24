/** EB04-044 Koby (cost 6). */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, hand, pick, trash, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { koBy } from './helpers-w3s.ts';
import { cardsIn, finishBattle, mk, NAVY_LEADER } from './helpers-w4sb.ts';

const ID = 'EB04-044';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const bounce = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
    to: { zone: 'hand' },
  },
};

/** p2's turn: p1 has Koby and a plain Character; p2 runs `action` on Koby. */
const byOpponent = (action: Record<string, unknown>, p1 = {}) => {
  const g = mk(
    { leader: NAVY_LEADER, characters: [ID, V.c4], hand: [V.c1, V.c2], ...p1 },
    {},
    { turn: 4, activePlayer: 'p2' },
  );
  plantOpponentEffect(g, action);
  pick(g, [g.find('p1', 'characters', ID)]);
  return g;
};

describe('EB04-044 Koby', () => {
  it('with a {Navy} Leader: instead of being K.O.’d by an effect, trash 1 card from hand', () => {
    const g = byOpponent(koOne);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(cardsIn(g, 'p1', 'characters')).toContain(ID);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('covers any removal: a return to the hand as well', () => {
    const g = byOpponent(bounce);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(cardsIn(g, 'p1', 'characters')).toContain(ID);
  });

  it('may be declined: Koby is K.O.’d and the hand is untouched', () => {
    const g = byOpponent(koOne);
    decline(g);
    expect(cardsIn(g, 'p1', 'characters')).not.toContain(ID);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
  });

  it('also covers a K.O. in battle', () => {
    const g = mk(
      {
        leader: NAVY_LEADER,
        characters: [{ card: ID, rested: true }],
        hand: [V.c1],
      },
      { characters: ['P-041'] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', 'P-041'),
      target: g.find('p1', 'characters', ID),
    });
    finishBattle(g);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('must not apply with a Leader that is not {Navy}', () => {
    const g = byOpponent(koOne, { leader: 'ST01-001' });
    expect(dec(g)?.kind).not.toBe('optional');
    expect(cardsIn(g, 'p1', 'characters')).not.toContain(ID);
  });

  it('with an empty hand the cost cannot be paid: only declining is legal, and Koby is K.O.’d', () => {
    const g = byOpponent(koOne, { hand: [] });
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(cardsIn(g, 'p1', 'characters')).not.toContain(ID);
  });

  it('is Once Per Turn: the second removal of the turn is not replaced', () => {
    const g = byOpponent(koOne);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(cardsIn(g, 'p1', 'characters')).toContain(ID);
    koBy(g, 'p1', ID, 'p2');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(cardsIn(g, 'p1', 'characters')).not.toContain(ID);
    // The control: the same removal on a fresh turn-start position is offered.
    const h = mk(
      { leader: NAVY_LEADER, characters: [ID], hand: [V.c1] },
      {},
      { turn: 4, activePlayer: 'p2' },
    );
    koBy(h, 'p1', ID, 'p2');
    expectDecision(h, 'optional', 'p1');
  });

  it('[Your Turn] [Once Per Turn]: when your opponent’s Character is K.O.’d, draw 1', () => {
    const g = mk(
      { leader: NAVY_LEADER, characters: [ID], deck: [V.c5, V.c6] },
      { characters: [V.c4, V.c3] },
    );
    koBy(g, 'p2', V.c4, 'p1');
    expect(hand(g, 'p1')).toEqual([V.c5]);
    koBy(g, 'p2', V.c3, 'p1');
    expect(hand(g, 'p1')).toEqual([V.c5]); // once per turn
  });

  it('the draw must not fire on the opponent’s turn nor for your own Character', () => {
    const g = mk(
      { leader: NAVY_LEADER, characters: [ID, V.c4], deck: [V.c5] },
      { characters: [V.c3] },
    );
    koBy(g, 'p1', V.c4, 'p1');
    expect(hand(g, 'p1')).toEqual([]);
    const h = mk(
      { leader: NAVY_LEADER, characters: [ID], deck: [V.c5] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    koBy(h, 'p2', V.c3, 'p2');
    expect(hand(h, 'p1')).toEqual([]);
  });
});
