/**
 * ST25-003 Crocodile & Mihawk (Character, Blue, cost 8, 7000, no Counter, {Former Baroque Works}/{Cross Guild}).
 *
 * Card text:
 *   [On Play] Draw 2 cards and trash 1 card from your hand. Then, play up to 1 "Cross Guild" type
 *   Character card with a cost of 4 or less from your hand.
 *   [Once Per Turn] If your "Cross Guild" type Character would be removed from the field by your
 *   opponent's effect, you may trash 1 card from your hand instead.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  chars,
  deck,
  hand,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickInst,
  theirs,
  trash,
  yes,
} from '../op17/kit-op17b.ts';
import { choose } from '../kit.ts';
import { handInstances, inst, kind, LC, opponentKOs, playRaw, SCL, SCN2 } from './kit-lfc.ts';
import { hasEvent } from '../kit.ts';

const CM = 'ST25-003';
const CABAJI = 'ST25-002'; // Cross Guild, cost 4, 1000 power
const MOHJI = 'ST25-005'; // Cross Guild, cost 4, 1000 power

function play(handCards: string[], deckTop: string[] = [BLUE, BLUE, BLUE, BLUE, BLUE]) {
  return mine(LC.plain, {
    hand: [CM, ...handCards],
    deck: deckTop,
    costArea: { active: 8, rested: 0 },
  });
}

describe('ST25-003 Crocodile & Mihawk: [On Play] draw 2, trash 1, play a Cross Guild cost 4 or less; replacement for Cross Guild removals', () => {
  it('[On Play]: draws 2, trashes 1, then offers only Cross Guild Characters of cost 4 or less', () => {
    const g = play([CABAJI, SCL.cg5, SCL.c3, SCL.c2]);
    const before = handInstances(g);
    playRaw(g, CM);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(6);
    expect(handInstances(g).filter((i) => !before.includes(i))).toHaveLength(2);
    pickInst(g, [inst(g, 'p1', 'hand', SCL.c2)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CABAJI]);
    pickInst(g, [inst(g, 'p1', 'hand', CABAJI)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([CM, CABAJI].sort());
    expect(trash(g)).toEqual([SCL.c2]);
    expect(hand(g)).toHaveLength(4);
    expect(deck(g)).toHaveLength(3);
  });

  it('the trash comes before the play: the only eligible card, if trashed, cannot be played', () => {
    const g = play([CABAJI, SCL.c3]);
    playRaw(g, CM);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', CABAJI)]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([CM]);
    expect(trash(g)).toEqual([CABAJI]);
  });

  it('a card drawn by the effect may be the one played', () => {
    const g = play([SCL.c3], [MOHJI, BLUE, BLUE, BLUE]);
    playRaw(g, CM);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SCL.c3)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MOHJI]);
    pickInst(g, [inst(g, 'p1', 'hand', MOHJI)]);
    expect(chars(g)).toEqual([CM, MOHJI].sort());
  });

  it('cost boundary: a Cross Guild Character of cost 5 and a cost 4 non-Cross Guild one are not offered', () => {
    const g = play([SCL.cg5, SCL.cg5b, SCL.c4, SCL.c2]);
    playRaw(g, CM);
    pickInst(g, [inst(g, 'p1', 'hand', SCL.c2)]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([CM]);
  });

  it('"up to 1": may play nothing', () => {
    const g = play([CABAJI, SCL.c2]);
    playRaw(g, CM);
    pickInst(g, [inst(g, 'p1', 'hand', SCL.c2)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([CM]);
    expect(hand(g)).toContain(CABAJI);
  });

  /** p2 has Gum-Gum Lightning x `zaps`; p1 has C&M plus Cross Guild Mohji & Cabaji (6000) and Marco (5000, not Cross Guild). */
  function zapGame(handCards: string[], zaps = 1, mine1: string[] = [CM, SCL.cg5b, SCL.c3]) {
    return theirs(
      LC.plain,
      { hand: handCards, characters: mine1 },
      {
        hand: Array.from({ length: zaps }, () => SCN2.lightning),
        costArea: { active: 8, rested: 0 },
      },
    );
  }

  it('replacement: when the opponent effect would K.O. my Cross Guild Character, I may trash 1 hand card instead and it stays', () => {
    const g = zapGame([SCL.c2, SCL.c4]);
    const target = inst(g, 'p1', 'characters', SCL.cg5b);
    opponentKOs(g, target);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'choose') pickInst(g, [inst(g, 'p1', 'hand', SCL.c2)]);
    expect(chars(g)).toContain(SCL.cg5b);
    expect(trash(g)).toEqual([SCL.c2]);
    expect(hand(g)).toEqual([SCL.c4]);
    expect(hasEvent(g, 'KO')).toBe(false);
  });

  it('declining the replacement lets the K.O. happen and keeps the hand', () => {
    const g = zapGame([SCL.c2, SCL.c4]);
    opponentKOs(g, inst(g, 'p1', 'characters', SCL.cg5b));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(chars(g)).not.toContain(SCL.cg5b);
    expect(trash(g)).toEqual([SCL.cg5b]);
    expect(hand(g)).toEqual([SCL.c2, SCL.c4].sort());
  });

  it('a Character that is not Cross Guild gets no replacement (Marco is K.O.ed outright)', () => {
    const g = zapGame([SCL.c2]);
    opponentKOs(g, inst(g, 'p1', 'characters', SCL.c3));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([SCL.c3]);
    expect(hand(g)).toEqual([SCL.c2]);
  });

  it('without Crocodile & Mihawk on the field there is no replacement: the Cross Guild Character is K.O.ed outright', () => {
    const g = zapGame([SCL.c2], 1, [SCL.cg5b]);
    opponentKOs(g, inst(g, 'p1', 'characters', SCL.cg5b));
    expect(trash(g)).toEqual([SCL.cg5b]);
    expect(hand(g)).toEqual([SCL.c2]);
  });

  it('[Once Per Turn]: a second removal in the same turn is not replaced', () => {
    const g = zapGame([SCL.c2, SCL.c4, SCL.c5], 2, [CM, SCL.cg5b, CABAJI]);
    opponentKOs(g, inst(g, 'p1', 'characters', SCL.cg5b));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'choose') pickInst(g, [inst(g, 'p1', 'hand', SCL.c2)]);
    // Back to p2's Main Phase: the second Lightning K.O.s Cabaji (1000, Cross Guild), unreplaced.
    need(g, 'main', 'p2');
    opponentKOs(g, inst(g, 'p1', 'characters', CABAJI));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).not.toContain(CABAJI);
    expect(trash(g)).toContain(CABAJI);
  });

  it('"removed from the field" is wider than K.O.: placing my Cross Guild Character at the deck bottom (OP10-060) is replaced too', () => {
    const g = theirs(
      LC.plain,
      { hand: [SCL.c2, SCL.c4], characters: [CM, SCL.cg5b] },
      { hand: ['OP10-060'], costArea: { active: 5, rested: 0 } },
    );
    const target = inst(g, 'p1', 'characters', SCL.cg5b);
    playRaw(g, 'OP10-060');
    need(g, 'choose', 'p2');
    pickInst(g, [target]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'choose') pickInst(g, [inst(g, 'p1', 'hand', SCL.c2)]);
    expect(chars(g)).toContain(SCL.cg5b);
    expect(trash(g)).toEqual([SCL.c2]);
    expect(deck(g).at(-1)).not.toBe(SCL.cg5b);
  });

  it('a K.O. in battle is not an opponent effect: no replacement is offered', () => {
    const g = theirs(
      LC.plain,
      { hand: [SCL.c2], characters: [CM, { card: MOHJI, rested: true }] },
      { characters: [] },
    );
    attack(g, g.leader('p2'), inst(g, 'p1', 'characters', MOHJI));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([MOHJI]);
    expect(hand(g)).toEqual([SCL.c2]);
  });

  it('with an empty hand the replacement cannot be paid: it is not offered or cannot be accepted, and the K.O. happens', () => {
    const g = zapGame([]);
    opponentKOs(g, inst(g, 'p1', 'characters', SCL.cg5b));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(trash(g)).toEqual([SCL.cg5b]);
  });

  it('removal by my own effect is not replaced: Buggy (ST25-004) trashing itself as its cost gets no offer', () => {
    const g = mine(LC.buggy, {
      hand: [SCL.c2, SCL.cg5],
      characters: [CM, 'ST25-004'],
      costArea: { active: 4, rested: 0 },
    });
    const b = inst(g, 'p1', 'characters', 'ST25-004');
    const ability = g.legal().find((a) => a.type === 'activate' && a.card === b);
    expect(ability).toBeDefined();
    g.act(ability!);
    if (kind(g) === 'optional') yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(kind(g)).toBe('choose');
    choose(g, [inst(g, 'p1', 'hand', SCL.c2)]);
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).not.toContain('ST25-004');
    expect(trash(g)).toContain('ST25-004');
  });
});
