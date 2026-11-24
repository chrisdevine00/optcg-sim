/** OP17-099 Charlotte Linlin (Leader). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  option,
  pick,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';

const ID = 'OP17-099';
const attack = (p1Hand: string[], p2Hand: string[]) => {
  const g = game(
    { leader: ID, hand: p1Hand, deck: [V.c1, V.c2, V.c3], life: [V.c5, V.c5] },
    { leader: PLAIN_BLUE, hand: p2Hand },
  );
  g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
  return g;
};

describe('OP17-099 Charlotte Linlin', () => {
  it('[When Attacking] trash 1 card: your opponent chooses; mode 1 trashes 1 more of your cards and adds the top deck card to your Life', () => {
    const g = attack([BLUE, PURPLE, V.c4], [V.c7]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expectDecision(g, 'choose', 'p2'); // the opponent picks the mode
    option(g, '0');
    pick(g, [g.find('p1', 'hand', PURPLE)]); // you pick the card to trash
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(trash(g, 'p1').sort()).toEqual([BLUE, PURPLE].sort());
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c1);
    expect(hand(g, 'p2')).toEqual([V.c7]);
  });

  it('mode 1: "up to 1" lets you keep the deck card out of your Life', () => {
    const g = attack([BLUE, PURPLE], []);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    option(g, '0');
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    decline(g);
    expect(g.life('p1')).toBe(2);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('mode 1 with an empty hand after the cost: nothing to trash, the Life card is still added (Then is not If you do)', () => {
    const g = attack([BLUE], []);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    option(g, '0');
    accept(g);
    expect(g.life('p1')).toBe(3);
    expect(trash(g, 'p1')).toEqual([BLUE]);
  });

  it("mode 2 trashes 1 card from your opponent's hand, picked by you face-down; your Life is unchanged", () => {
    const g = attack([BLUE, PURPLE], [V.c6, V.c7]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    option(g, '1');
    expect(trash(g, 'p2')).toHaveLength(1);
    expect(hand(g, 'p2')).toHaveLength(1);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(g.life('p1')).toBe(2);
  });

  it('declining the optional cost: nothing is trashed and the opponent chooses nothing', () => {
    const g = attack([BLUE, PURPLE], [V.c6]);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(hand(g, 'p2')).toEqual([V.c6]);
    expect(g.life('p1')).toBe(2);
  });
});
