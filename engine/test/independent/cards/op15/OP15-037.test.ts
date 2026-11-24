/**
 * OP15-037 The Outcome Will Tell Us Who's Strong and Who's Weak (Event, Green, cost 1, {Krieg
 * Pirates}/{East Blue}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 1 {East Blue} type card
 * other than [The Outcome Will Tell Us Who's Strong and Who's Weak] and add it to your hand. Then,
 * place the rest at the bottom of your deck in any order. [Trigger] Draw 1 card."
 *
 * Rules: CR 8-4-4-2 ("up to"), CR 11-2-1 (revealed cards), "other than [name]" excludes copies of
 * the same name, CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from './kit-op15a.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  deck,
  declineTrigger,
  don,
  hand,
  hasEvent,
  hitLeader,
  kind,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  reachablePickSets,
  RED,
  S15,
  settleOrders,
  side,
  tail,
  theirTurn,
  trash,
} from './kit-op15a.ts';
import { choices, canFinish } from './kit-op15a.ts';
import { act } from './kit-op15a.ts';

const OUTCOME = 'OP15-037';
const EB1 = S15.alvida; // OP03-023 {East Blue}
const EB2 = S15.genzo; // OP03-046 {East Blue}
const MISS = BLUE; // OP02-060 Mohji, {Buggy Pirates}

function start(top: string[], rest: string[] = Array.from({ length: 8 }, () => BLUE)) {
  const g = mine(LD15.luffy, { hand: [OUTCOME], deck: [...top, ...rest] });
  playRaw(g, OUTCOME);
  return g;
}
const top5 = (a: string, b: string, c: string = MISS) => [a, b, c, MISS, MISS];

function finish(g: ReturnType<typeof start>) {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
}
/** An empty candidate prompt may be asked or skipped. */
function skipEmpty(g: ReturnType<typeof start>) {
  if (kind(g) === 'choose') {
    expect(choices(g)).toHaveLength(0);
    if (canFinish(g)) act(g, { type: 'done' });
  }
  finish(g);
}

describe('OP15-037 The Outcome Will Tell Us Who is Strong: [Main] look at 5, add up to 1 {East Blue}', () => {
  it('offers exactly the {East Blue} cards of the top 5; the pick goes to hand, the other 4 to the bottom', () => {
    const g = start(top5(EB1, EB2));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EB1, EB2].sort());
    pickCards(g, [EB2]);
    finish(g);
    expect(hand(g)).toEqual([EB2]);
    expect(deck(g)).toHaveLength(12);
    expect(deck(g)[0]).toBe(BLUE);
    expect(tail(deck(g), 4)).toEqual([EB1, MISS, MISS, MISS].sort());
    expect(trash(g)).toEqual([OUTCOME]);
  });

  it('the added card is revealed, the looked-at others are not', () => {
    const g = start(top5(EB1, EB2));
    pickCards(g, [EB1]);
    finish(g);
    expect(hasEvent(g, 'CardRevealed', { card: EB1 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: EB2 })).toBe(false);
  });

  it('"other than" itself: copies of the Event in the top 5 are not offered', () => {
    const g = start([OUTCOME, EB1, OUTCOME, MISS, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EB1]);
  });

  it('"up to 1": may add nothing; all 5 looked-at cards go to the bottom', () => {
    const g = start(top5(EB1, EB2));
    none(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    expect(tail(deck(g), 5)).toEqual(top5(EB1, EB2).sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('adds at most one card even when two qualify', () => {
    const sets = reachablePickSets(start(top5(EB1, EB2)));
    expect(sets.has('')).toBe(true);
    expect(sets.has(EB1)).toBe(true);
    expect(sets.has(EB2)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: an {East Blue} card in position 6 is not offered', () => {
    const g = start(
      [MISS, MISS, MISS, MISS, MISS],
      [EB1, ...Array.from({ length: 8 }, () => BLUE)],
    );
    skipEmpty(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(EB1);
  });

  it('with no {East Blue} card in the top 5 nothing is added and all 5 go to the bottom', () => {
    const g = start([MISS, MISS, MISS, MISS, MISS]);
    skipEmpty(g);
    expect(deck(g)).toHaveLength(13);
    expect(hand(g)).toEqual([]);
  });

  it('costs 1 DON!! and the Event goes to the trash', () => {
    const g = start(top5(EB1, EB2));
    none(g);
    finish(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([OUTCOME]);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
  });
});

describe('OP15-037 The Outcome Will Tell Us Who is Strong: [Trigger] draw 1 card', () => {
  function life() {
    const g = theirTurn(
      side(LD15.luffy, BLUE, { life: [OUTCOME, BLUE, BLUE, BLUE], hand: [BLUE] }),
      side(LD15.luffy, RED),
    );
    hitLeader(g);
    return g;
  }

  it('activating the Trigger draws exactly 1 card; the Event goes to the trash, not the hand', () => {
    const g = life();
    const deckBefore = deck(g).length;
    activateTrigger(g);
    need(g, 'main', 'p2');
    expect(hand(g)).toHaveLength(2);
    expect(deck(g)).toHaveLength(deckBefore - 1);
    expect(trash(g)).toEqual([OUTCOME]);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the Trigger puts the Event in my hand and draws nothing', () => {
    const g = life();
    declineTrigger(g);
    expect(hand(g).sort()).toEqual([BLUE, OUTCOME].sort());
    void endTurn;
  });
});
