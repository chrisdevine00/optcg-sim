/** OP09-057 Cross Guild (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  canPick,
  CG5,
  CG6,
  damageGame,
  expectDecision,
  finishOrder,
  hand,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  times,
  trash,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-057';

describe('OP09-057 Cross Guild: [Main]', () => {
  // Top 4: a Cross Guild Character, another copy of this card, a non-Cross Guild card, a Cross Guild Character.
  const top4 = [CG5, ID, V.c1, CG6];
  const start = (deck = [...top4, ...times(5, BLUE)]) => mk({ hand: [ID], deck });

  it('reveals up to 1 Cross Guild card from the top 4 into your hand; the rest go to the bottom', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', CG5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', CG6))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false); // another type
    pick(g, [g.find('p1', 'deck', CG6)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([CG6]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck).toHaveLength(8);
    expect(deck.slice(5).sort()).toEqual([CG5, ID, V.c1].sort());
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('another [Cross Guild] (this card included) is a legal pick: no "other than" in the text', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(true);
    pick(g, [g.find('p1', 'deck', ID)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([ID]);
  });

  it('"up to 1": may take nothing; all 4 go to the bottom', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck').slice(5).sort()).toEqual([...top4].sort());
  });

  it('boundary: the 5th card is not looked at', () => {
    const g = start([V.c1, V.c1, V.c1, V.c1, CG5, ...times(4, BLUE)]);
    play(g, ID);
    // The choice is still asked (a hidden top must not show "no match"), at max 0.
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(CG5); // not looked at: still on top
  });
});

describe('OP09-057 Cross Guild: [Trigger]', () => {
  it("activates this card's [Main] effect", () => {
    const g = damageGame(ID, {
      leader: OTHER_LEADER,
      deck: [V.c1, CG5, V.c2, V.c3, ...times(5, BLUE)],
    });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', CG5)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([CG5]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('declining the [Trigger] does not look at the deck', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER, deck: [CG5, ...times(5, BLUE)] });
    g.act({ type: 'trigger', activate: false });
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(CG5);
    expect(hand(g, 'p1')).toEqual([ID]);
  });
});
