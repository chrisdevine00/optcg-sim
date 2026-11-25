/**
 * ST22-011 Whitey Bay (Character, Blue, cost 1, 1000, Counter +2000, {Whitebeard Pirates}).
 *
 * Card text: "[Your Turn] [On Play] You may reveal 2 cards with a type including "Whitebeard
 * Pirates" from your hand: Up to 1 of your Leader with a type including "Whitebeard Pirates"
 * gains +2000 power during this turn."
 *
 * The cost clause is restored from Limitless (DECISIONS "Open decisions": optcgapi drops it).
 *
 * Rules: CR 8-3-1-4 (optional cost), CR 11-2 (reveal), "during this turn" ends at the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  canFinish,
  choices,
  hand,
  hasEvent,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  payHand,
  pickInst,
  playRaw,
  reachablePickSets,
  SL,
  toMyNextMain,
  trash,
  unusable,
  yes,
} from './kit-lfb.ts';

const ID = 'ST22-011';
const MISS = SL.miss;

function play(leader: string, handExtra: string[], chars: string[] = []) {
  const g = mine(leader, { hand: [ID, ...handExtra], characters: chars });
  playRaw(g, ID);
  return g;
}

describe('ST22-011 Whitey Bay: [Your Turn] [On Play] you may reveal 2 Whitebeard Pirates cards: Leader +2000', () => {
  it('yes: reveal 2, then a Whitebeard Pirates Leader gains +2000 power this turn', () => {
    const g = play(LB.aceNewgate, [SL.wb4, SL.wb5, MISS]);
    yes(g, 'p1');
    payHand(g, [SL.wb4, SL.wb5]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('the revealed cards stay in hand (a reveal is not a trash)', () => {
    const g = play(LB.aceNewgate, [SL.wb4, SL.wb5, MISS]);
    yes(g, 'p1');
    payHand(g, [SL.wb4, SL.wb5]);
    pickInst(g, [g.leader('p1')]);
    expect(hand(g)).toEqual([SL.wb4, SL.wb5, MISS].sort());
    expect(trash(g)).toEqual([]);
  });

  it('the two cards are revealed (CR 11-2-1) and a third unchosen card is not', () => {
    const g = play(LB.aceNewgate, [SL.wb4, SL.wb5, SL.wb6]);
    yes(g, 'p1');
    payHand(g, [SL.wb4, SL.wb5]);
    pickInst(g, [g.leader('p1')]);
    expect(hasEvent(g, 'CardRevealed', { card: SL.wb4 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SL.wb5 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SL.wb6 })).toBe(false);
  });

  it('only cards whose type includes "Whitebeard Pirates" can be revealed (Former and Allies qualify)', () => {
    const g = play(LB.aceNewgate, [SL.wb4, SL.former3, SL.allies6, MISS, SL.c2]);
    yes(g, 'p1');
    // Picks are listed in canonical order, so read the pairs that can be completed.
    const pairs = [...reachablePickSets(g, 2)].filter(Boolean).sort();
    const ok = [SL.wb4, SL.former3, SL.allies6];
    const want = [
      [ok[0], ok[1]],
      [ok[0], ok[2]],
      [ok[1], ok[2]],
    ].map((p) => [...p].sort().join('+'));
    expect(pairs).toEqual(want.sort());
  });

  it('exactly 2 are revealed, not "up to": with only 1 matching card the cost cannot be paid', () => {
    const g = play(LB.aceNewgate, [SL.wb4, MISS]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([SL.wb4, MISS].sort());
  });

  it('exactly 2 matching cards is enough (boundary)', () => {
    const g = play(LB.aceNewgate, [SL.wb4, SL.wb5]);
    yes(g, 'p1');
    if (kind(g) === 'choose' && g.legal().some((a) => a.type === 'pick' && choices(g).length)) {
      payHand(g, [SL.wb4, SL.wb5]);
    }
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('declining ("you may"): no power, nothing revealed', () => {
    const g = play(LB.aceNewgate, [SL.wb4, SL.wb5]);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hasEvent(g, 'CardRevealed', { card: SL.wb4 })).toBe(false);
  });

  it('a Leader without a Whitebeard Pirates type is not a candidate: the power does not change', () => {
    const g = play(LB.luffy, [SL.wb4, SL.wb5]);
    yes(g, 'p1');
    payHand(g, [SL.wb4, SL.wb5]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      expect(canFinish(g)).toBe(true);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only the Leader is a candidate, never a Character, even a Whitebeard Pirates one', () => {
    const g = play(LB.aceNewgate, [SL.wb4, SL.wb5], [SL.wb6]);
    yes(g, 'p1');
    payHand(g, [SL.wb4, SL.wb5]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([g.leader('p1')]);
    expect(canFinish(g)).toBe(true);
  });

  it('"up to 1": the Leader may be left out; the cost stays paid (cards stay revealed in hand)', () => {
    const g = play(LB.aceNewgate, [SL.wb4, SL.wb5]);
    yes(g, 'p1');
    payHand(g, [SL.wb4, SL.wb5]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([SL.wb4, SL.wb5].sort());
  });

  it('the +2000 lasts this turn only', () => {
    const g = play(LB.aceNewgate, [SL.wb4, SL.wb5]);
    yes(g, 'p1');
    payHand(g, [SL.wb4, SL.wb5]);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    toMyNextMain(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it is not an [On Play] of the hand: Whitey Bay in hand does nothing', () => {
    const g = mine(LB.aceNewgate, { hand: [ID, SL.wb4, SL.wb5] });
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(act).toBeTypeOf('function');
  });
});
