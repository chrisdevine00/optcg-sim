/**
 * EB03-003 Uta (Character, Red, cost 5, 7000, Special, {FILM}).
 *
 * Card text: "[On Play] If your Leader is [Uta], draw 2 cards. Then, play up to 1 Character card with
 * 6000 power or less and no base effect from your hand."
 *
 * Rules: CR 8-1-3-1-2 (condition at resolution; "Leader is [Uta]" is a card-name check on the
 * Leader), M4b-5 (a "Then" after a failed "If" does not resolve), CR 4-8-1 ("up to"), CR 2-8-4/5
 * and M6b-Q29 (keyword-only text is no base effect).
 *
 * Scenery (printed): ST11-001 Uta (Green Leader), P-011 Uta (Red Leader), OP06-001 Uta (Purple/Red
 * Leader); ST01-001 Monkey.D.Luffy (not Uta).
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { decision, fill } from '../../helpers.ts';
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

const ID = 'EB03-003';
/** OP02-020 LittleOars Jr.: 9000, never eligible: filler for the deck. */
const FIL = SC6.c9k;
const UTA_GREEN = 'ST11-001';
const UTA_RED = 'P-011';
const UTA_PURPLE_RED = 'OP06-001';

/** p1 (turn 3) holds Uta (cost 5) and `hand`; the top of p1's deck is `top` then Mohji fillers. */
function start(o: { leader?: string; hand?: CardId[]; top?: CardId[]; chars?: CardId[] } = {}) {
  return myTurn(
    side(o.leader ?? UTA_GREEN, BLUE, {
      hand: [ID, ...(o.hand ?? [])],
      deck: [...(o.top ?? []), ...fill(FIL, 15)],
      costArea: { active: 5, rested: 0 },
      characters: o.chars ?? [],
    }),
    side(LW.luffy, RED, { costArea: { active: 3, rested: 0 } }),
  );
}

describe('EB03-003 Uta: [On Play] with an [Uta] Leader: draw 2, then play up to 1 vanilla 6000-or-less Character from hand', () => {
  it('draws 2 cards, then offers the matching Character from hand and plays it active', () => {
    const g = start({ hand: [SC6.c6k], top: [FIL, FIL] });
    put(g, ID);
    expect(ofZone(g, 'p1', 'hand')).toHaveLength(3);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c6k]);
    pickCards(g, [SC6.c6k]);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k, ID].sort());
    expect(ofZone(g, 'p1', 'hand')).toHaveLength(2);
    expect(restedOf(g, 'p1', SC6.c6k)).toEqual([false]);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
  });

  it('the two drawn cards can be played: a matching Character drawn by the effect is offered', () => {
    const g = start({ hand: [], top: [SC6.c4k, SC6.c7k] });
    put(g, ID);
    need(g, 'choose', 'p1');
    // 4000 vanilla qualifies; 7000 does not.
    expect(offeredCards(g)).toEqual([SC6.c4k]);
    pickCards(g, [SC6.c4k]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c7k]);
  });

  it('a Leader that is not [Uta]: nothing is drawn and nothing is played, with no prompt (the Then does not resolve)', () => {
    const g = start({ leader: LW.luffy, hand: [SC6.c6k], top: [SC6.c4k, SC6.c5k] });
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
    expect(g.zone('p1', 'deck')).toHaveLength(17);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('the Leader check is by name: other [Uta] Leaders (Red P-011, Purple/Red OP06-001) count', () => {
    for (const leader of [UTA_RED, UTA_PURPLE_RED]) {
      const g = start({ leader, hand: [SC6.c6k] });
      put(g, ID);
      expect(ofZone(g, 'p1', 'hand')).toHaveLength(3);
      need(g, 'choose', 'p1');
      pickCards(g, [SC6.c6k]);
      expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k, ID].sort());
    }
  });

  it('a Character named [Uta] on the field does not stand in for the Leader', () => {
    const g = start({ leader: LW.luffy, hand: [SC6.c6k], chars: [ID] });
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c6k]);
  });

  it('filter: 6000 is offered and 7000 is not (inclusive bound)', () => {
    const g = start({ hand: [SC6.c6k, SC6.c7k] });
    put(g, ID);
    expect(offeredCards(g)).toEqual([SC6.c6k]);
  });

  it('filter: a Character with a base effect and an Event are not offered; a keyword-only Blocker is', () => {
    const g = start({ hand: [SC6.zala, SC6.blenheim, 'OP02-022', SC6.raizo] });
    put(g, ID);
    expect(offeredCards(g)).toEqual([SC6.blenheim]);
  });

  it('"up to 1": the pick may end with nothing; the 2 cards are still drawn', () => {
    const g = start({ hand: [SC6.c6k], top: [FIL, FIL] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    expect(decision(g)?.max).toBe(1);
    none(g);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ID]);
    expect(ofZone(g, 'p1', 'hand')).toHaveLength(3);
  });

  it('with an [Uta] Leader and nothing playable in hand the pick is still asked, empty (no hidden-hand dependence)', () => {
    const g = start({ hand: [SC6.c7k] });
    put(g, ID);
    expect(isChoose(g)).toBe(true);
    expect(offeredCards(g)).toEqual([]);
    expect(decision(g)?.max).toBe(0);
    none(g);
    expect(ofZone(g, 'p1', 'hand')).toHaveLength(3);
  });
});
