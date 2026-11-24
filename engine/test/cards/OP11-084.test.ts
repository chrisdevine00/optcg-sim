/** OP11-084 Kuzan. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import {
  canHit,
  canPick,
  finishBattle,
  idsOf,
  mk,
  NAVY_B1,
  NAVY_LEADER,
} from './helpers-op11g3.ts';

const ID = 'OP11-084';

describe('OP11-084 Kuzan', () => {
  it('[On Play]: trash 3 cards from the top of your deck', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c3, V.c2, V.c1]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c4]);
  });

  it('[On Play] with 2 cards in the deck trashes them both', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID], deck: [V.c1, V.c2] });
    play(g, ID);
    expect(idsOf(g, 'p1', 'deck')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(2);
  });

  const attack = (leader: string = NAVY_LEADER) => {
    const g = mk({ leader, characters: [ID, NAVY_B1, V.c3] }, { characters: [V.c1] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    return g;
  };

  it('[When Attacking]: a "Navy" Character can also attack active Characters this turn', () => {
    const g = attack();
    const navy = g.find('p1', 'characters', NAVY_B1);
    expect(canPick(g, navy)).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    pick(g, [navy]);
    finishBattle(g);
    expect(canHit(g, navy, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canHit(g, g.find('p1', 'characters', V.c3), g.find('p2', 'characters', V.c1))).toBe(
      false,
    );
  });

  it('a "Navy" Leader is eligible', () => {
    const g = attack();
    expect(canPick(g, g.leader('p1'))).toBe(true);
    pick(g, [g.leader('p1')]);
    finishBattle(g);
    expect(canHit(g, g.leader('p1'), g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('a Leader without the "Navy" type is not a candidate', () => {
    const g = attack(PLAIN_BLUE);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    none(g);
  });
});
