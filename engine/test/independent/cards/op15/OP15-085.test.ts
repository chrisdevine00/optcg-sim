/**
 * OP15-085 Tony Tony.Chopper (Character, Black, cost 2, 2000, Counter +1000, {Animal}/{Straw Hat Crew}).
 *
 * Card text:
 *   "[On Play] Trash 3 cards from the top of your deck.
 *    [Activate: Main] You may trash this Character: If your Leader has the {Straw Hat Crew} type, add up
 *    to 1 {Straw Hat Crew} type Character card other than [Tony Tony.Chopper] from your trash to your hand."
 *
 * Rules relied on: CR 8-3-1 (cost before the colon, "you may" cost is optional), CR 8-1-3 / RD 122
 * (the condition after the colon gates the effect, the cost is paid anyway), RL-15 (trash is not
 * a K.O.), "up to" may choose nothing (CR 8-4-4-1), [Activate: Main] has no summoning sickness.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canUse,
  chars,
  deck,
  deckTop,
  hand,
  LD15,
  mayChooseNone,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  pickCards,
  playIt,
  reachablePickSets,
  SC15,
  skipChoice,
  trash,
  useAbility,
  anyOrder,
} from './kit-op15c.ts';

const CH = 'OP15-085';

/** Trash holds: Sanji (SHC 1), the other Chopper (SHC, named Chopper), Zoro (SHC 6), Marco (no SHC). */
const TRASH = [SC15.shc1, SC15.chopper4, SC15.shc6, SC15.red3];

function ready(leader: string = LD15.shc, trashCards: string[] = TRASH) {
  const g = mine(leader, { characters: [CH], trash: trashCards });
  useAbility(g, at(g, 'p1', 'characters', CH));
  return g;
}

describe('OP15-085 Tony Tony.Chopper [On Play]', () => {
  it('trashes exactly the top 3 cards of the deck, whatever the Leader', () => {
    const top = [SC15.red2, SC15.red3, SC15.red4];
    const g = mine(LD15.neutral, { hand: [CH], deck: deckTop(top) });
    playIt(g, CH);
    anyOrder(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([...top].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('is not optional and does not need a condition', () => {
    const g = mine(LD15.shc, { hand: [CH] });
    playIt(g, CH);
    expect(trash(g)).toHaveLength(3);
  });
});

describe('OP15-085 Tony Tony.Chopper [Activate: Main]', () => {
  it('is offered on the turn it was played (no summoning sickness for Activate: Main)', () => {
    const g = mine(LD15.shc, { hand: [CH], trash: TRASH });
    playIt(g, CH);
    anyOrder(g);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', CH))).toHaveLength(1);
  });

  it('the cost is paid on activation: Chopper is in the trash (not K.O.’d) while the target is chosen', () => {
    const g = ready();
    need(g, 'choose', 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toContain(CH);
    expect(canUse(g)).toBe(false);
  });

  it('the offered cards are only {Straw Hat Crew} Characters other than [Tony Tony.Chopper]', () => {
    const g = ready();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.shc1, SC15.shc6].sort());
  });

  it('adds the chosen card to hand; Chopper itself stays in the trash', () => {
    const g = ready();
    pickCards(g, [SC15.shc6]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC15.shc6]);
    expect(trash(g).sort()).toEqual([CH, SC15.shc1, SC15.chopper4, SC15.red3].sort());
    expect(chars(g)).toEqual([]);
  });

  it('"up to 1": at most one card can be added even when two qualify', () => {
    const g = ready();
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    expect(sets.has(SC15.shc1)).toBe(true);
    expect(sets.has(SC15.shc6)).toBe(true);
  });

  it('"up to 1": choosing nothing still pays the cost (Chopper is trashed, nothing added)', () => {
    const g = ready();
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toContain(CH);
    expect(chars(g)).toEqual([]);
  });

  it('without a {Straw Hat Crew} Leader the cost is paid but nothing is added', () => {
    const g = ready(LD15.neutral);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toContain(CH);
    expect(chars(g)).toEqual([]);
  });

  it('with no other {Straw Hat Crew} Character in the trash nothing is added and nothing hangs', () => {
    const g = ready(LD15.shc, [SC15.chopper4, SC15.red3]);
    if (g.legal().some((a) => a.type === 'done')) skipChoice(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toContain(CH);
  });
});
