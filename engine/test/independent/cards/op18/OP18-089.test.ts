/**
 * OP18-089 Dorry (Black Character, cost 4, 5000, Counter +2000, {Giant}/{Elbaph}/{Giant Pirates}).
 *
 * Card text: "This Character gains +12 cost.
 *             [On Play] You may trash 1 card from your hand: Your opponent trashes 1 card from their hand."
 *
 * Reading: the trash is a cost (optional, paid from the hand left after Dorry is played); the
 * opponent chooses which card they trash; with an empty opposing hand the cost can still be paid.
 * Scenery: OP01-012 Sai, OP02-060 Mohji, OP01-023 Marco as hand fodder.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  cardIds,
  decline,
  kind,
  need,
  payHand,
  pickCards,
  play,
  unusable,
  yes,
  LDR,
  CH,
} from './kit-e.ts';
import { mineE, X } from './kit-e.ts';

const D = X.dorry;
const SAI = 'OP01-012';
const MOHJI = 'OP02-060';
const MARCO = CH.marco3;

function playDorry(p1: object = {}, p2: object = {}) {
  const g = mineE(
    LDR.luffy,
    { hand: [D, SAI, MOHJI], costArea: { active: 4, rested: 0 }, ...p1 },
    { hand: [MARCO, CH.kingdew5, CH.thatch6], ...p2 },
  );
  play(g, at(g, 'p1', 'hand', D));
  return g;
}

describe('OP18-089 Dorry: +12 cost', () => {
  it('plays for the printed 4 DON!! from hand and is cost 16 on the field', () => {
    const g = playDorry();
    decline(g);
    expect(g.card(at(g, 'p1', 'characters', D)).cost).toBe(16);
    expect(g.card(at(g, 'p1', 'characters', D)).rested).toBe(false);
  });
});

describe('OP18-089 Dorry: [On Play] you may trash 1 card from your hand: your opponent trashes 1 card from their hand', () => {
  it('pay with a hand card: the opponent chooses and trashes one of theirs', () => {
    const g = playDorry();
    yes(g, 'p1');
    payHand(g, [SAI]);
    need(g, 'choose', 'p2');
    pickCards(g, [CH.kingdew5]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([SAI]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([CH.kingdew5]);
    expect(cardIds(g, 'p2', 'hand').sort()).toEqual([MARCO, CH.thatch6].sort());
    expect(cardIds(g, 'p1', 'hand')).toEqual([MOHJI]);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('the opponent decides which card goes (any of their hand cards can be chosen)', () => {
    const g = playDorry();
    yes(g, 'p1');
    payHand(g, [MOHJI]);
    need(g, 'choose', 'p2');
    pickCards(g, [CH.thatch6]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([CH.thatch6]);
  });

  it('declining the cost trashes nothing on either side', () => {
    const g = playDorry();
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([]);
    expect(cardIds(g, 'p2', 'hand')).toHaveLength(3);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('exactly 1 card is trashed from the opponent even with a large hand', () => {
    const g = playDorry({}, { hand: [MARCO, CH.kingdew5, CH.thatch6, SAI, MOHJI] });
    yes(g, 'p1');
    payHand(g, [SAI]);
    pickCards(g, [MARCO]);
    expect(cardIds(g, 'p2', 'hand')).toHaveLength(4);
    expect(cardIds(g, 'p2', 'trash')).toHaveLength(1);
  });

  it('the cost can be paid with the opponent’s hand empty; only the cost happens', () => {
    const g = playDorry({}, { hand: [] });
    yes(g, 'p1');
    payHand(g, [SAI]);
    if (kind(g) === 'choose') pickCards(g, []);
    expect(cardIds(g, 'p1', 'trash')).toEqual([SAI]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('with no card left in hand after Dorry is played, the cost cannot be paid and the effect does nothing', () => {
    const g = mineE(
      LDR.luffy,
      { hand: [D], costArea: { active: 4, rested: 0 } },
      { hand: [MARCO, CH.kingdew5] },
    );
    play(g, at(g, 'p1', 'hand', D));
    unusable(g, 'p1');
    expect(cardIds(g, 'p2', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
    expect(atMain(g, 'p1')).toBe(true);
  });
});
