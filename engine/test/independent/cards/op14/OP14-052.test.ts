/**
 * OP14-052 Hannyabal (Character, Blue, cost 5, 6000, Counter +1000, {Impel Down}).
 *
 * Card text: "[Blocker]
 * [On Play] You may trash 3 cards from your hand: Play up to 1 {Impel Down} type Character card with
 * a cost of 6 or less from your hand."
 *
 * Rules: CR 8-3-1 (cost all or nothing; a hidden-hand cost is offered even when it cannot be paid,
 * with "use" unavailable), CR 4-8-1 ("up to"), CR 10-1-4 ([Blocker]), CR 2-7-2 (an effect play costs
 * no DON!!), CR 10-2-14 (Trash moves cards from hand to trash; it is not a K.O.).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  blockers,
  C14,
  canFinish,
  chars,
  choices,
  don,
  hand,
  inst,
  kind,
  kw,
  L14,
  mine,
  mustBeUnpayable,
  need,
  offeredIds,
  payHand,
  pickCards,
  put,
  reachablePickSets,
  theirs,
  trash,
} from './kit-op14b.ts';

const HAN = 'OP14-052';
const FODDER = [C14.sai, C14.kingdew, C14.thatch];

function start(handExtra: string[]) {
  return mine(L14.luffy, { hand: [HAN, ...handExtra] });
}

describe('OP14-052 Hannyabal: [Blocker]; [On Play] you may trash 3 cards from hand: play an {Impel Down} Character of cost 6 or less from hand', () => {
  it('trashes 3 cards and plays a cost-6 {Impel Down} Character from hand without paying its cost', () => {
    const g = start([C14.saldeath, ...FODDER]);
    put(g, HAN);
    answerMay(g, true);
    payHand(g, FODDER);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.saldeath]);
    pickCards(g, [C14.saldeath]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([C14.saldeath, HAN].sort());
    expect(trash(g)).toEqual([...FODDER].sort());
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('boundary: cost 6 and cost 4 {Impel Down} are offered; cost 7 {Impel Down} and a non-{Impel Down} card are not', () => {
    const g = start([C14.saldeath, C14.sphinx, C14.jinbe7, C14.marco, ...FODDER]);
    put(g, HAN);
    answerMay(g, true);
    payHand(g, FODDER);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.saldeath, C14.sphinx].sort());
  });

  it('"up to 1": may play nothing after paying (the 3 cards are still trashed)', () => {
    const g = start([C14.saldeath, ...FODDER]);
    put(g, HAN);
    answerMay(g, true);
    payHand(g, FODDER);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(hand(g)).toEqual([C14.saldeath]);
    expect(trash(g)).toHaveLength(3);
  });

  it('plays at most 1 Character', () => {
    const g = start([C14.saldeath, C14.sphinx, ...FODDER]);
    put(g, HAN);
    answerMay(g, true);
    payHand(g, FODDER);
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('declining the optional cost trashes nothing and plays nothing', () => {
    const g = start([C14.saldeath, ...FODDER]);
    put(g, HAN);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toHaveLength(4);
    expect(trash(g)).toEqual([]);
    expect(chars(g)).toEqual([HAN]);
  });

  it('with only 2 cards in hand the cost cannot be paid: the effect is offered with "use" unavailable and nothing is trashed', () => {
    const g = start([C14.saldeath, C14.sai]);
    put(g, HAN);
    // A cost paid from the hidden hand is offered even when it cannot be paid (the opponent must not
    // learn the hand size from the missing prompt), with "use" unavailable.
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    act(g, { type: 'optional', accept: false });
    expect(hand(g)).toHaveLength(2);
    expect(trash(g)).toEqual([]);
    expect(chars(g)).toEqual([HAN]);
  });

  it('exactly 3 cards in hand pay the cost, including the {Impel Down} card itself: nothing is left to play', () => {
    const g = start([C14.saldeath, C14.sai, C14.kingdew]);
    put(g, HAN);
    answerMay(g, true);
    payHand(g, [C14.saldeath, C14.sai, C14.kingdew]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toHaveLength(3);
    expect(chars(g)).toEqual([HAN]);
  });

  // DISAGREEMENT (DISAGREEMENTS-b.md, OP14-052 D1): the engine skips the play pick when no card in the
  // remaining hand qualifies, so the opponent can tell from the missing prompt that the hand holds no
  // {Impel Down} card. OP14-043 asks the same kind of pick with 0 candidates.
  it.fails(
    'with no {Impel Down} card to play after paying, the pick is still asked (it must not depend on the hidden hand) and may be empty',
    () => {
      const g = start([C14.marco, ...FODDER]);
      put(g, HAN);
      answerMay(g, true);
      payHand(g, FODDER);
      need(g, 'choose', 'p1');
      expect(choices(g)).toHaveLength(0);
      expect(canFinish(g)).toBe(true);
      act(g, { type: 'done' });
      expect(hand(g)).toEqual([C14.marco]);
    },
  );

  it('has [Blocker]', () => {
    const g = start([]);
    put(g, HAN);
    mustBeUnpayable(g);
    expect(kw(g, inst(g, 'p1', 'characters', HAN))).toContain('Blocker');
  });

  it('can block an attack on the Leader', () => {
    const g = theirs(L14.luffy, { characters: [HAN] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', HAN)]);
    passBlock(g);
  });
});
