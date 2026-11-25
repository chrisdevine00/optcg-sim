/**
 * OP10-119 Trafalgar Law (Character, Yellow, cost 7, 9000, {Heart Pirates}/{Supernovas}/
 * {Dressrosa}).
 *
 * Card text: "[On Play] Reveal up to 1 {Supernovas} type Character card from your hand and add it to
 * the top of your Life cards face-down. Then, give up to 1 rested DON!! card to 1 of your
 * {Supernovas} type Leader."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 11-2-1 (reveal), CR 3-10 (a card added to Life goes face-down to
 * the top), CR 6-5-5 (given DON!! add +1000 on its owner's turn), DECISIONS 2026-11-24 (an "up to"
 * pick over the hand with a filter is asked even when nothing qualifies: max 0).
 */
import { describe, expect, it } from 'vitest';
import { projectEvents } from '@optcg/engine';
import {
  atMain,
  BLUE,
  don,
  hand,
  kind,
  LD10,
  lifeCards,
  mayDone,
  mine,
  need,
  none,
  offeredIds,
  offeredInst,
  pickCards,
  pickInst,
  playId,
  SC10,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-119';

function played(leader: string, hnd: string[]) {
  const g = mine(leader, { hand: [ID, ...hnd], costArea: { active: 10, rested: 0 } });
  playId(g, ID);
  return g;
}

describe('OP10-119 Law [On Play]: add up to 1 {Supernovas} Character from hand to the top of my Life face-down, then give a rested DON!! to my {Supernovas} Leader', () => {
  it('the revealed Character moves from hand to the top of Life (Life 4 becomes 5) and the Leader gets a rested DON!!', () => {
    const g = played(LD10.supernovas, [SC10.sn4, SC10.c3]);
    need(g, 'choose', 'p1');
    pickCards(g, [SC10.sn4]);
    expect(lifeCards(g)[0]).toBe(SC10.sn4);
    expect(g.life('p1')).toBe(5);
    expect(hand(g)).toEqual([SC10.c3]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(don(g, 'p1').given).toBe(1);
    expect(atMain(g)).toBe(true);
  });

  it('offers exactly the {Supernovas} Characters of my hand: a non-{Supernovas} Character and the Law just played are not', () => {
    const g = played(LD10.supernovas, [SC10.sn4, SC10.sn5, SC10.c3, SC10.dr3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC10.sn4, SC10.sn5].sort());
  });

  it('a card whose types merely include {Supernovas} qualifies ({Beautiful Pirates}/{Supernovas}/{Dressrosa})', () => {
    const g = played(LD10.supernovas, [SC10.sn6dr]);
    expect(offeredIds(g)).toEqual([SC10.sn6dr]);
  });

  // Was DISAGREEMENT D-1 (DISAGREEMENTS-d.md), fixed in the B3B-R3 fix round: the chosen card is
  // announced by a CardRevealed event (a selector `reveal`), so the opponent's events name it.
  it("the card is revealed (CR 11-2-1): the opponent's view of the events names it", () => {
    const g = played(LD10.supernovas, [SC10.sn4]);
    pickCards(g, [SC10.sn4]);
    const seen = projectEvents(g.events, 'p2').some(
      (e) => (e.type === 'CardRevealed' || e.type === 'CardMoved') && e.card === SC10.sn4,
    );
    expect(seen).toBe(true);
  });

  it('it goes on TOP of the Life cards, above the existing ones', () => {
    const g = played(LD10.supernovas, [SC10.sn4]);
    pickCards(g, [SC10.sn4]);
    expect(lifeCards(g)).toEqual([SC10.sn4, BLUE, BLUE, BLUE, BLUE]);
  });

  it('"up to 1": adding nothing is allowed (Life stays at 4) and then a rested DON!! may still be given', () => {
    const g = played(LD10.supernovas, [SC10.sn4]);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toContain(SC10.sn4);
    // Every reading shares: if the DON!! step is asked, only my Leader is a candidate.
    if (kind(g) === 'choose') {
      expect(offeredInst(g)).toEqual([g.leader('p1')]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
  });

  it('only 1 card is added even with two {Supernovas} Characters in hand', () => {
    const g = played(LD10.supernovas, [SC10.sn4, SC10.sn5]);
    pickCards(g, [SC10.sn4]);
    expect(g.life('p1')).toBe(5);
    expect(hand(g)).toContain(SC10.sn5);
  });

  it('no {Supernovas} Character in hand: the pick is still asked (it must not reveal the hand) with nothing to choose', () => {
    const g = played(LD10.supernovas, [SC10.c3, SC10.dr3]);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([]);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.life('p1')).toBe(4);
  });

  it('a {Supernovas} Event or Stage in hand is not a Character: it is not offered', () => {
    const g = played(LD10.supernovas, ['OP10-039', SC10.sn4]);
    expect(offeredIds(g)).toEqual([SC10.sn4]);
  });
});

describe('OP10-119 Law: give up to 1 rested DON!! card to 1 of my {Supernovas} Leader', () => {
  it('the DON!! given is a rested one from the cost area (7 rested from the play cost: one fewer afterwards)', () => {
    const g = played(LD10.supernovas, [SC10.sn4]);
    pickCards(g, [SC10.sn4]);
    pickInst(g, [g.leader('p1')]);
    expect(don(g, 'p1').rested).toBe(6);
    expect(don(g, 'p1').active).toBe(3);
    expect(don(g, 'p1').given).toBe(1);
  });

  it('a Leader without the {Supernovas} type gets nothing: no DON!! is given', () => {
    const g = played(LD10.neutral, [SC10.sn4]);
    pickCards(g, [SC10.sn4]);
    if (kind(g) === 'choose') {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    expect(don(g, 'p1').given).toBe(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
    // The Life card was still added: only the DON!! step needs the Leader type.
    expect(g.life('p1')).toBe(5);
  });

  it('"up to 1": the DON!! may be skipped', () => {
    const g = played(LD10.supernovas, [SC10.sn4]);
    pickCards(g, [SC10.sn4]);
    need(g, 'choose', 'p1');
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(don(g, 'p1').given).toBe(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('exactly 1 DON!! is given, to the Leader only (not to a Character)', () => {
    const g = mine(LD10.supernovas, {
      hand: [ID, SC10.sn4],
      characters: [SC10.sn3],
      costArea: { active: 10, rested: 0 },
    });
    playId(g, ID);
    pickCards(g, [SC10.sn4]);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.leader('p1')]);
    pickInst(g, [g.leader('p1')]);
    expect(don(g, 'p1').given).toBe(1);
    expect(g.power(g.find('p1', 'characters', SC10.sn3))).toBe(5000);
  });

  it('Law itself stays on the field and nothing is trashed', () => {
    const g = played(LD10.supernovas, [SC10.sn4]);
    pickCards(g, [SC10.sn4]);
    pickInst(g, [g.leader('p1')]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(trash(g)).toEqual([]);
  });
});
