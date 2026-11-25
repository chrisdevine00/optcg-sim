/**
 * OP09-047 Kouzuki Oden (Character, Blue, cost 9, 10000, no Counter, {Land of Wano}/{Whitebeard Pirates}).
 *
 * Card text: "[Double Attack] (This card deals 2 damage.)
 * [On K.O.] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 10-1-3 ([Double Attack]: 2 damage to a Leader), CR 10-2-17 ([On K.O.] resolves from the
 * trash), CR 3-7-6-1 (a Character trashed for room is not K.O.'d), CR 8-4 (exact "trash 1").
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence, result } from '../../helpers.ts';
import {
  at,
  atMain,
  canFinish,
  chars,
  deck,
  deckTop,
  hand,
  kw,
  L9,
  mine,
  need,
  offeredIds,
  pickCards,
  pickInst,
  playId,
  reachablePickSets,
  theirs,
  theyKo,
  trash,
  V9,
} from './kit-op09b.ts';

const ODEN = 'OP09-047';

function koed(o: { hand?: string[]; deck?: string[] } = {}) {
  const g = theirs(
    L9.neutral,
    {
      characters: [{ card: ODEN, rested: true }],
      hand: o.hand ?? [V9.c2],
      deck: o.deck ?? deckTop([V9.c1, V9.c5]),
    },
    { characters: [V9.c8] },
  );
  theyKo(g, at(g, 'p1', 'characters', ODEN), at(g, 'p2', 'characters', V9.c8));
  return g;
}

describe('OP09-047 Kouzuki Oden: [Double Attack]; [On K.O.] draw 2 cards and trash 1 card from your hand', () => {
  it('has [Double Attack]', () => {
    const g = mine(L9.neutral, { characters: [ODEN] });
    expect(kw(g, at(g, 'p1', 'characters', ODEN))).toContain('Double Attack');
  });

  it('an unblocked, uncountered attack on a Leader deals 2 damage: 2 Life cards go to hand', () => {
    const g = mine(L9.neutral, { characters: [ODEN] });
    attack(g, at(g, 'p1', 'characters', ODEN), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
    expect(g.zone('p2', 'hand')).toHaveLength(2);
  });

  it('RL-20: against a Leader with 1 Life [Double Attack] does not win: Life goes to 0 and the game continues', () => {
    const g = mine(L9.neutral, { characters: [ODEN] }, { life: [V9.c1] });
    attack(g, at(g, 'p1', 'characters', ODEN), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(0);
    expect(result(g)).toBeNull();
  });

  it('K.O.d in battle: draws exactly 2, then trashes the 1 card I pick from the enlarged hand', () => {
    const g = koed();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c1, V9.c2, V9.c5].sort());
    pickCards(g, [V9.c2]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([V9.c1, V9.c5].sort());
    expect(trash(g)).toEqual([ODEN, V9.c2].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('the drawing comes first: a drawn card may be the one trashed', () => {
    const g = koed();
    pickCards(g, [V9.c5]);
    expect(hand(g)).toEqual([V9.c1, V9.c2].sort());
  });

  it('exactly 1 is trashed: it cannot be skipped and no selection has 2 cards', () => {
    const g = koed({ hand: [V9.c2, V9.c3] });
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    for (const s of reachablePickSets(g)) expect(s.split('+').filter(Boolean)).toHaveLength(1);
  });

  it('with an empty hand: draws 2 and trashes 1 of them', () => {
    const g = koed({ hand: [] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c1, V9.c5].sort());
    pickCards(g, [V9.c1]);
    expect(hand(g)).toEqual([V9.c5]);
  });

  it('must not fire for a Character trashed to make room (CR 3-7-6-1): no draw, no trash prompt', () => {
    const g = mine(L9.neutral, {
      characters: [ODEN, V9.c2, V9.c2, V9.c2, V9.c2],
      hand: [V9.c4],
      deck: deckTop([V9.c1, V9.c5]),
    });
    playId(g, V9.c4);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', ODEN)]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ODEN]);
    expect(chars(g)).toHaveLength(5);
    expect(deck(g)).toHaveLength(12);
  });
});
