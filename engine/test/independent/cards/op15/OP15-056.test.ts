/**
 * OP15-056 Would You Let Me Eat the Flame-Flame Fruit? (Event, Blue, cost 7, {Revolutionary Army}/
 * {Dressrosa}).
 *
 * Card text: "[Main] Draw 2 cards. Then, your [Lucy] Leader gains [Double Attack] and +3000 power during
 * this turn. [Trigger] Draw 2 cards."
 *
 * Rules: CR 4-5-3 (draw X), CR 10-1-2 ([Double Attack]: 2 damage to a Leader), CR 8-1-4-2 ("during
 * this turn"), CR 10-1-5 ([Trigger] from Life), CR 4-10-2 (a "then" clause).
 * Scenery: OP15-002 Lucy (Leader, 5000, 4 Life) is the named Leader.
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  deck,
  don,
  hand,
  hitLeader,
  isLegal,
  kind,
  kws,
  LD15,
  mine,
  need,
  playRaw,
  SCN,
  theirs,
  toMyNextMain,
  trash,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVENT = 'OP15-056';
const DRAW = [SCN.c2, SCN.c3, BLUE, BLUE, BLUE];

function start(leader: string, p2Leader?: string): TestGame {
  return mine(leader, { hand: [EVENT], deck: DRAW }, {}, p2Leader);
}

describe('OP15-056 Would You Let Me Eat the Flame-Flame Fruit?: [Main] draw 2, then my [Lucy] Leader gains [Double Attack] and +3000', () => {
  it('with a [Lucy] Leader: draws 2, the Leader gains [Double Attack] and +3000 (5000 -> 8000)', () => {
    const g = start(LD15.lucy);
    playRaw(g, EVENT);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(deck(g)).toHaveLength(3);
    expect(kws(g, g.leader('p1'))).toContain('Double Attack');
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('the attack really deals 2 damage to the opponent’s Leader', () => {
    const g = start(LD15.lucy);
    playRaw(g, EVENT);
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
  });

  it('control: without the Event the same attack deals 1 damage', () => {
    const g = mine(LD15.lucy, { hand: [EVENT], deck: DRAW });
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('with a Leader that is not [Lucy]: still draws 2, but no keyword and no power', () => {
    const g = start(LD15.dressrosa);
    playRaw(g, EVENT);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(kws(g, g.leader('p1'))).not.toContain('Double Attack');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"during this turn": the keyword and the power are gone on my next turn', () => {
    const g = start(LD15.lucy);
    playRaw(g, EVENT);
    toMyNextMain(g);
    expect(kws(g, g.leader('p1'))).not.toContain('Double Attack');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not: the opponent’s [Lucy] Leader gains nothing from my Event', () => {
    const g = start(LD15.shc, LD15.lucy);
    playRaw(g, EVENT);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(kws(g, g.leader('p2'))).not.toContain('Double Attack');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('cost 7: playable with 7 active DON!!, not with 6', () => {
    const seven = mine(LD15.lucy, {
      hand: [EVENT],
      deck: DRAW,
      costArea: { active: 7, rested: 0 },
    });
    expect(isLegal(seven, { type: 'playCard', card: seven.find('p1', 'hand', EVENT) })).toBe(true);
    const six = mine(LD15.lucy, { hand: [EVENT], deck: DRAW, costArea: { active: 6, rested: 0 } });
    expect(isLegal(six, { type: 'playCard', card: six.find('p1', 'hand', EVENT) })).toBe(false);
  });

  it('paying the cost rests 7 DON!!', () => {
    const g = start(LD15.lucy);
    playRaw(g, EVENT);
    expect(don(g)).toMatchObject({ active: 3, rested: 7 });
  });

  it('draws even with only 2 cards left in the deck', () => {
    const g = mine(LD15.lucy, { hand: [EVENT], deck: [SCN.c2, SCN.c3] });
    playRaw(g, EVENT);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(deck(g)).toHaveLength(0);
  });

  it('[Trigger]: revealed from Life it draws 2 cards and gives no [Double Attack] or power', () => {
    const g = theirs(
      LD15.lucy,
      { life: [EVENT, BLUE, BLUE, BLUE], deck: DRAW },
      { costArea: { active: 0, rested: 0 } },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(g.life('p1')).toBe(3);
    expect(kws(g, g.leader('p1'))).not.toContain('Double Attack');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([EVENT]);
    expect(kind(g)).toBe('main');
  });
});
