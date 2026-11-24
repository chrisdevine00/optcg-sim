/**
 * OP12-100 Sabo (Character, Yellow, cost 5, 6000, Counter +1000, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "If you have 3 or less Life cards, this Character gains [Blocker] and +3 cost.
 * [On Play] You may add 1 card from the top of your Life cards to your hand: Draw 2 cards and trash 1
 * card from your hand."
 *
 * Rules: CR 8-3-1-4 ("you may" cost), a Life card added to the hand by an effect does not activate its
 * [Trigger] (CR 10-1-5 only applies to damage), the effect is "draw, then trash", so a drawn card can be
 * the one trashed. The static condition is read continuously (paying the Life cost can switch it on).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  blockers,
  canFinish,
  deck,
  hand,
  kind,
  lifeCards,
  LDR,
  mine,
  need,
  no,
  offeredIds,
  pickCards,
  playRaw,
  theirs,
  SCN,
  topDeck,
  trash,
  unusable,
  yes,
} from './kit-op12c.ts';

const ID = 'OP12-100';

function withLife(n: number) {
  const life = Array.from({ length: n }, () => SCN.c1);
  return mine(LDR.neutral, { characters: [ID], life });
}

function played(life: string[], handCards: string[] = [SCN.c2]) {
  const g = mine(LDR.neutral, {
    hand: [ID, ...handCards],
    life,
    deck: topDeck([SCN.c6, SCN.c7]),
  });
  playRaw(g, ID);
  return g;
}

describe('OP12-100 Sabo: [Blocker] and +3 cost with 3 or less Life cards', () => {
  it('boundary: 3 Life cards: [Blocker] and cost 8', () => {
    const g = withLife(3);
    const c = g.card(at(g, 'p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(8);
  });

  it('boundary: 4 Life cards: no [Blocker], printed cost 5', () => {
    const g = withLife(4);
    const c = g.card(at(g, 'p1', 'characters', ID));
    expect(c.keywords).not.toContain('Blocker');
    expect(c.cost).toBe(5);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
  });

  it('with 0 Life cards the condition holds too ("3 or less")', () => {
    const g = withLife(0);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('with 1 Life card it holds', () => {
    const g = withLife(1);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
  });
});

describe('OP12-100 Sabo: [On Play] may add 1 Life card to hand: draw 2, trash 1', () => {
  it('accepting: the top Life card goes to my hand, then 2 are drawn, then 1 card of the hand is trashed', () => {
    const g = played([SCN.c3, SCN.c4, SCN.c5, SCN.c1]);
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c2, SCN.c3, SCN.c6, SCN.c7].sort());
    expect(canFinish(g)).toBe(false);
    pickCards(g, [SCN.c2]);
    expect(hand(g)).toEqual([SCN.c3, SCN.c6, SCN.c7].sort());
    expect(trash(g)).toEqual([SCN.c2]);
    expect(lifeCards(g)).toEqual([SCN.c4, SCN.c5, SCN.c1]);
    expect(deck(g)).toHaveLength(10);
    expect(atMain(g)).toBe(true);
  });

  it('paying the Life cost can switch the static ability on: 4 -> 3 Life gives [Blocker] and cost 8', () => {
    const g = played([SCN.c3, SCN.c4, SCN.c5, SCN.c1]);
    yes(g);
    pickCards(g, [SCN.c2]);
    const c = g.card(at(g, 'p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(8);
  });

  it('"you may": declining adds no Life card, draws nothing, trashes nothing', () => {
    const g = played([SCN.c3, SCN.c4, SCN.c5, SCN.c1]);
    need(g, 'optional', 'p1');
    no(g);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(deck(g)).toHaveLength(12);
    expect(atMain(g)).toBe(true);
  });

  it('with no Life card the cost cannot be paid', () => {
    const g = played([]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c2]);
  });

  it('the Life card taken as the cost is added to the hand without activating its [Trigger]', () => {
    const g = played(['OP01-104', SCN.c4, SCN.c5, SCN.c1]);
    yes(g);
    if (kind(g) === 'trigger')
      throw new Error('a [Trigger] was offered for a Life card moved by an effect');
    pickCards(g, [SCN.c2]);
    expect(hand(g)).toContain('OP01-104');
    expect(kind(g)).toBe('main');
  });

  it('exactly one card is trashed, not "up to": with a hand of 4 after the draw only 1 goes', () => {
    const g = played([SCN.c3, SCN.c4, SCN.c5, SCN.c1], [SCN.c2, SCN.c8]);
    yes(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c8]);
    expect(trash(g)).toEqual([SCN.c8]);
    expect(hand(g)).toHaveLength(4);
  });

  it('the Life card just added may itself be the card trashed', () => {
    const g = played([SCN.c3, SCN.c4, SCN.c5, SCN.c1]);
    yes(g);
    pickCards(g, [SCN.c3]);
    expect(trash(g)).toEqual([SCN.c3]);
    expect(hand(g)).toEqual([SCN.c2, SCN.c6, SCN.c7].sort());
  });

  it('with 3 Life cards Sabo can block an attack on my Leader', () => {
    const g = theirs(
      LDR.neutral,
      { characters: [ID], life: [SCN.c1, SCN.c1, SCN.c1] },
      { characters: [SCN.c3] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('with 4 Life cards he cannot', () => {
    const g = theirs(LDR.neutral, { characters: [ID] }, { characters: [SCN.c3] });
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });
});
