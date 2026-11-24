/**
 * OP15-097 I Find It Embarrassing as a Human Being (Event, Black, cost 1, {Straw Hat Crew}).
 *
 * Card text:
 *   "[Main] If you have 10 or more cards in your trash, up to 1 of your opponent's Characters with a base
 *    cost of 5 or less cannot attack until the end of your opponent's next End Phase.
 *    [Trigger] Activate this card's [Main] effect."
 *
 * Rules relied on: CR 2-7-3 / RD 74 (an Event played from hand is in the trash before it resolves, so
 * 9 cards before the play are 10 during resolution), RD 105 (a [Trigger] "activate [Main]" runs the
 * [Main] effect), "up to" may choose nothing, "until the end of your opponent's next End Phase" covers
 * the opponent's next turn (or the rest of the current one if cast on it), base cost is the printed cost.
 *
 * The Trigger tests use a large trash margin (12 / 3) so they do not depend on whether the revealed
 * Trigger Event is already counted in the trash while it resolves.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  canAttackAnything,
  canHit,
  choices,
  hitLeader,
  junk,
  kind,
  LD15,
  mayChooseNone,
  mine,
  need,
  offeredIds,
  pickInst,
  playRaw,
  reachablePickSets,
  SC15,
  skipChoice,
  theirs,
  endTurn,
  BLUE,
  declineTrigger,
} from './kit-op15c.ts';

const EMB = 'OP15-097';

const OPP = [SC15.red2, SC15.red5, SC15.red6];

function cast(trashN: number, oppChars: (string | { card: string; rested: boolean })[] = OPP) {
  const g = mine(
    LD15.shc,
    { hand: [EMB], trash: junk(trashN), characters: [SC15.red3] },
    { characters: oppChars },
  );
  playRaw(g, g.find('p1', 'hand', EMB));
  return g;
}

describe('OP15-097 I Find It Embarrassing as a Human Being [Main]', () => {
  it('9 cards before the play (10 with the Event in the trash): the target cannot attack on their turn', () => {
    const g = cast(9);
    need(g, 'choose', 'p1');
    const k = at(g, 'p2', 'characters', SC15.red5);
    pickInst(g, [k]);
    expect(atMain(g)).toBe(true);
    endTurn(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(canAttackAnything(g, k)).toBe(false);
  });

  it('8 cards before the play (9 with the Event): the condition fails and nothing is chosen', () => {
    const g = cast(8);
    expect(kind(g)).not.toBe('choose');
    expect(atMain(g)).toBe(true);
    endTurn(g);
    expect(canAttackAnything(g, at(g, 'p2', 'characters', SC15.red5))).toBe(true);
  });

  it('offers only the opponent’s Characters with a base cost of 5 or less (5 yes, 6 no), not mine, not Leaders', () => {
    const g = cast(9);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red2, SC15.red5].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SC15.red3));
  });

  it('only the chosen Character is stopped: the others of the opponent can still attack', () => {
    const g = cast(9);
    pickInst(g, [at(g, 'p2', 'characters', SC15.red5)]);
    endTurn(g);
    expect(canAttackAnything(g, at(g, 'p2', 'characters', SC15.red2))).toBe(true);
    expect(canAttackAnything(g, at(g, 'p2', 'characters', SC15.red6))).toBe(true);
    expect(canAttackAnything(g, g.leader('p2'))).toBe(true);
  });

  it('it lasts through the opponent’s next turn only: two turns later the Character can attack', () => {
    const g = cast(9);
    const k = at(g, 'p2', 'characters', SC15.red5);
    pickInst(g, [k]);
    endTurn(g);
    expect(canAttackAnything(g, k)).toBe(false);
    endTurn(g);
    endTurn(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(canAttackAnything(g, k)).toBe(true);
  });

  it('"up to 1": choosing nothing stops nobody', () => {
    const g = cast(9);
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    endTurn(g);
    expect(canAttackAnything(g, at(g, 'p2', 'characters', SC15.red5))).toBe(true);
  });

  it('at most one Character is stopped even when two qualify', () => {
    const g = cast(9);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('the Character can still be attacked and still block: only its attacks are stopped', () => {
    const g = cast(9, [{ card: SC15.red5, rested: true }]);
    pickInst(g, [at(g, 'p2', 'characters', SC15.red5)]);
    expect(atMain(g)).toBe(true);
    expect(canHit(g, g.leader('p1'), at(g, 'p2', 'characters', SC15.red5))).toBe(true);
  });
});

describe('OP15-097 I Find It Embarrassing as a Human Being [Trigger]', () => {
  const defend = (trashN: number) =>
    theirs(
      LD15.shc,
      { life: [EMB, BLUE, BLUE, BLUE], trash: junk(trashN) },
      { characters: [SC15.red4, SC15.red6] },
    );

  it('activated from Life with 12 cards in the trash: the target cannot attack for the rest of the opponent’s turn', () => {
    const g = defend(12);
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    const k = at(g, 'p2', 'characters', SC15.red4);
    pickInst(g, [k]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(canAttackAnything(g, k)).toBe(false);
    expect(canAttackAnything(g, at(g, 'p2', 'characters', SC15.red6))).toBe(true);
  });

  it('with only 3 cards in the trash the Trigger resolves with no effect', () => {
    const g = defend(3);
    hitLeader(g);
    activateTrigger(g);
    expect(kind(g)).not.toBe('choose');
    expect(atMain(g, 'p2')).toBe(true);
    expect(canAttackAnything(g, at(g, 'p2', 'characters', SC15.red4))).toBe(true);
  });

  it('declined: the Life card goes to hand and no one is stopped', () => {
    const g = defend(12);
    hitLeader(g);
    declineTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(canAttackAnything(g, at(g, 'p2', 'characters', SC15.red4))).toBe(true);
  });
});
