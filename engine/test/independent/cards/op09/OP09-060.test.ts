/**
 * OP09-060 Emptee Bluffs Island (Stage, Blue, cost 1, {Cross Guild}).
 *
 * Card text: "[Activate: Main] You may place 2 cards from your hand at the bottom of your deck in any
 * order and rest this Stage: If your Leader has the "Cross Guild" type, draw 2 cards."
 *
 * Rules: CR 8-3-1 (costs are paid before the effect; the "If" after the colon is an effect condition,
 * so the cost is spent even when the Leader has no such type), an optional hand cost is offered even
 * when unpayable.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  C9,
  deck,
  hand,
  L9,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  offeredUnpayable,
  payHand,
  reachablePickSets,
  settleOrders,
  tail,
  toMyNextMain,
  trash,
  useAbility,
} from './kit-op09d.ts';

const ID = 'OP09-060';
const TOP = [C9.c5, C9.c6, C9.c7];

function start(o: { hand?: string[]; leader?: string; rested?: boolean; deck?: string[] } = {}) {
  return mine(o.leader ?? L9.cg, {
    stage: { card: ID, rested: o.rested ?? false },
    hand: o.hand ?? [C9.c2, C9.c3, C9.c4],
    deck: o.deck ?? [...TOP, ...Array(9).fill(BLUE)],
  });
}

function pay(g: ReturnType<typeof start>, cards: string[]) {
  useAbility(g, g.find('p1', 'stage', ID));
  payHand(g, cards);
  settleOrders(g);
}

describe('OP09-060 Emptee Bluffs Island: [Activate: Main] place 2 from hand at the bottom, rest: if Cross Guild Leader, draw 2', () => {
  it('printed effect: 2 hand cards go to the bottom, the Stage rests, then exactly 2 cards are drawn from the top', () => {
    const g = start();
    pay(g, [C9.c2, C9.c3]);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expect(hand(g)).toEqual([C9.c4, C9.c5, C9.c6].sort());
    expect(deck(g)).toHaveLength(12 - 2 + 2);
    expect(deck(g)[0]).toBe(C9.c7);
    expect(tail(deck(g), 2)).toEqual([C9.c2, C9.c3].sort());
    expect(trash(g)).toEqual([]);
  });

  it('the cards are placed at the bottom of the DECK, not the trash, and are not drawn back by the same effect', () => {
    const g = start({ hand: [C9.c2, C9.c3], deck: [C9.c5, ...Array(9).fill(BLUE)] });
    pay(g, [C9.c2, C9.c3]);
    expect(hand(g)).toEqual([BLUE, C9.c5].sort());
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
  });

  it('the cost is exactly 2 hand cards: any two of the hand are offered, the choice is mine', () => {
    const g = start({ hand: [C9.c2, C9.c3, C9.c4] });
    useAbility(g, g.find('p1', 'stage', ID));
    need(g, 'choose', 'p1');
    // Picks are made in canonical order, so the first pick lists only the cards that can start a
    // pair; the reachable selections show every pair and nothing else.
    const pairs = [...reachablePickSets(g)].filter(Boolean).sort();
    expect(pairs).toEqual(
      [
        [C9.c2, C9.c3],
        [C9.c2, C9.c4],
        [C9.c3, C9.c4],
      ]
        .map((p) => p.sort().join('+'))
        .sort(),
    );
    expect(
      offeredIds(g).every((c) => ([C9.c2, C9.c3, C9.c4] as string[]).includes(c as string)),
    ).toBe(true);
  });

  it('a Leader without {Cross Guild}: the cost is still paid and the Stage rests, but nothing is drawn', () => {
    const g = start({ leader: L9.neutral });
    pay(g, [C9.c2, C9.c3]);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expect(hand(g)).toEqual([C9.c4]);
    expect(tail(deck(g), 2)).toEqual([C9.c2, C9.c3].sort());
    expect(deck(g)[0]).toBe(C9.c5);
    expect(deck(g)).toHaveLength(14);
  });

  it('boundary: exactly 2 cards in hand pay the cost, leaving an empty hand, and then 2 are drawn', () => {
    const g = start({ hand: [C9.c2, C9.c3] });
    pay(g, [C9.c2, C9.c3]);
    expect(hand(g)).toEqual([C9.c5, C9.c6].sort());
  });

  it('boundary: 1 card in hand cannot pay (the cost needs 2): nothing is placed, nothing is drawn, the Stage stays active', () => {
    const g = start({ hand: [C9.c2] });
    const [ability] = offeredAbilities(g, g.find('p1', 'stage', ID));
    if (ability) {
      g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability });
      offeredUnpayable(g, 'p1');
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C9.c2]);
    expect(deck(g)).toHaveLength(12);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
  });

  it('an empty hand cannot pay either', () => {
    const g = start({ hand: [] });
    const [ability] = offeredAbilities(g, g.find('p1', 'stage', ID));
    if (ability) {
      g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability });
      offeredUnpayable(g, 'p1');
    }
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(12);
  });

  it('a rested Stage cannot be activated', () => {
    const g = start({ rested: true });
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toEqual([]);
  });

  it('draw 2 with a short deck: the cost cards were placed first, so they are drawable when the deck has fewer than 2 cards', () => {
    const g = start({ hand: [C9.c2, C9.c3], deck: [C9.c5] });
    pay(g, [C9.c2, C9.c3]);
    // Deck was [c5]; after placing: [c5, c2, c3]. Drawing 2 takes c5 then one placed card.
    expect(hand(g)).toHaveLength(2);
    expect(hand(g)).toContain(C9.c5);
    expect(deck(g)).toHaveLength(1);
  });

  it('once per use: the rested Stage is offered again only after it becomes active on a later turn', () => {
    const g = start();
    pay(g, [C9.c2, C9.c3]);
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toHaveLength(1);
  });
});
