/**
 * OP13-078 Oro Jackson (Stage, Purple, cost 1, {Roger Pirates}).
 *
 * Card text: "[Once Per Turn] When your Character with a type including "Roger Pirates" is removed from
 * the field by your opponent's effect, add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: rulings RL (QA-OP02 OP02-027: "removed from the field" covers K.O., return to hand, to the
 * deck and to the trash by the opponent's effects), CR 10-2-?? (auto effects), E-Q11 (the count),
 * CR 2-4-3-1 ("type including"), a battle K.O. is not an effect, CR 8-? ([Once Per Turn]).
 * Open question E-Q7 / M6b-Q42 (order against a K.O.'s other triggers) is not asserted.
 * Scenery: OP12-012 Buggy (Roger Pirates, cost 2, 2000, inert), OP01-023 Marco (no Roger Pirates);
 * p2 holds OP09-077 Gum-Gum Lightning (x2), OP17-056 (return) and OP17-046 Gloriosa (bottom of deck).
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  asksCount,
  atMain,
  battleOn,
  bounce,
  ch,
  chars,
  countOptions,
  defend,
  don,
  hand,
  kind,
  ko,
  LD13,
  me,
  need,
  opponentKOs,
  playRaw,
  S13,
  toBottom,
  yes,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-078';

function start(chs: (string | { card: string; rested: boolean })[] = [S13.rp2, S13.c3]): TestGame {
  return defend(LD13.plain, { stage: ID, characters: chs });
}

describe('OP13-078 Oro Jackson: [Once Per Turn] my Roger Pirates Character removed by the opponent’s effect: add up to 1 DON!! rested', () => {
  it('K.O. by an effect: asks the count and adds 1 RESTED DON!!', () => {
    const g = start();
    const before = don(g);
    ko(g, ch(g, 'p1', S13.rp2));
    need(g, 'choose', 'p1');
    expect(countOptions(g)).toEqual(['1', '0']);
    addDon(g, 1);
    expect(atMain(g, 'p2')).toBe(true);
    expect(don(g)).toMatchObject({ rested: before.rested + 1, deck: before.deck - 1 });
    expect(chars(g)).toEqual([S13.c3]);
  });

  it('returned to the hand by the opponent’s effect also counts as removed from the field', () => {
    const g = start();
    bounce(g, ch(g, 'p1', S13.rp2));
    expect(asksCount(g)).toBe(true);
    addDon(g, 1);
    expect(hand(g)).toEqual([S13.rp2]);
  });

  it('placed at the bottom of the deck by the opponent’s effect also counts', () => {
    const g = start();
    toBottom(g, ch(g, 'p1', S13.rp2));
    expect(asksCount(g)).toBe(true);
  });

  it('a Character without a Roger Pirates type removed by the opponent’s effect gives nothing', () => {
    const g = start();
    const before = don(g);
    ko(g, ch(g, 'p1', S13.c3));
    expect(kind(g)).toBe('main');
    expect(don(g).deck).toBe(before.deck);
  });

  it('[Once Per Turn]: a second removal in the same turn adds nothing', () => {
    const g = start([S13.rp2, S13.shanksRp, S13.c3]);
    ko(g, ch(g, 'p1', S13.rp2));
    addDon(g, 1);
    const mid = don(g);
    ko(g, ch(g, 'p1', S13.shanksRp));
    expect(asksCount(g)).toBe(false);
    expect(atMain(g, 'p2')).toBe(true);
    expect(don(g).deck).toBe(mid.deck);
  });

  it('a battle K.O. is not an effect: nothing is added', () => {
    const g = start([{ card: S13.rp2, rested: true }, S13.c3]);
    const before = don(g);
    battleOn(g, ch(g, 'p1', S13.rp2));
    expect(asksCount(g)).toBe(false);
    expect(don(g).deck).toBe(before.deck);
    expect(chars(g)).toEqual([S13.c3]);
  });

  it('"by your opponent’s effect": removing my own Character with my own effect gives nothing', () => {
    // OP13-059 Brilliant Punk: [Main] return 1 of my Characters (cost): return up to 1 Character.
    const g = me(LD13.plain, { stage: ID, characters: [S13.rp2], hand: ['OP13-059'] });
    const before = don(g);
    playRaw(g, 'OP13-059');
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(asksCount(g)).toBe(false);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S13.rp2]);
    expect(don(g).deck).toBe(before.deck);
  });

  it('the opponent’s Roger Pirates Characters removed by MY effect give me nothing', () => {
    const g = me(
      LD13.plain,
      { stage: ID, characters: [S13.c3], hand: ['OP09-077'] },
      { characters: [S13.rp2] },
    );
    const before = don(g);
    opponentKOs(g, ch(g, 'p2', S13.rp2));
    expect(asksCount(g)).toBe(false);
    expect(don(g).deck).toBe(before.deck + 2);
  });

  it('"up to 1": choosing 0 adds nothing', () => {
    const g = start();
    const before = don(g);
    ko(g, ch(g, 'p1', S13.rp2));
    addDon(g, 0);
    expect(don(g).deck).toBe(before.deck);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('with an empty DON!! deck nothing is asked', () => {
    const g = defend(LD13.plain, {
      stage: ID,
      characters: [S13.rp2],
      costArea: { active: 10, rested: 0 },
    });
    expect(don(g).deck).toBe(0);
    ko(g, ch(g, 'p1', S13.rp2));
    expect(asksCount(g)).toBe(false);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
  });
});
