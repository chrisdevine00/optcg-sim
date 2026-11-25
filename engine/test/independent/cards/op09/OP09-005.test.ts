/**
 * OP09-005 Silvers Rayleigh (Character, Red, cost 5, 6000, Counter +1000, {Roger Pirates}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.) [On Play] If your opponent has 2 or more Characters with a base power
 * of 5000 or more, draw 2 cards and trash 1 card from your hand."
 *
 * Rules: the "If" has no colon, so it is a condition on the effect (decision 2026-11-24); BASE power
 * (printed, ignoring modifiers and DON!!, CR 4-9); only Characters count (not the Leader), rested or
 * active; "draw 2 and trash 1" are in that order (the trash may be a card just drawn); trash 1 is
 * exact, not "up to" (CR 8-4-4); [Blocker] (CR 10-1-4).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  BLUE,
  deck,
  fill,
  hand,
  kind,
  L9,
  mayChooseNone,
  mine,
  need,
  offeredIds,
  pickCards,
  play,
  S9,
  theirs,
  trash,
  type Place,
} from './kit-op09a.ts';

const RAY = 'OP09-005';

/** Rayleigh in hand with `other` hand cards; deck top = c6, c7 then fillers; opponent as given. */
function start(p2chars: Place[], other: string[] = [S9.c1], own: Place[] = []): TestGame {
  const g = mine(
    L9.luffy,
    { hand: [RAY, ...other], deck: [S9.c6, S9.c7, ...fill(BLUE, 10)], characters: own },
    { characters: p2chars },
  );
  play(g, g.find('p1', 'hand', RAY));
  return g;
}

describe('OP09-005 Silvers Rayleigh: [Blocker]; [On Play] if the opponent has 2+ base-5000+ Characters, draw 2 and trash 1', () => {
  it('printed values: cost 5, 6000, Counter +1000, has [Blocker]', () => {
    const g = start([]);
    const r = at(g, 'p1', 'characters', RAY);
    expect(g.card(r).cost).toBe(5);
    expect(g.power(r)).toBe(6000);
    expect(g.card(r).counter).toBe(1000);
    expect(g.card(r).keywords).toContain('Blocker');
  });

  it('with 2 Characters of base power 5000+: draws 2, then I trash 1 card from my hand (hand ends +1)', () => {
    const g = start([S9.c3, S9.c5]);
    need(g, 'choose', 'p1');
    expect(deck(g)).toHaveLength(10);
    expect(hand(g).sort()).toEqual([S9.c1, S9.c6, S9.c7].sort());
    pickCards(g, [S9.c1]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S9.c6, S9.c7].sort());
    expect(trash(g)).toEqual([S9.c1]);
  });

  it('the trash may be a card that was just drawn', () => {
    const g = start([S9.c3, S9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.c1, S9.c6, S9.c7].sort());
    pickCards(g, [S9.c7]);
    expect(trash(g)).toEqual([S9.c7]);
    expect(hand(g)).toEqual([S9.c1, S9.c6].sort());
  });

  it('"trash 1" is exact: the pick cannot be skipped', () => {
    const g = start([S9.c3, S9.c3]);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(false);
  });

  it('boundary: only 1 Character with base power 5000+ → nothing happens (no draw, no trash)', () => {
    const g = start([S9.c3, S9.c2]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S9.c1]);
    expect(deck(g)).toHaveLength(12);
    expect(trash(g)).toEqual([]);
  });

  it('boundary: 4000-base Characters do not count, a 5000-base one does (exactly 5000 qualifies)', () => {
    const none = start([S9.c2, S9.c2, S9.c2]);
    expect(atMain(none)).toBe(true);
    expect(hand(none)).toEqual([S9.c1]);
    const yes = start([S9.c3, S9.c3, S9.c2]);
    expect(kind(yes)).toBe('choose');
  });

  it('the opponent’s Leader (5000) is not a Character: Leader + 1 Character does not count', () => {
    const g = start([S9.c5]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S9.c1]);
  });

  it('rested Characters count too', () => {
    const g = start([
      { card: S9.c3, rested: true },
      { card: S9.c5, rested: true },
    ]);
    expect(kind(g)).toBe('choose');
  });

  it('BASE power counts: my Shanks (−1000 to all) lowers the current power to 4000 but the base is still 5000', () => {
    const g = start([S9.c3, S9.c3], [S9.c1], [{ card: 'OP09-004' }]);
    expect(g.power(at(g, 'p2', 'characters', S9.c3))).toBe(4000);
    expect(kind(g)).toBe('choose');
  });

  it('my own Characters do not count towards the condition', () => {
    const g = start([S9.c3], [S9.c1], [S9.c5, S9.c6]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S9.c1]);
  });

  it('[Blocker]: on the opponent’s turn it can block an attack on my Leader and becomes the target', () => {
    const g = theirs(L9.luffy, { characters: [RAY] }, { characters: [S9.c3] });
    attack(g, at(g, 'p2', 'characters', S9.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', RAY)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', RAY) });
    expect(g.card(at(g, 'p1', 'characters', RAY)).rested).toBe(true);
  });
});
