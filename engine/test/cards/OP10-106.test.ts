/** OP10-106 Killer. */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  dec,
  expectDecision,
  finishOrder,
  hand,
  idsOf,
  KID2,
  koBy,
  koedInBattle,
  mk,
  none,
  OTHER_LEADER,
  pick,
  SUPER5,
  SUPER6,
  SUPER_LEADER,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-106';
const DECK = [V.c1, SUPER5, KID2, SUPER6, V.c2]; // the 4th card (SUPER6) is not looked at... top 3 are V.c1, SUPER5, KID2
const start = (leader = SUPER_LEADER) => mk({ leader, characters: [ID], deck: DECK });

describe('OP10-106 Killer', () => {
  it('[On K.O.] with a Supernovas Leader: look at 3, add a Supernovas or Kid Pirates card, the rest go to the bottom', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', SUPER5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', KID2))).toBe(true); // Kid Pirates, not Supernovas
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', SUPER6))).toBe(false); // 4th card: not looked at
    pick(g, [g.find('p1', 'deck', SUPER5)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SUPER5]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck.slice(0, 2)).toEqual([SUPER6, V.c2]);
    expect([...deck.slice(2)].sort()).toEqual([V.c1, KID2].sort());
  });

  it("works when it is K.O.'d in battle", () => {
    const g = koedInBattle(ID, { leader: SUPER_LEADER, deck: DECK });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', KID2)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([KID2]);
  });

  it('"up to 1": may take nothing; all 3 cards go to the bottom', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck.slice(0, 2)).toEqual([SUPER6, V.c2]);
    expect(deck).toHaveLength(5);
  });

  it('with none of the looked-at cards matching, all 3 still go to the bottom', () => {
    const g = mk({
      leader: SUPER_LEADER,
      characters: [ID],
      deck: [V.c1, V.c2, V.c3, SUPER5],
    });
    koBy(g, 'p1', ID, 'p2');
    if (dec(g)?.kind === 'choose') none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(SUPER5);
  });

  it('must not fire without a Supernovas Leader', () => {
    const g = start(OTHER_LEADER);
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'deck')).toEqual(DECK);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
