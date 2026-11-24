/**
 * OP14-025 Kuro (Character, cost 7, 8000, no Counter, {East Blue}/{Black Cat Pirates}).
 *
 * Card text: "[On Play] If your Leader is [Kuro], play up to 1 {East Blue} type Character card with a
 * cost of 6 or less from your hand."
 *
 * Rules: "Your Leader is [Kuro]" is a name check (OP03-021 Kuro is a Kuro Leader). The cost filter
 * reads the printed cost; a played card is placed active without paying its cost. "Up to 1" may be
 * none. When the condition is false nothing is asked or played.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chars,
  hand,
  kind,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S14,
  skipEmpty,
} from './kit-op14a.ts';

const KURO = 'OP14-025';

function play(leader: string, others: string[]) {
  const g = mine(leader, { hand: [KURO, ...others] });
  playRaw(g, KURO);
  return g;
}

describe('OP14-025 Kuro: [On Play] with a [Kuro] Leader, play an {East Blue} Character with cost 6 or less', () => {
  it('printed values: cost 7, 8000, no Counter', () => {
    const g = mine(LD14.kuro, { hand: [KURO] });
    const c = g.card(g.find('p1', 'hand', KURO));
    expect(c.cost).toBe(7);
    expect(c.power).toBe(8000);
    expect(c.counter).toBeNull();
  });

  it('with a [Kuro] Leader it offers exactly the {East Blue} Characters with cost 6 or less', () => {
    const g = play(LD14.kuro, [
      S14.genzo, // East Blue, cost 2
      S14.carmen, // East Blue, cost 3
      S14.tashigiG5, // East Blue, cost 5
      S14.kuro6, // East Blue, cost 6
      KURO, // East Blue, cost 7: too expensive
      S14.mohji, // not East Blue
      S14.marco, // not East Blue
    ]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.carmen, S14.genzo, S14.kuro6, S14.tashigiG5].sort());
  });

  it('boundary: cost 6 qualifies and cost 7 does not', () => {
    const g = play(LD14.kuro, [S14.kuro6, KURO]);
    expect(offeredIds(g)).toEqual([S14.kuro6]);
  });

  it('plays the chosen Character for free, active', () => {
    const g = play(LD14.kuro, [S14.kuro6, S14.genzo]);
    pickInst(g, [g.find('p1', 'hand', S14.kuro6)]);
    expect(chars(g)).toEqual([KURO, S14.kuro6].sort());
    expect(g.card(at(g, 'p1', 'characters', S14.kuro6)).rested).toBe(false);
    expect(hand(g)).toEqual([S14.genzo]);
    need(g, 'main', 'p1');
  });

  it('"up to 1": may play nothing', () => {
    const g = play(LD14.kuro, [S14.genzo]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([KURO]);
    expect(hand(g)).toEqual([S14.genzo]);
  });

  it('plays only one when two qualify', () => {
    const g = play(LD14.kuro, [S14.genzo, S14.carmen]);
    pickInst(g, [g.find('p1', 'hand', S14.genzo)]);
    expect(chars(g)).toEqual([KURO, S14.genzo].sort());
    expect(hand(g)).toEqual([S14.carmen]);
  });

  it('with a Leader that is not [Kuro] nothing is asked and nothing is played', () => {
    const g = play(LD14.luffy, [S14.genzo]);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([KURO]);
    expect(hand(g)).toEqual([S14.genzo]);
  });

  it('an {East Blue} Leader that is not named Kuro does not count either (name check, not type)', () => {
    // OP03-040 Nami: {East Blue} Leader, not named Kuro.
    const g = play('OP03-040', [S14.genzo]);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([KURO]);
    expect(hand(g)).toEqual([S14.genzo]);
  });

  it('with no qualifying card in hand the effect plays nothing', () => {
    const g = play(LD14.kuro, [S14.mohji, S14.marco, KURO]);
    skipEmpty(g);
    expect(chars(g)).toEqual([KURO]);
    expect(hand(g)).toEqual([S14.mohji, S14.marco, KURO].sort());
  });
});
