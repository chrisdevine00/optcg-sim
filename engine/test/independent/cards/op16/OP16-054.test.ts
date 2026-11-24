/**
 * OP16-054 Mr.1(Daz.Bonez) (Character, Blue, cost 2, 2000, Counter +1000, {Impel Down}/{Former Baroque Works}).
 *
 * Card text: "[DON!! x1] [Your Turn] If you have 5 or more cards in your hand, this Character gains
 * +3000 power. [On Play] Draw 1 card."
 *
 * Rules: CR 8-3-2 ([DON!! xX] and [Your Turn] are conditions that must all hold), CR 8-3-2-3 (X or
 * more DON!!), CR 6-5-5-2 (given DON!! add +1000 on their owner's turn only), CR 8-1-3-3 (permanent
 * effects apply continuously), CR 8-1-2 ([On Play] without "may" is mandatory).
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import {
  at,
  BLUE,
  deck,
  fill,
  hand,
  LDR,
  mine,
  n,
  need,
  put,
  SCN,
  theirs,
  backAtMain,
  playCard,
} from './kit-op16b.ts';

const MR1 = 'OP16-054';
const placed = (don: number) => ({ card: MR1, don });
const bonus = (handSize: number, don: number) => {
  const g = mine(LDR.luffy, {
    characters: [placed(don)],
    hand: fill(SCN.c1, handSize),
    costArea: { active: 10 - don, rested: 0 },
  });
  return g.power(at(g, 'p1', 'characters', MR1));
};

describe('OP16-054 Mr.1(Daz.Bonez): [DON!! x1] [Your Turn] with 5+ cards in hand +3000; [On Play] draw 1', () => {
  it('with 1 DON!! given and 5 cards in hand: 2000 + 1000 (DON!!) + 3000 = 6000', () => {
    expect(bonus(5, 1)).toBe(6000);
  });

  it('boundary: 4 cards in hand: no bonus (3000 with the DON!!)', () => {
    expect(bonus(4, 1)).toBe(3000);
  });

  it('with more cards (8) the bonus is still +3000, not more', () => {
    expect(bonus(8, 1)).toBe(6000);
  });

  it('boundary: no DON!! given: no bonus even with 5 cards in hand (2000)', () => {
    expect(bonus(5, 0)).toBe(2000);
  });

  it('[DON!! x1] means 1 or more: with 2 DON!! given it is 2000 + 2000 + 3000 = 7000', () => {
    expect(bonus(5, 2)).toBe(7000);
  });

  it('[Your Turn]: on the opponent’s turn there is no bonus (and given DON!! add nothing): 2000', () => {
    const g = theirs(
      LDR.luffy,
      { characters: [placed(1)], hand: fill(SCN.c1, 6), costArea: { active: 9, rested: 0 } },
      {},
    );
    expect(g.power(at(g, 'p1', 'characters', MR1))).toBe(2000);
  });

  it('the bonus follows the hand size: playing a card down to 4 cards removes it', () => {
    const g = mine(LDR.luffy, {
      characters: [placed(1)],
      hand: fill(SCN.c1, 5),
      costArea: { active: 9, rested: 0 },
    });
    expect(g.power(at(g, 'p1', 'characters', MR1))).toBe(6000);
    playCard(g, SCN.c1);
    expect(n(g, 'p1', 'hand')).toBe(4);
    expect(g.power(at(g, 'p1', 'characters', MR1))).toBe(3000);
  });

  it('[On Play]: draws 1 card (mandatory, no question)', () => {
    const g = mine(LDR.luffy, { hand: [MR1], deck: [SCN.c7, ...fill(BLUE, 9)] });
    put(g, MR1);
    expect(backAtMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c7]);
    expect(deck(g)).toHaveLength(9);
  });

  it('only when played: a Mr.1 already on the field does not draw, and the bonus is not an [On Play]', () => {
    const g = mine(LDR.luffy, {
      characters: [placed(1)],
      hand: fill(SCN.c1, 5),
      costArea: { active: 9, rested: 0 },
    });
    expect(n(g, 'p1', 'hand')).toBe(5);
    expect(deck(g)).toHaveLength(15);
    endTurn(g);
    need(g, 'main', 'p2');
  });
});
