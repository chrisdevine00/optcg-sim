/**
 * OP11-083 Caribou (Character, Black, cost 1, 2000, Counter +2000, {Caribou Pirates}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] Trash 2 cards from your hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 1-3-2 (do as much as possible: with fewer than 2 cards in hand,
 * trash what is there), CR 8-4-4 (exact count, no "up to"), CR 3-7 (the Character left the hand
 * when it was played, so it cannot be one of the 2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  cnt,
  hand,
  kind,
  LD11,
  me,
  need,
  offeredIds,
  pickInst,
  playRaw,
  reachablePickSets,
  SC11,
  them,
  trash,
} from './kit-op11c.ts';

const ID = 'OP11-083';

function play(others: string[]) {
  const g = me(LD11.plain, { hand: [ID, ...others] });
  playRaw(g, ID);
  return g;
}

describe('OP11-083 Caribou: [Blocker]; on play trash 2 cards from my hand', () => {
  it('has [Blocker]', () => {
    const g = me(LD11.plain, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('printed effect: of 3 other cards I trash the 2 I choose and keep the third', () => {
    const g = play([SC11.r1, SC11.r2, SC11.r3]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1), at(g, 'p1', 'hand', SC11.r3)]);
    expect(trash(g)).toEqual([SC11.r1, SC11.r3].sort());
    expect(hand(g)).toEqual([SC11.r2]);
    expect(kind(g)).toBe('main');
  });

  it('the count is exact: 2 picks are required, not "up to"', () => {
    const g = play([SC11.r1, SC11.r2, SC11.r3]);
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(2);
    expect(d.max).toBe(2);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('my own choice: every other card in hand is offered, the played Caribou is not', () => {
    const g = play([SC11.r1, SC11.r2, SC11.r3]);
    need(g, 'choose', 'p1');
    expect([...reachablePickSets(g)].filter((x) => x).sort()).toEqual(
      [
        [SC11.r1, SC11.r2],
        [SC11.r1, SC11.r3],
        [SC11.r2, SC11.r3],
      ]
        .map((p) => p.sort().join('+'))
        .sort(),
    );
    expect(offeredIds(g)).not.toContain(ID);
  });

  it('exactly 2 other cards: both are trashed', () => {
    const g = play([SC11.r1, SC11.r2]);
    if (kind(g) === 'choose')
      pickInst(g, [at(g, 'p1', 'hand', SC11.r1), at(g, 'p1', 'hand', SC11.r2)]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SC11.r1, SC11.r2].sort());
    expect(kind(g)).toBe('main');
  });

  it('only 1 other card: it is trashed and nothing breaks', () => {
    const g = play([SC11.r1]);
    if (kind(g) === 'choose') pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SC11.r1]);
    expect(kind(g)).toBe('main');
  });

  it('an empty hand: nothing is trashed and the game continues', () => {
    const g = play([]);
    expect(cnt(g, 'p1', 'trash')).toBe(0);
    expect(kind(g)).toBe('main');
  });

  it('Caribou itself stays on the field after its effect', () => {
    const g = play([SC11.r1, SC11.r2]);
    if (kind(g) === 'choose')
      pickInst(g, [at(g, 'p1', 'hand', SC11.r1), at(g, 'p1', 'hand', SC11.r2)]);
    expect(g.card(at(g, 'p1', 'characters', ID)).zone).toBe('characters');
  });

  it('it can block: an attack on my Leader offers Caribou as a Blocker, and blocking rests it', () => {
    const g = them(LD11.plain, { characters: [ID] }, { characters: [SC11.r5] });
    attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
  });

  it('must not trash cards when it only sits on the field: no prompt for the opponent’s hand either', () => {
    const g = play([SC11.r1, SC11.r2]);
    if (kind(g) === 'choose')
      pickInst(g, [at(g, 'p1', 'hand', SC11.r1), at(g, 'p1', 'hand', SC11.r2)]);
    expect(cnt(g, 'p2', 'hand')).toBe(0);
    expect(cnt(g, 'p2', 'trash')).toBe(0);
  });
});
