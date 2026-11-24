/**
 * EB03-028 Yu (Character, Blue, cost 2, 0 power, Counter +1000, {East Blue}).
 *
 * Card text: "[On Play] Trash 1 card from your hand.
 * [Activate: Main] You may trash this Character: If you have 4 or less cards in your hand, draw 2
 * cards."
 *
 * Rules: the [On Play] trash is mandatory (no "you may"; CR 8-1-2) and the player picks the card;
 * a "you may" cost on an [Activate: Main] is chosen by activating (CR 8-3-1); trashing a Character as
 * a cost is not a K.O. (RL-15); the condition after the colon is read when the effect resolves, so
 * with 5 or more cards the cost is paid for nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chr,
  deck,
  decision,
  fill,
  hand,
  kind,
  LA,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  pickCards,
  playRaw,
  SA,
  tryActivate,
  trash,
  useYes,
  zoneIds,
} from './kit-eb03a.ts';

const YU = 'EB03-028';

describe('EB03-028 Yu: printed values', () => {
  it('cost 2, 0 power, Counter +1000', () => {
    const g = mine(LA.croc, { characters: [YU] });
    const y = chr(g, 'p1', YU);
    expect(g.card(y).cost).toBe(2);
    expect(g.power(y)).toBe(0);
    expect(g.card(y).counter).toBe(1000);
  });
});

describe('EB03-028 Yu: [On Play] trash 1 card from your hand', () => {
  const play = (others: string[]) => {
    const g = mine(LA.croc, { hand: [YU, ...others] });
    playRaw(g, YU);
    return g;
  };

  it('the player chooses which card to trash among the remaining hand', () => {
    const g = play([SA.marco, SA.sai, SA.kingdew]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.kingdew, SA.marco, SA.sai].sort());
    pickCards(g, [SA.sai]);
    expect(trash(g)).toEqual([SA.sai]);
    expect(hand(g)).toEqual([SA.kingdew, SA.marco].sort());
    expect(kind(g)).toBe('main');
  });

  it('it is mandatory: no yes/no question is asked and exactly 1 card is trashed', () => {
    const g = play([SA.marco, SA.sai]);
    expect(decision(g)?.kind).toBe('choose');
    pickCards(g, [SA.marco]);
    expect(trash(g)).toHaveLength(1);
  });

  it('with exactly 1 card in hand it is trashed (the pick may be forced)', () => {
    const g = play([SA.marco]);
    if (kind(g) === 'choose') pickCards(g, [SA.marco]);
    expect(trash(g)).toEqual([SA.marco]);
    expect(hand(g)).toEqual([]);
  });

  it('with an empty hand nothing is trashed and the game goes on', () => {
    const g = play([]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      g.act({ type: 'done' });
    }
    expect(trash(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('Yu herself is not in hand any more: she cannot be the trashed card and stays on the field', () => {
    const g = play([SA.marco]);
    if (kind(g) === 'choose') pickCards(g, [SA.marco]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([YU]);
  });
});

describe('EB03-028 Yu: [Activate: Main] you may trash this Character: if you have 4 or less cards in hand, draw 2', () => {
  const board = (handCards: string[]) =>
    mine(LA.croc, { characters: [YU], hand: handCards, deck: fill(BLUE, 10) });

  it('with 4 cards in hand (boundary): trashes Yu and draws 2', () => {
    const g = board([SA.marco, SA.sai, SA.kingdew, SA.thatch]);
    useYes(g, at(g, 'p1', 'characters', YU));
    if (kind(g) === 'choose') g.act({ type: 'done' });
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g)).toEqual([YU]);
    expect(hand(g)).toHaveLength(6);
    expect(deck(g)).toHaveLength(8);
  });

  it('with 0 cards in hand: draws 2', () => {
    const g = board([]);
    useYes(g, at(g, 'p1', 'characters', YU));
    expect(hand(g)).toHaveLength(2);
    expect(deck(g)).toHaveLength(8);
  });

  it('draws exactly 2 cards, no more', () => {
    const g = board([SA.marco]);
    useYes(g, at(g, 'p1', 'characters', YU));
    expect(hand(g)).toHaveLength(3);
  });

  it('boundary: with 5 cards in hand nothing is drawn', () => {
    const g = board([SA.marco, SA.sai, SA.kingdew, SA.thatch, SA.hajrudin]);
    const y = at(g, 'p1', 'characters', YU);
    if (tryActivate(g, y)) {
      if (decision(g)?.kind === 'optional') g.act({ type: 'optional', accept: true });
    }
    expect(hand(g)).toHaveLength(5);
    expect(deck(g)).toHaveLength(10);
  });

  it('trashing Yu is not a K.O.: no [On K.O.] and it is simply in the trash', () => {
    const g = board([SA.marco]);
    useYes(g, at(g, 'p1', 'characters', YU));
    expect(zoneIds(g, 'p1', 'trash')).toContain(YU);
  });

  it('a Yu played this turn can activate at once', () => {
    const g = mine(LA.croc, { characters: [{ card: YU, playedThisTurn: true }], hand: [SA.marco] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', YU))).toHaveLength(1);
  });

  it('a rested Yu can still activate (the cost is a trash)', () => {
    const g = mine(LA.croc, { characters: [{ card: YU, rested: true }], hand: [SA.marco] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', YU))).toHaveLength(1);
  });
});
