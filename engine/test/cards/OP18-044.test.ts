/** OP18-044 Mr.Beans & Miss.Katherina. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, pick, play, trash } from './helpers.ts';
import { PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-044';

describe('OP18-044 Mr.Beans & Miss.Katherina', () => {
  it('[DON!! x1] gains +1000 power', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, don: 1 }] },
      { leader: PLAIN_BLUE },
    );
    // 4000 + 1000 for the DON!! given + 1000 from the card
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('without a DON!! given it is 4000', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
  });

  it('[On Play] draws 1, then trashes 1 card of your choice from your hand', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID, V.c1], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1').sort()).toEqual([BLUE, V.c1].sort());
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([BLUE]);
  });

  it('with an otherwise empty hand it trashes the card it drew', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([BLUE]);
  });

  it('exactly 1 card is trashed, not more', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID, V.c1, V.c2], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1').sort()).toEqual([BLUE, V.c2].sort());
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });
});
