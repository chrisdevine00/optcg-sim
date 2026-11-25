/**
 * OP09-059 Murder at the Steam Bath (Event, Blue, cost 2, {Buggy Pirates}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +3000 power during this battle.
 * Then, trash up to 2 cards from your hand. Trash the same number of cards from the top of your deck
 * as you did from your hand.
 * [Trigger] Draw 1 card."
 *
 * Rules: CR 10-2-4 ([Counter]), CR 8-4-4 ("up to"); an "up to" pick over the hidden hand is asked even
 * when it cannot be filled (max 0); a short deck trashes what it has.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  askedEmpty,
  atMain,
  BLUE,
  C9,
  canCounterNow,
  chars,
  choices,
  counterSpot,
  deck,
  don,
  endCounter,
  hand,
  hitLeader,
  kind,
  L9,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  reachablePickSets,
  theirs,
  trash,
  useEvent,
  winner,
} from './kit-op09d.ts';

const ID = 'OP09-059';
const TOP = [C9.c5, C9.c6, C9.c7];

function spot(o: { hand?: string[]; deck?: string[]; mine?: string[]; active?: number } = {}) {
  return counterSpot(L9.neutral, {
    hand: [ID, ...(o.hand ?? [C9.c2, C9.c3])],
    characters: o.mine ?? [],
    deck: o.deck ?? [...TOP, ...Array(9).fill(BLUE)],
    costArea: { active: o.active ?? 2, rested: 0 },
  });
}

/** Use the Event on the Leader and arrive at the "trash up to 2 from hand" pick. */
function toTrashPick(g: ReturnType<typeof spot>) {
  useEvent(g, ID);
  need(g, 'choose', 'p1');
  pickInst(g, [g.leader('p1')]);
  need(g, 'choose', 'p1');
}

describe('OP09-059 Murder at the Steam Bath: [Counter] +3000 this battle, then trash up to 2 from hand and as many from the deck top', () => {
  it('printed effect: Leader +3000 (8000) beats the 6000 attacker; 2 hand cards trashed, then the top 2 deck cards', () => {
    const g = spot();
    toTrashPick(g);
    expect(g.power(g.leader('p1'))).toBe(8000);
    pickCards(g, [C9.c2, C9.c3]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, C9.c2, C9.c3, C9.c5, C9.c6].sort());
    expect(deck(g)).toHaveLength(10);
    expect(deck(g)[0]).toBe(C9.c7);
    endCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
  });

  it('trashing exactly 1 from hand trashes exactly 1 from the deck top', () => {
    const g = spot();
    toTrashPick(g);
    pickCards(g, [C9.c3]);
    expect(hand(g)).toEqual([C9.c2]);
    expect(trash(g)).toEqual([ID, C9.c3, C9.c5].sort());
    expect(deck(g)).toHaveLength(11);
    expect(deck(g)[0]).toBe(C9.c6);
  });

  it('trashing 0 cards trashes 0 from the deck', () => {
    const g = spot();
    toTrashPick(g);
    none(g);
    expect(hand(g)).toEqual([C9.c2, C9.c3].sort());
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(12);
  });

  it('"up to 2": with 3 cards in hand at most 2 can be trashed', () => {
    const g = spot({ hand: [C9.c2, C9.c3, C9.c4] });
    toTrashPick(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('the hand cards are offered (all of them, this Event is no longer in the hand)', () => {
    const g = spot({ hand: [C9.c2, C9.c3] });
    toTrashPick(g);
    expect(offeredIds(g).every((c) => c === C9.c2 || c === C9.c3)).toBe(true);
    expect(offeredIds(g)).not.toContain(ID);
  });

  it('an empty hand: nothing can be trashed from the hand, so nothing is trashed from the deck either', () => {
    // The hand size is public, so the engine may skip the empty "up to 2" pick or ask it empty
    // (this pick has no filter, so it is not the hidden-card case): both are accepted.
    const g = spot({ hand: [] });
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    if (kind(g) === 'choose') askedEmpty(g);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(12);
    expect(kind(g)).toBe('counter');
  });

  it('a short deck: with 1 card left in the deck and 2 trashed from hand, the deck is emptied (CR 9-2-1-2: that player loses)', () => {
    const g = spot({ deck: [C9.c5] });
    toTrashPick(g);
    pickCards(g, [C9.c2, C9.c3]);
    expect(deck(g)).toHaveLength(0);
    expect(trash(g)).toEqual([ID, C9.c2, C9.c3, C9.c5].sort());
    expect(winner(g)).toBe('p2');
  });

  it('the boost can go to a Character, and it lasts only for the battle', () => {
    const g = spot({ mine: [C9.c2] });
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    pickInst(g, [g.find('p1', 'characters', C9.c2)]);
    expect(g.power(g.find('p1', 'characters', C9.c2))).toBe(7000);
    none(g);
    endCounter(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.find('p1', 'characters', C9.c2))).toBe(4000);
    expect(chars(g)).toEqual([C9.c2]);
  });

  it('it costs 2 DON!!: with 1 active DON!! it cannot be used', () => {
    const g = spot({ active: 1 });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });
});

describe('OP09-059 [Trigger] draw 1 card', () => {
  function hit() {
    const g = theirs(L9.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [C9.c4, C9.c5, ...Array(10).fill(BLUE)],
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('activating draws exactly 1 card and trashes the Event (no hand or deck cards are trashed)', () => {
    const g = hit();
    activateTrigger(g);
    expect(hand(g)).toEqual([C9.c4]);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(11);
  });

  it('declining puts the Event into my hand', () => {
    const g = hit();
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
  });
});
