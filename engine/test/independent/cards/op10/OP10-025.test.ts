/**
 * OP10-025 Enel (Character, Green, cost 5, 6000, Counter +1000, {ODYSSEY}/{Sky Island}).
 *
 * Card text: "[On Play] If you have 2 or more rested Characters, draw 3 cards and trash 2 cards from
 * your hand."
 *
 * Rules: the "If" has no colon: an effect condition over the whole sentence, checked when the effect
 * resolves; Enel is played active so it does not count itself. The draw is exactly 3 cards from the
 * top of the deck; the trash is exactly 2 cards of my choice from the hand as it is after the draw
 * (the drawn cards included) and goes to my trash.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  canFinish,
  cardIds,
  choices,
  deck,
  fill,
  hand,
  kind,
  mine,
  need,
  pickCards,
  reachablePickSets,
  pickInst,
  playRaw,
  trash,
  VAN,
  type Chars,
} from './kit-op10a.ts';
import type { CardId } from '@optcg/engine';

const ENEL = 'OP10-025';
const rest = (card: string) => ({ card, rested: true });
const TOP3: CardId[] = [VAN.thatch, VAN.kingdew, VAN.hajrudin];

function start(
  mineChars: Chars,
  handCards: CardId[] = [],
  deckCards: CardId[] = [...TOP3, ...fill(BLUE, 10)],
) {
  const g = mine('ST01-001', {
    hand: [ENEL, ...handCards],
    characters: mineChars,
    deck: deckCards,
  });
  playRaw(g, ENEL);
  return g;
}

describe('OP10-025 Enel: [On Play] with 2+ rested Characters, draw 3 and trash 2 cards from the hand', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = mine('ST01-001', { hand: [ENEL] });
    const c = g.find('p1', 'hand', ENEL);
    expect(g.card(c).cost).toBe(5);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(6000);
  });

  it('with 2 rested Characters: draws the top 3 cards, then trashes 2 chosen cards from the hand', () => {
    const g = start([rest(VAN.sai), rest(VAN.marco)], [VAN.komachiyo]);
    expect(hand(g).sort()).toEqual([VAN.komachiyo, ...TOP3].sort());
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.thatch, VAN.komachiyo]);
    expect(hand(g).sort()).toEqual([VAN.kingdew, VAN.hajrudin].sort());
    expect(trash(g).sort()).toEqual([VAN.komachiyo, VAN.thatch].sort());
    expect(deck(g)).toHaveLength(10);
    expect(kind(g)).toBe('main');
  });

  it('the trash choice is over the whole hand after the draw (drawn cards included)', () => {
    const g = start([rest(VAN.sai), rest(VAN.marco)], [VAN.komachiyo]);
    need(g, 'choose', 'p1');
    // Picks are listed in canonical order, so read the sets the decision can end with.
    const sets = [...reachablePickSets(g)].filter(Boolean);
    expect(sets).toHaveLength(6);
    for (const s of sets) expect(s.split('+')).toHaveLength(2);
    const cards = new Set(sets.flatMap((s) => s.split('+')));
    expect([...cards].sort()).toEqual([VAN.komachiyo, ...TOP3].sort());
  });

  it('exactly 2 must be trashed: one pick is not enough to finish', () => {
    const g = start([rest(VAN.sai), rest(VAN.marco)], [VAN.komachiyo]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    pickInst(g, [choices(g)[0]!]);
    if (kind(g) === 'choose') expect(canFinish(g)).toBe(false);
  });

  it('with an empty hand otherwise: draw 3, trash 2, 1 card is left', () => {
    const g = start([rest(VAN.sai), rest(VAN.marco)], []);
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.thatch, VAN.kingdew]);
    expect(hand(g)).toEqual([VAN.hajrudin]);
    expect(trash(g).sort()).toEqual([VAN.kingdew, VAN.thatch].sort());
  });

  it('boundary: with only 1 rested Character nothing is drawn or trashed', () => {
    const g = start([rest(VAN.sai)], [VAN.komachiyo]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([VAN.komachiyo]);
    expect(deck(g)).toHaveLength(13);
    expect(trash(g)).toEqual([]);
  });

  it('Enel is played active and does not count itself: 1 other rested Character is not enough', () => {
    const g = start([rest(VAN.sai), VAN.marco], []);
    expect(g.card(g.find('p1', 'characters', ENEL)).rested).toBe(false);
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('three rested Characters also satisfy "2 or more"', () => {
    const g = start([rest(VAN.sai), rest(VAN.marco), rest(VAN.hajrudin)], []);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(3);
  });

  it('only my Characters count: two rested opposing Characters do not enable it', () => {
    const g = mine(
      'ST01-001',
      { hand: [ENEL], deck: [...TOP3, ...fill(BLUE, 10)] },
      { characters: [rest(VAN.sai), rest(VAN.marco)] },
    );
    playRaw(g, ENEL);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
  });

  it('the Characters stay on the field; only hand cards are trashed (Enel is not one of them)', () => {
    const g = start([rest(VAN.sai), rest(VAN.marco)], []);
    pickCards(g, [VAN.thatch, VAN.kingdew]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([ENEL, VAN.marco, VAN.sai].sort());
  });
});
