/** OP16-109 Doc Q. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, pick, V } from './helpers.ts';
import { BB_LEADER, koByBattle, names, OTHER_LEADER, RED_1, trig } from './helpers-op16g4.ts';

const ID = 'OP16-109';

describe('OP16-109 Doc Q', () => {
  it("[On K.O.] with a {Blackbeard Pirates} Leader: draws 1 and K.O.s up to 2 of your opponent's Characters with cost 1 or less", () => {
    const g = koByBattle({ leader: BB_LEADER, deck: [V.c1, V.c2] }, ID, {
      characters: [V.c1, RED_1, V.c2],
    });
    expect(hand(g, 'p1')).toEqual([V.c1]);
    // Candidates: the two cost 1 Characters only (cost 2 and the cost 7 attacker are not).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', RED_1)]);
    expect(names(g, 'p2', 'characters').sort()).toEqual([V.c2, V.c7].sort());
  });

  it('"up to 2": a single Character may be chosen', () => {
    const g = koByBattle({ leader: BB_LEADER, deck: [V.c1, V.c2] }, ID, {
      characters: [V.c1, RED_1],
    });
    pick(g, [g.find('p2', 'characters', RED_1)]);
    expect(names(g, 'p2', 'characters').sort()).toEqual([V.c1, V.c7].sort());
  });

  it('must not fire without a {Blackbeard Pirates} Leader', () => {
    const g = koByBattle({ leader: OTHER_LEADER, deck: [V.c1, V.c2] }, ID, {
      characters: [V.c1],
    });
    expect(hand(g, 'p1')).toEqual([]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c7, V.c1]);
    expectDecision(g, 'main', 'p2');
  });

  it('[Trigger] activates the [On K.O.] effect', () => {
    const g = trig(ID, { leader: BB_LEADER, deck: [V.c1, V.c2] }, [V.c1]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c7]);
  });
});
