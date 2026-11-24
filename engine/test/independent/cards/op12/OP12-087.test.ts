/**
 * OP12-087 Nico Robin (Character, Black, cost 6, 7000, no Counter, {Straw Hat Crew}).
 *
 * Card text: "If your Leader is [Koala] or [Monkey.D.Luffy], this Character gains [Blocker] and +3 cost.
 * [On Play] You may trash 1 card from your hand: If your opponent has 5 or more cards in their hand,
 * your opponent trashes 2 cards from their hand."
 *
 * Rules: a Leader "is [X]" by card name, CR 8-3-1-4 ("you may" cost: paying is optional, and once paid
 * the effect resolves as far as it can), the opponent chooses which cards of their own hand to trash.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  blockers,
  decision,
  hand,
  LDR,
  mine,
  need,
  no,
  offeredIds,
  passBlock,
  payHand,
  pickCards,
  playRaw,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op12c.ts';

const ID = 'OP12-087';
const OPP5 = [SCN.c1, SCN.c2, SCN.c3, SCN.c4, SCN.c5];

function played(leader: string, mineHand: string[] = [SCN.c7], oppHand: string[] = OPP5) {
  const g = mine(leader, { hand: [ID, ...mineHand] }, { hand: oppHand });
  playRaw(g, ID);
  return g;
}

describe('OP12-087 Nico Robin: [Blocker] and +3 cost when the Leader is [Koala] or [Monkey.D.Luffy]', () => {
  it('Leader [Koala]: [Blocker] and cost 9', () => {
    const g = mine(LDR.koala, { characters: [ID] });
    const c = g.card(at(g, 'p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(9);
  });

  it('Leader [Monkey.D.Luffy]: [Blocker] and cost 9', () => {
    const g = mine(LDR.luffy, { characters: [ID] });
    const c = g.card(at(g, 'p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(9);
  });

  it('another Leader named [Monkey.D.Luffy] (OP05-060) also qualifies: the condition is the name', () => {
    const g = mine('OP05-060', { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('any other Leader (even a Revolutionary Army one, Dragon): no [Blocker], printed cost 6', () => {
    const g = mine(LDR.ra, { characters: [ID] });
    const c = g.card(at(g, 'p1', 'characters', ID));
    expect(c.keywords).not.toContain('Blocker');
    expect(c.cost).toBe(6);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(7000);
  });

  it('with the right Leader it blocks an attack on my Leader', () => {
    const g = theirs(LDR.koala, { characters: [ID] }, { characters: [SCN.c3] });
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    passBlock(g);
  });

  it('with the wrong Leader it cannot block', () => {
    const g = theirs(LDR.neutral, { characters: [ID] }, { characters: [SCN.c3] });
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });
});

describe('OP12-087 Nico Robin: [On Play] may trash 1: if the opponent has 5+ cards, they trash 2', () => {
  it('pay 1 card with the opponent on 5: the opponent trashes 2 cards they choose', () => {
    const g = played(LDR.koala);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SCN.c7]);
    need(g, 'choose', 'p2');
    // The engine lists only picks that can start a canonical 2-card selection, so the last card of five is not listed first.
    for (const c of offeredIds(g)) expect(OPP5).toContain(c);
    expect(offeredIds(g).length).toBeGreaterThanOrEqual(4);
    pickCards(g, [SCN.c2, SCN.c5]);
    expect(trash(g, 'p1')).toEqual([SCN.c7]);
    expect(trash(g, 'p2')).toEqual([SCN.c2, SCN.c5].sort());
    expect(hand(g, 'p2')).toHaveLength(3);
    expect(atMain(g)).toBe(true);
  });

  it('boundary: the opponent has 4 cards: the cost is paid but the opponent trashes nothing', () => {
    const g = played(LDR.koala, [SCN.c7], OPP5.slice(0, 4));
    yes(g);
    payHand(g, [SCN.c7]);
    expect(decision(g)?.player).toBe('p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('"you may": declining pays nothing and the opponent trashes nothing', () => {
    const g = played(LDR.koala);
    no(g);
    expect(hand(g, 'p1')).toEqual([SCN.c7]);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(atMain(g)).toBe(true);
  });

  it('the cost cannot be paid with an empty hand (nothing else in my hand)', () => {
    const g = played(LDR.koala, []);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g, 'p2')).toHaveLength(5);
  });

  it('the effect does not depend on my Leader: it works with any Leader (Dragon)', () => {
    const g = played(LDR.ra);
    yes(g);
    payHand(g, [SCN.c7]);
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c1, SCN.c2]);
    expect(hand(g, 'p2')).toHaveLength(3);
  });

  it('the opponent trashes exactly 2, not more, with 7 cards in hand', () => {
    const g = played(LDR.koala, [SCN.c7], [...OPP5, SCN.c6, SCN.c8]);
    yes(g);
    payHand(g, [SCN.c7]);
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c1, SCN.c2]);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(atMain(g)).toBe(true);
  });
});
