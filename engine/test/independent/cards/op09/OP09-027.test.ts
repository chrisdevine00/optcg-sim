/**
 * OP09-027 Sabo (Character, Green, cost 5, 6000, Counter +1000, {Revolutionary Army}/{ODYSSEY}).
 *
 * Card text: "[When Attacking] [Once Per Turn] If you have 3 or more rested Characters, draw 1 card."
 *
 * Rules: declaring an attack RESTS the attacker (CR 7-1-1-1) before [When Attacking] activates, so
 * Sabo himself counts as one of the rested Characters; only my Characters count, rested ones;
 * [Once Per Turn] is per card (CR 10-2-13); the "If" has no colon, so it is a condition on the
 * effect (the draw is not made when the check fails); the draw happens in the Attack Step, before
 * the Block Step, so it does not depend on the battle's outcome.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  allOf,
  at,
  BLUE,
  deck,
  fill,
  hand,
  kind,
  L9,
  mine,
  need,
  pickInst,
  play,
  S9,
  type Place,
} from './kit-op09a.ts';

const SABO = 'OP09-027';
const R = (card: string): Place => ({ card, rested: true });

/** Sabo (active, not summoning-sick) with `own`, p2 with `p2`; hand has 1 card, deck top is c7. */
function board(own: Place[], p2: Place[] = []): TestGame {
  return mine(
    L9.luffy,
    { characters: [SABO, ...own], hand: [S9.c1], deck: [S9.c7, ...fill(BLUE, 10)] },
    { characters: p2 },
  );
}

function strike(g: TestGame, nth = 0): void {
  attack(g, allOf(g, 'p1', SABO)[nth]!, g.leader('p2'));
}

describe('OP09-027 Sabo: [When Attacking] [Once Per Turn] with 3+ rested Characters, draw 1', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = board([]);
    const s = at(g, 'p1', 'characters', SABO);
    expect(g.card(s).cost).toBe(5);
    expect(g.power(s)).toBe(6000);
    expect(g.card(s).counter).toBe(1000);
  });

  it('boundary: Sabo rests when it attacks and counts itself: with 2 other rested Characters (3 in all) I draw 1', () => {
    const g = board([R(S9.c2), R(S9.c3)]);
    strike(g);
    expect(g.card(at(g, 'p1', 'characters', SABO)).rested).toBe(true);
    expect(hand(g)).toEqual([S9.c1, S9.c7].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('boundary: with only 1 other rested Character (2 in all) nothing is drawn', () => {
    const g = board([R(S9.c2), S9.c3]);
    strike(g);
    expect(kind(g)).toBe('block');
    expect(hand(g)).toEqual([S9.c1]);
    expect(deck(g)).toHaveLength(11);
  });

  it('draws exactly 1 even with 4 other rested Characters', () => {
    const g = board([R(S9.c2), R(S9.c3), R(S9.c4), R(S9.c5)]);
    strike(g);
    expect(hand(g)).toEqual([S9.c1, S9.c7].sort());
  });

  it('active Characters do not count', () => {
    const g = board([S9.c2, S9.c3, S9.c4]);
    strike(g);
    expect(hand(g)).toEqual([S9.c1]);
  });

  it('the opponent’s rested Characters do not count', () => {
    const g = board([R(S9.c2)], [R(S9.c3), R(S9.c4), R(S9.c5)]);
    strike(g);
    expect(hand(g)).toEqual([S9.c1]);
  });

  it('the draw is made at the declaration, whatever happens in the battle (a Blocker blocks)', () => {
    const g = board([R(S9.c2), R(S9.c3)], [S9.vasco]);
    strike(g);
    expect(hand(g)).toEqual([S9.c1, S9.c7].sort());
    act(g, { type: 'block', blocker: at(g, 'p2', 'characters', S9.vasco) });
    expect(hand(g)).toEqual([S9.c1, S9.c7].sort());
  });

  it('[Once Per Turn] is per card: two Sabos each draw once (2 cards in all)', () => {
    const g = mine(
      L9.luffy,
      {
        characters: [SABO, SABO, R(S9.c2), R(S9.c3)],
        hand: [],
        deck: [S9.c7, S9.c6, ...fill(BLUE, 10)],
      },
      { characters: [] },
    );
    strike(g, 0);
    noDefence(g);
    strike(g, 1);
    expect(hand(g)).toEqual([S9.c6, S9.c7].sort());
  });

  it('attacking a rested opposing Character triggers it as well', () => {
    const g = board([R(S9.c2), R(S9.c3)], [R(S9.c4)]);
    attack(g, at(g, 'p1', 'characters', SABO), at(g, 'p2', 'characters', S9.c4));
    expect(hand(g)).toEqual([S9.c1, S9.c7].sort());
  });

  it('must not happen: playing Sabo (no attack) draws nothing even with 3 rested Characters', () => {
    const g = mine(
      L9.luffy,
      {
        hand: [SABO],
        characters: [R(S9.c2), R(S9.c3), R(S9.c4)],
        deck: [S9.c7, ...fill(BLUE, 10)],
      },
      {},
    );
    play(g, g.find('p1', 'hand', SABO));
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(11);
  });

  /**
   * Sabo attacks, then Dracule Mihawk (OP10-029: [On Play] with 2+ rested Characters, set up to 1 of
   * my rested {ODYSSEY} Characters with cost 5 or less active) sets him active again for a second
   * attack. `restOthers` are rested before the first attack; `c3` (active) attacks in between.
   */
  function twoAttacks(restOthers: Place[]): TestGame {
    const g = mine(
      L9.luffy,
      {
        characters: [SABO, ...restOthers, S9.c4],
        hand: [S9.mihawkOdy, S9.c1],
        deck: [S9.c7, S9.c6, ...fill(BLUE, 10)],
      },
      { characters: [] },
    );
    strike(g);
    noDefence(g);
    attack(g, at(g, 'p1', 'characters', S9.c4), g.leader('p2'));
    noDefence(g);
    play(g, g.find('p1', 'hand', S9.mihawkOdy));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', SABO)]);
    expect(g.card(at(g, 'p1', 'characters', SABO)).rested).toBe(false);
    strike(g);
    return g;
  }

  it('[Once Per Turn]: a draw already made this turn is not made again on a second attack that also meets the condition', () => {
    const g = twoAttacks([R(S9.c2), R(S9.c3)]);
    // First attack: Sabo + 2 rested = 3 → drew c7. Second attack: 4 rested, but the use is spent.
    expect(hand(g)).toEqual([S9.c1, S9.c7].sort());
  });

  it('[Once Per Turn] is spent even when the "If" fails (colon-less If = effect condition): a later attack that meets it draws nothing', () => {
    const g = twoAttacks([R(S9.c2)]);
    // First attack: Sabo + 1 rested = 2 → no draw, but the effect was used. Second attack: Sabo, c2 and
    // the Character that attacked in between are rested (3), yet the Once Per Turn is gone.
    expect(hand(g)).toEqual([S9.c1]);
    expect(deck(g)).toHaveLength(12);
  });
});
