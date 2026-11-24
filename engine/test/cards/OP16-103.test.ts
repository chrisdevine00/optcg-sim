/** OP16-103 Van Augur. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, V } from './helpers.ts';
import { BB_LEADER, koByBattle, OTHER_LEADER } from './helpers-op16g4.ts';
import { damageWith } from './triggers.ts';

const ID = 'OP16-103';

describe('OP16-103 Van Augur', () => {
  it("[Opponent's Turn][On K.O.] with a {Blackbeard Pirates} Leader: draws 1 and gives an opposing Leader or Character -3000", () => {
    const g = koByBattle({ leader: BB_LEADER, deck: [V.c1, V.c2] }, ID);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    // Candidates: the opposing Leader and the attacking Character.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(2000);
  });

  it('the -3000 can go to the opposing Character instead and "up to 1" may be left empty', () => {
    const g = koByBattle({ leader: BB_LEADER, deck: [V.c1, V.c2] }, ID);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(6000);
    const g2 = koByBattle({ leader: BB_LEADER, deck: [V.c1, V.c2] }, ID);
    none(g2);
    expect(g2.power(g2.leader('p2'))).toBe(5000);
  });

  it('must not fire without a {Blackbeard Pirates} Leader', () => {
    const g = koByBattle({ leader: OTHER_LEADER, deck: [V.c1] }, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p2');
  });

  it("[Trigger] activates the [On K.O.] effect (it is the opponent's turn)", () => {
    const g = damageWith(ID, { leader: BB_LEADER, deck: [V.c1, V.c2] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c1]);
    pick(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(2000);
  });
});
