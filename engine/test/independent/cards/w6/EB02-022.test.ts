/**
 * EB02-022 Usopp (Character, Blue, cost 4, 5000, Counter +1000, Ranged, {Straw Hat Crew}/{East Blue}).
 *
 * Card text: "[On Play] If you have 2 or less Characters with 5000 power or more, play up to 1
 * Character card with 6000 power or less and no base effect from your hand."
 *
 * Rules: CR 8-1-3-1-2 (a condition is checked as the effect resolves; Usopp is already on the field,
 * so he counts himself: 5000), CR 4-8-1 ("up to"), CR 2-8-4/5 (a card with only keywords has no
 * base effect, M6b-Q29, settled).
 * Open M6b-Q70 (a [Trigger]-only card has a base effect?) is not asserted.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  BLUE,
  isChoose,
  LW,
  mayEnd,
  need,
  none,
  offeredCards,
  ofZone,
  pickCards,
  put,
  RED,
  restedOf,
  SC6,
} from './kit-w6a.ts';

const ID = 'EB02-022';

/** p1 (turn 3) holds Usopp (cost 4, paid from 4 active DON!!) and `hand`; `chars` are already on the field. */
function start(hand: CardId[] = [], chars: PlayerSpec['characters'] = []) {
  return myTurn(
    side(LW.luffy, BLUE, {
      hand: [ID, ...hand],
      costArea: { active: 4, rested: 0 },
      characters: chars,
    }),
    side(LW.luffy, RED, { costArea: { active: 3, rested: 0 } }),
  );
}

describe('EB02-022 Usopp: [On Play] with 2 or less Characters of 5000+: play up to 1 vanilla 6000-or-less from hand', () => {
  it('alone on the field (1 Character with 5000+: himself): offers the vanilla Character and plays it active', () => {
    const g = start([SC6.c6k]);
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c6k]);
    pickCards(g, [SC6.c6k]);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k, ID].sort());
    expect(ofZone(g, 'p1', 'hand')).toEqual([]);
    expect(restedOf(g, 'p1', SC6.c6k)).toEqual([false]);
  });

  it('boundary: one other 5000-power Character (2 with Usopp) still fires', () => {
    const g = start([SC6.c6k], [SC6.c5k]);
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c6k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c5k, SC6.c6k, ID].sort());
  });

  it('boundary: two other Characters of 5000+ (3 with Usopp) do not fire: no prompt, the card stays in hand', () => {
    const g = start([SC6.c6k], [SC6.c5k, SC6.c7k]);
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c5k, SC6.c7k, ID].sort());
  });

  it('Characters under 5000 power do not count: 3 others at 4000 and 3000 still leave the effect on', () => {
    const g = start([SC6.c6k], [SC6.c4k, SC6.c4k, SC6.c3k]);
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c6k]);
    expect(ofZone(g, 'p1', 'characters')).toContain(SC6.c6k);
  });

  it('rested Characters with 5000+ power count too', () => {
    const g = start(
      [SC6.c6k],
      [
        { card: SC6.c5k, rested: true },
        { card: SC6.c7k, rested: true },
      ],
    );
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
  });

  it('power is the current power: a 4000 Character with 1 DON!! given (5000 on my turn) counts, so with Marco the effect does not fire', () => {
    const g = start([SC6.c6k], [{ card: SC6.c4k, don: 1 }, SC6.c5k]);
    expect(g.power(g.find('p1', 'characters', SC6.c4k))).toBe(5000);
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
  });

  it("only my Characters count: the opponent's Characters with 5000+ do not stop the effect", () => {
    const g = myTurn(
      side(LW.luffy, BLUE, { hand: [ID, SC6.c6k], costArea: { active: 4, rested: 0 } }),
      side(LW.luffy, RED, { characters: [SC6.c5k, SC6.c7k, SC6.c8k] }),
    );
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c6k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k, ID].sort());
  });

  it('filter: 6000 is offered, 7000 is not (power bound is inclusive)', () => {
    const g = start([SC6.c6k, SC6.c7k]);
    put(g, ID);
    expect(offeredCards(g)).toEqual([SC6.c6k]);
  });

  it('filter: a Character with a base effect is not offered, a keyword-only Blocker is (M6b-Q29)', () => {
    const g = start([SC6.zala, SC6.blenheim, SC6.c4k]);
    put(g, ID);
    expect(offeredCards(g)).toEqual([SC6.blenheim, SC6.c4k].sort());
  });

  it('filter: an Event in hand is not offered', () => {
    const g = start(['OP02-022', SC6.c4k]);
    put(g, ID);
    expect(offeredCards(g)).toEqual([SC6.c4k]);
  });

  it('"up to 1": the pick may be ended with nothing, and then nothing is played', () => {
    const g = start([SC6.c6k]);
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    expect(decision(g)?.max).toBe(1);
    none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('when the condition holds but nothing in hand qualifies, the pick is asked with nothing to choose (no hidden-hand dependence)', () => {
    const g = start([SC6.c7k, SC6.zala]);
    put(g, ID);
    expect(isChoose(g)).toBe(true);
    expect(offeredCards(g)).toEqual([]);
    expect(decision(g)?.max).toBe(0);
    none(g);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.zala, SC6.c7k].sort());
  });
});
