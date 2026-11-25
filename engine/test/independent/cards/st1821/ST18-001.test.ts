/**
 * ST18-001 Uso-Hachi (Purple Character, cost 3, 3000, Counter +2000, {Straw Hat Crew}).
 * "[On Play] If you have 8 or more DON!! cards on your field, rest up to 1 of your opponent's
 * Characters with a cost of 5 or less."
 * Rules: the condition counts every DON!! on the field (cost area active and rested, given). An
 * effect condition is checked on resolution; "up to 1" lets the player pick nothing.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  atMain,
  cost,
  hand,
  LD,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playId,
  restedChar,
  SC,
  settleEmptyChoose,
  trash,
} from './kit-st1821a.ts';

const ID = 'ST18-001';
const OPP = [SC.c2, SC.c5, SC.c6];

function start(active: number, extra: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return mine(LD.shanks, { hand: [ID], ...cost(active), ...extra }, { characters: OPP, ...p2 });
}

describe('ST18-001 Uso-Hachi: [On Play] with 8+ DON!! rest up to 1 opposing Character, cost 5 or less', () => {
  it('with 8 DON!! on the field it offers exactly the opposing Characters of cost 5 or less', () => {
    const g = start(8);
    playId(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c2, SC.c5].sort());
  });

  it('the picked Character is rested and no other card is touched', () => {
    const g = start(10);
    playId(g, ID);
    pickCards(g, [SC.c5]);
    expect(atMain(g)).toBe(true);
    expect(restedChar(g, 'p2', SC.c5)).toBe(true);
    expect(restedChar(g, 'p2', SC.c2)).toBe(false);
    expect(restedChar(g, 'p2', SC.c6)).toBe(false);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('cost boundary: cost 5 qualifies, cost 6 does not', () => {
    const g = start(10, {}, { characters: [SC.c5, SC.c6] });
    playId(g, ID);
    expect(offeredIds(g)).toEqual([SC.c5]);
  });

  it('with only 7 DON!! the condition fails: no prompt and nothing is rested', () => {
    const g = start(7);
    playId(g, ID);
    expect(atMain(g)).toBe(true);
    for (const c of OPP) expect(restedChar(g, 'p2', c)).toBe(false);
  });

  it('the DON!! that paid the 3-cost still count: 8 on the field (3 rested after payment) is enough', () => {
    const g = start(8);
    playId(g, ID);
    need(g, 'choose', 'p1');
  });

  it('DON!! given to my Leader count towards the 8 (6 in the cost area + 2 given)', () => {
    const g = mine({ card: LD.shanks, don: 2 }, { hand: [ID], ...cost(6) }, { characters: OPP });
    playId(g, ID);
    need(g, 'choose', 'p1');
  });

  it('"up to 1": choosing nothing rests nothing', () => {
    const g = start(10);
    playId(g, ID);
    none(g);
    expect(atMain(g)).toBe(true);
    for (const c of OPP) expect(restedChar(g, 'p2', c)).toBe(false);
  });

  it('my own Characters are never offered', () => {
    const g = start(10, { characters: [SC.c3] });
    playId(g, ID);
    expect(offeredIds(g)).not.toContain(SC.c3);
  });

  it('with no opposing Character of cost 5 or less nothing is rested and Uso-Hachi stays on the field', () => {
    const g = start(10, {}, { characters: [SC.c6, SC.c7] });
    playId(g, ID);
    settleEmptyChoose(g);
    expect(atMain(g)).toBe(true);
    expect(restedChar(g, 'p2', SC.c6)).toBe(false);
    expect(restedChar(g, 'p2', SC.c7)).toBe(false);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
  });
});
