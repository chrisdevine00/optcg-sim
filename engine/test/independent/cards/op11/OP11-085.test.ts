/**
 * OP11-085 Kurozumi Orochi (Character, Black, cost 3, 4000, Counter +1000, {Land of Wano}/{Kurozumi Clan}).
 *
 * Card text: "[On Play] Add up to 1 "SMILE" type card with a cost of 5 or less from your trash to your hand."
 *
 * Rules: CR 2-4 (type match), CR 8-4-4 ("up to"), the trash is public (CR 3-8).
 * Scenery: OP02-080 Dobon (SMILE, cost 2), OP02-077 Solitaire (SMILE, 3), OP01-107 Babanuki (SMILE, 5),
 * OP12-092 Mizerka (SMILE, 6), OP01-023 Marco (cost 3, not SMILE).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  hand,
  kind,
  LD11,
  mayChooseNone,
  me,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SC11,
  trash,
} from './kit-op11c.ts';

const ID = 'OP11-085';

function play(trashCards: string[], oppTrash: string[] = []) {
  const g = me(LD11.plain, { hand: [ID], trash: trashCards }, { trash: oppTrash });
  playRaw(g, ID);
  return g;
}

describe('OP11-085 Kurozumi Orochi: add a {SMILE} card with cost 5 or less from my trash to my hand', () => {
  it('printed effect: the chosen {SMILE} card moves from my trash to my hand', () => {
    const g = play([SC11.smile3, SC11.r1]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', SC11.smile3)]);
    expect(hand(g)).toEqual([SC11.smile3]);
    expect(trash(g)).toEqual([SC11.r1]);
    expect(kind(g)).toBe('main');
  });

  it('boundary: cost 5 is offered, cost 6 is not', () => {
    const g = play([SC11.smile5, SC11.smile6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.smile5]);
  });

  it('a non-{SMILE} card of cost 5 or less is not offered', () => {
    const g = play([SC11.r3, SC11.smile2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.smile2]);
  });

  it('"up to 1": choosing nothing leaves the trash as it was', () => {
    const g = play([SC11.smile3]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SC11.smile3]);
  });

  it('only 1 card is added even when several qualify', () => {
    const g = play([SC11.smile2, SC11.smile3, SC11.smile5]);
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(1);
    pickInst(g, [at(g, 'p1', 'trash', SC11.smile2)]);
    expect(hand(g)).toEqual([SC11.smile2]);
    expect(trash(g).sort()).toEqual([SC11.smile3, SC11.smile5].sort());
  });

  it('nothing qualifies: no card is added and the game continues', () => {
    const g = play([SC11.smile6, SC11.r1]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('an empty trash: nothing happens', () => {
    const g = play([]);
    if (kind(g) === 'choose') none(g);
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('only my own trash is searched: a {SMILE} card in my opponent’s trash is not offered', () => {
    const g = play([], [SC11.smile3]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SC11.smile3]);
  });

  it('the cost is the printed cost of the card: a cost-2 {SMILE} card qualifies (any value up to 5)', () => {
    const g = play([SC11.smile2]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', SC11.smile2)]);
    expect(hand(g)).toEqual([SC11.smile2]);
  });
});
