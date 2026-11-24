/** OP12-077 The "Extinguishes All Sound Created by Your Influence" Technique. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import {
  canBlockWith,
  damageWith,
  LAW_CHAR,
  LAW_LEADER,
  mine,
  offered,
  OTHER_LEADER,
} from './helpers-op12g2.ts';

const ID = 'OP12-077';
const MAYNARD = 'OP05-052'; // [Blocker] Character of the opponent

describe('OP12-077 The "Extinguishes All Sound Created by Your Influence" Technique', () => {
  const start = (leader: string = LAW_LEADER) =>
    mine({ leader, hand: [ID], characters: [LAW_CHAR, V.c5] }, { characters: [MAYNARD] });
  /** Attack the opponent's Leader with `attacker`; can their [Blocker] Character block? */
  const blockable = (g: ReturnType<typeof start>, attacker: string) => {
    const id = attacker === 'leader' ? g.leader('p1') : g.find('p1', 'characters', attacker);
    g.act({ type: 'attack', attacker: id, target: g.leader('p2') });
    return canBlockWith(g, g.find('p2', 'characters', MAYNARD));
  };

  it('your [Trafalgar Law] Leader gains +2000 power and the opponent cannot activate [Blocker] when it attacks', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(blockable(g, 'leader')).toBe(false);
  });

  it('a [Trafalgar Law] Character works the same way', () => {
    const g = start(OTHER_LEADER);
    play(g, ID);
    pick(g, [g.find('p1', 'characters', LAW_CHAR)]);
    expect(g.power(g.find('p1', 'characters', LAW_CHAR))).toBe(9000);
    expect(blockable(g, LAW_CHAR)).toBe(false);
  });

  it('only [Trafalgar Law] cards are candidates, and only the selected card is protected from blocks', () => {
    const g = start();
    play(g, ID);
    const cands = offered(g);
    expect(cands).toContain(g.leader('p1'));
    expect(cands).toContain(g.find('p1', 'characters', LAW_CHAR));
    expect(cands).not.toContain(g.find('p1', 'characters', V.c5));
    expect(cands).toHaveLength(2);
    pick(g, [g.find('p1', 'characters', LAW_CHAR)]);
    // The Leader (not selected) can still be blocked, as can an unrelated Character.
    expect(blockable(g, V.c5)).toBe(true);
  });

  it('"up to 1": selecting none gives no power and no block lock', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(blockable(g, 'leader')).toBe(true);
  });

  it('the lock lasts this turn only', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.leader('p1')]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(blockable(g, 'leader')).toBe(true);
  });

  it('with no [Trafalgar Law] on your side nothing is selected', () => {
    const g = mine({ leader: OTHER_LEADER, hand: [ID], characters: [V.c5] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p1', 'characters', V.c5))).toBe(7000);
  });

  it('[Trigger] draw 1 card', () => {
    const g = damageWith(ID);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(9);
  });
});
