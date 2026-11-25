/**
 * ST18-003 San-Gorou (Purple Character, cost 5, 6000, Counter +1000, {Straw Hat Crew}).
 * "[When Attacking] [Once Per Turn] If you have 8 or more DON!! cards on your field, draw 1 card."
 * Rules: the condition is checked when the attack is declared and counts all DON!! on the field.
 * Once Per Turn is per card.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  attack,
  BLUE,
  cost,
  deck,
  hand,
  kind,
  LD,
  many,
  mine,
  noDefence,
  SC,
} from './kit-st1821a.ts';

const ID = 'ST18-003';
const TOP = [SC.c2, SC.c3, ...many(BLUE, 8)];

function start(active: number, extra: Partial<PlayerSpec> = {}) {
  return mine(LD.shanks, { characters: [ID], deck: TOP, ...cost(active), ...extra });
}

function swing(g: ReturnType<typeof start>, nth = 0) {
  attack(g, g.find('p1', 'characters', ID, nth), g.leader('p2'));
}

describe('ST18-003 San-Gorou: [When Attacking] [Once Per Turn] with 8+ DON!! draw 1', () => {
  it('with 8 DON!! attacking draws exactly 1 card: the top card of the deck', () => {
    const g = start(8);
    swing(g);
    expect(hand(g)).toEqual([SC.c2]);
    expect(deck(g)).toHaveLength(9);
  });

  it('the card is drawn when the attack is declared, before the defender acts', () => {
    const g = start(8);
    swing(g);
    expect(['block', 'counter']).toContain(kind(g));
    expect(hand(g)).toEqual([SC.c2]);
  });

  it('with only 7 DON!! nothing is drawn', () => {
    const g = start(7);
    swing(g);
    noDefence(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
  });

  it('rested DON!! count: 4 active + 4 rested = 8', () => {
    const g = start(4, { costArea: { active: 4, rested: 4 } });
    swing(g);
    expect(hand(g)).toEqual([SC.c2]);
  });

  it('DON!! given to a Character count: 6 in the cost area + 2 given = 8', () => {
    const g = start(6, { characters: [{ card: ID, don: 2 }] });
    swing(g);
    expect(hand(g)).toEqual([SC.c2]);
  });

  it('the draw is not optional: no yes/no question is asked', () => {
    const g = start(10);
    swing(g);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(hand(g)).toHaveLength(1);
  });

  it('Once Per Turn belongs to each card: two San-Gorou each draw 1 when they attack', () => {
    const g = start(10, { characters: [ID, ID] });
    swing(g, 0);
    noDefence(g);
    expect(hand(g)).toEqual([SC.c2]);
    swing(g, 1);
    noDefence(g);
    expect(hand(g)).toEqual([SC.c2, SC.c3].sort());
  });

  it('after the battle the draw is not repeated (one draw per attack, no draw on damage)', () => {
    const g = start(10);
    swing(g);
    noDefence(g);
    expect(hand(g)).toEqual([SC.c2]);
    expect(g.life('p2')).toBe(3);
  });

  it('the effect does not fire on the next turn unless it attacks again: ending the turn draws nothing extra', () => {
    const g = start(10);
    swing(g);
    noDefence(g);
    act(g, { type: 'endTurn' });
    expect(hand(g)).toEqual([SC.c2]);
  });
});
