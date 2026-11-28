/** OP18-039 Gum-Gum Giant Axe. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, pick, trash } from './helpers.ts';
import { counterGame } from './helpers-op14g4.ts';
import { BLUE } from './helpers.ts';
import { LUFFY_C, LUFFY_L, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';
import { candidates } from './helpers-op18-g2.ts';

const ID = 'OP18-039';

describe('OP18-039 Gum-Gum Giant Axe', () => {
  it('[Counter]: your [Monkey.D.Luffy] Leader gains +2000 during this battle, then an active Leader draws 1', () => {
    const g = counterGame(ID, { leader: LUFFY_L }, [], V.c4);
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g)).toEqual([g.leader('p1')]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('can pick a [Monkey.D.Luffy] Character instead; other names are not offered', () => {
    const g = counterGame(ID, { leader: LUFFY_L, characters: [LUFFY_C, V.c3] }, [], V.c4);
    expect(candidates(g).sort()).toEqual(
      [g.leader('p1'), g.find('p1', 'characters', LUFFY_C)].sort(),
    );
    pick(g, [g.find('p1', 'characters', LUFFY_C)]);
    expect(g.power(g.find('p1', 'characters', LUFFY_C))).toBe(8000);
  });

  it('a rested Leader: the +2000 still applies but nothing is drawn', () => {
    const g = counterGame(ID, { leader: { card: LUFFY_L, rested: true } }, [], V.c4);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('no [Monkey.D.Luffy] to pick: nothing is boosted, but an active Leader still draws', () => {
    const g = counterGame(ID, { leader: PLAIN_PURPLE }, [], V.c4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('the boost ends with the battle', () => {
    const g = counterGame(ID, { leader: LUFFY_L }, [], V.c4);
    pick(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    while (g.decider === 'p1' && g.legal().some((a) => a.type === 'trigger'))
      g.act({ type: 'trigger', activate: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(3);
  });
});
