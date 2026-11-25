/**
 * OP09-097 Black Vortex (Event, Black, cost 2, {Blackbeard Pirates}).
 *
 * Card text: "[Counter] Negate the effect of up to 1 of your opponent's Leader or Character cards and
 * give that card -4000 power during this turn.
 * [Trigger] Negate the effect of up to 1 of your opponent's Leader or Character cards during this turn."
 *
 * Rules: CR 10-2-4 ([Counter]), CR 8-4-4 ("up to"), a negated card loses its effects and keywords,
 * "during this turn" lasts to the end of the turn (not just the battle).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  attack,
  BLUE,
  C9,
  canCounterNow,
  choices,
  counterSpot,
  don,
  endCounter,
  endTurn,
  hitLeader,
  kind,
  L9,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  reachablePickSets,
  theirs,
  trash,
  useEvent,
} from './kit-op09d.ts';

const ID = 'OP09-097';

describe('OP09-097 Black Vortex: [Counter] negate the effect of up to 1 opposing Leader or Character and give it -4000 this turn', () => {
  /** p2's Double Attack Luffy (7000) attacks my Leader; I hold Black Vortex with 2 active DON!!. */
  function spot(o: { mine?: string[]; opp?: string[]; active?: number } = {}) {
    return counterSpot(
      L9.neutral,
      { hand: [ID], characters: o.mine ?? [], costArea: { active: o.active ?? 2, rested: 0 } },
      { characters: [C9.doubleAtk, ...(o.opp ?? [])] },
      C9.doubleAtk,
    );
  }

  it('printed effect: the attacker loses its effect ([Double Attack]) and gets -4000 (7000 to 3000); it no longer beats my 5000 Leader', () => {
    const g = spot();
    const luffy = g.find('p2', 'characters', C9.doubleAtk);
    expect(g.card(luffy).keywords).toContain('Double Attack');
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [luffy]);
    expect(g.power(luffy)).toBe(3000);
    expect(g.card(luffy).keywords).not.toContain('Double Attack');
    endCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
  });

  it('candidates: the opposing Leader and Characters; never my own Leader or Characters', () => {
    const g = spot({ mine: [C9.c3], opp: [C9.c4] });
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([C9.c4, C9.doubleAtk, 'ST01-001'].sort());
  });

  it('the opposing Leader can be the target: its attack drops from 5000 to 1000 and it is no longer a threat', () => {
    const g = theirs(L9.neutral, {
      hand: [ID],
      life: [BLUE, BLUE, BLUE, BLUE],
      costArea: { active: 2, rested: 0 },
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useEvent(g, ID);
    pickInst(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(1000);
    endCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('"during this turn": the -4000 is still there after the battle, in the rest of the opponent\'s turn', () => {
    const g = spot();
    useEvent(g, ID);
    pickInst(g, [g.find('p2', 'characters', C9.doubleAtk)]);
    endCounter(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.find('p2', 'characters', C9.doubleAtk))).toBe(3000);
    expect(g.card(g.find('p2', 'characters', C9.doubleAtk)).keywords).not.toContain(
      'Double Attack',
    );
  });

  it('it ends with the turn: on my next turn the Character has its power and effect again', () => {
    const g = spot();
    useEvent(g, ID);
    pickInst(g, [g.find('p2', 'characters', C9.doubleAtk)]);
    endCounter(g);
    endTurn(g);
    need(g, 'main', 'p1');
    const luffy = g.find('p2', 'characters', C9.doubleAtk);
    expect(g.power(luffy)).toBe(7000);
    expect(g.card(luffy).keywords).toContain('Double Attack');
  });

  it('"up to 1": choosing nothing negates nothing and changes no power; the attack connects with [Double Attack]', () => {
    const g = spot();
    useEvent(g, ID);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
    none(g);
    const luffy = g.find('p2', 'characters', C9.doubleAtk);
    expect(g.power(luffy)).toBe(7000);
    expect(g.card(luffy).keywords).toContain('Double Attack');
    endCounter(g);
    expect(g.life('p1')).toBe(2);
  });

  it('at most one card is affected: a second opposing Character keeps its power', () => {
    const g = spot({ opp: [C9.c4] });
    useEvent(g, ID);
    pickInst(g, [g.find('p2', 'characters', C9.doubleAtk)]);
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(6000);
  });

  it('it costs 2 DON!!: with 1 active DON!! it cannot be used', () => {
    const g = spot({ active: 1 });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });

  it('must not happen: no -4000 and no negation on my own side', () => {
    const g = spot({ mine: [C9.c3] });
    useEvent(g, ID);
    pickInst(g, [g.find('p2', 'characters', C9.doubleAtk)]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', C9.c3))).toBe(5000);
  });
});

describe('OP09-097 [Trigger] negate the effect of up to 1 opposing Leader or Character during this turn', () => {
  function hit() {
    const g = theirs(L9.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: [C9.franky] });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('activating offers the opposing Leader and Characters; the chosen Character loses its keyword, with no power change', () => {
    const g = hit();
    const franky = g.find('p2', 'characters', C9.franky);
    expect(g.card(franky).keywords).toContain('Blocker');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.franky, 'ST01-001'].sort());
    pickInst(g, [franky]);
    expect(g.card(franky).keywords).not.toContain('Blocker');
    expect(g.power(franky)).toBe(5000);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": choosing nothing negates nothing', () => {
    const g = hit();
    activateTrigger(g);
    none(g);
    expect(g.card(g.find('p2', 'characters', C9.franky)).keywords).toContain('Blocker');
  });

  it('declining puts the Event into my hand', () => {
    const g = hit();
    g.act({ type: 'trigger', activate: false });
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([ID]);
    expect(kind(g)).toBe('main');
  });
});
