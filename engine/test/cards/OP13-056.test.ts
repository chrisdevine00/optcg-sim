/** OP13-056 LittleOars Jr. */
import { describe, expect, it } from 'vitest';
import { hand, PLAIN_BLUE } from './helpers.ts';
import { mk, V, WB_LEADER } from './helpers-op13g2.ts';

const ID = 'OP13-056';

const attack = (leader: string, handCards: string[] = [V.c1]) => {
  const g = mk({ leader, characters: [ID], hand: handCards });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('OP13-056 LittleOars Jr.', () => {
  it('[When Attacking]: with a {Whitebeard Pirates} Leader, draws 1', () => {
    const g = attack(WB_LEADER);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('must not draw with a Leader whose type does not include it', () => {
    const g = attack(PLAIN_BLUE);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('draws regardless of the hand size (no hand condition)', () => {
    const g = attack(
      WB_LEADER,
      Array.from({ length: 8 }, () => V.c1),
    );
    expect(hand(g, 'p1')).toHaveLength(9);
  });

  it("does not draw when the opponent's Character attacks", () => {
    const g = mk(
      { leader: WB_LEADER, characters: [ID], hand: [V.c1] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});
