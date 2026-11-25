/**
 * OP09-026 Sakazuki (Character, Green, cost 6, 7000, no Counter, {Navy}/{ODYSSEY}).
 *
 * Card text: "[On Play] If you have 2 or more rested Characters, K.O. up to 1 of your opponent's
 * Characters with a cost of 5 or less."
 *
 * Rules: the "If" has no colon, so it is a condition on the effect; only my rested Characters count
 * (Sakazuki is played active); "up to 1" may be 0 (CR 8-4-4-1); the cost filter is on the current
 * cost (a printed cost 5 is allowed, 6 is not); it is a K.O. (not a trash): [On K.O.] effects fire
 * and "cannot be K.O.'d by effects" prevents it (RL-14, RL-15).
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, noDefence } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  canFinish,
  chars,
  choices,
  hasEvent,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  play,
  S9,
  theirs,
  trash,
  type Place,
} from './kit-op09a.ts';

const SAKA = 'OP09-026';
/** Black, cost 5, 6000, [Blocker]; [On Play] its controller's Characters cannot be K.O.'d by effects until their next turn; then draw 2, trash 2. */
const SABO = 'OP04-083';
const R = (card: string): Place => ({ card, rested: true });

function start(own: Place[], p2: Place[], p2Leader: string = L9.luffy): TestGame {
  const g = mine(L9.luffy, { hand: [SAKA], characters: own }, { characters: p2 }, p2Leader);
  play(g, g.find('p1', 'hand', SAKA));
  return g;
}

describe('OP09-026 Sakazuki: [On Play] with 2+ rested Characters, K.O. up to 1 opposing Character with cost 5 or less', () => {
  it('printed values: cost 6, 7000, no Counter', () => {
    const g = start([], []);
    const s = at(g, 'p1', 'characters', SAKA);
    expect(g.card(s).cost).toBe(6);
    expect(g.power(s)).toBe(7000);
    expect(g.card(s).counter).toBeNull();
  });

  it('with 2 rested Characters: K.O.s the chosen opposing Character (it goes to the trash)', () => {
    const g = start([R(S9.c2), R(S9.c3)], [S9.c3, S9.c4]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', S9.c3)]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([S9.c4]);
    expect(trash(g, 'p2')).toEqual([S9.c3]);
    expect(hasEvent(g, 'KO', { card: S9.c3 })).toBe(true);
  });

  it('boundary: cost 5 is offered, cost 6 is not', () => {
    const g = start([R(S9.c2), R(S9.c3)], [S9.c5, S9.c6, S9.c4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.c4, S9.c5].sort());
  });

  it('boundary: only 1 rested Character → nothing happens', () => {
    const g = start([R(S9.c2), S9.c3], [S9.c3]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('active Characters and Sakazuki himself do not count (he is played active)', () => {
    const g = start([R(S9.c2)], [S9.c3]);
    expect(kind(g)).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('the opponent’s rested Characters do not count', () => {
    const g = start([R(S9.c2)], [R(S9.c3), R(S9.c4)]);
    expect(kind(g)).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('"up to 1": I may K.O. nobody', () => {
    const g = start([R(S9.c2), R(S9.c3)], [S9.c3]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('only opposing Characters are offered (not my own, not their Leader); rested and active are both eligible', () => {
    const g = start([R(S9.c2), R(S9.c3)], [R(S9.c4), S9.c3]);
    need(g, 'choose', 'p1');
    const offered = choices(g);
    expect(offered).toHaveLength(2);
    expect(offered).not.toContain(g.leader('p2'));
    expect(offered).not.toContain(at(g, 'p1', 'characters', S9.c2));
  });

  it('with no eligible Character (only cost 6+) nothing is K.O.d', () => {
    const g = start([R(S9.c2), R(S9.c3)], [S9.c6, S9.c7]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it("a Character that cannot be K.O.'d by effects (opposing Sabo, played last turn) can be chosen but stays", () => {
    // p2's turn: p2 plays Sabo ("None of your Characters can be K.O.'d by effects until the start of
    // your next turn"). Then my turn: two of my Characters attack (resting them), and I play Sakazuki.
    const g = theirs(
      L9.luffy,
      { hand: [SAKA], characters: [S9.c2, S9.c3], costArea: { active: 8, rested: 0 } },
      { hand: [SABO, S9.c1, S9.c1], characters: [] },
    );
    play(g, g.find('p2', 'hand', SABO));
    // Sabo's [On Play] then draws 2 and trashes 2 cards from p2's hand.
    need(g, 'choose', 'p2');
    pickCards(g, [S9.c1, S9.c1]);
    endTurn(g);
    need(g, 'main', 'p1');
    for (const c of [S9.c2, S9.c3]) {
      attack(g, at(g, 'p1', 'characters', c), g.leader('p2'));
      noDefence(g);
    }
    play(g, g.find('p1', 'hand', SAKA));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SABO]);
    pickInst(g, [at(g, 'p2', 'characters', SABO)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SABO]);
    expect(trash(g, 'p2')).not.toContain(SABO);
    expect(hasEvent(g, 'KO', { card: SABO })).toBe(false);
  });

  it('it is a real K.O.: the victim’s [On K.O.] fires (opposing Lucky.Roux with a Red-Haired Pirates Leader)', () => {
    const g = start([R(S9.c2), R(S9.c3)], [S9.roux], L9.rhp);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', S9.roux)]);
    // Roux's [On K.O.] is now p2's to resolve: K.O. up to 1 of my Characters with base power 6000 or less.
    need(g, 'choose', 'p2');
    expect(chars(g).length).toBeGreaterThan(0);
  });
});
