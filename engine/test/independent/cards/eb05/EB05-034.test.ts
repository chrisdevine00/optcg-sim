/**
 * EB05-034 Sugar (Character, Purple, cost 2, 0 power, Counter +2000, {Donquixote Pirates}).
 *
 * Card text: "[On Play] DON!! -2: If you have 7 or more DON!! cards on your field, give up to 1 of
 * your opponent's Characters -4000 power during this turn."
 *
 * Rules: CR 8-4-1 (conditions of the timing are checked first, the cost is paid, then the effect
 * resolves; an "if" in the effect text is read at resolution, so after DON!! -2), CR 8-3-1-6
 * (DON!! -2 returns DON!! to the DON!! deck), RD 112 (an [On Play] with a cost may be declined and
 * the card is still played), CR 8-3-3, CR 1-3-6-1 (power may go negative; nothing leaves the field),
 * RL-09 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import { endTurn, noDefence } from '../../helpers.ts';
import {
  beginUse,
  CH,
  chars,
  choiceCards,
  don,
  drive,
  kind,
  LD,
  mine,
  playCard,
  reachablePickSets,
} from './kit-b.ts';

const ID = 'EB05-034';

/** `field` DON!! on my field before playing Sugar (cost 2), all active in the cost area unless given. */
function go(o: { field: number; given?: number; opp?: string[]; use?: boolean }) {
  const given = o.given ?? 0;
  const g = mine(
    given ? { card: LD.donq, don: given } : LD.donq,
    { hand: [ID], costArea: { active: o.field - given, rested: 0 } },
    { characters: o.opp ?? [CH.kingdew] },
  );
  playCard(g, ID);
  drive(g, 'p1', {
    use: [o.use ?? true],
    picks: [[g.find('p2', 'characters', (o.opp ?? [CH.kingdew])[0]!)]],
  });
  return g;
}

describe('EB05-034 Sugar [On Play]: DON!! -2: if 7+ DON!! on my field, an opposing Character gets -4000', () => {
  it('9 DON!! before the cost (7 after): the target loses 4000 power and 2 DON!! return to the DON!! deck', () => {
    const g = go({ field: 9 });
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    expect(g.power(kingdew)).toBe(3000);
    expect(don(g).deck).toBe(1 + 2);
    expect(don(g).active + don(g).rested).toBe(7);
  });

  it('the condition is read after the cost: 8 DON!! before (6 after) gives no -4000', () => {
    const g = go({ field: 8 });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
  });

  it('10 DON!! before the cost: still works (8 after)', () => {
    const g = go({ field: 10 });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(3000);
  });

  it('DON!! given to my Leader count as DON!! on my field (7 in the cost area + 2 given = 9)', () => {
    const g = go({ field: 9, given: 2 });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(3000);
  });

  it('RD 112: declining the DON!! -2 leaves Sugar on the field with no effect and no DON!! returned', () => {
    const g = go({ field: 9, use: false });
    expect(chars(g)).toEqual([ID]);
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
    expect(don(g).deck).toBe(1);
  });

  it('only the opponent’s Characters are candidates (not my own, not either Leader)', () => {
    const g = mine(
      LD.donq,
      { hand: [ID], characters: [CH.marco], costArea: { active: 9, rested: 0 } },
      { characters: [CH.kingdew, CH.sai] },
    );
    playCard(g, ID);
    beginUse(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.kingdew, CH.sai].sort());
  });

  it('"up to 1": nothing, or exactly one Character, may be chosen', () => {
    const g = mine(
      LD.donq,
      { hand: [ID], costArea: { active: 9, rested: 0 } },
      { characters: [CH.kingdew, CH.sai] },
    );
    playCard(g, ID);
    drive(g, 'p1', { picks: [[]] });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
    expect(g.power(g.find('p2', 'characters', CH.sai))).toBe(4000);
    expect(reachablePickSets(g).size).toBeGreaterThan(0);
  });

  it('CR 1-3-6-1: power below 0 is allowed and the Character stays on the field (Komachiyo 3000 -> -1000)', () => {
    const g = go({ field: 9, opp: [CH.komachiyo] });
    const target = g.find('p2', 'characters', CH.komachiyo);
    expect(g.power(target)).toBe(-1000);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('RL-09: the -4000 lasts only this turn (the Character is back to 7000 on the opponent’s turn)', () => {
    const g = go({ field: 9 });
    noDefence(g);
    endTurn(g);
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
  });
});
