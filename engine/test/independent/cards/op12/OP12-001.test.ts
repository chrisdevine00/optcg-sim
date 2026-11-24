/**
 * OP12-001 Silvers Rayleigh (Leader, Red, 5000, 5 Life, {Former Roger Pirates}).
 *
 * Card text: "Under the rules of this game, you cannot include cards with a cost of 5 or more in
 * your deck. [Activate: Main] [Once Per Turn] You may reveal 2 Events from your hand: Up to 1 of
 * your Characters with 4000 base power or less gains +2000 power during this turn."
 *
 * Rules: a reveal cost leaves the cards in the hand (CR 11-2-2); "up to 1" may be 0 (CR 4-8-1);
 * "base power" ignores modifiers such as given DON!! and power effects (rules-digest, base power);
 * Leaders are not Characters; [Once Per Turn] is per card per turn (CR 10-2-13). The deck rule is
 * read through the public `deckIssues` check.
 */
import { describe, expect, it } from 'vitest';
import { deckIssues } from '@optcg/engine';
import { cards } from '../../../fixtures/index.ts';
import {
  at,
  chr,
  kind,
  LD12,
  mine,
  need,
  none,
  offeredCardIds,
  offeredOn,
  pickInst,
  revealedByEffects,
  S12,
  sorted,
  startActivate,
  revealCost,
  toMyNextMain,
} from './kit-op12a.ts';

const RAY = LD12.rayleigh;
const E = S12.event;

function board(
  chars: (string | { card: string; don?: number; rested?: boolean })[],
  hand: string[] = [E, E],
  active = 10,
) {
  return mine(RAY, { hand, characters: chars, costArea: { active, rested: 0 } });
}

describe('OP12-001 Silvers Rayleigh: reveal 2 Events, +2000 to a Character with 4000 base power or less', () => {
  it('printed values: Leader, 5000 power, 5 Life (the test Life is 4), type Former Roger Pirates', () => {
    const g = board([S12.sai]);
    const l = g.card(g.leader('p1'));
    expect(l.power).toBe(5000);
    expect(cards()(RAY)?.types).toContain('Former Roger Pirates');
  });

  it('with 2 Events in hand: reveals both (they stay in hand) and offers exactly the Characters of 4000 base power or less', () => {
    const g = board([S12.sunny, S12.sai, S12.marco, S12.kingdew]);
    startActivate(g, g.leader('p1'));
    revealCost(g, 2);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.sai, S12.sunny].sort());
    expect(revealedByEffects(g)).toEqual([E, E]);
    expect(sorted(g, 'p1', 'hand')).toEqual([E, E]);
  });

  it('gives +2000 to the chosen Character during this turn, and it is gone next turn', () => {
    const g = board([S12.sai]);
    startActivate(g, g.leader('p1'));
    revealCost(g, 2);
    pickInst(g, [chr(g, 'p1', S12.sai)]);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(6000);
    expect(kind(g)).toBe('main');
    toMyNextMain(g);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });

  it('exactly 4000 base power qualifies and 5000 does not', () => {
    const g = board([S12.sai, S12.marco]);
    startActivate(g, g.leader('p1'));
    revealCost(g, 2);
    expect(offeredCardIds(g)).toEqual([S12.sai]);
  });

  it('base power counts, not current power: DON!! given to a 3000 Character keeps it eligible', () => {
    const g = board([{ card: S12.sunny, don: 2 }, S12.marco], [E, E], 8);
    expect(g.power(chr(g, 'p1', S12.sunny))).toBe(5000);
    startActivate(g, g.leader('p1'));
    revealCost(g, 2);
    expect(offeredCardIds(g)).toEqual([S12.sunny]);
    pickInst(g, [chr(g, 'p1', S12.sunny)]);
    expect(g.power(chr(g, 'p1', S12.sunny))).toBe(7000);
  });

  it('"up to 1": choosing nothing still pays the cost and gives no power', () => {
    const g = board([S12.sai]);
    startActivate(g, g.leader('p1'));
    revealCost(g, 2);
    none(g);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
    expect(revealedByEffects(g)).toEqual([E, E]);
  });

  it('only one Character gets the power when two qualify', () => {
    const g = board([S12.sai, S12.sunny]);
    startActivate(g, g.leader('p1'));
    revealCost(g, 2);
    pickInst(g, [chr(g, 'p1', S12.sai)]);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(6000);
    expect(g.power(chr(g, 'p1', S12.sunny))).toBe(3000);
  });

  it('[Once Per Turn]: not offered a second time in the same turn', () => {
    const g = board([S12.sai], [E, E, E]);
    startActivate(g, g.leader('p1'));
    revealCost(g, 2);
    pickInst(g, [chr(g, 'p1', S12.sai)]);
    expect(offeredOn(g, g.leader('p1'))).toEqual([]);
    toMyNextMain(g);
    expect(offeredOn(g, g.leader('p1'))).toHaveLength(1);
  });

  it('the cost needs 2 Events: not offered with one Event, or with Events and no second one among other cards', () => {
    const one = board([S12.sai], [E, S12.mohji]);
    expect(offeredOn(one, one.leader('p1'))).toEqual([]);
    const none2 = board([S12.sai], [S12.mohji, S12.sunny, S12.marco]);
    expect(offeredOn(none2, none2.leader('p1'))).toEqual([]);
    const two = board([S12.sai], [E, S12.mohji, S12.iceAge]);
    expect(offeredOn(two, two.leader('p1'))).toHaveLength(1);
  });

  it('must not: the Leader itself and the opponent Characters are never offered', () => {
    const g = mine(RAY, { hand: [E, E], characters: [S12.sai] }, { characters: [S12.sunny] });
    startActivate(g, g.leader('p1'));
    revealCost(g, 2);
    expect(offeredCardIds(g)).toEqual([S12.sai]);
    expect(at(g, 'p2', 'characters', S12.sunny)).toBeDefined();
  });

  it('deck rule: a deck with a cost-5 card is refused under this Leader and accepted under another', () => {
    const lookup = cards();
    const cheap = S12.sunny;
    const ok = [...Array.from({ length: 50 }, () => cheap)];
    const bad = [...Array.from({ length: 49 }, () => cheap), S12.kingdew];
    const codes = (leader: string, main: string[]) =>
      deckIssues({ leader, main }, lookup, 'free').map((i) => i.code);
    expect(codes(RAY, bad)).toContain('deckRestriction');
    expect(codes(RAY, ok)).not.toContain('deckRestriction');
    expect(codes(LD12.luffy, bad)).not.toContain('deckRestriction');
    expect(S12.kingdew).toBe('OP02-006'); // cost 5: the boundary card used above
    expect(lookup(S12.kingdew)?.cost).toBe(5);
    expect(lookup(S12.hajrudin)?.cost).toBe(4);
  });
});
