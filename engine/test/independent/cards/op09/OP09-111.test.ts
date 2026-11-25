/**
 * OP09-111 Brook (Character, Yellow, cost 5, 6000, Counter +1000, {Straw Hat Crew}/{Egghead},
 * Slash).
 *
 * Card text: "[Trigger] If your Leader has the "Egghead" type and your opponent has 6 or more cards in
 * their hand, your opponent trashes 2 cards from their hand."
 *
 * Rules: both conditions must hold; the hand size is public (CR 3-1-4). "Your opponent trashes"
 * means the opponent chooses the cards (E-Q5). Exactly 2 are trashed however large the hand is. The
 * [Trigger] card is trashed after it resolves (CR 10-1-5-3), whether or not the condition held.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  atMain,
  decision,
  hand,
  LD9,
  mine,
  need,
  offeredIds,
  pickCards,
  SC9,
  trash,
  triggerGame,
} from './kit-op09c.ts';

const BROOK = 'OP09-111';
const P2 = [SC9.c1, SC9.c2, SC9.c3, SC9.c4, SC9.c5, SC9.c6, SC9.c7];

function game(o: { leader?: string; p2hand?: string[] } = {}) {
  return triggerGame(BROOK, {
    leader: o.leader ?? LD9.egghead,
    before: 4,
    p2: { hand: o.p2hand ?? P2.slice(0, 6) },
  });
}

describe('OP09-111 Brook: [Trigger] Egghead Leader and opponent with 6+ cards in hand: they trash 2', () => {
  it('printed values: cost 5, 6000, Counter +1000, no keyword', () => {
    const g = mine(LD9.egghead, { characters: [BROOK] }, {});
    const c = g.zone('p1', 'characters')[0]!;
    expect(c.cost).toBe(5);
    expect(c.power).toBe(6000);
    expect(c.counter).toBe(1000);
    expect(c.keywords).toEqual([]);
  });

  it('with exactly 6 cards in their hand the opponent must trash 2, and they choose which', () => {
    const g = game();
    activateTrigger(g);
    need(g, 'choose', 'p2');
    expect(decision(g)?.player).toBe('p2');
    pickCards(g, [SC9.c2, SC9.c5]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g, 'p2')).toEqual([SC9.c1, SC9.c3, SC9.c4, SC9.c6].sort());
    expect(trash(g, 'p2')).toEqual([SC9.c2, SC9.c5].sort());
  });

  it("the opponent's pick offers cards of their own hand", () => {
    const g = game();
    activateTrigger(g);
    need(g, 'choose', 'p2');
    for (const c of offeredIds(g)) expect(P2.slice(0, 6)).toContain(c);
  });

  it('boundary: with 5 cards in their hand nothing is trashed', () => {
    const g = game({ p2hand: P2.slice(0, 5) });
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('with 7 cards in their hand exactly 2 are still trashed', () => {
    const g = game({ p2hand: P2 });
    activateTrigger(g);
    need(g, 'choose', 'p2');
    pickCards(g, [SC9.c1, SC9.c2]);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(trash(g, 'p2')).toHaveLength(2);
  });

  it('it is mandatory: the opponent cannot choose fewer than 2', () => {
    const g = game();
    activateTrigger(g);
    need(g, 'choose', 'p2');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('a Leader without {Egghead}: nothing is trashed even with a full opposing hand', () => {
    const g = game({ leader: LD9.luffy, p2hand: P2 });
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g, 'p2')).toHaveLength(7);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('the {Egghead} type is what counts: a second {Egghead} Leader (EB04-001) works too', () => {
    const g = game({ leader: LD9.bonney });
    activateTrigger(g);
    need(g, 'choose', 'p2');
  });

  it('the activated Brook is trashed afterwards, also when the condition failed', () => {
    const ok = game();
    activateTrigger(ok);
    pickCards(ok, [SC9.c1, SC9.c2]);
    expect(trash(ok)).toEqual([BROOK]);
    const no = game({ p2hand: P2.slice(0, 3) });
    activateTrigger(no);
    expect(trash(no)).toEqual([BROOK]);
    expect(no.zone('p1', 'characters')).toHaveLength(0);
  });

  it('declining the [Trigger]: Brook goes to my hand and the opponent trashes nothing', () => {
    const g = game();
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toContain(BROOK);
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('my own hand is never trashed by it', () => {
    const g = triggerGame(BROOK, {
      leader: LD9.egghead,
      hand: [SC9.c8, SC9.c7],
      p2: { hand: P2 },
    });
    activateTrigger(g);
    pickCards(g, [SC9.c1, SC9.c2]);
    expect(hand(g)).toEqual([SC9.c7, SC9.c8].sort());
    expect(trash(g)).toEqual([BROOK]);
  });
});
