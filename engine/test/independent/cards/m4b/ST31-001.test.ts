/**
 * ST31-001 Sanji (Character, Red, cost 5, 3000, Counter +1000; Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[DON!! x2] This Character gains [Rush]. (This card can attack on the turn in which it is played.)
 *    [On Play] Draw 1 card and play up to 1 {Straw Hat Crew} type Character card with a cost of 5 or
 *    less other than [Sanji] from your hand."
 *
 * Rules: [DON!! x2] is a state check: 2 or more DON!! given to this card (CR 8-3-2-3, RL-13); the
 * draw happens before the play choice, so the drawn card is a candidate (CR 4-10-2 ordering, "and"
 * resolves left to right); the played card is played without paying its cost, active; "up to 1"
 * allows none (CR 8-4-4-1); [Sanji] is an exact name (CR 2-1-2).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import {
  act,
  canAttackAny,
  CH,
  chooseNone,
  donOf,
  EV,
  F,
  finishEmpty,
  kind,
  LB,
  myTurn,
  offered,
  offeredCardIds,
  pickCard,
  play,
  side,
  sortedIds,
  zoneCards,
} from './kit-b.ts';

const SANJI = 'ST31-001';

function playGame(hand: CardId[], top: CardId = CH.luffy4, p1: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(LB.redShc, F.red, {
      hand: [SANJI, ...hand],
      deck: [top, ...Array.from({ length: 10 }, () => F.red)],
      costArea: { active: 5, rested: 0 },
      ...p1,
    }),
    side(LB.opp, F.red),
  );
  play(g, g.find('p1', 'hand', SANJI));
  return g;
}

describe('ST31-001 [On Play]: draw 1 and play up to 1 {Straw Hat Crew} Character (cost ≤5, not [Sanji]) from your hand', () => {
  const HAND: CardId[] = [CH.robin, CH.marco, CH.franky6, CH.sanji1, CH.usopp5, EV.kick];

  it('candidates: SHC Characters with cost ≤5 other than [Sanji]: Robin (3), Usopp (5, boundary), and the drawn Luffy (4); not Marco (no type), Franky (6), the other [Sanji], the Event', () => {
    const g = playGame(HAND);
    expect(kind(g)).toBe('choose');
    expect(offeredCardIds(g)).toEqual([CH.robin, CH.usopp5, CH.luffy4].sort());
  });

  it('the draw comes first: the drawn card (top of the deck) is in the hand and can be played at once', () => {
    const g = playGame(HAND);
    pickCard(g, CH.luffy4);
    expect(zoneCards(g, 'p1', 'characters').sort()).toEqual([CH.luffy4, SANJI].sort());
    expect(sortedIds(g, 'p1', 'hand')).not.toContain(CH.luffy4);
    expect(zoneCards(g, 'p1', 'deck')).toHaveLength(10);
  });

  it('happy path: Robin is played without paying its cost, active; the hand keeps the rest plus the drawn card', () => {
    const g = playGame(HAND);
    const robin = pickCard(g, CH.robin);
    expect(g.card(robin).zone).toBe('characters');
    expect(g.card(robin).rested).toBe(false);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    expect(sortedIds(g, 'p1', 'hand')).toEqual(
      [CH.marco, CH.franky6, CH.sanji1, CH.usopp5, EV.kick, CH.luffy4].sort(),
    );
  });

  it('"up to 1": playing nothing is allowed; the card is still drawn', () => {
    const g = playGame(HAND);
    chooseNone(g);
    expect(zoneCards(g, 'p1', 'characters')).toEqual([SANJI]);
    expect(zoneCards(g, 'p1', 'hand')).toHaveLength(HAND.length + 1);
  });

  it('only one card is played', () => {
    const g = playGame(HAND);
    pickCard(g, CH.robin);
    expect(zoneCards(g, 'p1', 'characters')).toHaveLength(2);
    expect(kind(g)).toBe('main');
  });

  it('the draw happens even when there is nothing to play (hand has only non-candidates and the drawn card is not one)', () => {
    const g = playGame([CH.marco, CH.franky6], CH.thatch);
    expect(offeredCardIds(g)).toEqual([]);
    finishEmpty(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([CH.marco, CH.franky6, CH.thatch].sort());
  });

  it('CR 2-1-2: another [Sanji] (OP04-007, cost 1, Straw Hat Crew) is excluded by name', () => {
    const g = playGame([CH.sanji1], CH.marco);
    expect(offeredCardIds(g)).toEqual([]);
    finishEmpty(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(zoneCards(g, 'p1', 'characters')).toEqual([SANJI]);
  });
});

describe('ST31-001 [DON!! x2]: gains [Rush]', () => {
  function fieldGame(don: number) {
    return myTurn(
      side(LB.redShc, F.red, { characters: [{ card: SANJI, don, playedThisTurn: true }] }),
      side(LB.opp, F.red),
    );
  }

  it('with 2 DON!! given it can attack the turn it is played and shows [Rush]', () => {
    const g = fieldGame(2);
    const sanji = g.find('p1', 'characters', SANJI);
    expect(g.card(sanji).keywords).toContain('Rush');
    expect(canAttackAny(g, sanji)).toBe(true);
  });

  it('with 3 DON!! ("x2" is a minimum) it still has [Rush]', () => {
    const g = fieldGame(3);
    expect(g.card(g.find('p1', 'characters', SANJI)).keywords).toContain('Rush');
  });

  it('with only 1 DON!! given there is no [Rush] and it cannot attack this turn', () => {
    const g = fieldGame(1);
    const sanji = g.find('p1', 'characters', SANJI);
    expect(g.card(sanji).keywords).not.toContain('Rush');
    expect(canAttackAny(g, sanji)).toBe(false);
  });

  it('with no DON!! given there is no [Rush]', () => {
    const g = fieldGame(0);
    expect(g.card(g.find('p1', 'characters', SANJI)).keywords).not.toContain('Rush');
  });

  it('giving the second DON!! turns [Rush] on during the turn', () => {
    const g = myTurn(
      side(LB.redShc, F.red, {
        characters: [{ card: SANJI, don: 1, playedThisTurn: true }],
        costArea: { active: 1, rested: 0 },
      }),
      side(LB.opp, F.red),
    );
    const sanji = g.find('p1', 'characters', SANJI);
    expect(canAttackAny(g, sanji)).toBe(false);
    act(g, { type: 'giveDon', target: sanji });
    expect(canAttackAny(g, sanji)).toBe(true);
    expect(offered(g, 'p1')).toBe(false);
  });
});
