/** OP12-085 Karasu. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, hand, passBlock, pick, V } from './helpers.ts';
import { BLUE, mk, offered, OTHER_LEADER, RA_LEADER, rep } from './helpers-op12g3.ts';

const ID = 'OP12-085';

/** p1 attacks p2's Leader with Karasu; p2 has `n` cards in hand. */
function attackWith(leader: string, n: number) {
  const g = mk({ leader, characters: [ID] }, { hand: [...rep(n - 1, BLUE), V.c2] });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
}

describe('OP12-085 Karasu', () => {
  it('with a "Revolutionary Army" Leader this Character gains +3 cost (5 becomes 8)', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(8);
  });

  it('with another Leader its cost stays 5', () => {
    const g = mk({ leader: OTHER_LEADER, characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(5);
  });

  it('[When Attacking] with 5 cards in the opponent hand: the opponent chooses and trashes 1', () => {
    const g = attackWith(RA_LEADER, 5);
    expectDecision(g, 'choose', 'p2');
    // The opponent picks which card; they can pick any of their 5.
    expect(offered(g)).toHaveLength(5);
    pick(g, [g.find('p2', 'hand', V.c2)]);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c2]);
    passBlock(g);
    endCounter(g);
  });

  it('boundary: 4 cards in the opponent hand: nothing is trashed', () => {
    const g = attackWith(RA_LEADER, 4);
    expectDecision(g, 'block', 'p2');
    expect(hand(g, 'p2')).toHaveLength(4);
  });

  it('must not fire with a non-"Revolutionary Army" Leader even with 7 cards in hand', () => {
    const g = attackWith(OTHER_LEADER, 7);
    expectDecision(g, 'block', 'p2');
    expect(hand(g, 'p2')).toHaveLength(7);
  });
});
