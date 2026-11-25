/**
 * ST21-016 Gum-Gum Dawn Whip (Red Event, cost 2, {Straw Hat Crew}/{The Four Emperors}).
 * "[Main] Up to 1 of your Leader or Character cards gains +1000 power during this turn. Then, up to
 * 1 of your opponent's Characters with 4000 power or less cannot activate [Blocker] during this turn.
 * [Trigger] K.O. up to 1 of your opponent's Characters with 4000 power or less."
 * Rules: both targets are "up to 1"; the Blocker restriction targets a Character of 4000 power or
 * less and lasts this turn only; a [Trigger] resolves when the Life card is revealed.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  atMain,
  attack,
  blockers,
  BLUE,
  cost,
  declineTrigger,
  hand,
  hitLeader,
  inst,
  kind,
  LD,
  many,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  pickInst,
  playId,
  SC,
  theirs,
  trash,
} from './kit-st1821a.ts';

const ID = 'ST21-016';
const SENTOMARU = 'ST21-007'; // red, cost 2, 2000, [Blocker]
const FRANKY5 = 'OP09-072'; // purple, cost 4, 5000, [Blocker]

function start(opp: string[], mineChars: string[] = [SC.c3]) {
  return mine(
    LD.luffy,
    { hand: [ID], characters: mineChars, ...cost(10) },
    { characters: opp, life: many(BLUE, 4) },
  );
}

describe('ST21-016 Gum-Gum Dawn Whip: [Main] +1000 power, then a Character cannot activate [Blocker]', () => {
  it('first offers my Leader and my Characters (only mine) for the +1000', () => {
    const g = start([SENTOMARU]);
    playId(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c3, LD.luffy].sort());
    const picks = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []))
      .sort();
    expect(picks).toEqual([g.leader('p1'), inst(g, 'p1', 'characters', SC.c3)].sort());
  });

  it('the chosen card gains exactly +1000 power this turn', () => {
    const g = start([SENTOMARU]);
    playId(g, ID);
    pickInst(g, [g.leader('p1')]);
    pickCards(g, [SENTOMARU]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(inst(g, 'p1', 'characters', SC.c3))).toBe(5000);
  });

  it('the +1000 ends with the turn', () => {
    const g = start([SENTOMARU]);
    playId(g, ID);
    pickInst(g, [inst(g, 'p1', 'characters', SC.c3)]);
    pickCards(g, [SENTOMARU]);
    expect(g.power(inst(g, 'p1', 'characters', SC.c3))).toBe(6000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(inst(g, 'p1', 'characters', SC.c3))).toBe(5000);
  });

  it('the second target offers only opposing Characters with 4000 power or less (5000 is not offered)', () => {
    const g = start([SENTOMARU, FRANKY5, SC.c2]);
    playId(g, ID);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SENTOMARU, SC.c2].sort());
  });

  it('the chosen Blocker cannot be declared when I attack this turn; the Leader is not blocked', () => {
    const g = start([SENTOMARU]);
    playId(g, ID);
    pickInst(g, [g.leader('p1')]);
    pickCards(g, [SENTOMARU]);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
    passBlock(g);
  });

  it('an unchosen Blocker still blocks (the restriction names one Character)', () => {
    const g = start([SENTOMARU, FRANKY5]);
    playId(g, ID);
    pickInst(g, [g.leader('p1')]);
    pickCards(g, [SENTOMARU]);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', FRANKY5)]);
  });

  it('"during this turn": on my next turn the same Blocker can block again', () => {
    const g = start([SENTOMARU]);
    playId(g, ID);
    pickInst(g, [g.leader('p1')]);
    pickCards(g, [SENTOMARU]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', SENTOMARU)]);
  });

  it('"up to 1": choosing nobody for the restriction leaves the Blocker able to block', () => {
    const g = start([SENTOMARU]);
    playId(g, ID);
    pickInst(g, [g.leader('p1')]);
    none(g);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', SENTOMARU)]);
  });

  it('the Event costs 2 and goes to my trash after resolving', () => {
    const g = start([SENTOMARU]);
    playId(g, ID);
    pickInst(g, [g.leader('p1')]);
    pickCards(g, [SENTOMARU]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});

describe('ST21-016 Gum-Gum Dawn Whip: [Trigger] K.O. up to 1 opposing Character with 4000 power or less', () => {
  function hit(opp: string[]) {
    const g = theirs(LD.luffy, { life: [ID, BLUE, BLUE, BLUE] }, { characters: opp });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('offers exactly the opposing Characters of 4000 power or less and K.O.s the pick', () => {
    const g = hit([SC.c1, SC.c2, SC.c3, SC.c4]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c1, SC.c2].sort());
    pickCards(g, [SC.c2]);
    expect(trash(g, 'p2')).toEqual([SC.c2]);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(trash(g)).toEqual([ID]);
  });

  it('power boundary: 4000 qualifies, 5000 does not; "up to 1" allows nobody', () => {
    const g = hit([SC.c2, SC.c3]);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([SC.c2]);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('declining the [Trigger]: the Event goes to my hand and nobody is K.O.d', () => {
    const g = hit([SC.c2]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
