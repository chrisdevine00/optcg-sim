/** OP09-050 Nami. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, V } from './helpers.ts';
import {
  BLACK_EVENT,
  BLUE_C1,
  BLUE_EVENT,
  canPick,
  mk,
  RED_EVENT,
  settle,
} from './helpers-a09g2.ts';

const ID = 'OP09-050';
const attack = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

describe('OP09-050 Nami', () => {
  it('[When Attacking]: adds a blue Event to your hand; the other 4 go to the bottom in any order', () => {
    const g = mk({ characters: [ID], deck: [V.c1, BLUE_EVENT, V.c2, V.c3, V.c4, V.c5, V.c6] });
    attack(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', BLUE_EVENT)]);
    expect(hand(g, 'p1')).toEqual([BLUE_EVENT]);
    settle(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([V.c5, V.c6]);
    expect(deck.slice(2).sort()).toEqual([V.c1, V.c2, V.c3, V.c4].sort());
  });

  it('only a blue Event is selectable: not a non-blue Event, not a blue Character', () => {
    const g = mk({ characters: [ID], deck: [RED_EVENT, BLACK_EVENT, BLUE_C1, BLUE_EVENT, V.c1] });
    attack(g);
    expect(canPick(g, g.find('p1', 'deck', BLUE_EVENT))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', RED_EVENT))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', BLACK_EVENT))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', BLUE_C1))).toBe(false);
  });

  it('"up to 1": two blue Events cannot both be taken', () => {
    const g = mk({
      characters: [ID],
      deck: [BLUE_EVENT, BLUE_EVENT, V.c1, V.c2, V.c3, V.c4],
    });
    attack(g);
    expect(() =>
      pick(g, [g.find('p1', 'deck', BLUE_EVENT, 0), g.find('p1', 'deck', BLUE_EVENT, 1)]),
    ).toThrow(/can be picked now/);
    expect(hand(g, 'p1')).toEqual([BLUE_EVENT]);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = mk({ characters: [ID], deck: [BLUE_EVENT, V.c1, V.c2, V.c3, V.c4, V.c5] });
    attack(g);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c5);
  });

  it('looks only at the top 5: a blue Event in 6th place is not offered', () => {
    const g = mk({ characters: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, BLUE_EVENT] });
    attack(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('does not trigger when it is not attacking (no attack, no look)', () => {
    const g = mk({ characters: [ID], deck: [BLUE_EVENT, V.c1, V.c2, V.c3, V.c4, V.c5] });
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'deck')[0]!.card).toBe(BLUE_EVENT);
  });
});
