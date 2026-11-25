/** ST19-002 Sengoku. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import {
  BLACK_NONNAVY,
  BN1,
  BN2,
  BN6,
  NAVY_LEADER,
  RN5,
  SHC_LEADER,
  mk,
} from './helpers-st1821.ts';

const ID = 'ST19-002';
const DECK = [V.c1, V.c2, V.c3, V.c4, V.c5];

describe('ST19-002 Sengoku', () => {
  it('[On Play] with a {Navy} Leader: trashes 2 black {Navy} cards from hand, draws 3', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID, BN1, BN2], deck: DECK });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BN1), g.find('p1', 'hand', BN2)]);
    expect(trash(g, 'p1').sort()).toEqual([BN1, BN2].sort());
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, V.c3]);
  });

  it('the cost is paid even when the Leader is not {Navy}: the 2 cards are trashed and nothing is drawn', () => {
    const g = mk({ leader: SHC_LEADER, hand: [ID, BN1, BN2], deck: DECK });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BN1), g.find('p1', 'hand', BN2)]);
    expect(trash(g, 'p1').sort()).toEqual([BN1, BN2].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with 3 black {Navy} cards the owner picks which 2', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID, BN1, BN2, BN6], deck: DECK });
    play(g, ID);
    accept(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BN1), g.find('p1', 'hand', BN6)]);
    expect(trash(g, 'p1').sort()).toEqual([BN1, BN6].sort());
    expect(hand(g, 'p1')).toEqual([BN2, V.c1, V.c2, V.c3]);
  });

  it('boundary: only 1 black {Navy} card (others are red {Navy} or black non-{Navy}): the cost is not offered', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID, BN1, RN5, BLACK_NONNAVY], deck: DECK });
    play(g, ID);
    // Only 1 qualifying card: the prompt is shown but accepting is illegal (2 are needed).
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BN1, RN5, BLACK_NONNAVY]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('declining the optional cost draws nothing and trashes nothing', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID, BN1, BN2], deck: DECK });
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BN1, BN2]);
    expect(trash(g, 'p1')).toEqual([]);
  });
});
