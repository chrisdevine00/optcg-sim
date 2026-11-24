/**
 * OP15-045 Sai (Character, Blue, cost 5, 6000, Counter +1000, {Happosui Army}/{Dressrosa},
 * [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may trash 1 Event from your hand: Draw 2 cards."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-3-1 (an exact-N cost from the hidden hand is offered even
 * when unpayable, with accept illegal), CR 8-1-2 ("you may"), draws are exactly 2.
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers } from './kit-op15a.ts';
import {
  at,
  deck,
  hand,
  kw,
  LD15,
  mine,
  need,
  no,
  offeredIds,
  payHand,
  playRaw,
  S15,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op15a.ts';

const SAI = 'OP15-045';
const EVENT = S15.event; // ST01-014 Guard Point
const EVENT2 = 'OP15-019'; // Barrier Bulls, another Event

function board(handCards: string[]) {
  return mine(LD15.luffy, { hand: [SAI, ...handCards] });
}

describe('OP15-045 Sai: [Blocker]', () => {
  it('has [Blocker] and blocks an attack on my Leader', () => {
    const g = theirs(LD15.luffy, { characters: [SAI] }, { characters: [SCN.c3] });
    expect(kw(g, at(g, 'p1', 'characters', SAI))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', SAI)]);
  });
});

describe('OP15-045 Sai: [On Play] you may trash 1 Event from hand: draw 2', () => {
  it('trashing an Event draws exactly 2 cards', () => {
    const g = board([EVENT, SCN.c2]);
    const before = deck(g).length;
    playRaw(g, SAI);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHand(g, [EVENT]);
    need(g, 'main', 'p1');
    expect(trash(g)).toEqual([EVENT]);
    expect(hand(g)).toHaveLength(3);
    expect(hand(g)).toContain(SCN.c2);
    expect(deck(g)).toHaveLength(before - 2);
  });

  it('only Events can pay it: a Character in hand is not offered', () => {
    const g = board([EVENT, SCN.c2]);
    playRaw(g, SAI);
    yes(g, 'p1');
    expect(offeredIds(g)).toEqual([EVENT]);
  });

  it('with no Event in hand (only Characters) the cost cannot be paid: nothing is drawn', () => {
    const g = board([SCN.c2, SCN.c3]);
    const before = deck(g).length;
    playRaw(g, SAI);
    unusable(g, 'p1');
    need(g, 'main', 'p1');
    expect(hand(g).sort()).toEqual([SCN.c2, SCN.c3].sort());
    expect(deck(g)).toHaveLength(before);
    expect(trash(g)).toEqual([]);
  });

  it('declining ("may") keeps the Event and draws nothing', () => {
    const g = board([EVENT]);
    const before = deck(g).length;
    playRaw(g, SAI);
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual([EVENT]);
    expect(deck(g)).toHaveLength(before);
  });

  it('only 1 Event is trashed even with two Events in hand, and the draw is still 2', () => {
    const g = board([EVENT, EVENT2]);
    const before = deck(g).length;
    playRaw(g, SAI);
    yes(g, 'p1');
    expect(offeredIds(g)).toEqual([EVENT, EVENT2].sort());
    payHand(g, [EVENT2]);
    expect(trash(g)).toEqual([EVENT2]);
    expect(hand(g)).toHaveLength(3);
    expect(deck(g)).toHaveLength(before - 2);
  });

  it('the cost is paid before drawing: with an empty deck beside the Event I still draw what exists', () => {
    const g = mine(LD15.luffy, { hand: [SAI, EVENT], deck: [SCN.c1, SCN.c2, SCN.c3] });
    playRaw(g, SAI);
    yes(g, 'p1');
    payHand(g, [EVENT]);
    expect(hand(g)).toHaveLength(2);
    expect(deck(g)).toHaveLength(1);
  });
});
