/** ST14-017 Thousand Sunny (Stage). */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, PLAIN_BLUE, PLAIN_PURPLE, V, BLUE } from './helpers.ts';
import { ELBAPH_LEADER, GIANT } from './helpers-sabo.ts';

/** OP15-089 Franky: Black, {Straw Hat Crew}, cost 5, no text. */
const BLACK_SHC = 'OP15-089';
/** OP17-082 Sanji: Black {Straw Hat Crew}, cost 2 (its [On Play] is not played in these positions). */
const BLACK_SHC_2 = 'OP17-082';

describe('ST14-017 Thousand Sunny', () => {
  it('your black {Straw Hat Crew} Characters gain +1 cost', () => {
    const g = game(
      { leader: PLAIN_PURPLE, stage: 'ST14-017', characters: [BLACK_SHC, V.c3, GIANT] },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', BLACK_SHC)).cost).toBe(6);
    // Not black, and black without the type: unchanged (Saul is {Giant}, {Former Navy}, {Elbaph}).
    expect(g.card(g.find('p1', 'characters', V.c3)).cost).toBe(3);
    expect(g.card(g.find('p1', 'characters', GIANT)).cost).toBe(16);
  });

  it("an opponent's black {Straw Hat Crew} Character is not changed", () => {
    const g = game(
      { leader: PLAIN_PURPLE, stage: 'ST14-017' },
      { leader: PLAIN_BLUE, characters: [BLACK_SHC_2] },
    );
    expect(g.card(g.find('p2', 'characters', BLACK_SHC_2)).cost).toBe(2);
  });

  it('without the Stage there is no change', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLACK_SHC] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', BLACK_SHC)).cost).toBe(5);
  });

  it('[On Play]: with a {Straw Hat Crew} Leader, draw 1', () => {
    const g = game(
      {
        leader: ELBAPH_LEADER,
        hand: ['ST14-017'],
        deck: [BLUE, BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', 'ST14-017') });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expectDecision(g, 'main', 'p1');
  });

  it('[On Play]: with any other Leader, no draw', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['ST14-017'],
        deck: [BLUE, BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', 'ST14-017') });
    expect(hand(g, 'p1')).toEqual([]);
  });
});
