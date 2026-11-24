/** OP12-105 Trafalgar Lammy. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { LAW_CHAR, LAW_LEADER, mk, offered } from './helpers-op12g3.ts';

const ID = 'OP12-105';

describe('OP12-105 Trafalgar Lammy', () => {
  it('[On Play] up to 1 of your [Trafalgar Law] cards gains +2000 power: a Character', () => {
    const g = mk({ hand: [ID], characters: [LAW_CHAR, V.c1] });
    play(g, ID);
    expect(offered(g)).toEqual([g.find('p1', 'characters', LAW_CHAR)]);
    pick(g, [g.find('p1', 'characters', LAW_CHAR)]);
    expect(g.power(g.find('p1', 'characters', LAW_CHAR))).toBe(3000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  it('the Leader counts when it is [Trafalgar Law]', () => {
    const g = mk({ leader: LAW_LEADER, hand: [ID], characters: [LAW_CHAR] });
    play(g, ID);
    expect(offered(g)).toHaveLength(2);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', LAW_CHAR))).toBe(1000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mk({ hand: [ID], characters: [LAW_CHAR] });
    play(g, ID);
    none(g);
    expect(g.power(g.find('p1', 'characters', LAW_CHAR))).toBe(1000);
  });

  it("must not fire without a [Trafalgar Law]: nothing is asked; the opponent's [Trafalgar Law] is not a target", () => {
    const g = mk({ hand: [ID], characters: [V.c1] }, { characters: [LAW_CHAR] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', LAW_CHAR))).toBe(1000);
  });

  it('the bonus lasts this turn only', () => {
    const g = mk({ hand: [ID], characters: [LAW_CHAR] });
    play(g, ID);
    pick(g, [g.find('p1', 'characters', LAW_CHAR)]);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', LAW_CHAR))).toBe(1000);
  });
});
