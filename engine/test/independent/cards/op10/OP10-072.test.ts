/**
 * OP10-072 Donquixote Rosinante (Character, Purple, cost 5, 6000, Counter +1000, {Donquixote Pirates}/{Navy}).
 *
 * Card text: "[On Play] You may trash 1 Event from your hand: Draw 2 cards.
 * [End of Your Turn] If you have 7 or more DON!! cards on your field, set up to 2 of your DON!! cards
 * as active."
 *
 * Rules: CR 8-3-1-4 ("you may" cost), a cost paid from the hidden hand is offered even when unpayable,
 * with accept illegal (the prompt must not depend on hidden cards), "up to 2" (CR 8-1-2), "set up to N
 * DON!! as active" asks a count (E-Q11), "7 or more" includes 7, [End of Your Turn] is my own turn's end.
 * Scenery: OP17-056 and OP17-055 (blue Events), OP01-023 Marco (Character).
 */
import { describe, expect, it } from 'vitest';
import { act, endTurn } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  answerCount,
  C10,
  canUse,
  countIds,
  deck,
  donSum,
  expectMain,
  hand,
  kind,
  L10,
  mine,
  need,
  offeredNow,
  payHand,
  playRaw,
  trash,
  useOffered,
  X10,
  zoneIds,
} from './kit-op10b.ts';

const ROSI = 'OP10-072';
const E1 = X10.blueEvent;
const E2 = X10.blueEvent2;
const TOP = [C10.thatch, C10.kingdew, C10.sai, C10.gordon];

function start(handCards: string[]): TestGame {
  return mine(
    L10.dp,
    { hand: [ROSI, ...handCards], deck: TOP, costArea: { active: 6, rested: 0 } },
    {},
  );
}

describe('OP10-072 Donquixote Rosinante: [On Play] you may trash 1 Event from hand: draw 2', () => {
  it('trashing an Event draws 2 cards from the top of the deck', () => {
    const g = start([E1, C10.marco]);
    playRaw(g, ROSI);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([E1]);
    payHand(g, [E1]);
    expectMain(g);
    expect(trash(g)).toEqual([E1]);
    expect(hand(g)).toEqual([C10.marco, C10.thatch, C10.kingdew].sort());
    expect(deck(g)[0]).toBe(C10.sai);
  });

  it('only Events are candidates: a Character in hand is not offered', () => {
    const g = start([E1, E2, C10.marco]);
    playRaw(g, ROSI);
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([E1, E2].sort());
  });

  it('exactly 1 Event is trashed even with two in hand', () => {
    const g = start([E1, E2]);
    playRaw(g, ROSI);
    act(g, { type: 'optional', accept: true });
    payHand(g, [E2]);
    expectMain(g);
    expect(trash(g)).toEqual([E2]);
    expect(hand(g)).toContain(E1);
    expect(hand(g)).toHaveLength(3);
  });

  it('"you may": declining trashes nothing and draws nothing', () => {
    const g = start([E1]);
    playRaw(g, ROSI);
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
    act(g, { type: 'optional', accept: false });
    expectMain(g);
    expect(hand(g)).toEqual([E1]);
    expect(deck(g)[0]).toBe(C10.thatch);
  });

  it('with no Event in hand the "use" question is still asked (the hand is hidden) with accept illegal; nothing is drawn', () => {
    const g = start([C10.marco]);
    playRaw(g, ROSI);
    need(g, 'optional', 'p1');
    expect(useOffered(g, 'p1')).toBe(false);
    act(g, { type: 'optional', accept: false });
    expectMain(g);
    expect(hand(g)).toEqual([C10.marco]);
    expect(deck(g)[0]).toBe(C10.thatch);
  });

  it('with an empty hand besides Rosinante the question is asked the same way', () => {
    const g = start([]);
    playRaw(g, ROSI);
    need(g, 'optional', 'p1');
    expect(useOffered(g, 'p1')).toBe(false);
  });

  it('the draw is exactly 2 cards, not up to 2', () => {
    const g = start([E1]);
    playRaw(g, ROSI);
    act(g, { type: 'optional', accept: true });
    payHand(g, [E1]);
    expect(hand(g)).toHaveLength(2);
    expect(kind(g)).toBe('main');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([ROSI]);
  });
});

describe('OP10-072 Donquixote Rosinante: [End of Your Turn] with 7 or more DON!! on my field set up to 2 DON!! as active', () => {
  const board = (active: number, rested: number) =>
    mine(L10.dp, { characters: [ROSI], costArea: { active, rested } }, {});

  it('with 7 DON!! (boundary), all rested: asks a count (2, 1 or 0) and 2 become active', () => {
    const g = board(0, 7);
    endTurn(g);
    expect(countIds(g)).toEqual(['2', '1', '0']);
    answerCount(g, 2);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 2, rested: 5 });
  });

  it('with 6 DON!! (one short) nothing is set active', () => {
    const g = board(0, 6);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 0, rested: 6 });
  });

  it('"up to 2": at most 2 even with 10 rested DON!!; the count offered never exceeds 2', () => {
    const g = board(0, 10);
    endTurn(g);
    expect(countIds(g)).not.toContain('3');
    answerCount(g, 2);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
  });

  it('"up to 2": setting only 1 is allowed', () => {
    const g = board(0, 8);
    endTurn(g);
    answerCount(g, 1);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 1, rested: 7 });
  });

  it('"up to 2": setting none is allowed', () => {
    const g = board(0, 8);
    endTurn(g);
    answerCount(g, 0);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 0, rested: 8 });
  });

  it('active DON!! count toward the 7: 4 active + 3 rested = 7 on the field, so 2 of the rested ones are set active', () => {
    const g = board(4, 3);
    endTurn(g);
    if (kind(g) === 'choose') answerCount(g, 2);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 6, rested: 1 });
  });

  it('with 7 DON!! all active nothing changes and nothing is asked', () => {
    const g = board(7, 0);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 7, rested: 0 });
  });
});
