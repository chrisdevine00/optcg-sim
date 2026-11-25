/** OP09-098 Black Hole (Event, cost 4). */
import { describe, expect, it } from 'vitest';
import {
  addCost,
  BBP_LEADER,
  canPick,
  damageGame,
  expectDecision,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-098';

describe('OP09-098 Black Hole: [Main]', () => {
  const start = (leader: string, theirs: string[] = [V.c4, V.c5]) =>
    mk({ leader, hand: [ID], characters: [V.c1] }, { characters: theirs });

  it('with a Blackbeard Pirates Leader: negates a Character and K.O.s it if its cost is 4 or less', () => {
    const g = start(BBP_LEADER);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false); // Characters only
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]); // cost 4: the boundary
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c4]);
  });

  it("a Character with a cost of 5 is negated but not K.O.'d", () => {
    const g = start(BBP_LEADER);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c4, V.c5]);
    expect(g.card(g.find('p2', 'characters', V.c5)).negated).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c4)).negated).toBeFalsy();
  });

  it('the cost is the current cost: a cost-3 Character with +2 cost (5) is negated but stays', () => {
    const g = start(BBP_LEADER, [V.c3]);
    addCost(g, 'p2', V.c3, 2);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBe(true);
  });

  it('"up to 1": choosing nobody negates and K.O.s nothing', () => {
    const g = start(BBP_LEADER);
    play(g, ID);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c4, V.c5]);
    expect(g.zone('p2', 'characters').every((c) => !c.negated)).toBe(true);
  });

  it('must not fire without a Blackbeard Pirates Leader: nothing is asked, nobody is negated or K.O.\'d (the "Then" is inside the "If")', () => {
    const g = start(OTHER_LEADER);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c4, V.c5]);
    expect(g.zone('p2', 'characters').every((c) => !c.negated)).toBe(true);
  });
});

describe('OP09-098 Black Hole: [Trigger]', () => {
  it("negates the effect of up to 1 of your opponent's Leader or Character cards during this turn", () => {
    const g = damageGame(ID, { leader: OTHER_LEADER }, { characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    pick(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).negated).toBe(true);
    expect(idsOf(g, 'p2', 'characters')).toContain(V.c3); // nothing is K.O.'d by the [Trigger]
  });

  it('"up to 1": may negate nothing', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER }, { characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
  });
});
