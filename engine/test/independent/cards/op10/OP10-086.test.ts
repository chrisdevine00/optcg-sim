/**
 * OP10-086 Shiryu (Character, Black, cost 4, 5000, Counter +1000, {Blackbeard Pirates}).
 *
 * Card text: "[Opponent's Turn] This Character gains +2000 power. [Activate: Main] [Once Per Turn] If
 * your Leader has the "Blackbeard Pirates" type, and this Character was played on this turn, K.O.
 * up to 1 of your opponent's Characters with a base cost of 3 or less."
 *
 * Rules: a colon-less "If" is an effect condition: the ability fires and its [Once Per Turn] is
 * spent even when the check fails; "base cost" ignores cost modifiers (CR 4-9-2-2); "up to".
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
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
  playRaw,
  rawActivate,
  SC10,
  SC14,
  theirs,
  trash,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-086';

/** Shiryu was played this turn from hand. */
function played(leader: string = LD10.bbp, p2: string[] = [SC14.c3, SC14.c2, SC14.c4]) {
  const g = mine(
    leader,
    { hand: [ID], costArea: { active: 4, rested: 0 }, deck: [BLUE, BLUE] },
    { characters: p2 },
  );
  playRaw(g, ID);
  return g;
}

/** Shiryu has been on the field since an earlier turn. */
function old(leader: string = LD10.bbp, p2: string[] = [SC14.c3, SC14.c2, SC14.c4]) {
  return mine(leader, { characters: [ID] }, { characters: p2 });
}

const shiryu = (g: ReturnType<typeof played>) => at(g, 'p1', 'characters', ID);

describe("OP10-086 Shiryu: +2000 on the opponent's turn; [Activate: Main] [Once Per Turn] K.O. base cost <= 3", () => {
  it('played this turn with a {Blackbeard Pirates} Leader: K.O.s an opposing Character with cost 3', () => {
    const g = played();
    rawActivate(g, shiryu(g));
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    need(g, 'main', 'p1');
    expect(trash(g, 'p2')).toEqual([SC14.c3]);
  });

  it('boundary: cost 2 and 3 are offered, cost 4 is not', () => {
    const g = played();
    rawActivate(g, shiryu(g));
    expect(offeredIds(g)).toEqual([SC14.c2, SC14.c3].sort());
  });

  it('"up to 1": may K.O. nothing; the Once Per Turn is spent', () => {
    const g = played();
    rawActivate(g, shiryu(g));
    none(g);
    need(g, 'main', 'p1');
    expect(trash(g, 'p2')).toEqual([]);
    expect(offeredAbility(g, shiryu(g))).toBe(false);
  });

  it('[Once Per Turn]: after one K.O. it cannot be used again this turn', () => {
    const g = played();
    rawActivate(g, shiryu(g));
    pickInst(g, [chr(g, 'p2', SC14.c2)]);
    expect(offeredAbility(g, shiryu(g))).toBe(false);
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('a Shiryu not played this turn: the ability fires, K.O.s nothing, and the Once Per Turn is spent', () => {
    const g = old();
    expect(offeredAbility(g, shiryu(g))).toBe(true);
    rawActivate(g, shiryu(g));
    need(g, 'main', 'p1');
    expect(trash(g, 'p2')).toEqual([]);
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(3);
    expect(offeredAbility(g, shiryu(g))).toBe(false);
  });

  it("without a {Blackbeard Pirates} Leader nothing is K.O.'d, even when played this turn", () => {
    const g = played(LD10.plain);
    rawActivate(g, shiryu(g));
    need(g, 'main', 'p1');
    expect(trash(g, 'p2')).toEqual([]);
    expect(offeredAbility(g, shiryu(g))).toBe(false);
  });

  it('"base cost": a cost-2 Character with +3 cost (current 5) is still a valid target', () => {
    // p2 (turn 4) uses OP10-093 Saint Homing to give its black cost-2 Character +3 cost until the end
    // of p1's next turn; then p1 plays Shiryu and uses the ability on it.
    const g = theirs(
      LD10.bbp,
      { hand: [ID], costArea: { active: 2, rested: 0 }, deck: [BLUE, BLUE, BLUE, BLUE] },
      { characters: ['OP10-093', SC10.cd2, SC14.c5], costArea: { active: 0, rested: 0 } },
    );
    const homing = g.find('p2', 'characters', 'OP10-093');
    rawActivate(g, homing);
    need(g, 'choose', 'p2');
    pickInst(g, [chr(g, 'p2', SC10.cd2)]);
    expect(g.card(chr(g, 'p2', SC10.cd2)).cost).toBe(5);
    endTurn(g);
    need(g, 'main', 'p1');
    playRaw(g, ID);
    expect(g.card(chr(g, 'p2', SC10.cd2)).cost).toBe(5);
    rawActivate(g, shiryu(g));
    // The current cost is 5, the base cost 2: the Character is a target, the cost-5 one is not.
    expect(offeredIds(g)).toEqual([SC10.cd2]);
  });

  it("[Opponent's Turn]: +2000 power on the opponent's turn only", () => {
    const mineG = mine(LD10.bbp, { characters: [ID] });
    expect(mineG.power(at(mineG, 'p1', 'characters', ID))).toBe(5000);
    const theirG = theirs(LD10.bbp, { characters: [ID] }, {});
    expect(theirG.power(at(theirG, 'p1', 'characters', ID))).toBe(7000);
  });

  it('K.O.s only one Character per activation', () => {
    const g = played(LD10.bbp, [SC14.c1, SC14.c2, SC14.c3]);
    rawActivate(g, shiryu(g));
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    expect(kind(g)).toBe('main');
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(2);
  });
});
