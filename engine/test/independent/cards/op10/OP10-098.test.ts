/**
 * OP10-098 Liberation (Event, Black, cost 6, {Blackbeard Pirates}).
 *
 * Card text: "[Main] If the number of your Characters is at least 2 less than the number of your
 * opponent's Characters, K.O. up to 1 of your opponent's Characters with a base cost of 6 or less
 * and up to 1 of your opponent's Characters with a base cost of 4 or less.
 * [Trigger] Negate the effect of up to 1 of each of your opponent's Leader and Character cards
 * during this turn."
 *
 * Rules: CR 8-3-3 / RD 122 (a failed "If" ends the effect), CR 8-4-4-1 ("up to"), QA-OP10 OP10-098
 * (a "base cost" filter ignores cost modifiers: rulings.md RL-14 family), CR 10-1-5 ([Trigger]),
 * negation (CR 8-1-3-?): a negated card loses the text of its effects, including keywords.
 */
import { describe, expect, it } from 'vitest';
import { act, K } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  declineTrigger,
  hand,
  hitLeader,
  kw,
  LD10,
  mayDone,
  mine,
  need,
  none,
  offeredInst,
  pickInst,
  playId,
  SC10,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-098';

function main(p2: string[], own: string[] = []) {
  const g = mine(LD10.neutral, { hand: [ID], characters: own }, { characters: p2 });
  playId(g, ID);
  return g;
}

describe('OP10-098 Liberation [Main]: with 2 fewer Characters, K.O. up to 1 (base cost 6 or less) and up to 1 (base cost 4 or less)', () => {
  it('2 Characters against 0: the condition holds; both K.O.s are made, one per Character', () => {
    const g = main([SC10.c6, SC10.c4]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.c6)]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([SC10.c4, SC10.c6].sort());
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g)).toBe(true);
  });

  it('boundary: 1 fewer Character is not enough: nothing is K.O.d and no prompt is asked', () => {
    const g = main([SC10.c6, SC10.c4], [SC10.c2]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: exactly 2 fewer (1 of mine against 3) is enough', () => {
    const g = main([SC10.c6, SC10.c4, SC10.c2], [SC10.c1]);
    need(g, 'choose', 'p1');
  });

  it('equal numbers or more Characters of mine: the "If" fails and nothing happens', () => {
    const equal = main([SC10.c6], [SC10.c2]);
    expect(atMain(equal)).toBe(true);
    expect(equal.zone('p2', 'characters')).toHaveLength(1);
    const more = main([SC10.c6], [SC10.c2, SC10.c3]);
    expect(atMain(more)).toBe(true);
    expect(more.zone('p2', 'characters')).toHaveLength(1);
  });

  it('the cost-6 pick offers Characters of base cost 6 or less; cost 7 is not a candidate', () => {
    const g = main([SC10.c7, SC10.c6, SC10.c4]);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual(
      [g.find('p2', 'characters', SC10.c6), g.find('p2', 'characters', SC10.c4)].sort(),
    );
  });

  it('the cost-4 pick offers base cost 4 or less: cost 5 and 6 are not candidates', () => {
    const g = main([SC10.c6, SC10.c5, SC10.c4, SC10.c3]);
    pickInst(g, [g.find('p2', 'characters', SC10.c6)]);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual(
      [g.find('p2', 'characters', SC10.c4), g.find('p2', 'characters', SC10.c3)].sort(),
    );
  });

  it('both picks are "up to 1": either may be skipped on its own', () => {
    const g = main([SC10.c6, SC10.c4]);
    expect(mayDone(g)).toBe(true);
    none(g);
    need(g, 'choose', 'p1');
    expect(mayDone(g)).toBe(true);
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c6]);
    const h = main([SC10.c6, SC10.c4]);
    pickInst(h, [h.find('p2', 'characters', SC10.c6)]);
    none(h);
    expect(h.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c4]);
  });

  it('"base cost": a cost lowered by an effect does not make a Character eligible (base 7, now 6)', () => {
    // OP17-097 gives all opposing Characters -1 cost this turn: the cost-7 Character is 6 now.
    const g = mine(
      LD10.neutral,
      { hand: ['OP17-097', ID], characters: [SC10.c1] },
      { characters: [SC10.c7, SC10.c6, SC10.c5] },
    );
    playId(g, 'OP17-097');
    expect(g.card(g.find('p2', 'characters', SC10.c7)).cost).toBe(6);
    playId(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual(
      [g.find('p2', 'characters', SC10.c6), g.find('p2', 'characters', SC10.c5)].sort(),
    );
  });

  it('only opposing Characters are candidates: mine are never K.O.d', () => {
    const g = main([SC10.c4, SC10.c3], []);
    expect(offeredInst(g)).toEqual(
      [g.find('p2', 'characters', SC10.c4), g.find('p2', 'characters', SC10.c3)].sort(),
    );
  });

  it('cost 6: not playable with 5 active DON!!', () => {
    const g = mine(LD10.neutral, { hand: [ID], costArea: { active: 5, rested: 0 } });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});

describe("OP10-098 Liberation [Trigger]: negate the effect of up to 1 of each of the opponent's Leader and Character cards this turn", () => {
  /** p2's Leader OP05-022 has [Blocker]; p2's ST21-014 has [Rush]. */
  function trig() {
    const g = theirs(
      LD10.neutral,
      { life: [ID, BLUE, BLUE, BLUE] },
      { characters: [K.rushLuffy, SC10.c3] },
      'OP05-022',
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('asks for the opposing Leader, then for an opposing Character; both lose their keywords this turn', () => {
    const g = trig();
    expect(kw(g, g.leader('p2'))).toContain('Blocker');
    expect(kw(g, g.find('p2', 'characters', K.rushLuffy))).toContain('Rush');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.leader('p2')]);
    pickInst(g, [g.leader('p2')]);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual(
      g
        .zone('p2', 'characters')
        .map((c) => c.instance)
        .sort(),
    );
    pickInst(g, [g.find('p2', 'characters', K.rushLuffy)]);
    expect(kw(g, g.leader('p2'))).not.toContain('Blocker');
    expect(kw(g, g.find('p2', 'characters', K.rushLuffy))).not.toContain('Rush');
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 1 of each": skipping the Leader still lets a Character be negated, and the reverse', () => {
    const g = trig();
    activateTrigger(g);
    none(g);
    pickInst(g, [g.find('p2', 'characters', K.rushLuffy)]);
    expect(kw(g, g.leader('p2'))).toContain('Blocker');
    expect(kw(g, g.find('p2', 'characters', K.rushLuffy))).not.toContain('Rush');
    const h = trig();
    activateTrigger(h);
    pickInst(h, [h.leader('p2')]);
    none(h);
    expect(kw(h, h.leader('p2'))).not.toContain('Blocker');
    expect(kw(h, h.find('p2', 'characters', K.rushLuffy))).toContain('Rush');
  });

  it('at most one Character is negated even with two on the field', () => {
    const g = theirs(
      LD10.neutral,
      { life: [ID, BLUE, BLUE, BLUE] },
      { characters: [K.rushLuffy, 'OP01-120'] },
      'OP05-022',
    );
    hitLeader(g);
    activateTrigger(g);
    none(g);
    pickInst(g, [g.find('p2', 'characters', K.rushLuffy)]);
    expect(kw(g, g.find('p2', 'characters', 'OP01-120'))).toContain('Rush');
  });

  it('the negation lasts only this turn: the Leader has [Blocker] again on the next turn', () => {
    const g = trig();
    activateTrigger(g);
    pickInst(g, [g.leader('p2')]);
    none(g);
    expect(atMain(g, 'p2')).toBe(true);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(kw(g, g.leader('p2'))).toContain('Blocker');
  });

  it('declining the [Trigger]: the Event goes to my hand and nothing is negated', () => {
    const g = trig();
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(kw(g, g.leader('p2'))).toContain('Blocker');
    expect(kw(g, g.find('p2', 'characters', K.rushLuffy))).toContain('Rush');
  });
});
