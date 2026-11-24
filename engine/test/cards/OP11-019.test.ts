/** OP11-019 Glorp Web!!. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { canPick, counterGame, finishBattle, RED_LEADER, trigGame } from './helpers-op11g1.ts';

const ID = 'OP11-019';
const start = (attacker: string) =>
  counterGame(ID, { leader: RED_LEADER, characters: [V.c1] }, [], attacker);

describe('OP11-019 Glorp Web!!', () => {
  it('[Counter]: +2000 during this battle; with an opposing Character of 6000+, +1000 this turn too', () => {
    const g = start(V.c4); // the 6000 attacker is itself the opposing Character: boundary
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'choose', 'p1'); // the second, separate pick
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(4000);
  });

  it('with only 5000 power opposing, there is no second boost (boundary below 6000)', () => {
    const g = start(V.c3);
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  it('the +2000 lasts the battle, the +1000 the turn', () => {
    const g = start(V.c5);
    pick(g, [g.find('p1', 'characters', V.c1)]); // battle +2000
    pick(g, [g.find('p1', 'characters', V.c1)]); // turn +1000
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(6000);
    finishBattle(g);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(4000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  it('"up to 1": either boost may be declined', () => {
    const g = start(V.c5);
    none(g);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger]: +1000 power this turn to a Leader or Character', () => {
    const g = trigGame(ID, { leader: RED_LEADER, characters: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.leader('p1'))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(4000);
  });
});
