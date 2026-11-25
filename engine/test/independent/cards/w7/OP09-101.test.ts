/**
 * OP09-101 Kuzan (Character, Yellow, cost 4, 5000, Counter +1000, {Navy}, Special).
 *
 * Card text: "[On Play] Place 1 of your opponent's Characters with a cost of 3 or less at the top or
 * bottom of your opponent's Life cards face-up: Your opponent trashes 1 card from their hand."
 *
 * Rules: CR 8-3-1 (the text before the colon is the cost: it must be payable in full, otherwise
 * the effect does not resolve), rules-digest 112 (an [On Play] with a cost may be declined and the
 * card is still played; whether the engine asks or not is tolerated where a test does not depend on
 * it), 107 (top or bottom of Life), CR 3-10-2-1 (face-up Life), a Character placed in Life is not
 * K.O.'d, DON!! given to a Character that leaves the field return to its owner's cost area,
 * rules-digest 136 (the hand size is public). The attacker's controller chooses the Life end; the
 * opponent chooses which card of their own hand to trash.
 * Scenery (printed): OP01-010 (cost 1), OP01-012 (2), OP01-023 (3), OP01-018 (4), OP02-006 (5)
 * vanilla Red Characters; OP01-080 Zala ([On K.O.] Draw a card, Blue cost 3).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  anomalies,
  BLUE,
  donTotal,
  handOf,
  L7,
  lifeFaces,
  lifeOf,
  mayChooseNone,
  need,
  no,
  offeredIds,
  ofZone,
  pickCards,
  pickOption,
  put,
  RED,
  S7,
  unusable,
} from './kit-w7a.ts';
import { payHand, yes } from '../op17/kit-op17b.ts';

const ID = 'OP09-101';

function start(o: Partial<PlayerSpec> = {}, opp: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(L7.luffy, BLUE, { hand: [ID], costArea: { active: 4, rested: 0 }, ...o }),
    side(L7.crocodile, RED, {
      life: [S7.c4, S7.c5, S7.c6],
      characters: [S7.c2, S7.c3, S7.c4],
      hand: [S7.c1, S7.c7],
      ...opp,
    }),
  );
}

/** Play Kuzan, agree to pay the cost (W57-R1: it may be declined), choose `target` and the end; stops at the opponent's trash choice. */
function place(g: ReturnType<typeof start>, target: CardId, end: 'top' | 'bottom') {
  put(g, ID);
  yes(g, 'p1');
  if (offeredIds(g).length) payHand(g, [target]); // (a cost pick) a single candidate is chosen without a prompt
  pickOption(g, end);
}

describe('OP09-101 Kuzan: [On Play] place an opposing Character (cost 3 or less) into their Life face-up: they trash 1 card from hand', () => {
  it('printed effect, top: the Character is on top of their Life face-up and they trash a card of their choice', () => {
    const g = start();
    place(g, S7.c3, 'top');
    // The opponent owes the trash: their hand is theirs to choose from.
    need(g, 'choose', 'p2');
    expect(offeredIds(g).sort()).toEqual([S7.c1, S7.c7].sort());
    pickCards(g, [S7.c7]);
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p2')).toEqual([S7.c3, S7.c4, S7.c5, S7.c6]);
    expect(lifeFaces(g, 'p2')).toEqual([true, false, false, false]);
    expect(ofZone(g, 'p2', 'characters')).toEqual([S7.c4, S7.c2].sort());
    expect(handOf(g, 'p2')).toEqual([S7.c1]);
    expect(ofZone(g, 'p2', 'trash')).toEqual([S7.c7]);
    expect(anomalies(g)).toBe(0);
  });

  it('bottom: the Character is the last card of their Life', () => {
    const g = start();
    place(g, S7.c2, 'bottom');
    pickCards(g, [S7.c1]);
    expect(lifeOf(g, 'p2')).toEqual([S7.c4, S7.c5, S7.c6, S7.c2]);
    expect(lifeFaces(g, 'p2')).toEqual([false, false, false, true]);
    expect(g.life('p2')).toBe(4);
  });

  it('cost 3 is enough, cost 4 is too high: only the cost 2 and cost 3 Characters are offered', () => {
    const g = start();
    put(g, ID);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([S7.c2, S7.c3].sort());
  });

  it('the placement is a cost, not "up to": exactly 1 Character, no way to place none once paying', () => {
    const g = start();
    put(g, ID);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(false);
  });

  // Was DISAGREEMENT D-1 (an `it.fails`): settled by the W57 review (W57-R1), the official
  // general-rules Q&A and rules-digest 112 are right: the text before the colon is a cost, which
  // may be declined while the card is still played.
  it('declining the cost (rules-digest 112): nothing is placed, the opponent trashes nothing, Kuzan stays in play', () => {
    const g = start();
    put(g, ID);
    no(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(g.life('p2')).toBe(3);
    expect(handOf(g, 'p2')).toEqual([S7.c1, S7.c7].sort());
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(g.find('p1', 'characters', ID)).toBeTruthy();
  });

  it('the cost is only asked once, and a declined cost leaves every opposing Character where it was', () => {
    const g = start();
    put(g, ID);
    no(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p2', 'characters')).toEqual([S7.c2, S7.c3, S7.c4].sort());
    expect(lifeOf(g, 'p2')).toEqual([S7.c4, S7.c5, S7.c6]);
    expect(ofZone(g, 'p2', 'trash')).toEqual([]);
  });

  it('no opposing Character with cost 3 or less: the cost cannot be paid, so the opponent trashes nothing', () => {
    const g = start({}, { characters: [S7.c4, S7.c5] });
    put(g, ID);
    unusable(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(handOf(g, 'p2')).toEqual([S7.c1, S7.c7].sort());
    expect(g.life('p2')).toBe(3);
  });

  it('my own cheap Characters are not offered', () => {
    const g = start({ characters: [S7.c1, S7.c2] }, { characters: [S7.c3, S7.c5] });
    put(g, ID);
    yes(g, 'p1');
    // One candidate: an exact pick may be resolved without a prompt.
    if (offeredIds(g).length) {
      expect(offeredIds(g)).toEqual([S7.c3]);
      pickCards(g, [S7.c3]);
    }
    pickOption(g, 'top');
    expect(ofZone(g, 'p1', 'characters')).toEqual([S7.c1, S7.c2, ID].sort());
    expect(lifeOf(g, 'p2')[0]).toBe(S7.c3);
  });

  it('their hand has one card: it is trashed (a single candidate needs no choice)', () => {
    const g = start({}, { hand: [S7.c7] });
    place(g, S7.c3, 'top');
    if (decision(g)?.kind === 'choose') pickCards(g, [S7.c7]);
    expect(handOf(g, 'p2')).toEqual([]);
    expect(ofZone(g, 'p2', 'trash')).toEqual([S7.c7]);
  });

  it('their hand is empty: the Character is still placed and nothing is trashed', () => {
    const g = start({}, { hand: [] });
    place(g, S7.c3, 'top');
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p2')[0]).toBe(S7.c3);
    expect(ofZone(g, 'p2', 'trash')).toEqual([]);
    expect(anomalies(g)).toBe(0);
  });

  it("the placed Character is not K.O.'d: its [On K.O.] does not fire and it is not in the trash", () => {
    const g = start({}, { characters: [S7.zala], hand: [S7.c1, S7.c7] });
    place(g, S7.zala, 'top');
    pickCards(g, [S7.c1]);
    expect(handOf(g, 'p2')).toEqual([S7.c7]); // no card drawn from Zala
    expect(ofZone(g, 'p2', 'trash')).toEqual([S7.c1]);
    expect(lifeOf(g, 'p2')[0]).toBe(S7.zala);
  });

  it('DON!! given to the placed Character return to its owner: their DON!! total is unchanged', () => {
    const g = start(
      {},
      { characters: [{ card: S7.c3, don: 2 }], costArea: { active: 1, rested: 0 } },
    );
    const before = donTotal(g, 'p2');
    place(g, S7.c3, 'top');
    pickCards(g, [S7.c1]);
    expect(donTotal(g, 'p2')).toBe(before);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });
});
