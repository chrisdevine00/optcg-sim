/**
 * EB02-045 Trafalgar Law (Black Character, cost 5, 6000, Counter +1000, {Heart Pirates}/{Supernovas}/
 * {Dressrosa}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may place 2 cards from your trash at the bottom of your deck in any
 * order: Choose one: Draw 1 card. / If your opponent has 5 or more cards in their hand, your opponent
 * trashes 1 card from their hand."
 *
 * Rules: the cost is optional ("You may") and is exactly 2 cards from the OWN trash (public). The owner
 * picks the order they go to the bottom (DECISIONS 2026-11-24, ordering). The mode is chosen after the
 * cost; the second mode needs the opponent to have 5 or more cards in hand when it resolves, and the
 * OPPONENT chooses which card they trash.
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  act,
  attack,
  blockers,
  deck,
  decision,
  hand,
  kind,
  LE,
  mine,
  mode,
  modeLabels,
  need,
  noDefence,
  no,
  payIfAsked,
  playRaw,
  SE,
  tail,
  theirs,
  trash,
  unusable,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const LAW = 'EB02-045';

/** Answer pending `order` decisions of p1 with the first listed order. */
function orders(g: ReturnType<typeof mine>) {
  for (let i = 0; i < 5 && kind(g) === 'order'; i++) {
    act(
      g,
      g.legal().find((a) => a.type === 'order')!,
    );
  }
}

/** p1 plays Law, accepts the cost and pays with `cards`, answers the order, and stops at the mode prompt. */
function toMode(o: { trash: string[]; pay: string[]; oppHand?: number; deck?: string[] }) {
  const g = mine(
    LE.luffy,
    { hand: [LAW, SE.marco], trash: o.trash, ...(o.deck ? { deck: o.deck } : {}) },
    { hand: Array(o.oppHand ?? 5).fill(SE.mohji) },
  );
  playRaw(g, LAW);
  accept(g);
  payIfAsked(g, o.pay);
  orders(g);
  return g;
}

describe('EB02-045 Trafalgar Law: printed values and [Blocker]', () => {
  it('cost 5, 6000 power, Counter +1000, [Blocker]', () => {
    const g = mine(LE.luffy, { characters: [LAW] });
    const c = ch(g, 'p1', LAW);
    expect(g.card(c).cost).toBe(5);
    expect(g.power(c)).toBe(6000);
    expect(g.card(c).counter).toBe(1000);
    expect(g.card(c).keywords).toContain('Blocker');
  });

  it('blocks an attack on the Leader', () => {
    const g = theirs(LE.luffy, { characters: [LAW] });
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([ch(g, 'p1', LAW)]);
    act(g, { type: 'block', blocker: ch(g, 'p1', LAW) });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });
});

describe('EB02-045 Trafalgar Law: [On Play] place 2 trash cards at the bottom of the deck: choose one', () => {
  it('offers both modes after the cost is paid', () => {
    const g = toMode({ trash: [SE.mohji, SE.sai], pay: [SE.mohji, SE.sai] });
    need(g, 'choose', 'p1');
    expect(modeLabels(g)).toHaveLength(2);
    expect(modeLabels(g)[0]).toMatch(/draw 1/i);
    expect(modeLabels(g)[1]).toMatch(/trashes 1/i);
  });

  it('draw mode: the 2 trash cards go to the bottom of the deck and 1 card is drawn', () => {
    const g = toMode({ trash: [SE.mohji, SE.sai], pay: [SE.mohji, SE.sai] });
    const deckBefore = deck(g).length;
    mode(g, /draw 1/i);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(deckBefore - 1);
    expect(tail(deck(g), 2)).toEqual([SE.mohji, SE.sai].sort());
    expect(hand(g)).toEqual([SE.marco, SE.mohji].sort());
  });

  it('the owner chooses the order: either order of the 2 cards can be the bottom', () => {
    const results = new Set<string>();
    for (const first of [0, 1]) {
      const g = mine(LE.luffy, { hand: [LAW], trash: [SE.sai, SE.marco] }, { hand: [] });
      playRaw(g, LAW);
      accept(g);
      payIfAsked(g, [SE.sai, SE.marco]);
      const orderActions = g.legal().filter((a) => a.type === 'order');
      expect(orderActions).toHaveLength(2);
      act(g, orderActions[first]!);
      mode(g, /draw 1/i);
      const d = deck(g);
      results.add(`${d[d.length - 2]}>${d[d.length - 1]}`);
    }
    expect(results.size).toBe(2);
  });

  it('trash mode with the opponent at 5 cards: the opponent trashes 1 card of their choice', () => {
    const g = toMode({ trash: [SE.mohji, SE.sai], pay: [SE.mohji, SE.sai], oppHand: 5 });
    mode(g, /trashes 1/i);
    const d = need(g, 'choose', 'p2');
    expect(d.player).toBe('p2');
    act(g, { type: 'pick', choice: g.zone('p2', 'hand')[0]!.instance });
    expect(g.zone('p2', 'hand')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([SE.mohji]);
    expect(hand(g)).toEqual([SE.marco]);
  });

  it('boundary: with the opponent at 4 cards the trash mode does nothing (cost still paid)', () => {
    const g = toMode({ trash: [SE.mohji, SE.sai], pay: [SE.mohji, SE.sai], oppHand: 4 });
    mode(g, /trashes 1/i);
    expect(kind(g)).toBe('main');
    expect(g.zone('p2', 'hand')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(tail(deck(g), 2)).toEqual([SE.mohji, SE.sai].sort());
  });

  it('draw mode does not make the opponent trash even with 5 or more cards', () => {
    const g = toMode({ trash: [SE.mohji, SE.sai], pay: [SE.mohji, SE.sai], oppHand: 6 });
    mode(g, /draw 1/i);
    expect(g.zone('p2', 'hand')).toHaveLength(6);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('"You may": declining the cost moves nothing and asks no mode', () => {
    const g = mine(
      LE.luffy,
      { hand: [LAW], trash: [SE.mohji, SE.sai] },
      { hand: Array(5).fill(SE.mohji) },
    );
    playRaw(g, LAW);
    no(g);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([SE.mohji, SE.sai].sort());
    expect(hand(g)).toEqual([]);
  });

  it('with 3 cards in the trash any 2 may be picked and the third stays', () => {
    const g = mine(LE.luffy, { hand: [LAW], trash: [SE.mohji, SE.sai, SE.marco] }, { hand: [] });
    playRaw(g, LAW);
    accept(g);
    payIfAsked(g, [SE.sai, SE.marco]);
    orders(g);
    mode(g, /draw 1/i);
    expect(trash(g)).toEqual([SE.mohji]);
    expect(tail(deck(g), 2)).toEqual([SE.sai, SE.marco].sort());
  });

  it('unpayable: with only 1 card in the trash the cost cannot be paid and nothing happens', () => {
    const g = mine(LE.luffy, { hand: [LAW], trash: [SE.mohji] }, { hand: Array(5).fill(SE.mohji) });
    playRaw(g, LAW);
    unusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([SE.mohji]);
    expect(g.zone('p2', 'hand')).toHaveLength(5);
  });

  it('unpayable: with an empty trash nothing happens', () => {
    const g = mine(LE.luffy, { hand: [LAW], trash: [] }, { hand: Array(5).fill(SE.mohji) });
    playRaw(g, LAW);
    unusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
    expect(decision(g)?.kind).toBe('main');
  });

  it('must not: the opponent trash cannot pay the cost', () => {
    const g = mine(LE.luffy, { hand: [LAW], trash: [SE.mohji] }, { trash: [SE.sai, SE.marco] });
    playRaw(g, LAW);
    unusable(g, 'p1');
    expect(trash(g, 'p2')).toEqual([SE.marco, SE.sai].sort());
  });
});
