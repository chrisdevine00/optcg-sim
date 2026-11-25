/**
 * ST25-004 Buggy (Character, Blue, cost 4, 1000, Counter +1000, {The Four Emperors}/{Cross Guild}).
 *
 * Card text: [Activate: Main] You may trash 1 card from your hand and trash this Character: If your
 * Leader is [Buggy], play up to 1 "Cross Guild" type Character card with a cost of 6 or less from
 * your hand.
 *
 * The "If" is after the colon: an effect condition. With another Leader the cost is still paid and
 * nothing is played. The cost is optional ("You may").
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  deck,
  hand,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  trash,
  yes,
} from '../op17/kit-op17b.ts';
import { chars } from '../m4b/kit-a.ts';
import { hasEvent } from '../kit.ts';
import { inst, kind, LC, SCL } from './kit-lfc.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import type { InstanceId } from '@optcg/engine';

const BUGGY = 'ST25-004';
const ALVIDA = 'ST25-001';
const CABAJI = 'ST25-002';

function game(
  leader: string,
  handCards: string[],
  characters: string[] = [BUGGY],
  extra: Record<string, unknown> = {},
) {
  return mine(leader, {
    hand: handCards,
    characters,
    deck: [BLUE, BLUE, BLUE, BLUE, BLUE, BLUE],
    costArea: { active: 10, rested: 0 },
    ...extra,
  });
}

/** Activate Buggy's ability and pay the cost with `fodder` (a hand instance); stops at the first non-cost decision. */
function activateAndPay(g: TestGame, fodder: InstanceId): void {
  const buggy = inst(g, 'p1', 'characters', BUGGY);
  const [ability] = offeredAbilities(g, buggy);
  if (!ability) throw new Error('No ability offered');
  act(g, { type: 'activate', card: buggy, ability });
  if (kind(g) === 'optional') yes(g, 'p1');
  if (kind(g) === 'choose' && need(g, 'choose').purpose === 'cost') {
    act(g, { type: 'pick', choice: fodder });
  }
}

describe('ST25-004 Buggy: [Activate: Main] trash a card and this Character: with Leader [Buggy], play a Cross Guild cost 6 or less', () => {
  it('with Leader [Buggy]: offers exactly the Cross Guild Characters of cost 6 or less in hand, and plays the chosen one', () => {
    const g = game(LC.buggy, [SCL.cg5, SCL.cg6, SCL.cg7, SCL.c3, SCL.c2]);
    activateAndPay(g, inst(g, 'p1', 'hand', SCL.c2));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCL.cg5, SCL.cg6].sort());
    pickInst(g, [inst(g, 'p1', 'hand', SCL.cg6)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([SCL.cg6]);
    expect(trash(g).sort()).toEqual([BUGGY, SCL.c2].sort());
    expect(hand(g)).toEqual([SCL.cg5, SCL.cg7, SCL.c3].sort());
  });

  it('the cost card may be any card of the hand, including a card that could have been played', () => {
    const g = game(LC.buggy, [SCL.cg5, SCL.cg6]);
    activateAndPay(g, inst(g, 'p1', 'hand', SCL.cg6));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCL.cg5]);
    pickInst(g, [inst(g, 'p1', 'hand', SCL.cg5)]);
    expect(chars(g)).toEqual([SCL.cg5]);
    expect(trash(g).sort()).toEqual([BUGGY, SCL.cg6].sort());
  });

  it('"up to 1": may play nothing, and the cost stays paid', () => {
    const g = game(LC.buggy, [SCL.cg5, SCL.c2]);
    activateAndPay(g, inst(g, 'p1', 'hand', SCL.c2));
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(trash(g).sort()).toEqual([BUGGY, SCL.c2].sort());
    expect(hand(g)).toEqual([SCL.cg5]);
  });

  it('with a Leader that is not [Buggy]: the cost is paid (the "If" is an effect condition) and nothing is played', () => {
    const g = game(LC.plain, [SCL.cg5, SCL.c2]);
    activateAndPay(g, inst(g, 'p1', 'hand', SCL.c2));
    if (kind(g) === 'choose') {
      // An empty target pick is acceptable; nothing can be chosen.
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(trash(g).sort()).toEqual([BUGGY, SCL.c2].sort());
    expect(hand(g)).toEqual([SCL.cg5]);
  });

  it('Buggy is trashed as a cost, not K.O.ed: no K.O. event is raised', () => {
    const g = game(LC.buggy, [SCL.cg5, SCL.c2]);
    activateAndPay(g, inst(g, 'p1', 'hand', SCL.c2));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SCL.cg5)]);
    expect(trash(g)).toContain(BUGGY);
    expect(hasEvent(g, 'KO')).toBe(false);
  });

  it('with an empty hand the cost cannot be paid: not offered, or offered with no way to accept', () => {
    const g = game(LC.buggy, []);
    const buggy = inst(g, 'p1', 'characters', BUGGY);
    const offered = offeredAbilities(g, buggy);
    if (offered.length > 0) {
      act(g, { type: 'activate', card: buggy, ability: offered[0]! });
      if (kind(g) === 'optional') {
        expect(g.decider).toBe('p1');
        expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        act(g, { type: 'optional', accept: false });
      }
    }
    expect(chars(g)).toEqual([BUGGY]);
    expect(trash(g)).toEqual([]);
  });

  it('a played Cross Guild Character uses its own [On Play] (Alvida with Leader [Buggy] draws 3 and trashes 2)', () => {
    const g = game(LC.buggy, [ALVIDA, SCL.c2]);
    activateAndPay(g, inst(g, 'p1', 'hand', SCL.c2));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', ALVIDA)]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(3);
    expect(deck(g)).toHaveLength(3);
  });

  it('with the Character area full, trashing Buggy as the cost frees the slot: no replacement question appears', () => {
    const g = game(LC.buggy, [SCL.cg5, SCL.c2], [BUGGY, SCL.c3, SCL.c4, SCL.c5, SCL.c6]);
    activateAndPay(g, inst(g, 'p1', 'hand', SCL.c2));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SCL.cg5)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([SCL.c3, SCL.c4, SCL.c5, SCL.c6, SCL.cg5].sort());
  });

  it('Buggy played this turn can still use the ability (an [Activate: Main] has no summoning-sickness limit)', () => {
    const g = mine(LC.buggy, {
      hand: [SCL.cg5, SCL.c2],
      characters: [{ card: BUGGY, playedThisTurn: true }],
      deck: [BLUE, BLUE, BLUE],
    });
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', BUGGY))).toHaveLength(1);
  });

  it('a Cross Guild Character with a cost of exactly 6 may be played, one of cost 7 may not (boundary)', () => {
    const g = game(LC.buggy, [SCL.cg6, SCL.cg7, SCL.c2, CABAJI]);
    activateAndPay(g, inst(g, 'p1', 'hand', SCL.c2));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCL.cg6, CABAJI].sort());
  });
});
