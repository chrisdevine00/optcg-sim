/**
 * ST29-012 Monkey.D.Luffy (Character, Yellow, cost 1, 0 power, Counter +1000, {Straw Hat Crew}/{The
 * Four Emperors}/{Egghead}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to 1 of your
 * [Monkey.D.Luffy] cards.
 * [Trigger] Play this card."
 *
 * Rules: [Activate: Main] is used in my Main Phase (a Character may use it the turn it is played, CR
 * 10-2-?); [Once Per Turn] limits it to one use per turn; the DON!! given must be a RESTED DON!!
 * from the cost area and stays rested while attached; "your [Monkey.D.Luffy] cards" are the Leader
 * and Characters named exactly that; a given DON!! adds +1000 power on my turn (CR 6-5-5).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  C29,
  declineTrigger,
  don,
  fill,
  hand,
  hitLeader,
  ids29,
  inst,
  isMain,
  L29,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  theirs,
  useAbility,
} from './kit-st29a.ts';

const ID = 'ST29-012';

/** p1's Main Phase: Luffy (Character) on board with `rested` rested and `active` active DON!!. */
function board(o: {
  leader?: string;
  rested: number;
  active?: number;
  chars?: string[];
  fresh?: boolean;
}) {
  return mine(o.leader ?? L29.luffy, {
    characters: [o.fresh ? { card: ID, playedThisTurn: true } : ID, ...(o.chars ?? [])],
    costArea: { active: o.active ?? 0, rested: o.rested },
  });
}

describe('ST29-012 Luffy [Activate: Main][Once Per Turn]: give up to 1 rested DON!! to a [Monkey.D.Luffy] card', () => {
  it('printed values: cost 1, 0 power, Counter +1000', () => {
    const g = board({ rested: 1 });
    const c = inst(g, 'p1', 'characters', ID);
    expect(g.card(c).cost).toBe(1);
    expect(g.power(c)).toBe(0);
    expect(g.card(c).counter).toBe(1000);
  });

  it('gives 1 rested DON!! to the Monkey.D.Luffy Leader: the Leader gets +1000 and the DON!! leaves the rested pool', () => {
    const g = board({ rested: 2, active: 1 });
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(don(g)).toMatchObject({ active: 1, rested: 1, given: 1 });
    expect(isMain(g, 'p1')).toBe(true);
  });

  it('offers exactly my [Monkey.D.Luffy] cards: the Leader and this Character, not other Characters', () => {
    const g = board({ rested: 1, chars: [C29.c3] });
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L29.luffy, ID].sort());
  });

  it('this Character is itself a [Monkey.D.Luffy]: with a Leader of another name it is the only target', () => {
    const g = board({ leader: L29.croc, rested: 1 });
    useAbility(g, inst(g, 'p1', 'characters', ID));
    if (g.legal().some((a) => a.type === 'pick')) {
      expect(offeredIds(g)).toEqual([ID]);
      pickInst(g, [inst(g, 'p1', 'characters', ID)]);
    }
    expect(g.power(inst(g, 'p1', 'characters', ID))).toBe(1000);
    expect(don(g)).toMatchObject({ rested: 0, given: 1 });
  });

  it('a second [Monkey.D.Luffy] Character is a target as well', () => {
    const g = board({ rested: 1, chars: [ID] });
    useAbility(g, inst(g, 'p1', 'characters', ID, 0));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L29.luffy, ID, ID].sort());
  });

  it('only a RESTED DON!! can be given: with only active DON!! nothing is given', () => {
    const g = board({ rested: 0, active: 3 });
    const c = inst(g, 'p1', 'characters', ID);
    if (offeredAbilities(g, c).length) {
      useAbility(g, c);
      if (g.legal().some((a) => a.type === 'pick')) none(g);
    }
    expect(don(g)).toMatchObject({ active: 3, rested: 0, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the target pick may be left empty and no DON!! moves', () => {
    const g = board({ rested: 1 });
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    none(g);
    expect(don(g)).toMatchObject({ rested: 1, given: 0 });
  });

  it('[Once Per Turn]: after one use it is not offered again this turn, but is next turn', () => {
    const g = board({ rested: 2 });
    const c = inst(g, 'p1', 'characters', ID);
    useAbility(g, c);
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, c)).toEqual([]);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(isMain(g, 'p1')).toBe(true);
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toHaveLength(1);
  });

  it('it can be used the turn the Character is played (an Activate: Main has no summoning sickness)', () => {
    const g = board({ rested: 1, fresh: true });
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toHaveLength(1);
  });
});

describe('ST29-012 Luffy [Trigger] Play this card', () => {
  const hit = (leader: string) => {
    const g = theirs(leader, { life: [ID, ...fill(C29.c1, 3)] }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  };

  it('activating plays it, whatever my Leader is', () => {
    for (const leader of [L29.croc, L29.luffy]) {
      const g = hit(leader);
      activateTrigger(g);
      expect(ids29(g, 'p1', 'characters')).toEqual([ID]);
      expect(hand(g)).toEqual([]);
    }
  });

  it('declining adds it to my hand instead', () => {
    const g = hit(L29.croc);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(ids29(g, 'p1', 'characters')).toEqual([]);
  });
});
