/**
 * ST35-003 Karasu (Black Character, cost 3, 4000, Counter +2000, Special, {Revolutionary Army}).
 *
 * Card text: "[When Attacking] You may trash 2 cards from the top of your deck: If your opponent has 7 or
 * more cards in their hand, your opponent trashes 1 card from their hand."
 *
 * Rules: RD 120 (an unpayable cost cannot be paid), CR 8-3-3 (a failed "if" resolves nothing, the cost
 * stays paid), the opponent chooses the card they trash from their own hand.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { result } from '../../helpers.ts';
import {
  attack,
  BLUE,
  cardIds,
  choices,
  deck,
  fill,
  hand,
  kind,
  LDB,
  mine,
  need,
  no,
  passBlock,
  passCounter,
  pickInst,
  RED,
  SB,
  T,
  trash,
  unusable,
  yes,
} from './kit-stb5b.ts';

const KARASU = T.karasu;

/** p1's turn: Karasu attacks p2's Leader; the opponent holds `oppHand` cards (one of them a Hajrudin). */
function attacking(oppHand: number, p1: Partial<PlayerSpec> = {}) {
  const g = mine(
    LDB.strike,
    {
      characters: [KARASU],
      hand: [SB.c1p3],
      deck: [SB.c3p5, SB.c4p6, ...fill(BLUE, 13)],
      ...p1,
    },
    { hand: [...fill(RED, oppHand - 1), SB.c4p6].slice(0, oppHand) },
  );
  attack(g, g.find('p1', 'characters', KARASU), g.leader('p2'));
  return g;
}

describe('ST35-003 Karasu: [When Attacking] may trash 2 from the top of the deck: opponent with 7+ cards trashes 1', () => {
  it('opponent with 7 cards: my top 2 are trashed, then they trash exactly 1 card of their choice', () => {
    const g = attacking(7);
    yes(g);
    const d = need(g, 'choose', 'p2');
    expect(d.min).toBe(1);
    expect(d.max).toBe(1);
    expect(choices(g)).toHaveLength(7);
    expect(trash(g, 'p1').sort()).toEqual([SB.c3p5, SB.c4p6].sort());
    pickInst(g, [g.find('p2', 'hand', SB.c4p6)]);
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(trash(g, 'p2')).toEqual([SB.c4p6]);
    expect(kind(g)).toBe('block');
  });

  it('threshold: with 6 cards in hand nothing is trashed, but the 2 cards of the deck are gone', () => {
    const g = attacking(6);
    yes(g);
    expect(kind(g)).toBe('block');
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(trash(g, 'p2')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([SB.c3p5, SB.c4p6].sort());
    expect(deck(g)).toHaveLength(13);
  });

  it('with 8 cards only one is trashed', () => {
    const g = attacking(8);
    yes(g);
    pickInst(g, [g.find('p2', 'hand', SB.c4p6)]);
    expect(hand(g, 'p2')).toHaveLength(7);
    expect(kind(g)).toBe('block');
  });

  it('declining the "you may": the deck is untouched and the opponent trashes nothing', () => {
    const g = attacking(7);
    no(g);
    expect(deck(g)).toHaveLength(15);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p2')).toHaveLength(7);
    expect(kind(g)).toBe('block');
  });

  it('RD 120: a deck of 1 card cannot pay the cost of trashing 2: nothing is trashed', () => {
    const g = attacking(7, { deck: [SB.c3p5] });
    unusable(g, 'p1');
    expect(deck(g)).toHaveLength(1);
    expect(hand(g, 'p2')).toHaveLength(7);
    expect(kind(g)).toBe('block');
  });

  it('a deck of exactly 3 cards can pay: two are trashed and the game goes on', () => {
    const g = attacking(7, { deck: [SB.c3p5, SB.c4p6, BLUE] });
    yes(g);
    expect(deck(g)).toHaveLength(1);
    expect(trash(g, 'p1').sort()).toEqual([SB.c3p5, SB.c4p6].sort());
    pickInst(g, [g.find('p2', 'hand', SB.c4p6)]);
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(result(g)).toBeNull();
  });

  it('RL-26: a deck of exactly 2 cards can be trashed, and emptying the deck loses the game', () => {
    const g = attacking(7, { deck: [SB.c3p5, SB.c4p6] });
    yes(g);
    expect(deck(g)).toHaveLength(0);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('the cost trashes from the TOP of the deck and leaves my hand alone', () => {
    const g = attacking(6);
    yes(g);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(BLUE);
    expect(hand(g)).toEqual([SB.c1p3]);
  });

  it('the attack goes on after the effect: the Block Step follows and the battle resolves', () => {
    const g = attacking(7);
    yes(g);
    pickInst(g, [g.find('p2', 'hand', SB.c4p6)]);
    need(g, 'block', 'p2');
    passBlock(g);
    passCounter(g);
    // Karasu (4000) does not beat the 5000 Leader: no Life is lost.
    expect(g.life('p2')).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('it also triggers when Karasu attacks a rested Character', () => {
    const g = mine(
      LDB.strike,
      { characters: [KARASU], deck: [SB.c3p5, SB.c4p6, ...fill(BLUE, 13)] },
      { characters: [{ card: SB.c1p3, rested: true }], hand: fill(RED, 7) },
    );
    attack(g, g.find('p1', 'characters', KARASU), g.find('p2', 'characters', SB.c1p3));
    yes(g);
    need(g, 'choose', 'p2');
    expect(trash(g, 'p1')).toHaveLength(2);
  });

  it('the opponent hand is counted when the effect resolves: 7 cards but only my deck matters for the cost', () => {
    const g = attacking(7, { hand: [] });
    yes(g);
    expect(need(g, 'choose', 'p2').max).toBe(1);
  });
});
