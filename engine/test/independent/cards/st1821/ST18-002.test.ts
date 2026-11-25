/**
 * ST18-002 O-Nami (Purple Character, cost 4, 2000, Counter +1000, {Straw Hat Crew}, [Blocker]).
 * "[On Play] If you have 8 or more DON!! cards on your field, trash 1 card from your hand and
 * draw 2 cards."
 * Rules: the trash is not optional ("you may" is absent); the condition counts all DON!! on the
 * field; the trash happens before the draw, so a drawn card cannot be the one trashed.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  atMain,
  cost,
  deck,
  hand,
  kind,
  LD,
  many,
  mine,
  need,
  offeredIds,
  pickInst,
  playId,
  SC,
  theirs,
  trash,
  blockers,
  attack,
  choices,
  BLUE,
  inst,
} from './kit-st1821a.ts';

const ID = 'ST18-002';
const TOP = [SC.c2, SC.c3, ...many(BLUE, 8)];

/** A single candidate may be asked or decided by the engine; answer it if asked. */
function forcedTrash(g: ReturnType<typeof start>) {
  if (kind(g) === 'choose') pickInst(g, choices(g));
}

function start(active: number, handRest: string[], extra: Partial<PlayerSpec> = {}) {
  return mine(LD.shanks, { hand: [ID, ...handRest], deck: TOP, ...cost(active), ...extra });
}

describe('ST18-002 O-Nami: [On Play] with 8+ DON!! trash 1 card from hand and draw 2', () => {
  it('offers exactly the other cards of my hand to trash; the pick is trashed', () => {
    const g = start(8, [SC.c4, SC.c5]);
    playId(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c4, SC.c5].sort());
    pickInst(g, [inst(g, 'p1', 'hand', SC.c4)]);
    expect(trash(g)).toEqual([SC.c4]);
  });

  it('then draws exactly 2: the top two cards of the deck join the hand', () => {
    const g = start(10, [SC.c4, SC.c5]);
    playId(g, ID);
    pickInst(g, [inst(g, 'p1', 'hand', SC.c4)]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC.c5, SC.c2, SC.c3].sort());
    expect(deck(g)).toHaveLength(8);
  });

  it('the trash comes before the draw: a card drawn by this effect is never offered for the trash', () => {
    const g = start(10, [SC.c4]);
    playId(g, ID);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([SC.c4]);
      pickInst(g, [inst(g, 'p1', 'hand', SC.c4)]);
    }
    expect(trash(g)).toEqual([SC.c4]);
    expect(hand(g)).toEqual([SC.c2, SC.c3].sort());
  });

  it('with only 7 DON!! on the field nothing is trashed or drawn and no prompt appears', () => {
    const g = start(7, [SC.c4]);
    playId(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC.c4]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
  });

  it('the DON!! rested to pay the cost still count (8 in all, 4 of them rested)', () => {
    const g = start(8, [SC.c4]);
    playId(g, ID);
    forcedTrash(g);
    expect(trash(g)).toEqual([SC.c4]);
    expect(hand(g)).toEqual([SC.c2, SC.c3].sort());
  });

  it('DON!! given to a Character count too (6 in the cost area + 2 given)', () => {
    const g = mine(LD.shanks, {
      hand: [ID, SC.c4],
      deck: TOP,
      characters: [{ card: SC.c3, don: 2 }],
      ...cost(6),
    });
    playId(g, ID);
    forcedTrash(g);
    expect(trash(g)).toEqual([SC.c4]);
    expect(hand(g)).toHaveLength(2);
  });

  it('the trash is not optional: no yes/no question is asked and it cannot be declined', () => {
    const g = start(10, [SC.c4, SC.c5]);
    playId(g, ID);
    expect(kind(g)).toBe('choose');
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('exactly 1 card is trashed, not 2', () => {
    const g = start(10, [SC.c4, SC.c5, SC.c6]);
    playId(g, ID);
    pickInst(g, [inst(g, 'p1', 'hand', SC.c5)]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SC.c5]);
    expect(hand(g)).toHaveLength(4);
  });

  it('[Blocker]: on the opponent turn it can be declared as a blocker, resting it', () => {
    const g = theirs(LD.shanks, { characters: [ID], life: many(BLUE, 4) });
    const nami = inst(g, 'p1', 'characters', ID);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([nami]);
    act(g, { type: 'block', blocker: nami });
    expect(g.card(nami).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });
});
