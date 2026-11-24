/** OP16-106 Sanjuan.Wolf. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, V } from './helpers.ts';
import { BB_LEADER, koByBattle, OTHER_LEADER, trig } from './helpers-op16g4.ts';

const ID = 'OP16-106';

describe('OP16-106 Sanjuan.Wolf', () => {
  it("[On K.O.] with a {Blackbeard Pirates} Leader: draws 1, then your Leader's base power becomes 7000 during this turn", () => {
    const g = koByBattle({ leader: BB_LEADER, deck: [V.c1, V.c2] }, ID);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('can be applied to one of your Characters instead (a 3000 Character becomes 7000)', () => {
    const g = koByBattle({ leader: BB_LEADER, deck: [V.c2, V.c3], characters: [V.c1] }, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = koByBattle({ leader: BB_LEADER, deck: [V.c1, V.c2] }, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('must not fire without a {Blackbeard Pirates} Leader: no draw, no power change', () => {
    const g = koByBattle({ leader: OTHER_LEADER, deck: [V.c1, V.c2] }, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p2');
  });

  it('[Trigger] activates the [On K.O.] effect', () => {
    const g = trig(ID, { leader: BB_LEADER, deck: [V.c1, V.c2] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });
});
