/**
 * OP12-040 Kuzan (Leader, Blue, 5000, 5 Life, {Navy}).
 *
 * Card text: "When a card is trashed from your hand by your "Navy" type card's effect, draw cards
 * equal to the number of cards trashed."
 *
 * Rules: a card trashed as a cost is part of the effect (lead decision, M6b-Q31: "a card trashed
 * as a cost counts as trashed from your hand by an effect"). The trigger is mandatory (CR 8-1-2).
 * How an effect with two trash steps counts (M6b-Q46) is open: these tests use one trash step.
 * Only Navy cards owned by me count; a trash from another zone does not.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  cast,
  chars,
  deck,
  hand,
  LB,
  mine,
  need,
  endTail,
  kind,
  payHand,
  pickCards,
  SB,
  theirs,
  trash,
  yes,
} from './kit-op12b.ts';

const ZEPHYR = 'OP12-046';
const TOP = [SB.marco, SB.kingdew, SB.thatch, SB.hajrudin, SB.oars];
const rest = (n: number) => Array.from({ length: n }, () => SB.mohji);

describe('OP12-040 Kuzan: draw as many as were trashed from hand by my Navy card', () => {
  it('Hibari (Navy) trashes 2 from hand: I draw 2 (3 drawn by Hibari first)', () => {
    const g = mine(LB.kuzan, {
      hand: [SB.hibari, SB.sai, SB.mohji, SB.mohji],
      deck: [...TOP, ...rest(10)],
    });
    cast(g, SB.hibari);
    pickCards(g, [SB.sai, SB.mohji]);
    endTail(g);
    expect(trash(g)).toEqual([SB.mohji, SB.sai].sort());
    // 3 start cards + 3 drawn by Hibari - 2 trashed + 2 drawn by Kuzan
    expect(hand(g)).toHaveLength(6);
    expect(deck(g)).toHaveLength(15 - 5);
    expect(hand(g)).toContain(SB.marco);
    expect(hand(g)).toContain(SB.kingdew);
    expect(hand(g)).toContain(SB.thatch);
    expect(hand(g)).toContain(SB.hajrudin);
  });

  it('draws exactly the number trashed: a Navy [On Play] that trashes 2 from a 2-card hand draws 2', () => {
    const g = mine(LB.kuzan, { hand: [ZEPHYR, SB.sai, SB.marco], deck: [...TOP, ...rest(10)] });
    cast(g, ZEPHYR);
    pickCards(g, [SB.sai, SB.marco]);
    expect(trash(g)).toEqual([SB.marco, SB.sai].sort());
    expect(hand(g)).toEqual([SB.marco, SB.kingdew].sort());
    expect(deck(g)).toHaveLength(13);
  });

  it('boundary: only 1 card to trash (hand of 1) trashes 1 and draws 1, not 2', () => {
    const g = mine(LB.kuzan, { hand: [ZEPHYR, SB.sai], deck: [...TOP, ...rest(10)] });
    cast(g, ZEPHYR);
    pickCards(g, [SB.sai]);
    expect(trash(g)).toEqual([SB.sai]);
    expect(hand(g)).toEqual([SB.marco]);
  });

  it('a card trashed as the cost of my Navy Character counts: Koby pays 1, I draw 1 for it and 1 from Koby', () => {
    const g = mine(LB.kuzan, {
      hand: [SB.kobyDraw, SB.sai],
      deck: [...TOP, ...rest(10)],
    });
    cast(g, SB.kobyDraw);
    yes(g, 'p1');
    payHand(g, [SB.sai]);
    expect(trash(g)).toEqual([SB.sai]);
    expect(chars(g)).toEqual([SB.kobyDraw]);
    expect(hand(g).sort()).toEqual([SB.marco, SB.kingdew].sort());
  });

  it('declining the optional trash of the Navy card: nothing trashed, nothing drawn', () => {
    const g = mine(LB.kuzan, { hand: [SB.kobyDraw, SB.sai], deck: [...TOP, ...rest(10)] });
    cast(g, SB.kobyDraw);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([SB.sai]);
    expect(deck(g)).toHaveLength(15);
  });

  it('must not: a card that is not a Navy card trashes 1 from my hand (Coribou): no draw', () => {
    const g = mine(LB.kuzan, { hand: [SB.coribou, SB.sai], deck: [...TOP, ...rest(10)] });
    cast(g, SB.coribou);
    pickCards(g, [SB.sai]);
    expect(trash(g)).toEqual([SB.sai]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('must not: the opponent trashing from their own hand with their Navy card does not draw me cards', () => {
    const g = theirs(
      LB.kuzan,
      { deck: [...TOP, ...rest(10)] },
      { hand: [ZEPHYR, SB.sai, SB.marco] },
    );
    cast(g, ZEPHYR);
    pickCards(g, [SB.sai, SB.marco]);
    expect(trash(g, 'p2')).toEqual([SB.marco, SB.sai].sort());
    expect(hand(g, 'p1')).toEqual([]);
    expect(deck(g, 'p1')).toHaveLength(15);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it("belongs to its owner: with Kuzan as the OPPONENT's Leader, their own Navy trash draws for them on their turn", () => {
    const g = theirs(
      LB.luffy,
      { deck: [...TOP, ...rest(10)] },
      { hand: [ZEPHYR, SB.sai, SB.marco], deck: [SB.kingdew, SB.thatch, ...rest(13)] },
      LB.kuzan,
    );
    cast(g, ZEPHYR);
    pickCards(g, [SB.sai, SB.marco]);
    expect(hand(g, 'p2')).toEqual([SB.kingdew, SB.thatch].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('must not: a Navy card trashing itself from the field is not a card trashed from hand (Zephyr [Activate: Main])', () => {
    const g = mine(LB.kuzan, {
      hand: [SB.sai],
      characters: [ZEPHYR],
      deck: [...TOP, ...rest(10)],
    });
    const z = g.find('p1', 'characters', ZEPHYR);
    act(g, {
      type: 'activate',
      card: z,
      ability: g
        .legal()
        .flatMap((a) => (a.type === 'activate' && a.card === z ? [a.ability] : []))[0]!,
    });
    // The cost "trash this Character" may be asked as a "you may" and the target pick may be empty.
    if (kind(g) === 'optional') yes(g, 'p1');
    endTail(g);
    expect(trash(g)).toContain(ZEPHYR);
    expect(hand(g)).toEqual([SB.sai]);
    expect(deck(g)).toHaveLength(15);
  });

  it('must not: without the Kuzan Leader the same Hibari trash draws nothing extra', () => {
    const g = mine(LB.navy, {
      hand: [SB.hibari, SB.sai, SB.mohji, SB.mohji],
      deck: [...TOP, ...rest(10)],
    });
    cast(g, SB.hibari);
    pickCards(g, [SB.sai, SB.mohji]);
    endTail(g);
    // 3 + 3 drawn - 2 trashed, and no Kuzan draw
    expect(hand(g)).toHaveLength(4);
    expect(deck(g)).toHaveLength(12);
  });
});
