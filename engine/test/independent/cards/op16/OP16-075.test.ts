/**
 * OP16-075 Monkey.D.Garp (Character, Purple, cost 5, 6000, Counter +1000, {Navy}).
 *
 * Card text: "[On Play] If your Leader has the {Navy} type, add up to 1 DON!! card from your DON!! deck
 * and set it as active, and add up to 1 additional DON!! card and rest it."
 *
 * Rules: CR 6-4, CR 8-3-3 (failed "if"), CR 8-4-4-1 ("up to"), CR 3-9-3. E-Q11: "add up to N DON!!"
 * asks a count.
 */
import { describe, expect, it } from 'vitest';
import {
  asksDonCount,
  backAtMain,
  donCountOptions,
  don,
  kind,
  LDR,
  mine,
  put,
  takeDon,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const GARP = 'OP16-075';

function played(leader: string, active = 7): TestGame {
  const g = mine(leader, { hand: [GARP], costArea: { active, rested: 0 } });
  put(g, GARP);
  return g;
}

describe('OP16-075 Monkey.D.Garp: [On Play] if your Leader is {Navy}: add 1 active DON!! and 1 additional rested DON!!', () => {
  it('Navy Leader: adds 1 DON!! ACTIVE and 1 additional DON!! RESTED', () => {
    const g = played(LDR.navy);
    takeDon(g, 1);
    takeDon(g, 1);
    expect(backAtMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 3, rested: 6, deck: 1 });
  });

  it('each part is "up to 1": the first count is 1 or 0, then the second count is 1 or 0', () => {
    const g = played(LDR.navy);
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
    takeDon(g, 1);
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
  });

  it('adding only the active one (second count 0)', () => {
    const g = played(LDR.navy);
    takeDon(g, 1);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ active: 3, rested: 5, deck: 2 });
  });

  it('adding only the rested one (first count 0)', () => {
    const g = played(LDR.navy);
    takeDon(g, 0);
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ active: 2, rested: 6, deck: 2 });
  });

  it('adding none at all', () => {
    const g = played(LDR.navy);
    takeDon(g, 0);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ active: 2, rested: 5, deck: 3 });
  });

  it('a Leader with {Navy} among several types ({Donquixote Pirates}/{Navy}) counts', () => {
    const g = played(LDR.dpNavy);
    takeDon(g, 1);
    takeDon(g, 1);
    expect(don(g).deck).toBe(1);
  });

  it('CR 8-3-3: a Leader that is not {Navy}: nothing is added and nothing is asked', () => {
    const g = played(LDR.dp);
    expect(kind(g)).toBe('main');
    expect(don(g)).toMatchObject({ active: 2, rested: 5, deck: 3 });
  });

  it('with 1 DON!! left in the DON!! deck only 1 can be added in total', () => {
    const g = played(LDR.navy, 9);
    takeDon(g, 1);
    if (asksDonCount(g)) expect(donCountOptions(g)).not.toContain('1');
    expect(don(g).deck).toBe(0);
  });

  it('with an empty DON!! deck nothing is added', () => {
    const g = played(LDR.navy, 10);
    if (asksDonCount(g)) expect(donCountOptions(g)).not.toContain('1');
    expect(don(g)).toMatchObject({ active: 5, rested: 5, deck: 0 });
  });
});
