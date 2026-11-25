/**
 * ST27-004 Sanjuan.Wolf (Character, Black, cost 4, 6000, Counter +1000, {Blackbeard Pirates}/{Giant},
 * Strike).
 *
 * Card text: "If your Leader has the "Blackbeard Pirates" type, this Character gains [Blocker] and +1
 * cost for every 4 cards in your trash. (After your opponent declares an attack, you may rest this
 * card to make it the new target of the attack.) [On Play] Trash 1 card from your hand."
 *
 * Rules: CR 10-1-3 ([Blocker]), CR 1-3-4 / 1-3-6 ("for every 4" counts whole groups of 4), a
 * [On Play] "Trash 1 card" is not "up to": the card is trashed whenever the hand has one.
 * The static ability depends on the Leader's type and on the number of cards in my own trash.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  canFinish,
  choices,
  costIn,
  fill,
  hand,
  kw,
  mine,
  n,
  need,
  pickInst,
  playCard,
  SL,
  SS,
  ST27,
  theirs,
  trash,
  unusable,
  waitingAtMain,
} from './kit-st2627a.ts';

const WOLF = ST27.wolf;

/** Wolf on the field of p1 with `trashCount` cards in p1's trash. */
function onField(leader: string, trashCount: number, p2trash = 0) {
  return mine(
    leader,
    { characters: [WOLF], trash: fill(SS.c1, trashCount) },
    { trash: fill(SS.c1, p2trash) },
  );
}

describe('ST27-004 Sanjuan.Wolf: static [Blocker] and +1 cost per 4 cards in my trash', () => {
  it('with a {Blackbeard Pirates} Leader it has [Blocker]', () => {
    const g = onField(SL.bbp, 0);
    expect(kw(g, at(g, 'p1', 'characters', WOLF))).toContain('Blocker');
  });

  it('with any other Leader it has no [Blocker]', () => {
    const g = onField(SL.shanks, 0);
    expect(kw(g, at(g, 'p1', 'characters', WOLF))).not.toContain('Blocker');
  });

  it.each([
    [0, 4],
    [3, 4],
    [4, 5],
    [7, 5],
    [8, 6],
    [11, 6],
    [12, 7],
  ])('with %i cards in my trash its cost is %i (4 + one per full 4)', (inTrash, cost) => {
    const g = onField(SL.bbp, inTrash);
    expect(costIn(g, 'p1', 'characters', WOLF)).toBe(cost);
  });

  it('without the type there is no cost bonus, however big the trash (cost stays 4 with 12 cards)', () => {
    const g = onField(SL.shanks, 12);
    expect(costIn(g, 'p1', 'characters', WOLF)).toBe(4);
  });

  it("only my own trash counts: 8 cards in the opponent's trash add nothing", () => {
    const g = onField(SL.bbp, 0, 8);
    expect(costIn(g, 'p1', 'characters', WOLF)).toBe(4);
  });

  it('it follows the trash as it changes: 3 cards plus one more trashed card makes the cost 5', () => {
    const g = mine(SL.bbp, { hand: [WOLF, SS.c1], trash: fill(SS.c3, 3) }, {});
    playCard(g, WOLF);
    // [On Play] trashes the only other card in hand: the trash now holds 4 cards.
    need(g, 'choose');
    pickInst(g, [at(g, 'p1', 'hand', SS.c1)]);
    expect(trash(g)).toHaveLength(4);
    expect(costIn(g, 'p1', 'characters', WOLF)).toBe(5);
  });

  it('the Blocker it gains really blocks: it is offered as a blocker against an attack on my Leader', () => {
    const g = theirs(
      SL.bbp,
      { characters: [WOLF] },
      { characters: [SS.c3], costArea: { active: 10, rested: 0 } },
    );
    attack(g, at(g, 'p2', 'characters', SS.c3), g.leader('p1'));
    unusable(g, 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', WOLF)]);
  });

  it('without the type it cannot block', () => {
    const g = theirs(
      SL.shanks,
      { characters: [WOLF] },
      { characters: [SS.c3], costArea: { active: 10, rested: 0 } },
    );
    attack(g, at(g, 'p2', 'characters', SS.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});

describe('ST27-004 Sanjuan.Wolf: [On Play] trash 1 card from your hand', () => {
  it('with two other cards in hand I choose which one is trashed; the other stays', () => {
    const g = mine(SL.bbp, { hand: [WOLF, SS.c1, SS.c2] });
    playCard(g, WOLF);
    need(g, 'choose');
    expect(choices(g)).toHaveLength(2);
    pickInst(g, [at(g, 'p1', 'hand', SS.c2)]);
    expect(waitingAtMain(g)).toBe(true);
    expect(trash(g)).toEqual([SS.c2]);
    expect(hand(g)).toEqual([SS.c1]);
  });

  it('it is not "up to": the trash cannot be skipped', () => {
    const g = mine(SL.bbp, { hand: [WOLF, SS.c1, SS.c2] });
    playCard(g, WOLF);
    need(g, 'choose');
    expect(canFinish(g)).toBe(false);
  });

  it('with one other card in hand that card is trashed (not skipped)', () => {
    const g = mine(SL.bbp, { hand: [WOLF, SS.c1] });
    playCard(g, WOLF);
    if (g.zone('p1', 'hand').length) pickInst(g, [at(g, 'p1', 'hand', SS.c1)]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SS.c1]);
  });

  it('with an empty hand (Wolf itself just left it) nothing is trashed and the game goes on', () => {
    const g = mine(SL.bbp, { hand: [WOLF] });
    playCard(g, WOLF);
    expect(waitingAtMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
    expect(n(g, 'p1', 'characters')).toBe(1);
  });

  it('it does not need the Leader type: a Leader without it still trashes a card', () => {
    const g = mine(SL.shanks, { hand: [WOLF, SS.c1, SS.c2] });
    playCard(g, WOLF);
    need(g, 'choose');
    pickInst(g, [at(g, 'p1', 'hand', SS.c1)]);
    expect(trash(g)).toEqual([SS.c1]);
  });

  it("it trashes from my hand only: the opponent's hand is untouched", () => {
    const g = mine(SL.bbp, { hand: [WOLF, SS.c1, SS.c2] }, { hand: [SS.c3] });
    playCard(g, WOLF);
    pickInst(g, [at(g, 'p1', 'hand', SS.c1)]);
    expect(hand(g, 'p2')).toEqual([SS.c3]);
  });

  it('Wolf is played at its printed cost 4: the trash does not make the play cost higher (4 active DON!! suffice)', () => {
    const g = mine(SL.bbp, {
      hand: [WOLF],
      trash: fill(SS.c1, 8),
      costArea: { active: 4, rested: 0 },
    });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === at(g, 'p1', 'hand', WOLF)),
    ).toBe(true);
  });
});
