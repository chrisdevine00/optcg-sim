/**
 * OP18-103 Jabra (Yellow Character, cost 6, 8000, no Counter, {CP9}).
 *
 * Card text: "[On K.O.] Add up to 1 card from the top of your deck to the top of your Life cards.
 *             Then, trash up to 1 card from the top of your opponent's Life cards.
 *             [Trigger] If your Leader's type includes "CP", draw 1 card and place up to 1
 *             Character with a cost of 8 or less at the bottom of the owner's deck."
 *
 * Reading: the two halves are separate "up to 1" steps (each asked as a yes/no), the first adds
 * the deck card face-down; the second trashes from the opponent's Life (no [Trigger], not damage).
 * Scenery: OP12-005 Shiki (cost 8, 10000, the K.O. attacker), OP02-007 Thatch (cost 6), OP01-070
 * Mihawk (cost 9); OP03-076 CP Leader; ST01-001.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  cardIds,
  decline,
  need,
  offeredIds,
  passBlock,
  pickCards,
  yes,
  LDR,
  CH,
} from './kit-e.ts';
import { LE, theirsE, triggerHit, X } from './kit-e.ts';

const J = 'OP18-103';
const MISS = 'OP02-060';
const C8 = 'OP12-005';
const C9 = 'OP01-070';
const TOP = X.cp4;

function jabraFalls(p1: object = {}, p2: object = {}) {
  const g = theirsE(
    LDR.luffy,
    { characters: [{ card: J, rested: true }], deck: [TOP, MISS, MISS, MISS, MISS], ...p1 },
    { characters: [C8], life: [CH.thatch6, MISS, MISS, MISS], ...p2 },
  );
  attack(g, at(g, 'p2', 'characters', C8), at(g, 'p1', 'characters', J));
  passBlock(g);
  act(g, { type: 'endCounter' });
  return g;
}

describe('OP18-103 Jabra: [On K.O.] add the top card of your deck to your Life, then trash the top card of the opponent’s Life', () => {
  it('both halves: my Life +1 (the former deck top, on top of Life), the opponent’s Life -1 (trashed)', () => {
    const g = jabraFalls();
    yes(g, 'p1');
    yes(g, 'p1');
    expect(g.zone('p1', 'life')).toHaveLength(5);
    expect(g.zone('p1', 'life')[0]!.card).toBe(TOP);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(4);
    expect(g.life('p2')).toBe(3);
    expect(cardIds(g, 'p2', 'trash')).toEqual([CH.thatch6]);
    expect(cardIds(g, 'p2', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([J]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('declining the first part still allows the second ("Then")', () => {
    const g = jabraFalls();
    decline(g);
    yes(g, 'p1');
    expect(g.zone('p1', 'life')).toHaveLength(4);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(5);
    expect(g.life('p2')).toBe(3);
  });

  it('declining the second part keeps the opponent’s Life', () => {
    const g = jabraFalls();
    yes(g, 'p1');
    decline(g);
    expect(g.zone('p1', 'life')).toHaveLength(5);
    expect(g.life('p2')).toBe(4);
  });

  it('declining both changes nothing', () => {
    const g = jabraFalls();
    decline(g);
    decline(g);
    expect(g.zone('p1', 'life')).toHaveLength(4);
    expect(g.life('p2')).toBe(4);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('the trashed Life card’s [Trigger] does not activate and the card does not go to hand', () => {
    const g = jabraFalls({}, { life: ['OP18-094', MISS, MISS, MISS] });
    yes(g, 'p1');
    yes(g, 'p1');
    expect(cardIds(g, 'p2', 'trash')).toEqual(['OP18-094']);
    expect(cardIds(g, 'p2', 'hand')).toEqual([]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('with an opponent who has no Life, the second part has nothing to trash', () => {
    const g = jabraFalls({}, { life: [] });
    yes(g, 'p1');
    if (!atMain(g, 'p2')) decline(g);
    expect(g.life('p2')).toBe(0);
    expect(g.zone('p1', 'life')).toHaveLength(5);
  });

  void need;
});

describe('OP18-103 Jabra: [Trigger] if your Leader’s type includes "CP", draw 1 and place up to 1 Character cost <= 8 at the bottom of its owner’s deck', () => {
  it('CP Leader: draws, then offers cost <= 8 Characters of either player (8 in, 9 out)', () => {
    const g = triggerHit(
      J,
      LE.cp,
      { characters: [C9], deck: [TOP, MISS, MISS, MISS, MISS, MISS] },
      { characters: [C8] },
    );
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([TOP]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C8]);
    pickCards(g, [C8]);
    const d = cardIds(g, 'p2', 'deck');
    expect(d[d.length - 1]).toBe(C8);
  });

  it('non-CP Leader: nothing happens', () => {
    const g = triggerHit(J, LDR.luffy, { deck: [TOP, MISS, MISS, MISS] }, { characters: [C8] });
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([C8]);
  });
});
