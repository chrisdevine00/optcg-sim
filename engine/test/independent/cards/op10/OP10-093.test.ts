/**
 * OP10-093 Saint Homing (Character, Black, cost 1, 0 power, Counter +1000, {Celestial Dragons}).
 *
 * Card text: "[Activate: Main] You may trash this Character: Up to 1 of your black Characters gains
 * +3 cost until the end of your opponent's next turn."
 *
 * Rules: the trash is a cost; "your opponent's next turn" ends at the end of the opponent's next
 * turn (CR 6-6-1-3), so the bonus holds through the opponent's turn and is gone after it.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
  endTurn,
  kind,
  LD10,
  mine,
  need,
  none,
  offeredAbility,
  offeredIds,
  pickInst,
  rawActivate,
  SC10,
  SC14,
  trash,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-093';

function game(chars: string[]) {
  return mine(LD10.plain, { characters: [ID, ...chars] });
}

describe("OP10-093 Saint Homing [Activate: Main] trash this: a black Character gets +3 cost until the end of the opponent's next turn", () => {
  it('trashes Homing and gives the chosen black Character +3 cost', () => {
    const g = game([SC10.cd2, SC10.bbp4]);
    rawActivate(g, at(g, 'p1', 'characters', ID));
    pickInst(g, [chr(g, 'p1', SC10.cd2)]);
    need(g, 'main', 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(g.card(chr(g, 'p1', SC10.cd2)).cost).toBe(5);
    expect(g.card(chr(g, 'p1', SC10.bbp4)).cost).toBe(4);
  });

  it('only black Characters are offered: a red Character is not', () => {
    const g = game([SC10.cd2, SC14.c1, SC10.dr3]);
    rawActivate(g, at(g, 'p1', 'characters', ID));
    expect(offeredIds(g)).toEqual([SC10.cd2]);
  });

  it('Homing cannot target itself (it is trashed as the cost)', () => {
    const g = game([SC10.cd2]);
    rawActivate(g, at(g, 'p1', 'characters', ID));
    expect(offeredIds(g)).not.toContain(ID);
  });

  it("the bonus holds during the opponent's next turn and is gone after it", () => {
    const g = game([SC10.cd2]);
    rawActivate(g, at(g, 'p1', 'characters', ID));
    pickInst(g, [chr(g, 'p1', SC10.cd2)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p1', SC10.cd2)).cost).toBe(5);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.card(chr(g, 'p1', SC10.cd2)).cost).toBe(2);
  });

  it('"up to 1": may choose nothing; Homing is still trashed', () => {
    const g = game([SC10.cd2]);
    rawActivate(g, at(g, 'p1', 'characters', ID));
    none(g);
    need(g, 'main', 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(g.card(chr(g, 'p1', SC10.cd2)).cost).toBe(2);
  });

  it('with no other black Character the cost is still paid and nothing else happens', () => {
    const g = game([SC14.c1]);
    expect(offeredAbility(g, at(g, 'p1', 'characters', ID))).toBe(true);
    rawActivate(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'choose') none(g);
    need(g, 'main', 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(g.card(chr(g, 'p1', SC14.c1)).cost).toBe(1);
  });

  it('only 1 Character gets the bonus', () => {
    const g = game([SC10.cd2, SC10.bbp4]);
    rawActivate(g, at(g, 'p1', 'characters', ID));
    pickInst(g, [chr(g, 'p1', SC10.cd2)]);
    expect(zoneIds(g, 'p1', 'characters')).toHaveLength(2);
    expect(g.card(chr(g, 'p1', SC10.bbp4)).cost).toBe(4);
  });

  it('the Leader is not offered (Characters only)', () => {
    const g = game([SC10.cd2]);
    rawActivate(g, at(g, 'p1', 'characters', ID));
    expect(offeredIds(g)).toEqual([SC10.cd2]);
  });

  it('a second Homing can give a second +3 to the same Character (+6 in total)', () => {
    const g = mine(LD10.plain, { characters: [ID, ID, SC10.cd2] });
    for (let i = 0; i < 2; i++) {
      rawActivate(g, g.find('p1', 'characters', ID));
      pickInst(g, [chr(g, 'p1', SC10.cd2)]);
    }
    expect(g.card(chr(g, 'p1', SC10.cd2)).cost).toBe(8);
  });
});
