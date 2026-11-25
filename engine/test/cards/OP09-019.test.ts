/** OP09-019 Nobody Hurts a Friend of Mine!!!! (Event, cost 2). */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  damageGame,
  expectDecision,
  hand,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  RHP_LEADER,
  trash,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-019';

describe('OP09-019 Nobody Hurts a Friend of Mine!!!!: [Main]', () => {
  const start = (theirs: string[], leader = RHP_LEADER) =>
    mk({ leader, hand: [ID] }, { characters: theirs });

  it('with a Red-Haired Pirates Leader: -3000 power this turn, then draws 1 if the opponent still has a Character with 5000 power or more', () => {
    const g = start([V.c7, V.c2]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(1000);
    expect(hand(g, 'p1')).toHaveLength(1); // 9000 power is left on p2's side
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('boundary: a Character left at exactly 5000 power draws', () => {
    const g = start([V.c6]); // 8000 - 3000
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(5000);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('boundary: a Character left at 4000 power does not draw (the power is read after the -3000)', () => {
    const g = start([V.c5]); // 7000 - 3000
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(4000);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"up to 1": choosing nobody still draws when a Character has 5000 power or more ("Then" is not "If you do")', () => {
    const g = start([V.c3]); // 5000
    play(g, ID);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('no Character with 5000 power or more: no draw', () => {
    const g = start([V.c2]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('only opposing Characters can be chosen, not Leaders or your own Characters', () => {
    const g = mk({ leader: RHP_LEADER, hand: [ID], characters: [V.c4] }, { characters: [V.c7] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });

  it('the -3000 lasts until the end of the turn', () => {
    const g = start([V.c7]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('must not fire without a Red-Haired Pirates Leader: nothing is asked, nothing is drawn (the "Then" is inside the "If")', () => {
    const g = start([V.c7], OTHER_LEADER);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c7]);
  });
});

describe('OP09-019 Nobody Hurts a Friend of Mine!!!!: [Trigger]', () => {
  it('draws 1 card', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER, deck: [V.c2, V.c3, V.c4] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });
});
