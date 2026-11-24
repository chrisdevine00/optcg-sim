/**
 * OP11-118 Monkey.D.Luffy (Character, Blue, cost 8, 8000, no Counter, {Straw Hat Crew}, [Rush]).
 *
 * Card text: "[Rush] [When Attacking] You may trash 1 card from your hand: Return up to 1 Character with
 * a cost of 4 or less to the owner's hand. Then, give up to 1 rested DON!! card to your Leader or 1
 * of your Characters."
 *
 * Rules: CR 10-1-1 ([Rush]), CR 8-3-1-4 (cost paid from the hidden hand: the question is asked even
 * when the hand is empty, with "use" unavailable), CR 8-4-4 ("up to"), "Return up to 1 Character"
 * names no owner, so either player's Character may be returned.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  canHit,
  chars,
  cnt,
  dn,
  hand,
  kind,
  LD11,
  mayChooseNone,
  me,
  need,
  no,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SC11,
  trash,
  unusable,
  yes,
} from './kit-op11c.ts';

const ID = 'OP11-118';

function start(o: { hand?: string[]; mine?: string[]; foe?: string[]; rested?: number } = {}) {
  const g = me(
    LD11.plain,
    {
      hand: o.hand ?? [SC11.r1, SC11.r2],
      characters: [ID, ...(o.mine ?? [SC11.r3])],
      costArea: { active: 2, rested: o.rested ?? 3 },
    },
    { characters: o.foe ?? [SC11.r4, SC11.r5] },
  );
  attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
  return g;
}

describe('OP11-118 Monkey.D.Luffy: [Rush]', () => {
  it('can attack on the turn it is played (Rush)', () => {
    const g = me(
      LD11.plain,
      { hand: [ID], costArea: { active: 10, rested: 0 } },
      { characters: [SC11.r5] },
    );
    playRaw(g, ID);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Rush');
    expect(canHit(g, at(g, 'p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });
});

describe('OP11-118 Monkey.D.Luffy [When Attacking]: trash 1 card, return a cost-4-or-less Character, give a rested DON!!', () => {
  it('printed effect: trash a card, return the opponent’s cost-4 Character to their hand, give a rested DON!! to my Leader', () => {
    const g = start();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r4)]);
    const before = dn(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(trash(g)).toEqual([SC11.r1]);
    expect(hand(g)).toEqual([SC11.r2]);
    expect(chars(g, 'p2')).toEqual([SC11.r5]);
    expect(hand(g, 'p2')).toContain(SC11.r4);
    expect(dn(g).given).toBe(before.given + 1);
    expect(dn(g).rested).toBe(before.rested - 1);
  });

  it('boundary: a cost-4 Character is offered, a cost-5 Character is not', () => {
    const g = start();
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([SC11.r3, SC11.r4].sort());
  });

  it('"Return up to 1 Character": my own Character may be returned too', () => {
    const g = start();
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', SC11.r3)]);
    expect(hand(g)).toContain(SC11.r3);
    expect(chars(g)).toEqual([ID]);
  });

  it('"you may": declining trashes nothing, returns nothing and gives no DON!!', () => {
    const g = start();
    no(g, 'p1');
    expect(cnt(g, 'p1', 'hand')).toBe(2);
    expect(chars(g, 'p2')).toEqual([SC11.r4, SC11.r5].sort());
    expect(dn(g).given).toBe(0);
  });

  it('unpayable: with an empty hand the cost cannot be paid and nothing happens', () => {
    const g = start({ hand: [] });
    unusable(g, 'p1');
    expect(chars(g, 'p2')).toEqual([SC11.r4, SC11.r5].sort());
    expect(dn(g).given).toBe(0);
  });

  it('the hand card is my choice from my whole hand', () => {
    const g = start();
    yes(g, 'p1');
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(1);
    expect(d.max).toBe(1);
    pickInst(g, [at(g, 'p1', 'hand', SC11.r2)]);
    expect(trash(g)).toEqual([SC11.r2]);
  });

  it('"up to 1": after paying I may return nobody', () => {
    const g = start();
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g, 'p2')).toEqual([SC11.r4, SC11.r5].sort());
    expect(cnt(g, 'p2', 'hand')).toBe(0);
  });

  it('the DON!! may go to one of my Characters instead of the Leader, and it must be a rested one', () => {
    const g = start();
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    pickInst(g, [at(g, 'p2', 'characters', SC11.r4)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([LD11.plain, ID, SC11.r3].sort());
    pickInst(g, [at(g, 'p1', 'characters', SC11.r3)]);
    expect(g.card(at(g, 'p1', 'characters', SC11.r3)).don).toBe(1);
    expect(dn(g).rested).toBe(2);
  });

  it('with no rested DON!! nothing can be given (all 10 active): the returns still resolve', () => {
    const g = me(
      LD11.plain,
      { hand: [SC11.r1], characters: [ID], costArea: { active: 10, rested: 0 } },
      { characters: [SC11.r4] },
    );
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    pickInst(g, [at(g, 'p2', 'characters', SC11.r4)]);
    if (kind(g) === 'choose') none(g);
    expect(dn(g).given).toBe(0);
    expect(chars(g, 'p2')).toEqual([]);
  });
});
