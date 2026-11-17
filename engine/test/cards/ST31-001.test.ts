/** ST31-001 Sanji. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { cardsOf, donArea, SHC, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'ST31-001';
const BIG6 = 'OP10-014'; // Straw Hat Crew, cost 6

describe('ST31-001 Sanji', () => {
  it('[DON!! x2]: gains [Rush] with 2 or more DON!! given, not with 1 or none', () => {
    const kw = (don: number) => {
      const g = game(
        { leader: SHC_LEADER, characters: [{ card: ID, don }] },
        { leader: PLAIN_BLUE },
      );
      return g.card(g.find('p1', 'characters', ID)).keywords;
    };
    expect(kw(2)).toContain('Rush');
    expect(kw(3)).toContain('Rush');
    expect(kw(1)).not.toContain('Rush');
    expect(kw(0)).not.toContain('Rush');
  });

  it('[On Play]: draw 1, then play up to 1 {Straw Hat Crew} Character with cost 5 or less other than [Sanji]', () => {
    const g = game(
      {
        leader: SHC_LEADER,
        hand: [ID, SHC.nami5, BIG6, ID, BLUE, SHC.franky4],
        deck: [SHC.jinbe2, PURPLE],
        ...donArea(5),
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(hand(g, 'p1')).toContain(SHC.jinbe2); // drawn first
    expectDecision(g, 'choose', 'p1');
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    // Nami (cost 5), Franky (4) and the drawn Jinbe (2). Not the 6-cost, not Sanji, not the Blue vanilla.
    expect(offered.sort()).toEqual(
      [
        g.find('p1', 'hand', SHC.nami5),
        g.find('p1', 'hand', SHC.franky4),
        g.find('p1', 'hand', SHC.jinbe2),
      ].sort(),
    );
    pick(g, [g.find('p1', 'hand', SHC.jinbe2)]);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([ID, SHC.jinbe2].sort());
    expect(cardsOf(g, 'p1', 'hand')).toHaveLength(5);
  });

  it('[On Play]: "up to 1" may be declined, and with no candidate the draw still happens', () => {
    const g = game(
      { leader: SHC_LEADER, hand: [ID, SHC.franky4], deck: [PURPLE, PURPLE], ...donArea(5) },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(2);
    const bare = game(
      { leader: SHC_LEADER, hand: [ID, BIG6], deck: [PURPLE, PURPLE], ...donArea(5) },
      { leader: PLAIN_BLUE },
    );
    play(bare, ID);
    // A search of a hidden zone is asked even with no candidate, so it leaks nothing: an empty choice.
    expect(expectDecision(bare, 'choose', 'p1').max).toBe(0);
    none(bare);
    expectDecision(bare, 'main', 'p1');
    expect(hand(bare, 'p1')).toHaveLength(2);
  });
});
