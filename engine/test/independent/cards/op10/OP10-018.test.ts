/**
 * OP10-018 Ten-Layer Igloo (Event, Red, cost 2, {Donquixote Pirates}/{Punk Hazard}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +3000 power during this
 * battle. Then, give up to 1 of your opponent's Leader or Character cards -2000 power during this
 * turn.
 * [Trigger] Up to 1 of your Leader or Character cards gains +1000 power during this turn."
 *
 * Rules: CR 8-4-4-1 ("up to"), RL-08 ("during this battle" ends with the battle), RL-09 ("during
 * this turn"), CR 8-3-1-3 (a Counter needs its cost in active DON!!), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { act, passCounter } from '../../helpers.ts';
import {
  activateCounter,
  activateTrigger,
  atMain,
  BLUE,
  canCounterNow,
  declineTrigger,
  defend,
  hand,
  hitLeader,
  LD10,
  mayDone,
  need,
  none,
  offeredInst,
  pickInst,
  SC10,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-018';

function ready(o: { chars?: string[]; p2chars?: string[]; active?: number } = {}) {
  const g = defend({
    hand: [ID],
    active: o.active ?? 2,
    chars: o.chars ?? [SC10.c4],
    p2chars: o.p2chars ?? [SC10.c5],
  });
  activateCounter(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP10-018 Ten-Layer Igloo [Counter]: +3000 this battle, then -2000 to an opposing card this turn', () => {
  it('+3000 on my Leader makes 8000 beat the 5000 attacker; the opposing Leader is then given -2000', () => {
    const g = ready();
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('the +3000 may go to one of my Characters instead of the Leader', () => {
    const g = ready();
    const c4 = g.find('p1', 'characters', SC10.c4);
    pickInst(g, [c4]);
    expect(g.power(c4)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('first pick offers only my own Leader and Characters; second only the opponent Leader and Characters', () => {
    const g = ready({ p2chars: [SC10.c5, SC10.c6] });
    const mine = [g.leader('p1'), g.find('p1', 'characters', SC10.c4)].sort();
    expect(offeredInst(g)).toEqual(mine);
    pickInst(g, [g.leader('p1')]);
    const theirsIds = [g.leader('p2'), ...g.zone('p2', 'characters').map((c) => c.instance)].sort();
    expect(offeredInst(g)).toEqual(theirsIds);
  });

  it('the -2000 may go to an opposing Character and lasts after the battle, to the end of the turn', () => {
    const g = ready({ p2chars: [SC10.c5, SC10.c6] });
    const c6 = g.find('p2', 'characters', SC10.c6);
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [c6]);
    expect(g.power(c6)).toBe(6000);
    passCounter(g);
    // The battle is over: the +3000 is gone, the -2000 ("during this turn") is not.
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(c6)).toBe(6000);
    act(g, { type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', SC10.c6))).toBe(8000);
  });

  it('"up to 1": the +3000 may be refused; the second pick may then still be made without raising my power', () => {
    const g = ready();
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    // Every reading shares: if the opposing pick is asked it offers only opposing cards.
    if (mayDone(g)) {
      const opp = [g.leader('p2'), g.find('p2', 'characters', SC10.c5)].sort();
      expect(offeredInst(g)).toEqual(opp);
      none(g);
    }
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('"up to 1": after the +3000, the -2000 may be refused', () => {
    const g = ready();
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('the +3000 can decide a battle against my Character: 6000 + 3000 beats a 7000 attacker', () => {
    const g = defend({
      hand: [ID],
      active: 2,
      chars: [{ card: SC10.c4, rested: true }],
      p2chars: [SC10.c5],
      attackerCard: SC10.c5,
      targetCard: SC10.c4,
    });
    activateCounter(g, g.find('p1', 'hand', ID));
    pickInst(g, [g.find('p1', 'characters', SC10.c4)]);
    pickInst(g, [g.leader('p2')]);
    passCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SC10.c4]);
  });

  it('cost 2: with only 1 active DON!! the Event cannot be used as a Counter', () => {
    const g = defend({ hand: [ID], active: 1, chars: [SC10.c4], p2chars: [SC10.c5] });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });

  it('the Event is trashed after it resolves and the 2 DON!! are rested', () => {
    const g = ready();
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [g.leader('p2')]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('must not: it is a [Counter] only card and cannot be played in the Main Phase', () => {
    const g = theirs(LD10.neutral, { hand: [ID] });
    act(g, { type: 'endTurn' });
    // p1 is now active with Igloo in hand: no playCard action is offered for it.
    expect(atMain(g)).toBe(true);
    const igloo = g.find('p1', 'hand', ID);
    expect(g.legal().some((a) => a.type === 'playCard' && a.card === igloo)).toBe(false);
  });
});

describe('OP10-018 Ten-Layer Igloo [Trigger]: up to 1 Leader or Character +1000 this turn', () => {
  function start() {
    const g = theirs(LD10.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: [SC10.c2] });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('gives my Leader +1000 for the turn and the Event is trashed', () => {
    const g = start();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('offers only my own Leader and Characters; "up to 1" may choose nothing', () => {
    const g = theirs(
      LD10.neutral,
      { life: [ID, BLUE, BLUE, BLUE], characters: [SC10.c3] },
      { characters: [SC10.c2] },
    );
    hitLeader(g);
    activateTrigger(g);
    expect(offeredInst(g)).toEqual([g.leader('p1'), g.find('p1', 'characters', SC10.c3)].sort());
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the [Trigger] adds the Event to my hand with no boost', () => {
    const g = start();
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the +1000 lasts the whole turn, not just the battle', () => {
    const g = start();
    activateTrigger(g);
    pickInst(g, [g.leader('p1')]);
    // The battle that dealt the damage is over; the boost is a "this turn" boost, not a battle one.
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });
});
