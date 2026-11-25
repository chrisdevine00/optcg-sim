/**
 * OP10-112 Eustass"Captain"Kid (Character, Yellow, cost 8, 9000, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[On Play] You may rest this Character: Trash up to 1 card from the top of your
 * opponent's Life cards.
 * [End of Your Turn] If your opponent has 2 or less Life cards, draw 1 card and trash 1 card from
 * your hand."
 *
 * Rules: CR 8-3-1-3/-4 (an optional cost), CR 8-4-4-1 ("up to"), a Life card trashed by an effect
 * goes to the trash face up and is not damage (no [Trigger]), CR 10-2-5 ([End of Your Turn]
 * fires on its controller's turn only), colon-less "If" is an effect condition (DECISIONS
 * 2026-11-24).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  deck,
  fill,
  hand,
  kind,
  LD10,
  lifeCards,
  mayDone,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  playId,
  RED,
  SC10,
  trash,
  yes,
} from './kit-op10d.ts';

const ID = 'OP10-112';

function played(p2life = 4) {
  const g = mine(
    LD10.neutral,
    { hand: [ID], costArea: { active: 10, rested: 0 } },
    { life: fill(RED, p2life), trash: [] },
  );
  playId(g, ID);
  return g;
}

describe("OP10-112 Kid [On Play]: you may rest this Character: trash up to 1 card from the top of the opponent's Life", () => {
  it("yes: Kid is rested and the opponent's top Life card goes to their trash (4 Life becomes 3)", () => {
    const g = played();
    yes(g, 'p1');
    yes(g, 'p1');
    expect(atMain(g)).toBe(true);
    const kid = g.find('p1', 'characters', ID);
    expect(g.card(kid).rested).toBe(true);
    expect(g.life('p2')).toBe(3);
    expect(trash(g, 'p2')).toEqual([RED]);
    expect(g.life('p1')).toBe(4);
  });

  it('it is the TOP Life card that is trashed', () => {
    const g = mine(LD10.neutral, { hand: [ID] }, { life: [SC10.c3, SC10.c4, SC10.c5, SC10.c6] });
    playId(g, ID);
    yes(g, 'p1');
    yes(g, 'p1');
    expect(trash(g, 'p2')).toEqual([SC10.c3]);
    expect(lifeCards(g, 'p2')).toEqual([SC10.c4, SC10.c5, SC10.c6]);
  });

  it('no: Kid stays active and the Life is untouched', () => {
    const g = played();
    no(g, 'p1');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(g.life('p2')).toBe(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('it is trashed, not taken as damage: the card is not added to the hand and no [Trigger] is offered', () => {
    const g = mine(LD10.neutral, { hand: [ID] }, { life: ['OP10-020', BLUE, BLUE, BLUE] });
    playId(g, ID);
    yes(g, 'p1');
    yes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).not.toContain('OP10-020');
    expect(trash(g, 'p2')).toEqual(['OP10-020']);
  });

  it('"up to 1": after paying the cost the trash itself may be declined; Kid stays rested and the Life is untouched', () => {
    const g = played();
    yes(g, 'p1');
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.life('p2')).toBe(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('at most 1 Life card is trashed', () => {
    const g = played(5);
    yes(g, 'p1');
    yes(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.life('p2')).toBe(4);
  });

  it('opponent with 0 Life: nothing to trash and nothing breaks', () => {
    const g = played(0);
    yes(g, 'p1');
    if (kind(g) === 'optional') no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.life('p2')).toBe(0);
  });

  it("only the opponent's Life is touched, not mine", () => {
    const g = played();
    yes(g, 'p1');
    yes(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(trash(g, 'p1')).toEqual([]);
  });
});

describe('OP10-112 Kid [End of Your Turn]: if the opponent has 2 or less Life, draw 1 card and trash 1 card from your hand', () => {
  function endOfTurn(p2life: number, hnd: string[] = [SC10.c3]) {
    const g = mine(
      LD10.neutral,
      { characters: [ID], hand: hnd, deck: [SC10.c7, BLUE, BLUE, BLUE] },
      { life: fill(RED, p2life) },
    );
    act(g, { type: 'endTurn' });
    return g;
  }

  it('2 Life (boundary): draws 1 card, then the trash of 1 card from the hand is asked', () => {
    const g = endOfTurn(2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC10.c3, SC10.c7].sort());
    pickCards(g, [SC10.c3]);
    expect(hand(g)).toEqual([SC10.c7]);
    expect(trash(g)).toEqual([SC10.c3]);
    expect(deck(g)).toHaveLength(3);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('3 Life: nothing happens at the end of the turn', () => {
    const g = endOfTurn(3);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC10.c3]);
    expect(deck(g)).toHaveLength(4);
  });

  it('0 Life counts as "2 or less"', () => {
    const g = endOfTurn(0);
    need(g, 'choose', 'p1');
  });

  it('the card just drawn may be the one trashed', () => {
    const g = endOfTurn(1);
    pickCards(g, [SC10.c7]);
    expect(hand(g)).toEqual([SC10.c3]);
    expect(trash(g)).toEqual([SC10.c7]);
  });

  it('with an empty hand the drawn card is the only one that can be trashed', () => {
    const g = endOfTurn(2, []);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC10.c7]);
    expect(mayDone(g)).toBe(false);
    pickCards(g, [SC10.c7]);
    expect(hand(g)).toEqual([]);
  });

  it('it is mandatory: no "you may" question is asked and the trash is not "up to"', () => {
    const g = endOfTurn(2);
    expect(kind(g)).toBe('choose');
    expect(mayDone(g)).toBe(false);
    void none;
  });

  it("only at the end of MY turn: at the end of the opponent's turn nothing is drawn", () => {
    const g = endOfTurn(3);
    // p2 ends their turn with the opponent (p1) holding 4 Life; Kid must not fire on it.
    const handBefore = hand(g);
    act(g, { type: 'endTurn' });
    expect(hand(g).length).toBeGreaterThanOrEqual(handBefore.length);
    expect(kind(g)).toBe('main');
  });

  it('Kid must be on the field: with no Kid the same position does nothing', () => {
    const g = mine(
      LD10.neutral,
      { hand: [SC10.c3], deck: [SC10.c7, BLUE, BLUE, BLUE] },
      { life: fill(RED, 1) },
    );
    act(g, { type: 'endTurn' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC10.c3]);
  });
});
