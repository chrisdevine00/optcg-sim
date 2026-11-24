/**
 * OP12-004 Kouzuki Oden (Character, Red, cost 2, 3000, Counter +1000, {Land of Wano} {Kouzuki
 * Clan} {Roger Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may reveal 2 Events from your hand: This Character
 * gains +2000 power during this turn."
 *
 * Rules: a reveal cost leaves the cards in hand; [Once Per Turn] is per card per turn; "during this
 * turn" ends at the end of the turn; an attacker whose power is at least the target's wins the
 * battle (CR 7-1-3-2). [Activate: Main] has no rest cost, so a Character played this turn may use
 * it.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canAttackAnything,
  chr,
  kind,
  LD12,
  mine,
  noDefence,
  offeredOn,
  playRaw,
  revealCost,
  revealedByEffects,
  S12,
  sorted,
  startActivate,
  toMyNextMain,
} from './kit-op12a.ts';

const ODEN = 'OP12-004';
const E = S12.event;

function board(
  hand: string[],
  extra: (string | { card: string; playedThisTurn?: boolean })[] = [],
) {
  return mine(LD12.luffy, { hand, characters: [ODEN, ...extra] }, {});
}

describe('OP12-004 Kouzuki Oden: reveal 2 Events, +2000 power this turn (once per turn)', () => {
  it('printed values: cost 2, 3000, Counter +1000, types include Roger Pirates', () => {
    const g = board([]);
    const c = g.card(chr(g, 'p1', ODEN));
    expect([c.cost, c.power, c.counter]).toEqual([2, 3000, 1000]);
  });

  it('with 2 Events in hand: the reveal is the cost, the Events stay in hand, power becomes 5000', () => {
    const g = board([E, E, S12.sunny]);
    startActivate(g, chr(g, 'p1', ODEN));
    revealCost(g, 2);
    expect(kind(g)).toBe('main');
    expect(revealedByEffects(g)).toEqual([E, E]);
    expect(sorted(g, 'p1', 'hand')).toEqual([E, E, S12.sunny].sort());
    expect(g.power(chr(g, 'p1', ODEN))).toBe(5000);
  });

  it('the +2000 lasts only this turn', () => {
    const g = board([E, E]);
    startActivate(g, chr(g, 'p1', ODEN));
    revealCost(g, 2);
    expect(g.power(chr(g, 'p1', ODEN))).toBe(5000);
    toMyNextMain(g);
    expect(g.power(chr(g, 'p1', ODEN))).toBe(3000);
  });

  it('[Once Per Turn]: not offered again this turn, even with more Events; offered again next turn', () => {
    const g = board([E, E, E, E]);
    startActivate(g, chr(g, 'p1', ODEN));
    revealCost(g, 2);
    expect(offeredOn(g, chr(g, 'p1', ODEN))).toEqual([]);
    expect(g.power(chr(g, 'p1', ODEN))).toBe(5000);
    toMyNextMain(g);
    expect(offeredOn(g, chr(g, 'p1', ODEN))).toHaveLength(1);
  });

  it('with 1 Event, or none, the ability cannot be paid and is not offered', () => {
    const one = board([E, S12.sunny, S12.sai]);
    expect(offeredOn(one, chr(one, 'p1', ODEN))).toEqual([]);
    const zero = board([S12.sunny, S12.sai]);
    expect(offeredOn(zero, chr(zero, 'p1', ODEN))).toEqual([]);
    expect(zero.power(chr(zero, 'p1', ODEN))).toBe(3000);
  });

  it('Events of any colour count', () => {
    const g = board([E, S12.iceAge]);
    expect(offeredOn(g, chr(g, 'p1', ODEN))).toHaveLength(1);
  });

  it('the boost matters in battle: 5000 vs the 5000 Leader takes a Life, 3000 does not', () => {
    const boosted = board([E, E]);
    startActivate(boosted, chr(boosted, 'p1', ODEN));
    revealCost(boosted, 2);
    act(boosted, {
      type: 'attack',
      attacker: chr(boosted, 'p1', ODEN),
      target: boosted.leader('p2'),
    });
    noDefence(boosted);
    expect(boosted.life('p2')).toBe(3);

    const plain = board([E, E]);
    act(plain, { type: 'attack', attacker: chr(plain, 'p1', ODEN), target: plain.leader('p2') });
    noDefence(plain);
    expect(plain.life('p2')).toBe(4);
  });

  it('it can be activated the turn it is played (no rest cost), though without Rush it cannot attack', () => {
    const g = mine(LD12.luffy, { hand: [ODEN, E, E] });
    playRaw(g, ODEN);
    expect(offeredOn(g, chr(g, 'p1', ODEN))).toHaveLength(1);
    startActivate(g, chr(g, 'p1', ODEN));
    revealCost(g, 2);
    expect(g.power(chr(g, 'p1', ODEN))).toBe(5000);
    expect(canAttackAnything(g, chr(g, 'p1', ODEN))).toBe(false); // still cannot attack: no Rush
  });

  it('must not: only Oden itself gains the power, not the other Characters or the Leader', () => {
    const g = board([E, E], [S12.sai]);
    startActivate(g, chr(g, 'p1', ODEN));
    revealCost(g, 2);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not: using one Oden does not use up the other (once per turn is per card)', () => {
    const g = mine(LD12.luffy, { hand: [E, E, E, E], characters: [ODEN, ODEN] });
    startActivate(g, chr(g, 'p1', ODEN, 0));
    revealCost(g, 2);
    expect(offeredOn(g, chr(g, 'p1', ODEN, 0))).toEqual([]);
    expect(offeredOn(g, chr(g, 'p1', ODEN, 1))).toHaveLength(1);
    startActivate(g, chr(g, 'p1', ODEN, 1));
    revealCost(g, 2);
    expect(g.power(chr(g, 'p1', ODEN, 0))).toBe(5000);
    expect(g.power(chr(g, 'p1', ODEN, 1))).toBe(5000);
  });
});
