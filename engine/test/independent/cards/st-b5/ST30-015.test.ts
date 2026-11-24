/**
 * ST30-015 The Name of This Era Is "Whitebeard"!! (Event, Red, cost 1, {Whitebeard Pirates}).
 *
 * Card text: "[Counter] If you have 2 or more Characters with 6000 base power, up to 1 of your
 * Leader or Character cards gains +4000 power during this battle.
 * [Trigger] K.O. up to 1 of your opponent's Characters with 6000 power or less."
 *
 * Rules: an Event [Counter] costs its DON!! and is used in the opponent's Counter Step (CR 7-1-3-1-2),
 * a failed "If" stops the effect but the Event was still used (CR 8-3-3), "6000 base power" is
 * exactly 6000 base (RL-49), "up to 1" allows 0, "during this battle" ends with the battle (RL-08),
 * "6000 power or less" is current power at or below 6000, a [Trigger] costs no DON!! (CR 10-1-5-1).
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  activateTrigger,
  attack,
  BLUE,
  canCounterNow,
  choices,
  declineTrigger,
  decision,
  don,
  hand,
  hitLeader,
  kind,
  lifeCards,
  mayChooseNone,
  need,
  none,
  noDefence,
  offeredIds,
  passBlock,
  pickInst,
  pw,
  SL,
  theirs,
  trash,
  act,
} from './kit-stb5a.ts';

const ID = 'ST30-015';
const HAJ = 'OP01-018'; // Red, 6000
const JIL = 'OP03-006'; // Red, 6000
const KING = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023'; // Red, 5000

type Placed = string | { card: string; rested?: boolean; don?: number };

/** p2's 5000 Leader attacks p1's 5000 Leader; p1 is in the Counter Step with the Event in hand. */
function counterStep(chars: Placed[], active = 5, inHand: string[] = [ID]) {
  const g = theirs(
    SL.luffy,
    { characters: chars, hand: inHand, costArea: { active, rested: 0 } },
    { characters: [] },
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe('ST30-015: [Counter] with 2 or more 6000-base Characters, +4000 to my Leader or a Character', () => {
  it('with exactly two 6000-base Characters the Leader gets +4000 and the attack fails', () => {
    const g = counterStep([HAJ, JIL]);
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')).toHaveLength(4);
  });

  it('costs 1 DON!! and the Event goes to the trash', () => {
    const g = counterStep([HAJ, JIL]);
    activateCounter(g, g.find('p1', 'hand', ID));
    pickInst(g, [g.leader('p1')]);
    expect(don(g).rested).toBe(1);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('with only one 6000-base Character the condition fails: used, but no boost', () => {
    const g = counterStep([HAJ, MARCO]);
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([ID]);
  });

  it('Characters with 7000 and 5000 base power do not count (exactly 6000)', () => {
    const g = counterStep([KING, MARCO, HAJ]);
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('two 6000-base Characters of three still count when a different one is also present', () => {
    const g = counterStep([HAJ, KING, JIL]);
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
  });

  it("my Leader and Characters are candidates, the opponent's are not", () => {
    const g = counterStep([HAJ, JIL, KING]);
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([HAJ, JIL, KING, SL.luffy].sort());
  });

  it('the boost may go to a Character instead of the Leader, and only to one card', () => {
    const g = counterStep([HAJ, JIL]);
    activateCounter(g, g.find('p1', 'hand', ID));
    pickInst(g, [g.find('p1', 'characters', JIL)]);
    expect(pw(g, 'p1', JIL)).toBe(10000);
    expect(pw(g, 'p1', HAJ)).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose nothing; no boost', () => {
    const g = counterStep([HAJ, JIL]);
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost lasts only for this battle', () => {
    const g = counterStep([HAJ, JIL]);
    activateCounter(g, g.find('p1', 'hand', ID));
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('cannot be used with no active DON!! (cost 1)', () => {
    const g = counterStep([HAJ, JIL], 0);
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });

  it('without the Event the same attack connects (control)', () => {
    const g = counterStep([HAJ, JIL], 5, []);
    act(g, { type: 'endCounter' });
    expect(decision(g)?.kind === 'trigger' || g.life('p1') === 3).toBe(true);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });
});

describe('ST30-015: [Trigger] K.O. up to 1 opposing Character with 6000 power or less', () => {
  function triggered(p2chars: Placed[]) {
    const g = theirs(
      SL.luffy,
      { life: [ID, BLUE, BLUE, BLUE], costArea: { active: 0, rested: 0 } },
      { characters: p2chars },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('offers the opposing Characters with 6000 power or less (6000, 5000), not 7000', () => {
    const g = triggered([HAJ, MARCO, KING]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, MARCO].sort());
  });

  it('K.O.s the chosen Character, costs no DON!!, and the card is trashed', () => {
    const g = triggered([HAJ, KING]);
    activateTrigger(g);
    pickInst(g, [g.find('p2', 'characters', HAJ)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([KING]);
    expect(trash(g, 'p2')).toEqual([HAJ]);
    expect(trash(g)).toEqual([ID]);
    expect(don(g).rested).toBe(0);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = triggered([HAJ]);
    activateTrigger(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('declined: the card goes to hand and nothing is K.O.d', () => {
    const g = triggered([HAJ]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
