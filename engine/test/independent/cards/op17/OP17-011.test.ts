/**
 * OP17-011 Blamenco (Character, Red, cost 5, 6000, Counter +1000, {Whitebeard Pirates}, Strike).
 *
 * Card text: "[DON!! x2] [When Attacking] Give up to 1 of your opponent's Characters -4000 power during
 * this turn."
 *
 * Rules: CR 8-3-2-3 / 10-2-9-1 ([DON!! xX] holds with X or more DON!! given), CR 10-2-5 ([When
 * Attacking]), CR 8-4-4-1 ("up to"), RL-09 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  choiceCards,
  choices,
  choose,
  chooseNone,
  cp,
  decider,
  endTurn,
  kind,
  LD,
  lp,
  mine,
  noDefence,
  reachablePickSets,
  SC2,
  WB,
} from './kit-op17a.ts';

const BLAMENCO = 'OP17-011';

function ready(
  don: number,
  opp: (string | { card: string; rested?: boolean })[] = [WB.kingdew, WB.jil],
  own: string[] = [],
) {
  return mine(
    LD.luffy,
    { characters: [{ card: BLAMENCO, don }, ...own], costArea: { active: 10 - don, rested: 0 } },
    { characters: opp },
  );
}
const swing = (g: ReturnType<typeof ready>) =>
  attack(g, g.find('p1', 'characters', BLAMENCO), g.leader('p2'));

describe('OP17-011 Blamenco: [DON!! x2] [When Attacking] an opposing Character gets -4000 power this turn', () => {
  it('with 2 DON!! given: the chosen opposing Character loses 4000 (7000 -> 3000)', () => {
    const g = ready(2);
    swing(g);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', WB.kingdew)]);
    expect(cp(g, 'p2', WB.kingdew)).toBe(3000);
    expect(cp(g, 'p2', WB.jil)).toBe(6000);
  });

  it('with 3 DON!! given it still works (X or more)', () => {
    const g = ready(3);
    swing(g);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', WB.kingdew)]);
    expect(cp(g, 'p2', WB.kingdew)).toBe(3000);
  });

  it('with only 1 DON!! given the condition fails: the attack goes straight to the opponent’s Block Step', () => {
    const g = ready(1);
    swing(g);
    expect(decider(g)).toBe('p2');
    expect(kind(g)).toBe('block');
    expect(cp(g, 'p2', WB.kingdew)).toBe(7000);
  });

  it('with no DON!! given: no effect at all', () => {
    const g = ready(0);
    swing(g);
    expect(kind(g)).toBe('block');
    expect(cp(g, 'p2', WB.kingdew)).toBe(7000);
  });

  it('candidates are the opponent’s Characters only (not their Leader, not my Characters)', () => {
    const g = ready(2, [WB.kingdew, WB.jil], [WB.thatch]);
    swing(g);
    expect(choiceCards(g)).toEqual([WB.jil, WB.kingdew].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('rested and active opposing Characters can both be chosen', () => {
    const g = ready(2, [{ card: WB.kingdew, rested: true }, WB.jil]);
    swing(g);
    expect(choiceCards(g)).toEqual([WB.jil, WB.kingdew].sort());
  });

  it('CR 8-4-4-1 "up to 1": may choose nobody; at most one Character is affected', () => {
    const g = ready(2);
    swing(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    chooseNone(g);
    expect(cp(g, 'p2', WB.kingdew)).toBe(7000);
  });

  it('RL-09: the -4000 lasts through the turn (also after the battle) and ends at the end of the turn', () => {
    const g = ready(2);
    swing(g);
    choose(g, [g.find('p2', 'characters', WB.kingdew)]);
    noDefence(g);
    expect(cp(g, 'p2', WB.kingdew)).toBe(3000);
    endTurn(g);
    expect(cp(g, 'p2', WB.kingdew)).toBe(7000);
  });

  it('the reduction is an effect on the chosen card, not on the attack: the opponent’s Leader power is untouched', () => {
    const g = ready(2);
    swing(g);
    choose(g, [g.find('p2', 'characters', WB.kingdew)]);
    expect(lp(g, 'p2')).toBe(5000);
  });

  it('a rested opposing Character attacked by Blamenco: -4000 on that target decides the battle (8000 vs 3000)', () => {
    const g = ready(2, [{ card: WB.kingdew, rested: true }]);
    const target = g.find('p2', 'characters', WB.kingdew);
    attack(g, g.find('p1', 'characters', BLAMENCO), target);
    choose(g, [target]);
    expect(cp(g, 'p2', WB.kingdew)).toBe(3000);
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    void SC2;
  });
});
